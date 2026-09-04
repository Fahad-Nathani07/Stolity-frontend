/**
 * No-zip folder download: list entries from API, then save each file
 * into a user-picked directory (Chrome/Edge File System Access API).
 */

import { fetchFolderEntryResponse } from "./downloadFilePresigned";
import { isDownloadCancelledError } from "./downloadWithProgress";

const CONCURRENCY = 1;
const MAX_FILE_RETRIES = 3;

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

async function writeResponseToHandle(response, fileHandle, onBytes) {
  const writable = await fileHandle.createWritable();
  try {
    if (!response.body) {
      const buf = await response.arrayBuffer();
      await writable.write(buf);
      if (typeof onBytes === "function") onBytes(buf.byteLength || 0);
      return;
    }

    const reader = response.body.getReader();
    const WRITE_BATCH = 1024 * 1024;
    let pending = [];
    let pendingSize = 0;

    const flush = async () => {
      if (pendingSize === 0) return;
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

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const n = value.byteLength || value.length || 0;
      pending.push(value);
      pendingSize += n;
      if (typeof onBytes === "function") onBytes(n);
      if (pendingSize >= WRITE_BATCH) await flush();
    }
    await flush();
  } finally {
    await writable.close();
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @param {object} opts
 * @param {string} opts.apiUrl
 * @param {string} opts.token
 * @param {string} opts.filePath
 * @param {string} [opts.shared]
 * @param {AbortSignal} [opts.signal]
 * @param {(percent: number, loaded: number, total: number|null) => void} [opts.onProgress]
 */
export async function downloadFolderNoZip({
  apiUrl,
  token,
  filePath,
  shared,
  signal,
  onProgress,
}) {
  if (typeof window.showDirectoryPicker !== "function") {
    throw new Error(
      "No-zip folder download needs Chrome/Edge (choose a folder)."
    );
  }

  const rootDir = await window.showDirectoryPicker({ mode: "readwrite" }).catch(
    (err) => {
      if (isDownloadCancelledError(err)) {
        const abortErr = new DOMException(
          "User cancelled folder picker",
          "AbortError"
        );
        abortErr.cause = err;
        throw abortErr;
      }
      throw err;
    }
  );
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
    throw new Error(message);
  }

  const data = await listRes.json();
  const files = Array.isArray(data.files) ? data.files : [];
  const folderName = data.folderName || "folder";
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
    for (let attempt = 1; attempt <= MAX_FILE_RETRIES; attempt++) {
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
        if (err?.name === "AbortError") throw err;
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
      try {
        const res = await fetchEntry(entry);
        const fileHandle = await getNestedFileHandle(
          folderHandle,
          entry.relativePath
        );
        await writeResponseToHandle(res, fileHandle, trackBytes);
      } catch (err) {
        if (err?.name === "AbortError") throw err;
        console.error("Folder file download failed:", entry.relativePath, err);
        failures.push({
          relativePath: entry.relativePath,
          error: err?.message || String(err),
        });
        trackBytes(Number(entry.size) || 0);
      }
    }
  };

  const pool = Math.min(CONCURRENCY, files.length);
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
  };
}
