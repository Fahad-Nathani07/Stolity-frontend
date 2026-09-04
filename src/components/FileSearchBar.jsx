import React, { useState } from "react";
import SearchIcon from "../images/SearchIcon.svg";
import svgCrown from "../images/crown.svg";
import "../css/FileSearchBar.css";

export default function FileSearchBar({
  value = "",
  onChange,
  onClear,
  placeholder = "Search",
  isPremium = true,
  onPremiumGate,
  showCrown = true,
}) {
  const [focused, setFocused] = useState(false);
  const hasValue = Boolean(String(value || "").trim());

  const handleChange = (e) => {
    if (!isPremium) {
      onPremiumGate?.();
      return;
    }
    onChange?.(e);
  };

  const handleClear = () => {
    onClear?.();
  };

  return (
    <div
      className={[
        "file-search-bar",
        focused ? "file-search-bar--focused" : "",
        hasValue ? "file-search-bar--has-value" : "",
        !isPremium ? "file-search-bar--locked" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="file-search-bar__icon" aria-hidden="true">
        <img src={SearchIcon} alt="" />
      </span>

      <input
        type="text"
        className="file-search-bar__input"
        value={value}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        aria-label={placeholder}
      />

      {!isPremium && showCrown && (
        <span className="file-search-bar__crown" title="Premium feature">
          <img src={svgCrown} alt="Premium" />
        </span>
      )}

      <button
        type="button"
        className="file-search-bar__clear"
        onClick={handleClear}
        aria-label="Clear search"
        tabIndex={hasValue ? 0 : -1}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path
            d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}
