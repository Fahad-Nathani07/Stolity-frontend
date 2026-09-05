import axios from "axios";

export const FOLDER_UPLOAD_PART_SIZE = 10 * 1024 * 1024;
export const FOLDER_UPLOAD_GAP_MS = 900;

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

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function startMultipartUpload({
  apiUrl,
  token,
  fileName,
  folderPath,
  visibility = "private",
  shared,
}) {
  const url = buildAwsUrl(apiUrl, "start-multipart-upload");
  const basename = String(fileName || "").replace(/^.*[\\/]/, "");
  let adjustedFolderPath = cleanPathSegment(folderPath);
  const params = {};

  if (shared) {
    adjustedFolderPath = stripSharedPrefix(adjustedFolderPath, shared);
    params.shared = shared;
  }

  const payload = adjustedFolderPath
    ? {
        fileName: basename,
        folderPath: adjustedFolderPath,
        visibility: normalizeVisibility(visibility),
      }
    : {
        fileName: basename,
        visibility: normalizeVisibility(visibility),
      };

  const resp = await axios.post(url, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    params,
  });
  return resp.data;
}

export async function uploadMultipartPart({
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
      "Content-Type": fileType || "application/octet-stream",
    },
    params: shared ? { shared } : undefined,
    signal,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });

  const etag =
    (resp.headers && (resp.headers.etag || resp.headers.ETag)) ||
    (resp.data && (resp.data.ETag || resp.data.etag)) ||
    null;

  return { etag, resp };
}

export async function completeMultipartUpload({
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
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      params: shared ? { shared } : undefined,
    }
  );
  return resp.data;
}

export async function abortMultipartUpload({
  apiUrl,
  token,
  key,
  uploadId,
  shared,
}) {
  const url = buildAwsUrl(apiUrl, "abort-multipart-upload");
  try {
    await axios.post(
      url,
      { key, uploadId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        params: shared ? { shared } : undefined,
      }
    );
  } catch (e) {
    console.error("Abort multipart failed", e);
  }
}

function defaultIsVideoFile(filename) {
  const videoExtensions = ["mp4", "mkv", "avi", "mov", "flv", "wmv", "webm"];
  const ext = String(filename || "").split(".").pop().toLowerCase();
  return videoExtensions.includes(ext);
}

function defaultSanitizeFilename(filename) {
  return String(filename || "").replace(/[^\w.\-()+\s]/g, "_");
}

/**
 * Upload a selected folder as N multipart file uploads (preserves nested paths).
 */
