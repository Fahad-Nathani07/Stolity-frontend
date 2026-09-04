import React, { useContext, useState, useEffect, useRef } from "react";
import { UploadContext } from "./UploadContext";
import "../css/UploadProgressModal.css";
import { FaPause, FaPlay, FaListUl, FaChevronUp } from "react-icons/fa";
import { useSelector } from "react-redux";
import DraggableFloatShell from "../components/DraggableFloatShell";
import {
  buildSoftEtaLabel,
  computeOverallProgress,
  getTransferDisplayName,
  isUploadOnlyBatch,
  resolveTransferOperation,
  UPLOAD_OPERATION,
  MOVE_OPERATION,
} from "../utils/transferEta";
import { resolveFileIconPath } from "../utils/fileIcon";

const UploadProgressModal = () => {
  const {
    uploads,
    abortUpload,
    abortAllUploads,
    pauseUpload,
    pauseAllUploads,
    resumeUpload,
    resumeAllUploads,
  } = useContext(UploadContext);
  const [showAll, setShowAll] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [uploadsMap, setUploadsMap] = useState({});
  const [etaLabel, setEtaLabel] = useState(null);
  const batchStartedAtRef = useRef(null);

  const subscription = useSelector((state) => state.subscription.subscription);
  const isPremium =
    !!subscription &&
    Array.isArray(subscription.entitlement_ids) &&
    subscription.entitlement_ids.length > 0;

  const initialUploadsCountRef = useRef(uploads.length);

  useEffect(() => {
    // New uploads added mid-batch: keep existing map entries (don't wipe progress UI)
    if (uploads.length > initialUploadsCountRef.current) {
      if (initialUploadsCountRef.current === 0) {
        batchStartedAtRef.current = Date.now();
        setEtaLabel(null);
      }
      initialUploadsCountRef.current = uploads.length;
    } else if (uploads.length < initialUploadsCountRef.current) {
      initialUploadsCountRef.current = uploads.length;
    }

    setUploadsMap((prevMap) => {
      const newMap = { ...prevMap };

      Object.keys(newMap).forEach((id) => {
        if (!uploads.find((u) => String(u.id) === String(id)) && newMap[id].progress < 100) {
          delete newMap[id];
        }
      });

      uploads.forEach((upload) => {
        newMap[upload.id] = {
          sizeInBytes: upload.sizeInBytes || 0,
          progress: upload.progress || 0,
          paused: upload.paused,
          fileName: upload.fileName,
          id: upload.id,
          operation: upload.operation || resolveTransferOperation(upload),
          isFolder: Boolean(upload.isFolder),
        };
      });

      return newMap;
    });
  }, [uploads]);

  const uploadArray = Object.values(uploadsMap);
  const overallProgress = computeOverallProgress(uploadArray);
  const showEta = isUploadOnlyBatch(uploadArray);

  let batchKind = "other";
  if (uploadArray.length) {
    if (uploadArray.every((u) => resolveTransferOperation(u) === MOVE_OPERATION)) {
      batchKind = MOVE_OPERATION;
    } else if (isUploadOnlyBatch(uploadArray)) {
      batchKind = UPLOAD_OPERATION;
    }
  }

  const headerVerb =
    batchKind === MOVE_OPERATION
      ? "Moving"
      : batchKind === UPLOAD_OPERATION
        ? "Uploading"
        : "Working on";

  useEffect(() => {
    if (!showEta || uploadArray.length === 0) {
      setEtaLabel(null);
      return undefined;
    }

    if (!batchStartedAtRef.current) {
      batchStartedAtRef.current = Date.now();
    }

    const tick = () => {
      const allPaused =
        uploadArray.length > 0 &&
        uploadArray.some((u) => u.paused && Math.round(u.progress) < 100);

      const elapsedMs = Date.now() - (batchStartedAtRef.current || Date.now());
      const progress = computeOverallProgress(uploadArray);
      setEtaLabel(
        buildSoftEtaLabel({
          overallProgress: progress,
          elapsedMs,
          isPaused: allPaused,
        })
      );
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [showEta, uploadArray, overallProgress]);

  useEffect(() => {
    const hasUploads = Object.keys(uploadsMap).length > 0;
    // Keep modal open if any upload is still active in context
    const stillInFlight = uploads.some(
      (u) => Math.round(Number(u.progress) || 0) < 100
    );
    if (hasUploads && overallProgress >= 100 && !stillInFlight) {
      const timeout = setTimeout(() => {
        setUploadsMap({});
        batchStartedAtRef.current = null;
        setEtaLabel(null);
        initialUploadsCountRef.current = 0;
      }, 400);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [overallProgress, uploadsMap, uploads]);

  if (Object.keys(uploadsMap).length === 0) return null;

  const completedCount = uploadArray.filter((u) => Math.round(u.progress) >= 100).length;
  const percentShown = Math.min(100, Math.max(0, overallProgress));
  const incompleteUploads = uploadArray.filter((u) => Math.round(u.progress) < 100);
  const hasIncomplete = incompleteUploads.length > 0;
  // Pause-all only pauses the active file; header follows that one item
  const batchPaused =
    hasIncomplete && incompleteUploads.some((u) => u.paused);
  const canPauseBatch = batchKind === UPLOAD_OPERATION;

  const handlePauseOrResumeAll = () => {
    if (batchPaused) {
      resumeAllUploads();
    } else {
      pauseAllUploads();
    }
  };

  const handleCancelAll = () => {
    // Clear local UI immediately so modal doesn't flicker per-file
    setUploadsMap({});
    batchStartedAtRef.current = null;
    setEtaLabel(null);
    initialUploadsCountRef.current = 0;
    abortAllUploads();
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
          <span className="tp-mini-label">{headerVerb}</span>
          <span className="tp-mini-pct">{percentShown.toFixed(0)}%</span>
          <span className="tp-mini-expand" aria-hidden="true">
            ▢
          </span>
        </button>
      ) : (
        <div className="tp-panel">
          <div className="tp-header">
            <div className="tp-window-controls">
              {hasIncomplete && isPremium && canPauseBatch && (
                <button
                  type="button"
                  className="tp-window-btn tp-window-btn--pause"
                  onClick={handlePauseOrResumeAll}
                  title={batchPaused ? "Resume upload" : "Pause upload"}
                  aria-label={batchPaused ? "Resume upload" : "Pause upload"}
                >
                  {batchPaused ? <FaPlay /> : <FaPause />}
                </button>
              )}
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
                <h5 className="tp-title">{headerVerb}</h5>
                <p className="tp-subtitle">
                  {completedCount} of {uploadArray.length}{" "}
                  {uploadArray.length === 1 ? "file" : "files"} done
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
              {uploadArray.map((upload) => {
                const isActuallyPaused = upload.paused;
                const isCompleted = Math.round(upload.progress) >= 100;
                const itemPct = Math.min(100, Math.max(0, upload.progress || 0));
                const displayName = getTransferDisplayName(upload.fileName);
                const iconSrc = resolveFileIconPath({
                  fileName: displayName,
                  isFolder: Boolean(upload.isFolder),
                });

                return (
                  <div key={upload.id} className="tp-item">
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
                            {isActuallyPaused && !isCompleted && (
                              <span className="tp-paused">(Paused)</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {!isCompleted && (
                        <div className="tp-item-actions">
                          {isPremium &&
                            (upload.paused || Math.round(upload.progress) > 0) && (
                            <button
                              type="button"
                              className="pause-play-btn"
                              onClick={() => {
                                if (upload.paused) resumeUpload(upload.id);
                                else pauseUpload(upload.id);
                              }}
                              title={upload.paused ? "Resume upload" : "Pause upload"}
                              aria-label={upload.paused ? "Resume upload" : "Pause upload"}
                            >
                              {upload.paused ? <FaPlay /> : <FaPause />}
                            </button>
                          )}
                          <button
                            type="button"
                            className="tp-item-cancel-btn"
                            onClick={() => abortUpload(upload.id)}
                            title="Cancel upload"
                            aria-label="Cancel upload"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="tp-item-bar-wrap">
                      <div className="tp-item-bar" style={{ width: `${itemPct}%` }} />
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

export default UploadProgressModal;
