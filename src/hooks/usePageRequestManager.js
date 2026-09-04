import { useEffect, useRef } from "react";
import { createPageRequestManager } from "../utils/cancellablePageRequest";

/**
 * One cancellable request manager per page instance.
 * Cancels all in-flight monitored requests on unmount.
 */
export default function usePageRequestManager(pageKey) {
  const managerRef = useRef(null);

  if (!managerRef.current || managerRef.current.pageKey !== pageKey) {
    managerRef.current = createPageRequestManager(pageKey);
  }

  useEffect(() => {
    const manager = managerRef.current;
    return () => {
      manager?.cancelAll();
    };
  }, [pageKey]);

  return managerRef.current;
}
