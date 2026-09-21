import React, { useCallback, useEffect, useState } from "react";
import SelectFolderModal from "./SelectFolderModal";
import "./DownloadModal.css";
import { useSelector } from "react-redux";
import axios from "axios";
import { FiFolder, FiLink, FiRefreshCw, FiX } from "react-icons/fi";
import { showToast } from "../../components/ToastProvider";

const DownloadModal = ({
  isOpen,
  onClose,
  path,
  reloadAfterTast,
}) => {
  const [url, setUrl] = useState("");
  const token = sessionStorage.getItem("number");
  const [fileName, setFileName] = useState("");
  const [accessLevel, setAccessLevel] = useState("public");
  const [isLoading, setIsLoading] = useState(false);
  const [isFilenameEdited, setIsFilenameEdited] = useState(false);
  const [downloadPath, setDownloadPath] = useState(null);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const isSharedValue = useSelector((state) => state.getdata.isSharedValue);
  const filenameRedux = useSelector((state) => state.getdata.fileName);

  const apiUrl = process.env.REACT_APP_API_ENDPOINT;

  const resetForm = useCallback(() => {
    setUrl("");
    setFileName("");
    setAccessLevel("public");
    setIsFilenameEdited(false);
    setDownloadPath(null);
    setDownloadProgress(0);
    setIsLoading(false);
    setIsFolderModalOpen(false);
  }, []);

  // Always clear fields when the modal is closed (any close path)
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  useEffect(() => {
    if (!isOpen || !url || isFilenameEdited) return;
    extractFilenameFromUrl(url);
  }, [url, isFilenameEdited, isOpen]);

  const stripFileExtension = (name) => {
    const lastDot = name.lastIndexOf(".");
    if (lastDot <= 0 || lastDot === name.length - 1) return name;
    const ext = name.slice(lastDot + 1);
    // Only strip when it looks like a normal file extension (e.g. jpg, png, webp)
    if (!/^[a-zA-Z0-9]{1,8}$/.test(ext)) return name;
    return name.slice(0, lastDot);
  };

  const extractFilenameFromUrl = (urlString) => {
    try {
      if (!urlString || !urlString.includes("/")) return;

      const urlObj = new URL(urlString);
      const pathParts = urlObj.pathname.split("/");
      let extractedName = pathParts[pathParts.length - 1];

      if (extractedName.includes("?")) extractedName = extractedName.split("?")[0];
      if (extractedName.includes("#")) extractedName = extractedName.split("#")[0];

      if (extractedName && extractedName.trim() !== "") {
        setFileName(stripFileExtension(decodeURIComponent(extractedName)));
      }
    } catch (e) {
      try {
        const parts = urlString.split("/");
        let lastPart = parts[parts.length - 1];
        if (lastPart.includes("?")) lastPart = lastPart.split("?")[0];
        if (lastPart.includes("#")) lastPart = lastPart.split("#")[0];
        if (lastPart && lastPart.trim() !== "") {
          setFileName(stripFileExtension(decodeURIComponent(lastPart)));
        }
      } catch (fallbackError) {
        console.log("Fallback extraction also failed:", fallbackError);
      }
    }
  };

  const handleUrlChange = (e) => setUrl(e.target.value);
  const handleFileNameChange = (e) => {
    setFileName(e.target.value);
    setIsFilenameEdited(true);
  };
  const handleAccessLevelChange = (value) => setAccessLevel(value);
  const handleResetFilename = () => {
    extractFilenameFromUrl(url);
    setIsFilenameEdited(false);
  };

  const openFolderModal = () => setIsFolderModalOpen(true);
  const closeFolderModal = () => setIsFolderModalOpen(false);
  const handleFolderSelect = (selected) => {
    setDownloadPath(selected);
    closeFolderModal();
  };

  const resolveFolderPath = () => {
    const chosen = downloadPath !== null ? downloadPath : path;
    if (chosen == null || chosen === "") return "";
    return String(chosen).replace(/^\/+|\/+$/g, "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    setDownloadProgress(0);

    const isPrivate = accessLevel === "public" ? "public-read" : "private";

    const requestBody = {
      folderPath: resolveFolderPath(),
      isPrivate,
      name: fileName || "downloaded_file",
      url,
    };

    let apiUrl1 = `${apiUrl}download-file-bucket`;
    if (isSharedValue && filenameRedux) {
      apiUrl1 += `?shared=${encodeURIComponent(filenameRedux)}`;
    }

    const progressInterval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + 10;
      });
    }, 1000);

    try {
      await axios.post(apiUrl1, requestBody, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        onUploadProgress: (progressEvent) => {
          if (!progressEvent.total) return;
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setDownloadProgress(percentCompleted);
        },
      });

      setDownloadProgress(100);

      showToast("success", "File download started successfully!");

      setTimeout(() => {
        reloadAfterTast?.();
        onClose();
      }, 800);
    } catch (error) {
      console.error("Error downloading file:", error);
      const apiMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.response?.data?.details;
      showToast(
        "error",
        apiMessage || "Download request failed. Please try again.",
        apiMessage ? "Download blocked" : "Download failed"
      );
    } finally {
      clearInterval(progressInterval);
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (isLoading) return;
    onClose();
  };

  const handleInputEnter = (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    e.stopPropagation();
    if (isLoading) return;
    e.currentTarget.form?.requestSubmit();
  };

  if (!isOpen) return null;

  const locationLabel =
    resolveFolderPath() || "Current folder";

  return (
    <div
      className="download-modal-overlay"
      onClick={() => {
        if (!isFolderModalOpen) handleClose();
      }}
      role="presentation"
    >
      <div
        className="download-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="download-modal-title"
      >
        <div className="download-modal-card">
          <header className="download-modal-header">
            <div className="download-modal-header-main">
              <div className="download-modal-icon-wrap">
                <FiLink aria-hidden="true" />
              </div>
              <div className="download-modal-header-text">
                <h2 id="download-modal-title" className="download-modal-title">
                  Download from URL
                </h2>
                <p className="download-modal-subtitle">
                  Import a file into Stolity from any public link.
                </p>
              </div>
            </div>
            <button
              type="button"
              className="download-modal-close-btn"
              onClick={handleClose}
              aria-label="Close"
              disabled={isLoading}
            >
              <FiX />
            </button>
          </header>

          <form
            className="download-modal-body"
            onSubmit={handleSubmit}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.stopPropagation();
            }}
          >
            <div className="download-form-group">
              <label className="download-field-label" htmlFor="download-url">
                File URL
              </label>
              <div className="download-input-row">
                <input
                  type="url"
                  id="download-url"
                  value={url}
                  onChange={handleUrlChange}
                  onKeyDown={handleInputEnter}
                  placeholder="https://example.com/file.pdf"
                  required
                  className="download-input"
                  autoFocus
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="download-form-group">
              <div className="download-field-label-row">
                <label className="download-field-label" htmlFor="download-filename">
                  File name
                </label>
                {isFilenameEdited && url ? (
                  <button
                    type="button"
                    className="download-reset-name"
                    onClick={handleResetFilename}
                    disabled={isLoading}
                  >
                    <FiRefreshCw size={12} />
                    From URL
                  </button>
                ) : null}
              </div>
              <div className="download-input-row">
                <input
                  type="text"
                  id="download-filename"
                  value={fileName}
                  onChange={handleFileNameChange}
                  onKeyDown={handleInputEnter}
                  placeholder="Name will be extracted from URL"
                  className="download-input"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="download-form-group">
              <span className="download-field-label">Save location</span>
              <button
                type="button"
                className="download-location-display"
                onClick={openFolderModal}
                disabled={isLoading}
              >
                <span className="download-location-icon" aria-hidden>
                  <FiFolder />
                </span>
                <span className="download-location-name" title={locationLabel}>
                  {locationLabel}
                </span>
                <span className="download-location-change">Change</span>
              </button>
            </div>

            <div className="download-form-group">
              <span className="download-field-label">Access level</span>
              <div
                className={`download-access-toggle${
                  accessLevel === "private" ? " is-private" : " is-public"
                }`}
                role="radiogroup"
                aria-label="Access level"
              >
                <span className="download-access-thumb" aria-hidden="true" />
                <button
                  type="button"
                  role="radio"
                  aria-checked={accessLevel === "public"}
                  className={`download-access-option${
                    accessLevel === "public" ? " is-active" : ""
                  }`}
                  onClick={() => handleAccessLevelChange("public")}
                  disabled={isLoading}
                >
                  Public
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={accessLevel === "private"}
                  className={`download-access-option${
                    accessLevel === "private" ? " is-active" : ""
                  }`}
                  onClick={() => handleAccessLevelChange("private")}
                  disabled={isLoading}
                >
                  Private
                </button>
              </div>
            </div>

            <footer className="download-modal-footer">
              <button
                type="button"
                onClick={handleClose}
                className="download-modal-btn download-modal-btn--ghost"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="download-modal-btn download-modal-btn--primary"
                disabled={isLoading || !url.trim()}
              >
                {isLoading ? (
                  <>
                    <span className="download-progress-text">
                      Downloading… {downloadProgress}%
                    </span>
                    <span
                      className="download-progress-bar"
                      style={{ width: `${downloadProgress}%` }}
                    />
                  </>
                ) : (
                  "Download"
                )}
              </button>
            </footer>
          </form>
        </div>
      </div>

      {isFolderModalOpen && (
        <SelectFolderModal
          onClose={closeFolderModal}
          onSelect={handleFolderSelect}
          fileName={fileName || "downloaded_file"}
        />
      )}
    </div>
  );
};

export default DownloadModal;
