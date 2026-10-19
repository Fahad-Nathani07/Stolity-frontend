import React from "react";
import { FiX, FiDownload, FiArchive } from "react-icons/fi";
import {
  DOWNLOAD_BATCH_CANCEL,
  DOWNLOAD_BATCH_CONTINUE,
  DOWNLOAD_BATCH_ZIP_AND_DOWNLOAD,
  formatDownloadBytes,
} from "../utils/downloadBatchLimits";
import "./DownloadBatchLimitModal.css";

/**
 * Soft warn for large multi-file / folder downloads (may take time / load the browser).
 * @param {'direct-stream'} level
 * @param {'files'|'folder'|'mixed'} [source]
 */
export default function DownloadBatchLimitModal({
  isOpen,
  level,
  count = 0,
  totalBytes = 0,
  source = "files",
  canZipAndDownload = false,
  onChoice,
}) {
  if (!isOpen || !level || level === "none") return null;

  const sizeLabel = formatDownloadBytes(totalBytes);
  const countLabel = Number(count).toLocaleString();
  const isFolder = source === "folder";

  const eyebrow = "Large download";
  const title = "This may take a while";
  let body = "";
  if (isFolder) {
    body =
      count > 0
        ? `You’re about to download a large batch (${countLabel} files · ${sizeLabel}). This can take time and temporarily slow things down.`
        : `You’re about to download a large batch (${sizeLabel}). This can take time and temporarily slow things down.`;
  } else if (source === "mixed") {
    body = `You’re about to download a large batch (${countLabel} items · ${sizeLabel}). This can take time and temporarily slow things down.`;
  } else {
    body = `You’re about to download a large batch (${countLabel} files · ${sizeLabel}). This can take time and temporarily slow things down.`;
  }

  return (
    <div className="dblm-overlay" role="presentation">
      <div
        className="dblm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dblm-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dblm-card dblm-card--info">
          <header className="dblm-header">
            <div className="dblm-header-main">
              <div className="dblm-icon-wrap" aria-hidden="true">
                <FiDownload />
              </div>
              <div className="dblm-header-text">
                <p className="dblm-eyebrow">{eyebrow}</p>
                <h2 id="dblm-title" className="dblm-title">
                  {title}
                </h2>
                <p className="dblm-subtitle">{body}</p>
              </div>
            </div>
            <button
              type="button"
              className="dblm-close"
              aria-label="Cancel"
              onClick={() => onChoice?.(DOWNLOAD_BATCH_CANCEL)}
            >
              <FiX />
            </button>
          </header>

          <div className="dblm-actions">
            {canZipAndDownload && isFolder ? (
              <>
                <button
                  type="button"
                  className="dblm-btn dblm-btn--primary"
                  onClick={() => onChoice?.(DOWNLOAD_BATCH_CONTINUE)}
                >
                  Continue
                </button>
                <button
                  type="button"
                  className="dblm-btn dblm-btn--secondary"
                  onClick={() => onChoice?.(DOWNLOAD_BATCH_ZIP_AND_DOWNLOAD)}
                >
                  <FiArchive aria-hidden />
                  Zip and download
                </button>
                <button
                  type="button"
                  className="dblm-btn dblm-btn--ghost"
                  onClick={() => onChoice?.(DOWNLOAD_BATCH_CANCEL)}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="dblm-btn dblm-btn--primary"
                  onClick={() => onChoice?.(DOWNLOAD_BATCH_CONTINUE)}
                >
                  Continue
                </button>
                <button
                  type="button"
                  className="dblm-btn dblm-btn--ghost"
                  onClick={() => onChoice?.(DOWNLOAD_BATCH_CANCEL)}
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
