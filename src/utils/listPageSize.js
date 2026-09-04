const STORAGE_KEY = "stolity_list_items_per_page";
export const DEFAULT_LIST_PAGE_SIZE = 15;
const MIN_ROWS = 1;
const MAX_ROWS = 500;

export function getStoredItemsPerPage() {
  try {
    const parsed = Number(localStorage.getItem(STORAGE_KEY));
    if (Number.isFinite(parsed) && parsed >= MIN_ROWS && parsed <= MAX_ROWS) {
      return parsed;
    }
  } catch {
    /* ignore storage errors */
  }
  return DEFAULT_LIST_PAGE_SIZE;
}

export function setStoredItemsPerPage(size) {
  const parsed = Number(size);
  if (!Number.isFinite(parsed) || parsed < MIN_ROWS || parsed > MAX_ROWS) {
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEY, String(parsed));
  } catch {
    /* ignore storage errors */
  }
}
