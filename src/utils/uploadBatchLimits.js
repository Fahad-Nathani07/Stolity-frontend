/** Upload batch gates: file count + average size (user zips locally — no app zip API). */

import { formatSoftEta } from "./transferEta";

export const UPLOAD_SOFT_WARN_MIN = 100;
export const UPLOAD_SIZE_CHECK_MIN = 500;
/**
 * Average file size below this (with many files) → recommend local ZIP.
 * Examples:
 *   1,975 × 91.6 MB  → ~47 KB avg  → zip-recommend
 *   1,975 × 1,975 MB → ~1 MB avg   → soft warn
 */
export const UPLOAD_AVG_SMALL_FILE_MAX_BYTES = 256 * 1024;
export const UPLOAD_HARD_MAX_COUNT = 5000;

/** Keep in sync with DIRECT_UPLOAD_GAP_MS in uploadFileDirect.js */
export const UPLOAD_ETA_GAP_MS = 500;
/** Extra per-file cost beyond the sequential gap (presign / PUT setup). */
export const UPLOAD_ETA_PER_FILE_OVERHEAD_MS = 150;
/** Assumed transfer speed for size-based portion + ZIP comparison. */
export const UPLOAD_ETA_ASSUMED_BYTES_PER_SEC = 8 * 1024 * 1024;

export const UPLOAD_BATCH_CONTINUE = "continue";
export const UPLOAD_BATCH_CANCEL = "cancel";
export const UPLOAD_BATCH_ZIP_INSTEAD = "zip-instead";

export const UPLOAD_ZIP_INSTEAD_TOAST =
  "Create a ZIP on your device, then select that ZIP file to upload.";

export function formatUploadBytes(bytes) {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function fileSizeOf(entry) {
  if (!entry) return 0;
  if (typeof entry.size === "number") return entry.size;
  if (entry.file && typeof entry.file.size === "number") return entry.file.size;
  return 0;
}

/** Accepts File[], or folder entries `{ file }`, or `{ sanitizedName, file }`. */
export function summarizeUploadBatch(entries) {
  const list = Array.isArray(entries) ? entries : [];
  const count = list.length;
  const totalBytes = list.reduce((acc, item) => acc + fileSizeOf(item), 0);
  const avgBytes = count > 0 ? totalBytes / count : 0;
  return { count, totalBytes, avgBytes };
}

/**
 * Pre-upload ETA: sequential many-file path vs one ZIP upload.
 * as-is ≈ count × (gap + overhead) + totalBytes / 8 MBps
 * zip   ≈ totalBytes / 8 MBps (local zip time not included)
 */
export function estimateUploadBatchTimes({ count = 0, totalBytes = 0 } = {}) {
  const n = Math.max(0, Number(count) || 0);
  const bytes = Math.max(0, Number(totalBytes) || 0);
  const transferMs = (bytes / UPLOAD_ETA_ASSUMED_BYTES_PER_SEC) * 1000;

  const asIsMs =
    n * (UPLOAD_ETA_GAP_MS + UPLOAD_ETA_PER_FILE_OVERHEAD_MS) + transferMs;
  const asZipMs = Math.max(transferMs, 1500);

  const asIsSoft = formatSoftEta(asIsMs);
  const asZipSoft = formatSoftEta(asZipMs);

  return {
    asIsMs,
    asZipMs,
    asIsLabel: asIsSoft ? `about ${asIsSoft}` : null,
    asZipLabel: asZipSoft ? `about ${asZipSoft}` : null,
  };
}

/**
 * @returns {{ level: 'none'|'soft'|'zip-recommend'|'hard', count: number, totalBytes: number, avgBytes: number }}
 */
export function evaluateUploadBatchLimits(entries) {
  const { count, totalBytes, avgBytes } = summarizeUploadBatch(entries);

  if (count < UPLOAD_SOFT_WARN_MIN) {
    return { level: "none", count, totalBytes, avgBytes };
  }

  if (count >= UPLOAD_HARD_MAX_COUNT) {
    return { level: "hard", count, totalBytes, avgBytes };
  }

  // Many files with small average size → ZIP is faster/more reliable
  if (
    count >= UPLOAD_SIZE_CHECK_MIN &&
    avgBytes < UPLOAD_AVG_SMALL_FILE_MAX_BYTES
  ) {
    return { level: "zip-recommend", count, totalBytes, avgBytes };
  }

  // 100+ files (or many larger files) → soft warn only
  return { level: "soft", count, totalBytes, avgBytes };
}
