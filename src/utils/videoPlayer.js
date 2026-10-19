import { buildFileStreamUrl } from "./fileStream";
import {
  resolveMediaPlayDetails,
  resolveMediaPlayUrl,
} from "./mediaPlayUrl";

const VIDEO_EXTENSIONS = new Set([
  "mp4",
  "mkv",
  "mov",
  "mpeg",
  "webm",
  "avi",
  "flv",
  "wmv",
  "ogg",
]);

export function isVideoExtension(fileType) {
  if (!fileType) return false;
  return VIDEO_EXTENSIONS.has(String(fileType).toLowerCase());
}

export function isVideoFile(file) {
  return Boolean(file && !file.isFolder && isVideoExtension(file.fileType));
}

/** @deprecated Prefer resolveVideoPlayUrl (presigned Spaces). */
export function buildVideoStreamUrl(
  apiUrl,
  token,
  filePath,
  { shared = false, sharedName = "" } = {}
) {
  return buildFileStreamUrl(apiUrl, token, filePath, { shared, sharedName });
}

/** @returns {Promise<{ url: string, size: number }>} */
export async function resolveVideoPlayDetails(
  apiUrl,
  token,
  filePath,
  { shared = false, sharedName = "", signal } = {}
) {
  return resolveMediaPlayDetails({
    apiUrl,
    token,
    filePath,
    shared,
    sharedName,
    inline: true,
    signal,
  });
}

/** @returns {Promise<string>} */
export async function resolveVideoPlayUrl(
  apiUrl,
  token,
  filePath,
  { shared = false, sharedName = "", signal } = {}
) {
  return resolveMediaPlayUrl({
    apiUrl,
    token,
    filePath,
    shared,
    sharedName,
    // inline → Content-Disposition + proper video MIME on Spaces (not attachment/octet-stream)
    inline: true,
    signal,
  });
}

export function getVideoFileName(fullPath) {
  if (!fullPath) return "Video";
  return fullPath.split("/").pop();
}
