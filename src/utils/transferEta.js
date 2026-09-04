/**
 * Soft ETA helpers for upload/download progress modals.
 * Prefer "About 2 min" over fake precision like "2 min 5 sec".
 */

export const UPLOAD_OPERATION = "upload";
export const DOWNLOAD_OPERATION = "download";
export const MOVE_OPERATION = "move";

/** Infer batch operation from context entry (extras.operation or fileName prefix). */
export function resolveTransferOperation(item = {}) {
  if (item.operation) return String(item.operation).toLowerCase();
  const name = String(item.fileName || "").trim();
  if (/^uploading\b/i.test(name)) return UPLOAD_OPERATION;
  if (/^downloading\b/i.test(name)) return DOWNLOAD_OPERATION;
  if (/^moving\b/i.test(name)) return MOVE_OPERATION;
  if (/^copying\b/i.test(name)) return "copy";
  if (/^processing\b/i.test(name)) return "process";
  return "other";
}

/** True only when every active item is an upload (exclude move/copy/etc.). */
export function isUploadOnlyBatch(items = []) {
  if (!items.length) return false;
  return items.every((item) => resolveTransferOperation(item) === UPLOAD_OPERATION);
}

/** True only when every active item is a download. */
export function isDownloadOnlyBatch(items = []) {
  if (!items.length) return false;
  return items.every((item) => resolveTransferOperation(item) === DOWNLOAD_OPERATION);
}

export function computeOverallProgress(items = []) {
  if (!items.length) return 0;
  const hasValidSizes = items.some((u) => Number(u.sizeInBytes) > 0);
  if (hasValidSizes) {
    const totalSize = items.reduce((acc, u) => acc + (Number(u.sizeInBytes) || 0), 0);
    if (!totalSize) return 0;
    return (
      items.reduce(
        (acc, u) => acc + (Number(u.sizeInBytes) || 0) * (Number(u.progress) || 0),
        0
      ) / totalSize
    );
  }
  return items.reduce((acc, u) => acc + (Number(u.progress) || 0), 0) / items.length;
}

/**
 * Soft label for remaining milliseconds.
 * @returns {string} e.g. "a few seconds", "45 sec", "2 min", "1 hr"
 */
export function formatSoftEta(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return null;
  if (ms < 12000) return "a few seconds";
  if (ms < 60000) {
    const sec = Math.max(15, Math.round(ms / 15000) * 15); // 15s steps
    return `${sec} sec`;
  }
  if (ms < 90_000) return "1 min";
  if (ms < 3_600_000) {
    const mins = Math.round(ms / 60000);
    return mins === 1 ? "1 min" : `${mins} min`;
  }
  const hours = Math.round(ms / 3_600_000);
  return hours === 1 ? "1 hr" : `${hours} hr`;
}

/**
 * Estimate remaining time from elapsed wall time + overall progress %.
 * Returns null while still warming up.
 */
export function estimateRemainingMs({
  overallProgress,
  elapsedMs,
  minProgress = 3,
  minElapsedMs = 2000,
}) {
  const p = Number(overallProgress) || 0;
  const elapsed = Number(elapsedMs) || 0;
  if (p >= 99.5) return 0;
  if (p < minProgress || elapsed < minElapsedMs) return null;
  return (elapsed * (100 - p)) / p;
}

/**
 * Build display string: "Calculating…" | "About 2 min" | null
 */
export function buildSoftEtaLabel({
  overallProgress,
  elapsedMs,
  isPaused = false,
}) {
  if (isPaused) return "Paused";
  const remaining = estimateRemainingMs({ overallProgress, elapsedMs });
  if (remaining === null) return "Calculating…";
  if (remaining === 0) return null;
  const soft = formatSoftEta(remaining);
  return soft ? `About ${soft}` : null;
}

/** Strip progress-UI verb prefixes so icons resolve from the real name. */
export function getTransferDisplayName(fileName = "") {
  const raw = String(fileName || "").trim();
  let cleaned = raw
    .replace(/^(Uploading|Downloading|Moving|Copying|Working on|Uploaded)\s+/i, "")
    .trim();
  // e.g. Processing "MyFolder" — please wait…
  const processingMatch = cleaned.match(/^Processing\s+"([^"]+)"/i);
  if (processingMatch) cleaned = processingMatch[1];
  return cleaned || raw || "File";
}
