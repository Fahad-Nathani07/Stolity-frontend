/** File types the preview modal can navigate (audio is skipped like handleNext). */
const AUDIO_TYPES = new Set([
  "mp3", "m4a", "wav", "ogg", "aac",
]);

export const IMAGE_TYPES = new Set([
  "jpeg", "jpg", "png", "gif", "heic", "hevc", "heif", "svg", "webp", "avif",
]);

export const PDF_TYPES = new Set(["pdf", "txt"]);

export const VIDEO_TYPES = new Set(["mkv", "mp4", "mov", "mpeg", "webm"]);

export const DOC_TYPES = new Set([
  "doc", "docx", "ppt", "pptx", "pptm", "pps", "ppsx",
  "xls", "xlsx", "xlsm", "csv", "ods",
]);

const extensionFromFileName = (name) => {
  const base = String(name || "").split("/").pop() || "";
  const dot = base.lastIndexOf(".");
  return dot > 0 ? base.slice(dot + 1).toLowerCase() : "";
};

export const resolvePreviewFileType = (file) => {
  const raw = String(file?.fileType || "").trim().toLowerCase();
  if (raw && raw !== "folder") return raw;
  return extensionFromFileName(file?.fileName);
};

/**
 * Same rules as handleNext row navigation: skip folders, audio, blackbox,
 * and shared-root shortcuts — NOT every file with isShared (shared folder contents).
 */
export const isModalNavigableEntry = (file, { isSharedValue = false } = {}) => {
  if (!file || file.isFolder) return false;
  if (file.fileName === "blackbox") return false;
  if (Boolean(file.isShared) && file.isFolder && !isSharedValue) return false;

  const ft = resolvePreviewFileType(file);
  if (AUDIO_TYPES.has(ft)) return false;
  return true;
};

/** First navigable index at or after `start`, or -1. */
export const findNavigableIndexFrom = (files, start = 0, options = {}) => {
  if (!Array.isArray(files) || files.length === 0) return -1;
  const from = Math.max(0, Math.min(start, files.length - 1));
  for (let i = from; i < files.length; i += 1) {
    if (isModalNavigableEntry(files[i], options)) return i;
  }
  for (let i = from - 1; i >= 0; i -= 1) {
    if (isModalNavigableEntry(files[i], options)) return i;
  }
  return -1;
};

/**
 * After deleting `deletedFileName`, pick the file to show next.
 * Same index in the shortened list (next item slides in) — not handleNext (+1).
 */
export const resolvePreviewAfterDelete = (
  files,
  deletedFileName,
  currentIndex,
  options = {}
) => {
  if (!Array.isArray(files)) return null;

  const withoutDeleted = files.filter((f) => f?.fileName !== deletedFileName);
  if (withoutDeleted.length === 0) return null;

  const slot = Math.min(
    Math.max(0, Number.isFinite(currentIndex) ? currentIndex : 0),
    withoutDeleted.length - 1
  );

  const index = findNavigableIndexFrom(withoutDeleted, slot, options);
  if (index < 0) return null;

  return { file: withoutDeleted[index], index };
};

/**
 * Open preview for one file (same type routing as handleNext in Files/NestedPage).
 */
export const openPreviewFile = (file, index, actions) => {
  if (!file || !actions) return;

  const {
    setCurrentImageIndex,
    setPreviewFile,
    setModalFile,
    setErrorMessage2,
    setIsProgressVisible,
    setImageSrc,
    setVideoSrc,
    setAudioSrc,
    setPdfSrc,
    setDocSrc,
    getImageInfo,
    getPdfInfo,
    getDocInfo,
    handleImageShow,
  } = actions;

  const ft = resolvePreviewFileType(file);
  const fileName = file.fileName;

  handleImageShow?.();
  setErrorMessage2?.("");
  setIsProgressVisible?.(true);
  setPreviewFile?.(file);
  setCurrentImageIndex?.(index);
  setModalFile?.(fileName);

  setImageSrc?.("");
  setVideoSrc?.("");
  setAudioSrc?.("");
  setPdfSrc?.("");
  setDocSrc?.("");

  if (IMAGE_TYPES.has(ft)) {
    setIsProgressVisible?.(false);
    getImageInfo?.(fileName);
    return;
  }

  if (PDF_TYPES.has(ft)) {
    setIsProgressVisible?.(false);
    getPdfInfo?.(fileName);
    return;
  }

  if (VIDEO_TYPES.has(ft)) {
    setIsProgressVisible?.(false);
    setVideoSrc?.(fileName);
    return;
  }

  if (DOC_TYPES.has(ft)) {
    setIsProgressVisible?.(false);
    getDocInfo?.(fileName);
    return;
  }

  setIsProgressVisible?.(false);
  setErrorMessage2?.("Unsupported file format");
};

export const buildPreviewModalActions = (handlers) => handlers;
