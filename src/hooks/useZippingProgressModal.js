import { useCallback, useSyncExternalStore } from "react";
import {
  beginServerActionProgress,
  endServerActionProgress,
  cancelServerActionProgress,
  getServerActionProgress,
  subscribeServerActionProgress,
} from "../utils/serverActionProgressStore";

/**
 * Controls the floating zip / unzip / copy / move / delete panel.
 * Progress UI is rendered once in App (ServerActionProgressHost) so it
 * survives navigating into another folder mid-transfer.
 */
export function useZippingProgressModal() {
  const zippingPrompt = useSyncExternalStore(
    subscribeServerActionProgress,
    getServerActionProgress,
    () => null
  );

  const beginZipping = useCallback((folderName, options = {}) => {
    return beginServerActionProgress(folderName, options);
  }, []);

  const endZipping = useCallback(() => {
    endServerActionProgress();
  }, []);

  const cancelZipping = useCallback(() => {
    cancelServerActionProgress();
  }, []);

  // Modal lives in App — keep key so existing `{zippingModal}` call sites stay valid
  const zippingModal = null;

  return {
    zippingPrompt,
    beginZipping,
    endZipping,
    cancelZipping,
    zippingModal,
  };
}
