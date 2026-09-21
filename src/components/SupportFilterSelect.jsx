import React, { useEffect, useMemo, useRef, useState } from "react";
import { FiCheck, FiChevronDown } from "react-icons/fi";

/**
 * Custom filter select for Support dashboard (no native <select>).
 */
export default function SupportFilterSelect({
  label,
  value,
  options = [],
  onChange,
  ariaLabel,
  placeholder = "Select…",
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const selected = options.find((opt) => opt.id === value);
  const displayLabel = selected?.label || placeholder;

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div
      className={`ssd-filter-select${open ? " is-open" : ""}${
        className ? ` ${className}` : ""
      }`}
      ref={rootRef}
    >
      {label ? <span className="ssd-filter-select-label">{label}</span> : null}
      <button
        type="button"
        className={`ssd-filter-select-trigger${
          selected ? "" : " is-placeholder"
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel || label || "Filter"}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{displayLabel}</span>
        <FiChevronDown aria-hidden="true" />
      </button>
      {open ? (
        <ul className="ssd-filter-select-menu" role="listbox">
          {options.map((opt) => {
            const active = opt.id === value;
            return (
              <li key={opt.id || "empty"} role="option" aria-selected={active}>
                <button
                  type="button"
                  className={`ssd-filter-select-option${
                    active ? " is-active" : ""
                  }`}
                  onClick={() => {
                    onChange?.(opt.id);
                    setOpen(false);
                  }}
                >
                  <span>{opt.label}</span>
                  {active ? <FiCheck aria-hidden="true" /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

/**
 * Multi-select filter dropdown with Select all / Clear all.
 * Empty `values` means no filter (all).
 */
export function SupportMultiFilterSelect({
  label,
  values = [],
  options = [],
  onChange,
  ariaLabel,
  allLabel = "All statuses",
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const selectedSet = useMemo(() => new Set(values), [values]);
  const allIds = useMemo(() => options.map((opt) => opt.id), [options]);
  const selectedCount = values.length;
  const allSelected =
    allIds.length > 0 && allIds.every((id) => selectedSet.has(id));
  const noneSelected = selectedCount === 0;

  const displayLabel = useMemo(() => {
    if (noneSelected || allSelected) return allLabel;
    if (selectedCount === 1) {
      return options.find((opt) => opt.id === values[0])?.label || values[0];
    }
    return `${selectedCount} selected`;
  }, [noneSelected, allSelected, allLabel, selectedCount, options, values]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const toggleValue = (id) => {
    const next = new Set(selectedSet);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange?.(Array.from(next));
  };

  return (
    <div
      className={`ssd-filter-select ssd-multi-select${open ? " is-open" : ""}${
        className ? ` ${className}` : ""
      }`}
      ref={rootRef}
    >
      {label ? <span className="ssd-filter-select-label">{label}</span> : null}
      <button
        type="button"
        className={`ssd-filter-select-trigger${
          noneSelected || allSelected ? "" : " has-selection"
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel || label || "Filter"}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{displayLabel}</span>
        <FiChevronDown aria-hidden="true" />
      </button>
      {open ? (
        <div className="ssd-filter-select-menu ssd-multi-select-menu">
          <div className="ssd-multi-select-actions">
            <button
              type="button"
              className="ssd-multi-select-action"
              disabled={allSelected}
              onClick={() => onChange?.(allIds.slice())}
            >
              Select all
            </button>
            <button
              type="button"
              className="ssd-multi-select-action"
              disabled={noneSelected}
              onClick={() => onChange?.([])}
            >
              Clear all
            </button>
          </div>
          <ul role="listbox" aria-multiselectable="true">
            {options.map((opt) => {
              const active = selectedSet.has(opt.id);
              return (
                <li key={opt.id} role="option" aria-selected={active}>
                  <button
                    type="button"
                    className={`ssd-filter-select-option ssd-multi-select-option${
                      active ? " is-active" : ""
                    }`}
                    onClick={() => toggleValue(opt.id)}
                  >
                    <span
                      className={`ssd-multi-check${active ? " is-on" : ""}`}
                      aria-hidden="true"
                    >
                      {active ? <FiCheck /> : null}
                    </span>
                    <span>{opt.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Shows the pane scrollbar while scrolling (hidden again shortly after).
 * Hover/focus also reveals it via CSS.
 */
export function markPaneScrolling(e) {
  const el = e.currentTarget;
  if (!el) return;
  el.classList.add("is-scrolling");
  window.clearTimeout(el.__ssdScrollTimer);
  el.__ssdScrollTimer = window.setTimeout(() => {
    el.classList.remove("is-scrolling");
  }, 900);
}
