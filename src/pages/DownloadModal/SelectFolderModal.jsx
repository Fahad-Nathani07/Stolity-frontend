import React, { useState, useEffect } from "react";
import { ChakraProvider, useToast } from "@chakra-ui/react";
import folderLogo from "../../images/folderLogo.png";
import noFolderLogo from "../../images/sad.png";
import { useSelector } from "react-redux";
import axios from "axios";
import {
  buildGetFolderParams,
  parseFolderListingItems,
  shouldUseGetFolderForListing,
} from "../../utils/getFolderParams";
import "../../css/FolderDestModalViewport.css";
// import { FaCheckCircle, BsXCircleFill, IoIosInformationCircle, FaExclamationTriangle } from "react-icons/fa";

import { FaCheckCircle } from "react-icons/fa"; //<FaCheckCircle />
import { BsXCircleFill } from "react-icons/bs"; // <BsXCircleFill />
import { IoIosInformationCircle } from "react-icons/io"; // <IoIosInformationCircle />
import { FaExclamationTriangle } from "react-icons/fa"; // <FaExclamationTriangle />


function SelectFolderModal({ onClose, onSelect, selectedFile, currentPath, fileName }) {
  const apiUrl = process.env.REACT_APP_API_ENDPOINT;
  const token = sessionStorage.getItem("number");
  const [folders1, setFolders1] = useState([]);
  const [locationPath, setLocationPath] = useState("");
  const [selectedPath, setSelectedPath] = useState("");
  const [counter, setCounter] = useState(0);
  const toast = useToast();
  const isSharedValue = useSelector((state) => state.getdata.isSharedValue);
  const filenameRedux = useSelector((state) => state.getdata.fileName);
  const isRoot = counter === 0 && locationPath === "" && selectedPath === "";

  useEffect(() => {
    fetchFolders("");
  }, []);
  
  
  useEffect(() => {
    console.log("selectedFile: ",selectedFile)
  }, []);


  const fetchFolders = async (folderPath = "") => {
    try {
      const cleanPath = String(folderPath || "").replace(/\/+$/, "");
      const useGetFolder = shouldUseGetFolderForListing({
        isShared: isSharedValue,
        folderPath: cleanPath,
      });

      const res = await axios.get(
        useGetFolder ? `${apiUrl}getFolder` : `${apiUrl}getAllObjectsNew`,
        {
          params: useGetFolder
            ? buildGetFolderParams({
                folderPath: cleanPath,
                isShared: isSharedValue,
                sharedRoot: filenameRedux,
              })
            : { limit: 1000 },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setFolders1(parseFolderListingItems(res.data));
    } catch (error) {
      console.error("Error fetching folders:", error);
      setFolders1([]);
    }
  };

  function getTextAfterSlashes(text, counter) {
    const parts = text.split("/");
    if (counter >= parts.length) {
      return parts[parts.length - 1];
    }
    return parts.slice(counter).join("/");
  }

  const handleItemClick = async (path) => {
    try {
      const params = buildGetFolderParams({
        folderPath: path,
        isShared: isSharedValue,
        sharedRoot: filenameRedux,
      });

      const res = await axios.get(`${apiUrl}getFolder`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });

      const folders = parseFolderListingItems(res.data);
      
      setLocationPath((prev) => {
        if (prev) {
          return `${prev} / ${getTextAfterSlashes(path, counter)}`;
        } else {
          return getTextAfterSlashes(path, counter);
        }
      });
      setFolders1(folders);
      setSelectedPath(path);
      setCounter(counter + 1);
    } catch (error) {
      console.error("Error fetching folder data:", error);
    }
  };

  const handleBack = () => {
    const parentPath = locationPath.substring(0, locationPath.lastIndexOf(" / "));
    setLocationPath(parentPath);
    fetchFolders(parentPath);
    setCounter(Math.max(0, counter - 1));
  };

  // Premium Toast (same as CopyFilePopup)
  const iconMap = {
    success: FaCheckCircle,
    error: BsXCircleFill,
    info: IoIosInformationCircle,
    warning: FaExclamationTriangle,
  };

  const getStatusColors = (status) => {
    return {
      bg: 'rgba(255, 255, 255, 0.85)',
      border: status === 'success' ? 'rgba(16, 185, 129, 0.3)' :
              status === 'error' ? 'rgba(239, 68, 68, 0.3)' :
              status === 'info' ? 'rgba(59, 130, 246, 0.3)' :
              'rgba(245, 158, 11, 0.3)',
      icon: status === 'success' ? '#10b981' :
            status === 'error' ? '#ef4444' :
            status === 'info' ? '#3b82f6' :
            '#f59e0b'
    };
  };

  const showToast = (status, message) => {
    const IconComponent = iconMap[status];
    const colors = getStatusColors(status);
    
    toast({
      position: 'bottom-right',
      duration: 4000,
      isClosable: true,
      render: () => (
        <div className="premium-toast" style={{
          background: `linear-gradient(135deg, ${colors.bg}, rgba(255,255,255,0.9))`,
          backdropFilter: 'blur(20px)',
          border: `2px solid ${colors.border}`,
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.05)',
          padding: '20px',
          maxWidth: '720px',
          fontFamily: "'SF Pro', 'SFProText', -apple-system, BlinkMacSystemFont, sans-serif",
          animation: 'toastSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <IconComponent 
              style={{ 
                width: '24px', 
                height: '24px', 
                color: colors.icon,
                flexShrink: 0,
                marginTop: '2px'
              }} 
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '4px',
                lineHeight: '1.3'
              }}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </div>
              <div style={{
                fontSize: '14px',
                color: '#6b7280',
                lineHeight: '1.4'
              }}>
                {message}
              </div>
            </div>
            <button 
              style={{
                background: 'none',
                border: 'none',
                padding: '4px',
                cursor: 'pointer',
                color: '#9ca3af',
                borderRadius: '4px',
                opacity: 0.7,
                transition: 'all 0.2s'
              }}
              onClick={() => toast.closeAll()}
              onMouseEnter={(e) => e.target.style.opacity = 1}
              onMouseLeave={(e) => e.target.style.opacity = 0.7}
            >
              ✕
            </button>
          </div>
        </div>
      ),
    });
  };

  const handleClose = () => {
    onClose();
  };

  const handleConfirm = () => {
  const targetPath = selectedPath === "" ? "" : selectedPath; // "" means Root

  onSelect(targetPath);
  showToast(
    "success",
    `Folder selected for unzip: ${
      targetPath ? getTextAfterSlashes(targetPath, 0) : "Root Folder"
    }`
  );
  onClose();
};


  return (
    <>
      <ChakraProvider></ChakraProvider>
      <div
        className="modal fade show rb-folder-dest-overlay"
        style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
        onClick={handleClose}
      >
        <div
          className="modal-dialog modal-dialog-centered"
          onClick={(e) => e.stopPropagation()}
          style={{ maxWidth: "550px" }}
        >
          <div className="modal-content" style={{ borderRadius: "12px" }}>
            <div className="modal-header" style={{ borderBottom: "1px solid #e0e0e0", padding: "16px 24px" }}>
              {/* <h5 className="modal-title" style={{ fontWeight: 600, fontSize: "18px" }}>
                Unzip File To
              </h5> */}
              <h5 className="modal-title" style={{ fontWeight: 600, fontSize: "18px" }}>
              {/* {selectedFile?.fileType === "zip" ? "Unzip File To" : "Zip File To"} */}
              {selectedFile?.fileType === "zip" ? "Unzip File To" :
                selectedFile?.fileType == null   ? "Download here" :
                                                    "Zip File To"}
            </h5>
              <button
                type="button"
                className="close"
                onClick={handleClose}
                style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer" }}
              >
                <span>&times;</span>
              </button>
            </div>

            <div className="modal-body" style={{ padding: "20px 24px" }}>
              {/* <p style={{ marginBottom: "16px", color: "#666", fontSize: "14px" }}>
                Select a folder to {selectedFile?.fileType === "zip" ? "unzip" : "zip"} <strong>{selectedFile?.fileName}</strong> {selectedFile?.fileType === "zip" ? "to" : "into"}:
              </p> */}
              <p style={{ marginBottom: "16px", color: "#666", fontSize: "14px" }}>
                Select a folder to {selectedFile === undefined
  ? "download"
  : selectedFile.fileType === "zip"
    ? "unzip"
    : "zip"} <strong>{selectedFile?.fileName}</strong> {selectedFile?.fileType === "zip" ? "to" : "into"}:
              </p>

              {/* Breadcrumb Navigation */}
              <div style={{ 
                marginBottom: "12px", 
                padding: "10px 12px", 
                backgroundColor: "#f8f9fa", 
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "13px"
              }}>
                <span 
                  style={{ 
                    cursor: "pointer", 
                    color: counter === 0 ? "#FFAB49" : "#666",
                    fontWeight: counter === 0 ? 600 : 400
                  }}
                  onClick={() => {
                    setLocationPath("");
                    setSelectedPath("");
                    setCounter(0);
                    fetchFolders("");
                  }}
                >
                  Root
                </span>
                {locationPath.split(" / ").map((folder, index) => (
                  <span key={index} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ color: "#999" }}>/</span>
                    <span
                      style={{
                        cursor: "pointer",
                        color: index === locationPath.split(" / ").length - 1 ? "#FFAB49" : "#666",
                        fontWeight: index === locationPath.split(" / ").length - 1 ? 600 : 400
                      }}
                      onClick={() => {
                        const newPath = locationPath.split(" / ").slice(0, index + 1).join(" / ");
                        setLocationPath(newPath);
                      }}
                    >
                      {folder}
                    </span>
                  </span>
                ))}
              </div>

              {/* Back Button */}
              {counter > 0 && (
                <button
                  onClick={handleBack}
                  style={{
                    marginBottom: "12px",
                    padding: "8px 12px",
                    backgroundColor: "white",
                    border: "1px solid #e0e0e0",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "13px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    color: "#666"
                  }}
                >
                  <span>←</span> Back
                </button>
              )}

              {/* Folder List */}
              <div className="rb-folder-list">
                {folders1.length === 0 ? (
                  <p style={{ textAlign: "center", padding: "20px", color: "#999" }}>
                    No subfolders found
                  </p>
                ) : (
                  folders1.map((item, index) => (
                    <div
                      key={index}
                      onClick={() => handleItemClick(item.fileName)}
                      style={{
                        padding: "12px 14px",
                        margin: "4px 0",
                        borderRadius: "6px",
                        cursor: "pointer",
                        backgroundColor: selectedPath === item.fileName ? "#f0f8ff" : "white",
                        border: selectedPath === item.fileName ? "2px solid #FFAB49" : "1px solid #e0e0e0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (selectedPath !== item.fileName) {
                          e.currentTarget.style.backgroundColor = "#f5f5f5";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedPath !== item.fileName) {
                          e.currentTarget.style.backgroundColor = "white";
                        }
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <img
                          src={folderLogo}
                          height="22"
                          width="22"
                          alt="folder"
                          style={{ flexShrink: 0 }}
                        />
                        <span
                          style={{
                            color: "#333",
                            fontSize: "14px",
                            wordBreak: "break-word",
                          }}
                        >
                          {getTextAfterSlashes(item.fileName, counter)}
                        </span>
                      </div>
                      <span style={{ color: "#999", fontSize: "16px" }}>›</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="modal-footer" style={{ borderTop: "1px solid #e0e0e0", padding: "16px 24px", gap: "10px" }}>
              <button
                type="button"
                className="btn"
                onClick={handleClose}
                style={{
                  backgroundColor: "white",
                  color: "#666",
                  border: "1px solid #e0e0e0",
                  padding: "8px 20px",
                  borderRadius: "6px",
                  fontWeight: 500,
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn"
                style={{
                  backgroundColor: (selectedPath || isRoot) ? "#FFAB49" : "#f5f5f5",
                  color: (selectedPath || isRoot) ? "white" : "#999",
                  border: "none",
                  padding: "8px 24px",
                  borderRadius: "6px",
                  fontWeight: 500,
                  cursor: (selectedPath || isRoot) ? "pointer" : "not-allowed",
                }}
                onClick={handleConfirm}
                disabled={!(selectedPath || isRoot)}
              >
                {/* {selectedFile?.fileType === "zip" ? "Unzip Here" : "Zip Here"} */}
                {selectedFile == null
                  ? "Download Here"
                  : selectedFile.fileType === "zip"
                    ? "Unzip Here"
                    : "Zip Here"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default SelectFolderModal;
