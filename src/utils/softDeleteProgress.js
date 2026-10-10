/**
 * Labels + path locks for soft-delete progress (same panel as copy/move).
 */

function baseName(path) {
  return (
    String(path || "")
      .replace(/\\/g, "/")
      .split("/")
      .filter(Boolean)
      .pop() || ""
  );
}

/**
 * @param {{ files?: string[], folders?: string[], singleName?: string }} opts
 */
export function softDeleteProgressLabel({
  files = [],
  folders = [],
  singleName,
} = {}) {
  if (singleName) {
    return baseName(singleName) || "item";
  }
  const fc = files.length;
  const dc = folders.length;
  if (fc && dc) return `${fc + dc} items`;
  if (dc === 1) return baseName(folders[0]) || "folder";
  if (dc > 1) return `${dc} folders`;
  if (fc === 1) return baseName(files[0]) || "file";
  if (fc > 1) return `${fc} files`;
  return "items";
}

/**
 * Lock parent folder(s) of files + each folder being deleted.
 * @param {{ parentPath?: string, fileKeys?: string[], folderKeys?: string[] }} opts
 */
export function softDeleteSourcePaths({
  parentPath = "",
  fileKeys = [],
  folderKeys = [],
} = {}) {
  const paths = [...(folderKeys || [])];
  if ((fileKeys || []).length > 0) {
    paths.push(parentPath);
  }
  return paths;
}
