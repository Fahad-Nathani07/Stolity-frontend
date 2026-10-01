import React, { useEffect, useState } from "react";
import DraggableFloatShell from "./DraggableFloatShell";
import "../css/UploadProgressModal.css";
import "./ZippingProgressModal.css";

/**
 * Floating panel during server-side zip / unzip.
 * Indeterminate bar: slides left → right, exits right, reappears left.
 * @param {'zip'|'unzip'} [mode]
 */
export default function ZippingProgressModal({
  isOpen,
  folderName = "",
  mode = "zip",
  onCancel,
}) {
  const [minimized, setMinimized] = useState(false);
  const isUnzip = mode === "unzip";

  useEffect(() => {
    if (!isOpen) {
      setMinimized(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const displayName =
    String(folderName || "")
      .replace(/\\/g, "/")
      .split("/")
      .filter(Boolean)
      .pop() || (isUnzip ? "archive" : "folder");

  const title = isUnzip ? "Unzipping" : "Zipping";
  const subtitle = isUnzip
    ? "Unzipping files, please wait…"
    : "Zipping files, please wait…";
  const eta = isUnzip
    ? "Extracting ZIP on server"
    : "Preparing ZIP on server";

  return (
    <DraggableFloatShell
      className={`upload-modal-container zipping-progress-modal${
        minimized ? " is-minimized" : ""
      }`}
    >
      {minimized ? (
        <button
          type="button"
          className="tp-mini"
          onClick={() => setMinimized(false)}
          title="Expand"
          aria-label={`Expand ${title.toLowerCase()} panel`}
        >
          <span className="tp-mini-spinner" aria-hidden="true" />
          <span className="tp-mini-label">{title}</span>
          <span className="tp-mini-expand" aria-hidden="true">
            ▢
          </span>
        </button>
      ) : (
        <div className="tp-panel">
          <div className="tp-header">
            <div className="tp-window-controls">
              <button
                type="button"
                className="tp-window-btn tp-window-btn--minimize"
                onClick={() => setMinimized(true)}
                title="Minimize"
                aria-label="Minimize"
              >
                ─
              </button>
              {typeof onCancel === "function" && (
                <button
                  type="button"
                  className="tp-window-btn tp-window-btn--close"
                  onClick={onCancel}
                  title="Cancel"
                  aria-label={`Cancel ${title.toLowerCase()}`}
                >
                  ✕
                </button>
              )}
            </div>
            <div className="tp-header-body">
              <div className="tp-header-text">
                <h5 className="tp-title">{title}</h5>
                <p className="tp-subtitle">{subtitle}</p>
              </div>
            </div>
          </div>

          <div className="tp-summary">
            <div className="tp-summary-top">
              <span className="tp-summary-label">{displayName}</span>
            </div>
            <div
              className="tp-bar-wrap tp-bar-wrap--indeterminate"
              role="progressbar"
              aria-label={`${title} in progress`}
              aria-valuetext="Indeterminate"
            >
              <div className="tp-bar tp-bar--indeterminate" />
            </div>
            <div className="tp-eta is-empty">{eta}</div>
          </div>
        </div>
      )}
    </DraggableFloatShell>
  );
}
