/**
 * Download helpers: stream to disk only for folder zips (save dialog).
 * Single files never use showSaveFilePicker — browser default download / Blob.
 */

/** Soft tip for when Blob buffering may use a lot of RAM (native path preferred). */
export const DISK_STREAM_THRESHOLD_BYTES = 32 * 1024 * 1024; // 32 MB

function resolveDownloadName(fileName, isFolder) {
  const safeFileName = String(fileName || "download").replace(/^\/+/, "");
  if (isFolder) {
    return /\.zip$/i.test(safeFileName) ? safeFileName : `${safeFileName}.zip`;
  }
  return safeFileName;
}

function resolveTotalBytes(response) {
  const contentLength = response.headers.get("content-length");
  if (contentLength) {
    const n = parseInt(contentLength, 10);
    if (Number.isFinite(n) && n > 0) return n;
  }
  const estimated = response.headers.get("x-estimated-content-length");
  if (estimated) {
    const n = parseInt(estimated, 10);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

function progressFromBytes(loaded, totalBytes) {
  if (totalBytes && totalBytes > 0) {
    const scaled = Math.round((loaded / totalBytes) * 98);
    return Math.min(99, Math.max(0, scaled));
  }
  return Math.min(95, Math.floor(loaded / (5 * 1024 * 1024)));
}

/** Min gap between UI progress callbacks during streaming (ms). */
export const PROGRESS_THROTTLE_MS = 200;

/**
 * Throttle + skip unchanged whole-percent updates.
 * Always emits 100 via `.end()`.
 */
export function createThrottledProgress(
  onProgress,
  { intervalMs = PROGRESS_THROTTLE_MS } = {}
) {
  if (typeof onProgress !== "function") {
    return {
      report() {},
      end() {},
    };
  }

  let lastTs = 0;
  let lastPct = -1;

  const emit = (pct, loaded, totalBytes) => {
    lastTs = Date.now();
    lastPct = pct;
    onProgress(pct, loaded, totalBytes);
  };

  return {
    report(percent, loaded, totalBytes) {
      const pct = Math.min(100, Math.max(0, Math.round(Number(percent) || 0)));
      if (pct >= 100) return; // use end()
      if (pct === lastPct) return;
      const now = Date.now();
      if (now - lastTs < intervalMs) return;
      emit(pct, loaded, totalBytes);
    },
    end(loaded, totalBytes) {
      emit(100, loaded, totalBytes);
    },
  };
}

function triggerBlobDownload(blob, downloadName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = downloadName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Public: save a Blob/File via the browser Downloads folder. */
export function saveBlobToDownloads(blob, fileName, { revokeAfterMs = 60000 } = {}) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = resolveDownloadName(fileName, false);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Keep blob URL alive — large OPFS/File downloads need time to start.
  window.setTimeout(() => {
    try {
      URL.revokeObjectURL(url);
    } catch (_) {}
  }, Math.max(0, Number(revokeAfterMs) || 0));
}

/**
 * Browser-native download (default Downloads folder).
 * Cross-origin Spaces/S3 ignores <a download> and would navigate the page,
 * so we load the signed URL in a hidden iframe — no target=_blank tab flash.
 * Filename comes from Content-Disposition on the signed URL.
 */
export function triggerNativeUrlDownload(url, fileName) {
  if (!url) throw new Error("Missing download URL");
  void fileName;

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.tabIndex = -1;
  iframe.style.cssText =
    "position:fixed;left:0;top:0;width:0;height:0;border:0;opacity:0;pointer-events:none;";
  iframe.src = url;
  document.body.appendChild(iframe);

  window.setTimeout(() => {
    try {
      iframe.remove();
    } catch (_) {}
  }, 120000);
}

/** Parse listing sizes like "1.5 GB" / raw byte numbers into bytes. */
export function estimateDownloadBytes(fileOrSize) {
  if (fileOrSize == null) return null;
  if (typeof fileOrSize === "number" && Number.isFinite(fileOrSize)) {
    return fileOrSize > 0 ? fileOrSize : null;
  }
  if (typeof fileOrSize === "object") {
    const raw = fileOrSize.sizeInBytes ?? fileOrSize.size;
    if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) return raw;
    return estimateDownloadBytes(fileOrSize.fileSize);
  }
  const str = String(fileOrSize).trim();
  if (!str) return null;
  if (/^\d+$/.test(str)) {
    const n = Number(str);
    return n > 0 ? n : null;
  }
  const match = str.match(/^([\d.]+)\s*(B|KB|MB|GB|TB)?$/i);
  if (!match) return null;
  const value = parseFloat(match[1]);
  if (!Number.isFinite(value) || value <= 0) return null;
  const unit = (match[2] || "B").toUpperCase();
  const mult =
    unit === "TB"
      ? 1024 ** 4
      : unit === "GB"
        ? 1024 ** 3
        : unit === "MB"
          ? 1024 ** 2
          : unit === "KB"
            ? 1024
            : 1;
  return Math.round(value * mult);
}

/** Save-file picker only for folder zip downloads. */
export function shouldStreamDownloadToDisk({ isFolder = false } = {}) {
  return Boolean(isFolder);
}

/** User dismissed the native save / folder picker, or aborted the transfer. */
export function isDownloadCancelledError(error) {
  if (!error) return false;
  if (error.name === "AbortError") return true;
  if (error.name === "NotAllowedError") return true;
  const msg = String(error.message || "").toLowerCase();
  return (
    msg.includes("aborted") ||
    msg.includes("user aborted") ||
    msg.includes("user cancelled") ||
    msg.includes("user canceled") ||
    msg.includes("the user aborted")
  );
}

export function scheduleDownloadRemoval(
  removeDownload,
  downloadId,
  { delayMs = 0 } = {}
) {
  if (typeof removeDownload !== "function" || downloadId == null) return;
  if (delayMs > 0) {
    window.setTimeout(() => removeDownload(downloadId), delayMs);
  } else {
    removeDownload(downloadId);
  }
}

/**
 * One toast for a multi-file download batch (avoids N "cancelled" toasts).
 * Already-saved files count as completed even if the user hits Cancel all after.
 * Native browser handoff (single file) cannot confirm finish — say "started" instead.
 */
export function toastBatchDownloadSummary(showToast, counts = {}) {
  if (typeof showToast !== "function") return;
  const succeeded = Number(counts.succeeded) || 0;
  const cancelled = Number(counts.cancelled) || 0;
  const failed = Number(counts.failed) || 0;
  const total =
    Number(counts.total) || succeeded + cancelled + failed;
  const nativeHandedOff = Boolean(counts.nativeHandedOff);

  if (total <= 0) return;

  if (cancelled > 0 && succeeded === 0 && failed === 0) {
    showToast(
      "info",
      cancelled === 1
        ? "Download cancelled."
        : `Cancelled ${cancelled} downloads.`
    );
    return;
  }

  if (cancelled === 0 && failed === 0) {
    if (nativeHandedOff && total === 1) {
      showToast("info", NATIVE_BROWSER_DOWNLOAD_TOAST);
      return;
    }
    showToast(
      "success",
      total === 1 ? "Download complete." : "All downloads processed."
    );
    return;
  }

  const parts = [];
  if (succeeded > 0) {
    parts.push(
      succeeded === 1
        ? nativeHandedOff
          ? "1 started in browser"
          : "1 downloaded"
        : `${succeeded} downloaded`
    );
  }
  if (cancelled > 0) {
    parts.push(
      cancelled === 1 ? "1 cancelled" : `${cancelled} cancelled`
    );
  }
  if (failed > 0) {
    parts.push(failed === 1 ? "1 failed" : `${failed} failed`);
  }
  showToast(failed > 0 ? "error" : "info", `${parts.join(", ")}.`);
}

export const NATIVE_BROWSER_DOWNLOAD_TOAST =
  "File download started successfully.";


/**
 * Ask user for a save path (folder zip only).
 * Returns a FileSystemWritableFileStream or null.
 */
export async function createDownloadWritable({ fileName, isFolder = false }) {
  if (typeof window.showSaveFilePicker !== "function") {
    return null;
  }

  const downloadName = resolveDownloadName(fileName, isFolder);
  try {
    const handle = await window.showSaveFilePicker({
      suggestedName: downloadName,
      types: isFolder
        ? [
            {
              description: "ZIP archive",
              accept: { "application/zip": [".zip"] },
            },
          ]
        : undefined,
    });
    return handle.createWritable();
  } catch (err) {
    if (isDownloadCancelledError(err)) {
      const abortErr = new DOMException(
        "User cancelled save dialog",
        "AbortError"
      );
      abortErr.cause = err;
      throw abortErr;
    }
    throw err;
  }
}

/**
 * Open save picker for folder zips only.
 */
export async function ensureDownloadWritable({
  fileName,
  isFolder = false,
  existingWritable = null,
  required = false,
}) {
  if (existingWritable) return existingWritable;

  const needsDisk =
    required || shouldStreamDownloadToDisk({ isFolder });
  if (!needsDisk) return null;

  if (typeof window.showSaveFilePicker !== "function") {
    throw new Error(
      "Folder download needs Chrome/Edge (save-file dialog)."
    );
  }

  const writable = await createDownloadWritable({ fileName, isFolder: true });
  if (!writable) {
    throw new Error(
      "Choose a save location to download folders (use Chrome/Edge)."
    );
  }
  return writable;
}

/** Max bytes per write() — keeps Chrome from queuing huge network chunks. */
const WRITE_CHUNK_BYTES = 1024 * 1024; // 1 MiB

/**
 * Close + reopen the writable every N bytes so Chromium flushes to disk.
 * Without this, createWritable() often stages hundreds of MB–GB in RAM and
 * the next large file in a batch can stall mid-stream under memory pressure.
 */
const FLUSH_EVERY_BYTES = 32 * 1024 * 1024; // 32 MiB

async function reopenWritableAt(fileHandle, offset) {
  const next = await fileHandle.createWritable({ keepExistingData: true });
  if (offset > 0 && typeof next.seek === "function") {
    await next.seek(offset);
  }
  return next;
}

async function pipeResponseToWritable(
  response,
  writable,
  { totalBytes, onProgress, signal, fileHandle = null }
) {
  const reader = response.body?.getReader?.();
  if (!reader) {
    throw new Error("Response body is empty");
  }

  let loaded = 0;
  let sinceFlush = 0;
  let currentWritable = writable;
  const progress = createThrottledProgress(onProgress);

  try {
    while (true) {
      if (signal?.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }
      const { done, value } = await reader.read();
      if (done) break;
      if (!value || !(value.byteLength || value.length)) continue;

      const bytes =
        value instanceof Uint8Array ? value : new Uint8Array(value);
      let offset = 0;
      while (offset < bytes.byteLength) {
        if (signal?.aborted) {
          throw new DOMException("Aborted", "AbortError");
        }
        const end = Math.min(offset + WRITE_CHUNK_BYTES, bytes.byteLength);
        const piece = bytes.subarray(offset, end);
        await currentWritable.write(piece);
        const n = piece.byteLength;
        loaded += n;
        sinceFlush += n;
        offset = end;
        progress.report(
          progressFromBytes(loaded, totalBytes),
          loaded,
          totalBytes
        );

        if (
          fileHandle &&
          sinceFlush >= FLUSH_EVERY_BYTES
        ) {
          await currentWritable.close();
          currentWritable = await reopenWritableAt(fileHandle, loaded);
          sinceFlush = 0;
          // Let Chrome reclaim staging buffers before more network data.
          await new Promise((r) => setTimeout(r, 0));
        }
      }
    }

    await currentWritable.close();
    progress.end(loaded, totalBytes);
    return loaded;
  } catch (err) {
    try {
      await reader.cancel();
    } catch (_) {}
    try {
      await currentWritable.abort();
    } catch (_) {}
    throw err;
  }
}

/**
 * @param {object} opts
 * @param {Response} opts.response
 * @param {string} opts.fileName
 * @param {boolean} [opts.isFolder] folder zip → disk (picker); files → Blob (no picker)
 * @param {FileSystemWritableFileStream|null} [opts.writable]
 * @param {FileSystemFileHandle|null} [opts.fileHandle] enables periodic disk flush (multi-GB)
 * @param {(percent: number, loaded: number, total: number|null) => void} [opts.onProgress]
 */
export async function streamDownloadResponse({
  response,
  fileName,
  isFolder = false,
  writable: existingWritable = null,
  fileHandle = null,
  onProgress,
  signal,
}) {
  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }
  if (!response?.ok) {
    throw new Error("Network response was not ok");
  }
  if (!response.body) {
    throw new Error("Response body is empty");
  }

  const totalBytes = resolveTotalBytes(response);
  const downloadName = resolveDownloadName(fileName, isFolder);
  const mime = isFolder
    ? "application/zip"
    : response.headers.get("content-type") || "application/octet-stream";

  // Folder zips only — never open a browse dialog for single files
  let writable = existingWritable;
  if (isFolder && !writable) {
    writable = await ensureDownloadWritable({
      fileName,
      isFolder: true,
      required: true,
    });
  }

  try {
    if (writable) {
      const loaded = await pipeResponseToWritable(response, writable, {
        totalBytes,
        onProgress,
        signal,
        fileHandle,
      });
      return { loaded, totalBytes, streamedToDisk: true };
    }

    const reader = response.body.getReader();
    const chunks = [];
    let loaded = 0;
    const progress = createThrottledProgress(onProgress);

    while (true) {
      if (signal?.aborted) {
        try {
          await reader.cancel();
        } catch (_) {}
        throw new DOMException("Aborted", "AbortError");
      }
      const { done, value } = await reader.read();
      if (done) break;
      if (!value || !(value.byteLength || value.length)) continue;

      loaded += value.byteLength || value.length || 0;
      chunks.push(value);
      progress.report(progressFromBytes(loaded, totalBytes), loaded, totalBytes);
    }

    if (signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }

    triggerBlobDownload(new Blob(chunks, { type: mime }), downloadName);
    // Allow GC of chunk list after Blob is built (Blob holds its own copy/refs).
    chunks.length = 0;
    progress.end(loaded, totalBytes);
    return { loaded, totalBytes, streamedToDisk: false };
  } catch (err) {
    // pipeResponseToWritable already aborts the writable on failure.
    if (!existingWritable && writable) {
      try {
        await writable.abort();
      } catch (_) {}
    }
    throw err;
  }
}
