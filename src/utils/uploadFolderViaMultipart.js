import {
  uploadOneFileDirect,
  abortMultipartUploadDirect,
  buildAwsUrl,
  DIRECT_PART_SIZE,
  DIRECT_UPLOAD_GAP_MS,
} from "./uploadFileDirect";

export { buildAwsUrl };
export const FOLDER_UPLOAD_PART_SIZE = DIRECT_PART_SIZE;
export const FOLDER_UPLOAD_GAP_MS = DIRECT_UPLOAD_GAP_MS;

function cleanPathSegment(value) {
  return String(value || "")
    .replace(/\\/g, "/")
    .replace(/^\/+|\/+$/g, "")
    .replace(/\/+/g, "/");
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
 * Upload a selected folder via Spaces direct APIs (preserves nested paths).
 * <100MB files use PUT; larger use multipart direct.
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
    let folderPathForFile = [cleanedBase, relativeDir]
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

    let activeKey = null;
    let activeUploadId = null;
    let activeMode = null;

    try {
      const basename = sanitizedName.replace(/^.*[\\/]/, "");
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
        updateUploadMeta(uploadUiId, { controller: liveController });
      }

      await uploadOneFileDirect({
        apiUrl,
        token,
        file,
        fileName: basename,
        folderPath: folderPathForFile || undefined,
        visibility,
        shared,
        partSize,
        getSignal: () => getUpload?.(uploadUiId)?.controller?.signal,
        onProgress: (pct) => updateUploadProgress(uploadUiId, pct),
        onMeta: ({ key, uploadId, mode, needsNewController }) => {
          activeKey = key;
          activeUploadId = uploadId;
          if (mode) activeMode = mode;
          let nextController =
            getUpload?.(uploadUiId)?.controller || liveController;
          if (needsNewController || nextController?.signal?.aborted) {
            nextController =
              typeof AbortController !== "undefined"
                ? new AbortController()
                : nextController;
          }
          if (typeof updateUploadMeta === "function") {
            updateUploadMeta(uploadUiId, {
              key,
              uploadId,
              mode,
              controller: nextController,
            });
          }
        },
        shouldAbort: () =>
          !getUpload?.(uploadUiId) && !isPausing?.(uploadUiId),
        waitIfPaused: () => waitUntilResumed(uploadUiId),
      });

      updateUploadProgress(uploadUiId, 100);
      results.push({ status: "fulfilled", value: "success" });
    } catch (err) {
      const canceled =
        err?.name === "UploadCanceled" ||
        err?.message === "upload-removed" ||
        (err &&
          (err.name === "CanceledError" ||
            err.code === "ERR_CANCELED" ||
            /canceled/i.test(err.message || "") ||
            /abort/i.test(err.message || "")));

      if (canceled) {
        if (activeKey && activeUploadId) {
          await abortMultipartUploadDirect({
            apiUrl,
            token,
            key: activeKey,
            uploadId: activeUploadId,
            shared,
            mode: activeMode,
          });
        }
        removeUpload(uploadUiId);
        results.push({ status: "fulfilled", value: "canceled" });
        if (!getUpload?.(uploadUiId) && !isPausing?.(uploadUiId)) {
          batchCanceled = true;
          for (let j = i + 1; j < uploadEntries.length; j++) {
            results.push({ status: "fulfilled", value: "canceled" });
          }
          break;
        }
      } else {
        removeUpload(uploadUiId);
        results.push({ status: "rejected", reason: err });
      }
    }

    if (batchCanceled) break;

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
