/**
 * No-zip folder download:
 * 1) Slim list from download-folder-entries (paths + sizes + relativePath only)
 * 2) Per file: same as multi-download (/download-file-url → stream/Range)
 * 3) Write under one picked folder, keeping nested structure
 * 4) 2+ files: one activity batch (start + finish), not per-file /status
 */

import {
  ensureSaveDirectory,
  downloadFilePresigned,
} from "./downloadFilePresigned";
import {
  isDownloadCancelledError,
  DISK_STREAM_THRESHOLD_BYTES,
  mergeAbortSignals,
} from "./downloadWithProgress";
import {
  startActivityBatch,
  finishActivityBatch,
  resolveBatchStatus,
} from "./activityBatch";

const ENTRY_CONCURRENCY = 1;
/** Gap after every file (align with multi-download). */
const FILE_GAP_MS = 700;
/** Extra pause after large files. */
const LARGE_FILE_GAP_MS = 1500;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isLargeFile(sizeBytes) {
  const n = Number(sizeBytes) || 0;
  if (n <= 0) return true;
  return n >= DISK_STREAM_THRESHOLD_BYTES;
}

function baseName(path) {
  const parts = String(path || "folder")
    .replace(/\\/g, "/")
    .replace(/\/+$/, "")
    .split("/")
    .filter(Boolean);
  return parts[parts.length - 1] || "folder";
}

function uniqueDirName(desired, used) {
  const raw = String(desired || "folder").trim() || "folder";
  if (!used.has(raw)) {
    used.add(raw);
    return raw;
  }
  let i = 1;
  let next = `${raw} (${i})`;
  while (used.has(next)) {
    i += 1;
    next = `${raw} (${i})`;
  }
  used.add(next);
  return next;
}

/** Resolve parent directory handle + leaf file name for a nested relative path. */
async function resolveNestedSaveTarget(rootDirHandle, relativePath) {
  const parts = String(relativePath || "")
    .replace(/\\/g, "/")
    .split("/")
    .filter(Boolean);
  if (!parts.length) {
    throw new Error("Invalid file path in folder download");
  }
  const saveAsName = parts.pop();
  let dir = rootDirHandle;
  for (const part of parts) {
    dir = await dir.getDirectoryHandle(part, { create: true });
  }
  return { dirHandle: dir, saveAsName };
}

/**
 * Download one remote folder into a local directory handle (or pick once).
 * Creates `{saveAsFolderName||folderName}/…` with nested structure intact.
 */
