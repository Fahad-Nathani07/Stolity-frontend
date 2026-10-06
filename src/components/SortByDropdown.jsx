import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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

const EDGE = 8;
const GAP = 6;
const MOBILE_MQ = "(max-width: 767px)";

function sidenavBottomClearance() {
  if (typeof document === "undefined") return EDGE;
  const body = document.body;
  if (!body?.classList?.contains("sidenav-mobile")) return EDGE;
  const raw = getComputedStyle(body).getPropertyValue("--sidenav-mobile-offset");
  const px = Number.parseFloat(raw);
  return (Number.isFinite(px) ? px : 0) + EDGE;
}

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
  const [menuStyle, setMenuStyle] = useState(null);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  useLayoutEffect(() => {
    if (!open || !isPremium) {
      setMenuStyle(null);
      return undefined;
    }

    const place = () => {
      const el = triggerRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const viewW = window.innerWidth;
      const viewH = window.innerHeight;
      const isMobile = window.matchMedia(MOBILE_MQ).matches;
      const navClear = sidenavBottomClearance();

      const width = isMobile
        ? Math.max(0, viewW - EDGE * 2)
        : Math.min(Math.max(rect.width, 260), viewW - EDGE * 2);

      let left = isMobile ? EDGE : rect.left;
      left = Math.max(EDGE, Math.min(left, viewW - width - EDGE));

      const footer = document.querySelector(".files-pagination-footer");
      const footerTop = footer
        ? footer.getBoundingClientRect().top
        : Number.POSITIVE_INFINITY;
      const bottomLimit = Math.min(viewH, footerTop) - navClear;

      const spaceBelow = bottomLimit - (rect.bottom + GAP);
      const spaceAbove = rect.top - GAP - EDGE;
      const openUp = spaceBelow < 280 && spaceAbove > spaceBelow;
      const available = openUp ? spaceAbove : spaceBelow;
      const maxHeight = Math.min(isMobile ? 360 : 420, Math.max(available, 160));

      if (openUp) {
        setMenuStyle({
          position: "fixed",
          left,
          width,
          top: "auto",
          bottom: Math.max(navClear, viewH - rect.top + GAP),
          maxHeight,
          zIndex: 5200,
        });
      } else {
        setMenuStyle({
          position: "fixed",
          left,
          width,
          top: rect.bottom + GAP,
          bottom: "auto",
          maxHeight,
          zIndex: 5200,
        });
      }
    };

    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, isPremium]);

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (e) => {
      const t = e.target;
      if (rootRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
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

  const menu =
    open && isPremium && menuStyle
      ? createPortal(
          <div
            ref={menuRef}
            className="sort-by-menu sort-by-menu--portal"
            role="listbox"
            aria-label="Sort options"
            style={menuStyle}
          >
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

            <div className="sort-by-menu-scroll">
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
          </div>,
          document.body
        )
      : null;

  return (
    <div
      ref={rootRef}
      className={`sort-by-dropdown${isActive ? " is-active" : ""}${
        open ? " is-open" : ""
      }${!isPremium ? " is-locked" : ""}`}
    >
      <div className="sort-by-trigger-wrap" ref={triggerRef}>
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
          <span className="sort-by-label">
            <span className="sort-by-label--full">{displayLabel}</span>
            <span className="sort-by-label--short" aria-hidden="true">
              {isActive ? displayLabel : "Sort"}
            </span>
          </span>
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

      {menu}
    </div>
  );
};

export default SortByDropdown;
