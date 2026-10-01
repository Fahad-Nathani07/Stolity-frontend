import { useCallback, useRef, useState } from "react";
import ZippingProgressModal from "../components/ZippingProgressModal";
import { markZipUnzipBusy } from "../utils/zipUnzipSessionBusy";

/**
 * Controls the floating zip / unzip panel (replaces full-page Loader2).
 * Also marks session busy so 15‑min auto-logout stays paused.
 */
export function useZippingProgressModal() {
  const [zippingPrompt, setZippingPrompt] = useState(null);
  const abortRef = useRef(null);
  const busyMarkedRef = useRef(false);

  const clearBusy = useCallback(() => {
    if (!busyMarkedRef.current) return;
    markZipUnzipBusy(false);
    busyMarkedRef.current = false;
  }, []);

  /**
   * @param {string} [folderName]
   * @param {{ mode?: 'zip'|'unzip' }} [options]
   * @returns {AbortController|null}
   */
  const beginZipping = useCallback((folderName, options = {}) => {
    const mode = options.mode === "unzip" ? "unzip" : "zip";
    const controller =
      typeof AbortController !== "undefined" ? new AbortController() : null;
    abortRef.current = controller;
    if (!busyMarkedRef.current) {
      markZipUnzipBusy(true);
      busyMarkedRef.current = true;
    }
    setZippingPrompt({
      folderName: folderName || "",
      mode,
      startedAt: Date.now(),
    });
    return controller;
  }, []);

  const endZipping = useCallback(() => {
    abortRef.current = null;
    clearBusy();
    setZippingPrompt(null);
  }, [clearBusy]);

  const cancelZipping = useCallback(() => {
    try {
      abortRef.current?.abort();
    } catch (_) {}
    abortRef.current = null;
    clearBusy();
    setZippingPrompt(null);
  }, [clearBusy]);

  const zippingModal = (
    <ZippingProgressModal
      isOpen={Boolean(zippingPrompt)}
      folderName={zippingPrompt?.folderName}
      mode={zippingPrompt?.mode || "zip"}
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
