import {
  streamDownloadResponse,
  isDownloadCancelledError,
  DISK_STREAM_THRESHOLD_BYTES,
  triggerNativeUrlDownload,
} from "./downloadWithProgress";

/** Small files: a few at once. Large files: only 1 (fetch + save). */
const MULTI_DOWNLOAD_CONCURRENCY = 3;
const LARGE_DOWNLOAD_CONCURRENCY = 1;
const DIRECT_FETCH_MAX_ATTEMPTS = 2;

/**
 * null = not tried yet, true = fetch(signedUrl) works,
 * false = CORS blocked — skip straight to /download-file proxy.
 */
let storageFetchWorks = null;

/** Limits how many large downloads run at once (includes the storage fetch). */
let largeInFlight = 0;
const largeWaiters = [];

function notifyLargeWaiters() {
  while (largeWaiters.length && largeInFlight < LARGE_DOWNLOAD_CONCURRENCY) {
    const next = largeWaiters.shift();
    next?.();
  }
}

async function acquireLargeSlot(signal) {
  if (largeInFlight < LARGE_DOWNLOAD_CONCURRENCY) {
    largeInFlight += 1;
    return;
  }
  await new Promise((resolve, reject) => {
    const tryAcquire = () => {
      if (signal?.aborted) {
        reject(new DOMException("Aborted", "AbortError"));
        return;
      }
      if (largeInFlight < LARGE_DOWNLOAD_CONCURRENCY) {
        largeInFlight += 1;
        resolve();
        return;
      }
      largeWaiters.push(tryAcquire);
    };
    largeWaiters.push(tryAcquire);
    if (signal) {
      const onAbort = () => {
        const idx = largeWaiters.indexOf(tryAcquire);
        if (idx >= 0) largeWaiters.splice(idx, 1);
        reject(new DOMException("Aborted", "AbortError"));
      };
      if (signal.aborted) {
        onAbort();
        return;
      }
      signal.addEventListener("abort", onAbort, { once: true });
    }
  });
}

