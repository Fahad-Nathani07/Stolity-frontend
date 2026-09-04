import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { resolveFileIconPath } from "../utils/fileIcon";
import "./UploadFilesPreview.css";

/** Real image thumbs only while in the buffered scroll window */
const MAX_BLOB_PREVIEW_BYTES = 8 * 1024 * 1024;
/** Prefetch this many tiles before & after the visible range */
const PREFETCH_BUFFER = 5;

const getExt = (file) => {
  const name = (file?.name || "").toString();
  const dot = name.lastIndexOf(".");
  if (dot === -1 || dot === name.length - 1) return "";
  return name.slice(dot + 1).toLowerCase();
};

const iconForFile = (file) =>
  resolveFileIconPath({
    fileName: file?.name || "file",
    fileType: getExt(file),
    isFolder: Boolean(file?.isDirectory),
  });

const isImageFile = (file) =>
  Boolean(file && typeof file.type === "string" && file.type.startsWith("image/"));

const canUseImageThumb = (file) =>
  isImageFile(file) && file.size <= MAX_BLOB_PREVIEW_BYTES;

/** Large images show icon in grid; hover opens the full preview card */
const needsHoverPreview = (file) =>
  isImageFile(file) && file.size > MAX_BLOB_PREVIEW_BYTES;

/**
 * Real image when `active` (visible + prefetch buffer); icon otherwise.
 * Object URLs are revoked when leaving the buffer.
 */
const WindowedImageThumb = ({ file, active }) => {
  const [src, setSrc] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!active || failed || !canUseImageThumb(file)) {
      setSrc((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      return undefined;
    }

    let url;
    try {
      url = URL.createObjectURL(file);
      setSrc(url);
    } catch {
      setFailed(true);
    }

    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [active, file, failed]);

  return (
    <div className="ufp-thumb-wrap">
      {src && !failed ? (
        <img
          src={src}
          alt=""
          className="ufp-thumb"
          draggable={false}
          onError={() => setFailed(true)}
        />
      ) : (
        <img
          src={iconForFile(file)}
          alt=""
          className="ufp-icon"
          draggable={false}
        />
      )}
    </div>
  );
};

