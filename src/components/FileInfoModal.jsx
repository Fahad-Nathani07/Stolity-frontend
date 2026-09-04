import React, { useEffect, useState } from "react";
import { resolveFileIconPath } from "../utils/fileIcon";
import "./FileInfoModal.css";

/**
 * Shared premium file details modal.
 *
 * @param {boolean} isOpen
 * @param {() => void} onClose
 * @param {object|null} fileInfo
 * @param {boolean} [isPremium]
 * @param {() => void} [onUpgrade]
 * @param {boolean} [showVisibility]
 * @param {boolean} [requirePremiumForPublicUrl]
 */
const FileInfoModal = ({
  isOpen,
  onClose,
  fileInfo,
  isPremium = false,
  onUpgrade,
  showVisibility = false,
  requirePremiumForPublicUrl = false,
}) => {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && fileInfo) {
      setClosing(false);
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    }
    setVisible(false);
    setCopied(false);
  }, [isOpen, fileInfo]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, closing]);

  const handleClose = () => {
    if (closing) return;
    setClosing(true);
    setVisible(false);
    setTimeout(() => {
      setClosing(false);
      onClose?.();
    }, 260);
  };

  if ((!isOpen && !closing) || !fileInfo) return null;

  const fileUrl = fileInfo.url || fileInfo.fileUrl || "";
  const isPublic = fileInfo.ACL === "public";
  const isPrivate =
    fileInfo.ACL === "private" || (showVisibility && !isPublic);

  const canShowUrl = (() => {
    if (!showVisibility) return Boolean(fileUrl);
    if (!isPublic) return false;
    if (requirePremiumForPublicUrl && !isPremium) return false;
    return Boolean(fileUrl);
  })();

  const urlHiddenLabel = (() => {
    if (!showVisibility) return "";
    if (!isPublic) return "This file is private — URL is hidden";
    if (requirePremiumForPublicUrl && !isPremium) {
      return "Premium required to view the public URL";
    }
    return "URL unavailable";
  })();

  const iconSrc = resolveFileIconPath({
    fileName: fileInfo.fileName,
    fileType: fileInfo.fileType,
    isFolder: fileInfo.isFolder,
  });

  const displayName = fileInfo.fileName || "Untitled";
  const baseName = displayName.includes("/")
    ? displayName.split("/").filter(Boolean).pop()
    : displayName;

  const typeLabel = (fileInfo.fileType || "file").toString().toUpperCase();

  const copyUrl = async () => {
    if (!fileUrl) return;
    try {
      await navigator.clipboard.writeText(fileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch (_) {
      /* ignore */
    }
  };

  const openUrl = () => {
    if (!canShowUrl || !fileUrl) return;
    window.open(fileUrl, "_blank", "noopener,noreferrer");
  };

  const stats = [
    { label: "Size", value: fileInfo.fileSize || "—" },
    { label: "Format", value: typeLabel },
    { label: "Uploaded", value: fileInfo.uploadDateTime || "—" },
  ];

  const openClass = visible && !closing ? " is-open" : "";

  return (
    <div
      className={`fim-overlay${openClass}`}
      onClick={handleClose}
      role="presentation"
    >
      <div className={`fim-glow${openClass}`} aria-hidden="true" />

      <div
        className={`fim-modal${openClass}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="File details"
      >
        <button
          type="button"
          className="fim-close"
          onClick={handleClose}
          aria-label="Close"
        >
          <span aria-hidden="true">×</span>
        </button>

        <div className="fim-banner">
          <div className="fim-icon-wrap">
            <img src={iconSrc} alt="" className="fim-icon" />
          </div>

          <p className="fim-eyebrow">File details</p>
          <h3 className="fim-name" title={displayName}>
            {baseName}
          </h3>

          <div className="fim-meta-pills">
            <span className="fim-pill fim-pill-type">.{typeLabel.toLowerCase()}</span>
            {showVisibility && (
              <span
                className={`fim-pill fim-pill-acl ${
                  isPublic ? "is-public" : "is-private"
                }`}
              >
                <span className="fim-pill-dot" aria-hidden="true" />
                {isPublic ? "Public" : "Private"}
              </span>
            )}
          </div>
        </div>

        <div className="fim-stats">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className="fim-stat"
              style={{ animationDelay: `${90 + i * 55}ms` }}
            >
              <span className="fim-stat-label">{stat.label}</span>
              <span className="fim-stat-value" title={String(stat.value)}>
                {stat.value}
              </span>
            </div>
          ))}
        </div>

        <div
          className={`fim-url-card${canShowUrl ? "" : " is-locked"}`}
          style={{ animationDelay: "260ms" }}
        >
          <div className="fim-url-card-head">
            <span className="fim-url-card-title">File URL</span>
            {canShowUrl ? (
              <span className="fim-url-card-status is-live">Available</span>
            ) : (
              <span className="fim-url-card-status is-locked">Restricted</span>
            )}
          </div>

          {canShowUrl ? (
            <>
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="fim-url"
                title={fileUrl}
              >
                {fileUrl}
              </a>
              <div className="fim-url-actions">
                <button
                  type="button"
                  className="fim-btn fim-btn-ghost"
                  onClick={copyUrl}
                >
                  {copied ? "Copied" : "Copy link"}
                </button>
                <button
                  type="button"
                  className="fim-btn fim-btn-solid"
                  onClick={openUrl}
                >
                  Open
                </button>
              </div>
            </>
          ) : (
            <p className="fim-url-hidden">{urlHiddenLabel}</p>
          )}
        </div>

        {showVisibility && !isPremium && isPrivate && onUpgrade && (
          <div className="fim-premium">
            <div className="fim-premium-icon" aria-hidden="true">
              ★
            </div>
            <div className="fim-premium-text">
              <strong>Unlock public links</strong>
              <span>Share files with a public URL on Premium.</span>
            </div>
            <button
              type="button"
              className="fim-premium-btn"
              onClick={() => {
                handleClose();
                setTimeout(() => onUpgrade(), 270);
              }}
            >
              Upgrade
            </button>
          </div>
        )}

        <p className="fim-footnote">Click outside or press Esc to close</p>
      </div>
    </div>
  );
};

export default FileInfoModal;
