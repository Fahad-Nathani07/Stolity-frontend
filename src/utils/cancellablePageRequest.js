import axios from "axios";

/**
 * MONITORED PAGE REQUESTS (reference only — keep updated when wiring new calls)
 * Page Request Cancellation
 * or shorter: PRC
 * =============================================================================
 *
 * Files.jsx  (page key: "files")
 *   - GET shared-folders
 *   - GET get-all-files        (filter / sort)
 *   - GET getAllObjectsNew     (default list)
 *   - GET search-file          (via useFileSearch)
 *
 * NestedPage.jsx  (page key: "nested")
 *   - GET getFolder            (reloadAfterTast, getFolderFiles, applyFilter)
 *   - GET get-all-files        (shared-root filter path in applyFilter)
 *   - GET search-file          (via useFileSearch)
 *
 * Favourites.jsx  (page key: "favourites")
 *   - GET get-favorite-files
 *   - GET search-file          (via useFileSearch)
 *
 * RecycleBin.jsx  (page key: "recycle-bin")
 *   - GET get-recycle-bin
 *   - GET search-file          (via useFileSearch)
 *
 * MoveFolderPopup.jsx  (page key: "move-folder-popup")
 *   - GET getFolder / GET getAllObjectsNew  (via fetchFolderListing)
 *
 * MoveFilePopup.jsx  (page key: "move-file-popup")
 *   - GET getFolder / GET getAllObjectsNew  (via fetchFolderListing)
 *
 * Behaviour: same page + same endpoint → previous in-flight request is aborted;
 * only the latest call should update UI (pair with stale guards where needed).
 */

export function isRequestAborted(error) {
  return (
    error?.isAborted === true ||
    error?.code === "ERR_CANCELED" ||
    error?.name === "CanceledError" ||
    error?.name === "AbortError"
  );
}

export function normalizeRequestEndpoint(url) {
  const raw = String(url || "").split("?")[0].replace(/\/+$/, "");
  const parts = raw.split("/").filter(Boolean);
  return parts[parts.length - 1] || raw || "unknown";
}

export function buildPageRequestKey(pageKey, method, url) {
  return `${pageKey}|${String(method || "GET").toUpperCase()}|${normalizeRequestEndpoint(url)}`;
}

/**
 * Per-page manager: aborts the previous in-flight call when the same endpoint
 * is requested again on the same page.
 */
export function createPageRequestManager(pageKey) {
  const inFlight = new Map();

  const cancelPrevious = (requestKey) => {
    const previous = inFlight.get(requestKey);
    if (previous) {
      previous.abort();
    }
    const controller = new AbortController();
    inFlight.set(requestKey, controller);
    return controller;
  };

  const clearIfCurrent = (requestKey, controller) => {
    if (inFlight.get(requestKey) === controller) {
      inFlight.delete(requestKey);
    }
  };

  const get = async (url, config = {}) => {
    const requestKey = buildPageRequestKey(pageKey, "GET", url);
    const controller = cancelPrevious(requestKey);

    try {
      return await axios.get(url, {
        ...config,
        signal: controller.signal,
      });
    } catch (error) {
      if (isRequestAborted(error)) {
        const abortedError = new Error("Request aborted");
        abortedError.isAborted = true;
        abortedError.cause = error;
        throw abortedError;
      }
      throw error;
    } finally {
      clearIfCurrent(requestKey, controller);
    }
  };

  const cancelAll = () => {
    for (const controller of inFlight.values()) {
      controller.abort();
    }
    inFlight.clear();
  };

  const cancelEndpoint = (url, method = "GET") => {
    const requestKey = buildPageRequestKey(pageKey, method, url);
    const controller = inFlight.get(requestKey);
    if (controller) {
      controller.abort();
      inFlight.delete(requestKey);
    }
  };

  return {
    pageKey,
    get,
    cancelAll,
    cancelEndpoint,
    isRequestAborted,
  };
}
