import { useLayoutEffect, useState } from "react";

const EDGE = 8;
const WIDTH = 328;
const GAP = 8;

/**
 * Positions .ft-filter-popup with position:fixed so it is not clipped by
 * .content-wrapper overflow (pagination footer / sides).
 */
export function useFtFilterPopupStyle(anchorRef, open) {
  const [style, setStyle] = useState(null);

  useLayoutEffect(() => {
    if (!open) {
      setStyle(null);
      return undefined;
    }

    const vv = window.visualViewport;

    const place = () => {
      const el = anchorRef?.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const viewW = vv?.width ?? window.innerWidth;
      const viewH = (vv?.height ?? window.innerHeight) + (vv?.offsetTop || 0);
      const viewLeft = vv?.offsetLeft || 0;

      const width = Math.min(WIDTH, viewW - EDGE * 2);
      let left = rect.right - width;
      left = Math.max(viewLeft + EDGE, Math.min(left, viewLeft + viewW - width - EDGE));

      const footer = document.querySelector(".files-pagination-footer");
      const bottomLimit = footer
        ? Math.min(viewH, footer.getBoundingClientRect().top) - EDGE
        : viewH - EDGE;
      const topLimit = EDGE;

      const spaceBelow = bottomLimit - (rect.bottom + GAP);
      const spaceAbove = rect.top - GAP - topLimit;
      const openUp = spaceBelow < 280 && spaceAbove > spaceBelow;
      const available = openUp ? spaceAbove : spaceBelow;
      const maxHeight = Math.min(560, Math.max(available, 0));

      if (openUp) {
        setStyle({
          position: "fixed",
          left,
          right: "auto",
          width,
          top: "auto",
          bottom: Math.max(EDGE, window.innerHeight - rect.top + GAP),
          maxHeight,
          zIndex: 5200,
          overflow: "hidden",
        });
      } else {
        setStyle({
          position: "fixed",
          left,
          right: "auto",
          width,
          top: rect.bottom + GAP,
          bottom: "auto",
          maxHeight,
          zIndex: 5200,
          overflow: "hidden",
        });
      }
    };

    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    vv?.addEventListener?.("resize", place);
    vv?.addEventListener?.("scroll", place);

    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
      vv?.removeEventListener?.("resize", place);
      vv?.removeEventListener?.("scroll", place);
    };
  }, [open, anchorRef]);

  return style;
}

export default useFtFilterPopupStyle;
