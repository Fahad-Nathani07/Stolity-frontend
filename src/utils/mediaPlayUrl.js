import { buildFileStreamUrl } from "./fileStream";

/**
 * Presigned Spaces GET for image / video / audio / PDF iframe preview.
 * Falls back to getFileDefault (proxy) if download-file-url fails.
 */

const urlCache = new Map();

/** null = unknown, false = Spaces JS fetch blocked by CORS */
let spacesObjectFetchWorks = null;

function cacheKey(filePath, sharedName, inline) {
  return `${String(filePath || "")}|${String(sharedName || "")}|${
    inline ? "inline" : "attach"
  }`;
}

function normalizeApiBase(apiUrl) {
  return String(apiUrl || "").replace(/\/+$/, "");
}

/**
 * @param {object} opts
 * @param {string} opts.apiUrl
 * @param {string} opts.token
 * @param {string} opts.filePath
 * @param {boolean} [opts.shared]
 * @param {string} [opts.sharedName]
 * @param {boolean} [opts.inline] - Content-Disposition: inline (PDF iframe)
 * @param {AbortSignal} [opts.signal]
 * @returns {Promise<string>} Spaces signed URL or proxy getFileDefault URL
 */
export async function resolveMediaPlayUrl({
  apiUrl,
  token,
  filePath,
  shared = false,
  sharedName = "",
  inline = false,
  signal,
}) {
  const path = String(filePath || "");
  if (!path) throw new Error("filePath required");

  const sharedParam = shared && sharedName ? String(sharedName) : "";
  const key = cacheKey(path, sharedParam, inline);
  const hit = urlCache.get(key);
  if (hit && hit.expiresAt > Date.now() + 60_000) {
    return hit.url;
  }

  const proxyFallback = () =>
    buildFileStreamUrl(apiUrl, token, path, {
      shared: Boolean(sharedParam),
      sharedName: sharedParam,
    });

  try {
    const params = new URLSearchParams({ filePath: path });
    if (sharedParam) params.set("shared", sharedParam);
    if (inline) params.set("inline", "1");

    const base = normalizeApiBase(apiUrl);
    const res = await fetch(`${base}/download-file-url?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    });

    if (!res.ok) {
      throw new Error(`download-file-url ${res.status}`);
    }

    const data = await res.json();
    if (!data?.url) throw new Error("download-file-url missing url");

    const expiresIn = Number(data.expiresIn) || 3600;
    urlCache.set(key, {
      url: data.url,
      expiresAt: Date.now() + expiresIn * 1000,
    });
    return data.url;
  } catch (err) {
    if (err?.name === "AbortError") throw err;
    console.warn(
      "[media] Presigned play URL failed; using getFileDefault proxy.",
      err?.message || err
    );
    return proxyFallback();
  }
}

export function clearMediaPlayUrlCache() {
  urlCache.clear();
}

export function getSpacesObjectFetchWorks() {
  return spacesObjectFetchWorks;
}

export function setSpacesObjectFetchWorks(value) {
  spacesObjectFetchWorks = value;
}
