import { parseFileSizeToBytes } from "./fileIcon";

const getBaseName = (fileName) =>
  String(fileName || "")
    .toLowerCase()
    .split("/")
    .filter(Boolean)
    .pop() || "";

/** Lower score = better match (mirrors backend search relevance). */
export const getSearchRelevanceScore = (fileName, searchTerms) => {
  const baseName = getBaseName(fileName);
  let score = 0;

  for (const rawTerm of searchTerms) {
    const term = String(rawTerm || "").toLowerCase();
    if (!term) continue;

    if (baseName === term) {
      score += 0;
    } else if (baseName.startsWith(term)) {
      score += 100 + (baseName.length - term.length);
    } else {
      const index = baseName.indexOf(term);
      if (index === -1) return Number.MAX_SAFE_INTEGER;
      score += 1000 + index;
    }
  }

  return score;
};

export const parseSearchTerms = (query) =>
  String(query || "")
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

const compareByName = (a, b, ascending = true) => {
  const cmp = a.fileName.localeCompare(b.fileName, undefined, {
    sensitivity: "base",
  });
  return ascending ? cmp : -cmp;
};

const compareBySize = (a, b, ascending = true) => {
  const sizeA = parseFileSizeToBytes(a.fileSize);
  const sizeB = parseFileSizeToBytes(b.fileSize);
  const safeA = Number.isFinite(sizeA) ? sizeA : 0;
  const safeB = Number.isFinite(sizeB) ? sizeB : 0;
  return ascending ? safeA - safeB : safeB - safeA;
};

const compareByDate = (a, b, ascending = true) => {
  const dateA = new Date(a.uploadDateTime).getTime();
  const dateB = new Date(b.uploadDateTime).getTime();
  const safeA = Number.isFinite(dateA) ? dateA : 0;
  const safeB = Number.isFinite(dateB) ? dateB : 0;
  return ascending ? safeA - safeB : safeB - safeA;
};

/** Sort a list using API-style sort params (ascending, sortSize, sortByDate). */
export const sortFileListByParams = (list, sortParams = {}) => {
  const items = Array.isArray(list) ? [...list] : [];
  if (!items.length) return items;

  if (sortParams.ascending === true) {
    items.sort((a, b) => compareByName(a, b, true));
  } else if (sortParams.ascending === false) {
    items.sort((a, b) => compareByName(a, b, false));
  } else if (sortParams.sortSize === true) {
    items.sort((a, b) => compareBySize(a, b, true));
  } else if (sortParams.sortSize === false) {
    items.sort((a, b) => compareBySize(a, b, false));
  } else if (sortParams.sortByDate === "asc") {
    items.sort((a, b) => compareByDate(a, b, true));
  } else if (sortParams.sortByDate === "desc") {
    items.sort((a, b) => compareByDate(a, b, false));
  }

  return items;
};

/** Sort by UI filter label (Favourites-style). */
export const sortFileListByLabel = (list, sortLabel) => {
  switch (sortLabel) {
    case "By Name(A-Z)":
      return sortFileListByParams(list, { ascending: true });
    case "By Name(Z-A)":
      return sortFileListByParams(list, { ascending: false });
    case "By Size(Asc)":
    case "By Size(Ascending)":
      return sortFileListByParams(list, { sortSize: true });
    case "By Size(Desc)":
    case "By Size(Descending)":
      return sortFileListByParams(list, { sortSize: false });
    case "By Date(Oldest)":
      return sortFileListByParams(list, { sortByDate: "asc" });
    case "By Date(Newest)":
      return sortFileListByParams(list, { sortByDate: "desc" });
    default:
      return Array.isArray(list) ? [...list] : [];
  }
};

const shouldIncludeSharedFolders = (fileTypes) => {
  if (!fileTypes) return true;
  const types = String(fileTypes)
    .split(",")
    .map((type) => type.trim().toLowerCase())
    .filter(Boolean);
  if (!types.length) return true;
  return types.includes("folder");
};

