import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { showToast } from "./ToastProvider";
import "./UploadFolderPanel.css";

const PREVIEW_LIMIT = 50;

const formatBytes = (bytes) => {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let i = 0;
  while (value >= 1000 && i < units.length - 1) {
    value /= 1000;
    i += 1;
  }
  return `${value.toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
};

const readAllDirectoryEntries = (directoryEntry) =>
  new Promise((resolve, reject) => {
    const reader = directoryEntry.createReader();
    const entries = [];
    const readBatch = () => {
      reader.readEntries((batch) => {
        if (!batch.length) {
          resolve(entries);
          return;
        }
        entries.push(...batch);
        readBatch();
      }, reject);
    };
    readBatch();
  });

const entryToFile = (fileEntry) =>
  new Promise((resolve, reject) => {
    fileEntry.file(resolve, reject);
  });

const withRelativePath = (file, relativePath) => {
  try {
    Object.defineProperty(file, "webkitRelativePath", {
      value: relativePath,
      configurable: true,
    });
  } catch {
    /* ignore if non-configurable */
  }
  return file;
};

const walkEntry = async (entry, pathPrefix = "") => {
  if (!entry) return [];

  if (entry.isFile) {
    const file = await entryToFile(entry);
    const relativePath = pathPrefix
      ? `${pathPrefix}/${file.name}`
      : file.name;
    return [withRelativePath(file, relativePath)];
  }

  if (entry.isDirectory) {
    const dirPath = pathPrefix ? `${pathPrefix}/${entry.name}` : entry.name;
    const children = await readAllDirectoryEntries(entry);
    const nested = await Promise.all(
      children.map((child) => walkEntry(child, dirPath))
    );
    return nested.flat();
  }

  return [];
};

const collectFilesFromDataTransfer = async (dataTransfer) => {
  const items = Array.from(dataTransfer?.items || []);
  if (!items.length) {
    return Array.from(dataTransfer?.files || []);
  }

  const collected = [];
  for (const item of items) {
    const entry = item.webkitGetAsEntry?.();
    if (entry) {
      const files = await walkEntry(entry);
      collected.push(...files);
    } else {
      const file = item.getAsFile?.();
      if (file) collected.push(file);
    }
  }
  return collected.length ? collected : Array.from(dataTransfer?.files || []);
};

const getRelativePath = (file) => {
  const raw =
    file.webkitRelativePath ||
    file.path ||
    file.filepath ||
    file.name ||
    "";
  return String(raw).replace(/^\/+/, "");
};

const buildFolderSelection = (files) => {
  const updatedFileList = [];
  let folderName = "";

  for (const file of files) {
    const relativePath = getRelativePath(file);
    const lastSlash = relativePath.lastIndexOf("/");
    const folderPath =
      lastSlash === -1 ? "" : relativePath.substring(0, lastSlash);

    if (!folderName) {
      folderName = folderPath
        ? folderPath.split("/")[0]
        : file.name || "Selected folder";
    }

    const pathForUpload = folderPath || folderName;
    const relativeForMap =
      relativePath || `${pathForUpload}/${file.name}`;
    updatedFileList.push({
      path: pathForUpload,
      file,
      relativePath: relativeForMap,
    });
  }

  return {
    fileList: updatedFileList,
    // Ordered full relative paths — server matches by file index (multer strips paths)
    folderStructure: updatedFileList.map((item) => item.relativePath),
    folderName: folderName || "Selected folder",
  };
};

/**
 * Dedicated Upload Folder panel (browse + drag-drop) with preview.
 * Owns its own selection state so Files-tab uploads are not polluted.
 */
const UploadFolderPanel = ({
  remainingBytes = 0,
  skipStorageCheck = false,
  onCancel,
  onUpload,
  uploading = false,
}) => {
  const [selection, setSelection] = useState(null);
  const [visibility, setVisibility] = useState("private"); // UI: public | private
  const [isDragActive, setIsDragActive] = useState(false);
  const dragDepthRef = useRef(0);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const input = fileInputRef.current;
    if (!input) return;
    input.setAttribute("webkitdirectory", "");
    input.setAttribute("directory", "");
    input.setAttribute("multiple", "");
  }, []);

  const totalBytes = useMemo(() => {
    if (!selection?.fileList?.length) return 0;
    return selection.fileList.reduce((acc, item) => acc + (item.file?.size || 0), 0);
  }, [selection]);

  const overQuota =
    !skipStorageCheck &&
    remainingBytes >= 0 &&
    totalBytes > remainingBytes;

  const applyFiles = useCallback(
    (rawFiles) => {
      const files = Array.from(rawFiles || []).filter(Boolean);
      if (!files.length) {
        showToast("warning", "No files found in the selected folder.", "Upload folder");
        return;
      }

      const next = buildFolderSelection(files);
      const size = next.fileList.reduce((acc, item) => acc + (item.file?.size || 0), 0);

      if (!skipStorageCheck && size > remainingBytes) {
        showToast(
          "error",
          `You can only upload up to ${(remainingBytes / 1_000_000_000).toFixed(2)} GB. Please choose a smaller folder.`
        );
        return;
      }

      setSelection(next);
    },
    [remainingBytes, skipStorageCheck]
  );

  const clearSelection = () => setSelection(null);

  const handleBrowse = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e) => {
    applyFiles(e.target.files);
    e.target.value = "";
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current += 1;
    setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) setIsDragActive(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current = 0;
    setIsDragActive(false);

    try {
      const files = await collectFilesFromDataTransfer(e.dataTransfer);
      applyFiles(files);
    } catch (err) {
      console.error("Folder drop failed:", err);
      showToast("error", "Could not read the dropped folder. Try Browse instead.");
    }
  };

  const handleUpload = async () => {
    if (!selection?.fileList?.length) {
      showToast("warning", "Please select a folder first.", "Upload folder");
      return;
    }
    if (overQuota) {
      showToast(
        "error",
        `Not enough storage. Need ${formatBytes(totalBytes)}, ${formatBytes(remainingBytes)} left.`
      );
      return;
    }

    const isPrivate = visibility === "public" ? "public-read" : "private";

    await onUpload?.({
      fileList: selection.fileList,
      folderStructure: selection.folderStructure,
      folderName: selection.folderName,
      isPrivate,
    });
  };

  const previewPaths = selection?.fileList?.slice(0, PREVIEW_LIMIT) || [];
  const remainingCount = Math.max(
    0,
    (selection?.fileList?.length || 0) - PREVIEW_LIMIT
  );

  return (
    <div className="upload-folder-panel">
      <h5 className="upload-folder-panel__title">Upload Folder</h5>

      <div
        className={`upload-folder-panel__dropzone${
          isDragActive ? " is-active" : ""
        }${selection ? " has-selection" : ""}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleBrowse();
          }
        }}
        onClick={handleBrowse}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="upload-folder-panel__hidden-input"
          multiple
          onChange={handleInputChange}
          onClick={(e) => e.stopPropagation()}
        />
        <div className="upload-folder-panel__drop-icon" aria-hidden>
          <i className="mdi mdi-folder-upload-outline" />
        </div>
        <p className="upload-folder-panel__drop-text">
          {isDragActive ? "Drop the folder here" : "Drag a folder here"}
        </p>
        <p className="upload-folder-panel__drop-sub">
          or browse to select a folder from your device
        </p>
        <button
          type="button"
          className="upload-folder-panel__browse"
          onClick={(e) => {
            e.stopPropagation();
            handleBrowse();
          }}
        >
          Browse folder
        </button>
      </div>

      {selection && (
        <div className="upload-folder-panel__preview">
          <div className="upload-folder-panel__preview-head">
            <div>
              <p className="upload-folder-panel__folder-name">
                <i className="mdi mdi-folder-outline" />
                {selection.folderName}
              </p>
              <p className="upload-folder-panel__meta">
                {selection.fileList.length} file
                {selection.fileList.length === 1 ? "" : "s"} ·{" "}
                {formatBytes(totalBytes)}
              </p>
            </div>
            <button
              type="button"
              className="upload-folder-panel__clear"
              onClick={clearSelection}
              disabled={uploading}
            >
              Clear
            </button>
          </div>

          <ul className="upload-folder-panel__file-list">
            {previewPaths.map((item, index) => (
              <li key={`${item.relativePath}-${index}`}>
                {item.relativePath}
              </li>
            ))}
          </ul>
          {remainingCount > 0 && (
            <p className="upload-folder-panel__more">
              and {remainingCount} more…
            </p>
          )}
        </div>
      )}

      <div className="upload-folder-panel__storage">
        {!skipStorageCheck && (
          <span>
            Storage left:{" "}
            <strong>{(remainingBytes / 1_000_000_000).toFixed(2)} GB</strong>
          </span>
        )}
        {overQuota && (
          <span className="upload-folder-panel__quota-error">
            Selected folder exceeds remaining storage
          </span>
        )}
      </div>

      <div className="upload-folder-panel__visibility">
        <p className="upload-folder-panel__visibility-label">Set Visibility:</p>
        <ul className="radio_checkbox_list justify-center">
          <li>
            <input
              type="radio"
              name="UploadFolderVisibility"
              id="UploadFolderPublic"
              value="public"
              checked={visibility === "public"}
              onChange={() => setVisibility("public")}
            />
            <label htmlFor="UploadFolderPublic">Public</label>
          </li>
          <li>
            <input
              type="radio"
              name="UploadFolderVisibility"
              id="UploadFolderPrivate"
              value="private"
              checked={visibility === "private"}
              onChange={() => setVisibility("private")}
            />
            <label htmlFor="UploadFolderPrivate">Private</label>
          </li>
        </ul>
      </div>

      <div className="btn_group mt-4">
        <button
          type="button"
          onClick={onCancel}
          className="btn_width_same btn_grey_ripple ripple_effect btn-cancel"
          disabled={uploading}
        >
          Close
        </button>
        <button
          type="button"
          onClick={handleUpload}
          className="btn_width_same ripple_effect btn-upload"
          disabled={
            uploading || !selection?.fileList?.length || overQuota
          }
        >
          {uploading ? "Uploading…" : "Upload"}
        </button>
      </div>
    </div>
  );
};

export default UploadFolderPanel;
