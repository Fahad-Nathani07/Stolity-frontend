import React from "react";
import folderLogo from "../images/folderLogo.png";
import noFolderLogo from "../images/sad.png";
import FolderPickerSkeleton from "./FolderPickerSkeleton";
import "./FolderPickerSkeleton.css";
import "./FolderPickerListPanel.css";

/**
 * Folder list area for Move/Copy destination pickers.
 */
const FolderPickerListPanel = ({
  loading,
  folders,
  counter,
  getTextAfterSlashes,
  onOpenFolder,
}) => (
  <div className="fps-list-panel" aria-busy={loading}>
    {loading ? (
      <>
        <p className="fps-loading-hint">Loading folders…</p>
        <FolderPickerSkeleton count={6} />
      </>
    ) : folders.length === 0 ? (
      <div className="fps-empty-state">
        <img src={noFolderLogo} alt="" />
        <p>No subfolders here</p>
      </div>
    ) : (
      folders.map((item, index) => (
        <div
          key={`${item.fileName}-${index}`}
          onClick={() => {
            if (loading) return;
            onOpenFolder(item.fileName);
          }}
          style={{
            padding: "12px 14px",
            margin: "4px 0",
            borderRadius: "6px",
            cursor: loading ? "not-allowed" : "pointer",
            backgroundColor: "white",
            border: "1px solid #e0e0e0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            transition: "all 0.2s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <img
              src={folderLogo}
              height="22"
              width="22"
              alt=""
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

          <span style={{ color: "#999", fontSize: "16px" }} aria-hidden="true">
            ›
          </span>
        </div>
      ))
    )}
  </div>
);

export default FolderPickerListPanel;
