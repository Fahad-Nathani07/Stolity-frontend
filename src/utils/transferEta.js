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

const KB = 1024;
const MB = 1024 * 1024;
const GB = 1024 * 1024 * 1024;

/** Progress size label: ≥1GB → GB, ≥1MB → MB, else KB. */
export function formatTransferBytes(bytes) {
  const n = Math.max(0, Number(bytes) || 0);
  if (n >= GB) return `${(n / GB).toFixed(2)} GB`;
  if (n >= MB) return `${(n / MB).toFixed(n >= 100 * MB ? 0 : 1)} MB`;
  return `${(n / KB).toFixed(n >= 100 * KB ? 0 : 1)} KB`;
}

/** e.g. "500 MB / 1.52 GB" — each side formatted by its own size. */
export function formatTransferProgressLabel(loadedBytes, totalBytes) {
  const total = Math.max(0, Number(totalBytes) || 0);
  if (total <= 0) return null;
  const loaded = Math.min(total, Math.max(0, Number(loadedBytes) || 0));
  return `${formatTransferBytes(loaded)} / ${formatTransferBytes(total)}`;
}

function itemSizeWeight(item, avgKnown) {
  const s = Math.max(0, Number(item?.sizeInBytes) || 0);
  return s > 0 ? s : avgKnown;
}

function resolveItemWeights(items = []) {
  const knownSizes = items
    .map((u) => Number(u.sizeInBytes) || 0)
    .filter((n) => n > 0);
  if (!knownSizes.length) return null;
  const avgKnown =
    knownSizes.reduce((acc, n) => acc + n, 0) / knownSizes.length;
  return items.map((u) => itemSizeWeight(u, avgKnown));
}

export function computeOverallProgress(items = []) {
  if (!items.length) return 0;
  const weights = resolveItemWeights(items);
  if (!weights) {
    return (
      items.reduce((acc, u) => acc + (Number(u.progress) || 0), 0) /
      items.length
    );
  }
  const totalSize = weights.reduce((acc, n) => acc + n, 0);
  if (!totalSize) return 0;
  return (
    items.reduce(
      (acc, u, i) => acc + weights[i] * (Number(u.progress) || 0),
      0
    ) / totalSize
  );
}

/** Transferred + total bytes for one row (from % × sizeInBytes). */
export function getItemByteProgress(item = {}) {
  const total = Math.max(0, Number(item.sizeInBytes) || 0);
  if (total <= 0) return { loaded: 0, total: 0 };
  const progress = Math.min(100, Math.max(0, Number(item.progress) || 0));
  return { loaded: (total * progress) / 100, total };
}

/**
 * Batch transferred / total bytes (same size weighting as overall %).
 * @returns {{ loaded: number, total: number }}
 */
export function computeBatchByteProgress(items = []) {
  if (!items.length) return { loaded: 0, total: 0 };
  const weights = resolveItemWeights(items);
  if (!weights) return { loaded: 0, total: 0 };
  const total = weights.reduce((acc, n) => acc + n, 0);
  const loaded = items.reduce((acc, u, i) => {
    const progress = Math.min(100, Math.max(0, Number(u.progress) || 0));
    return acc + (weights[i] * progress) / 100;
  }, 0);
  return { loaded, total };
}

/** Count items whose per-file progress has reached 100%. */
export function countCompletedTransfers(items = []) {
  return items.filter((u) => Math.round(Number(u.progress) || 0) >= 100).length;
}

/**
 * UI percent for batch modals — show 100% only when every file is done (e.g. 960/960).
 */
export function getDisplayOverallProgress(
  overallProgress,
  { completedCount, totalCount } = {}
) {
  const raw = Math.min(100, Math.max(0, Number(overallProgress) || 0));
  const total = Number(totalCount) || 0;
  const completed = Number(completedCount) || 0;
  if (total > 0 && completed >= total) {
    return Math.round(raw);
  }
  return Math.min(99, Math.floor(raw));
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

/** Strip progress-UI verb prefixes and return basename for the modal list. */
export function getTransferDisplayName(fileName = "") {
  const raw = String(fileName || "").trim();
  let cleaned = raw
    .replace(/^(Uploading|Downloading|Moving|Copying|Working on|Uploaded)\s+/i, "")
    .trim();
  // e.g. Processing "MyFolder" — please wait…
  const processingMatch = cleaned.match(/^Processing\s+"([^"]+)"/i);
  if (processingMatch) cleaned = processingMatch[1];
  // Paths from nested folders: show only the file/folder name in the modal.
  cleaned = cleaned.replace(/\\/g, "/").replace(/\/+$/, "");
  const slash = cleaned.lastIndexOf("/");
  if (slash >= 0) cleaned = cleaned.slice(slash + 1);
  return cleaned || raw || "File";
}
