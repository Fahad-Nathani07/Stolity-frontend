import React, { useState, useEffect } from "react";
import SelectFolderModal from "./SelectFolderModal";
import "./DownloadModal.css";
import { useSelector } from "react-redux";
import axios from "axios";
import { ChakraProvider, Stack, useToast } from "@chakra-ui/react";

const DownloadModal = ({ isOpen, onClose, onDownload, path, reloadAfterTast }) => {
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
  const t = useSelector((state) => state.getdata.folderName);
  // console.log("folderName from download modal:", path);
    
  const apiUrl = process.env.REACT_APP_API_ENDPOINT;
  const toast = useToast();

  useEffect(() => {
    if (url && !isFilenameEdited) {
      extractFilenameFromUrl(url);
    }
  }, [url, isFilenameEdited]);
  
  const extractFilenameFromUrl = (urlString) => {
    try {
      // Check if the URL string is not empty and has some minimal structure
      if (!urlString || !urlString.includes('/')) {
        return;
      }
  
      // Try to create a URL object
      const urlObj = new URL(urlString);
      const pathParts = urlObj.pathname.split('/');
      
      // Get the last part of the path
      let extractedName = pathParts[pathParts.length - 1];
  
      // Clean up the extracted name
      if (extractedName.includes('?')) extractedName = extractedName.split('?')[0];
      if (extractedName.includes('#')) extractedName = extractedName.split('#')[0];
  
      // If we have a name after all the processing, use it
      if (extractedName && extractedName.trim() !== '') {
        setFileName(extractedName);
      }
    } catch (e) {
      console.log("Couldn't parse URL for filename:", e);
      
      // Fallback extraction for invalid URLs but with recognizable patterns
      try {
        const parts = urlString.split('/');
        let lastPart = parts[parts.length - 1];
        
        if (lastPart.includes('?')) lastPart = lastPart.split('?')[0];
        if (lastPart.includes('#')) lastPart = lastPart.split('#')[0];
        
        if (lastPart && lastPart.trim() !== '') {
          setFileName(lastPart);
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
  const handleAccessLevelChange = (e) => setAccessLevel(e.target.value);
  const handleResetFilename = () => {
    extractFilenameFromUrl(url);
    setIsFilenameEdited(false);
  };

  const openFolderModal = () => setIsFolderModalOpen(true);
  const closeFolderModal = () => setIsFolderModalOpen(false);
  const handleFolderSelect = (path) => {
    setDownloadPath(path);
    closeFolderModal();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    setIsLoading(true);
    setDownloadProgress(0);
  
    const isPrivate = accessLevel === "public" ? "public-read" : "private";
  
    const requestBody = {
      folderPath: downloadPath !== null ? downloadPath : "",
      isPrivate,
      name: fileName || "downloaded_file",
      url,
    };
  
    // Construct API URL with shared parameter if isSharedValue is true
    let apiUrl1 = `${apiUrl}download-file-bucket`;
  
    if (isSharedValue && filenameRedux) {
      apiUrl1 += `?shared=${encodeURIComponent(filenameRedux)}`;
    }
  
    // Create a progress interval for UI feedback
    const progressInterval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + 10;
      });
    }, 1000);
  
    try {
      const response = await axios.post(apiUrl1, requestBody, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setDownloadProgress(percentCompleted);
        },
      });
  
      console.log("Download API Response:", response.data);
      setDownloadProgress(100);
  
      toast({
        title: "Success",
        description: "File download started successfully!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
  
      // Close modal after a short delay
      setTimeout(() => {
        reloadAfterTast()
        onClose();
        setUrl("");
        setFileName("");
        setDownloadPath(null);
        setDownloadProgress(0);
        

      }, 1500);
    } catch (error) {
      console.error("Error downloading file:", error);
      toast({
        title: "Error",
        description: "Download request failed. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
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

  return (
    <div
      className="download-modal-overlay"
      onClick={() => {
        if (!isFolderModalOpen) handleClose();
      }}
      role="presentation"
    >
      <div
        className="download-modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Download File From URL"
      >
        <h2>Download File From URL</h2>

        <form
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            // Prevent Enter from bubbling to parent handlers
            if (e.key === "Enter") e.stopPropagation();
          }}
        >
          <div className="download-form-group">
            <label htmlFor="download-url">File URL:</label>
            <input
              type="url"
              id="download-url"
              value={url}
              onChange={handleUrlChange}
              onKeyDown={handleInputEnter}
              placeholder="https://example.com"
              required
              className="download-input"
              autoFocus
            />
          </div>

          <div className="download-form-group">
            <label htmlFor="download-filename">File Name :</label>
            <input
              type="text"
              id="download-filename"
              value={fileName}
              onChange={handleFileNameChange}
              onKeyDown={handleInputEnter}
              placeholder="Enter Name will be extracted from URL"
              className="download-input"
            />
          </div>

          <div className="download-form-group">
            <label>Download Location :</label>
            {/* Make the entire location display clickable to open folder modal */}
            <div 
              className="download-location-display"
              onClick={openFolderModal}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openFolderModal();
                }
              }}
              role="button"
              tabIndex={0}
            >
              <span className="folder-icon">📁</span>
              <span className="folder-name">{downloadPath || "File Name"}</span>
            </div>
          </div>

          <div className="download-form-group">
            <label>Access Level :</label>
            <div className="download-radio-options">
              <div className="download-radio-item">
                <input
                  type="radio"
                  name="access"
                  id="public-access"
                  value="public"
                  onChange={handleAccessLevelChange}
                  checked={accessLevel === "public"}
                  className="download-radio-input"
                />
                <label htmlFor="public-access" className="download-radio-label">Public</label>
              </div>
              
              <div className="download-radio-item">
                <input
                  type="radio"
                  name="access"
                  id="private-access"
                  value="private"
                  onChange={handleAccessLevelChange}
                  checked={accessLevel === "private"}
                  className="download-radio-input"
                />
                <label htmlFor="private-access" className="download-radio-label">Private</label>
              </div>
            </div>
          </div>

          <div className="download-modal-actions">
            <button type="button" onClick={handleClose} className="download-cancel-button">
              Close
            </button>
            <button
              type="submit"
              className="download-submit-button"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="download-progress-text">
                    Downloading... {downloadProgress}%
                  </span>
                  <div
                    className="download-progress-bar"
                    style={{ width: `${downloadProgress}%` }}
                  ></div>
                </>
              ) : (
                "Submit"
              )}
            </button>
          </div>
        </form>
      </div>

      {isFolderModalOpen && (
        <SelectFolderModal
          onClose={closeFolderModal}
          onSelect={handleFolderSelect}
          currentPath = {path}
        />
      )}
    </div>
  );
};

export default DownloadModal;