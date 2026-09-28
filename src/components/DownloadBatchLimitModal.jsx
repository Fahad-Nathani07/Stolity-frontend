import React from "react";
import { FiX, FiDownload, FiArchive, FiAlertTriangle } from "react-icons/fi";
import {
  DOWNLOAD_BATCH_CANCEL,
  DOWNLOAD_BATCH_CONTINUE,
  DOWNLOAD_BATCH_ZIP_AND_DOWNLOAD,
  formatDownloadBytes,
} from "../utils/downloadBatchLimits";
import "./DownloadBatchLimitModal.css";

/**
 * @param {'soft'|'zip-recommend'|'size-limit'} level
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

  let eyebrow = "Download";
  let title = "";
  let body = "";
  let Icon = FiDownload;
  let tone = "info";

  if (level === "soft") {
    eyebrow = "Large download";
    title = "Large download";
    body = isFolder
      ? `This folder contains ${countLabel} files (${sizeLabel}). This may take some time.`
      : `You’re about to download ${countLabel} files (${sizeLabel}). This may take some time.`;
    Icon = FiDownload;
    tone = "info";
  } else if (level === "zip-recommend") {
    eyebrow = "Many small files";
    title = "Many small files detected";
    if (isFolder && canZipAndDownload) {
      body = `This folder contains ${countLabel} files totaling ${sizeLabel}. Downloading as a ZIP gives you one file instead of thousands.`;
    } else if (isFolder) {
      body = `This folder contains ${countLabel} files totaling ${sizeLabel}. Downloading as a ZIP is easier to manage.`;
    } else {
      body = `You selected ${countLabel} files totaling ${sizeLabel}. Zipping a multi-file selection isn’t available yet — open the parent folder, Zip it, then download the ZIP.`;
    }
    Icon = FiArchive;
    tone = "warn";
  } else if (level === "size-limit") {
    eyebrow = "Download size limit";
    title = "Download exceeds 2 GB";
    if (isFolder && canZipAndDownload) {
      body =
        count > 0
          ? `This folder contains ${countLabel} files totaling ${sizeLabel}. Please zip the folder and download the ZIP instead.`
          : `This folder totals ${sizeLabel}. Please zip the folder and download the ZIP instead.`;
    } else {
      body = `This download totals ${sizeLabel}. Zipping a multi-file selection isn’t available yet — open the parent folder, Zip it, then download the ZIP.`;
    }
    Icon = FiAlertTriangle;
    tone = "danger";
  }

  const showZipPrimary = canZipAndDownload && (level === "zip-recommend" || level === "size-limit");

  return (
    <div className="dblm-overlay" role="presentation">
      <div
        className="dblm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dblm-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`dblm-card dblm-card--${tone}`}>
          <header className="dblm-header">
            <div className="dblm-header-main">
              <div className="dblm-icon-wrap" aria-hidden="true">
                <Icon />
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
            {level === "soft" && (
              <>
                <button
                  type="button"
                  className="dblm-btn dblm-btn--primary"
                  onClick={() => onChoice?.(DOWNLOAD_BATCH_CONTINUE)}
                >
                  {isFolder ? "Download folder" : "Continue"}
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

            {level === "zip-recommend" && showZipPrimary && (
              <>
                <button
                  type="button"
                  className="dblm-btn dblm-btn--primary"
                  onClick={() => onChoice?.(DOWNLOAD_BATCH_ZIP_AND_DOWNLOAD)}
                >
                  Zip and download
                </button>
                <button
                  type="button"
                  className="dblm-btn dblm-btn--secondary"
                  onClick={() => onChoice?.(DOWNLOAD_BATCH_CONTINUE)}
                >
                  Download folder
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

            {level === "zip-recommend" && !showZipPrimary && (
              <>
                <button
                  type="button"
                  className="dblm-btn dblm-btn--primary"
                  onClick={() => onChoice?.(DOWNLOAD_BATCH_CANCEL)}
                >
                  OK
                </button>
                <button
                  type="button"
                  className="dblm-btn dblm-btn--secondary"
                  onClick={() => onChoice?.(DOWNLOAD_BATCH_CONTINUE)}
                >
                  Continue download
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

            {level === "size-limit" && showZipPrimary && (
              <>
                <button
                  type="button"
                  className="dblm-btn dblm-btn--primary"
                  onClick={() => onChoice?.(DOWNLOAD_BATCH_ZIP_AND_DOWNLOAD)}
                >
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
            )}

            {level === "size-limit" && !showZipPrimary && (
              <>
                <button
                  type="button"
                  className="dblm-btn dblm-btn--primary"
                  onClick={() => onChoice?.(DOWNLOAD_BATCH_CANCEL)}
                >
                  OK
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
