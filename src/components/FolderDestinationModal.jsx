import React from "react";
import {
  FiX,
  FiArrowLeft,
  FiFolder,
  FiCopy,
  FiMove,
  FiRotateCcw,
  FiPackage,
  FiDownload,
} from "react-icons/fi";
import { HiOutlineFolderPlus } from "react-icons/hi2";
import "./FolderDestinationModal.css";

const VARIANT_META = {
  move: {
    icon: FiMove,
    accent: "#FFAB49",
    actionVerb: "move",
  },
  copy: {
    icon: FiCopy,
    accent: "#FFAB49",
    actionVerb: "copy",
  },
  "move-folder": {
    icon: FiFolder,
    accent: "#FFAB49",
    actionVerb: "move",
  },
  restore: {
    icon: FiRotateCcw,
    accent: "#FFAB49",
    actionVerb: "restore",
  },
  zip: {
    icon: FiPackage,
    accent: "#FFAB49",
    actionVerb: "zip",
  },
  unzip: {
    icon: FiPackage,
    accent: "#FFAB49",
    actionVerb: "unzip",
  },
  download: {
    icon: FiDownload,
    accent: "#FFAB49",
    actionVerb: "download",
  },
};

function formatDestinationLabel(selectedPath) {
  if (!selectedPath || !String(selectedPath).trim()) {
    return "My Files (Root)";
  }
  const parts = String(selectedPath).split("/").filter(Boolean);
  return parts[parts.length - 1] || selectedPath;
}

/** Keep deep paths on one line: Root / first / … / last2 / last1 */
function buildBreadcrumbItems(parts) {
  if (parts.length <= 4) {
    return parts.map((folder, originalIndex) => ({
      folder,
      originalIndex,
      isEllipsis: false,
    }));
  }

  return [
    { folder: parts[0], originalIndex: 0, isEllipsis: false },
    { folder: "…", originalIndex: -1, isEllipsis: true },
    ...parts.slice(-2).map((folder, i) => ({
      folder,
      originalIndex: parts.length - 2 + i,
      isEllipsis: false,
    })),
  ];
}

export default function FolderDestinationModal({
  variant = "move",
  title,
  itemSummary,
  selectedPath = "",
  onClose,
  onConfirm,
  confirmLabel = "Confirm",
  confirmLoading = false,
  confirmDisabled = false,
  locationPath = "",
  counter = 0,
  onRootClick,
  onBack,
  newFolderName = "",
  onNewFolderNameChange,
  onCreateFolder,
  creatingFolder = false,
  children,
  footerExtra = null,
}) {
  const meta = VARIANT_META[variant] || VARIANT_META.move;
  const Icon = meta.icon;
  const actionVerb = meta.actionVerb || "move";
  const breadcrumbParts = locationPath
    ? locationPath.split(" / ").filter(Boolean)
    : [];
  const breadcrumbItems = buildBreadcrumbItems(breadcrumbParts);
  const destinationLabel = formatDestinationLabel(selectedPath);
  const fullPathLabel = breadcrumbParts.length
    ? `Root / ${breadcrumbParts.join(" / ")}`
    : "Root";
  const isConfirmDisabled = confirmLoading || confirmDisabled;

  const handleCreateKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onCreateFolder?.();
    }
  };

  return (
    <div className="fdm-overlay" onClick={onClose} role="presentation">
      <div
        className="fdm-dialog"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="fdm-title"
      >
        <div className="fdm-card">
          <header className="fdm-header">
            <div className="fdm-header-main">
              <div
                className="fdm-icon-wrap"
                style={{ "--fdm-accent": meta.accent }}
              >
                <Icon aria-hidden="true" />
              </div>
              <div className="fdm-header-text">
                <h2 id="fdm-title" className="fdm-title">
                  {title}
                </h2>
                <p className="fdm-subtitle">
                  Choose where to {actionVerb}{" "}
                  <span className="fdm-item-chip">{itemSummary}</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              className="fdm-close-btn"
              onClick={onClose}
              aria-label="Close"
            >
              <FiX />
            </button>
          </header>

          <div className="fdm-destination-bar">
            <span className="fdm-destination-label">Destination</span>
            <span className="fdm-destination-value" title={destinationLabel}>
              {destinationLabel}
            </span>
          </div>

          <div className="fdm-body">
            <div className="fdm-nav-row">
              {counter > 0 && (
                <button
                  type="button"
                  className="fdm-back-btn"
                  onClick={onBack}
                >
                  <FiArrowLeft aria-hidden="true" />
                  Back
                </button>
              )}

              <nav
                className="fdm-breadcrumb"
                aria-label="Folder path"
                title={fullPathLabel}
              >
                <button
                  type="button"
                  className={`fdm-crumb ${counter === 0 ? "is-active" : ""}`}
                  onClick={onRootClick}
                >
                  Root
                </button>
                {breadcrumbItems.map(({ folder, originalIndex, isEllipsis }) => (
                  <React.Fragment key={`${folder}-${originalIndex}`}>
                    <span className="fdm-crumb-sep" aria-hidden="true">
                      /
                    </span>
                    {isEllipsis ? (
                      <span className="fdm-crumb fdm-crumb-ellipsis" aria-hidden="true">
                        …
                      </span>
                    ) : (
                      <span
                        className={`fdm-crumb ${
                          originalIndex === breadcrumbParts.length - 1
                            ? "is-active"
                            : ""
                        }`}
                        title={folder}
                      >
                        {folder}
                      </span>
                    )}
                  </React.Fragment>
                ))}
              </nav>
            </div>

            <div className="fdm-create-row">
              <div className="fdm-create-input-wrap">
                <HiOutlineFolderPlus
                  className="fdm-create-icon"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  className="fdm-create-input"
                  placeholder="Create new folder here"
                  value={newFolderName}
                  onChange={(event) => onNewFolderNameChange?.(event.target.value)}
                  onKeyDown={handleCreateKeyDown}
                />
              </div>
              <button
                type="button"
                className="fdm-create-btn"
                onClick={onCreateFolder}
                disabled={creatingFolder || !newFolderName.trim()}
              >
                {creatingFolder ? "Creating…" : "Create"}
              </button>
            </div>

            <div className="fdm-picker-wrap">{children}</div>

            {footerExtra}
          </div>

          <footer className="fdm-footer">
            <button type="button" className="fdm-btn fdm-btn--ghost" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="fdm-btn fdm-btn--primary"
              style={{ "--fdm-accent": meta.accent }}
              onClick={onConfirm}
              disabled={isConfirmDisabled}
            >
              {confirmLoading ? "Please wait…" : confirmLabel}
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}

export function formatModalItemSummary(items) {
  const list = (Array.isArray(items) ? items : [items])
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);

  if (list.length === 0) return "selected items";
  if (list.length === 1) {
    const parts = list[0].split("/");
    return parts[parts.length - 1] || list[0];
  }
  return `${list.length} items`;
}
