const NESTED_NAV_KEY = "stolityNestedNav";

/**
 * Persist nested folder location so refresh stays on A/B/C instead of bouncing to Files.
 */
export function saveNestedNav({
  folderPath = "",
  counter = 0,
  isSharedValue = false,
  fileName = "",
} = {}) {
  try {
    const path = String(folderPath || "").trim();
    const depth = Number(counter) || 0;
    if (!path || depth < 1) {
      sessionStorage.removeItem(NESTED_NAV_KEY);
      return;
    }
    sessionStorage.setItem(
      NESTED_NAV_KEY,
      JSON.stringify({
        folderPath: path.endsWith("/") ? path : `${path}/`,
        counter: depth,
        isSharedValue: Boolean(isSharedValue),
        fileName: String(fileName || ""),
        savedAt: Date.now(),
      })
    );
  } catch {
    /* ignore quota / private mode */
  }
}

export function loadNestedNav() {
  try {
    const raw = sessionStorage.getItem(NESTED_NAV_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data?.folderPath || !(Number(data.counter) > 0)) return null;
    return {
      folderPath: String(data.folderPath),
      counter: Number(data.counter),
      isSharedValue: Boolean(data.isSharedValue),
      fileName: String(data.fileName || ""),
    };
  } catch {
    return null;
  }
}

export function clearNestedNav() {
  try {
    sessionStorage.removeItem(NESTED_NAV_KEY);
  } catch {
    /* ignore */
  }
}
