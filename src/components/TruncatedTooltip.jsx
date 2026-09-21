import React, { useCallback, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "../css/TruncatedTooltip.css";

/**
 * Custom tooltip that only appears when the child text is truncated
 * (CSS ellipsis overflow, or display text differs from `label`).
 * Renders via portal so table overflow does not clip it.
 */
const TruncatedTooltip = ({
  label,
  children,
  className = "",
  textClassName = "",
  style,
  placement = "top",
  ...textProps
}) => {
  const textRef = useRef(null);
  const [isTruncated, setIsTruncated] = useState(false);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState(null);

  const measure = useCallback(() => {
    const el = textRef.current;
    if (!el || label == null || label === "") {
      setIsTruncated(false);
      return false;
    }

    const overflow = el.scrollWidth > el.clientWidth + 1;
    const content = (el.textContent || "").trim();
    const labelTrim = String(label).trim();
    const textDiffers = content.length > 0 && content !== labelTrim;
    const truncated = overflow || textDiffers;
    setIsTruncated(truncated);
    return truncated;
  }, [label]);

  const updateCoords = useCallback(() => {
    const el = textRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setCoords({
      top: rect.top,
      bottom: rect.bottom,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  useLayoutEffect(() => {
    measure();

    const el = textRef.current;
    if (!el) return undefined;

    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(measure);
      ro.observe(el);
      return () => ro.disconnect();
    }

    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure, children]);

  useLayoutEffect(() => {
    if (!open) return undefined;
    updateCoords();
    const onScrollOrResize = () => updateCoords();
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open, updateCoords]);

  const show = useCallback(() => {
    const truncated = measure();
    if (truncated) {
      updateCoords();
      setOpen(true);
    }
  }, [measure, updateCoords]);

  const hide = useCallback(() => setOpen(false), []);

  if (label == null || label === "") {
    return (
      <span className={textClassName || className} style={style} {...textProps}>
        {children}
      </span>
    );
  }

  const tipStyle =
    coords == null
      ? undefined
      : placement === "bottom"
        ? {
            top: coords.bottom + 8,
            left: coords.left,
          }
        : {
            top: coords.top - 8,
            left: coords.left,
            transform: "translateY(-100%)",
          };

  return (
    <span
      className={`trunc-tip-wrap trunc-tip-wrap--${placement} ${className}`.trim()}
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      <span
        ref={textRef}
        className={`trunc-tip-text ${textClassName}`.trim()}
        style={style}
        {...textProps}
      >
        {children}
      </span>
      {isTruncated && open && coords && typeof document !== "undefined"
        ? createPortal(
            <span
              className={`trunc-tip trunc-tip--portal trunc-tip--${placement}`}
              role="tooltip"
              style={tipStyle}
            >
              {label}
            </span>,
            document.body
          )
        : null}
    </span>
  );
};

export default TruncatedTooltip;
