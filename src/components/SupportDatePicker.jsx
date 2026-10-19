import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiCalendar, FiChevronLeft, FiChevronRight } from "react-icons/fi";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function parseKey(key) {
  if (!key || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  if (
    dt.getFullYear() !== y ||
    dt.getMonth() !== m - 1 ||
    dt.getDate() !== d
  ) {
    return null;
  }
  return dt;
}

function toKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDisplay(key) {
  const dt = parseKey(key);
  if (!dt) return "Select date";
  try {
    return dt.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return key;
  }
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date, delta) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function buildGrid(monthStart) {
  const year = monthStart.getFullYear();
  const month = monthStart.getMonth();
  const firstDow = monthStart.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDow; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/**
 * Themed date picker for Support dashboard (no native <input type="date">).
 * Value / min / max use YYYY-MM-DD keys.
 */
export default function SupportDatePicker({
  label,
  value,
  onChange,
  min,
  max,
  disabled = false,
  ariaLabel,
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const menuRef = useRef(null);
  const [menuStyle, setMenuStyle] = useState(null);

  const selected = parseKey(value);
  const minDate = parseKey(min);
  const maxDate = parseKey(max);

  const [viewMonth, setViewMonth] = useState(() =>
    startOfMonth(selected || maxDate || new Date())
  );

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  useEffect(() => {
    if (!open) return;
    setViewMonth(startOfMonth(selected || maxDate || new Date()));
  }, [open, selected, maxDate]);

  useLayoutEffect(() => {
    if (!open || !rootRef.current) {
      setMenuStyle(null);
      return undefined;
    }
    const place = () => {
      const rect = rootRef.current.getBoundingClientRect();
      const width = 280;
      const gap = 6;
      let left = rect.left;
      if (left + width > window.innerWidth - 8) {
        left = Math.max(8, rect.right - width);
      }
      setMenuStyle({
        position: "fixed",
        top: rect.bottom + gap,
        left,
        width,
        zIndex: 120,
      });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e) => {
      if (rootRef.current?.contains(e.target)) return;
      if (menuRef.current?.contains(e.target)) return;
      setOpen(false);
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

  const cells = useMemo(() => buildGrid(viewMonth), [viewMonth]);
  const today = toKey(new Date());
  const monthLabel = viewMonth.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  const isDisabledDay = (date) => {
    if (!date) return true;
    const key = toKey(date);
    if (minDate && key < toKey(minDate)) return true;
    if (maxDate && key > toKey(maxDate)) return true;
    return false;
  };

  const pick = (date) => {
    if (!date || isDisabledDay(date)) return;
    onChange?.(toKey(date));
    setOpen(false);
  };

  const menu =
    open && menuStyle
      ? createPortal(
          <div
            className="ssd-date-picker-menu"
            ref={menuRef}
            style={menuStyle}
            role="dialog"
            aria-label={ariaLabel || label || "Choose date"}
          >
            <div className="ssd-date-picker-nav">
              <button
                type="button"
                className="ssd-date-picker-nav-btn"
                onClick={() => setViewMonth((m) => addMonths(m, -1))}
                aria-label="Previous month"
              >
                <FiChevronLeft aria-hidden="true" />
              </button>
              <span className="ssd-date-picker-month">{monthLabel}</span>
              <button
                type="button"
                className="ssd-date-picker-nav-btn"
                onClick={() => setViewMonth((m) => addMonths(m, 1))}
                aria-label="Next month"
              >
                <FiChevronRight aria-hidden="true" />
              </button>
            </div>
            <div className="ssd-date-picker-weekdays">
              {WEEKDAYS.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
            <div className="ssd-date-picker-grid">
              {cells.map((date, idx) => {
                if (!date) {
                  return (
                    <span key={`e-${idx}`} className="ssd-date-picker-day is-empty" />
                  );
                }
                const key = toKey(date);
                const selectedDay = value === key;
                const isToday = today === key;
                const dayDisabled = isDisabledDay(date);
                return (
                  <button
                    key={key}
                    type="button"
                    className={`ssd-date-picker-day${
                      selectedDay ? " is-selected" : ""
                    }${isToday ? " is-today" : ""}${
                      dayDisabled ? " is-disabled" : ""
                    }`}
                    disabled={dayDisabled}
                    onClick={() => pick(date)}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div
      className={`ssd-date-picker${open ? " is-open" : ""}${
        disabled ? " is-disabled" : ""
      }${className ? ` ${className}` : ""}`}
      ref={rootRef}
    >
      <button
        type="button"
        className="ssd-date-picker-trigger"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel || label || "Date"}
        onClick={() => {
          if (disabled) return;
          setOpen((v) => !v);
        }}
      >
        {label ? <span className="ssd-date-picker-label">{label}</span> : null}
        <span className="ssd-date-picker-value">{formatDisplay(value)}</span>
        <FiCalendar className="ssd-date-picker-icon" aria-hidden="true" />
      </button>
      {menu}
    </div>
  );
}
