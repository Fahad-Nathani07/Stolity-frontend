import { useCallback, useEffect, useState } from "react";
import axios from "axios";

export const SUPPORT_TICKETS_UNREAD_REFRESH = "support-tickets-unread-refresh";

const POLL_MS = 45_000;

export function refreshSupportTicketsUnread() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SUPPORT_TICKETS_UNREAD_REFRESH));
}

/**
 * Polls unread support-ticket count for the logged-in user (sidebar badge).
 * Count = number of tickets with newer agent replies than last read.
 */
export default function useSupportTicketsUnread({ enabled = true } = {}) {
  const [count, setCount] = useState(0);
  const apiUrl = process.env.REACT_APP_API_ENDPOINT;
  const token =
    typeof sessionStorage !== "undefined"
      ? sessionStorage.getItem("number")
      : null;

  const fetchCount = useCallback(async () => {
    if (!enabled || !apiUrl || !token) {
      setCount(0);
      return;
    }
    try {
      const res = await axios.get(`${apiUrl}my-support-tickets/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const next = Number(res.data?.count ?? res.data?.result?.count) || 0;
      setCount(next);
    } catch {
      /* keep last known count */
    }
  }, [apiUrl, token, enabled]);

  useEffect(() => {
    if (!enabled) {
      setCount(0);
      return undefined;
    }
    fetchCount();
    const interval = window.setInterval(fetchCount, POLL_MS);
    const onRefresh = () => fetchCount();
    const onFocus = () => fetchCount();
    window.addEventListener(SUPPORT_TICKETS_UNREAD_REFRESH, onRefresh);
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener(SUPPORT_TICKETS_UNREAD_REFRESH, onRefresh);
      window.removeEventListener("focus", onFocus);
    };
  }, [enabled, fetchCount]);

  return { count, refresh: fetchCount };
}
