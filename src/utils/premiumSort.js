export const PREMIUM_SORT_KEYS = new Set([
  "size-filter1",
  "size-filter2",
  "date-filter1",
  "date-filter2",
]);

export function isPremiumSortKey(eventKey) {
  return PREMIUM_SORT_KEYS.has(eventKey);
}

export function gatePremiumSort({ eventKey, isPremium, onUpgradeRequired }) {
  if (isPremium || !isPremiumSortKey(eventKey)) return true;
  onUpgradeRequired?.();
  return false;
}
