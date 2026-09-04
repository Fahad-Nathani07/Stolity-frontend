import { useEffect, useRef } from "react";

const MOBILE_MQ = "(max-width: 767px)";

/**
 * Sticky filter bar + table thead for file list pages.
 * Apply returned `tableBoxClassName` on table_box and attach refs.
 * Add `has-bulk-selection` via class when any row is checked (handled in className).
 */
export function useStickyListHeader(view, hasBulkSelection = false) {
  const filterBarRef = useRef(null);
  const tableBoxRef = useRef(null);

  const tableBoxClassName = `table_box stolity-list-sticky${
    hasBulkSelection ? " has-bulk-selection" : ""
  }`;

  useEffect(() => {
    const bar = filterBarRef.current;
    const box = tableBoxRef.current;
    if (!bar || !box) return undefined;

    let rafId = null;

    const syncFilterBarHeight = () => {
      const height = bar.offsetHeight;
      if (!height) return;
      const next = `${height}px`;
      if (box.style.getPropertyValue("--files-filter-bar-height") !== next) {
        box.style.setProperty("--files-filter-bar-height", next);
      }
    };

    const scheduleSync = () => {
      if (rafId != null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        syncFilterBarHeight();
      });
    };

    scheduleSync();
    window.addEventListener("resize", scheduleSync);

    const mq = window.matchMedia(MOBILE_MQ);
    mq.addEventListener("change", scheduleSync);

    return () => {
      if (rafId != null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
      window.removeEventListener("resize", scheduleSync);
      mq.removeEventListener("change", scheduleSync);
    };
  }, [view]);

  return { filterBarRef, tableBoxRef, tableBoxClassName };
}
