import React from "react";
import { Dropdown } from "rsuite";
import { isPremiumSortKey } from "../utils/premiumSort";
import "./SortByDropdown.css";

const SORT_OPTIONS = [
  {
    group: "Name",
    items: [
      { key: "name-filter1", label: "A → Z", value: "By Name(A-Z)" },
      { key: "name-filter2", label: "Z → A", value: "By Name(Z-A)" },
    ],
  },
  {
    group: "Size",
    items: [
      { key: "size-filter1", label: "Smallest first", value: "By Size(Asc)" },
      { key: "size-filter2", label: "Largest first", value: "By Size(Desc)" },
    ],
  },
  {
    group: "Date",
    items: [
      { key: "date-filter1", label: "Oldest first", value: "By Date(Oldest)" },
      { key: "date-filter2", label: "Newest first", value: "By Date(Newest)" },
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
 * Modern Sort By control with clear action.
 */
const SortByDropdown = ({
  value = "Sort By",
  onSelect,
  isPremium = true,
  onUpgradeRequired,
  sortIcon,
  crownIcon,
}) => {
  const isActive = Boolean(value && value !== "Sort By");
  const displayLabel = DISPLAY_LABELS[value] || value || "Sort By";

  const guardPremium = (eventKey) => {
    if (isPremium || !isPremiumSortKey(eventKey)) return true;
    onUpgradeRequired?.();
    return false;
  };

  const handleSelect = (eventKey) => {
    if (eventKey == null || String(eventKey).startsWith("group-")) return;
    if (!guardPremium(eventKey)) return;
    onSelect?.(eventKey);
  };

  const handleClear = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect?.("default");
  };

  return (
    <div className={`sort-by-dropdown ${isActive ? "is-active" : ""}`}>
      <Dropdown
        onSelect={handleSelect}
        className="filter_dropdown sort-by-dd"
        menuStyle={{ padding: 8 }}
        title={
          <span className="sort-filter-span sort-by-trigger">
            {sortIcon ? (
              <img src={sortIcon} alt="" className="sort-by-icon" />
            ) : null}
            <span className="sort-filter-label sort-by-label">
              {displayLabel}
            </span>
            {isActive && (
              <button
                type="button"
                className="sort-by-clear-btn"
                onClick={handleClear}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                aria-label="Clear sort"
                title="Clear sort"
              >
                ×
              </button>
            )}
          </span>
        }
      >
        <Dropdown.Item eventKey="header" disabled className="sort-by-header-item">
          <span className="sort-by-menu-title">Sort by</span>
          {isActive ? (
            <button
              type="button"
              className="sort-by-menu-clear"
              onClick={handleClear}
              onMouseDown={(e) => e.stopPropagation()}
            >
              Clear
            </button>
          ) : null}
        </Dropdown.Item>

        <Dropdown.Item
          eventKey="default"
          className={`sort-by-item ${!isActive ? "is-selected" : ""}`}
        >
          <span className="sort-by-item-main">Default order</span>
          <span className="sort-by-item-meta">Original listing</span>
          {!isActive ? (
            <span className="sort-by-check" aria-hidden>
              ✓
            </span>
          ) : null}
        </Dropdown.Item>

        {SORT_OPTIONS.map((group) => [
          <Dropdown.Item
            key={`group-${group.group}`}
            eventKey={`group-${group.group}`}
            disabled
            className="sort-by-group-item"
          >
            <span className="sort-by-group-label">
              {group.group}
              {!isPremium && group.group !== "Name" && crownIcon ? (
                <img src={crownIcon} alt="" className="sort-filter-crown" />
              ) : null}
            </span>
          </Dropdown.Item>,
          ...group.items.map((item) => {
            const selected = value === item.value;
            const premiumItem = !isPremium && isPremiumSortKey(item.key);
            return (
              <Dropdown.Item
                key={item.key}
                eventKey={item.key}
                className={`sort-by-item ${selected ? "is-selected" : ""}${
                  premiumItem ? " is-premium" : ""
                }`}
              >
                <span className="sort-by-item-main">{item.label}</span>
                {premiumItem && crownIcon ? (
                  <img src={crownIcon} alt="" className="sort-filter-crown" />
                ) : null}
                {selected ? (
                  <span className="sort-by-check" aria-hidden>
                    ✓
                  </span>
                ) : null}
              </Dropdown.Item>
            );
          }),
        ])}
      </Dropdown>
    </div>
  );
};

export default SortByDropdown;