export async function uploadFolderViaMultipart({
  apiUrl,
  token,
  fileList,
  basePath = "",
  folderName = "folder",
  visibility = "private",
  shared,
  remainingBytes,
  sanitizeFilename = defaultSanitizeFilename,
  isVideoFile = defaultIsVideoFile,
  uploads,
  addUpload,
  updateUploadProgress,
  updateUploadMeta,
  removeUpload,
  getUpload,
  isPausing,
  onBeforeStart,
  partSize = FOLDER_UPLOAD_PART_SIZE,
  gapMs = FOLDER_UPLOAD_GAP_MS,
}) {
  if (!fileList?.length) {
    return { status: "empty" };
  }

  if (uploads && uploads.length > 0) {
    return { status: "busy" };
  }

  const totalSize = fileList.reduce(
    (acc, item) => acc + (item.file?.size || 0),
    0
  );
  if (
    typeof remainingBytes === "number" &&
    remainingBytes >= 0 &&
    totalSize > remainingBytes
  ) {
    return { status: "quota", totalSize, remainingBytes };
  }

  const displayName = folderName || "folder";
  const cleanedBase = cleanPathSegment(basePath);

  if (typeof onBeforeStart === "function") {
    onBeforeStart({ displayName, fileCount: fileList.length, totalSize });
  }

  const waitUntilResumed = (uploadUiId) =>
    new Promise((resolve, reject) => {
      const interval = setInterval(() => {
        const pausingIntent = isPausing ? !!isPausing(uploadUiId) : false;
        const u = getUpload ? getUpload(uploadUiId) : null;
        if (pausingIntent) return;
        if (u && !u.paused) {
          clearInterval(interval);
          resolve();
          return;
        }
        if (!pausingIntent && !u) {
          clearInterval(interval);
          reject(new Error("upload-removed"));
        }
      }, 300);
    });

  const uploadEntries = fileList.map((fileInfo, i) => {
    const file = fileInfo.file;
    const originalName = file.name;
    const sanitizedName = isVideoFile(originalName)
      ? sanitizeFilename(originalName)
      : originalName;
    const relativeDir = cleanPathSegment(
      fileInfo.path ||
        String(fileInfo.relativePath || "").replace(/\/[^/]+$/, "") ||
        ""
    );
    const folderPathForFile = [cleanedBase, relativeDir]
      .filter(Boolean)
      .join("/");
    const uploadUiId = Date.now() + i;
    const controller =
      typeof AbortController !== "undefined" ? new AbortController() : null;
    const labelPath = folderPathForFile
      ? `${folderPathForFile}/${sanitizedName}`
      : sanitizedName;

    addUpload(uploadUiId, "Uploading " + labelPath, {
      controller,
      operation: "upload",
      sizeInBytes: file.size || 0,
      isFolder: false,
    });

    return {
      file,
      uploadUiId,
      sanitizedName,
      folderPathForFile,
      controller,
    };
  });

  const results = [];
  let batchCanceled = false;

  for (let i = 0; i < uploadEntries.length; i++) {
    const { file, uploadUiId, sanitizedName, folderPathForFile, controller } =
      uploadEntries[i];

    if (!getUpload?.(uploadUiId)) {
      results.push({ status: "fulfilled", value: "canceled" });
      const anyLeft = uploadEntries
        .slice(i + 1)
        .some((e) => getUpload?.(e.uploadUiId));
      if (!anyLeft) {
        for (let j = i + 1; j < uploadEntries.length; j++) {
          results.push({ status: "fulfilled", value: "canceled" });
        }
        batchCanceled = true;
        break;
      }
      continue;
    }

    if (getUpload?.(uploadUiId)?.paused || isPausing?.(uploadUiId)) {
      try {
        await waitUntilResumed(uploadUiId);
      } catch {
        results.push({ status: "fulfilled", value: "canceled" });
        const anyLeft = uploadEntries
          .slice(i + 1)
          .some((e) => getUpload?.(e.uploadUiId));
        if (!anyLeft) {
          for (let j = i + 1; j < uploadEntries.length; j++) {
            results.push({ status: "fulfilled", value: "canceled" });
          }
          batchCanceled = true;
          break;
        }
        continue;
      }
    }

    try {
      const basename = sanitizedName.replace(/^.*[\\/]/, "");
      let startResp;
      try {
        startResp = await startMultipartUpload({
          apiUrl,
          token,
          fileName: basename,
          folderPath: folderPathForFile || undefined,
          visibility,
          shared,
        });
      } catch (err) {
        removeUpload(uploadUiId);
        results.push({ status: "rejected", reason: err });
        if (
          i < uploadEntries.length - 1 &&
          getUpload?.(uploadEntries[i + 1]?.uploadUiId)
        ) {
          await delay(gapMs);
        }
        continue;
      }

      if (!getUpload?.(uploadUiId)) {
        try {
          const keyEarly = startResp.key || startResp.data?.key;
          const uploadIdEarly = startResp.uploadId || startResp.data?.uploadId;
          if (keyEarly && uploadIdEarly) {
            await abortMultipartUpload({
              apiUrl,
              token,
              key: keyEarly,
              uploadId: uploadIdEarly,
              shared,
            });
          }
        } catch {
          /* ignore */
        }
        results.push({ status: "fulfilled", value: "canceled" });
        const anyLeft = uploadEntries
          .slice(i + 1)
          .some((e) => getUpload?.(e.uploadUiId));
        if (!anyLeft) {
          for (let j = i + 1; j < uploadEntries.length; j++) {
            results.push({ status: "fulfilled", value: "canceled" });
          }
          batchCanceled = true;
          break;
        }
        continue;
      }

      const key = startResp.key || startResp.data?.key;
      const uploadId = startResp.uploadId || startResp.data?.uploadId;

      if (!key || !uploadId) {
        removeUpload(uploadUiId);
        results.push({
          status: "rejected",
          reason: new Error("Invalid start-multipart response"),
        });
        if (
          i < uploadEntries.length - 1 &&
          getUpload?.(uploadEntries[i + 1]?.uploadUiId)
        ) {
          await delay(gapMs);
        }
        continue;
      }

      const ctxController = getUpload?.(uploadUiId)?.controller;
      const liveController =
        ctxController && !ctxController.signal?.aborted
          ? ctxController
          : controller && !controller.signal?.aborted
            ? controller
            : typeof AbortController !== "undefined"
              ? new AbortController()
              : null;

      if (typeof updateUploadMeta === "function") {
        updateUploadMeta(uploadUiId, {
          key,
          uploadId,
          controller: liveController,
          currentPart: 1,
        });
      }

      const fileSize = file.size || 0;
      const partsCount = Math.max(1, Math.ceil(fileSize / partSize) || 1);
      const partsArray = [];
      let partFailed = false;

      for (let pi = 0; pi < partsCount; pi++) {
        if (!getUpload?.(uploadUiId) && !isPausing?.(uploadUiId)) {
          await abortMultipartUpload({
            apiUrl,
            token,
            key,
            uploadId,
            shared,
          });
          results.push({ status: "fulfilled", value: "canceled" });
          partFailed = true;
          batchCanceled = true;
          break;
        }

        const start = pi * partSize;
        const end = Math.min(start + partSize, fileSize);
        const chunk = file.slice(start, end);
        const partNumber = pi + 1;

        try {
          const currentController =
            getUpload?.(uploadUiId)?.controller || controller;

          const { etag } = await uploadMultipartPart({
            apiUrl,
            token,
            partNumber,
            uploadId,
            key,
            chunk,
            fileType: file.type,
            signal: currentController ? currentController.signal : undefined,
            shared,
          });

          if (!etag) throw new Error("No ETag returned for uploaded part");

          partsArray.push({
            ETag: etag,
            PartNumber: partNumber,
          });

          const progress =
            fileSize > 0 ? Math.round((end * 100) / fileSize) : 100;
          updateUploadProgress(uploadUiId, progress);
          if (typeof updateUploadMeta === "function") {
            updateUploadMeta(uploadUiId, { currentPart: partNumber + 1 });
          }
        } catch (err) {
          const isCanceled =
            err &&
            (err.name === "CanceledError" ||
              err.code === "ERR_CANCELED" ||
              /canceled/i.test(err.message || "") ||
              /abort/i.test(err.message || ""));

          if (isCanceled) {
            const maybeUpload = getUpload ? getUpload(uploadUiId) : null;
            const pausingIntent = isPausing ? isPausing(uploadUiId) : false;

            if ((maybeUpload && maybeUpload.paused) || pausingIntent) {
              try {
                await waitUntilResumed(uploadUiId);
                pi = pi - 1;
                continue;
              } catch {
                await abortMultipartUpload({
                  apiUrl,
                  token,
                  key,
                  uploadId,
                  shared,
                });
                removeUpload(uploadUiId);
                results.push({ status: "fulfilled", value: "canceled" });
                partFailed = true;
                break;
              }
            }

            await abortMultipartUpload({
              apiUrl,
              token,
              key,
              uploadId,
              shared,
            });
            removeUpload(uploadUiId);
            results.push({ status: "fulfilled", value: "canceled" });
            partFailed = true;
            batchCanceled = true;
            break;
          }

          await abortMultipartUpload({
            apiUrl,
            token,
            key,
            uploadId,
            shared,
          });
          removeUpload(uploadUiId);
          results.push({ status: "rejected", reason: err });
          partFailed = true;
          break;
        }
      }

      if (batchCanceled) {
        for (let j = i + 1; j < uploadEntries.length; j++) {
          results.push({ status: "fulfilled", value: "canceled" });
        }
        break;
      }

      if (!partFailed) {
        try {
          await completeMultipartUpload({
            apiUrl,
            token,
            key,
            uploadId,
            parts: partsArray,
            shared,
          });
          updateUploadProgress(uploadUiId, 100);
          results.push({ status: "fulfilled", value: "success" });
        } catch (err) {
          await abortMultipartUpload({
            apiUrl,
            token,
            key,
            uploadId,
            shared,
          });
          removeUpload(uploadUiId);
          results.push({ status: "rejected", reason: err });
        }
      }
    } catch (err) {
      results.push({ status: "rejected", reason: err });
    }

    if (
      i < uploadEntries.length - 1 &&
      getUpload?.(uploadEntries[i + 1]?.uploadUiId)
    ) {
      await delay(gapMs);
    }
  }

  uploadEntries.forEach(({ uploadUiId }) => {
    try {
      if (getUpload?.(uploadUiId)) updateUploadProgress(uploadUiId, 100);
    } catch {
      /* ignore */
    }
  });
  setTimeout(() => {
    uploadEntries.forEach(({ uploadUiId }) => {
      try {
        removeUpload(uploadUiId);
      } catch {
        /* ignore */
      }
    });
  }, 800);

  const allCanceled = results.every(
    (r) => r.status === "fulfilled" && r.value === "canceled"
  );
  const anyFailed = results.some((r) => r.status === "rejected");
  const anySucceeded = results.some(
    (r) => r.status === "fulfilled" && r.value === "success"
  );
  const anyCanceled = results.some(
    (r) => r.status === "fulfilled" && r.value === "canceled"
  );

  return {
    status: "done",
    displayName,
    results,
    allCanceled,
    anyFailed,
    anySucceeded,
    anyCanceled,
  };
}
