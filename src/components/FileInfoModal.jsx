import React, { useEffect, useState } from "react";
import { FiCopy, FiExternalLink, FiInfo, FiX } from "react-icons/fi";
import { resolveFileIconPath } from "../utils/fileIcon";
import "./FileInfoModal.css";

/**
 * Shared premium file details modal.
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
    }, 220);
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

  const iconSrc = resolveFileIconPath({
    fileName: fileInfo.fileName,
    fileType: fileInfo.fileType,
    isFolder: fileInfo.isFolder,
  });

  const displayName = fileInfo.fileName || "Untitled";
  const fullName = displayName.includes("/")
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

  const rows = [
    { label: "Name", value: fullName, full: true },
    { label: "Size", value: fileInfo.fileSize || "—" },
    { label: "Format", value: typeLabel },
    { label: "Uploaded", value: fileInfo.uploadDateTime || "—" },
  ];

  if (showVisibility) {
    rows.splice(3, 0, {
      label: "Access",
      value: isPublic ? "Public" : "Private",
    });
  }

  const openClass = visible && !closing ? " is-open" : "";

  return (
    <div
      className={`fim-overlay${openClass}`}
      onClick={handleClose}
      role="presentation"
    >
      <div
        className={`fim-dialog${openClass}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="fim-title"
      >
        <div className="fim-card">
          <header className="fim-header">
            <div className="fim-header-main">
              <div className="fim-icon-wrap" aria-hidden="true">
                <FiInfo />
              </div>
              <div className="fim-header-text">
                <h2 id="fim-title" className="fim-title">
                  File details
                </h2>
                <p className="fim-subtitle">Complete information for this item</p>
              </div>
            </div>
            <button
              type="button"
              className="fim-close"
              onClick={handleClose}
              aria-label="Close"
            >
              <FiX />
            </button>
          </header>

          <div className="fim-body">
            <div className="fim-file-chip">
              <span className="fim-file-chip-icon" aria-hidden="true">
                <img src={iconSrc} alt="" />
              </span>
              <span className="fim-file-chip-name">{fullName}</span>
            </div>

            <dl className="fim-rows">
              {rows.map((row) => (
                <div
                  key={row.label}
                  className={`fim-row${row.full ? " fim-row--full" : ""}`}
                >
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>

            {canShowUrl ? (
              <div className="fim-url-block">
                <div className="fim-field-label">File URL</div>
                <div className="fim-url-box">{fileUrl}</div>
                <div className="fim-actions">
                  <button
                    type="button"
                    className="fim-btn fim-btn--ghost"
                    onClick={copyUrl}
                  >
                    <FiCopy aria-hidden="true" />
                    {copied ? "Copied" : "Copy"}
                  </button>
                  <button
                    type="button"
                    className="fim-btn fim-btn--primary"
                    onClick={openUrl}
                  >
                    <FiExternalLink aria-hidden="true" />
                    Open
                  </button>
                </div>
              </div>
            ) : null}

            {showVisibility && !isPremium && isPrivate && onUpgrade ? (
              <div className="fim-upgrade">
                <div className="fim-upgrade-copy">
                  <strong>Public links</strong>
                  <span>Available on Premium</span>
                </div>
                <button
                  type="button"
                  className="fim-btn fim-btn--primary fim-upgrade-btn"
                  onClick={() => {
                    handleClose();
                    setTimeout(() => onUpgrade(), 230);
                  }}
                >
                  Upgrade
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileInfoModal;
