import { streamDownloadResponse } from "./downloadWithProgress";

/**
 * GET /download-file-url — returns presigned S3 URL (requires bucket CORS on web).
 */
export async function fetchPresignedDownloadUrl({
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
    let message = "Failed to get download URL";
    try {
      const err = await res.json();
      if (err?.error) message = err.error;
    } catch (_) {}
    throw new Error(message);
  }

  return res.json();
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

/**
 * Download one file: presigned S3 URL first, fallback to /download-file proxy.
 */
export async function downloadFilePresigned({
  apiUrl,
  token,
  filePath,
  shared,
  signal,
  onProgress,
}) {
  try {
    const meta = await fetchPresignedDownloadUrl({
      apiUrl,
      token,
      filePath,
      shared,
      signal,
    });

    if (!meta?.url) {
      throw new Error("No presigned URL returned");
    }

    const response = await fetch(meta.url, { signal });
    if (!response.ok) {
      throw new Error(`Presigned download failed (${response.status})`);
    }

    await streamDownloadResponse({
      response,
      fileName: filePath,
      isFolder: false,
      onProgress,
    });
    return { mode: "presigned", ...meta };
  } catch (err) {
    if (err?.name === "AbortError") throw err;
    console.warn("Presigned download failed, falling back to proxy:", err);
  }

  const response = await fetchViaProxy({
    apiUrl,
    token,
    filePath,
    shared,
    signal,
  });

  await streamDownloadResponse({
    response,
    fileName: filePath,
    isFolder: false,
    onProgress,
  });

  return { mode: "proxy", filePath };
}

/**
 * Fetch bytes for one folder entry (presigned url from list, or refresh/fallback).
 */
export async function fetchFolderEntryResponse({
  apiUrl,
  token,
  entry,
  shared,
  signal,
}) {
  if (entry?.url) {
    try {
      const direct = await fetch(entry.url, { signal });
      if (direct.ok) return direct;
    } catch (err) {
      if (err?.name === "AbortError") throw err;
      console.warn("Presigned folder entry fetch failed:", entry.relativePath, err);
    }
  }

  try {
    const meta = await fetchPresignedDownloadUrl({
      apiUrl,
      token,
      filePath: entry.filePath || entry.relativePath,
      shared,
      signal,
    });
    if (meta?.url) {
      const refreshed = await fetch(meta.url, { signal });
      if (refreshed.ok) return refreshed;
    }
  } catch (err) {
    if (err?.name === "AbortError") throw err;
    console.warn("Refresh presigned URL failed:", entry.relativePath, err);
  }

  return fetchViaProxy({
    apiUrl,
    token,
    filePath: entry.filePath || entry.relativePath,
    shared,
    signal,
  });
}
