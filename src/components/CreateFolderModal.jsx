import React, { useEffect, useRef } from "react";
import { FiFolderPlus, FiX } from "react-icons/fi";
import "./CreateFolderModal.css";

export default function CreateFolderModal({
  isOpen,
  onClose,
  value,
  onChange,
  onSubmit,
  error = "",
  isSubmitting = false,
  title = "Create Folder",
  description = "Give your new folder a clear name.",
  placeholder = "Enter folder name",
  submitLabel = "Create",
  zIndex,
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
      onSubmit?.(event);
    }
    if (event.key === "Escape") {
      onClose?.();
    }
  };

  const trimmed = String(value || "").trim();

  return (
    <div
      className="create-folder-modal-overlay"
      style={zIndex != null ? { zIndex } : undefined}
      onClick={onClose}
      role="presentation"
    >
      <div
        className="create-folder-modal-dialog"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-folder-modal-title"
      >
        <div className="create-folder-modal-card">
          <header className="create-folder-modal-header">
            <div className="create-folder-modal-header-main">
              <div className="create-folder-modal-icon-wrap">
                <FiFolderPlus aria-hidden="true" />
              </div>
              <div className="create-folder-modal-header-text">
                <h2
                  id="create-folder-modal-title"
                  className="create-folder-modal-title"
                >
                  {title}
                </h2>
                <p className="create-folder-modal-subtitle">{description}</p>
              </div>
            </div>
            <button
              type="button"
              className="create-folder-modal-close-btn"
              onClick={onClose}
              aria-label="Close"
              disabled={isSubmitting}
            >
              <FiX />
            </button>
          </header>

          <form
            className="create-folder-modal-body"
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit?.(e);
            }}
          >
            <label
              className="create-folder-modal-field-label"
              htmlFor="create-folder-modal-input"
            >
              Folder name
            </label>
            <div
              className={`create-folder-modal-input-row${
                error ? " has-error" : ""
              }`}
            >
              <input
                id="create-folder-modal-input"
                name="fname"
                ref={inputRef}
                className="create-folder-modal-input"
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                onKeyDown={handleKeyDown}
                disabled={isSubmitting}
                autoComplete="off"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "create-folder-modal-error" : undefined}
              />
            </div>
            {error ? (
              <p id="create-folder-modal-error" className="create-folder-modal-error">
                {error}
              </p>
            ) : (
              <p className="create-folder-modal-hint">
                Letters, numbers, spaces, underscores, and hyphens only.
              </p>
            )}

            <footer className="create-folder-modal-footer">
              <button
                type="button"
                className="create-folder-modal-btn create-folder-modal-btn--ghost"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="create-folder-modal-btn create-folder-modal-btn--primary"
                disabled={isSubmitting || !trimmed}
              >
                {isSubmitting ? "Creating…" : submitLabel}
              </button>
            </footer>
          </form>
        </div>
      </div>
    </div>
  );
}
