import React, { useEffect, useRef, useState } from "react";
import { FiCheck, FiChevronDown } from "react-icons/fi";
import {
  SHARE_TIME_OPTIONS,
  computeShareExpirySeconds,
  fetchShareUrl,
} from "../utils/shareLink";
import "./FileShareModal.css";

const MANUAL_UNITS = ["Day", "Hour", "Min"];

function displayFileName(file) {
  if (!file) return "";
  const raw = file.fileName || file.name || "";
  const parts = raw.split("/");
  return parts[parts.length - 1] || raw;
}

function FsmSelect({
  id,
  value,
  options,
  onChange,
  disabled = false,
  ariaLabel,
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  return (
    <div
      className={`fsm-dd${open ? " is-open" : ""}${className ? ` ${className}` : ""}`}
      ref={rootRef}
    >
      <button
        type="button"
        id={id}
        className="fsm-dd-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="fsm-dd-value">{value}</span>
        <FiChevronDown className="fsm-dd-chevron" aria-hidden="true" />
      </button>
      {open ? (
        <ul className="fsm-dd-menu" role="listbox" aria-label={ariaLabel}>
          {options.map((option) => {
            const active = option === value;
            return (
              <li key={option} role="option" aria-selected={active}>
                <button
                  type="button"
                  className={`fsm-dd-option${active ? " is-active" : ""}`}
                  onClick={() => {
                    onChange?.(option);
                    setOpen(false);
                  }}
                >
                  <span>{option}</span>
                  {active ? <FiCheck aria-hidden="true" /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

/**
 * Premium share-link modal (permanent public URL vs time-limited presigned URL).
 */
const FileShareModal = ({
  isOpen,
  onClose,
  file,
  resolveFilePath,
  apiUrl,
  token,
  shared,
  onCopied,
  onError,
}) => {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [shareMode, setShareMode] = useState("permanent");
  const [expiryType, setExpiryType] = useState("preset");
  const [selectedTimeOption, setSelectedTimeOption] = useState("1 Min");
  const [manualTimeValue, setManualTimeValue] = useState("");
  const [manualTimeUnit, setManualTimeUnit] = useState("Day");
  const [loading, setLoading] = useState(false);

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
      if (e.key === "Escape" && !loading) handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, closing, loading]);

  const resetForm = () => {
    setShareMode("permanent");
    setExpiryType("preset");
    setSelectedTimeOption("1 Min");
    setManualTimeValue("");
    setManualTimeUnit("Day");
    setLoading(false);
  };

  const handleClose = () => {
    if (closing || loading) return;
    setClosing(true);
    setVisible(false);
    setTimeout(() => {
      resetForm();
      setClosing(false);
      onClose?.();
    }, 220);
  };

  const handleGetLink = async () => {
    if (!file || !apiUrl || !token || loading) return;

    const filePath = resolveFilePath
      ? resolveFilePath(file)
      : file.fileName || "";

    if (!filePath) {
      onError?.("Could not resolve file path.");
      return;
    }

    const signedTime = computeShareExpirySeconds({
      shareMode,
      useManualEntry: expiryType === "custom",
      manualTimeValue,
      manualTimeUnit,
      selectedTimeOption,
    });

    if (shareMode === "limited" && !signedTime) {
      onError?.("Please choose or enter a valid expiry time.");
      return;
    }

    setLoading(true);
    try {
      const url = await fetchShareUrl({
        apiUrl,
        token,
        filePath,
        shareMode,
        signedTime,
        shared,
      });

      if (!url) {
        throw new Error("No URL returned");
      }

      await navigator.clipboard.writeText(url);
      setLoading(false);
      onCopied?.();
      handleClose();
    } catch (err) {
      console.error("Error generating share link:", err);
      onError?.();
      setLoading(false);
    }
  };

  if (!isOpen && !closing) return null;

  const openClass = visible && !closing ? " is-open" : "";
  const fileLabel = displayFileName(file);

  return (
    <div
      className={`fsm-overlay${openClass}`}
      onClick={handleClose}
      role="presentation"
    >
      <div
        className={`fsm-modal${openClass}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Share file"
      >
        <button
          type="button"
          className="fsm-close"
          onClick={handleClose}
          disabled={loading}
          aria-label="Close"
        >
          ×
        </button>

        <div className="fsm-header">
          <p className="fsm-eyebrow">Share link</p>
          <h3 className="fsm-title">Share File URL</h3>
          <p className="fsm-subtitle">
            {fileLabel ? (
              <>
                Generate a link for{" "}
                <span className="fsm-filename" title={fileLabel}>
                  {fileLabel}
                </span>
              </>
            ) : (
              "Choose how others can access this file."
            )}
          </p>
        </div>

        <div className="fsm-options">
          <button
            type="button"
            className={`fsm-option${shareMode === "permanent" ? " is-selected" : ""}`}
            onClick={() => setShareMode("permanent")}
            disabled={loading}
          >
            <span className="fsm-option-icon" aria-hidden="true">
              ∞
            </span>
            <span className="fsm-option-body">
              <strong>Permanent</strong>
              <span>Public link that does not expire</span>
            </span>
            <span className="fsm-option-check" aria-hidden="true" />
          </button>

          <button
            type="button"
            className={`fsm-option${shareMode === "limited" ? " is-selected" : ""}`}
            onClick={() => setShareMode("limited")}
            disabled={loading}
          >
            <span className="fsm-option-icon" aria-hidden="true">
              ⏱
            </span>
            <span className="fsm-option-body">
              <strong>Limited time</strong>
              <span>Presigned link that expires automatically</span>
            </span>
            <span className="fsm-option-check" aria-hidden="true" />
          </button>
        </div>

        {shareMode === "limited" && (
          <div className="fsm-expiry">
            <p className="fsm-expiry-heading">Link expiry</p>

            <div className="fsm-expiry-toggle" role="tablist" aria-label="Expiry type">
              <button
                type="button"
                role="tab"
                aria-selected={expiryType === "preset"}
                className={`fsm-expiry-tab${expiryType === "preset" ? " is-active" : ""}`}
                onClick={() => setExpiryType("preset")}
                disabled={loading}
              >
                Preset
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={expiryType === "custom"}
                className={`fsm-expiry-tab${expiryType === "custom" ? " is-active" : ""}`}
                onClick={() => setExpiryType("custom")}
                disabled={loading}
              >
                Custom
              </button>
            </div>

            {expiryType === "preset" ? (
              <div className="fsm-field">
                <label className="fsm-label" htmlFor="fsm-expiry-preset">
                  Choose duration
                </label>
                <FsmSelect
                  id="fsm-expiry-preset"
                  className="is-active"
                  value={selectedTimeOption}
                  options={SHARE_TIME_OPTIONS}
                  onChange={setSelectedTimeOption}
                  disabled={loading}
                  ariaLabel="Choose duration"
                />
              </div>
            ) : (
              <div className="fsm-field">
                <label className="fsm-label" htmlFor="fsm-expiry-manual">
                  Enter duration
                </label>
                <div className="fsm-custom-row is-active">
                  <input
                    id="fsm-expiry-manual"
                    type="text"
                    inputMode="numeric"
                    className="fsm-custom-amount"
                    placeholder="Amount"
                    value={manualTimeValue}
                    onChange={(e) => setManualTimeValue(e.target.value)}
                    disabled={loading}
                  />
                  <FsmSelect
                    className="fsm-dd--unit"
                    value={manualTimeUnit}
                    options={MANUAL_UNITS}
                    onChange={setManualTimeUnit}
                    disabled={loading}
                    ariaLabel="Expiry unit"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="fsm-actions">
          <button
            type="button"
            className="fsm-btn fsm-btn-ghost"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="fsm-btn fsm-btn-solid"
            onClick={handleGetLink}
            disabled={loading || !file}
          >
            {loading ? "Generating…" : "Copy link"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileShareModal;
