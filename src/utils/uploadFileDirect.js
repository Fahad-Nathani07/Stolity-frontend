import axios from "axios";
import { queueActivityStatus, queueDeleteActivityEvent } from "./activityReport";

/** Files smaller than this try single PUT first; otherwise multipart direct. */
export const DIRECT_PUT_MAX_BYTES = 100 * 1024 * 1024;
export const DIRECT_PART_SIZE = 10 * 1024 * 1024;
export const DIRECT_UPLOAD_GAP_MS = 900;

/**
 * null = unknown, true = last direct attempt worked.
 * We still try direct on every file (CORS may have been fixed); this is only for logging.
 */
let directUploadWorks = null;
let warnedDirectFallback = false;

export function buildAwsUrl(apiUrlRaw, endpointPath) {
  const base = String(apiUrlRaw || "").replace(/\/+$/, "");
  const ep = String(endpointPath || "").replace(/^\/+/, "");
  if (base.match(/\/aws(\/|$)/)) {
    return `${base}/${ep}`;
  }
  return `${base}/aws/${ep}`;
}

function normalizeVisibility(visibility) {
  if (visibility === "public-read" || visibility === "public") return "public";
  if (visibility === "private") return "private";
  return "private";
}

function cleanPathSegment(value) {
  return String(value || "")
    .replace(/\\/g, "/")
    .replace(/^\/+|\/+$/g, "")
    .replace(/\/+/g, "/");
}

function stripSharedPrefix(folderPath, sharedRoot) {
  if (!sharedRoot) return folderPath;
  const escaped = String(sharedRoot).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return cleanPathSegment(
    String(folderPath || "")
      .replace(new RegExp(`^${escaped}(/|$)`), "")
      .replace(/\/$/, "")
  );
}

function adjustFolderPath(folderPath, shared) {
  let adjusted = cleanPathSegment(folderPath);
  if (shared) adjusted = stripSharedPrefix(adjusted, shared);
  return adjusted || undefined;
}

function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

function sharedParams(shared) {
  return shared ? { shared } : undefined;
}

