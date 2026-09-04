import axios from "axios";
import { buildGetFolderParams } from "./getFolderParams";

/**
 * Fast paginated listing (light metadata).
 * @returns {Promise<{ result: any[], page: number, limit: number, totalEntries: number, totalPages: number, isComplete: boolean, folderPath: string }>}
 */
export async function fetchListObjectsFast({
  apiUrl,
  token,
  folderPath = "",
  page = 1,
  limit = 25,
  sortParams = {},
  fileTypes,
  isShared = false,
  sharedRoot = "",
  signal,
}) {
  const params = {
    ...buildGetFolderParams({
      folderPath,
      isShared,
      sharedRoot,
    }),
    page,
    limit,
    ...normalizeSortQuery(sortParams),
  };

  if (fileTypes) {
    params.fileTypes = Array.isArray(fileTypes)
      ? fileTypes.join(",")
      : String(fileTypes);
  }

  const res = await axios.get(`${apiUrl}list-objects-fast`, {
    params,
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });

  return res.data;
}

/**
 * Full folder-level listing (enriched; use in background).
 */
export async function fetchListObjectsFull({
  apiUrl,
  token,
  folderPath = "",
  sortParams = {},
  fileTypes,
  isShared = false,
  sharedRoot = "",
  signal,
}) {
  const params = {
    ...buildGetFolderParams({
      folderPath,
      isShared,
      sharedRoot,
    }),
    ...normalizeSortQuery(sortParams),
  };

  if (fileTypes) {
    params.fileTypes = Array.isArray(fileTypes)
      ? fileTypes.join(",")
      : String(fileTypes);
  }

  const res = await axios.get(`${apiUrl}list-objects-full`, {
    params,
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });

  return res.data;
}

function normalizeSortQuery(sortParams = {}) {
  const params = {};
  if (sortParams.ascending === true) params.ascending = "true";
  if (sortParams.ascending === false) params.ascending = "false";
  if (sortParams.sortSize === true) params.sortSize = "true";
  if (sortParams.sortSize === false) params.sortSize = "false";
  if (sortParams.sortByDate) params.sortByDate = sortParams.sortByDate;
  return params;
}
