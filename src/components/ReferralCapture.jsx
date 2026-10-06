import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  captureReferralFromSearch,
  getStoredReferralCode,
  initReferralFromLocation,
  trackReferralClickOnce,
} from "../utils/referralCapture";

/** Captures ?ref= on any public landing URL and tracks the click once. */
export default function ReferralCapture() {
  const location = useLocation();
  const apiUrl = process.env.REACT_APP_API_ENDPOINT;

  useEffect(() => {
    // Always re-capture from URL when present; also retry click if stored ref exists
    if (location.search && /[?&]ref=/i.test(location.search)) {
      initReferralFromLocation(apiUrl, location.search);
      return;
    }
    // Landing without ?ref= but localStorage still has one (e.g. after client nav)
    captureReferralFromSearch(location.search);
    if (getStoredReferralCode()) {
      trackReferralClickOnce(apiUrl);
    }
  }, [apiUrl, location.search, location.pathname]);

  return null;
}
