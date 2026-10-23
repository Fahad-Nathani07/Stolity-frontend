/**
 * Extract embedded album art (ID3 APIC) from an audio URL for the
 * currently playing track only. Failures → null (keep default icon).
 */

const artCache = new Map();
const MAX_PROBE_BYTES = 512 * 1024;
const CACHE_CAP = 40;

function cacheGet(key) {
  if (!key || !artCache.has(key)) return undefined;
  return artCache.get(key);
}

function cacheSet(key, value) {
  if (!key) return;
  if (artCache.size >= CACHE_CAP) {
    const first = artCache.keys().next().value;
    const old = artCache.get(first);
    if (old && String(old).startsWith("blob:")) {
      try {
        URL.revokeObjectURL(old);
      } catch (_) {}
    }
    artCache.delete(first);
  }
  artCache.set(key, value);
}

function synchsafeToInt(b0, b1, b2, b3) {
  return (b0 & 0x7f) * 0x200000 + (b1 & 0x7f) * 0x4000 + (b2 & 0x7f) * 0x80 + (b3 & 0x7f);
}

function frameSizeV3(b0, b1, b2, b3) {
  return (b0 << 24) + (b1 << 16) + (b2 << 8) + b3;
}

function readCString(bytes, offset, encoding) {
  if (encoding === 0 || encoding === 3) {
    let end = offset;
    while (end < bytes.length && bytes[end] !== 0) end += 1;
    const text = new TextDecoder(encoding === 3 ? "utf-8" : "latin1").decode(
      bytes.subarray(offset, end)
    );
    return { text, next: end + 1 };
  }
  // UTF-16 with BOM — skip until double NUL
  let end = offset;
  while (end + 1 < bytes.length && !(bytes[end] === 0 && bytes[end + 1] === 0)) {
    end += 2;
  }
  const text = new TextDecoder("utf-16").decode(bytes.subarray(offset, end));
  return { text, next: end + 2 };
}

function parseApicFrame(data) {
  if (!data || data.length < 4) return null;
  const encoding = data[0];
  let offset = 1;

  const mimeEnd = data.indexOf(0, offset);
  if (mimeEnd < 0) return null;
  let mime = new TextDecoder("latin1")
    .decode(data.subarray(offset, mimeEnd))
    .toLowerCase();
  if (!mime) mime = "image/jpeg";
  if (mime === "image/jpg") mime = "image/jpeg";
  if (mime === "-->" || mime.startsWith("http")) return null; // linked image
  offset = mimeEnd + 1;

  if (offset >= data.length) return null;
  offset += 1; // picture type

  const desc = readCString(data, offset, encoding);
  offset = desc.next;
  if (offset >= data.length) return null;

  const picture = data.subarray(offset);
  if (!picture.length) return null;

  const blob = new Blob([picture], { type: mime || "image/jpeg" });
  return URL.createObjectURL(blob);
}

function extractId3Cover(buffer) {
  const bytes = new Uint8Array(buffer);
  if (bytes.length < 10) return null;
  if (bytes[0] !== 0x49 || bytes[1] !== 0x44 || bytes[2] !== 0x33) {
    return null; // no ID3v2
  }

  const version = bytes[3]; // 2, 3, or 4
  const flags = bytes[5];
  const tagSize = synchsafeToInt(bytes[6], bytes[7], bytes[8], bytes[9]);
  let offset = 10;

  if (flags & 0x40) {
    // extended header
    if (offset + 4 > bytes.length) return null;
    const extSize =
      version === 4
        ? synchsafeToInt(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3])
        : frameSizeV3(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);
    offset += Math.max(4, extSize);
  }

  const tagEnd = Math.min(bytes.length, 10 + tagSize);

  while (offset + 10 <= tagEnd) {
    const id = String.fromCharCode(
      bytes[offset],
      bytes[offset + 1],
      bytes[offset + 2],
      bytes[offset + 3]
    );
    if (id === "\0\0\0\0" || !/^[\dA-Z]{4}$/.test(id)) break;

    const size =
      version === 4
        ? synchsafeToInt(
            bytes[offset + 4],
            bytes[offset + 5],
            bytes[offset + 6],
            bytes[offset + 7]
          )
        : frameSizeV3(
            bytes[offset + 4],
            bytes[offset + 5],
            bytes[offset + 6],
            bytes[offset + 7]
          );

    const frameStart = offset + 10;
    const frameEnd = frameStart + size;
    if (size <= 0 || frameEnd > bytes.length) break;

    if (id === "APIC") {
      return parseApicFrame(bytes.subarray(frameStart, frameEnd));
    }

    // ID3v2.2 PIC
    if (version === 2 && id.startsWith("PIC")) {
      // rare; skip detailed parse
    }

    offset = frameEnd;
  }

  return null;
}

