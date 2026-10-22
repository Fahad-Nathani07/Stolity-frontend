const STORAGE_KEY = "stolity_list_items_per_page";
export const DEFAULT_LIST_PAGE_SIZE = 15;
const MIN_ROWS = 1;
export const MAX_LIST_PAGE_SIZE = 999;

export function getStoredItemsPerPage() {
  try {
    const parsed = Number(localStorage.getItem(STORAGE_KEY));
    if (
      Number.isFinite(parsed) &&
      parsed >= MIN_ROWS &&
      parsed <= MAX_LIST_PAGE_SIZE
    ) {
      return parsed;
    }
  } catch {
    /* ignore storage errors */
  }
  return DEFAULT_LIST_PAGE_SIZE;
}

export function setStoredItemsPerPage(size) {
  const parsed = Number(size);
  if (
    !Number.isFinite(parsed) ||
    parsed < MIN_ROWS ||
    parsed > MAX_LIST_PAGE_SIZE
  ) {
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEY, String(parsed));
  } catch {
    /* ignore storage errors */
  }
}
