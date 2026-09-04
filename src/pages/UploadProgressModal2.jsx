import React, { useContext, useState } from "react";
import { UploadContext } from "./UploadContext";
import "../css/UploadProgressModal.css";
import { FaPause, FaPlay } from "react-icons/fa";

const UploadProgressModal = () => {
  const { uploads, abortUpload, pauseUpload, resumeUpload, isPausing } = useContext(UploadContext);
  const [showAll, setShowAll] = useState(false);

  if (!uploads || uploads.length === 0) return null;

  const toggleUploads = () => setShowAll((prev) => !prev);

  return (
    <div className="upload-modal-container">
      {uploads.length > 1 && (
        <div className="upload-header">
          <h5>Uploading {uploads.length} files</h5>
          <button className="toggle-btn" onClick={toggleUploads}>
            {showAll ? "Hide" : "Show All"}
          </button>
        </div>
      )}

      {uploads.map((upload, index) => {
        const pausingNow = typeof isPausing === "function" && isPausing(upload.id);
        const isActuallyPaused = upload.paused || pausingNow;

        return (
          <div
            key={upload.id}
            className={`upload-item ${showAll || index === 0 ? "show" : "hidden"}`}
          >
            <div className="upload-row">
              <div className="upload-info">
                {/* spinner pauses when upload.paused or pausing intent active */}
                <div
                  className={`upload-spinner ${isActuallyPaused ? "paused" : ""}`}
                />
                <div>
                  <div className="file-name" style={{ maxWidth: "275px" }}>
                    {upload.fileName}
                  </div>
                  <div className="progress-text">
                    <p
                      style={{
                        fontSize: "13px",
                        whiteSpace: "nowrap",
                        margin: 0,
                      }}
                    >
                      <span style={{ color: "black", fontWeight: "bold" }}>
                        {Math.round(upload.progress || 0)}
                      </span>
                      % Complete
                      {isActuallyPaused && (
                        <span
                          style={{
                            marginLeft: 8,
                            color: "#ff9900",
                            fontWeight: 600,
                          }}
                        >
                          (Paused)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <button
                  className="pause-play-btn"
                  onClick={() => {
                    if (upload.paused) {
                      resumeUpload(upload.id);
                    } else {
                      pauseUpload(upload.id);
                    }
                  }}
                  title={upload.paused ? "Resume upload" : "Pause upload"}
                  aria-label={upload.paused ? "Resume upload" : "Pause upload"}
                >
                  {upload.paused ? <FaPlay /> : <FaPause />}
                </button>

                <button
                  className="cancel-btn"
                  onClick={() => abortUpload(upload.id)}
                  title="Cancel upload"
                  aria-label="Cancel upload"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="progress-bar-container">
              <div
                className="progress-bar"
                style={{
                  width: `${Math.min(Math.max(upload.progress || 0, 0), 100)}%`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default UploadProgressModal;
