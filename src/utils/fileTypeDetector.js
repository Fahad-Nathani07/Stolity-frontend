export const detectFileType = (file) => {
  const extension = file.name.split('.').pop().toLowerCase();
  
  // Image formats
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'bmp', 'svg'].includes(extension)) {
    return { type: 'image', extension };
  }
  
  // Video formats
  if (['mp4', 'webm', 'avi', 'mov', 'mkv', 'flv', 'wmv'].includes(extension)) {
    return { type: 'video', extension };
  }
  
  // Audio formats
  if (['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a', 'wma'].includes(extension)) {
    return { type: 'audio', extension };
  }
  
  // Data formats
  if (['csv', 'json', 'xlsx', 'xls', 'xml', 'txt'].includes(extension)) {
    return { type: 'data', extension };
  }
  
  // Document formats
  if (['pdf', 'doc', 'docx', 'ppt', 'pptx'].includes(extension)) {
    return { type: 'document', extension };
  }
  
  return { type: 'unknown', extension };
};

/** Short category label for grid-card meta (Music, Video, …). */
export function getGridFileCategory(file) {
  if (!file) return "";
  if (file.isFolder === true || file.isFolder === "true" || file.fileType === "Folder") {
    return "Folder";
  }

  const raw =
    (file.fileType && String(file.fileType)) ||
    (file.fileName && String(file.fileName).split(".").pop()) ||
    "";
  const t = raw.toLowerCase().replace(/^\./, "");

  if (["mp3", "wav", "ogg", "aac", "flac", "m4a", "wma"].includes(t)) return "Music";
  if (["mp4", "webm", "avi", "mov", "mkv", "flv", "wmv", "mpeg"].includes(t)) return "Video";
  if (["jpg", "jpeg", "png", "gif", "webp", "heic", "heif", "bmp", "svg"].includes(t)) {
    return "Image";
  }
  if (["pdf"].includes(t)) return "PDF";
  if (["doc", "docx", "txt", "rtf", "odt"].includes(t)) return "Document";
  if (["ppt", "pptx", "key"].includes(t)) return "Presentation";
  if (["xls", "xlsx", "csv"].includes(t)) return "Spreadsheet";
  if (["zip", "rar", "7z", "tar", "gz"].includes(t)) return "Archive";
  if (["js", "jsx", "ts", "tsx", "json", "html", "css", "py", "java", "go", "rb", "php", "c", "cpp", "cs"].includes(t)) {
    return "Code";
  }
  if (!t) return "";
  return t.toUpperCase();
}

export const getAvailableButtons = (fileType) => {
  switch (fileType) {
    case 'image':
      return ['changeFormat', 'compress'];
    
    case 'video':
      return ['changeFormat', 'changeBitrate'];
    
    case 'audio':
      return ['changeBitrate'];
    
    case 'data':
      return ['changeFormat'];
    
    case 'document':
      return ['comingSoon'];
    
    default:
      return [];
  }
};
