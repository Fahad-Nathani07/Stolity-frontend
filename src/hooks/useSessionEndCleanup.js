import { useEffect, useRef } from "react";
import { SESSION_END_EVENT } from "../utils/endUserSession";

/**
 * Run `onSessionEnd` when the user session ends (timeout, logout, expiry).
 * Use to close page-level modals (preview, copy, move, folder picker, etc.).
 */
export function useSessionEndCleanup(onSessionEnd) {
  const handlerRef = useRef(onSessionEnd);
  handlerRef.current = onSessionEnd;

  useEffect(() => {
    const onEnd = () => handlerRef.current?.();
    window.addEventListener(SESSION_END_EVENT, onEnd);
    return () => window.removeEventListener(SESSION_END_EVENT, onEnd);
  }, []);
}
