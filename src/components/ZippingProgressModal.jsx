import React, { useEffect, useState } from "react";
import DraggableFloatShell from "./DraggableFloatShell";
import "../css/UploadProgressModal.css";
import "./ZippingProgressModal.css";

const MODE_COPY = {
  title: "Copying",
  subtitle: "Copying files, please wait…",
  eta: "Copying on server",
  fallbackName: "files",
};

const MODE_MOVE = {
  title: "Moving",
  subtitle: "Moving items, please wait…",
  eta: "Moving on server",
  fallbackName: "items",
};

const MODE_DELETE = {
  title: "Moving to recycle bin",
  subtitle: "Deleting items, please wait…",
  eta: "Soft-delete on server",
  fallbackName: "items",
};

const MODE_UNZIP = {
  title: "Unzipping",
  subtitle: "Unzipping files, please wait…",
  eta: "Extracting ZIP on server",
  fallbackName: "archive",
};

const MODE_ZIP = {
  title: "Zipping",
  subtitle: "Zipping files, please wait…",
  eta: "Preparing ZIP on server",
  fallbackName: "folder",
};

function resolveModeConfig(mode) {
  if (mode === "unzip") return MODE_UNZIP;
  if (mode === "copy") return MODE_COPY;
  if (mode === "move") return MODE_MOVE;
  if (mode === "delete") return MODE_DELETE;
  return MODE_ZIP;
}

/**
 * Floating panel during server-side zip / unzip / copy / move / delete.
 * Indeterminate bar: slides left → right, exits right, reappears left.
 * @param {'zip'|'unzip'|'copy'|'move'|'delete'} [mode]
 */
export default function ZippingProgressModal({
  isOpen,
  folderName = "",
  mode = "zip",
  onCancel,
}) {
  const [minimized, setMinimized] = useState(false);
  const config = resolveModeConfig(mode);

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
      .pop() || config.fallbackName;

  const { title, subtitle, eta } = config;

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
