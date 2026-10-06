import {
  streamDownloadResponse,
  isDownloadCancelledError,
  DISK_STREAM_THRESHOLD_BYTES,
  triggerNativeUrlDownload,
  createThrottledProgress,
  progressFromBytes,
  mergeAbortSignals,
} from "./downloadWithProgress";
import { queueActivityStatus } from "./activityReport";

/** Small files: a few at once. Large files: only 1 (fetch + save). */
const MULTI_DOWNLOAD_CONCURRENCY = 3;
const LARGE_DOWNLOAD_CONCURRENCY = 1;
/** Fresh signed URL + stream open attempts (per full-file try). */
const DIRECT_FETCH_MAX_ATTEMPTS = 3;
/** Full Direct Stream tries (covers mid-stream net::ERR_* after long transfers). */
const FILE_DOWNLOAD_MAX_ATTEMPTS = 3;
/**
 * Split large Direct Stream files into Range GETs.
 * Avoids one multi‑GB fetch that freezes Chrome Network / stalls the tab after long runs.
 */
const RANGE_CHUNK_BYTES = 32 * 1024 * 1024; // 32 MiB per request
const RANGE_MIN_FILE_BYTES = 64 * 1024 * 1024; // use ranges only for ≥64 MB
const RANGE_CHUNK_MAX_ATTEMPTS = 3;
const WRITE_CHUNK_BYTES = 1024 * 1024; // 1 MiB disk writes

/**
 * null = not tried yet, true = fetch(signedUrl) works,
 * false = CORS blocked — skip straight to /download-file proxy.
 */
let storageFetchWorks = null;

/** Limits how many large downloads run at once (includes the storage fetch). */
let largeInFlight = 0;
const largeWaiters = [];

function notifyLargeWaiters() {
  while (largeWaiters.length && largeInFlight < LARGE_DOWNLOAD_CONCURRENCY) {
    const next = largeWaiters.shift();
    next?.();
  }
}

async function acquireLargeSlot(signal) {
  if (largeInFlight < LARGE_DOWNLOAD_CONCURRENCY) {
    largeInFlight += 1;
    return;
  }
  await new Promise((resolve, reject) => {
    const tryAcquire = () => {
      if (signal?.aborted) {
        reject(new DOMException("Aborted", "AbortError"));
        return;
      }
      if (largeInFlight < LARGE_DOWNLOAD_CONCURRENCY) {
        largeInFlight += 1;
        resolve();
        return;
      }
      largeWaiters.push(tryAcquire);
    };
    largeWaiters.push(tryAcquire);
    if (signal) {
      const onAbort = () => {
        const idx = largeWaiters.indexOf(tryAcquire);
        if (idx >= 0) largeWaiters.splice(idx, 1);
        reject(new DOMException("Aborted", "AbortError"));
      };
      if (signal.aborted) {
        onAbort();
        return;
      }
      signal.addEventListener("abort", onAbort, { once: true });
    }
  });
}

