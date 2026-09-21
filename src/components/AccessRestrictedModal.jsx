import React, { useEffect } from "react";
import { FiX, FiUnlock } from "react-icons/fi";
import "./AccessRestrictedModal.css";

/**
 * Recycle Bin: item cannot be opened until restored.
 */
export default function AccessRestrictedModal({
  isOpen,
  onClose,
  onRestore,
  itemName = "",
  isFolder = false,
}) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const kind = isFolder ? "folder" : "file";

  return (
    <div
      className="access-restricted-modal-overlay"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="access-restricted-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="access-restricted-modal-title"
      >
        <div className="access-restricted-modal-card">
          <header className="access-restricted-modal-header">
            <div className="access-restricted-modal-header-main">
              <div
                className="access-restricted-modal-icon-wrap"
                aria-hidden="true"
              >
                <FiUnlock />
              </div>
              <div className="access-restricted-modal-header-text">
                <h2
                  id="access-restricted-modal-title"
                  className="access-restricted-modal-title"
                >
                  Access restricted
                </h2>
                <p className="access-restricted-modal-subtitle">
                  Restore this {kind} to open it
                </p>
              </div>
            </div>
            <button
              type="button"
              className="access-restricted-modal-close-btn"
              onClick={onClose}
              aria-label="Close"
            >
              <FiX aria-hidden="true" />
            </button>
          </header>

          <div className="access-restricted-modal-body">
            <p className="access-restricted-modal-lead">
              This {kind} is in the Recycle Bin.
            </p>
            {itemName ? (
              <p className="access-restricted-modal-path">{itemName}</p>
            ) : null}
            <p className="access-restricted-modal-hint">
              Restore it before you can access it.
            </p>
          </div>

          <footer className="access-restricted-modal-footer">
            <button
              type="button"
              className="access-restricted-modal-btn access-restricted-modal-btn--ghost"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="access-restricted-modal-btn access-restricted-modal-btn--primary"
              onClick={onRestore}
            >
              Restore now
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}
