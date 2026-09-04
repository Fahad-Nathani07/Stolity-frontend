/** Minimum time action loaders (delete / restore) stay visible */
export const ACTION_LOADER_MIN_MS = 1000;

/** Delay after an action API completes before hiding its loader */
export const LOADER_POST_COMPLETE_MS = 1000;

/**
 * Run callback after at least ACTION_LOADER_MIN_MS since the loader was shown.
 * @param {number} startedAt - Date.now() when loader became visible
 * @param {() => void} onComplete
 */
export function afterMinLoaderDisplay(startedAt, onComplete) {
  const elapsed = Date.now() - startedAt;
  const remaining = Math.max(0, ACTION_LOADER_MIN_MS - elapsed);
  setTimeout(onComplete, remaining);
}

/**
 * Run callback after LOADER_POST_COMPLETE_MS once the action (e.g. API) has finished.
 * @param {() => void} onComplete
 * @param {number} [delayMs]
 */
export function afterLoaderComplete(onComplete, delayMs = LOADER_POST_COMPLETE_MS) {
  setTimeout(onComplete, delayMs);
}
