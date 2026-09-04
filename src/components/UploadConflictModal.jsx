import React from "react";
import {
  FiX,
  FiRefreshCw,
  FiLayers,
  FiFilter,
  FiFile,
} from "react-icons/fi";
import { resolveFileIconPath } from "../utils/fileIcon";
import {
  UPLOAD_CONFLICT_CANCEL,
  UPLOAD_CONFLICT_KEEP_BOTH,
  UPLOAD_CONFLICT_REPLACE,
  UPLOAD_CONFLICT_SKIP,
} from "../utils/uploadConflictUtils";
import "./UploadConflictModal.css";

const ACTIONS = [
  {
    id: UPLOAD_CONFLICT_REPLACE,
    icon: FiRefreshCw,
    title: "Replace existing",
    description: "Overwrite the file already in this folder with your new upload.",
    tone: "replace",
  },
  {
    id: UPLOAD_CONFLICT_KEEP_BOTH,
    icon: FiLayers,
    title: "Keep both",
    description:
      "Save the new file with a unique name so both copies stay in this folder.",
    tone: "keep",
    recommended: true,
  },
  {
    id: UPLOAD_CONFLICT_SKIP,
    icon: FiFilter,
    title: "Don't upload duplicates",
    description: "Skip conflicting files and continue uploading everything else.",
    tone: "skip",
  },
];

export default function UploadConflictModal({
  isOpen,
  conflictingNames = [],
  onChoice,
}) {
  if (!isOpen || !conflictingNames.length) return null;

  const isSingle = conflictingNames.length === 1;
  const namesPreview = conflictingNames.slice(0, 6);
  const hiddenCount = Math.max(0, conflictingNames.length - namesPreview.length);

  return (
    <div className="ucm-overlay" role="presentation">
      <div
        className="ucm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ucm-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ucm-card">
          <header className="ucm-header">
            <div className="ucm-header-main">
              <div className="ucm-icon-wrap" aria-hidden="true">
                <FiFile />
              </div>
              <div className="ucm-header-text">
                <p className="ucm-eyebrow">Upload conflict</p>
                <h2 id="ucm-title" className="ucm-title">
                  {isSingle ? "This file already exists" : "Some files already exist"}
                </h2>
                <p className="ucm-subtitle">
                  {isSingle
                    ? "Choose how you want to handle the duplicate before we continue."
                    : "Choose how you want to handle these duplicates before we continue."}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="ucm-close"
              onClick={() => onChoice(UPLOAD_CONFLICT_CANCEL)}
              aria-label="Close"
            >
              <FiX />
            </button>
          </header>

          <div className="ucm-body">
            <div className="ucm-conflict-panel">
              <div className="ucm-panel-head">
                <span className="ucm-panel-label">Conflicting name{isSingle ? "" : "s"}</span>
                <span className="ucm-count-badge">
                  {conflictingNames.length}
                </span>
              </div>
              <ul className="ucm-name-list">
                {namesPreview.map((name) => (
                  <li key={name} className="ucm-name-item">
                    <img
                      className="ucm-file-icon"
                      src={resolveFileIconPath({ fileName: name })}
                      alt=""
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/images/icons/doc.svg";
                      }}
                    />
                    <span className="ucm-file-name" title={name}>
                      {name}
                    </span>
                  </li>
                ))}
              </ul>
              {hiddenCount > 0 && (
                <p className="ucm-more">+ {hiddenCount} more file{hiddenCount === 1 ? "" : "s"}</p>
              )}
            </div>

            <div className="ucm-actions">
              <p className="ucm-actions-label">What would you like to do?</p>
              <div className="ucm-action-grid">
                {ACTIONS.map(
                  ({ id, icon: Icon, title, description, tone, recommended }) => (
                    <button
                      key={id}
                      type="button"
                      className={`ucm-action-card ucm-action-card--${tone}${
                        recommended ? " is-recommended" : ""
                      }`}
                      onClick={() => onChoice(id)}
                    >
                      <div className="ucm-action-card-top">
                        <span className="ucm-action-icon" aria-hidden="true">
                          <Icon />
                        </span>
                        {recommended && (
                          <span className="ucm-recommended">Recommended</span>
                        )}
                      </div>
                      <span className="ucm-action-title">{title}</span>
                      <span className="ucm-action-desc">{description}</span>
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          <footer className="ucm-footer">
            <button
              type="button"
              className="ucm-cancel-link"
              onClick={() => onChoice(UPLOAD_CONFLICT_CANCEL)}
            >
              Cancel upload
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}
