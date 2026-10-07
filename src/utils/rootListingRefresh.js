import { normalizeFolderPath } from "./movePath";

/**
 * When copy/move lands on root but the user already navigated to Files,
 * NestedPage's refresh callback is gone — Files listens here instead.
 */

const listeners = new Set();

export function isRootDestination(path) {
  return normalizeFolderPath(path) === "";
}

export function requestRootListingRefresh() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch (_) {}
  });
}

/** Call after successful copy/move when destination is My Files (root). */
export function refreshRootListingIfDestinationIsRoot(destinationPath) {
  if (!isRootDestination(destinationPath)) return;
  requestRootListingRefresh();
}

export function subscribeRootListingRefresh(listener) {
  if (typeof listener !== "function") return () => {};
  listeners.add(listener);
  return () => listeners.delete(listener);
}
