import React, { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function parseKey(key) {
  if (!key || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function toKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDisplay(key) {
  const date = parseKey(key);
  if (!date) return "dd-mm-yyyy";
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${d}-${m}-${date.getFullYear()}`;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function sameDay(a, b) {
  return (
    a &&
    b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function clampMonth(view, minDate, maxDate) {
  let next = startOfMonth(view);
  if (minDate) {
    const minM = startOfMonth(minDate);
    if (next < minM) next = minM;
  }
  if (maxDate) {
    const maxM = startOfMonth(maxDate);
    if (next > maxM) next = maxM;
  }
  return next;
}

/**
 * Premium themed date field for Support Dashboard.
 * value/min/max use YYYY-MM-DD keys (same as native <input type="date">).
 */
export default function SupportDateField({
  label,
  value,
  onChange,
  min,
  max,
  disabled = false,
  placeholder = "dd-mm-yyyy",
}) {
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const selected = parseKey(value);
  const minDate = parseKey(min);
  const maxDate = parseKey(max);

  const [view, setView] = useState(() =>
    startOfMonth(selected || maxDate || new Date())
  );

  useEffect(() => {
    if (!open) return undefined;
    setView(clampMonth(selected || maxDate || new Date(), minDate, maxDate));

    const onDoc = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, selected, minDate, maxDate]);

  const days = useMemo(() => {
    const first = startOfMonth(view);
    const startPad = first.getDay();
    const gridStart = new Date(first);
    gridStart.setDate(first.getDate() - startPad);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      return d;
    });
  }, [view]);

  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const canPrev = !minDate || startOfMonth(view) > startOfMonth(minDate);
  const canNext = !maxDate || startOfMonth(view) < startOfMonth(maxDate);

  const isDisabledDay = (d) => {
    const key = toKey(d);
    if (min && key < min) return true;
    if (max && key > max) return true;
    return false;
  };

  const pick = (d) => {
    if (isDisabledDay(d)) return;
    onChange?.(toKey(d));
    setOpen(false);
  };

  return (
    <div
      className={`ssd-datefield${open ? " is-open" : ""}${
        disabled ? " is-disabled" : ""
      }`}
      ref={rootRef}
    >
      {label ? <span className="ssd-datefield__label">{label}</span> : null}
      <button
        type="button"
        className="ssd-datefield__trigger"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          if (!disabled) setOpen((v) => !v);
        }}
      >
        <span
          className={`ssd-datefield__value${
            value ? "" : " is-placeholder"
          }`}
        >
          {value ? formatDisplay(value) : placeholder}
        </span>
        <Calendar size={16} strokeWidth={2.1} aria-hidden />
      </button>

      {open && !disabled ? (
        <div className="ssd-datefield__popover" role="dialog" aria-label={label || "Pick date"}>
          <div className="ssd-datefield__nav">
            <button
              type="button"
              className="ssd-datefield__nav-btn"
              disabled={!canPrev}
              aria-label="Previous month"
              onClick={() =>
                setView(
                  (v) => new Date(v.getFullYear(), v.getMonth() - 1, 1)
                )
              }
            >
              <ChevronLeft size={16} />
            </button>
            <div className="ssd-datefield__month">
              {MONTHS[view.getMonth()]} {view.getFullYear()}
            </div>
            <button
              type="button"
              className="ssd-datefield__nav-btn"
              disabled={!canNext}
              aria-label="Next month"
              onClick={() =>
                setView(
                  (v) => new Date(v.getFullYear(), v.getMonth() + 1, 1)
                )
              }
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="ssd-datefield__weekdays">
            {WEEKDAYS.map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>

          <div className="ssd-datefield__grid">
            {days.map((d) => {
              const inMonth = d.getMonth() === view.getMonth();
              const selectedDay = sameDay(d, selected);
              const isToday = sameDay(d, today);
              const disabledDay = isDisabledDay(d);
              return (
                <button
                  key={toKey(d)}
                  type="button"
                  className={[
                    "ssd-datefield__day",
                    inMonth ? "" : " is-outside",
                    selectedDay ? " is-selected" : "",
                    isToday ? " is-today" : "",
                    disabledDay ? " is-disabled" : "",
                  ].join("")}
                  disabled={disabledDay}
                  onClick={() => pick(d)}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>

          <div className="ssd-datefield__footer">
            <button
              type="button"
              className="ssd-datefield__footer-btn"
              onClick={() => {
                onChange?.("");
                setOpen(false);
              }}
            >
              Clear
            </button>
            <button
              type="button"
              className="ssd-datefield__footer-btn ssd-datefield__footer-btn--accent"
              disabled={isDisabledDay(today)}
              onClick={() => pick(today)}
            >
              Today
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
