export const normalizeFolderPath = (value) =>
  String(value ?? "")
    .replace(/\\/g, "/")
    .replace(/^\/+|\/+$/g, "");

export const normalizeMovePath = (value, { isShared = false, sharedRoot = "" } = {}) => {
  let path = normalizeFolderPath(value);
  if (!path) return "";

  if (isShared && sharedRoot) {
    const root = normalizeFolderPath(sharedRoot);
    if (!root) return path;
    if (path === root) return "";
    if (path.startsWith(`${root}/`)) {
      path = path.slice(root.length + 1);
    }
  }

  return path;
};

export const getFolderParentPath = (folderPath) => {
  const normalized = normalizeFolderPath(folderPath);
  const slashIndex = normalized.lastIndexOf("/");
  return slashIndex === -1 ? "" : normalized.slice(0, slashIndex);
};

export const isSameMoveDestination = (source, destination, options) =>
  normalizeMovePath(source, options) === normalizeMovePath(destination, options);

export const isRedundantFolderMove = (sourceFolders, destination, options) => {
  const dest = normalizeMovePath(destination, options);
  const folders = (Array.isArray(sourceFolders) ? sourceFolders : [sourceFolders])
    .map((folder) => normalizeMovePath(folder, options))
    .filter(Boolean);

  return folders.some((src) => {
    if (dest === src) return true;
    return dest === getFolderParentPath(src);
  });
};

export const resolveNestedDropTargetPath = (
  itemPath,
  currentFolderPath,
  options
) => {
  const normalizedItem = normalizeFolderPath(itemPath);
  if (!normalizedItem) return "";

  if (normalizedItem.includes("/")) {
    return normalizeMovePath(normalizedItem, options);
  }

  const parent = normalizeMovePath(currentFolderPath, options);
  return parent ? `${parent}/${normalizedItem}` : normalizedItem;
};

/**
 * Build move/copy API payload from selection keys and current-folder source.
 * Always returns basename keys when files share one source folder.
 * Full-path keys are only kept when files come from multiple folders.
 */
export const resolveSourceFolderAndKeys = (
  rawKeys,
  sourceFolder,
  { isShared = false, sharedRoot = "" } = {}
) => {
  const options = { isShared, sharedRoot };
  const keys = (Array.isArray(rawKeys) ? rawKeys : [rawKeys])
    .map((k) => String(k ?? "").trim())
    .filter(Boolean);

  const normalizedSource = normalizeMovePath(sourceFolder, options);

  if (keys.length === 0) {
    return { sourceFolder: normalizedSource, keys: [] };
  }

  const parsed = keys.map((key) => {
    const normalized =
      normalizeMovePath(key, options) || normalizeFolderPath(key);
    const slash = normalized.lastIndexOf("/");
    if (slash === -1) {
      return { folder: normalizedSource, name: normalized };
    }
    return {
      folder: normalized.slice(0, slash),
      name: normalized.slice(slash + 1),
    };
  });

  const uniqueFolders = [...new Set(parsed.map((p) => p.folder))];

  if (uniqueFolders.length === 1) {
    return {
      sourceFolder: uniqueFolders[0],
      keys: parsed.map((p) => p.name),
    };
  }

  return {
    sourceFolder: "",
    keys: parsed.map((p) => (p.folder ? `${p.folder}/${p.name}` : p.name)),
  };
};
