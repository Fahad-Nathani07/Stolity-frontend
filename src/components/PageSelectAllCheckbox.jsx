import React, { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import {
  subscribeSelectionChrome,
  getPageSelectAllState,
  toggleSelectAllPage,
} from "./fileSelectionStore";

/**
 * Parent (thead / card header) checkbox bound to the selection store.
 */
export default function PageSelectAllCheckbox({
  pageItems,
  id = "check-Atharva",
  className,
  style,
  disabled = false,
  "aria-label": ariaLabel = "Select all on this page",
}) {
  const itemsRef = useRef(pageItems);
  itemsRef.current = pageItems;

  const getSnapshot = useCallback(() => {
    const state = getPageSelectAllState(itemsRef.current);
    // Primitive snapshot so useSyncExternalStore compares cheaply
    return `${state.checked ? 1 : 0}:${state.indeterminate ? 1 : 0}:${state.selectedOnPage}:${state.total}`;
  }, []);

  const snapshot = useSyncExternalStore(
    subscribeSelectionChrome,
    getSnapshot,
    getSnapshot
  );
  const [checkedBit, indeterminateBit] = snapshot.split(":");
  const checked = checkedBit === "1";
  const indeterminate = indeterminateBit === "1";

  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate && !checked;
    }
  }, [indeterminate, checked]);

  return (
    <input
      ref={ref}
      id={id}
      type="checkbox"
      className={className}
      style={style}
      disabled={disabled}
      checked={checked}
      aria-label={ariaLabel}
      aria-checked={indeterminate && !checked ? "mixed" : checked}
      onChange={() => {
        if (disabled) return;
        toggleSelectAllPage(itemsRef.current);
      }}
    />
  );
}
