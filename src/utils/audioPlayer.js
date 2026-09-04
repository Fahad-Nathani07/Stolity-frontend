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

export function buildAudioStreamUrl(
  apiUrl,
  token,
  filePath,
  { shared = false, sharedName = "" } = {}
) {
  const params = new URLSearchParams();
  params.set("token", token || "");
  params.set("filePath", filePath || "");
  if (shared && sharedName) {
    params.set("shared", sharedName);
  }
  return `${apiUrl}getFileDefault?${params.toString()}`;
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
