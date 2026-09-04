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
