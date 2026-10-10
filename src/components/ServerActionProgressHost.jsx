import React, { useSyncExternalStore } from "react";
import ZippingProgressModal from "./ZippingProgressModal";
import {
  getServerActionProgress,
  subscribeServerActionProgress,
  cancelServerActionProgress,
  isServerActionCancellable,
} from "../utils/serverActionProgressStore";

/**
 * Single app-level host for zip/unzip/copy/move/delete progress.
 * Keeps the floating modal visible across folder navigation.
 */
export default function ServerActionProgressHost() {
  const prompt = useSyncExternalStore(
    subscribeServerActionProgress,
    getServerActionProgress,
    () => null
  );

  const mode = prompt?.mode || "zip";

  return (
    <ZippingProgressModal
      isOpen={Boolean(prompt)}
      folderName={prompt?.folderName}
      mode={mode}
      onCancel={
        isServerActionCancellable(mode) ? cancelServerActionProgress : undefined
      }
    />
  );
}
