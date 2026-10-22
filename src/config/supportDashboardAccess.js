/**
 * Who can see / open the Support Dashboard (sidebar + route).
 *
 * Prefer REACT_APP_SUPPORT_DASHBOARD_EMAILS (comma-separated) in Client/.env.
 * Falls back to DEFAULT_EMAILS when the env var is empty.
 */

const DEFAULT_EMAILS = [
  "fahad@infomanav.in",
  "rohitpatel@infomanav.com",
  "rohit@infomanav.com",
  "b@infomanav.com",
];

function parseEmailList(raw) {
  return String(raw || "")
    .split(/[,;\s]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function getSupportDashboardEmails() {
  const fromEnv = parseEmailList(
    process.env.REACT_APP_SUPPORT_DASHBOARD_EMAILS
  );
  return fromEnv.length ? fromEnv : DEFAULT_EMAILS;
}

export function canViewSupportDashboard(email) {
  const normalized = String(email || "").trim().toLowerCase();
  if (!normalized) return false;
  return getSupportDashboardEmails().includes(normalized);
}
