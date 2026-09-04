import axios from "axios";
import { buildGetFolderParams } from "./getFolderParams";

/**
 * Optimized nested listing: GET getFolder
 * mode=fast|full, limit, continuationToken, enrich, bypassCache + folderPath/shared
 */
export async function fetchGetFolder2(
  apiUrl,
  token,
  {
    folderPath = "",
    isShared = false,
    sharedRoot = "",
    mode = "fast",
    limit = 25,
    continuationToken = null,
    enrich = false,
    bypassCache = false,
    extraParams = {},
    signal,
  } = {}
) {
  const baseParams = buildGetFolderParams({
    folderPath,
    isShared,
    sharedRoot,
  });

  const params = {
    ...baseParams,
    ...extraParams,
    mode,
    limit,
    enrich: enrich ? "true" : "false",
  };

  if (continuationToken) {
    params.continuationToken = continuationToken;
  }
  if (bypassCache) {
    params.bypassCache = "true";
  }

  const response = await axios.get(`${apiUrl}getFolder`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    params,
    signal,
  });

  return {
    result: Array.isArray(response?.data?.result) ? response.data.result : [],
    nextContinuationToken: response?.data?.nextContinuationToken || null,
    isNextPage: Boolean(response?.data?.isNextPage),
    totalEntries: response?.data?.totalEntries ?? 0,
    mode: response?.data?.mode || mode,
    cached: Boolean(response?.data?.cached),
    raw: response?.data,
  };
}
