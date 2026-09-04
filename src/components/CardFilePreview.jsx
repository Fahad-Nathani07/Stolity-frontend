import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  isCardImagePreview,
  resolveCardPreviewSrc,
  resolveFileIconPath,
  getCardPreviewUrlFallbacks,
} from "../utils/fileIcon";

/** Soft cap: only this many public image previews load at once. */
const MAX_VISIBLE_PREVIEWS = 15;

const previewStore = {
  /** @type {Map<string, number>} id -> visibleSince timestamp */
  visible: new Map(),
  listeners: new Set(),
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  },
  emit() {
    this.listeners.forEach((l) => l());
  },
  setVisible(id, isVisible) {
    const had = this.visible.has(id);
    if (isVisible && !had) {
      this.visible.set(id, Date.now());
      this.emit();
    } else if (!isVisible && had) {
      this.visible.delete(id);
      this.emit();
    }
  },
  /** Newest visible ids, capped at MAX_VISIBLE_PREVIEWS */
  allowedIds() {
    return [...this.visible.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_VISIBLE_PREVIEWS)
      .map(([id]) => id);
  },
  getSnapshot() {
    return this.allowedIds().join("|");
  },
};

const getScrollParent = (el) => {
  let node = el?.parentElement;
  while (node && node !== document.body) {
    const { overflowY } = window.getComputedStyle(node);
    if (
      (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") &&
      node.scrollHeight > node.clientHeight
    ) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
};

/**
 * Card media that only loads public image URLs for ~15 in-view cards.
 * Off-screen / overflow cards keep the local icon to avoid lag with large folders.
 */
const CardFilePreview = ({
  file,
  sharedIconSrc,
  blackboxIconSrc,
  getIcon,
}) => {
  const wrapRef = useRef(null);
  const previewId = useRef(
    `preview-${file?.fileName || "file"}-${Math.random().toString(36).slice(2, 9)}`
  );
  const [inView, setInView] = useState(false);
  const [failed, setFailed] = useState(false);
  const previewTryRef = useRef(0);

  const allowedSnapshot = useSyncExternalStore(
    (cb) => previewStore.subscribe(cb),
    () => previewStore.getSnapshot(),
    () => ""
  );
  const allowed = allowedSnapshot.split("|").filter(Boolean);
  const canUsePreviewSlot = allowed.includes(previewId.current);

  const iconOptions = { sharedIconSrc, blackboxIconSrc };
  const iconSrc =
    typeof getIcon === "function"
      ? getIcon(file)
      : resolveFileIconPath(file, iconOptions);

  const canPreview = isCardImagePreview(file) && !failed;
  const showPreview = canPreview && inView && canUsePreviewSlot;
  const src = showPreview
    ? resolveCardPreviewSrc(file, iconOptions)
    : iconSrc;

  useEffect(() => {
    setFailed(false);
    previewTryRef.current = 0;
  }, [file?.fileName, file?.url, file?.fileUrl, file?.ACL]);

  useEffect(() => {
    const el = wrapRef.current;
    const id = previewId.current;
    if (!el) return undefined;

    if (!isCardImagePreview(file)) {
      setInView(false);
      previewStore.setVisible(id, false);
      return undefined;
    }

    const root = getScrollParent(el);
    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = Boolean(entry?.isIntersecting);
        setInView(visible);
        previewStore.setVisible(id, visible);
      },
      {
        root,
        rootMargin: "40px 0px",
        threshold: 0.2,
      }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      previewStore.setVisible(id, false);
    };
  }, [file?.fileName, file?.url, file?.fileUrl, file?.ACL, file?.isFolder]);

  const handleError = (e) => {
    const img = e.currentTarget;
    if (!showPreview) {
      img.onerror = null;
      img.src = iconSrc;
      return;
    }

    const fallbacks = getCardPreviewUrlFallbacks(file.url || file.fileUrl);
    const nextIdx = previewTryRef.current + 1;
    const next = fallbacks[nextIdx];
    if (next && next !== img.src) {
      previewTryRef.current = nextIdx;
      img.src = next;
      return;
    }

    setFailed(true);
    img.onerror = null;
    img.src = iconSrc;
  };

  return (
    <div
      ref={wrapRef}
      className={`file-icon2${showPreview ? " is-image-preview" : ""}`}
    >
      <img
        key={showPreview ? `preview-${file?.fileName}` : `icon-${file?.fileName}`}
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        onError={handleError}
      />
    </div>
  );
};

export default CardFilePreview;
