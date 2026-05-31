// Shared file helpers for paste-parser sub pages.
export function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 Bytes';
  const units = ['Bytes', 'KB', 'MB', 'GB'];
  const index = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / Math.pow(1024, index);
  return `${Math.round(value * 100) / 100} ${units[index]}`;
}

export function createFileInfo(file) {
  return {
    name: file.name,
    size: formatFileSize(file.size),
  };
}

export function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export function readFileAsBinaryString(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target.result);
    reader.onerror = reject;
    reader.readAsBinaryString(file);
  });
}
