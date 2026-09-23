import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";

import { MdOutlineDriveFileRenameOutline } from "react-icons/md";
import editIcon from "../images/editIcon.svg"
import ZoomInIcon from "../images/ZoomInIcon.svg"
import ZoomOutIcon from "../images/ZoomOutIcon.svg"
import deleteIcon from "../images/deleteIcon2.svg"
import folderIcon from "../images/folderIcon2.svg"
import { RxCross2 } from "react-icons/rx";
import { FaArrowsRotate } from "react-icons/fa6";
import { RiDeleteBinFill } from "react-icons/ri";
import VideoPlayer from "../components/VideoPlayer";
import ImageZoomViewer from "../components/ImageZoomViewer";
import { resolveVideoPlayUrl } from "../utils/videoPlayer";
// import DocViewer, { DocViewerRenderers } from '@cyntler/react-doc-viewer';
import * as mammoth from "mammoth";
// import * as XLSX from "xlsx";
import { init as pptxInit } from "pptx-preview"; // pptx-preview provides init (ESM)
import { useDispatch, useSelector } from "react-redux";
// import "pptx-preview/dist/pptx-preview.css";

import { MdOutlineEdit } from "react-icons/md";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import { DualRingMark } from "../components/brandLoaders";
import CreateFolderModal from "../components/CreateFolderModal";
import "../css/CustomFileModal.css";
import { showToast } from "../components/ToastProvider";

const MIN_IMAGE_ZOOM = 1;
const MAX_IMAGE_ZOOM = 4;
const IMAGE_ZOOM_STEP = 0.25;

