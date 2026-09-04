import React, { useEffect, useRef } from "react";
import { FiEdit3, FiX } from "react-icons/fi";
import "./RenameModal.css";

function getDisplayName(filePath) {
  const value = String(filePath || "").trim();
  if (!value) return "";
  const parts = value.split("/");
  return parts[parts.length - 1] || value;
}

export default function RenameModal({
  isOpen,
  onClose,
  value,
  onChange,
  onSubmit,
  isSubmitting = false,
  title = "Rename",
  description = "Enter a new name for this item.",
  currentName = "",
  extensionSuffix = "",
  placeholder = "Enter new name",
  submitLabel = "Rename",
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 50);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !isSubmitting) {
      event.preventDefault();
      onSubmit?.();
    }
    if (event.key === "Escape") {
      onClose?.();
    }
  };

  const displayName = getDisplayName(currentName);

  return (
    <div
      className="rename-modal-overlay"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="rename-modal-dialog"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rename-modal-title"
      >
        <div className="rename-modal-card">
          <header className="rename-modal-header">
            <div className="rename-modal-header-main">
              <div className="rename-modal-icon-wrap">
                <FiEdit3 aria-hidden="true" />
              </div>
              <div className="rename-modal-header-text">
                <h2 id="rename-modal-title" className="rename-modal-title">
                  {title}
                </h2>
                <p className="rename-modal-subtitle">{description}</p>
              </div>
            </div>
            <button
              type="button"
              className="rename-modal-close-btn"
              onClick={onClose}
              aria-label="Close"
            >
              <FiX />
            </button>
          </header>

          {displayName ? (
            <div className="rename-modal-current">
              <span className="rename-modal-current-label">Current name</span>
              <span className="rename-modal-current-value" title={displayName}>
                {displayName}
              </span>
            </div>
          ) : null}

          <div className="rename-modal-body">
            <label className="rename-modal-field-label" htmlFor="rename-modal-input">
              New name
            </label>
            <div
              className={`rename-modal-input-row${
                extensionSuffix ? " rename-modal-input-row--with-suffix" : ""
              }`}
            >
              <input
                id="rename-modal-input"
                ref={inputRef}
                className="rename-modal-input"
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                onKeyDown={handleKeyDown}
                disabled={isSubmitting}
                autoComplete="off"
              />
              {extensionSuffix ? (
                <span className="rename-modal-extension">{extensionSuffix}</span>
              ) : null}
            </div>
          </div>

          <footer className="rename-modal-footer">
            <button
              type="button"
              className="rename-modal-btn rename-modal-btn--ghost"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="rename-modal-btn rename-modal-btn--primary"
              onClick={onSubmit}
              disabled={isSubmitting || !String(value || "").trim()}
            >
              {isSubmitting ? "Renaming…" : submitLabel}
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}
