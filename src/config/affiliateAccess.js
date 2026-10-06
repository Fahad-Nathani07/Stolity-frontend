/**
 * Who can see the Support Dashboard "Affiliate Links" tab.
 *
 * Prefer REACT_APP_AFFILIATE_ACCESS_EMAILS (comma-separated) in Client/.env.
 * Falls back to DEFAULT_EMAILS when the env var is empty.
 */

const DEFAULT_EMAILS = [
  "fahad@infomanav.in",
  "rohitpatel@infomanav.com",
];

function parseEmailList(raw) {
  return String(raw || "")
    .split(/[,;\s]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function getAffiliateAccessEmails() {
  const fromEnv = parseEmailList(process.env.REACT_APP_AFFILIATE_ACCESS_EMAILS);
  return fromEnv.length ? fromEnv : DEFAULT_EMAILS;
}

export function canViewAffiliateLinks(email) {
  const normalized = String(email || "").trim().toLowerCase();
  if (!normalized) return false;
  return getAffiliateAccessEmails().includes(normalized);
}
