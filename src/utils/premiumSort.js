/** All Sort By options are premium (entire control is premium-only). */
export const PREMIUM_SORT_KEYS = new Set([
  "name-filter1",
  "name-filter2",
  "size-filter1",
  "size-filter2",
  "date-filter1",
  "date-filter2",
]);

export function isPremiumSortKey(eventKey) {
  return PREMIUM_SORT_KEYS.has(eventKey);
}

/**
 * Gate Sort By selections. Clearing to default is always allowed.
 * Any actual sort option requires premium.
 */
export function gatePremiumSort({ eventKey, isPremium, onUpgradeRequired }) {
  if (isPremium) return true;
  if (eventKey === "default" || eventKey == null) return true;
  onUpgradeRequired?.();
  return false;
}