function releaseLargeSlot() {
  largeInFlight = Math.max(0, largeInFlight - 1);
  notifyLargeWaiters();
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestDownloadFileUrl({
  apiUrl,
  token,
  filePath,
  shared,
  signal,
}) {
  const params = new URLSearchParams({
    filePath: String(filePath || ""),
  });
  if (shared) params.set("shared", shared);

  const res = await fetch(`${apiUrl}download-file-url?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });

  if (!res.ok) {
    const err = new Error(`Download URL failed (${res.status})`);
    err.status = res.status;
    throw err;
  }

  const data = await res.json();
  if (!data?.url) {
    throw new Error("Download URL missing from response");
  }
  return data;
}

async function fetchPresignedObject(url, signal) {
  const res = await fetch(url, {
    method: "GET",
    mode: "cors",
    credentials: "omit",
    signal,
  });
  if (!res.ok) {
    const err = new Error(`Presigned download failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return res;
}

async function fetchViaProxy({ apiUrl, token, filePath, shared, signal }) {
  const params = new URLSearchParams({
    filePath: String(filePath || ""),
  });
  if (shared) params.set("shared", shared);

  const res = await fetch(`${apiUrl}download-file?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });

  if (!res.ok) {
    throw new Error(`Proxy download failed (${res.status})`);
  }
  return res;
}

function isAbortLike(err) {
  return isDownloadCancelledError(err) || err?.name === "AbortError";
}

function errorText(err) {
  return `${err?.message || ""} ${err?.name || ""} ${err || ""}`.toLowerCase();
}

function isRetryableTransferError(err) {
  if (!err || isAbortLike(err)) return false;
  const msg = errorText(err);
  return (
    msg.includes("http2") ||
    msg.includes("protocol_error") ||
    msg.includes("protocol error") ||
    msg.includes("networkerror") ||
    msg.includes("network error") ||
    msg.includes("failed to fetch") ||
    msg.includes("load failed") ||
    msg.includes("connection") ||
    err?.name === "TypeError"
  );
}

function isLikelyCorsBlockedError(err) {
  if (!err || isAbortLike(err)) return false;
  const msg = errorText(err);
  if (msg.includes("http2") || msg.includes("protocol")) return false;
  return msg.includes("cors") || msg.includes("cross-origin");
}

function baseFileName(filePath) {
  const parts = String(filePath || "download")
    .replace(/\\/g, "/")
    .split("/")
    .filter(Boolean);
  return parts[parts.length - 1] || "download";
}

function isLargeFile(sizeBytes) {
  const n = Number(sizeBytes) || 0;
  // Unknown size: treat as large so we never run several GB streams in parallel.
  if (n <= 0) return true;
  return n >= DISK_STREAM_THRESHOLD_BYTES;
}

function uniqueFileName(desired, used) {
  if (!used.has(desired)) {
    used.add(desired);
    return desired;
  }
  const match = desired.match(/^(.*?)(\.[^.]+)?$/);
  const stem = match?.[1] || desired;
  const ext = match?.[2] || "";
  let i = 1;
  let next = `${stem} (${i})${ext}`;
  while (used.has(next)) {
    i += 1;
    next = `${stem} (${i})${ext}`;
  }
  used.add(next);
  return next;
}

/** Write response body into the chosen folder — no Chrome Save As dialog. */
async function writeResponseToDirectory({
  response,
  dirHandle,
  saveAsName,
  onProgress,
  signal,
}) {
  const fileHandle = await dirHandle.getFileHandle(saveAsName, {
    create: true,
  });
  const writable = await fileHandle.createWritable({
    keepExistingData: false,
  });
  await streamDownloadResponse({
    response,
    fileName: saveAsName,
    isFolder: false,
    writable,
    onProgress,
    signal,
  });
}

/**
 * Fetch file bytes (presigned first, proxy fallback) and return Response + meta.
 * Large-file slot is taken before network body work (and early when size is known/unknown-large).
 */
async function fetchFileResponse({
  apiUrl,
  token,
  filePath,
  shared,
  signal,
  estimatedBytes = null,
}) {
  let heldLargeSlot = false;
  const ensureLargeSlot = async (sizeBytes) => {
    if (heldLargeSlot) return;
    if (!isLargeFile(sizeBytes)) return;
    await acquireLargeSlot(signal);
    heldLargeSlot = true;
  };

  // Unknown estimate → treat as large so parallel workers cannot open several GB streams.
  await ensureLargeSlot(Number(estimatedBytes) || 0);

  try {
    let meta = null;
    try {
      meta = await requestDownloadFileUrl({
        apiUrl,
        token,
        filePath,
        shared,
        signal,
      });
    } catch (err) {
      if (isAbortLike(err)) throw err;
      const sizeBytes = Number(estimatedBytes) || 0;
      await ensureLargeSlot(sizeBytes);
      const response = await fetchViaProxy({
        apiUrl,
        token,
        filePath,
        shared,
        signal,
      });
      return {
        response,
        fileName: baseFileName(filePath),
        sizeBytes,
        mode: "proxy",
        heldLargeSlot,
      };
    }

    let name = meta.fileName || baseFileName(filePath);
    let sizeBytes = Number(meta.size) || Number(estimatedBytes) || 0;
    await ensureLargeSlot(sizeBytes);

    if (storageFetchWorks !== false) {
      for (let attempt = 1; attempt <= DIRECT_FETCH_MAX_ATTEMPTS; attempt += 1) {
        try {
          if (attempt > 1) {
            meta = await requestDownloadFileUrl({
              apiUrl,
              token,
              filePath,
              shared,
              signal,
            });
            name = meta.fileName || baseFileName(filePath);
            sizeBytes = Number(meta.size) || Number(estimatedBytes) || sizeBytes;
            await ensureLargeSlot(sizeBytes);
          }
          const response = await fetchPresignedObject(meta.url, signal);
          storageFetchWorks = true;
          return {
            response,
            fileName: name,
            sizeBytes,
            mode: "presigned",
            heldLargeSlot,
          };
        } catch (err) {
          if (isAbortLike(err)) throw err;
          if (
            isRetryableTransferError(err) &&
            attempt < DIRECT_FETCH_MAX_ATTEMPTS
          ) {
            console.warn(
              `[download] Direct fetch failed (attempt ${attempt}); retrying…`,
              err?.message || err
            );
            await delay(1500 * attempt);
            continue;
          }
          if (isLikelyCorsBlockedError(err)) {
            storageFetchWorks = false;
          }
          console.warn(
            "[download] Direct storage fetch failed; using /download-file proxy.",
            err?.message || err
          );
          break;
        }
      }
    }

    const response = await fetchViaProxy({
      apiUrl,
      token,
      filePath,
      shared,
      signal,
    });
    return {
      response,
      fileName: name,
      sizeBytes,
      mode: "proxy",
      heldLargeSlot,
    };
  } catch (err) {
    if (heldLargeSlot) releaseLargeSlot();
    throw err;
  }
}

export async function pickDownloadDirectory() {
  if (typeof window.showDirectoryPicker !== "function") {
    return null;
  }
  try {
    return await window.showDirectoryPicker({ mode: "readwrite" });
  } catch (err) {
    if (isDownloadCancelledError(err)) {
      const abortErr = new DOMException(
        "User cancelled folder picker",
        "AbortError"
      );
      abortErr.cause = err;
      throw abortErr;
    }
    throw err;
  }
}

/**
 * Ask for a save folder for this download cycle (once per Download click).
 * Callers reuse the returned handle for every file in the same batch.
 */
export async function ensureSaveDirectory() {
  if (typeof window.showDirectoryPicker !== "function") {
    return null;
  }
  return pickDownloadDirectory();
}

/**
 * Native Browser Download — single file only.
 * Hands the signed URL to Chrome's download manager (low tab RAM, no real progress).
 */
export async function downloadFileNativeBrowser({
  apiUrl,
  token,
  filePath,
  shared,
  signal,
  onProgress,
}) {
  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }
  if (typeof onProgress === "function") onProgress(0);

  const meta = await requestDownloadFileUrl({
    apiUrl,
    token,
    filePath,
    shared,
    signal,
  });

  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  const name = meta.fileName || baseFileName(filePath);
  triggerNativeUrlDownload(meta.url, name);

  if (typeof onProgress === "function") onProgress(100);

  return {
    mode: "native",
    filePath,
    handedToBrowser: true,
    fileName: name,
  };
}

/**
 * Browser Direct Stream — write into a picked folder (used by multi-file / when a dirHandle is passed).
 */
export async function downloadFilePresigned({
  apiUrl,
  token,
  filePath,
  shared,
  signal,
  onProgress,
  estimatedBytes = null,
  dirHandle: existingDirHandle = null,
  saveAsName = null,
}) {
  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  let dirHandle = existingDirHandle;
  if (!dirHandle) {
    dirHandle = await ensureSaveDirectory();
  }
  if (!dirHandle) {
    throw new Error(
      "Choose a save folder (Chrome/Edge) so files can save without a Save As dialog per file."
    );
  }

  const fetched = await fetchFileResponse({
    apiUrl,
    token,
    filePath,
    shared,
    signal,
    estimatedBytes,
  });

  try {
    const name = saveAsName || fetched.fileName || baseFileName(filePath);
    await writeResponseToDirectory({
      response: fetched.response,
      dirHandle,
      saveAsName: name,
      onProgress,
      signal,
    });
    return {
      mode: fetched.mode === "proxy" ? "proxy-dir" : "presigned-dir",
      filePath,
      handedToBrowser: false,
      fileName: name,
    };
  } finally {
    if (fetched.heldLargeSlot) releaseLargeSlot();
  }
}

/**
 * Multi-file: one folder pick per cycle, then stream each file into it.
 * Large / unknown-size files run strictly one-at-a-time to limit Chrome RAM.
 */
export async function downloadMultipleFilesToDirectory({
  apiUrl,
  token,
  filePaths = [],
  shared,
  signal,
  onFileProgress,
  dirHandle: existingDirHandle = null,
  estimatedBytesByPath = null,
}) {
  const paths = (filePaths || []).filter(Boolean);
  if (!paths.length) return { mode: "empty", results: [] };

  let dirHandle = existingDirHandle;
  if (!dirHandle) {
    dirHandle = await ensureSaveDirectory();
  }
  if (!dirHandle) {
    throw new Error(
      "Choose a save folder (Chrome/Edge) so this download can save without a Save As dialog per file."
    );
  }

  const results = new Array(paths.length);
  const usedNames = new Set();
  const saveNames = paths.map((filePath) =>
    uniqueFileName(baseFileName(filePath), usedNames)
  );
  const estimates = paths.map((filePath) => {
    const fromMap = estimatedBytesByPath?.[filePath];
    return Number(fromMap) || 0;
  });
  // Any large/unknown file → one worker only (no overlapping GB streams).
  const serialize =
    estimates.some((n) => isLargeFile(n)) || !estimatedBytesByPath;
  let nextIndex = 0;
  let cancelledBatch = false;

  const worker = async () => {
    while (true) {
      if (signal?.aborted || cancelledBatch) break;
      const i = nextIndex++;
      if (i >= paths.length) return;

      const filePath = paths[i];
      const saveAsName = saveNames[i];
      const estimatedBytes = estimates[i] || null;
      try {
        await downloadFilePresigned({
          apiUrl,
          token,
          filePath,
          shared,
          signal,
          dirHandle,
          saveAsName,
          estimatedBytes,
          onProgress: (percent) => onFileProgress?.(filePath, percent),
        });
        results[i] = { filePath, success: true, cancelled: false, saveAsName };
        // Let Chrome release stream buffers before the next large file.
        if (isLargeFile(estimatedBytes)) {
          await delay(250);
        }
      } catch (err) {
        if (isDownloadCancelledError(err)) {
          cancelledBatch = true;
          results[i] = { filePath, success: false, cancelled: true };
          return;
        }
        results[i] = {
          filePath,
          success: false,
          cancelled: false,
          error: err,
        };
      }
    }
  };

  const pool = Math.min(
    serialize ? 1 : MULTI_DOWNLOAD_CONCURRENCY,
    paths.length
  );
  await Promise.all(Array.from({ length: pool }, () => worker()));

  for (let i = 0; i < paths.length; i += 1) {
    if (results[i] == null) {
      results[i] = {
        filePath: paths[i],
        success: false,
        cancelled: Boolean(signal?.aborted || cancelledBatch),
      };
    }
  }

  return { mode: "directory", results, dirHandle };
}

/**
 * Fetch one folder entry (prefer listing presigned URL, else /download-file).
 * Caller must call releaseLargeSlot() when heldLargeSlot is true (after write).
 */
export async function fetchFolderEntryResponse({
  apiUrl,
  token,
  entry,
  shared,
  signal,
}) {
  const filePath = entry?.filePath || entry?.relativePath;
  const sizeBytes = Number(entry?.size) || 0;
  let heldLargeSlot = false;

  if (isLargeFile(sizeBytes)) {
    await acquireLargeSlot(signal);
    heldLargeSlot = true;
  }

  const release = () => {
    if (!heldLargeSlot) return;
    heldLargeSlot = false;
    releaseLargeSlot();
  };

  try {
    if (entry?.url && storageFetchWorks !== false) {
      try {
        const response = await fetchPresignedObject(entry.url, signal);
        storageFetchWorks = true;
        return {
          response,
          fileName: baseFileName(filePath),
          sizeBytes,
          mode: "presigned",
          heldLargeSlot,
          releaseLargeSlot: release,
        };
      } catch (err) {
        if (isAbortLike(err)) throw err;
        if (isLikelyCorsBlockedError(err)) {
          storageFetchWorks = false;
        }
        console.warn(
          "[download] Folder entry direct fetch failed; using /download-file proxy.",
          err?.message || err
        );
      }
    }

    const response = await fetchViaProxy({
      apiUrl,
      token,
      filePath,
      shared,
      signal,
    });
    return {
      response,
      fileName: baseFileName(filePath),
      sizeBytes,
      mode: "proxy",
      heldLargeSlot,
      releaseLargeSlot: release,
    };
  } catch (err) {
    release();
    throw err;
  }
}
