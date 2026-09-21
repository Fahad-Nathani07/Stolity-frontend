import React, { useEffect, useRef } from "react";

/**
 * Parent checkbox: checked | indeterminate (−) | unchecked.
 * `indeterminate` must be set via DOM (not a React attribute).
 */
export default function SelectAllCheckbox({
  checked = false,
  indeterminate = false,
  onChange,
  id,
  className,
  style,
  disabled = false,
  "aria-label": ariaLabel = "Select all on this page",
}) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = Boolean(indeterminate) && !checked;
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
      onChange={onChange}
    />
  );
}