/**
 * @param {string} audioUrl - playable URL (proxy or Spaces)
 * @param {string} [cacheKey] - usually file path
 * @param {AbortSignal} [signal]
 * @returns {Promise<string|null>} blob: URL or null
 */
export async function fetchAlbumArtUrl(audioUrl, cacheKey, signal) {
  const key = String(cacheKey || audioUrl || "").trim();
  const cached = cacheGet(key);
  if (cached !== undefined) return cached; // null = known miss

  if (!audioUrl) {
    cacheSet(key, null);
    return null;
  }

  try {
    let res = await fetch(audioUrl, {
      method: "GET",
      headers: { Range: `bytes=0-${MAX_PROBE_BYTES - 1}` },
      mode: "cors",
      credentials: "omit",
      signal,
      cache: "force-cache",
    });

    if (res.status === 416 || (res.status === 200 && !res.headers.get("content-range") && res.status !== 206)) {
      // Some proxies ignore Range and return 200 full body — avoid huge downloads
      const len = Number(res.headers.get("content-length") || 0);
      if (res.status === 200 && len > MAX_PROBE_BYTES * 2) {
        // Too large without Range support — abort art probe
        cacheSet(key, null);
        return null;
      }
    }

    if (!res.ok && res.status !== 206) {
      // Retry without Range (small files / proxy)
      res = await fetch(audioUrl, {
        method: "GET",
        mode: "cors",
        credentials: "omit",
        signal,
      });
      if (!res.ok) {
        cacheSet(key, null);
        return null;
      }
      const len = Number(res.headers.get("content-length") || 0);
      if (len > MAX_PROBE_BYTES * 2) {
        cacheSet(key, null);
        return null;
      }
    }

    const buf = await res.arrayBuffer();
    const slice =
      buf.byteLength > MAX_PROBE_BYTES ? buf.slice(0, MAX_PROBE_BYTES) : buf;
    const artUrl = extractId3Cover(slice);
    cacheSet(key, artUrl);
    return artUrl;
  } catch (err) {
    if (err?.name === "AbortError") throw err;
    cacheSet(key, null);
    return null;
  }
}

export function clearAlbumArtCache() {
  for (const url of artCache.values()) {
    if (url && String(url).startsWith("blob:")) {
      try {
        URL.revokeObjectURL(url);
      } catch (_) {}
    }
  }
  artCache.clear();
  batchCache.clear();
}

/** Server batch: up to 10 paths → one POST (avoids browser connection stampede). */
const BATCH_SIZE = 10;
const BATCH_DEBOUNCE_MS = 60;
/** @type {Map<string, string|null>} path → data URL or null */
const batchCache = new Map();
/** @type {Map<string, Array<{ resolve: Function, reject: Function, signal?: AbortSignal }>>} */
const pendingByPath = new Map();
/** @type {Array<{ path: string, shared: string }>} */
let queue = [];
let flushTimer = null;
let flushInFlight = false;

function batchKey(path, shared) {
  return `${shared || ""}::${path}`;
}

function scheduleFlush() {
  if (flushTimer != null) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flushBatchQueue();
  }, BATCH_DEBOUNCE_MS);
}