export async function downloadFolderNoZip({
  apiUrl,
  token,
  filePath,
  shared,
  signal,
  onProgress,
  dirHandle: existingDirHandle = null,
  saveAsFolderName = null,
}) {
  let rootDir = existingDirHandle;
  if (!rootDir) {
    rootDir = await ensureSaveDirectory();
  }
  if (!rootDir) {
    throw new Error(
      "Choose a save folder (Chrome/Edge) so folder downloads can keep their structure."
    );
  }

  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  const params = new URLSearchParams({
    filePath: String(filePath || ""),
  });
  if (shared) params.set("shared", shared);

  const listRes = await fetch(
    `${apiUrl}download-folder-entries?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    }
  );

  if (!listRes.ok) {
    let message = "Failed to list folder files";
    try {
      const err = await listRes.json();
      if (err?.error) message = err.error;
    } catch (_) {}
    const error = new Error(message);
    error.status = listRes.status;
    throw error;
  }

  const data = await listRes.json();
  const files = Array.isArray(data.files) ? data.files : [];
  const folderName =
    saveAsFolderName || data.folderName || baseName(filePath) || "folder";
  const totalBytes = Number(data.totalBytes) || 0;

  if (!files.length) {
    throw new Error("Folder is empty");
  }

  const folderHandle = await rootDir.getDirectoryHandle(folderName, {
    create: true,
  });

  const progressState = { loaded: 0 };
  const report = () => {
    if (typeof onProgress !== "function") return;
    const current = progressState.loaded;
    if (totalBytes > 0) {
      onProgress(
        Math.min(99, Math.round((current / totalBytes) * 98)),
        current,
        totalBytes
      );
    } else {
      onProgress(
        Math.min(95, Math.floor(current / (5 * 1024 * 1024))),
        current,
        null
      );
    }
  };

  const activityBatchId =
    files.length >= 2
      ? await startActivityBatch({
          apiUrl,
          token,
          action: "DOWNLOAD",
          fileCount: files.length,
          estimatedBytes: totalBytes || undefined,
          source: "folder-download",
          apis: ["download-folder-entries", "download-file-url"],
        })
      : null;

  const failures = [];
  let successCount = 0;
  let successBytes = 0;
  let nextIndex = 0;
  let aborted = false;

  try {
    const worker = async () => {
      while (true) {
        if (signal?.aborted) {
          aborted = true;
          throw new DOMException("Aborted", "AbortError");
        }
        const idx = nextIndex++;
        if (idx >= files.length) return;

        const entry = files[idx];
        const entryPath = entry.filePath || entry.relativePath;
        const entrySize = Number(entry.size) || 0;
        const fileBaseLoaded = progressState.loaded;

        try {
          const { dirHandle, saveAsName } = await resolveNestedSaveTarget(
            folderHandle,
            entry.relativePath || entryPath
          );

          await downloadFilePresigned({
            apiUrl,
            token,
            filePath: entryPath,
            shared,
            signal,
            dirHandle,
            saveAsName,
            estimatedBytes: entrySize || null,
            batchId: activityBatchId || undefined,
            onProgress: (percent, loaded) => {
              if (typeof loaded === "number" && loaded >= 0) {
                progressState.loaded = fileBaseLoaded + loaded;
              } else if (entrySize > 0) {
                progressState.loaded =
                  fileBaseLoaded +
                  Math.round((entrySize * (Number(percent) || 0)) / 100);
              }
              report();
            },
          });

          successCount += 1;
          successBytes += entrySize || 0;
          progressState.loaded = fileBaseLoaded + (entrySize || 0);
          report();
        } catch (err) {
          if (isDownloadCancelledError(err) || err?.name === "AbortError") {
            aborted = true;
            throw err;
          }
          console.error("Folder file download failed:", entry.relativePath, err);
          failures.push({
            relativePath: entry.relativePath || entryPath,
            error: err?.message || String(err),
          });
          progressState.loaded = fileBaseLoaded + (entrySize || 0);
          report();
        } finally {
          const gapMs = isLargeFile(entrySize) ? LARGE_FILE_GAP_MS : FILE_GAP_MS;
          if (!signal?.aborted) {
            await delay(gapMs);
          }
        }
      }
    };

    const pool = Math.min(ENTRY_CONCURRENCY, files.length);
    await Promise.all(Array.from({ length: pool }, () => worker()));
  } finally {
    if (activityBatchId) {
      const failCount = failures.length;
      const remaining = files.length - successCount - failCount;
      finishActivityBatch({
        apiUrl,
        token,
        batchId: activityBatchId,
        status: resolveBatchStatus({
          fileCount: files.length,
          successCount,
          failCount,
          cancelCount: aborted ? remaining : 0,
          cancelled: aborted || signal?.aborted,
        }),
        successCount,
        failCount: failCount + (aborted ? remaining : 0),
        sizeBytes: successBytes,
        failedPaths: failures.map((f) => f.relativePath).slice(0, 50),
        apis: ["download-folder-entries", "download-file-url"],
      });
    }
  }

  if (typeof onProgress === "function") {
    onProgress(100, progressState.loaded, totalBytes || null);
  }

  if (failures.length && failures.length === files.length) {
    throw new Error("All folder files failed to download");
  }
  if (failures.length) {
    throw new Error(
      `Downloaded with ${failures.length} failed file(s): ${failures
        .slice(0, 3)
        .map((f) => f.relativePath)
        .join(", ")}`
    );
  }

  return {
    folderName,
    fileCount: files.length,
    loaded: progressState.loaded,
    totalBytes,
    failures,
    dirHandle: rootDir,
  };
}

/**
 * Multi-folder: one directory pick per cycle, each folder saved with structure.
 * @param {AbortSignal} [signal] batch cancel
 * @param {Record<string, AbortSignal>} [signalsByPath] per-folder row ✕
 */
export async function downloadMultipleFoldersToDirectory({
  apiUrl,
  token,
  folderPaths = [],
  shared,
  signal,
  signalsByPath = null,
  onFolderProgress,
  dirHandle: existingDirHandle = null,
}) {
  const paths = (folderPaths || []).filter(Boolean);
  if (!paths.length) return { mode: "empty", results: [], dirHandle: null };

  let dirHandle = existingDirHandle;
  if (!dirHandle) {
    dirHandle = await ensureSaveDirectory();
  }
  if (!dirHandle) {
    throw new Error(
      "Choose a save folder (Chrome/Edge) so folder downloads can keep their structure."
    );
  }

  const usedNames = new Set();
  const results = [];

  for (const folderPath of paths) {
    if (signal?.aborted) {
      results.push({
        folderPath,
        success: false,
        cancelled: true,
      });
      continue;
    }

    const fileSignal = signalsByPath?.[folderPath] || null;
    if (fileSignal?.aborted && !signal?.aborted) {
      results.push({ folderPath, success: false, cancelled: true });
      continue;
    }

    const combinedSignal = mergeAbortSignals(signal, fileSignal);
    const saveAsFolderName = uniqueDirName(baseName(folderPath), usedNames);
    try {
      const outcome = await downloadFolderNoZip({
        apiUrl,
        token,
        filePath: folderPath,
        shared,
        signal: combinedSignal,
        dirHandle,
        saveAsFolderName,
        onProgress: (percent, loaded, total) =>
          onFolderProgress?.(folderPath, percent, loaded, total),
      });
      results.push({
        folderPath,
        success: true,
        cancelled: false,
        folderName: outcome.folderName,
      });
    } catch (err) {
      if (isDownloadCancelledError(err) || err?.name === "AbortError") {
        results.push({ folderPath, success: false, cancelled: true });
        // Cancel all → stop. Per-folder ✕ → continue with remaining folders.
        if (signal?.aborted) break;
        continue;
      }
      results.push({
        folderPath,
        success: false,
        cancelled: false,
        error: err,
      });
    }
  }

  return { mode: "directory", results, dirHandle };
}
