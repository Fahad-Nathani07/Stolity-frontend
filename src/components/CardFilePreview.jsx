import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  isCardImagePreview,
  resolveCardPreviewSrc,
  resolveFileIconPath,
  getCardPreviewUrlFallbacks,
} from "../utils/fileIcon";
import { isAudioFile } from "../utils/audioPlayer";
import { fetchAlbumArtBatch } from "../utils/audioAlbumArt";

/** Soft cap: only this many remote card previews (images + audio art) load at once. */
const MAX_VISIBLE_PREVIEWS = 20;

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

const wantsLazyPreview = (file) =>
  isCardImagePreview(file) || isAudioFile(file);

/**
 * Card media that only loads public image URLs / audio album art for ~15 in-view cards.
 * Off-screen cards keep the local icon to avoid lag with large folders.
 */
const CardFilePreview = ({
  file,
  sharedIconSrc,
  blackboxIconSrc,
  getIcon,
  shared = false,
  sharedName = "",
}) => {
  const wrapRef = useRef(null);
  const previewId = useRef(
    `preview-${file?.fileName || "file"}-${Math.random().toString(36).slice(2, 9)}`
  );
  const [inView, setInView] = useState(false);
  const [failed, setFailed] = useState(false);
  const [albumArtUrl, setAlbumArtUrl] = useState(null);
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

  const isImage = isCardImagePreview(file) && !failed;
  const isAudio = isAudioFile(file) && !failed;
  const showImagePreview = isImage && inView && canUsePreviewSlot;
  const showAudioProbe = isAudio && inView && canUsePreviewSlot;
  const showAlbumArt = Boolean(showAudioProbe && albumArtUrl);

  const src = showAlbumArt
    ? albumArtUrl
    : showImagePreview
      ? resolveCardPreviewSrc(file, iconOptions)
      : iconSrc;

  useEffect(() => {
    setFailed(false);
    setAlbumArtUrl(null);
    previewTryRef.current = 0;
  }, [file?.fileName, file?.url, file?.fileUrl, file?.ACL, file?.fileType]);

  useEffect(() => {
    const el = wrapRef.current;
    const id = previewId.current;
    if (!el) return undefined;

    if (!wantsLazyPreview(file)) {
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
  }, [
    file?.fileName,
    file?.url,
    file?.fileUrl,
    file?.ACL,
    file?.isFolder,
    file?.fileType,
  ]);

  // Visible audio cards: batch album-art API (up to 10 paths / request).
  useEffect(() => {
    if (!showAudioProbe || !file?.fileName) {
      return undefined;
    }

    const ac = new AbortController();
    let cancelled = false;

    fetchAlbumArtBatch(file.fileName, {
      shared: shared && sharedName ? sharedName : "",
      signal: ac.signal,
    })
      .then((url) => {
        if (!cancelled && url) setAlbumArtUrl(url);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [showAudioProbe, file?.fileName, shared, sharedName]);

  const handleError = (e) => {
    const img = e.currentTarget;
    if (showAlbumArt) {
      setAlbumArtUrl(null);
      setFailed(true);
      img.onerror = null;
      img.src = iconSrc;
      return;
    }

    if (!showImagePreview) {
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
      className={`file-icon2${
        showImagePreview ? " is-image-preview" : ""
      }${showAlbumArt ? " is-album-art" : ""}`}
    >
      <img
        key={
          showAlbumArt
            ? `art-${file?.fileName}`
            : showImagePreview
              ? `preview-${file?.fileName}`
              : `icon-${file?.fileName}`
        }
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
