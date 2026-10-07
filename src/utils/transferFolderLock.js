/**
 * While copy/move runs, lock From (source) + To (destination) folders
 * so listing / picker cannot navigate into them.
 */

import { normalizeFolderPath } from "./movePath";

let lock = null; // { paths: string[], mode: 'copy'|'move' }
const listeners = new Set();

function notify() {
  listeners.forEach((fn) => {
    try {
      fn(lock);
    } catch (_) {}
  });
}

function uniqNormalized(paths) {
  const out = [];
  const seen = new Set();
  for (const raw of paths || []) {
    const p = normalizeFolderPath(raw);
    // Allow "" (root) as a lock target
    if (seen.has(p)) continue;
    seen.add(p);
    out.push(p);
  }
  return out;
}

/**
 * @param {{ sourcePaths?: string[], destinationPath?: string, mode?: string }} opts
 */
export function setTransferFolderLock(opts = {}) {
  const sourcePaths = Array.isArray(opts.sourcePaths) ? opts.sourcePaths : [];
  const paths = uniqNormalized([
    ...sourcePaths,
    opts.destinationPath,
  ]);
  if (paths.length === 0) {
    lock = null;
    notify();
    return;
  }
  lock = {
    paths,
    mode: opts.mode === "copy" ? "copy" : "move",
  };
  notify();
}

export function clearTransferFolderLock() {
  if (!lock) return;
  lock = null;
  notify();
}

export function getTransferFolderLock() {
  return lock;
}

/**
 * True if path is a locked From/To folder, or nested inside one.
 * @param {string} path
 */
export function isFolderTransferLocked(path) {
  if (!lock?.paths?.length) return false;
  const p = normalizeFolderPath(path);
  return lock.paths.some((locked) => {
    if (locked === "") return p === "";
    return p === locked || p.startsWith(`${locked}/`);
  });
}

/**
 * Exact match only (for picker row disable — don't grey every descendant when listing parent).
 * @param {string} path
 */
export function isFolderTransferLockedExact(path) {
  if (!lock?.paths?.length) return false;
  const p = normalizeFolderPath(path);
  return lock.paths.includes(p);
}

export function subscribeTransferFolderLock(listener) {
  if (typeof listener !== "function") return () => {};
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * @param {string} path
 * @param {(type: string, msg: string) => void} [showToast]
 * @returns {boolean} true if navigation is allowed
 */
export function assertFolderNavAllowed(path, showToast) {
  if (!isFolderTransferLocked(path)) return true;
  const verb = lock?.mode === "copy" ? "copy" : "move";
  showToast?.(
    "warning",
    `This folder is busy with a ${verb}. Please wait until it finishes.`
  );
  return false;
}
