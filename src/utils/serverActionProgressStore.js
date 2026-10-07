/**
 * App-level zip/unzip/copy/move progress state.
 * Survives route changes (e.g. open folder C while move B→A is running).
 */

import { markZipUnzipBusy } from "./zipUnzipSessionBusy";
import {
  clearTransferFolderLock,
  setTransferFolderLock,
} from "./transferFolderLock";

const CANCELLABLE_MODES = new Set(["zip", "unzip"]);
const PATH_LOCK_MODES = new Set(["copy", "move"]);

let prompt = null; // { folderName, mode, startedAt }
let abortController = null;
let busyMarked = false;
const listeners = new Set();

function notify() {
  listeners.forEach((fn) => {
    try {
      fn(prompt);
    } catch (_) {}
  });
}

function clearBusy() {
  if (!busyMarked) return;
  markZipUnzipBusy(false);
  busyMarked = false;
}

export function getServerActionProgress() {
  return prompt;
}

export function subscribeServerActionProgress(listener) {
  if (typeof listener !== "function") return () => {};
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * @param {string} [folderName]
 * @param {{
 *   mode?: 'zip'|'unzip'|'copy'|'move',
 *   sourcePaths?: string[],
 *   destinationPath?: string,
 * }} [options]
 * @returns {AbortController|null}
 */
export function beginServerActionProgress(folderName, options = {}) {
  const raw = options.mode;
  const mode =
    raw === "unzip" || raw === "copy" || raw === "move" ? raw : "zip";

  const controller =
    typeof AbortController !== "undefined" && CANCELLABLE_MODES.has(mode)
      ? new AbortController()
      : null;
  abortController = controller;

  if (!busyMarked) {
    markZipUnzipBusy(true);
    busyMarked = true;
  }

  if (PATH_LOCK_MODES.has(mode)) {
    setTransferFolderLock({
      sourcePaths: options.sourcePaths,
      destinationPath: options.destinationPath,
      mode,
    });
  } else {
    clearTransferFolderLock();
  }

  prompt = {
    folderName: folderName || "",
    mode,
    startedAt: Date.now(),
  };
  notify();
  return controller;
}

export function endServerActionProgress() {
  abortController = null;
  clearBusy();
  clearTransferFolderLock();
  prompt = null;
  notify();
}

export function cancelServerActionProgress() {
  try {
    abortController?.abort();
  } catch (_) {}
  abortController = null;
  clearBusy();
  clearTransferFolderLock();
  prompt = null;
  notify();
}

export function isServerActionCancellable(mode) {
  return CANCELLABLE_MODES.has(mode);
}
