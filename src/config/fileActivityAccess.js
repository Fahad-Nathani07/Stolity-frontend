/**
 * Who can see the Support Dashboard "File Activity" tab.
 *
 * Prefer REACT_APP_FILE_ACTIVITY_EMAILS (comma-separated) in Client/.env.
 * Example: REACT_APP_FILE_ACTIVITY_EMAILS=fahad@infomanav.in,other@infomanav.in
 *
 * Falls back to DEFAULT_EMAILS when the env var is empty.
 */

const DEFAULT_EMAILS = ["fahad@infomanav.in"];

function parseEmailList(raw) {
  return String(raw || "")
    .split(/[,;\s]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function getFileActivityEmails() {
  const fromEnv = parseEmailList(process.env.REACT_APP_FILE_ACTIVITY_EMAILS);
  return fromEnv.length ? fromEnv : DEFAULT_EMAILS;
}

export function canViewFileActivity(email) {
  const normalized = String(email || "").trim().toLowerCase();
  if (!normalized) return false;
  return getFileActivityEmails().includes(normalized);
}
