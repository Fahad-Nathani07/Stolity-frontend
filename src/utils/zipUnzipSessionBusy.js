/**
 * Global busy flag for zip/unzip so InactivityHandler can keep the session alive
 * while a long server-side zip/unzip runs (no mouse activity).
 */

let busyCount = 0;
const listeners = new Set();

function notify() {
  const busy = busyCount > 0;
  listeners.forEach((fn) => {
    try {
      fn(busy);
    } catch (_) {}
  });
}

export function markZipUnzipBusy(active) {
  const prev = busyCount;
  busyCount = Math.max(0, busyCount + (active ? 1 : -1));
  if ((prev === 0) !== (busyCount === 0)) {
    notify();
  }
}

export function isZipUnzipBusy() {
  return busyCount > 0;
}

export function subscribeZipUnzipBusy(listener) {
  if (typeof listener !== "function") return () => {};
  listeners.add(listener);
  return () => listeners.delete(listener);
}