function pickEtag(headers, data) {
  // Prefer JSON body ETag from our API. Express auto-sets a response ETag header
  // that is NOT the S3 part ETag — using it causes Complete → InvalidPart.
  const fromBody = data && (data.ETag || data.etag);
  const fromHeaders =
    headers && (headers.etag || headers.ETag || headers["ETag"]);
  let raw = fromBody || fromHeaders || null;
  if (!raw) return null;
  let etag = String(raw).trim();
  if (/^W\//i.test(etag)) etag = etag.replace(/^W\//i, "").trim();
  if (etag && !etag.startsWith('"')) etag = `"${etag}"`;
  return etag;
}

function isCanceledError(err) {
  if (!err) return false;
  if (err.name === "UploadCanceled" || err.message === "upload-removed") {
    return true;
  }
  if (
    err.name === "CanceledError" ||
    err.name === "AbortError" ||
    err.code === "ERR_CANCELED"
  ) {
    return true;
  }
  const msg = String(err.message || "");
  // Do NOT match generic "abort" — CORS/net::ERR_ABORTED must fall back to proxy
  return /^canceled$/i.test(msg) || /upload[- ]?removed/i.test(msg);
}

/** CORS / Spaces / missing ETag / new API not deployed → try proxy multipart. */
function shouldFallbackToProxy(err) {
  if (!err) return false;
  if (err.name === "UploadCanceled" || err.message === "upload-removed") {
    return false;
  }
  // User-initiated AbortController → never fall back
  if (err.name === "CanceledError" || err.code === "ERR_CANCELED") {
    return false;
  }

  const msg = String(err.message || err.code || "").toLowerCase();
  if (
    msg.includes("etag") ||
    msg.includes("cors") ||
    msg.includes("network error") ||
    msg.includes("err_network") ||
    msg.includes("err_failed") ||
    msg.includes("err_aborted") ||
    msg.includes("failed to fetch") ||
    msg.includes("access-control") ||
    msg.includes("signaturedoesnotmatch") ||
    msg.includes("presign")
  ) {
    return true;
  }

  if (err.name === "TypeError") return true;
  if (err.code === "ERR_NETWORK" || err.code === "ECONNABORTED") return true;

  const status = err.response?.status || err.status;
  if (status === 404 || status === 403 || status === 0) return true;

  // Axios opaque network failure (often CORS)
  if (!err.response && err.request) return true;

  return false;
}

function markDirectBroken(detail) {
  directUploadWorks = false;
  if (!warnedDirectFallback) {
    warnedDirectFallback = true;
    console.warn(
      "[upload] Direct DigitalOcean upload failed (often CORS); using proxy multipart fallback.",
      detail || ""
    );
  }
}

function markDirectOk() {
  directUploadWorks = true;
  warnedDirectFallback = false;
}

// ---------- Direct APIs ----------

export async function presignPutObject({
  apiUrl,
  token,
  fileName,
  folderPath,
  fileType,
  visibility = "private",
  fileSize,
  shared,
}) {
  const url = buildAwsUrl(apiUrl, "presign-put-object");
  const basename = String(fileName || "").replace(/^.*[\\/]/, "");
  const payload = {
    fileName: basename,
    visibility: normalizeVisibility(visibility),
    fileType: fileType || undefined,
    fileSize: fileSize != null ? fileSize : undefined,
  };
  const adjusted = adjustFolderPath(folderPath, shared);
  if (adjusted) payload.folderPath = adjusted;

  const resp = await axios.post(url, payload, {
    headers: authHeaders(token),
    params: sharedParams(shared),
  });
  return resp.data;
}

export async function startMultipartUploadDirect({
  apiUrl,
  token,
  fileName,
  folderPath,
  fileType,
  visibility = "private",
  shared,
}) {
  const url = buildAwsUrl(apiUrl, "start-multipart-upload-direct");
  const basename = String(fileName || "").replace(/^.*[\\/]/, "");
  const payload = {
    fileName: basename,
    visibility: normalizeVisibility(visibility),
    fileType: fileType || undefined,
  };
  const adjusted = adjustFolderPath(folderPath, shared);
  if (adjusted) payload.folderPath = adjusted;

  const resp = await axios.post(url, payload, {
    headers: authHeaders(token),
    params: sharedParams(shared),
  });
  return resp.data;
}

export async function presignUploadParts({
  apiUrl,
  token,
  key,
  uploadId,
  partNumbers,
  shared,
}) {
  const url = buildAwsUrl(apiUrl, "presign-upload-parts");
  const resp = await axios.post(
    url,
    { key, uploadId, partNumbers },
    {
      headers: authHeaders(token),
      params: sharedParams(shared),
    }
  );
  return resp.data;
}

export async function completeMultipartUploadDirect({
  apiUrl,
  token,
  key,
  uploadId,
  parts,
  shared,
}) {
  const url = buildAwsUrl(apiUrl, "complete-multipart-upload-direct");
  const resp = await axios.post(
    url,
    { key, uploadId, parts },
    {
      headers: authHeaders(token),
      params: sharedParams(shared),
    }
  );
  return resp.data;
}

export async function abortMultipartUploadDirect({
  apiUrl,
  token,
  key,
  uploadId,
  shared,
  mode,
}) {
  if (!key || !uploadId) return;
  const tryAbort = async (endpoint) => {
    const url = buildAwsUrl(apiUrl, endpoint);
    await axios.post(
      url,
      { key, uploadId },
      {
        headers: authHeaders(token),
        params: sharedParams(shared),
      }
    );
  };
  // Proxy-created uploads → proxy abort only (avoids noisy 500 on *-direct)
  if (mode === "proxy" || mode === "proxy-fallback") {
    try {
      await tryAbort("abort-multipart-upload");
    } catch (e) {
      console.error("Abort proxy multipart failed", e);
    }
    return;
  }
  try {
    await tryAbort("abort-multipart-upload-direct");
  } catch {
    try {
      await tryAbort("abort-multipart-upload");
    } catch (e) {
      console.error("Abort multipart failed", e);
    }
  }
}

// ---------- Proxy multipart (legacy fallback) ----------

async function startMultipartUploadProxy({
  apiUrl,
  token,
  fileName,
  folderPath,
  fileType,
  visibility = "private",
  shared,
}) {
  const url = buildAwsUrl(apiUrl, "start-multipart-upload");
  const basename = String(fileName || "").replace(/^.*[\\/]/, "");
  const payload = {
    fileName: basename,
    visibility: normalizeVisibility(visibility),
    fileType: fileType || undefined,
  };
  const adjusted = adjustFolderPath(folderPath, shared);
  if (adjusted) payload.folderPath = adjusted;

  const resp = await axios.post(url, payload, {
    headers: authHeaders(token),
    params: sharedParams(shared),
  });
  return resp.data;
}

async function uploadMultipartPartProxy({
  apiUrl,
  token,
  partNumber,
  uploadId,
  key,
  chunk,
  fileType,
  signal,
  shared,
}) {
  const encodedKey = encodeURIComponent(key);
  const url = buildAwsUrl(
    apiUrl,
    `upload-part?partNumber=${partNumber}&uploadId=${encodeURIComponent(
      uploadId
    )}&key=${encodedKey}`
  );

  const resp = await axios.post(url, chunk, {
    headers: {
      Authorization: `Bearer ${token}`,
      // Always octet-stream so body parsers never treat the part as JSON
      "Content-Type": "application/octet-stream",
    },
    params: sharedParams(shared),
    signal,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });

  const etag = pickEtag(resp.headers, resp.data);
  return { etag, resp };
}

async function completeMultipartUploadProxy({
  apiUrl,
  token,
  key,
  uploadId,
  parts,
  shared,
}) {
  const url = buildAwsUrl(apiUrl, "complete-multipart-upload");
  const resp = await axios.post(
    url,
    { key, uploadId, parts },
    {
      headers: authHeaders(token),
      params: sharedParams(shared),
    }
  );
  return resp.data;
}

async function abortMultipartUploadProxy({
  apiUrl,
  token,
  key,
  uploadId,
  shared,
}) {
  if (!key || !uploadId) return;
  const url = buildAwsUrl(apiUrl, "abort-multipart-upload");
  try {
    await axios.post(
      url,
      { key, uploadId },
      {
        headers: authHeaders(token),
        params: sharedParams(shared),
      }
    );
  } catch (e) {
    console.error("Abort proxy multipart failed", e);
  }
}

async function putToSpaces({
  url,
  body,
  headers,
  signal,
  onUploadProgress,
  stripContentType = false,
}) {
  const resp = await axios.put(url, body, {
    headers,
    signal,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    onUploadProgress,
    transformRequest: stripContentType
      ? [
          (data, reqHeaders) => {
            if (reqHeaders) {
              delete reqHeaders["Content-Type"];
              delete reqHeaders["content-type"];
            }
            return data;
          },
        ]
      : undefined,
  });
  return resp;
}

async function uploadViaProxyMultipart({
  apiUrl,
  token,
  file,
  basename,
  folderPath,
  visibility,
  shared,
  liveSignal,
  onProgress,
  onMeta,
  checkRemoved,
  handlePauseOrCancel,
  partSize,
}) {
  checkRemoved();
  const startResp = await startMultipartUploadProxy({
    apiUrl,
    token,
    fileName: basename,
    folderPath,
    fileType: file.type || undefined,
    visibility,
    shared,
  });

  const key = startResp.key || startResp.data?.key;
  const uploadId = startResp.uploadId || startResp.data?.uploadId;
  if (!key || !uploadId) {
    throw new Error("Invalid start-multipart-upload (proxy) response");
  }

  if (typeof onMeta === "function") {
    onMeta({ key, uploadId, mode: "proxy" });
  }

  const totalSize = file.size || 0;
  const partsCount = Math.max(1, Math.ceil(totalSize / partSize) || 1);
  const partsArray = [];

  try {
    for (let pi = 0; pi < partsCount; pi++) {
      checkRemoved();
      const start = pi * partSize;
      const end = Math.min(start + partSize, totalSize);
      const chunk = file.slice(start, end);
      const partNumber = pi + 1;

      // eslint-disable-next-line no-constant-condition
      while (true) {
        try {
          checkRemoved();
          const { etag } = await uploadMultipartPartProxy({
            apiUrl,
            token,
            partNumber,
            uploadId,
            key,
            chunk,
            fileType: file.type,
            signal: liveSignal() || undefined,
            shared,
          });
          if (!etag) throw new Error("No ETag returned for proxy uploaded part");

          partsArray.push({ ETag: etag, PartNumber: partNumber });
          if (onProgress) {
            onProgress(
              totalSize > 0 ? Math.round((end * 100) / totalSize) : 100
            );
          }
          break;
        } catch (err) {
          const action = await handlePauseOrCancel(err);
          if (action === "retry") continue;
          throw err;
        }
      }
    }

    checkRemoved();
    await completeMultipartUploadProxy({
      apiUrl,
      token,
      key,
      uploadId,
      parts: partsArray,
      shared,
    });
    if (onProgress) onProgress(100);
    return "success";
  } catch (err) {
    await abortMultipartUploadProxy({
      apiUrl,
      token,
      key,
      uploadId,
      shared,
    });
    throw err;
  }
}

async function uploadViaDirectSpaces({
  apiUrl,
  token,
  file,
  basename,
  folderPath,
  visibility,
  shared,
  liveSignal,
  onProgress,
  onMeta,
  checkRemoved,
  handlePauseOrCancel,
  partSize,
}) {
  const totalSize = file?.size || 0;

  // ---------- Single PUT (< 100MB) ----------
  if (totalSize < DIRECT_PUT_MAX_BYTES) {
    checkRemoved();
    const start = await presignPutObject({
      apiUrl,
      token,
      fileName: basename,
      folderPath,
      fileType: file.type || undefined,
      visibility,
      fileSize: totalSize,
      shared,
    });

    const key = start.key;
    const putUrl = start.url;
    const putHeaders = start.headers || {
      "Content-Type":
        start.contentType || file.type || "application/octet-stream",
      "x-amz-acl": start.acl || "private",
    };

    if (!putUrl || !key) {
      throw new Error("Invalid presign-put-object response");
    }

    if (typeof onMeta === "function") {
      onMeta({ key, uploadId: null, mode: "put" });
    }

    checkRemoved();

    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        checkRemoved();
        await putToSpaces({
          url: putUrl,
          body: file,
          headers: putHeaders,
          signal: liveSignal() || undefined,
          onUploadProgress: (evt) => {
            if (!onProgress || !totalSize) return;
            const loaded = evt.loaded || 0;
            onProgress(Math.min(100, Math.round((loaded * 100) / totalSize)));
          },
        });
        if (onProgress) onProgress(100);
        if (start.activityEventId) {
          queueActivityStatus({
            apiUrl,
            token,
            eventId: start.activityEventId,
            status: "COMPLETED",
          });
        }
        return "success";
      } catch (err) {
        // Attach id so outer proxy-fallback can delete the REQUESTED row.
        if (start?.activityEventId) {
          err.activityEventId = start.activityEventId;
        }

        if (isCanceledError(err)) {
          const action = await handlePauseOrCancel(err);
          if (action === "retry") continue;
          if (start?.activityEventId) {
            queueDeleteActivityEvent({
              apiUrl,
              token,
              eventId: start.activityEventId,
            });
          }
          throw err;
        }

        // CORS / network → will fall back to proxy; drop the direct REQUESTED event.
        if (start?.activityEventId) {
          queueDeleteActivityEvent({
            apiUrl,
            token,
            eventId: start.activityEventId,
          });
        }
        throw err;
      }
    }
  }

  // ---------- Multipart direct (≥ 100MB) ----------
  checkRemoved();
  const startResp = await startMultipartUploadDirect({
    apiUrl,
    token,
    fileName: basename,
    folderPath,
    fileType: file.type || undefined,
    visibility,
    shared,
  });

  const key = startResp.key || startResp.data?.key;
  const uploadId = startResp.uploadId || startResp.data?.uploadId;
  if (!key || !uploadId) {
    throw new Error("Invalid start-multipart-upload-direct response");
  }

  if (typeof onMeta === "function") {
    onMeta({ key, uploadId, mode: "multipart" });
  }

  const partsCount = Math.max(1, Math.ceil(totalSize / partSize) || 1);
  const partsArray = [];

  try {
    for (let pi = 0; pi < partsCount; pi++) {
      checkRemoved();

      const start = pi * partSize;
      const end = Math.min(start + partSize, totalSize);
      const chunk = file.slice(start, end);
      const partNumber = pi + 1;

      // eslint-disable-next-line no-constant-condition
      while (true) {
        try {
          checkRemoved();
          const signed = await presignUploadParts({
            apiUrl,
            token,
            key,
            uploadId,
            partNumbers: [partNumber],
            shared,
          });
          const partUrl = signed?.parts?.[0]?.url;
          if (!partUrl) {
            throw new Error(`No presigned URL for part ${partNumber}`);
          }

          const resp = await putToSpaces({
            url: partUrl,
            body: chunk,
            headers: {},
            stripContentType: true,
            signal: liveSignal() || undefined,
            onUploadProgress: (evt) => {
              if (!onProgress || !totalSize) return;
              const partLoaded = evt.loaded || 0;
              const uploadedBytes = start + partLoaded;
              onProgress(
                Math.min(99, Math.round((uploadedBytes * 100) / totalSize))
              );
            },
          });

          const etag = pickEtag(resp.headers, resp.data);
          if (!etag) {
            throw new Error(
              "No ETag from Spaces (check CORS ExposeHeaders: ETag)"
            );
          }

          partsArray.push({ ETag: etag, PartNumber: partNumber });
          if (onProgress) {
            onProgress(
              totalSize > 0 ? Math.round((end * 100) / totalSize) : 100
            );
          }
          break;
        } catch (err) {
          const action = await handlePauseOrCancel(err);
          if (action === "retry") continue;
          throw err;
        }
      }
    }

    checkRemoved();
    await completeMultipartUploadDirect({
      apiUrl,
      token,
      key,
      uploadId,
      parts: partsArray,
      shared,
    });
    if (onProgress) onProgress(100);
    return "success";
  } catch (err) {
    await abortMultipartUploadDirect({
      apiUrl,
      token,
      key,
      uploadId,
      shared,
    });
    throw err;
  }
}

