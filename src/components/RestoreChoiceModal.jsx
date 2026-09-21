import React, { useEffect } from "react";
import { FiX, FiMapPin, FiCornerUpLeft } from "react-icons/fi";
import { History as RotateCcwClock } from "lucide-react";
import "./RestoreChoiceModal.css";

/**
 * Recycle Bin restore choice: original path and/or pick a destination.
 * Hide "Restore to original" when showOriginal is false (legacy files without originalPath).
 */
export default function RestoreChoiceModal({
  isOpen,
  onClose,
  title = "Restore",
  itemLabel = "",
  originalPath = "",
  showOriginal = false,
  onRestoreOriginal,
  onChooseLocation,
  isBusy = false,
}) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape" && !isBusy) onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, isBusy, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="restore-choice-modal-overlay"
      onClick={() => {
        if (!isBusy) onClose?.();
      }}
      role="presentation"
    >
      <div
        className="restore-choice-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="restore-choice-modal-title"
      >
        <div className="restore-choice-modal-card">
          <header className="restore-choice-modal-header">
            <div className="restore-choice-modal-header-main">
              <div className="restore-choice-modal-icon-wrap" aria-hidden="true">
                <RotateCcwClock size={20} strokeWidth={2} />
              </div>
              <div className="restore-choice-modal-header-text">
                <h2
                  id="restore-choice-modal-title"
                  className="restore-choice-modal-title"
                >
                  {title}
                </h2>
                <p className="restore-choice-modal-subtitle">
                  {itemLabel
                    ? `Choose where to restore ${itemLabel}`
                    : "Choose where to restore"}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="restore-choice-modal-close-btn"
              onClick={onClose}
              aria-label="Close"
              disabled={isBusy}
            >
              <FiX />
            </button>
          </header>

          <div className="restore-choice-modal-body">
            {showOriginal ? (
              <button
                type="button"
                className="restore-choice-option restore-choice-option--primary"
                onClick={onRestoreOriginal}
                disabled={isBusy}
              >
                <span className="restore-choice-option-icon" aria-hidden="true">
                  <FiCornerUpLeft />
                </span>
                <span className="restore-choice-option-text">
                  <strong>Restore to original</strong>
                  <span>
                    {originalPath
                      ? originalPath
                      : "Back to the path it was deleted from"}
                  </span>
                </span>
              </button>
            ) : null}

            <button
              type="button"
              className="restore-choice-option"
              onClick={onChooseLocation}
              disabled={isBusy}
            >
              <span className="restore-choice-option-icon" aria-hidden="true">
                <FiMapPin />
              </span>
              <span className="restore-choice-option-text">
                <strong>Choose location</strong>
                <span>Pick a folder in My Files</span>
              </span>
            </button>
          </div>

          <footer className="restore-choice-modal-footer">
            <button
              type="button"
              className="restore-choice-modal-btn restore-choice-modal-btn--ghost"
              onClick={onClose}
              disabled={isBusy}
            >
              Cancel
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}
