import React from "react";
import { FiX, FiDownload, FiArchive } from "react-icons/fi";
import {
  DOWNLOAD_BATCH_CANCEL,
  DOWNLOAD_BATCH_CONTINUE,
  DOWNLOAD_BATCH_ZIP_AND_DOWNLOAD,
  formatDownloadBytes,
} from "../utils/downloadBatchLimits";
import { NATIVE_BROWSER_DOWNLOAD_MAX_FILES } from "../utils/downloadFilePresigned";
import "./DownloadBatchLimitModal.css";

/**
 * Warn when download will use Browser Direct Stream (not Native Browser Download).
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
  const nativeMax = NATIVE_BROWSER_DOWNLOAD_MAX_FILES;

  const eyebrow = "Browser Direct Stream";
  const title = "Larger download";
  let body = "";
  if (isFolder) {
    body =
      count > 0
        ? `This folder has ${countLabel} files (${sizeLabel}). It will download with Browser Direct Stream (you’ll pick a save folder).`
        : `This folder (${sizeLabel}) will download with Browser Direct Stream (you’ll pick a save folder).`;
  } else if (source === "mixed") {
    body = `This selection (${countLabel} items, ${sizeLabel}) will download with Browser Direct Stream (you’ll pick a save folder).`;
  } else {
    body = `You selected ${countLabel} files (${sizeLabel}). More than ${nativeMax} files use Browser Direct Stream (you’ll pick a save folder). Up to ${nativeMax} files use Native Browser Download with no extra step.`;
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
                  className="dblm-btn dblm-btn--ghost"
                  onClick={() => onChoice?.(DOWNLOAD_BATCH_CANCEL)}
                >
                  Cancel
                </button>
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
