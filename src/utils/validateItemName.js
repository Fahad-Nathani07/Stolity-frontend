/**
 * Validate a file/folder basename for rename (and similar create rules).
 * For files, pass the editable name without extension.
 *
 * @param {string} rawName
 * @returns {{ ok: true, name: string } | { ok: false, message: string }}
 */
export function validateItemName(rawName) {
  const name = String(rawName ?? "").trim();

  if (!name) {
    return { ok: false, message: "Name cannot be empty." };
  }

  if (name === "." || name === "..") {
    return { ok: false, message: "Invalid name." };
  }

  if (name.length > 200) {
    return { ok: false, message: "Name is too long (max 200 characters)." };
  }

  // Path separators / reserved Windows chars / control chars
  if (/[\\/<>:"|?*\u0000-\u001F]/.test(name)) {
    return {
      ok: false,
      message: 'Name cannot contain \\ / : * ? " < > | or control characters.',
    };
  }

  // Same allowlist as create-folder
  if (!/^[a-zA-Z0-9_\- ]+$/.test(name)) {
    return {
      ok: false,
      message:
        "Name can only contain letters, numbers, underscores, hyphens, and spaces.",
    };
  }

  return { ok: true, name };
}

function normalizeRenamePath(path) {
  return String(path || "")
    .replace(/\\/g, "/")
    .replace(/\/+$/, "")
    .toLowerCase();
}

/**
 * True when another listing item already uses newFullPath (case-insensitive).
 * Ignores the item being renamed (oldFullPath).
 *
 * @param {Array<{ fileName?: string }>|null|undefined} listing
 * @param {string} oldFullPath
 * @param {string} newFullPath
 */
export function isRenameNameTaken(listing, oldFullPath, newFullPath) {
  const oldNorm = normalizeRenamePath(oldFullPath);
  const newNorm = normalizeRenamePath(newFullPath);
  if (!newNorm || oldNorm === newNorm) return false;

  return (listing || []).some((item) => {
    const itemNorm = normalizeRenamePath(item?.fileName);
    return Boolean(itemNorm && itemNorm !== oldNorm && itemNorm === newNorm);
  });
}

export const FOLDER_EXISTS_MESSAGE =
  "A folder with this name already exists here.";

function listingItemBaseName(fileName) {
  const name = String(fileName || "")
    .replace(/\\/g, "/")
    .replace(/\/+$/, "");
  if (!name) return "";
  const parts = name.split("/").filter(Boolean);
  return (parts[parts.length - 1] || "").toLowerCase();
}

/**
 * True when the current folder listing already has a folder with this name.
 * Accepts a basename or a full relative path (uses the last segment).
 *
 * @param {Array<{ fileName?: string, isFolder?: boolean, fileType?: string }>|null|undefined} listing
 * @param {string} folderNameOrPath
 */
export function isCreateFolderNameTaken(listing, folderNameOrPath) {
  const wanted = listingItemBaseName(folderNameOrPath);
  if (!wanted) return false;

  return (listing || []).some((item) => {
    const isFolder = item?.isFolder === true || item?.fileType === "Folder";
    if (!isFolder) return false;
    return listingItemBaseName(item?.fileName) === wanted;
  });
}

/** Map create-folder API errors to a user-facing message. */
export function getCreateFolderErrorMessage(error) {
  const status = error?.response?.status;
  const msg =
    error?.response?.data?.message || error?.response?.data?.error || "";
  if (
    status === 409 ||
    /already exists/i.test(String(msg))
  ) {
    return FOLDER_EXISTS_MESSAGE;
  }
  return msg || "Failed to create folder. Please try again.";
}
