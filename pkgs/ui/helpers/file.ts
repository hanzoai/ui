export const getFileExt = (fileName: string): string => {
  if (!fileName) return '';
  const parts = fileName.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export const isImageFile = (fileName: string): boolean => {
  const ext = getFileExt(fileName);
  return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(ext);
};

export const isPdfFile = (fileName: string): boolean => {
  const ext = getFileExt(fileName);
  return ext === 'pdf';
};

export const isVideoFile = (fileName: string): boolean => {
  const ext = getFileExt(fileName);
  return ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'].includes(ext);
};

export const isAudioFile = (fileName: string): boolean => {
  const ext = getFileExt(fileName);
  return ['mp3', 'wav', 'ogg', 'aac', 'flac', 'wma'].includes(ext);
};