import React, { useContext, useState, useEffect, useRef } from "react";
import { DownloadContext } from "./DownloadContext";
import { FaListUl, FaChevronUp } from "react-icons/fa";
import DraggableFloatShell from "../components/DraggableFloatShell";
import {
  buildSoftEtaLabel,
  computeOverallProgress,
  getTransferDisplayName,
  isDownloadOnlyBatch,
  DOWNLOAD_OPERATION,
} from "../utils/transferEta";
import { resolveFileIconPath } from "../utils/fileIcon";
import "../css/UploadProgressModal.css";

const DownloadProgressModal = () => {
  const { downloads, cancelDownload, cancelAllDownloads } =
    useContext(DownloadContext);
  const [showAll, setShowAll] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [downloadsMap, setDownloadsMap] = useState({});
  const [etaLabel, setEtaLabel] = useState(null);
  const initialDownloadsCountRef = useRef(downloads.length);
  const batchStartedAtRef = useRef(null);

  useEffect(() => {
    if (downloads.length === 0) {
      setDownloadsMap({});
      initialDownloadsCountRef.current = 0;
      batchStartedAtRef.current = null;
      setEtaLabel(null);
      return;
    }

    if (downloads.length > initialDownloadsCountRef.current) {
      if (initialDownloadsCountRef.current === 0) {
        batchStartedAtRef.current = Date.now();
        setEtaLabel(null);
      }
      initialDownloadsCountRef.current = downloads.length;
    } else if (downloads.length < initialDownloadsCountRef.current) {
      initialDownloadsCountRef.current = downloads.length;
    }

    setDownloadsMap((prevMap) => {
      const newMap = { ...prevMap };

      Object.keys(newMap).forEach((id) => {
        if (!downloads.find((d) => String(d.id) === String(id))) {
          delete newMap[id];
        }
      });

      downloads.forEach((dl) => {
        newMap[dl.id] = {
          id: dl.id,
          fileName: dl.fileName,
          isFolder: Boolean(dl.isFolder),
          progress: dl.progress || 0,
          sizeInBytes: dl.sizeInBytes || 0,
          operation: dl.operation || DOWNLOAD_OPERATION,
        };
      });

      return newMap;
    });
  }, [downloads]);

  const downloadArray = Object.values(downloadsMap);
  const fileCount = downloadArray.length;
  const overallProgress = computeOverallProgress(downloadArray);
  const showEta = isDownloadOnlyBatch(downloadArray);
  const completedCount = downloadArray.filter(
    (d) => Math.round(d.progress) >= 100
  ).length;

  useEffect(() => {
    if (!showEta || downloadArray.length === 0) {
      setEtaLabel(null);
      return undefined;
    }

    if (!batchStartedAtRef.current) {
      batchStartedAtRef.current = Date.now();
    }

    const tick = () => {
      const elapsedMs = Date.now() - (batchStartedAtRef.current || Date.now());
      const progress = computeOverallProgress(downloadArray);
      setEtaLabel(
        buildSoftEtaLabel({
          overallProgress: progress,
          elapsedMs,
          isPaused: false,
        })
      );
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [showEta, downloadArray, overallProgress]);

  useEffect(() => {
    if (fileCount === 0) return undefined;
    if (overallProgress >= 100) {
      const timeout = setTimeout(() => {
        setDownloadsMap({});
        initialDownloadsCountRef.current = 0;
        batchStartedAtRef.current = null;
        setEtaLabel(null);
      }, 400);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [overallProgress, fileCount]);

  if (Object.keys(downloadsMap).length === 0) return null;

  const percentShown = Math.min(100, Math.max(0, overallProgress));
  const hasIncomplete = downloadArray.some((d) => Math.round(d.progress) < 100);

  const handleCancelAll = () => {
    setDownloadsMap({});
    batchStartedAtRef.current = null;
    setEtaLabel(null);
    initialDownloadsCountRef.current = 0;
    cancelAllDownloads();
  };

  return (
    <DraggableFloatShell
      className={`upload-modal-container${minimized ? " is-minimized" : ""}`}
    >
      {minimized ? (
        <button
          type="button"
          className="tp-mini"
          onClick={() => setMinimized(false)}
          title="Expand"
          aria-label="Expand progress panel"
        >
          <span className="tp-mini-spinner" aria-hidden="true" />
          <span className="tp-mini-label">Downloading</span>
          <span className="tp-mini-pct">{percentShown.toFixed(0)}%</span>
          <span className="tp-mini-expand" aria-hidden="true">
            ▢
          </span>
        </button>
      ) : (
        <div className="tp-panel">
          <div className="tp-header">
            <div className="tp-window-controls">
              <button
                type="button"
                className={`tp-window-btn tp-window-btn--details${showAll ? " is-active" : ""}`}
                onClick={() => setShowAll((v) => !v)}
                title={showAll ? "Hide file list" : "Show file list"}
                aria-label={showAll ? "Hide file list" : "Show file list"}
                aria-expanded={showAll}
              >
                {showAll ? <FaChevronUp /> : <FaListUl />}
              </button>
              <button
                type="button"
                className="tp-window-btn tp-window-btn--minimize"
                onClick={() => {
                  setShowAll(false);
                  setMinimized(true);
                }}
                title="Minimize"
                aria-label="Minimize"
              >
                ─
              </button>
              {hasIncomplete && (
                <button
                  type="button"
                  className="tp-window-btn tp-window-btn--close"
                  onClick={handleCancelAll}
                  title="Cancel all"
                  aria-label="Cancel all"
                >
                  ✕
                </button>
              )}
            </div>
            <div className="tp-header-body">
              <div className="tp-header-text">
                <h5 className="tp-title">Downloading</h5>
                <p className="tp-subtitle">
                  {completedCount} of {fileCount}{" "}
                  {fileCount === 1 ? "file" : "files"} done
                </p>
              </div>
            </div>
          </div>

          <div className="tp-summary">
            <div className="tp-summary-top">
              <span className="tp-summary-label">Overall progress</span>
              <span className="tp-percent">
                {percentShown.toFixed(0)}
                <span className="tp-percent-unit">%</span>
              </span>
            </div>
            <div className="tp-bar-wrap" aria-hidden="true">
              <div className="tp-bar" style={{ width: `${percentShown}%` }} />
            </div>
            <div
              className={`tp-eta${showEta && etaLabel ? "" : " is-empty"}`}
              title={showEta ? "Estimated time remaining" : undefined}
            >
              {showEta && etaLabel ? etaLabel : "—"}
            </div>
          </div>

          {showAll && (
            <div className="tp-list">
              {downloadArray.map((download) => {
                const isCompleted = Math.round(download.progress) >= 100;
                const itemPct = Math.min(
                  100,
                  Math.max(0, download.progress || 0)
                );
                const displayName = getTransferDisplayName(download.fileName);
                const iconSrc = resolveFileIconPath({
                  fileName: displayName,
                  isFolder: download.isFolder,
                });

                return (
                  <div key={download.id} className="tp-item">
                    <div className="tp-item-row">
                      <div className="tp-item-main">
                        <img
                          className="tp-file-icon"
                          src={iconSrc}
                          alt=""
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "/images/icons/doc.svg";
                          }}
                        />
                        <div className="tp-item-meta">
                          <div className="tp-file-name" title={displayName}>
                            {displayName}
                          </div>
                          <div className="tp-item-status">
                            <strong>{Math.round(itemPct)}</strong>% complete
                          </div>
                        </div>
                      </div>

                      {!isCompleted && (
                        <div className="tp-item-actions">
                          <button
                            type="button"
                            className="tp-item-cancel-btn"
                            onClick={() => cancelDownload(download.id)}
                            title="Cancel download"
                            aria-label="Cancel download"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="tp-item-bar-wrap">
                      <div
                        className="tp-item-bar"
                        style={{ width: `${itemPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </DraggableFloatShell>
  );
};

export default DownloadProgressModal;
