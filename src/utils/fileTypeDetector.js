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