function releaseLargeSlot() {
  largeInFlight = Math.max(0, largeInFlight - 1);
  notifyLargeWaiters();
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestDownloadFileUrl({
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
    const err = new Error(`Download URL failed (${res.status})`);
    err.status = res.status;
    throw err;
  }

  const data = await res.json();
  if (!data?.url) {
    throw new Error("Download URL missing from response");
  }
  return data;
}

async function fetchPresignedObject(url, signal) {
  const res = await fetch(url, {
    method: "GET",
    mode: "cors",
    credentials: "omit",
    cache: "no-store",
    signal,
  });
  if (!res.ok) {
    const err = new Error(`Presigned download failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return res;
}

async function fetchPresignedRange(url, start, end, signal) {
  const res = await fetch(url, {
    method: "GET",
    mode: "cors",
    credentials: "omit",
    cache: "no-store",
    signal,
    headers: {
      Range: `bytes=${start}-${end}`,
    },
  });
  // 206 = partial; some origins still return 200 for the first full-object GET.
  if (res.status !== 206 && res.status !== 200) {
    const err = new Error(`Presigned range failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return res;
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

function isAbortLike(err) {
  return isDownloadCancelledError(err) || err?.name === "AbortError";
}

function errorText(err) {
  return `${err?.message || ""} ${err?.name || ""} ${err || ""}`.toLowerCase();
}

function isRetryableTransferError(err) {
  if (!err || isAbortLike(err)) return false;

  const status = Number(err.status);
  if (Number.isFinite(status) && status > 0) {
    // Expired/forbidden signed URL → retry with a fresh URL; transient server/gateway.
    if (status === 403 || status === 408 || status === 429 || status >= 500) {
      return true;
    }
    // Hard client errors (404, 400, …) — do not retry.
    if (status >= 400 && status < 500) return false;
  }

  const msg = errorText(err);
  // Chrome Network tab: (failed) net::ERR_CONNECTION_CLOSED / RESET / TIMED_OUT / HTTP2_…
  // Mid-stream body failures often surface as TypeError("Failed to fetch") or net::ERR_*.
  return (
    msg.includes("http2") ||
    msg.includes("protocol_error") ||
    msg.includes("protocol error") ||
    msg.includes("networkerror") ||
    msg.includes("network error") ||
    msg.includes("failed to fetch") ||
    msg.includes("load failed") ||
    msg.includes("connection") ||
    msg.includes("net::") ||
    msg.includes("err_connection") ||
    msg.includes("err_network") ||
    msg.includes("err_internet") ||
    msg.includes("err_timed_out") ||
    msg.includes("err_timeout") ||
    msg.includes("err_empty_response") ||
    msg.includes("err_quic") ||
    msg.includes("err_ssl") ||
    msg.includes("err_address") ||
    msg.includes("err_name_not_resolved") ||
    msg.includes("err_socket") ||
    msg.includes("err_tunnel") ||
    msg.includes("err_failed") ||
    err?.name === "TypeError"
  );
}

async function requestDownloadFileUrlWithRetry({
  apiUrl,
  token,
  filePath,
  shared,
  signal,
}) {
  let lastErr;
  for (let attempt = 1; attempt <= FILE_DOWNLOAD_MAX_ATTEMPTS; attempt += 1) {
    if (signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }
    try {
      return await requestDownloadFileUrl({
        apiUrl,
        token,
        filePath,
        shared,
        signal,
      });
    } catch (err) {
      if (isAbortLike(err)) throw err;
      lastErr = err;
      if (
        !isRetryableTransferError(err) ||
        attempt >= FILE_DOWNLOAD_MAX_ATTEMPTS
      ) {
        throw err;
      }
      console.warn(
        `[download] download-file-url failed (attempt ${attempt}/${FILE_DOWNLOAD_MAX_ATTEMPTS}); retrying…`,
        err?.message || err
      );
      await delay(1000 * attempt);
    }
  }
  throw lastErr || new Error("Download URL failed");
}

function isLikelyCorsBlockedError(err) {
  if (!err || isAbortLike(err)) return false;
  const msg = errorText(err);
  if (msg.includes("http2") || msg.includes("protocol")) return false;
  return msg.includes("cors") || msg.includes("cross-origin");
}

function baseFileName(filePath) {
  const parts = String(filePath || "download")
    .replace(/\\/g, "/")
    .split("/")
    .filter(Boolean);
  return parts[parts.length - 1] || "download";
}

function isLargeFile(sizeBytes) {
  const n = Number(sizeBytes) || 0;
  // Unknown size: treat as large so we never run several GB streams in parallel.
  if (n <= 0) return true;
  return n >= DISK_STREAM_THRESHOLD_BYTES;
}

function uniqueFileName(desired, used) {
  if (!used.has(desired)) {
    used.add(desired);
    return desired;
  }
  const match = desired.match(/^(.*?)(\.[^.]+)?$/);
  const stem = match?.[1] || desired;
  const ext = match?.[2] || "";
  let i = 1;
  let next = `${stem} (${i})${ext}`;
  while (used.has(next)) {
    i += 1;
    next = `${stem} (${i})${ext}`;
  }
  used.add(next);
  return next;
}

/** Write response body into the chosen folder — no Chrome Save As dialog. */
async function writeResponseToDirectory({
  response,
  dirHandle,
  saveAsName,
  onProgress,
  signal,
}) {
  const fileHandle = await dirHandle.getFileHandle(saveAsName, {
    create: true,
  });
  const writable = await fileHandle.createWritable({
    keepExistingData: false,
  });
  await streamDownloadResponse({
    response,
    fileName: saveAsName,
    isFolder: false,
    writable,
    fileHandle,
    onProgress,
    signal,
  });
}

async function reopenWritableAt(fileHandle, offset) {
  const next = await fileHandle.createWritable({ keepExistingData: true });
  if (offset > 0 && typeof next.seek === "function") {
    await next.seek(offset);
  }
  return next;
}

async function pipeBodyToWritable(response, writable, {
  onBytes,
  signal,
}) {
  const reader = response.body?.getReader?.();
  if (!reader) {
    throw new Error("Response body is empty");
  }
  let loaded = 0;
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
        await writable.write(piece);
        const n = piece.byteLength;
        loaded += n;
        offset = end;
        onBytes?.(n);
      }
    }
    return loaded;
  } catch (err) {
    try {
      await reader.cancel();
    } catch (_) {}
    throw err;
  }
}

/**
 * Download a large object as many short Range GETs (32MB), writing sequentially.
 * Keeps Chrome Network / connection state healthier than one multi‑GB fetch.
 * @returns {{ usedRanges: boolean }}
 */
async function writePresignedViaRanges({
  url,
  totalBytes,
  dirHandle,
  saveAsName,
  onProgress,
  signal,
  getFreshUrl,
}) {
  const fileHandle = await dirHandle.getFileHandle(saveAsName, {
    create: true,
  });
  let writable = await fileHandle.createWritable({ keepExistingData: false });
  let loaded = 0;
  let currentUrl = url;
  const progress = createThrottledProgress(onProgress);

  const fail = async (err) => {
    try {
      await writable.abort();
    } catch (_) {}
    throw err;
  };

  try {
    while (loaded < totalBytes) {
      if (signal?.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }

      const start = loaded;
      const end = Math.min(start + RANGE_CHUNK_BYTES - 1, totalBytes - 1);
      let response = null;

      for (let attempt = 1; attempt <= RANGE_CHUNK_MAX_ATTEMPTS; attempt += 1) {
        try {
          response = await fetchPresignedRange(
            currentUrl,
            start,
            end,
            signal
          );
          break;
        } catch (err) {
          if (isAbortLike(err)) throw err;
          if (
            !isRetryableTransferError(err) ||
            attempt >= RANGE_CHUNK_MAX_ATTEMPTS
          ) {
            throw err;
          }
          console.warn(
            `[download] Range ${start}-${end} failed (attempt ${attempt}/${RANGE_CHUNK_MAX_ATTEMPTS}); retrying…`,
            err?.message || err
          );
          if (typeof getFreshUrl === "function") {
            try {
              currentUrl = await getFreshUrl();
            } catch (_) {}
          }
          await delay(1000 * attempt);
        }
      }

      if (!response) {
        throw new Error("Range fetch failed");
      }

      // Server ignored Range on first request → fall back to single full-stream write.
      if (response.status === 200) {
        if (start !== 0) {
          try {
            await response.body?.cancel?.();
          } catch (_) {}
          throw new Error("Server ignored Range mid-download");
        }
        const wrote = await pipeBodyToWritable(response, writable, {
          signal,
          onBytes: (n) => {
            loaded += n;
            progress.report(
              progressFromBytes(loaded, totalBytes),
              loaded,
              totalBytes
            );
          },
        });
        loaded = wrote;
        await writable.close();
        progress.end(loaded, totalBytes);
        return { usedRanges: false };
      }

      const before = loaded;
      await pipeBodyToWritable(response, writable, {
        signal,
        onBytes: (n) => {
          loaded += n;
          progress.report(
            progressFromBytes(loaded, totalBytes),
            loaded,
            totalBytes
          );
        },
      });

      const got = loaded - before;
      const expected = end - start + 1;
      if (got < expected && loaded < totalBytes) {
        throw new Error(
          `Short range read (${got}/${expected} bytes at offset ${start})`
        );
      }

      // Close each range so Chrome releases the fetch + FS staging buffers.
      await writable.close();
      if (loaded < totalBytes) {
        writable = await reopenWritableAt(fileHandle, loaded);
        // Let the event loop / DevTools breathe between multi‑MB requests.
        await delay(0);
      }
    }

    progress.end(loaded, totalBytes);
    return { usedRanges: true };
  } catch (err) {
    await fail(err);
  }
}

function shouldUseRangeDownload(sizeBytes) {
  const n = Number(sizeBytes) || 0;
  return n >= RANGE_MIN_FILE_BYTES;
}

/**
 * Fetch file bytes (presigned first, proxy fallback) and return Response + meta.
 * Large-file slot is taken before network body work (and early when size is known/unknown-large).
 */
async function fetchFileResponse({
  apiUrl,
  token,
  filePath,
  shared,
  signal,
  estimatedBytes = null,
}) {
  let heldLargeSlot = false;
  const ensureLargeSlot = async (sizeBytes) => {
    if (heldLargeSlot) return;
    if (!isLargeFile(sizeBytes)) return;
    await acquireLargeSlot(signal);
    heldLargeSlot = true;
  };

  // Unknown estimate → treat as large so parallel workers cannot open several GB streams.
  await ensureLargeSlot(Number(estimatedBytes) || 0);

  try {
    let meta = null;
    try {
      meta = await requestDownloadFileUrlWithRetry({
        apiUrl,
        token,
        filePath,
        shared,
        signal,
      });
    } catch (err) {
      if (isAbortLike(err)) throw err;
      const sizeBytes = Number(estimatedBytes) || 0;
      await ensureLargeSlot(sizeBytes);
      const response = await fetchViaProxy({
        apiUrl,
        token,
        filePath,
        shared,
        signal,
      });
      return {
        response,
        fileName: baseFileName(filePath),
        sizeBytes,
        mode: "proxy",
        heldLargeSlot,
      };
    }

    let name = meta.fileName || baseFileName(filePath);
    let sizeBytes = Number(meta.size) || Number(estimatedBytes) || 0;
    await ensureLargeSlot(sizeBytes);

    if (storageFetchWorks !== false) {
      for (let attempt = 1; attempt <= DIRECT_FETCH_MAX_ATTEMPTS; attempt += 1) {
        try {
          if (attempt > 1) {
            meta = await requestDownloadFileUrlWithRetry({
              apiUrl,
              token,
              filePath,
              shared,
              signal,
            });
            name = meta.fileName || baseFileName(filePath);
            sizeBytes = Number(meta.size) || Number(estimatedBytes) || sizeBytes;
            await ensureLargeSlot(sizeBytes);
          }
          const response = await fetchPresignedObject(meta.url, signal);
          storageFetchWorks = true;
          return {
            response,
            fileName: name,
            sizeBytes,
            mode: "presigned",
            heldLargeSlot,
            activityEventId: meta.activityEventId || null,
          };
        } catch (err) {
          if (isAbortLike(err)) throw err;
          if (
            isRetryableTransferError(err) &&
            attempt < DIRECT_FETCH_MAX_ATTEMPTS
          ) {
            console.warn(
              `[download] Direct fetch open failed (attempt ${attempt}/${DIRECT_FETCH_MAX_ATTEMPTS}); retrying…`,
              err?.message || err
            );
            await delay(1500 * attempt);
            continue;
          }
          if (isLikelyCorsBlockedError(err)) {
            storageFetchWorks = false;
          }
          console.warn(
            "[download] Direct storage fetch failed; using /download-file proxy.",
            err?.message || err
          );
          break;
        }
      }
    }

    const response = await fetchViaProxy({
      apiUrl,
      token,
      filePath,
      shared,
      signal,
    });
    return {
      response,
      fileName: name,
      sizeBytes,
      mode: "proxy",
      heldLargeSlot,
      activityEventId: meta?.activityEventId || null,
    };
  } catch (err) {
    if (heldLargeSlot) releaseLargeSlot();
    throw err;
  }
}

export async function pickDownloadDirectory() {
  if (typeof window.showDirectoryPicker !== "function") {
    return null;
  }
  try {
    return await window.showDirectoryPicker({ mode: "readwrite" });
  } catch (err) {
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
}

/**
 * Ask for a save folder for this download cycle (once per Download click).
 * Callers reuse the returned handle for every file in the same batch.
 */
export async function ensureSaveDirectory() {
  if (typeof window.showDirectoryPicker !== "function") {
    return null;
  }
  return pickDownloadDirectory();
}

/**
 * Native Browser Download — up to this many selected files (no folder picker).
 * Above this, use Browser Direct Stream into a picked directory.
 */
export const NATIVE_BROWSER_DOWNLOAD_MAX_FILES = 5;

/**
 * Native Browser Download — hands signed URL(s) to Chrome's download manager
 * (low tab RAM, no real progress). Used for 1–NATIVE_BROWSER_DOWNLOAD_MAX_FILES files.
 */
export async function downloadFileNativeBrowser({
  apiUrl,
  token,
  filePath,
  shared,
  signal,
  onProgress,
}) {
  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }
  if (typeof onProgress === "function") onProgress(0);

  const meta = await requestDownloadFileUrl({
    apiUrl,
    token,
    filePath,
    shared,
    signal,
  });

  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  const name = meta.fileName || baseFileName(filePath);
  triggerNativeUrlDownload(meta.url, name);

  // Do not report 100% — browser is still downloading; app cannot confirm finish.
  if (typeof onProgress === "function") onProgress(1);

  // Native browser download: leave status REQUESTED (cannot confirm completion).
  return {
    mode: "native",
    filePath,
    handedToBrowser: true,
    fileName: name,
    activityEventId: meta.activityEventId || null,
    downloadStatus: "REQUESTED",
  };
}

/**
 * Browser Direct Stream — write into a picked folder (used by multi-file / when a dirHandle is passed).
 * Large files use HTTP Range chunks (32MB) so Chrome does not hold one multi‑GB fetch
 * (that freezes Network tab / stalls navigation after long runs).
 * Retries the full file up to FILE_DOWNLOAD_MAX_ATTEMPTS on transient net::ERR_*.
 */
export async function downloadFilePresigned({
  apiUrl,
  token,
  filePath,
  shared,
  signal,
  onProgress,
  estimatedBytes = null,
  dirHandle: existingDirHandle = null,
  saveAsName = null,
}) {
  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  let dirHandle = existingDirHandle;
  if (!dirHandle) {
    dirHandle = await ensureSaveDirectory();
  }
  if (!dirHandle) {
    throw new Error(
      "Choose a save folder (Chrome/Edge) so files can save without a Save As dialog per file."
    );
  }

  let lastErr = null;
  let lastEventId = null;
  let heldLargeSlot = false;

  const ensureLargeSlot = async (sizeBytes) => {
    if (heldLargeSlot) return;
    if (!isLargeFile(sizeBytes)) return;
    await acquireLargeSlot(signal);
    heldLargeSlot = true;
  };

  const releaseSlotIfHeld = () => {
    if (!heldLargeSlot) return;
    releaseLargeSlot();
    heldLargeSlot = false;
  };

  for (let attempt = 1; attempt <= FILE_DOWNLOAD_MAX_ATTEMPTS; attempt += 1) {
    if (signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }

    let fetched = null;
    try {
      if (attempt > 1 && typeof onProgress === "function") {
        onProgress(0);
      }

      // Prefer Range-chunked Direct Stream for large known sizes (avoids multi‑GB fetch freeze).
      if (storageFetchWorks !== false) {
        try {
          const meta = await requestDownloadFileUrlWithRetry({
            apiUrl,
            token,
            filePath,
            shared,
            signal,
          });
          const sizeBytes =
            Number(meta.size) || Number(estimatedBytes) || 0;
          const name =
            saveAsName || meta.fileName || baseFileName(filePath);
          const eventId = meta.activityEventId || null;
          lastEventId = eventId || lastEventId;

          if (shouldUseRangeDownload(sizeBytes) && meta.url) {
            await ensureLargeSlot(sizeBytes);
            if (eventId && attempt === 1) {
              queueActivityStatus({
                apiUrl,
                token,
                eventId,
                status: "STARTED",
              });
            }
            try {
              await writePresignedViaRanges({
                url: meta.url,
                totalBytes: sizeBytes,
                dirHandle,
                saveAsName: name,
                onProgress,
                signal,
                getFreshUrl: async () => {
                  const fresh = await requestDownloadFileUrlWithRetry({
                    apiUrl,
                    token,
                    filePath,
                    shared,
                    signal,
                  });
                  return fresh.url;
                },
              });
              storageFetchWorks = true;
              releaseSlotIfHeld();
              if (eventId) {
                queueActivityStatus({
                  apiUrl,
                  token,
                  eventId,
                  status: "COMPLETED",
                });
              }
              return {
                mode: "presigned-dir-ranges",
                filePath,
                handedToBrowser: false,
                fileName: name,
                activityEventId: eventId,
                downloadStatus: "COMPLETED",
                attempts: attempt,
              };
            } catch (rangeWriteErr) {
              releaseSlotIfHeld();
              throw rangeWriteErr;
            }
          }
        } catch (rangeErr) {
          if (isAbortLike(rangeErr)) throw rangeErr;
          releaseSlotIfHeld();
          if (isLikelyCorsBlockedError(rangeErr)) {
            storageFetchWorks = false;
          }
          console.warn(
            "[download] Range Direct Stream failed; falling back to single-stream fetch.",
            rangeErr?.message || rangeErr
          );
          // Fall through to classic single-response path below.
        }
      }

      fetched = await fetchFileResponse({
        apiUrl,
        token,
        filePath,
        shared,
        signal,
        estimatedBytes,
      });
      // fetchFileResponse owns its own large slot — track for release on failure.
      if (fetched.heldLargeSlot) {
        heldLargeSlot = true;
        fetched.heldLargeSlot = false;
      }

      const eventId = fetched.activityEventId || null;
      lastEventId = eventId || lastEventId;
      if (eventId && attempt === 1) {
        queueActivityStatus({
          apiUrl,
          token,
          eventId,
          status: "STARTED",
        });
      }

      const name = saveAsName || fetched.fileName || baseFileName(filePath);
      await writeResponseToDirectory({
        response: fetched.response,
        dirHandle,
        saveAsName: name,
        onProgress,
        signal,
      });

      releaseSlotIfHeld();
      if (eventId) {
        queueActivityStatus({
          apiUrl,
          token,
          eventId,
          status: "COMPLETED",
        });
      }
      return {
        mode: fetched.mode === "proxy" ? "proxy-dir" : "presigned-dir",
        filePath,
        handedToBrowser: false,
        fileName: name,
        activityEventId: eventId,
        downloadStatus: "COMPLETED",
        attempts: attempt,
      };
    } catch (err) {
      releaseSlotIfHeld();
      if (fetched?.heldLargeSlot) {
        releaseLargeSlot();
        fetched.heldLargeSlot = false;
      }

      if (isAbortLike(err)) {
        if (lastEventId) {
          queueActivityStatus({
            apiUrl,
            token,
            eventId: lastEventId,
            status: "CANCELLED",
            errorMessage: err?.message,
          });
        }
        throw err;
      }

      lastErr = err;
      const canRetry =
        isRetryableTransferError(err) &&
        attempt < FILE_DOWNLOAD_MAX_ATTEMPTS;

      console.warn(
        `[download] Direct Stream failed (attempt ${attempt}/${FILE_DOWNLOAD_MAX_ATTEMPTS}) for ${filePath}:`,
        err?.message || err
      );

      if (!canRetry) {
        if (lastEventId) {
          queueActivityStatus({
            apiUrl,
            token,
            eventId: lastEventId,
            status: "FAILED",
            errorMessage: err?.message,
          });
        }
        throw err;
      }

      // Back off before a fresh signed URL + full re-download (partial file is overwritten).
      await delay(2000 * attempt);
    }
  }

  throw lastErr || new Error("Download failed");
}

/**
 * Multi-file: one folder pick per cycle, then stream each file into it.
 * Large / unknown-size files run strictly one-at-a-time to limit Chrome RAM.
 *
 * @param {AbortSignal} [signal] batch-level cancel (Cancel all)
 * @param {Record<string, AbortSignal>} [signalsByPath] per-file cancel (row ✕)
 *   — cancelling one file skips it and continues with the rest
 */
export async function downloadMultipleFilesToDirectory({
  apiUrl,
  token,
  filePaths = [],
  shared,
  signal,
  signalsByPath = null,
  onFileProgress,
  dirHandle: existingDirHandle = null,
  estimatedBytesByPath = null,
}) {
  const paths = (filePaths || []).filter(Boolean);
  if (!paths.length) return { mode: "empty", results: [] };

  let dirHandle = existingDirHandle;
  if (!dirHandle) {
    dirHandle = await ensureSaveDirectory();
  }
  if (!dirHandle) {
    throw new Error(
      "Choose a save folder (Chrome/Edge) so this download can save without a Save As dialog per file."
    );
  }

  const results = new Array(paths.length);
  const usedNames = new Set();
  const saveNames = paths.map((filePath) =>
    uniqueFileName(baseFileName(filePath), usedNames)
  );
  const estimates = paths.map((filePath) => {
    const fromMap = estimatedBytesByPath?.[filePath];
    return Number(fromMap) || 0;
  });
  // Any large/unknown file → one worker only (no overlapping GB streams).
  const serialize =
    estimates.some((n) => isLargeFile(n)) || !estimatedBytesByPath;
  let nextIndex = 0;
  let cancelledBatch = false;

  const worker = async () => {
    while (true) {
      if (signal?.aborted || cancelledBatch) break;
      const i = nextIndex++;
      if (i >= paths.length) return;

      const filePath = paths[i];
      const saveAsName = saveNames[i];
      const estimatedBytes = estimates[i] || null;
      const fileSignal = signalsByPath?.[filePath] || null;

      // Already cancelled via row ✕ before we reached this file — skip, keep going.
      if (fileSignal?.aborted && !signal?.aborted) {
        results[i] = { filePath, success: false, cancelled: true };
        continue;
      }

      const combinedSignal = mergeAbortSignals(signal, fileSignal);

      try {
        await downloadFilePresigned({
          apiUrl,
          token,
          filePath,
          shared,
          signal: combinedSignal,
          dirHandle,
          saveAsName,
          estimatedBytes,
          onProgress: (percent) => onFileProgress?.(filePath, percent),
        });
        results[i] = { filePath, success: true, cancelled: false, saveAsName };
        // Let Chrome release FS / network staging before the next large file.
        if (isLargeFile(estimatedBytes)) {
          await delay(1500);
        }
      } catch (err) {
        if (isDownloadCancelledError(err)) {
          results[i] = { filePath, success: false, cancelled: true };
          // Cancel all (batch signal) → stop remaining. Per-file ✕ → continue.
          if (signal?.aborted) {
            cancelledBatch = true;
            return;
          }
          continue;
        }
        results[i] = {
          filePath,
          success: false,
          cancelled: false,
          error: err,
        };
      }
    }
  };

  const pool = Math.min(
    serialize ? 1 : MULTI_DOWNLOAD_CONCURRENCY,
    paths.length
  );
  await Promise.all(Array.from({ length: pool }, () => worker()));

  for (let i = 0; i < paths.length; i += 1) {
    if (results[i] == null) {
      results[i] = {
        filePath: paths[i],
        success: false,
        cancelled: Boolean(signal?.aborted || cancelledBatch),
      };
    }
  }

  return { mode: "directory", results, dirHandle };
}

/**
 * Fetch one folder entry (prefer listing presigned URL, else /download-file).
 * Caller must call releaseLargeSlot() when heldLargeSlot is true (after write).
 */
export async function fetchFolderEntryResponse({
  apiUrl,
  token,
  entry,
  shared,
  signal,
}) {
  const filePath = entry?.filePath || entry?.relativePath;
  const sizeBytes = Number(entry?.size) || 0;
  let heldLargeSlot = false;

  if (isLargeFile(sizeBytes)) {
    await acquireLargeSlot(signal);
    heldLargeSlot = true;
  }

  const release = () => {
    if (!heldLargeSlot) return;
    heldLargeSlot = false;
    releaseLargeSlot();
  };

  try {
    if (entry?.url && storageFetchWorks !== false) {
      try {
        const response = await fetchPresignedObject(entry.url, signal);
        storageFetchWorks = true;
        return {
          response,
          fileName: baseFileName(filePath),
          sizeBytes,
          mode: "presigned",
          heldLargeSlot,
          releaseLargeSlot: release,
          activityEventId: entry?.activityEventId || null,
        };
      } catch (err) {
        if (isAbortLike(err)) throw err;
        if (isLikelyCorsBlockedError(err)) {
          storageFetchWorks = false;
        }
        console.warn(
          "[download] Folder entry direct fetch failed; using /download-file proxy.",
          err?.message || err
        );
      }
    }

    const response = await fetchViaProxy({
      apiUrl,
      token,
      filePath,
      shared,
      signal,
    });
    return {
      response,
      fileName: baseFileName(filePath),
      sizeBytes,
      mode: "proxy",
      heldLargeSlot,
      releaseLargeSlot: release,
      activityEventId: entry?.activityEventId || null,
    };
  } catch (err) {
    release();
    throw err;
  }
}