export default function CustomFileModal({
  show,
  onClose,
  isFullscreen,
  videoSrc,
  pdfSrc,
  imageSrc,
  audioSrc,
  errorMessage2,
  isProgressVisible,
  apiUrl,
  token,
  toggleFullscreen,
  handlePrev,
  handleNext,
  folderOptions = [],
  selectedFolder,
  handleChange,
  fullscreeen,
  deleteFromModal,
  modalFile,
  deleteIcon,
  fileName,
  isPublic,
  onRenameSuccess,
  onMoveSuccess,
  triggerUpdate,
  handleOpenCreateFolder,
  setModalFile,
  setTriggerUpdate,
  path,
  setSelectedFolder,
  docSrc,
  previewFile,
}) {
  const [folderWindowStart, setFolderWindowStart] = useState(0);
  const [hoveredFolder, setHoveredFolder] = useState(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameInput, setRenameInput] = useState(fileName || "");
  const [renameError, setRenameError] = useState("");
  const [isRenamingMode, setIsRenameMode] = useState(false);
  const pathSegments = fileName?.split(/[/\\]/) || [];
  const parentPath = pathSegments.length > 1 ? pathSegments.slice(0, -1).join("/") + "/" : "";
  const fullName = pathSegments.pop() || fileName || "";
  const extensionIndex = fullName.lastIndexOf(".");
  const nameOnly = extensionIndex > 0 ? fullName.slice(0, extensionIndex) : fullName;
  const extOnly = extensionIndex > 0 ? fullName.slice(extensionIndex) : "";
  const [showCreateFolderFromModal, setShowCreateFolderFromModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderError, setNewFolderError] = useState("");
  const [isCreatingFolderFromModal, setIsCreatingFolderFromModal] = useState(false);
    const isSharedValue = useSelector((state) => state.getdata.isSharedValue);
    const filenameRedux = useSelector((state) => state.getdata.fileName);

  const [currentFullName, setCurrentFullName] = useState(fullName);
  const [currentNameOnly, setCurrentNameOnly] = useState(nameOnly);

  const docContainerRef = useRef(null);   // where we mount the HTML for DOCX/XLSX/PPTX
  const pptxInstanceRef = useRef(null);

  const [renderError, setRenderError] = useState("");
  const pptxMountRef = useRef(null);
  const [imageZoom, setImageZoom] = useState(1);    // stable mount for pptx-preview
  const [resolvedVideoUrl, setResolvedVideoUrl] = useState("");
  const [videoUrlLoading, setVideoUrlLoading] = useState(false);

useEffect(()=>{
  console.log("modalFile123456",modalFile)
  setIsRenameMode(false);
  setImageZoom(1);
},[modalFile, onClose])

useEffect(() => {
  setImageZoom(1);
}, [imageSrc]);

useEffect(() => {
  if (!videoSrc || !apiUrl || !token) {
    setResolvedVideoUrl("");
    setVideoUrlLoading(false);
    return undefined;
  }
  let cancelled = false;
  const controller =
    typeof AbortController !== "undefined" ? new AbortController() : null;
  setVideoUrlLoading(true);
  setResolvedVideoUrl("");
  resolveVideoPlayUrl(apiUrl, token, videoSrc, {
    shared: isSharedValue,
    sharedName: filenameRedux,
    signal: controller?.signal,
  })
    .then((url) => {
      if (!cancelled) setResolvedVideoUrl(url);
    })
    .catch((err) => {
      if (!cancelled && err?.name !== "AbortError") {
        console.error("Video play URL failed", err);
      }
    })
    .finally(() => {
      if (!cancelled) setVideoUrlLoading(false);
    });
  return () => {
    cancelled = true;
    controller?.abort?.();
  };
}, [videoSrc, apiUrl, token, isSharedValue, filenameRedux]);

useEffect(() => {
  console.log("ddddd CustomFileModal props:", {
    show,
    onClose,
    isFullscreen,
    videoSrc,
    pdfSrc,
    imageSrc,
    audioSrc,
    errorMessage2,
    isProgressVisible,
    apiUrl,
    token,
    toggleFullscreen,
    handlePrev,
    handleNext,
    folderOptions,
    selectedFolder,
    handleChange,
    fullscreeen,
    deleteFromModal,
    modalFile,
    deleteIcon,
    fileName,
    isPublic,
    onRenameSuccess,
    triggerUpdate,
    handleOpenCreateFolder,
    setModalFile,
    setTriggerUpdate,
    path,
    setSelectedFolder,
    docSrc,
    previewFile,
  });
}, [
  show,
  onClose,
  isFullscreen,
  videoSrc,
  pdfSrc,
  imageSrc,
  audioSrc,
  errorMessage2,
  isProgressVisible,
  apiUrl,
  token,
  toggleFullscreen,
  handlePrev,
  handleNext,
  folderOptions,
  selectedFolder,
  handleChange,
  fullscreeen,
  deleteFromModal,
  modalFile,
  deleteIcon,
  fileName,
  isPublic,
  onRenameSuccess,
  triggerUpdate,
  handleOpenCreateFolder,
  setModalFile,
  setTriggerUpdate,
  path,
  setSelectedFolder,
  docSrc,
]);

  useEffect(() => {
    console.log("USEEFFECT START — docSrc change:", docSrc, "modalFile:", modalFile);
    console.log("modalFile123:", modalFile);

    if (!docSrc) {
      console.log("docSrc falsy → clearing container and exiting effect");
      if (docContainerRef.current) {
        try { docContainerRef.current.innerHTML = ""; } catch (e) { console.warn("clear container err:", e); }
      }
      if (pptxMountRef.current) {
        try { pptxMountRef.current.innerHTML = ""; pptxMountRef.current.style.display = "none"; } catch (e) { }
      }
      return;
    }

    let cancelled = false;
    setRenderError("");
    console.log("Starting doRender for", docSrc);

    const doRender = async () => {
      try {
        const XLSX = await import("xlsx");
        console.log("CustomFileModal: fetching docSrc ->", docSrc);
        const resp = await fetch(docSrc, {
          method: "GET",
          mode: "cors",
          credentials: "omit",
        });
        console.log("Fetch status:", resp.status);
        if (!resp.ok) throw new Error(`Failed to fetch docSrc: ${resp.status}`);
        const arrayBuffer = await resp.arrayBuffer();
        console.log("Fetched bytes:", arrayBuffer?.byteLength);

        const filename = modalFile?.split("/").pop() || "file";
        const ext = (filename.split(".").pop() || "").toLowerCase();
        console.log("Filename/ext:", filename, ext);

        if (docContainerRef.current) {
          try { docContainerRef.current.innerHTML = ""; } catch (e) { console.warn("clear container err:", e); }
        }
        if (pptxMountRef.current) {
          try { pptxMountRef.current.innerHTML = ""; pptxMountRef.current.style.display = "none"; } catch (e) { console.warn("clear pptx mount err:", e); }
        }

        if (["doc", "docx"].includes(ext)) {
          console.log("Rendering DOCX with mammoth");
          const { value: html, messages } = await mammoth.convertToHtml({ arrayBuffer });
          console.log("mammoth messages:", messages);
          if (cancelled) return;
          if (docContainerRef.current) {
            try { docContainerRef.current.innerHTML = html; } catch (e) { console.error("inject docx html err:", e); }
          }
          return;
        }

        if (["xls", "xlsx", "csv", "ods"].includes(ext)) {
          console.log("Rendering spreadsheet with SheetJS");
          const data = new Uint8Array(arrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const htmlString = XLSX.utils.sheet_to_html(worksheet);
          if (cancelled) return;
          if (docContainerRef.current) {
            try { docContainerRef.current.innerHTML = htmlString; } catch (e) { console.error("inject sheet html err:", e); }
          }
          return;
        }

        if (["ppt", "pptx"].includes(ext)) {
          console.log("Rendering PPTX with pptx-preview");

          if (!pptxMountRef.current) {
            console.warn("pptxMountRef not found; showing fallback download");
            if (docContainerRef.current) {
              docContainerRef.current.innerHTML = `<div style="padding:20px;color:#fff">Preview not available. <a href="${docSrc}" download="${filename}" style="color:#FFD580">Download</a></div>`;
            }
            return;
          }

          try {
            pptxMountRef.current.style.display = "block";
            pptxMountRef.current.innerHTML = "";
          } catch (e) { console.warn("pptx mount prepare err:", e); }

          try {
            console.log("Calling pptxInit on pptxMountRef");
            const inst = await pptxInit(pptxMountRef.current, arrayBuffer, {
              showControls: true,
              showNotes: false,
            });
            pptxInstanceRef.current = { inst };
            console.log("pptxInit success, instance stored");
          } catch (pptErr) {
            console.warn("pptxInit failed:", pptErr);
            if (pptxMountRef.current) {
              try { pptxMountRef.current.innerHTML = ""; pptxMountRef.current.style.display = "none"; } catch (e) { }
            }
            if (docContainerRef.current) {
              docContainerRef.current.innerHTML = `<div style="padding:20px;color:#fff">Preview not available. <a href="${docSrc}" download="${filename}" style="color:#FFD580">Download</a></div>`;
            }
          }
          return;
        }

        if (docContainerRef.current) {
    //           padding: 20px;
    // color: #000000;
    
          docContainerRef.current.innerHTML = `<div style="padding:20px;color:#000000">Preview  not supported for .${ext}. <a href="${docSrc}" download="${filename}" style="color:#FFD580">Download</a></div>`;
        }
      } catch (err) {
        console.error("CustomFileModal render error:", err);
        setRenderError("Preview failed. You can download the file.");
        if (docContainerRef.current) {
          const filename = modalFile?.split("/").pop() || "file";
          try { docContainerRef.current.innerHTML = `<div style="padding:20px;color:#fff">Preview failed. <a href="${docSrc}" download="${filename}" style="color:#FFD580">Download</a></div>`; } catch (e) { }
        }
      }
    };

    doRender();

    // No cleanup returned
  }, [docSrc, modalFile]);

  useEffect(() => {
    setCurrentFullName(fullName);
    setCurrentNameOnly(nameOnly);
  }, [fullName, nameOnly]);

  useEffect(() => {
    console.log("✅DEBUG: docSrc changed ->", docSrc);
  }, [docSrc]);

  // Create folder and Move
  // const handleCreateFolderAndMove = async (e) => {
  //   e.preventDefault();
  //   console.log("ggggg handleCreateFolderAndMove: called");

  //   if (!newFolderName.trim()) {
  //     setNewFolderError("Folder name is required");
  //     console.log("ggggg handleCreateFolderAndMove: folder name required");
  //     return;
  //   }

  //   const valid = /^[a-zA-Z0-9_\- ]{1,}$/.test(newFolderName.trim());
  //   if (!valid) {
  //     setNewFolderError(
  //       "Folder name can only contain letters, numbers, underscores, hyphens, and spaces."
  //     );
  //     console.log("ggggg handleCreateFolderAndMove: invalid folder name");
  //     return;
  //   }

  //   try {
  //     setNewFolderError("");
  //     console.log("ggggg handleCreateFolderAndMove: folder name valid");

  //     const parts = modalFile.split("/");
  //     const fileName = parts.pop();
  //     const sourceFolder = parts.join("/"); // no trailing slash
  //     const destinationFolder = sourceFolder ? sourceFolder + "/" + newFolderName.trim() : newFolderName.trim();

  //     console.log("ggggg handleCreateFolderAndMove: parts =", parts);
  //     console.log("ggggg handleCreateFolderAndMove: fileName =", fileName);
  //     console.log("ggggg handleCreateFolderAndMove: sourceFolder =", sourceFolder);
  //     console.log("ggggg handleCreateFolderAndMove: destinationFolder =", destinationFolder);

  //     // 1) Create folder API
  //     await axios.post(
  //       `${apiUrl}create-folder`,
  //       { folderName: destinationFolder },
  //       {
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //           "Content-Type": "application/x-www-form-urlencoded",
  //         },
  //       }
  //     );
  //     console.log("ggggg handleCreateFolderAndMove: folder created");

  //     // 2) Move file API
  //     await axios.post(
  //       `${apiUrl}move-file`,
  //       {
  //         sourceFolder,
  //         destinationFolder,
  //         keys: [fileName],
  //       },
  //       {
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //           "Content-Type": "application/json",
  //         },
  //       }
  //     );
  //     console.log("ggggg handleCreateFolderAndMove: file moved");

  //     // 3) Refresh + close popup + modal
  //     showToast?.("success", "Folder created and file moved!");
  //     console.log("ggggg handleCreateFolderAndMove: success toast shown");
  //     setShowCreateFolderFromModal(false);
  //     console.log("ggggg handleCreateFolderAndMove: popup closed");
  //     onRenameSuccess?.();
  //     console.log("ggggg handleCreateFolderAndMove: onRenameSuccess called");
  //     onClose();
  //     console.log("ggggg handleCreateFolderAndMove: modal closed");
  //   } catch (error) {
  //     setNewFolderError("Error creating folder or moving file");
  //     console.log("ggggg handleCreateFolderAndMove: error =", error);
  //     showToast?.("error", "Error creating folder or moving file");
  //   }
  // };

  const closeCreateFolderFromModal = () => {
    if (isCreatingFolderFromModal) return;
    setShowCreateFolderFromModal(false);
    setNewFolderError("");
    setNewFolderName("");
  };

  const handleCreateFolderAndMove = async (e) => {
  e?.preventDefault?.();
  console.log("ggggg handleCreateFolderAndMove: called");

  if (!newFolderName.trim()) {
    setNewFolderError("Folder name is required");
    console.log("ggggg handleCreateFolderAndMove: folder name required");
    return;
  }

  const valid = /^[a-zA-Z0-9_\- ]{1,}$/.test(newFolderName.trim());
  if (!valid) {
    setNewFolderError(
      "Folder name can only contain letters, numbers, underscores, hyphens, and spaces."
    );
    console.log("ggggg handleCreateFolderAndMove: invalid folder name");
    return;
  }

  try {
    setNewFolderError("");
    setIsCreatingFolderFromModal(true);
    console.log("ggggg handleCreateFolderAndMove: folder name valid");

    const parts = modalFile.split("/");
    const fileName = parts.pop();
    const sourceFolder = parts.join("/"); // no trailing slash
    const destinationFolder = sourceFolder ? sourceFolder + "/" + newFolderName.trim() : newFolderName.trim();

    console.log("ggggg handleCreateFolderAndMove: parts =", parts);
    console.log("ggggg handleCreateFolderAndMove: fileName =", fileName);
    console.log("ggggg handleCreateFolderAndMove: sourceFolder =", sourceFolder);
    console.log("ggggg handleCreateFolderAndMove: destinationFolder =", destinationFolder);

    // Build URL with shared parameter if in shared folder
    let createFolderEndpoint = `${apiUrl}create-folder`;
    let moveFileEndpoint = `${apiUrl}move-file`;

    if (isSharedValue) {
      const encodedShared = encodeURIComponent(filenameRedux);
      createFolderEndpoint += `?shared=${encodedShared}`;
      moveFileEndpoint += `?shared=${encodedShared}`;
    }

    // 1) Create folder API
    await axios.post(
      createFolderEndpoint,
      { folderName: destinationFolder },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    console.log("ggggg handleCreateFolderAndMove: folder created");

    // 2) Move file API
    await axios.post(
      moveFileEndpoint,
      {
        sourceFolder,
        destinationFolder,
        keys: [fileName],
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("ggggg handleCreateFolderAndMove: file moved");

    showToast?.("success", "Folder created and file moved!");
    setShowCreateFolderFromModal(false);
    setNewFolderName("");
    setNewFolderError("");

    const movedPath = modalFile;
    if (typeof onMoveSuccess === "function") {
      await onMoveSuccess(movedPath);
    } else {
      await onRenameSuccess?.();
      onClose?.();
    }
  } catch (error) {
    setNewFolderError("Error creating folder or moving file");
    console.log("ggggg handleCreateFolderAndMove: error =", error);
    showToast?.("error", "Error creating folder or moving file");
  } finally {
    setIsCreatingFolderFromModal(false);
  }
};

  // const handleMove = async (selectedOption) => {
  //   console.log("handleMove: selectedOption =", selectedOption);
  //   console.log("handleMove: path =", path);
  //   console.log("handleMove: modalFile =", modalFile);
  //   console.log("handleMove: token =", token);
  //   console.log("handleMove: apiUrl =", apiUrl);

  //   try {
  //     // Extract file name and source folder
  //     const parts = modalFile.split("/");
  //     const fileName = parts.pop();
  //     const sourceFolder = parts.join("/"); // no trailing slash
  //     const destinationFolder = selectedOption.value.replace(/</g, "/"); // Use selected folder

  //     console.log("handleMove: sourceFolder =", sourceFolder);
  //     console.log("handleMove: destinationFolder =", destinationFolder);
  //     console.log("handleMove: fileName =", fileName);

  //     // Validate paths
  //     if (!destinationFolder || !fileName) {
  //       showToast("error", "Invalid move parameters.");
  //       return;
  //     }

  //     // Move file API
  //     const res = await axios.post(
  //       `${apiUrl}move-file`,
  //       {
  //         sourceFolder,
  //         destinationFolder,
  //         keys: [fileName],
  //       },
  //       {
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //           "Content-Type": "application/json",
  //         },
  //       }
  //     );
  //     console.log("handleMove: move API response =", res.data);

  //     // Show success toast
  //     showToast("success", "File moved successfully");
  //     console.log("handleMove: showToast success");

  //     // // ✅ Call reloadAfterTast to refresh the file list and update Redux
  //     // if (typeof reloadAfterTast === "function") {
  //     //   console.log("handleMove: calling reloadAfterTast to refresh store");
  //     //   // reloadAfterTast();
  //     //   onRenameSuccess?.();
  //     // } else {
  //     //   console.warn("reloadAfterTast is not a function, store may not update");
  //     // }

  //     // Close modal
  //     console.log("handleMove: calling onClose");
  //     await onRenameSuccess?.();
  //     // onClose?.();
  //   } catch (error) {
  //     console.error("handleMove: error =", error);
  //     showToast("error", `Failed to move file.`);
  //   }
  // };

const handleMove = async (selectedOption) => {
  console.log("handleMove: selectedOption =", selectedOption);
  console.log("handleMove: path =", path);
  console.log("handleMove: modalFile =", modalFile);
  console.log("handleMove: token =", token);
  console.log("handleMove: apiUrl =", apiUrl);

  try {
    // Extract file name and source folder
    const parts = modalFile.split("/");
    const fileName = parts.pop();
    const sourceFolder = parts.join("/"); // no trailing slash
    const destinationFolder = selectedOption.value.replace(/</g, "/"); // Use selected folder

    console.log("handleMove: sourceFolder =", sourceFolder);
    console.log("handleMove: destinationFolder =", destinationFolder);
    console.log("handleMove: fileName =", fileName);

    // Validate paths
    if (!destinationFolder || !fileName) {
      showToast("error", "Invalid move parameters.");
      return;
    }

    // Build URL with shared parameter if in shared folder
    let endpoint = `${apiUrl}move-file`;
    if (isSharedValue) {
      endpoint += `?shared=${encodeURIComponent(filenameRedux)}`;
    }

    // Move file API
    const res = await axios.post(
      endpoint,
      {
        sourceFolder,
        destinationFolder,
        keys: [fileName],
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("handleMove: move API response =", res.data);

    showToast("success", "File moved successfully");

    const movedPath = modalFile;
    // Advance/close using fresh list — do NOT call handleNext (stale filedata bug)
    if (typeof onMoveSuccess === "function") {
      await onMoveSuccess(movedPath);
    } else {
      await onRenameSuccess?.();
      await handleNext?.();
    }
  } catch (error) {
    console.error("handleMove: error =", error);
    showToast("warning", error?.response?.data?.message);
  }
};

  useEffect(() => {
    console.log("✅modalFile: ", modalFile)
  }, [modalFile])

  const handleRenameSubmit = async () => {
    setRenameError("");

    if (!renameInput || renameInput.trim() === "") {
      setRenameError("Name cannot be empty");
      return;
    }

    const trimmedName = renameInput.trim();
    const newFullName = trimmedName + extOnly; // e.g. "Batman2.jpg"

    // split current modalFile and replace last part only
    const modalParts = modalFile.split("/");
    modalParts[modalParts.length - 1] = newFullName;
    const newFullKey = modalParts.join("/");   // e.g. "FolderTest/Batman2.jpg"

    console.log("handleRenameSubmit: oldKey =", fileName);
    console.log("handleRenameSubmit: newFullName =", newFullName);
    console.log("handleRenameSubmit: newFullKey =", newFullKey);

    // To update modalFile
    // setModalFile(newFullKey)
    setModalFile(modalParts.join("/"))

    setCurrentFullName(newFullName);
    setCurrentNameOnly(trimmedName);

    if (newFullKey === modalFile) {
      console.log("handleRenameSubmit: name unchanged, exiting rename mode");
      setIsRenameMode(false);
      return;
    }

    setIsRenaming(true);
    try {
      const res = await axios.post(
        `${apiUrl}rename-file`,
        {
          oldKey: fileName,
          newKey: newFullKey,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log("handleRenameSubmit: API response =", res.data);

      console.log("handleRenameSubmit: updating modalFile to", newFullKey);
      setModalFile?.(newFullKey);   // now "FolderTest/Batman2.jpg"

      setIsRenameMode(false);
      showToast("success", "File renamed successfully");
      onRenameSuccess?.();
    } catch (error) {
      console.error("handleRenameSubmit: rename failed", error);
      setRenameError("Rename failed");
    } finally {
      setIsRenaming(false);
    }
  };

  const exitRenameMode = () => {
    setIsRenameMode(false);
    setRenameInput(fileName);
    setRenameError("");
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && show) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [show, onClose]);

  // Paste all the usestates and useeffects above this
  if (!show) return null;

  // Logic for visible folder window/paging
  const FOLDERS_VISIBLE = 3;
  const isImagePreview =
    !isProgressVisible &&
    Boolean(imageSrc) &&
    !videoSrc &&
    !pdfSrc &&
    !docSrc;
  const handleImageZoomIn = () =>
    setImageZoom((current) =>
      Math.min(MAX_IMAGE_ZOOM, current + IMAGE_ZOOM_STEP)
    );
  const handleImageZoomOut = () =>
    setImageZoom((current) =>
      Math.max(MIN_IMAGE_ZOOM, current - IMAGE_ZOOM_STEP)
    );
  const canZoomIn = isImagePreview && imageZoom < MAX_IMAGE_ZOOM;
  const canZoomOut = isImagePreview && imageZoom > MIN_IMAGE_ZOOM;
  const validFolders = folderOptions.filter(
    (folder) => folder.value.trim() && folder.label.trim()
  );
  const visibleFolders = validFolders.slice(
    folderWindowStart,
    folderWindowStart + FOLDERS_VISIBLE
  );
  const handleNextFolders = () => {
    if (folderWindowStart + FOLDERS_VISIBLE < validFolders.length) {
      setFolderWindowStart(folderWindowStart + 1);
    }
  };
  const handlePrevFolders = () => {
    if (folderWindowStart > 0) {
      setFolderWindowStart(folderWindowStart - 1);
    }
  };

  return createPortal(
    <div className="custom-file-modal-overlay" onClick={onClose}>
      <div className="custom-file-modal-backdrop" aria-hidden="true" />
      <div
        className={`custom-file-modal ${isFullscreen ? "custom-file-modal--fullscreen" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="cfm-close"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label="Close preview"
        >
          <RxCross2 />
        </button>

        <div
          className={`cfm-top ${isRenamingMode ? "cfm-top--rename" : ""}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className={`cfm-title-pill ${isRenamingMode ? "cfm-title-pill--rename" : ""}`}
          >
            {isRenamingMode ? (
              <div className="cfm-rename-form">
                <div className="cfm-rename-field">
                  <input
                    className="cfm-rename-input"
                    type="text"
                    placeholder="Enter new name"
                    value={renameInput}
                    onChange={(e) => setRenameInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                        e.stopPropagation();
                      }
                      if (e.key === "Enter") handleRenameSubmit();
                      if (e.key === "Escape") exitRenameMode();
                    }}
                    disabled={isRenaming}
                    autoFocus
                  />
                  <span className="cfm-rename-ext">{extOnly}</span>
                </div>
                <div className="cfm-rename-actions">
                  <button
                    type="button"
                    className="cfm-rename-save"
                    onClick={handleRenameSubmit}
                    disabled={isRenaming}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className="cfm-rename-cancel"
                    onClick={exitRenameMode}
                    disabled={isRenaming}
                  >
                    Cancel
                  </button>
                </div>
                {renameError && (
                  <span className="cfm-rename-error">{renameError}</span>
                )}
              </div>
            ) : (
              <>
                <button
                  type="button"
                  className="cfm-edit-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsRenameMode(true);
                    setRenameInput(currentNameOnly);
                  }}
                  aria-label="Rename file"
                >
                  <MdOutlineEdit />
                </button>
                <span
                  className="cfm-filename"
                  title={currentFullName}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsRenameMode(true);
                    setRenameInput(currentNameOnly);
                  }}
                >
                  {currentFullName}
                </span>
              </>
            )}
          </div>

          <span
            className={`cfm-acl-badge ${
              previewFile?.ACL === "public"
                ? "cfm-acl-badge--public"
                : "cfm-acl-badge--private"
            }`}
          >
            {previewFile?.ACL === "public" ? "Public" : "Private"}
          </span>
        </div>

        <div className="cfm-stage">
          <button
            type="button"
            className="cfm-nav cfm-nav--prev"
            onClick={(e) => {
              handlePrev();
              exitRenameMode();
              e.stopPropagation();
            }}
            aria-label="Previous file"
          >
            <IoChevronBack />
          </button>
          <button
            type="button"
            className="cfm-nav cfm-nav--next"
            onClick={(e) => {
              handleNext();
              exitRenameMode();
              e.stopPropagation();
            }}
            aria-label="Next file"
          >
            <IoChevronForward />
          </button>
        {isProgressVisible || (videoSrc && videoUrlLoading) ? (
          <div className="cfm-loader">
            <DualRingMark size={44} />
          </div>
        ) : videoSrc && resolvedVideoUrl ? (
          <VideoPlayer
            key={resolvedVideoUrl}
            fitToFrame
            url={resolvedVideoUrl}
            fileName={fileName || videoSrc}
          />
        ) : pdfSrc ? (
          <iframe
            src={pdfSrc}
            onClick={(e) => e.stopPropagation()}
            title="PDF Preview"
            className="cfm-pdf-frame"
          />
        ) : imageSrc ? (
          <ImageZoomViewer
            key={imageSrc}
            src={imageSrc}
            zoom={imageZoom}
            onClick={(e) => e.stopPropagation()}
          />
        ) : docSrc ? (
          <div
            key={docSrc}
            ref={docContainerRef}
            onClick={(e) => e.stopPropagation()}
            className="cfm-doc-wrap ifTable"
          >
            {renderError ? (
              <div style={{ color: "#fff" }}>{renderError}</div>
            ) : (
              <div>
                <div
                  ref={docContainerRef}
                  style={{ width: "100%", minHeight: 140 }}
                  aria-hidden={!!renderError}
                />
                <div
                  ref={pptxMountRef}
                  style={{ width: "100%", height: "100%", display: "none" }}
                />
                {["ppt", "pptx"].includes(
                  (docSrc.split(".").pop() || "").toLowerCase()
                ) && (
                  <div
                    ref={docContainerRef}
                    style={{
                      width: "100%",
                      height: "100%",
                      background: "#fff",
                      borderRadius: "8px",
                    }}
                  />
                )}
              </div>
            )}
          </div>
        ) : errorMessage2 ? (
          <p className="cfm-error">{errorMessage2}</p>
        ) : (
          <p className="cfm-empty">No preview available.</p>
        )}
        </div>

        <footer className="cfm-footer">
          <div
            className="cfm-footer-row"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cfm-move-pill">
              <div className="cfm-move-label">Move file to:</div>
              <div className="cfm-folder-row">
                <button
                  type="button"
                  className="cfm-folder-arrow"
                  onClick={handlePrevFolders}
                  disabled={folderWindowStart === 0}
                  aria-label="Previous folders"
                >
                  <IoChevronBack />
                </button>

                <div className="cfm-folder-list">
                  {visibleFolders.map((folder) => {
                    const fullLabel = folder.label.replace(/</g, "/");
                    const lastSegment =
                      fullLabel.split("/").filter((s) => !!s).pop() || fullLabel;
                    const isHovered = hoveredFolder === folder.value;

                    return (
                      <label
                        key={folder.value}
                        className={`cfm-folder-opt ${
                          selectedFolder === folder.value ? "cfm-folder-opt--on" : ""
                        }`}
                        onMouseEnter={() => setHoveredFolder(folder.value)}
                        onMouseLeave={() => setHoveredFolder(null)}
                      >
                        <span className="cfm-folder-dot">
                          {selectedFolder === folder.value && (
                            <span className="cfm-folder-dot-inner" />
                          )}
                        </span>
                        <input
                          type="radio"
                          name="folder"
                          value={folder.value}
                          checked={selectedFolder === folder.value}
                          onChange={() => {
                            handleMove(folder);
                            if (!modalFile) {
                              onClose?.();
                            }
                          }}
                          style={{ display: "none" }}
                        />
                        <span className="cfm-folder-name">{lastSegment}</span>
                        {isHovered && (
                          <div className="cfm-folder-tip">{fullLabel}</div>
                        )}
                      </label>
                    );
                  })}
                </div>
                <button
                  type="button"
                  className="cfm-folder-arrow"
                  onClick={handleNextFolders}
                  disabled={
                    folderWindowStart + FOLDERS_VISIBLE >= folderOptions.length
                  }
                  aria-label="Next folders"
                >
                  <IoChevronForward />
                </button>
              </div>
            </div>

            <button
              type="button"
              className="cfm-icon-btn"
              onClick={(e) => {
                e.stopPropagation();
                setShowCreateFolderFromModal(true);
              }}
              aria-label="Create folder and move"
            >
              <img src={folderIcon} alt="" />
            </button>

            <div className="cfm-toolbar">
              <button
                type="button"
                className="cfm-tool-btn"
                onClick={canZoomOut ? handleImageZoomOut : undefined}
                disabled={!canZoomOut}
                aria-label="Zoom out"
                title={
                  !isImagePreview
                    ? "Zoom is only available for images"
                    : canZoomOut
                      ? "Zoom out"
                      : "Minimum zoom reached"
                }
              >
                <img src={ZoomOutIcon} alt="" />
              </button>

              <div className="cfm-tool-sep" />

              <button
                type="button"
                className="cfm-tool-btn"
                onClick={() => deleteFromModal(modalFile)}
                aria-label="Delete file"
              >
                <RiDeleteBinFill />
              </button>

              <div className="cfm-tool-sep" />

              <button
                type="button"
                className="cfm-tool-btn"
                onClick={canZoomIn ? handleImageZoomIn : undefined}
                disabled={!canZoomIn}
                aria-label="Zoom in"
                title={
                  !isImagePreview
                    ? "Zoom is only available for images"
                    : canZoomIn
                      ? "Zoom in"
                      : "Maximum zoom reached"
                }
              >
                <img src={ZoomInIcon} alt="" />
              </button>
            </div>
          </div>
        </footer>
      </div>

      <CreateFolderModal
        isOpen={showCreateFolderFromModal}
        onClose={closeCreateFolderFromModal}
        value={newFolderName}
        onChange={(e) => {
          setNewFolderName(e.target.value);
          if (newFolderError) setNewFolderError("");
        }}
        onSubmit={handleCreateFolderAndMove}
        error={newFolderError}
        isSubmitting={isCreatingFolderFromModal}
        description="This file will be moved into the new folder after it is created."
        submitLabel="Create & Move"
        zIndex={5200}
      />

    </div>,
    document.body
  );
}
