/**
 * Detect OS / Finder / Explorer file drags (not in-app move of Stolity items).
 */
export function isExternalFileDrag(event, { isInternalDrag = false } = {}) {
  if (isInternalDrag) return false;
  const types = event?.dataTransfer?.types;
  if (!types) return false;
  try {
    return Array.from(types).includes("Files");
  } catch (_) {
    return false;
  }
}

/**
 * Collect dropped File objects; skip directories (those need Upload Folder).
 */
export function getDroppedFilesFromEvent(event) {
  const dt = event?.dataTransfer;
  if (!dt) return [];

  if (dt.items && dt.items.length > 0) {
    const files = [];
    for (let i = 0; i < dt.items.length; i += 1) {
      const item = dt.items[i];
      if (!item || item.kind !== "file") continue;
      const entry =
        typeof item.webkitGetAsEntry === "function"
          ? item.webkitGetAsEntry()
          : null;
      if (entry?.isDirectory) continue;
      const file = item.getAsFile();
      if (file) files.push(file);
    }
    return files;
  }

  return Array.from(dt.files || []).filter(Boolean);
}
