export const UPLOAD_CONFLICT_REPLACE = "replace";
export const UPLOAD_CONFLICT_KEEP_BOTH = "keepBoth";
export const UPLOAD_CONFLICT_SKIP = "skipDuplicates";
export const UPLOAD_CONFLICT_CANCEL = "cancel";

export function normalizeUploadFolderPath(folderPath) {
  return String(folderPath || "").replace(/^\/+|\/+$/g, "");
}

/** Last path segment for upload/display (preserves original casing). */
export function getUploadBaseName(fileName) {
  const parts = String(fileName || "").replace(/\\/g, "/").split("/").filter(Boolean);
  return parts[parts.length - 1] || String(fileName || "");
}

function normalizeCompareName(fileName) {
  return getUploadBaseName(fileName).toLowerCase();
}

/**
 * File names (basenames) that already exist in the target folder.
 * @param {Array<{ fileName?: string, isFolder?: boolean }>} listing
 * @param {string} folderPath
 */
export function getExistingFileNamesInFolder(listing, folderPath) {
  const normalizedPath = normalizeUploadFolderPath(folderPath);
  const names = new Set();

  for (const item of listing || []) {
    if (!item || item.isFolder) continue;

    const fullPath = String(item.fileName || "").replace(/\/+$/, "");
    if (!fullPath) continue;

    if (!normalizedPath) {
      if (!fullPath.includes("/")) {
        names.add(normalizeCompareName(fullPath));
      }
      continue;
    }

    const prefix = `${normalizedPath}/`;
    if (fullPath.startsWith(prefix)) {
      const relative = fullPath.slice(prefix.length);
      if (relative && !relative.includes("/")) {
        names.add(normalizeCompareName(relative));
      }
    }
  }

  return names;
}

/**
 * @param {string[]} uploadNames — sanitized upload file names
 * @returns {string[]} conflicting basenames (display casing from upload)
 */
export function findUploadNameConflicts(uploadNames, listing, folderPath) {
  const existing = getExistingFileNamesInFolder(listing, folderPath);
  const conflicts = [];

  for (const name of uploadNames || []) {
    const base = getUploadBaseName(name);
    if (existing.has(base.toLowerCase())) {
      conflicts.push(base);
    }
  }

  return [...new Set(conflicts)];
}

export function allocateUniqueFileName(baseName, takenLowerCaseSet) {
  const dot = baseName.lastIndexOf(".");
  const stem = dot > 0 ? baseName.slice(0, dot) : baseName;
  const ext = dot > 0 ? baseName.slice(dot) : "";

  let n = 1;
  let candidate;
  do {
    candidate = `${stem} (${n})${ext}`;
    n += 1;
  } while (takenLowerCaseSet.has(candidate.toLowerCase()));

  return candidate;
}

/**
 * @param {File[]} files
 * @param {string[]} sanitizedNames — parallel to files
 * @param {string[]} conflictNames — basenames that conflict
 * @param {string} resolution — UPLOAD_CONFLICT_*
 * @returns {Array<{ file: File, sanitizedName: string }>|null} null = cancel entire upload
 */
export function applyUploadConflictResolution(
  files,
  sanitizedNames,
  conflictNames,
  resolution,
  listing,
  folderPath
) {
  if (resolution === UPLOAD_CONFLICT_CANCEL) {
    return null;
  }

  const conflictSet = new Set(
    (conflictNames || []).map((name) => name.toLowerCase())
  );
  const taken = new Set(getExistingFileNamesInFolder(listing, folderPath));
  const result = [];

  for (let i = 0; i < files.length; i += 1) {
    const file = files[i];
    const sanitized = sanitizedNames[i];
    const base = getUploadBaseName(sanitized);
    const isConflict = conflictSet.has(base.toLowerCase());

    if (resolution === UPLOAD_CONFLICT_SKIP && isConflict) {
      continue;
    }

    let uploadName = sanitized;
    if (resolution === UPLOAD_CONFLICT_KEEP_BOTH && isConflict) {
      uploadName = allocateUniqueFileName(base, taken);
      taken.add(uploadName.toLowerCase());
    }

    result.push({ file, sanitizedName: uploadName });
  }

  return result;
}