/** Hover floating preview: real image + filename */
const HoverPreviewCard = ({ file, anchorRect }) => {
  const [src, setSrc] = useState(null);

  useEffect(() => {
    if (!file || !isImageFile(file)) return undefined;
    let url;
    try {
      url = URL.createObjectURL(file);
      setSrc(url);
    } catch {
      setSrc(null);
    }
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [file]);

  if (!file || !anchorRect) return null;

  const pad = 12;
  const cardW = 220;
  const cardH = 260;
  let left = anchorRect.right + pad;
  let top = anchorRect.top;

  if (typeof window !== "undefined") {
    if (left + cardW > window.innerWidth - 8) {
      left = Math.max(8, anchorRect.left - cardW - pad);
    }
    if (top + cardH > window.innerHeight - 8) {
      top = Math.max(8, window.innerHeight - cardH - 8);
    }
    if (top < 8) top = 8;
  }

  return createPortal(
    <div className="ufp-hover-card" style={{ left, top }} role="tooltip">
      <div className="ufp-hover-media">
        {src ? (
          <img src={src} alt={file.name} className="ufp-hover-img" />
        ) : (
          <img src={iconForFile(file)} alt="" className="ufp-hover-icon" />
        )}
      </div>
      <p className="ufp-hover-name" title={file.name}>
        {file.name}
      </p>
    </div>,
    document.body
  );
};

const FileTile = ({
  file,
  index,
  onRemove,
  active,
  scrollRootRef,
  onVisibilityChange,
  onHoverChange,
}) => {
  const itemRef = useRef(null);
  const isImage = canUseImageThumb(file);

  useEffect(() => {
    const node = itemRef.current;
    if (!node) return undefined;

    const root = scrollRootRef?.current || null;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        onVisibilityChange?.(index, Boolean(entry?.isIntersecting));
      },
      { root, rootMargin: "0px", threshold: 0.2 }
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      onVisibilityChange?.(index, false);
    };
  }, [index, scrollRootRef, onVisibilityChange]);

  return (
    <li
      ref={itemRef}
      className="ufp-item"
      title={file.name}
      onMouseEnter={() => {
        if (!needsHoverPreview(file) || !itemRef.current) return;
        const rect = itemRef.current.getBoundingClientRect();
        onHoverChange?.({ file, rect });
      }}
      onMouseLeave={() => onHoverChange?.(null)}
    >
      <div className="ufp-preview-wrap">
        <div className={`ufp-preview ${isImage ? "ufp-preview--photo" : ""}`}>
          {isImage ? (
            <WindowedImageThumb file={file} active={active} />
          ) : (
            <img
              src={iconForFile(file)}
              alt=""
              className="ufp-icon"
              draggable={false}
            />
          )}
        </div>
        {typeof onRemove === "function" && (
          <button
            type="button"
            className="ufp-remove"
            aria-label={`Remove ${file.name}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onHoverChange?.(null);
              onRemove(index);
            }}
          >
            <svg
              className="ufp-remove-icon"
              viewBox="0 0 12 12"
              aria-hidden="true"
              focusable="false"
            >
              <path
                d="M3 3l6 6M9 3L3 9"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </div>
      <p className="ufp-name">{file.name}</p>
    </li>
  );
};

/**
 * Vertical grid: 6 thumbs per row, ~1.5 rows visible.
 * Visible tiles + previous/next 5 preload real images.
 */
const UploadFilesPreview = ({ files = [], onRemove }) => {
  const scrollRef = useRef(null);
  const [hover, setHover] = useState(null);
  const [visibleSet, setVisibleSet] = useState(() => new Set());

  const onVisibilityChange = useCallback((index, visible) => {
    setVisibleSet((prev) => {
      const has = prev.has(index);
      if (visible && has) return prev;
      if (!visible && !has) return prev;
      const next = new Set(prev);
      if (visible) next.add(index);
      else next.delete(index);
      return next;
    });
  }, []);

  const liveRange = useMemo(() => {
    const last = Math.max(0, files.length - 1);
    if (!files.length) return { start: 0, end: -1 };

    // Before any IO reports, warm the first ~1.5 rows (+ buffer)
    if (visibleSet.size === 0) {
      return {
        start: 0,
        end: Math.min(last, PREFETCH_BUFFER + 8),
      };
    }

    let min = Infinity;
    let max = -Infinity;
    visibleSet.forEach((i) => {
      if (i < min) min = i;
      if (i > max) max = i;
    });

    return {
      start: Math.max(0, min - PREFETCH_BUFFER),
      end: Math.min(last, max + PREFETCH_BUFFER),
    };
  }, [visibleSet, files.length]);

  // Drop stale visibility indexes if the list shrinks
  useEffect(() => {
    setVisibleSet((prev) => {
      let changed = false;
      const next = new Set();
      prev.forEach((i) => {
        if (i < files.length) next.add(i);
        else changed = true;
      });
      return changed ? next : prev;
    });
  }, [files.length]);

  if (!files.length) return null;

  return (
    <div className="ufp">
      <div className="ufp-meta">
        <span>
          Selected: <strong>{files.length}</strong> file
          {files.length === 1 ? "" : "s"}
        </span>
        {files.length > 9 && (
          <span className="ufp-hint">Scroll to preview more</span>
        )}
      </div>

      <div className="ufp-strip-frame">
        <ul ref={scrollRef} className="ufp-strip" aria-label="Selected files">
          {files.map((file, index) => (
            <FileTile
              key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
              file={file}
              index={index}
              onRemove={onRemove}
              active={index >= liveRange.start && index <= liveRange.end}
              scrollRootRef={scrollRef}
              onVisibilityChange={onVisibilityChange}
              onHoverChange={setHover}
            />
          ))}
        </ul>
      </div>

      {hover && (
        <HoverPreviewCard file={hover.file} anchorRect={hover.rect} />
      )}
    </div>
  );
};

export default UploadFilesPreview;
