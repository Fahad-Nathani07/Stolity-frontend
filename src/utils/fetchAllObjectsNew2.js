import axios from "axios";

/**
 * Optimized root listing: GET getAllObjectsNew
 * mode=fast|full, limit, continuationToken, enrich, bypassCache
 */
export async function fetchAllObjectsNew2(
  apiUrl,
  token,
  {
    mode = "fast",
    limit = 25,
    continuationToken = null,
    enrich = false,
    bypassCache = false,
    signal,
  } = {}
) {
  const params = {
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

  const response = await axios.get(`${apiUrl}getAllObjectsNew`, {
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
