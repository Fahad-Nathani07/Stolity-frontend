import React from "react";
import { createPortal } from "react-dom";
import { FiX, FiUploadCloud, FiArchive, FiAlertTriangle } from "react-icons/fi";
import {
  UPLOAD_BATCH_CANCEL,
  UPLOAD_BATCH_CONTINUE,
  UPLOAD_BATCH_ZIP_INSTEAD,
  formatUploadBytes,
  estimateUploadBatchTimes,
} from "../utils/uploadBatchLimits";
import "./UploadBatchLimitModal.css";

/**
 * @param {'soft'|'zip-recommend'|'hard'} level
 * @param {'files'|'folder'} [source]
 */
export default function UploadBatchLimitModal({
  isOpen,
  level,
  count = 0,
  totalBytes = 0,
  source = "files",
  onChoice,
}) {
  if (!isOpen || !level || level === "none") return null;

  const sizeLabel = formatUploadBytes(totalBytes);
  const countLabel = Number(count).toLocaleString();
  const isFolder = source === "folder";
  const eta = estimateUploadBatchTimes({ count, totalBytes });
  const showEta = level === "soft" || level === "zip-recommend";

  let eyebrow = "Upload";
  let title = "";
  let body = "";
  let Icon = FiUploadCloud;
  let tone = "info";

  if (level === "soft") {
    eyebrow = "Large upload";
    title = "Large upload";
    body = isFolder
      ? `The selected folder contains ${countLabel} files (${sizeLabel}). This may take some time.`
      : `You’re about to upload ${countLabel} files (${sizeLabel}). This may take some time.`;
    Icon = FiUploadCloud;
    tone = "info";
  } else if (level === "zip-recommend") {
    eyebrow = "Many small files";
    title = "Many small files detected";
    body = isFolder
      ? `The selected folder contains ${countLabel} files totaling ${sizeLabel}. For a faster, more reliable upload, compress the folder into a ZIP on your device, then upload the ZIP file.`
      : `You selected ${countLabel} files totaling ${sizeLabel}. For a faster, more reliable upload, compress them into a ZIP on your device, then upload the ZIP file.`;
    Icon = FiArchive;
    tone = "warn";
  } else if (level === "hard") {
    eyebrow = "Upload limit";
    title = "Upload limit exceeded";
    body = isFolder
      ? `The selected folder contains ${countLabel} files. Please compress the folder into a ZIP on your device and upload the ZIP file instead.`
      : `You selected ${countLabel} files. Please compress them into a ZIP on your device and upload the ZIP file instead.`;
    Icon = FiAlertTriangle;
    tone = "danger";
  }

  return createPortal(
    <div className="ublm-overlay" role="presentation">
      <div
        className="ublm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ublm-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`ublm-card ublm-card--${tone}`}>
          <header className="ublm-header">
            <div className="ublm-header-main">
              <div className="ublm-icon-wrap" aria-hidden="true">
                <Icon />
              </div>
              <div className="ublm-header-text">
                <p className="ublm-eyebrow">{eyebrow}</p>
                <h2 id="ublm-title" className="ublm-title">
                  {title}
                </h2>
                <p className="ublm-subtitle">{body}</p>
              </div>
            </div>
            <button
              type="button"
              className="ublm-close"
              aria-label="Cancel"
              onClick={() => onChoice?.(UPLOAD_BATCH_CANCEL)}
            >
              <FiX />
            </button>
          </header>

          {showEta && (eta.asIsLabel || eta.asZipLabel) && (
            <div className="ublm-eta" aria-label="Estimated upload times">
              {eta.asIsLabel && (
                <div className="ublm-eta-row">
                  <span className="ublm-eta-key">Estimated time</span>
                  <span className="ublm-eta-val">{eta.asIsLabel}</span>
                </div>
              )}
              {eta.asZipLabel && (
                <div className="ublm-eta-row">
                  <span className="ublm-eta-key">If uploaded as ZIP</span>
                  <span className="ublm-eta-val">{eta.asZipLabel}</span>
                </div>
              )}
              <p className="ublm-eta-note">
                ZIP estimate assumes ~8 MB/s and depends on your internet speed.
                Local zip time is not included.
              </p>
            </div>
          )}

          <div className="ublm-actions">
            {level === "soft" && (
              <>
                <button
                  type="button"
                  className="ublm-btn ublm-btn--primary"
                  onClick={() => onChoice?.(UPLOAD_BATCH_CONTINUE)}
                >
                  Continue
                </button>
                <button
                  type="button"
                  className="ublm-btn ublm-btn--ghost"
                  onClick={() => onChoice?.(UPLOAD_BATCH_CANCEL)}
                >
                  Cancel
                </button>
              </>
            )}

            {level === "zip-recommend" && (
              <>
                <button
                  type="button"
                  className="ublm-btn ublm-btn--primary"
                  onClick={() => onChoice?.(UPLOAD_BATCH_ZIP_INSTEAD)}
                >
                  Upload a ZIP instead
                </button>
                <button
                  type="button"
                  className="ublm-btn ublm-btn--secondary"
                  onClick={() => onChoice?.(UPLOAD_BATCH_CONTINUE)}
                >
                  {isFolder
                    ? "Continue with selected folder"
                    : "Continue with selected files"}
                </button>
                <button
                  type="button"
                  className="ublm-btn ublm-btn--ghost"
                  onClick={() => onChoice?.(UPLOAD_BATCH_CANCEL)}
                >
                  Cancel
                </button>
              </>
            )}

            {level === "hard" && (
              <>
                <button
                  type="button"
                  className="ublm-btn ublm-btn--primary"
                  onClick={() => onChoice?.(UPLOAD_BATCH_ZIP_INSTEAD)}
                >
                  OK
                </button>
                <button
                  type="button"
                  className="ublm-btn ublm-btn--ghost"
                  onClick={() => onChoice?.(UPLOAD_BATCH_CANCEL)}
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
