import { resolveMediaPlayUrl } from "./mediaPlayUrl";
import { buildFileStreamUrl } from "./fileStream";

const AUDIO_EXTENSIONS = new Set(["mp3", "m4a", "wav", "ogg", "aac"]);

export function isAudioExtension(fileType) {
  if (!fileType) return false;
  return AUDIO_EXTENSIONS.has(String(fileType).toLowerCase());
}

export function isAudioFile(file) {
  return Boolean(file && !file.isFolder && isAudioExtension(file.fileType));
}

export function buildAudioQueueFromFiles(files, currentFileName) {
  const queue = (files || []).filter(isAudioFile).map((f) => f.fileName);
  const index = queue.findIndex((name) => name === currentFileName);
  return {
    queue,
    index: index >= 0 ? index : 0,
  };
}

/** @deprecated Prefer resolveAudioPlayUrl (presigned Spaces). */
export function buildAudioStreamUrl(
  apiUrl,
  token,
  filePath,
  { shared = false, sharedName = "" } = {}
) {
  return buildFileStreamUrl(apiUrl, token, filePath, { shared, sharedName });
}

export async function resolveAudioPlayUrl(
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
    signal,
  });
}

/** Favourites / RecycleBin: full list may be filtered, not the paginated slice. */
export function getFilteredFullFileList(allEntries, sortedData, selectedFileTypes) {
  if (
    sortedData.length > 0 ||
    (sortedData.length === 0 && selectedFileTypes.length > 0)
  ) {
    return sortedData;
  }
  return allEntries;
}
