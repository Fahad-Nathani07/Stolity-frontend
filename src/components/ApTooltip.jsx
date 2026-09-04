import React, { useCallback, useState } from "react";
import "../css/ApTooltip.css";

/**
 * Custom tooltip for the audio player controls.
 * Hover-only via JS (avoids sticky tooltips after click/focus).
 * Keyboard focus still shows tooltip via :focus-visible in CSS.
 */
const ApTooltip = ({ label, placement = "top", className = "", children }) => {
  const [hoverOpen, setHoverOpen] = useState(false);

  const show = useCallback(() => setHoverOpen(true), []);
  const hide = useCallback(() => setHoverOpen(false), []);
  const hideOnPress = useCallback(() => setHoverOpen(false), []);

  if (!label) return children;

  return (
    <span
      className={`ap-tip-wrap ap-tip-wrap--${placement} ${className}`.trim()}
      onMouseEnter={show}
      onMouseLeave={hide}
      onPointerDown={hideOnPress}
    >
      {children}
      <span
        className={`ap-tip${hoverOpen ? " is-visible" : ""}`}
        role="tooltip"
      >
        {label}
      </span>
    </span>
  );
};

export default ApTooltip;
