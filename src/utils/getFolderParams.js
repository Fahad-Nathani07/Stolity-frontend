/**
 * Build axios params for GET getFolder.
 * Shared listings must use ?shared=root and a path relative to that root
 * (never shared=infomanav.in&folderPath=infomanav.in).
 */
export function buildGetFolderParams({
  folderPath = "",
  isShared = false,
  sharedRoot = "",
} = {}) {
  const root = String(sharedRoot || "").replace(/\/+$/, "");
  let relative = String(folderPath || "").replace(/\/+$/, "");

  if (!isShared) {
    return relative ? { folderPath: relative } : {};
  }

  if (!relative || relative === root) {
    return root ? { shared: root } : {};
  }

  if (root && relative.startsWith(`${root}/`)) {
    relative = relative.slice(root.length + 1);
  }

  if (!relative) {
    return root ? { shared: root } : {};
  }

  return { folderPath: relative, shared: root };
}

/** Copy/move destination pickers: shared root must use getFolder, not getAllObjectsNew. */
export function shouldUseGetFolderForListing({ isShared = false, folderPath = "" } = {}) {
  return Boolean(isShared) || Boolean(String(folderPath || "").trim());
}

export function parseFolderListingItems(data) {
  const items = Array.isArray(data) ? data : data?.result || [];
  return items.filter(
    (item) => item?.isFolder === true || item?.isFolder === "true"
  );
}
