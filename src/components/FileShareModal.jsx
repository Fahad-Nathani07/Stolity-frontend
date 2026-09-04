import React, { useEffect, useState } from "react";
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
                <select
                  id="fsm-expiry-preset"
                  className="fsm-select is-active"
                  value={selectedTimeOption}
                  onChange={(e) => setSelectedTimeOption(e.target.value)}
                  disabled={loading}
                >
                  {SHARE_TIME_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
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
                  <select
                    className="fsm-custom-unit"
                    value={manualTimeUnit}
                    onChange={(e) => setManualTimeUnit(e.target.value)}
                    disabled={loading}
                    aria-label="Expiry unit"
                  >
                    {MANUAL_UNITS.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
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
