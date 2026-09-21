import React, { useEffect, useRef, useState } from "react";
import {
  ArrowDownAZ,
  ArrowDownWideNarrow,
  ArrowUpAZ,
  ArrowUpDown,
  ArrowUpNarrowWide,
  CalendarArrowDown,
  CalendarArrowUp,
  Check,
  ChevronDown,
  ListOrdered,
  X,
} from "lucide-react";
import "./SortByDropdown.css";

const SORT_OPTIONS = [
  {
    group: "Name",
    items: [
      {
        key: "name-filter1",
        label: "A → Z",
        hint: "Alphabetical",
        value: "By Name(A-Z)",
        Icon: ArrowDownAZ,
      },
      {
        key: "name-filter2",
        label: "Z → A",
        hint: "Reverse alpha",
        value: "By Name(Z-A)",
        Icon: ArrowUpAZ,
      },
    ],
  },
  {
    group: "Size",
    items: [
      {
        key: "size-filter1",
        label: "Smallest first",
        hint: "Ascending",
        value: "By Size(Asc)",
        Icon: ArrowUpNarrowWide,
      },
      {
        key: "size-filter2",
        label: "Largest first",
        hint: "Descending",
        value: "By Size(Desc)",
        Icon: ArrowDownWideNarrow,
      },
    ],
  },
  {
    group: "Date",
    items: [
      {
        key: "date-filter1",
        label: "Oldest first",
        hint: "Earliest",
        value: "By Date(Oldest)",
        Icon: CalendarArrowUp,
      },
      {
        key: "date-filter2",
        label: "Newest first",
        hint: "Latest",
        value: "By Date(Newest)",
        Icon: CalendarArrowDown,
      },
    ],
  },
];

const DISPLAY_LABELS = {
  "Sort By": "Sort By",
  "By Name(A-Z)": "Name A–Z",
  "By Name(Z-A)": "Name Z–A",
  "By Size(Asc)": "Size Asc",
  "By Size(Desc)": "Size Desc",
  "By Date(Oldest)": "Oldest",
  "By Date(Newest)": "Newest",
};

/**
 * Premium Sort By control — custom menu (no native/rsuite select).
 * Entire Sort By feature is premium-only.
 */
const SortByDropdown = ({
  value = "Sort By",
  onSelect,
  isPremium = true,
  onUpgradeRequired,
  crownIcon,
}) => {
  const isActive = Boolean(value && value !== "Sort By");
  const displayLabel = DISPLAY_LABELS[value] || value || "Sort By";
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

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

  const handleTriggerClick = () => {
    if (!isPremium) {
      onUpgradeRequired?.();
      return;
    }
    setOpen((v) => !v);
  };

  const handleSelect = (eventKey) => {
    if (eventKey == null) return;
    if (!isPremium && eventKey !== "default") {
      onUpgradeRequired?.();
      return;
    }
    onSelect?.(eventKey);
    setOpen(false);
  };

  const handleClear = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect?.("default");
    setOpen(false);
  };

  return (
    <div
      ref={rootRef}
      className={`sort-by-dropdown${isActive ? " is-active" : ""}${
        open ? " is-open" : ""
      }${!isPremium ? " is-locked" : ""}`}
    >
      <div className="sort-by-trigger-wrap">
        <button
          type="button"
          className="sort-by-trigger"
          onClick={handleTriggerClick}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label="Sort by"
          title={!isPremium ? "Premium feature" : undefined}
        >
          <span className="sort-by-trigger-icon" aria-hidden>
            <ArrowUpDown size={15} strokeWidth={2.2} />
          </span>
          <span className="sort-by-label">{displayLabel}</span>
          {!isPremium && crownIcon ? (
            <img
              src={crownIcon}
              alt=""
              className="sort-by-trigger-crown"
              title="Premium feature"
            />
          ) : null}
          <ChevronDown
            className={`sort-by-chevron${open ? " is-open" : ""}`}
            size={14}
            strokeWidth={2.4}
            aria-hidden
          />
        </button>
        {isActive && isPremium ? (
          <button
            type="button"
            className="sort-by-clear-btn"
            onClick={handleClear}
            aria-label="Clear sort"
            title="Clear sort"
          >
            <X size={12} strokeWidth={2.5} />
          </button>
        ) : null}
      </div>

      {open && isPremium ? (
        <div className="sort-by-menu" role="listbox" aria-label="Sort options">
          <div className="sort-by-menu-head">
            <span className="sort-by-menu-title">Sort by</span>
            {isActive ? (
              <button
                type="button"
                className="sort-by-menu-clear"
                onClick={handleClear}
              >
                Clear
              </button>
            ) : null}
          </div>

          <button
            type="button"
            role="option"
            aria-selected={!isActive}
            className={`sort-by-item${!isActive ? " is-selected" : ""}`}
            onClick={() => handleSelect("default")}
          >
            <span className="sort-by-item-icon" aria-hidden>
              <ListOrdered size={14} strokeWidth={2} />
            </span>
            <span className="sort-by-item-main">Default order</span>
            {!isActive ? (
              <Check className="sort-by-check" size={13} strokeWidth={2.5} />
            ) : null}
          </button>

          {SORT_OPTIONS.map((group) => (
            <div key={group.group} className="sort-by-group">
              <div className="sort-by-group-label">
                <span>{group.group}</span>
              </div>
              {group.items.map((item) => {
                const selected = value === item.value;
                const Icon = item.Icon;
                return (
                  <button
                    key={item.key}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={`sort-by-item${selected ? " is-selected" : ""}`}
                    onClick={() => handleSelect(item.key)}
                  >
                    <span className="sort-by-item-icon" aria-hidden>
                      <Icon size={14} strokeWidth={2} />
                    </span>
                    <span className="sort-by-item-main">{item.label}</span>
                    {selected ? (
                      <Check
                        className="sort-by-check"
                        size={13}
                        strokeWidth={2.5}
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default SortByDropdown;