/**
 * Upload one File: try Spaces direct first; on CORS / Spaces failure use
 * legacy proxy multipart (start → upload-part → complete).
 *
 * < 100MB → try PUT; ≥ 100MB → try multipart direct.
 * Cancel / pause never fall back.
 */
export async function uploadOneFileDirect({
  apiUrl,
  token,
  file,
  fileName,
  folderPath,
  visibility = "private",
  shared,
  signal,
  getSignal,
  onProgress,
  onMeta,
  shouldAbort,
  waitIfPaused,
  partSize = DIRECT_PART_SIZE,
}) {
  const basename = String(fileName || file?.name || "").replace(/^.*[\\/]/, "");

  const checkRemoved = () => {
    if (typeof shouldAbort === "function" && shouldAbort()) {
      const err = new Error("upload-removed");
      err.name = "UploadCanceled";
      throw err;
    }
  };

  const handlePauseOrCancel = async (err) => {
    // Real network/CORS errors must propagate (for proxy fallback), not retry-as-pause
    if (!isCanceledError(err)) throw err;
    if (err?.name === "UploadCanceled") throw err;

    if (typeof waitIfPaused === "function") {
      try {
        await waitIfPaused();
        const sig =
          (typeof getSignal === "function" ? getSignal() : null) || signal;
        // Still aborted and not a real resume → treat as cancel
        if (sig?.aborted) {
          const canceled = new Error("upload-removed");
          canceled.name = "UploadCanceled";
          throw canceled;
        }
        return "retry";
      } catch {
        const canceled = new Error("upload-removed");
        canceled.name = "UploadCanceled";
        throw canceled;
      }
    }
    const canceled = new Error("upload-removed");
    canceled.name = "UploadCanceled";
    throw canceled;
  };

  const liveSignalSafe = () => {
    const s =
      (typeof getSignal === "function" ? getSignal() : null) || signal || null;
    if (s?.aborted) return undefined;
    return s || undefined;
  };

  const sharedArgs = {
    apiUrl,
    token,
    file,
    basename,
    folderPath,
    visibility,
    shared,
    liveSignal: liveSignalSafe,
    onProgress,
    onMeta,
    checkRemoved,
    handlePauseOrCancel,
    partSize,
  };

  const runProxyFallback = async (reason) => {
    markDirectBroken(reason);
    if (onProgress) onProgress(0);
    if (typeof onMeta === "function") {
      onMeta({ needsNewController: true, mode: "proxy-fallback" });
    }
    checkRemoved();
    return uploadViaProxyMultipart(sharedArgs);
  };

  // Always try direct first (PUT <100MB, multipart direct ≥100MB).
  // Do not sticky-skip — CORS may be fixed mid-session; each file gets a chance.
  try {
    const result = await uploadViaDirectSpaces(sharedArgs);
    markDirectOk();
    return result;
  } catch (err) {
    if (err?.name === "UploadCanceled" || err?.message === "upload-removed") {
      throw err;
    }

    // User canceled / removed upload from UI
    if (typeof shouldAbort === "function" && shouldAbort()) {
      throw err;
    }

    // CORS / Spaces / network → proxy multipart
    if (shouldFallbackToProxy(err)) {
      if (err?.activityEventId) {
        queueDeleteActivityEvent({
          apiUrl,
          token,
          eventId: err.activityEventId,
        });
      }
      return runProxyFallback(err?.message || err);
    }

    throw err;
  }
}
