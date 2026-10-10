/**
 * After copy / move / soft-delete / zip, only refresh the listing if the user
 * is still viewing the same folder (and same page) they were on when the op
 * started. Navigating away mid-op must not yank them back via a stale reload.
 */

import { normalizeFolderPath } from "./movePath";

/** Live browsing context — pages keep this updated. */
let liveContext = { page: "", path: "" };

export function snapshotListingPath(path) {
  return normalizeFolderPath(path ?? "");
}

/**
 * Call from Files / NestedPage / Favourites whenever the visible folder changes.
 * @param {{ page: string, path?: string }} ctx
 */
export function setLiveListingContext(ctx = {}) {
  liveContext = {
    page: String(ctx.page || ""),
    path: snapshotListingPath(ctx.path),
  };
}

export function getLiveListingContext() {
  return liveContext;
}

/**
 * @param {{ page?: string, path?: string }} started
 * @param {{ page?: string, path?: string }} [current] - defaults to live context
 */
export function isStillOnListingPath(started, current = liveContext) {
  const s = started || {};
  const c = current || liveContext;
  if (s.page != null && s.page !== "" && s.page !== c.page) return false;
  return snapshotListingPath(s.path) === snapshotListingPath(c.path);
}

/** Capture at op start (uses live context unless overridden). */
export function captureListingContext(override = {}) {
  const live = getLiveListingContext();
  return {
    page: override.page != null ? String(override.page) : live.page,
    path:
      override.path != null
        ? snapshotListingPath(override.path)
        : live.path,
  };
}

/**
 * @returns {Promise<boolean>} true if refresh ran
 */
export async function refreshListingIfStillHere(started, refreshFn) {
  if (typeof refreshFn !== "function") return false;
  if (!isStillOnListingPath(started)) return false;
  await refreshFn();
  return true;
}
