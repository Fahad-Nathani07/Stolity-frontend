import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { logAnalyticsEvent } from "../firebase";

/**
 * Sends a GA4 page_view on every React Router navigation.
 * Must render inside <BrowserRouter>.
 */
export default function AnalyticsPageViews() {
  const location = useLocation();

  useEffect(() => {
    logAnalyticsEvent("page_view", {
      page_path: location.pathname + location.search,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [location.pathname, location.search]);

  return null;
}
