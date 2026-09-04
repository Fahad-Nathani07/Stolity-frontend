import axios from "axios";
import {
  buildGetFolderParams,
  parseFolderListingItems,
  shouldUseGetFolderForListing,
} from "./getFolderParams";

const inFlightRequests = new Map();

function buildListingRequestKey({
  apiUrl,
  folderPath = "",
  isShared = false,
  sharedRoot = "",
}) {
  const cleanPath = String(folderPath || "").replace(/\/+$/, "");
  const useGetFolder = shouldUseGetFolderForListing({
    isShared,
    folderPath: cleanPath,
  });
  return [
    apiUrl,
    useGetFolder ? "getFolder" : "getAllObjectsNew",
    cleanPath,
    isShared ? "1" : "0",
    sharedRoot || "",
  ].join("|");
}

/**
 * Fetch folders for move/copy destination pickers.
 * Deduplicates concurrent identical requests (e.g. React StrictMode double mount).
 */
export async function fetchFolderListing({
  apiUrl,
  token,
  folderPath = "",
  isShared = false,
  sharedRoot = "",
  signal,
}) {
  const cleanPath = String(folderPath || "").replace(/\/+$/, "");
  const requestKey = buildListingRequestKey({
    apiUrl,
    folderPath: cleanPath,
    isShared,
    sharedRoot,
  });

  if (inFlightRequests.has(requestKey)) {
    return inFlightRequests.get(requestKey);
  }

  const requestPromise = (async () => {
    const useGetFolder = shouldUseGetFolderForListing({
      isShared,
      folderPath: cleanPath,
    });

    const res = await axios.get(
      useGetFolder ? `${apiUrl}getFolder` : `${apiUrl}getAllObjectsNew`,
      {
        params: useGetFolder
          ? buildGetFolderParams({
              folderPath: cleanPath,
              isShared,
              sharedRoot,
            })
          : { limit: 1000 },
        headers: { Authorization: `Bearer ${token}` },
        signal,
      }
    );

    return parseFolderListingItems(res.data);
  })().finally(() => {
    inFlightRequests.delete(requestKey);
  });

  inFlightRequests.set(requestKey, requestPromise);
  return requestPromise;
}
