/**
 * No-zip folder download: list entries from API, then stream each file into a
 * user-picked directory (same File System Access approach as file downloads).
 * Preserves nested folder structure. Multi-folder shares one picker per cycle.
 */

import {
  ensureSaveDirectory,
  fetchFolderEntryResponse,
} from "./downloadFilePresigned";
import {
  streamDownloadResponse,
  isDownloadCancelledError,
  DISK_STREAM_THRESHOLD_BYTES,
} from "./downloadWithProgress";

const ENTRY_CONCURRENCY = 1;
const MAX_FILE_RETRIES = 3;
const LARGE_FILE_GAP_MS = 250;

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

async function getNestedFileHandle(rootDirHandle, relativePath) {
  const parts = String(relativePath || "")
    .replace(/\\/g, "/")
    .split("/")
    .filter(Boolean);
  if (!parts.length) {
    throw new Error("Invalid file path in folder download");
  }
  const fileName = parts.pop();
  let dir = rootDirHandle;
  for (const part of parts) {
    dir = await dir.getDirectoryHandle(part, { create: true });
  }
  return dir.getFileHandle(fileName, { create: true });
}

async function writeEntryToFolder({
  response,
  folderHandle,
  relativePath,
  onBytes,
  signal,
}) {
  const fileHandle = await getNestedFileHandle(folderHandle, relativePath);
  const writable = await fileHandle.createWritable({ keepExistingData: false });
  let lastLoaded = 0;
  await streamDownloadResponse({
    response,
    fileName: baseName(relativePath),
    isFolder: false,
    writable,
    signal,
    onProgress: (_percent, loaded) => {
      if (typeof onBytes !== "function") return;
      const n = Math.max(0, (loaded || 0) - lastLoaded);
      lastLoaded = loaded || 0;
      if (n > 0) onBytes(n);
    },
  });
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

  const trackBytes = (n) => {
    progressState.loaded += n;
    report();
  };

  const fetchEntry = async (entry) => {
    let lastErr;
    for (let attempt = 1; attempt <= MAX_FILE_RETRIES; attempt += 1) {
      if (signal?.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }
      try {
        return await fetchFolderEntryResponse({
          apiUrl,
          token,
          entry,
          shared,
          signal,
        });
      } catch (err) {
        if (isDownloadCancelledError(err) || err?.name === "AbortError") {
          throw err;
        }
        lastErr = err;
        if (attempt < MAX_FILE_RETRIES) {
          await delay(800 * attempt);
        }
      }
    }
    throw lastErr || new Error(`Failed to download ${entry.relativePath}`);
  };

  const failures = [];
  let nextIndex = 0;

  const worker = async () => {
    while (true) {
      if (signal?.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }
      const idx = nextIndex++;
      if (idx >= files.length) return;

      const entry = files[idx];
      let fetched = null;
      try {
        fetched = await fetchEntry(entry);
        await writeEntryToFolder({
          response: fetched.response,
          folderHandle,
          relativePath: entry.relativePath,
          onBytes: trackBytes,
          signal,
        });
        if (isLargeFile(entry.size || fetched.sizeBytes)) {
          await delay(LARGE_FILE_GAP_MS);
        }
      } catch (err) {
        if (isDownloadCancelledError(err) || err?.name === "AbortError") {
          throw err;
        }
        console.error("Folder file download failed:", entry.relativePath, err);
        failures.push({
          relativePath: entry.relativePath,
          error: err?.message || String(err),
        });
        trackBytes(Number(entry.size) || 0);
      } finally {
        if (typeof fetched?.releaseLargeSlot === "function") {
          fetched.releaseLargeSlot();
        }
      }
    }
  };

  const pool = Math.min(ENTRY_CONCURRENCY, files.length);
  await Promise.all(Array.from({ length: pool }, () => worker()));

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
 */
export async function downloadMultipleFoldersToDirectory({
  apiUrl,
  token,
  folderPaths = [],
  shared,
  signal,
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

    const saveAsFolderName = uniqueDirName(baseName(folderPath), usedNames);
    try {
      const outcome = await downloadFolderNoZip({
        apiUrl,
        token,
        filePath: folderPath,
        shared,
        signal,
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
        break;
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
