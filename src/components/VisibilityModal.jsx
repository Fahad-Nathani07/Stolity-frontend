import React, { useEffect, useState } from "react";
import "./VisibilityModal.css";

/**
 * Shared premium File Visibility modal.
 *
 * @param {boolean} isOpen
 * @param {() => void} onClose
 * @param {"public"|"private"|string} value
 * @param {(next: "public"|"private") => void} onChange
 * @param {() => void} onApply
 * @param {string} [fileName]
 */
const VisibilityModal = ({
  isOpen,
  onClose,
  value = "private",
  onChange,
  onApply,
  fileName,
}) => {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setClosing(false);
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    }
    setVisible(false);
  }, [isOpen]);

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

  if ((!isOpen && !closing)) return null;

  const openClass = visible && !closing ? " is-open" : "";
  const selected = (value || "private").toLowerCase() === "public" ? "public" : "private";

  return (
    <div
      className={`vis-overlay${openClass}`}
      onClick={handleClose}
      role="presentation"
    >
      <div
        className={`vis-modal${openClass}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="File Visibility"
      >
        <button
          type="button"
          className="vis-close"
          onClick={handleClose}
          aria-label="Close"
        >
          ×
        </button>

        <div className="vis-header">
          <p className="vis-eyebrow">Access control</p>
          <h3 className="vis-title">File Visibility</h3>
          <p className="vis-subtitle">
            Choose who can access this file
            {fileName ? (
              <>
                : <span className="vis-filename" title={fileName}>{fileName}</span>
              </>
            ) : (
              "."
            )}
          </p>
        </div>

        <div className="vis-options">
          <button
            type="button"
            className={`vis-option${selected === "public" ? " is-selected" : ""}`}
            onClick={() => onChange?.("public")}
          >
            <span className="vis-option-icon" aria-hidden="true">
              ◎
            </span>
            <span className="vis-option-body">
              <strong>Public</strong>
              <span>Anyone with the link can view</span>
            </span>
            <span className="vis-option-check" aria-hidden="true" />
          </button>

          <button
            type="button"
            className={`vis-option${selected === "private" ? " is-selected" : ""}`}
            onClick={() => onChange?.("private")}
          >
            <span className="vis-option-icon" aria-hidden="true">
              ◉
            </span>
            <span className="vis-option-body">
              <strong>Private</strong>
              <span>Only you can access this file</span>
            </span>
            <span className="vis-option-check" aria-hidden="true" />
          </button>
        </div>

        <div className="vis-actions">
          <button type="button" className="vis-btn vis-btn-ghost" onClick={handleClose}>
            Cancel
          </button>
          <button
            type="button"
            className="vis-btn vis-btn-solid"
            onClick={() => onApply?.()}
          >
            Change Visibility
          </button>
        </div>
      </div>
    </div>
  );
};

export default VisibilityModal;