const moveBlackboxToFront = (files) => {
  const userFiles = Array.isArray(files) ? [...files] : [];
  const blackboxIndex = userFiles.findIndex(
    (file) => file.fileName === "blackbox"
  );
  if (blackboxIndex !== -1) {
    const [blackbox] = userFiles.splice(blackboxIndex, 1);
    userFiles.unshift(blackbox);
  }
  return userFiles;
};

/**
 * Default root listing (no sort/filter): shared folders first, then blackbox, then files.
 */
export const buildDefaultFileListing = (
  files,
  sharedFolders,
  { isGoogleAuth } = {}
) => {
  const userFiles = moveBlackboxToFront(files);
  if (!isGoogleAuth) return userFiles;

  const shared = Array.isArray(sharedFolders) ? sharedFolders : [];
  return [...shared, ...userFiles];
};

/**
 * Merge user files with shared folders without pinning shared items on top.
 * Re-sorts the combined list when sort params are provided.
 */
export const mergeFilesWithSharedFolders = (
  files,
  sharedFolders,
  { isGoogleAuth, sortParams = {}, fileTypes } = {}
) => {
  const userFiles = Array.isArray(files) ? files : [];
  if (!isGoogleAuth) return userFiles;

  const shared = shouldIncludeSharedFolders(fileTypes)
    ? Array.isArray(sharedFolders)
      ? sharedFolders
      : []
    : [];

  const combined = [...userFiles, ...shared];
  const hasSort =
    sortParams.ascending === true ||
    sortParams.ascending === false ||
    sortParams.sortSize === true ||
    sortParams.sortSize === false ||
    sortParams.sortByDate === "asc" ||
    sortParams.sortByDate === "desc";

  return hasSort ? sortFileListByParams(combined, sortParams) : combined;
};

/** Merge search hits with matching shared folders; relevance first, then optional sort. */
export const mergeSearchWithSharedFolders = (
  searchResults,
  sharedFolders,
  query,
  { isGoogleAuth, sortParams = {}, fileTypes } = {}
) => {
  const results = Array.isArray(searchResults) ? [...searchResults] : [];
  if (!isGoogleAuth) {
    return sortFileListByParams(results, sortParams);
  }

  const terms = parseSearchTerms(query);
  if (!terms.length) return results;

  const includeShared = shouldIncludeSharedFolders(fileTypes);
  const matchingShared = includeShared
    ? (Array.isArray(sharedFolders) ? sharedFolders : []).filter((folder) =>
        terms.every((term) => folder.fileName.toLowerCase().includes(term))
      )
    : [];

  const seen = new Set();
  const combined = [];

  for (const item of [...results, ...matchingShared]) {
    const key = item.fileName;
    if (seen.has(key)) continue;
    seen.add(key);
    combined.push(item);
  }

  combined.sort((a, b) => {
    const relevanceDiff =
      getSearchRelevanceScore(a.fileName, terms) -
      getSearchRelevanceScore(b.fileName, terms);
    if (relevanceDiff !== 0) return relevanceDiff;

    const hasSort =
      sortParams.ascending === true ||
      sortParams.ascending === false ||
      sortParams.sortSize === true ||
      sortParams.sortSize === false ||
      sortParams.sortByDate === "asc" ||
      sortParams.sortByDate === "desc";

    if (!hasSort) {
      return a.fileName.localeCompare(b.fileName, undefined, {
        sensitivity: "base",
      });
    }

    if (sortParams.ascending === true) return compareByName(a, b, true);
    if (sortParams.ascending === false) return compareByName(a, b, false);
    if (sortParams.sortSize === true) return compareBySize(a, b, true);
    if (sortParams.sortSize === false) return compareBySize(a, b, false);
    if (sortParams.sortByDate === "asc") return compareByDate(a, b, true);
    if (sortParams.sortByDate === "desc") return compareByDate(a, b, false);

    return 0;
  });

  return combined;
};
