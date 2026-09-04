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
 * Ask user for a save path BEFORE fetch starts (folders / large files).
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
 * @param {object} opts
 * @param {Response} opts.response
 * @param {string} opts.fileName
 * @param {boolean} [opts.isFolder]
 * @param {FileSystemWritableFileStream|null} [opts.writable] pass from createDownloadWritable
 * @param {(percent: number, loaded: number, total: number|null) => void} [opts.onProgress]
 */
export async function streamDownloadResponse({
  response,
  fileName,
  isFolder = false,
  writable: existingWritable = null,
  onProgress,
}) {
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

  let writable = existingWritable;
  let streamedToDisk = Boolean(writable);

  // Folders must go to disk — in-memory Blob dies around ~300MB
  if (isFolder && !writable) {
    if (typeof window.showSaveFilePicker !== "function") {
      throw new Error(
        "Large folder download needs Chrome/Edge (save-file dialog)."
      );
    }
    writable = await createDownloadWritable({ fileName, isFolder: true });
    streamedToDisk = true;
  }

  const reader = response.body.getReader();
  const chunks = streamedToDisk ? null : [];
  let loaded = 0;
  // Batch disk writes (~1MB) — fewer await round-trips
  const WRITE_BATCH = 1024 * 1024;
  let pending = [];
  let pendingSize = 0;

  const flushPending = async () => {
    if (!writable || pendingSize === 0) return;
    const merged =
      pending.length === 1
        ? pending[0]
        : (() => {
            const out = new Uint8Array(pendingSize);
            let offset = 0;
            for (const part of pending) {
              out.set(part, offset);
              offset += part.byteLength || part.length;
            }
            return out;
          })();
    pending = [];
    pendingSize = 0;
    await writable.write(merged);
  };

  const report = (percent) => {
    if (typeof onProgress === "function") {
      onProgress(percent, loaded, totalBytes);
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      loaded += value.byteLength || value.length || 0;

      if (writable) {
        pending.push(value);
        pendingSize += value.byteLength || value.length || 0;
        if (pendingSize >= WRITE_BATCH) {
          await flushPending();
        }
      } else {
        chunks.push(value);
      }

      report(progressFromBytes(loaded, totalBytes));
    }

    if (writable) {
      await flushPending();
      await writable.close();
      writable = null;
    } else {
      triggerBlobDownload(new Blob(chunks, { type: mime }), downloadName);
    }

    report(100);
    return { loaded, totalBytes, streamedToDisk };
  } catch (err) {
    try {
      if (writable) await writable.abort();
    } catch (_) {}
    throw err;
  }
}
