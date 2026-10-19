import axios from "axios";

const REF_KEY = "stolity_ref";
const VISITOR_KEY = "stolity_affiliate_vid";
const TRACKED_KEY = "stolity_ref_tracked";
const CODE_REGEX = /^[A-Z0-9]{6,12}$/;

function normalizeCode(raw) {
  return String(raw || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function makeVisitorId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, "");
  }
  return `v${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}

export function getOrCreateVisitorId() {
  try {
    const existing = localStorage.getItem(VISITOR_KEY);
    if (existing && /^[A-Za-z0-9_-]{8,64}$/.test(existing)) return existing;
    const next = makeVisitorId().slice(0, 64);
    localStorage.setItem(VISITOR_KEY, next);
    return next;
  } catch {
    return makeVisitorId().slice(0, 64);
  }
}

/** Capture ?ref= from a location search string into localStorage. */
export function captureReferralFromSearch(search) {
  try {
    const params = new URLSearchParams(
      search ||
        (typeof window !== "undefined" ? window.location.search : "") ||
        ""
    );
    const code = normalizeCode(params.get("ref"));
    if (!CODE_REGEX.test(code)) return null;
    localStorage.setItem(REF_KEY, code);
    return code;
  } catch {
    return null;
  }
}

/** Persist ref as soon as this module loads (before React navigates away). */
if (typeof window !== "undefined") {
  try {
    captureReferralFromSearch(window.location.search);
  } catch {
    /* ignore */
  }
}

export function getStoredReferralCode() {
  try {
    const code = normalizeCode(localStorage.getItem(REF_KEY));
    return CODE_REGEX.test(code) ? code : "";
  } catch {
    return "";
  }
}

export function clearStoredReferral() {
  try {
    localStorage.removeItem(REF_KEY);
    sessionStorage.removeItem(TRACKED_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Track one click per browser session for the stored referral code.
 * Safe on refresh: server also dedupes by visitorId.
 */
export async function trackReferralClickOnce(apiUrl) {
  const code = getStoredReferralCode();
  if (!code || !apiUrl) return;

  try {
    if (sessionStorage.getItem(TRACKED_KEY) === code) return;
  } catch {
    /* continue */
  }

  const visitorId = getOrCreateVisitorId();
  try {
    await axios.post(
      `${apiUrl}affiliate/click`,
      { code, visitorId },
      { headers: { "Content-Type": "application/json" }, timeout: 8000 }
    );
    try {
      sessionStorage.setItem(TRACKED_KEY, code);
    } catch {
      /* ignore */
    }
  } catch (err) {
    // Keep ref in localStorage; retry on next page load
    console.warn(
      "Affiliate click track failed:",
      err?.response?.data?.message || err?.message || err
    );
  }
}

/** Capture from URL + track click (call on Signup / any landing with ?ref=). */
export async function initReferralFromLocation(apiUrl, search) {
  captureReferralFromSearch(search);
  await trackReferralClickOnce(apiUrl);
}

/**
 * After successful login: if localStorage still has ref, attribute signup once.
 *
 * Always removes stolity_ref after the server answers (success OR already counted),
 * so logout → login cannot increment totalSignups again.
 * Server also dedupes by userId (affiliateAttributions + users.referredBy).
 */
export async function attributeStoredReferral(apiUrl, accessToken) {
  const code = getStoredReferralCode();
  if (!code || !apiUrl || !accessToken) {
    return { attributed: false, reason: "missing_or_invalid" };
  }

  try {
    const res = await axios.post(
      `${apiUrl}affiliate/attribute-signup`,
      { referralCode: code },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );
    const data = res.data || {};
    // Server responded — drop local ref so future logins never retry this code
    clearStoredReferral();
    return data;
  } catch (err) {
    const status = err?.response?.status;
    const reason = err?.response?.data?.reason;
    // Definitive "won't count again" answers → clear. Keep ref only on network/5xx to retry once.
    if (
      status === 400 ||
      status === 404 ||
      status === 410 ||
      reason === "already_attributed" ||
      reason === "code_not_found" ||
      reason === "not_new_user" ||
      reason === "inactive" ||
      reason === "missing_or_invalid"
    ) {
      clearStoredReferral();
    }
    console.warn(
      "Affiliate signup attribute failed:",
      err?.response?.data?.message || err?.message || err
    );
    return {
      attributed: false,
      reason: reason || "error",
    };
  }
}