async function flushBatchQueue() {
  if (flushInFlight) {
    scheduleFlush();
    return;
  }
  if (queue.length === 0) return;

  flushInFlight = true;
  const slice = queue.splice(0, BATCH_SIZE);
  // Keep same shared folder for one request; leftover re-queued
  const shared = slice[0].shared || "";
  const same = [];
  const rest = [];
  for (const item of slice) {
    if ((item.shared || "") === shared) same.push(item);
    else rest.push(item);
  }
  if (rest.length) queue = rest.concat(queue);

  const paths = [...new Set(same.map((s) => s.path))];
  const token = sessionStorage.getItem("number") || "";
  // REACT_APP_API_ENDPOINT already includes /api/aws/ (e.g. http://localhost:3001/api/aws/)
  const apiUrl = (process.env.REACT_APP_API_ENDPOINT || "").replace(/\/?$/, "/");

  try {
    const res = await fetch(`${apiUrl}album-art-batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        paths,
        ...(shared ? { shared } : {}),
      }),
    });

    const data = res.ok ? await res.json().catch(() => ({})) : {};
    const byPath = new Map();
    for (const row of data.results || []) {
      if (row && row.path != null) byPath.set(row.path, row.art || null);
    }

    for (const path of paths) {
      const art = byPath.has(path) ? byPath.get(path) : null;
      const key = batchKey(path, shared);
      batchCache.set(key, art);
      const waiters = pendingByPath.get(key) || [];
      pendingByPath.delete(key);
      for (const w of waiters) {
        if (w.signal?.aborted) {
          w.reject(Object.assign(new Error("Aborted"), { name: "AbortError" }));
        } else {
          w.resolve(art);
        }
      }
    }
  } catch (_) {
    for (const path of paths) {
      const key = batchKey(path, shared);
      batchCache.set(key, null);
      const waiters = pendingByPath.get(key) || [];
      pendingByPath.delete(key);
      for (const w of waiters) {
        if (w.signal?.aborted) {
          w.reject(Object.assign(new Error("Aborted"), { name: "AbortError" }));
        } else {
          w.resolve(null);
        }
      }
    }
  } finally {
    flushInFlight = false;
    if (queue.length > 0) scheduleFlush();
  }
}

/**
 * Queue album-art lookup via POST /album-art-batch (chunks of 10).
 * @param {string} filePath - relative S3 path (file.fileName)
 * @param {{ shared?: string, signal?: AbortSignal }} [opts]
 * @returns {Promise<string|null>} data: URL or null
 */
export function fetchAlbumArtBatch(filePath, opts = {}) {
  const path = String(filePath || "").replace(/^\/+/, "").trim();
  const shared = String(opts.shared || "").trim();
  const signal = opts.signal;
  const key = batchKey(path, shared);

  if (!path) return Promise.resolve(null);

  if (batchCache.has(key)) {
    return Promise.resolve(batchCache.get(key));
  }

  if (signal?.aborted) {
    return Promise.reject(Object.assign(new Error("Aborted"), { name: "AbortError" }));
  }

  return new Promise((resolve, reject) => {
    const waiter = { resolve, reject, signal };
    const list = pendingByPath.get(key);
    if (list) {
      list.push(waiter);
    } else {
      pendingByPath.set(key, [waiter]);
      queue.push({ path, shared });
      scheduleFlush();
    }

    if (signal) {
      const onAbort = () => {
        const arr = pendingByPath.get(key);
        if (!arr) return;
        const idx = arr.indexOf(waiter);
        if (idx >= 0) arr.splice(idx, 1);
        if (arr.length === 0) {
          pendingByPath.delete(key);
          queue = queue.filter((q) => batchKey(q.path, q.shared) !== key);
        }
        reject(Object.assign(new Error("Aborted"), { name: "AbortError" }));
      };
      signal.addEventListener("abort", onAbort, { once: true });
    }
  });
}
