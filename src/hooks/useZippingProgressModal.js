import { useCallback, useRef, useState } from "react";
import ZippingProgressModal from "../components/ZippingProgressModal";

/**
 * Controls the floating zipping panel for Zip-and-download.
 */
export function useZippingProgressModal() {
  const [zippingPrompt, setZippingPrompt] = useState(null);
  const abortRef = useRef(null);

  const beginZipping = useCallback((folderName) => {
    const controller =
      typeof AbortController !== "undefined" ? new AbortController() : null;
    abortRef.current = controller;
    setZippingPrompt({
      folderName: folderName || "",
      startedAt: Date.now(),
    });
    return controller;
  }, []);

  const endZipping = useCallback(() => {
    abortRef.current = null;
    setZippingPrompt(null);
  }, []);

  const cancelZipping = useCallback(() => {
    try {
      abortRef.current?.abort();
    } catch (_) {}
    abortRef.current = null;
    setZippingPrompt(null);
  }, []);

  const zippingModal = (
    <ZippingProgressModal
      isOpen={Boolean(zippingPrompt)}
      folderName={zippingPrompt?.folderName}
      onCancel={cancelZipping}
    />
  );

  return {
    zippingPrompt,
    beginZipping,
    endZipping,
    cancelZipping,
    zippingModal,
  };
}
