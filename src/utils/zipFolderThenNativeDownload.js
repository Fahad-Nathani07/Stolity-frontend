import {
  postZipOrUnzip,
  getZipUnzipErrorMessage,
} from "./zipUnzipRequest";
import { downloadFileNativeBrowser } from "./downloadFilePresigned";

export const ZIP_THEN_DOWNLOAD_TOAST =
  "Zipping successful. Download started.";

function parentDestinationPath(folderPath) {
  const cleaned = String(folderPath || "")
    .replace(/\\/g, "/")
    .replace(/^\/+|\/+$/g, "");
  const parts = cleaned.split("/").filter(Boolean);
  if (parts.length <= 1) return "";
  parts.pop();
  return parts.join("/");
}

/**
 * Zip a folder on Spaces, then download the resulting .zip via Browser Direct Stream.
 * @returns {{ zipFilePath: string, toastMessage: string }}
 */
export async function zipFolderThenNativeDownload({
  apiUrl,
  token,
  folderPath,
  shared,
  signal,
  onPhase,
}) {
  const filePath = String(folderPath || "")
    .replace(/\\/g, "/")
    .replace(/^\/+|\/+$/g, "");
  if (!filePath) {
    throw new Error("Folder path is required to zip");
  }

  const destinationPath = parentDestinationPath(filePath);
  const zipUrl = `${apiUrl}zip-object`;
  const requestConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    signal,
  };
  if (shared) {
    requestConfig.params = { shared };
  }

  if (typeof onPhase === "function") {
    onPhase("zipping");
  }

  let zipResult;
  try {
    zipResult = await postZipOrUnzip(
      zipUrl,
      { filePath, destinationPath },
      requestConfig
    );
  } catch (error) {
    if (error?.name === "CanceledError" || error?.code === "ERR_CANCELED") {
      throw new DOMException("Aborted", "AbortError");
    }
    const err = new Error(
      getZipUnzipErrorMessage(error, "Failed to zip folder.")
    );
    err.cause = error;
    throw err;
  }

  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  const zipFilePath = zipResult?.zipFilePath;
  if (!zipFilePath) {
    throw new Error("Zip completed but no zip file path was returned.");
  }

  if (typeof onPhase === "function") {
    onPhase("downloading");
  }

  await downloadFileNativeBrowser({
    apiUrl,
    token,
    filePath: zipFilePath,
    shared,
    signal,
  });

  return {
    zipFilePath,
    zipResult,
    toastMessage: ZIP_THEN_DOWNLOAD_TOAST,
  };
}
