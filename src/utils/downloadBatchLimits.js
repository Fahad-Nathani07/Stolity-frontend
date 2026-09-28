import { estimateDownloadBytes } from "./downloadWithProgress";

/** Download batch gates: count + average size + hard size cap. */

export const DOWNLOAD_SOFT_WARN_MIN = 100;
export const DOWNLOAD_ZIP_CHECK_MIN = 1000;
/** Avg below this with many files → recommend ZIP (1000 files → need ≥ ~1000 MB). */
export const DOWNLOAD_AVG_SMALL_FILE_MAX_BYTES = 1024 * 1024;
export const DOWNLOAD_HARD_SIZE_BYTES = 2 * 1024 * 1024 * 1024;

export const DOWNLOAD_BATCH_CONTINUE = "continue";
export const DOWNLOAD_BATCH_CANCEL = "cancel";
export const DOWNLOAD_BATCH_ZIP_AND_DOWNLOAD = "zip-and-download";

export function formatDownloadBytes(bytes) {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * @returns {{ level: 'none'|'soft'|'zip-recommend'|'size-limit', count: number, totalBytes: number, avgBytes: number }}
 */
export function evaluateDownloadBatchLimits({ count = 0, totalBytes = 0 } = {}) {
  const safeCount = Math.max(0, Number(count) || 0);
  const safeBytes = Math.max(0, Number(totalBytes) || 0);
  const avgBytes = safeCount > 0 ? safeBytes / safeCount : 0;

  if (safeBytes > DOWNLOAD_HARD_SIZE_BYTES) {
    return {
      level: "size-limit",
      count: safeCount,
      totalBytes: safeBytes,
      avgBytes,
    };
  }

  if (safeCount < DOWNLOAD_SOFT_WARN_MIN) {
    return {
      level: "none",
      count: safeCount,
      totalBytes: safeBytes,
      avgBytes,
    };
  }

  if (
    safeCount >= DOWNLOAD_ZIP_CHECK_MIN &&
    avgBytes < DOWNLOAD_AVG_SMALL_FILE_MAX_BYTES
  ) {
    return {
      level: "zip-recommend",
      count: safeCount,
      totalBytes: safeBytes,
      avgBytes,
    };
  }

  return {
    level: "soft",
    count: safeCount,
    totalBytes: safeBytes,
    avgBytes,
  };
}

export function sumListingSizes(fileNames, filedata) {
  const list = Array.isArray(fileNames) ? fileNames : [];
  const data = Array.isArray(filedata) ? filedata : [];
  return list.reduce((acc, name) => {
    const row = data.find((f) => f?.fileName === name);
    return acc + (estimateDownloadBytes(row) || 0);
  }, 0);
}

/** List folder files for gate stats (same API as no-zip download). */
export async function fetchFolderDownloadStats({
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

  const res = await fetch(
    `${apiUrl}download-folder-entries?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    }
  );

  if (!res.ok) {
    let message = "Failed to inspect folder for download";
    try {
      const err = await res.json();
      if (err?.error) message = err.error;
    } catch (_) {}
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }

  const data = await res.json();
  const files = Array.isArray(data.files) ? data.files : [];
  const totalFromApi = Number(data.totalBytes);
  const totalBytes =
    Number.isFinite(totalFromApi) && totalFromApi > 0
      ? totalFromApi
      : files.reduce((acc, f) => acc + (Number(f?.size) || 0), 0);

  return {
    count: files.length,
    totalBytes,
    folderName: data.folderName || null,
  };
}

/**
 * Build gate input for a selection.
 * Single folder → fetch entry stats (accurate count/size).
 * Files only → listing sizes.
 * Mixed / multi-folder → best-effort from listing (no Zip and download).
 */
export async function resolveDownloadSelectionForGate({
  apiUrl,
  token,
  shared,
  fileKeys = [],
  folderKeys = [],
  filedata = [],
  signal,
}) {
  const files = Array.isArray(fileKeys) ? fileKeys : [];
  const folders = Array.isArray(folderKeys) ? folderKeys : [];

  if (folders.length === 1 && files.length === 0) {
    const folderPath = folders[0];
    const stats = await fetchFolderDownloadStats({
      apiUrl,
      token,
      filePath: folderPath,
      shared,
      signal,
    });
    return {
      source: "folder",
      canZipAndDownload: true,
      folderPath,
      count: stats.count,
      totalBytes: stats.totalBytes,
    };
  }

  if (folders.length === 0) {
    return {
      source: "files",
      canZipAndDownload: false,
      folderPath: null,
      count: files.length,
      totalBytes: sumListingSizes(files, filedata),
    };
  }

  // Mixed or multiple folders — size from listing; count is selection units only
  const totalBytes =
    sumListingSizes(files, filedata) + sumListingSizes(folders, filedata);
  return {
    source: "mixed",
    canZipAndDownload: false,
    folderPath: null,
    count: files.length + folders.length,
    totalBytes,
  };
}
