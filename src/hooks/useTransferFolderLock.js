import { useSyncExternalStore } from "react";
import {
  getTransferFolderLock,
  subscribeTransferFolderLock,
  isFolderTransferLocked,
  isFolderTransferLockedExact,
} from "../utils/transferFolderLock";

function getSnapshot() {
  return getTransferFolderLock();
}

function getServerSnapshot() {
  return null;
}

/** Subscribe to From/To folder locks during copy/move. */
export function useTransferFolderLock() {
  const lock = useSyncExternalStore(
    subscribeTransferFolderLock,
    getSnapshot,
    getServerSnapshot
  );

  return {
    lock,
    isLocked: Boolean(lock),
    isPathLocked: isFolderTransferLocked,
    isPathLockedExact: isFolderTransferLockedExact,
  };
}
