import React from "react";
import folderLogo from "../images/folderLogo.png";
import noFolderLogo from "../images/sad.png";
import FolderPickerSkeleton from "./FolderPickerSkeleton";
import "./FolderPickerSkeleton.css";
import "./FolderPickerListPanel.css";
import { normalizeFolderPath } from "../utils/movePath";

/**
 * Folder list area for Move/Copy destination pickers.
 * @param {string[]} [disabledFolderPaths] — From folders (being moved/copied) stay unclickable
 */
const FolderPickerListPanel = ({
  loading,
  folders,
  counter,
  getTextAfterSlashes,
  onOpenFolder,
  disabledFolderPaths = [],
}) => {
  const disabledSet = new Set(
    (disabledFolderPaths || []).map((p) => normalizeFolderPath(p))
  );

  const isDisabledPath = (fileName) => {
    const p = normalizeFolderPath(fileName);
    for (const locked of disabledSet) {
      if (!locked) continue;
      // Block the From folder itself and anything nested under it
      if (p === locked || p.startsWith(`${locked}/`)) return true;
    }
    return false;
  };

  return (
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
      folders.map((item, index) => {
        const disabled = !loading && isDisabledPath(item.fileName);
        return (
        <div
          key={`${item.fileName}-${index}`}
          onClick={() => {
            if (loading || disabled) return;
            onOpenFolder(item.fileName);
          }}
          title={
            disabled
              ? "This folder is part of the move/copy and cannot be opened"
              : undefined
          }
          aria-disabled={disabled}
          style={{
            padding: "12px 14px",
            margin: "4px 0",
            borderRadius: "6px",
            cursor: loading || disabled ? "not-allowed" : "pointer",
            backgroundColor: disabled ? "#f3f4f6" : "white",
            border: "1px solid #e0e0e0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            transition: "all 0.2s ease",
            opacity: disabled ? 0.55 : 1,
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
                color: disabled ? "#9ca3af" : "#333",
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
        );
      })
    )}
  </div>
  );
};

export default FolderPickerListPanel;
