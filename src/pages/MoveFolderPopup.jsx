import React, { useContext, useState, useEffect } from "react";
import { UploadContext } from "./UploadContext";
import { useSelector, useDispatch } from "react-redux";
import {
  incrementFCounter,
  removeLastFolder,
  decrementFCounter,
  removeLastFolder2,
  resetFCounter,
} from "../store/fileSlicer";
import axios from "axios";
import { useToast } from "@chakra-ui/react";
import { FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import { BsXCircleFill } from "react-icons/bs";
import { IoIosInformationCircle } from "react-icons/io";
import Loader2 from "../components/Loader2";
import FolderPickerListPanel from "../components/FolderPickerListPanel";
import FolderDestinationModal, {
  formatModalItemSummary,
} from "../components/FolderDestinationModal";
import { getApiErrorMessage } from "../utils/handleS3CopyError";
import {
  normalizeMovePath,
  isRedundantFolderMove,
} from "../utils/movePath";
import {
  buildGetFolderParams,
  parseFolderListingItems,
} from "../utils/getFolderParams";
import { fetchFolderListing } from "../utils/fetchFolderListing";
import {
  startMoveTransfer,
  finishMoveTransfer,
  failMoveTransfer,
} from "../utils/moveTransferProgress";
import { afterLoaderComplete } from "../utils/actionLoaderDelay";

function MoveFolderPopup({ moveKey, onClose, onRenameSuccess, showToast: showToastProp }) {
  const { addUpload, updateUploadProgress, removeUpload } = useContext(UploadContext);
  const apiUrl = process.env.REACT_APP_API_ENDPOINT;
  const token = sessionStorage.getItem("number");
  const filenameRedux = useSelector((state) => state.getdata.fileName);
  const isSharedValue = useSelector((state) => state.getdata.isSharedValue);
  const counter = useSelector((state) => state.getdata.folderCounter);
  const [locationPath, setLocationPath] = useState("");
  const dispatch = useDispatch();
  const [selectedPath, setSelectedPath] = useState("");
  const [folders1, setFolders1] = useState([]);
  const [loadingFolders, setLoadingFolders] = useState(true);
  const toast = useToast();
  const [loading2, setLoading2] = useState(false);
const [newFolderName, setNewFolderName] = useState("");
const [creatingFolder, setCreatingFolder] = useState(false);

  useEffect(() => {
    dispatch(resetFCounter());
    fetchFolders("");
  }, []);

  const fetchFolders = async (folderPath = "", signal) => {
    setLoadingFolders(true);
    try {
      const folders = await fetchFolderListing({
        apiUrl,
        token,
        folderPath,
        isShared: isSharedValue,
        sharedRoot: filenameRedux,
        signal,
      });
      setFolders1(folders);
    } catch (error) {
      if (error?.code === "ERR_CANCELED" || error?.name === "CanceledError") {
        return;
      }
      console.error("Error fetching folders:", error);
      setFolders1([]);
    } finally {
      setLoadingFolders(false);
    }
  };

  function getTextAfterSlashes(text, counter) {
    const parts = text.split("/");
    if (counter >= parts.length) return parts[parts.length - 1];
    return parts.slice(counter).join("/");
  }

const handleItemClick = async (path) => {
  setLoadingFolders(true);
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
      if (prev) return `${prev} / ${getTextAfterSlashes(path, counter)}`;
      return getTextAfterSlashes(path, counter);
    });

    setFolders1(folders);
    setSelectedPath(path);
    dispatch(incrementFCounter());
  } catch (error) {
    console.error("Error fetching folder data:", error);
  } finally {
    setLoadingFolders(false);
  }
};

 const movePathOptions = {
   isShared: isSharedValue,
   sharedRoot: filenameRedux,
 };

 const handleMove = async () => {
  const normalizedDest = normalizeMovePath(selectedPath, movePathOptions);
  const sourceFolders = (Array.isArray(moveKey) ? moveKey : [moveKey])
    .map((folder) => normalizeMovePath(folder, movePathOptions))
    .filter(Boolean);

  if (sourceFolders.length === 0) {
    showToast("error", "No folder selected to move.");
    return;
  }

  if (isRedundantFolderMove(sourceFolders, selectedPath, movePathOptions)) {
    showToast("warning", "Source and destination are the same.");
    return;
  }

  const invalidDest = sourceFolders.some((src) => {
    if (!normalizedDest) return false;
    return normalizedDest === src || normalizedDest.startsWith(`${src}/`);
  });
  if (invalidDest) {
    showToast(
      "warning",
      "Cannot move a folder into itself or one of its subfolders."
    );
    return;
  }

  setLoading2(true);
  let uploadId = null;
  try {
    const sharedParams = isSharedValue ? { shared: filenameRedux } : {};
    uploadId = startMoveTransfer(
      addUpload,
      updateUploadProgress,
      "Moving folder",
      { isFolder: true }
    );

    await axios.post(
      `${apiUrl}move-folder`,
      {
        sourceFolders,
        destinationFolder: selectedPath,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        params: sharedParams,
      }
    );

    finishMoveTransfer(updateUploadProgress, removeUpload, uploadId);
    uploadId = null;

    showToast("success", "Folder moved successfully!");
    await onRenameSuccess?.();
    afterLoaderComplete(() => {
      setLoading2(false);
      onClose();
    });
  } catch (error) {
    failMoveTransfer(removeUpload, uploadId);
    uploadId = null;
    console.error("wwwww: Error moving folder:", error);
    // Keep modal open so the user can see the toast and pick another destination
    showToast(
      "error",
      getApiErrorMessage(error, "Failed to move folder. Please try again.")
    );
    afterLoaderComplete(() => setLoading2(false));
  }
};



const handleCreateFolder = async () => {
  if (!newFolderName.trim()) {
    showToast("warning", "Please enter folder name");
    return;
  }

  if (creatingFolder) return;

  try {
    setCreatingFolder(true);

    const cleanName = newFolderName.trim().replace(/^\/+|\/+$/g, "");

    const folderPath = selectedPath
      ? `${selectedPath}/${cleanName}`
      : cleanName;

    await axios.post(
      `${apiUrl}create-folder`,
      {
        folderName: folderPath,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        ...(isSharedValue && {
          params: { shared: filenameRedux },
        }),
      }
    );

    showToast("success", "Folder created successfully");

    setNewFolderName("");

    // 🔥 refresh list
    fetchFolders(selectedPath || "");

  } catch (error) {
    console.error("Create folder error:", error);
    showToast("error", "Failed to create folder");
  } finally {
    setCreatingFolder(false);
  }
};




  const handleBack = () => {
    console.log("Back Button Clicked");
    if (isSharedValue) {
      dispatch(decrementFCounter());
      dispatch(removeLastFolder2());
    } else {
      dispatch(removeLastFolder());
      dispatch(decrementFCounter());
    }
    setLocationPath((prev) => {
      if (!prev.includes("/")) return "";
      return prev.substring(0, prev.lastIndexOf(" / "));
    });
    const parentPath = selectedPath?.includes("/")
      ? selectedPath.replace(/\/[^/]+$/, "")
      : "";
    setSelectedPath(parentPath);
    fetchFolders(parentPath);
  };


const iconMap = {
  success: FaCheckCircle,
  error: BsXCircleFill,
  info: IoIosInformationCircle,
  warning: FaExclamationTriangle,
};


const getStatusColors = (status) => {
  return {
    bg: 'rgba(255, 255, 255, 0.85)',     // Clean white glass
    border: status === 'success' ? 'rgba(16, 185, 129, 0.3)' :
            status === 'error' ? 'rgba(239, 68, 68, 0.3)' :
            status === 'info' ? 'rgba(59, 130, 246, 0.3)' :
            'rgba(245, 158, 11, 0.3)',        // Status-colored border
    icon: status === 'success' ? '#10b981' :
          status === 'error' ? '#ef4444' :
          status === 'info' ? '#3b82f6' :
          '#f59e0b'
  };
};



const showToast = (status, message) => {
  if (typeof showToastProp === "function") {
    showToastProp(status, message);
    return;
  }

  const IconComponent = iconMap[status];
  const colors = getStatusColors(status);
  
  toast({
    // position: 'bottom-center',
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
    dispatch(resetFCounter());
    onClose();
  };

  const handleRootClick = () => {
    setLocationPath("");
    setSelectedPath("");
    fetchFolders("");
  };

  return (
    <>
      <FolderDestinationModal
        variant="move-folder"
        title="Move folder"
        itemSummary={formatModalItemSummary(moveKey)}
        selectedPath={selectedPath}
        onClose={handleClose}
        onConfirm={handleMove}
        confirmLabel="Move here"
        confirmLoading={loading2}
        locationPath={locationPath}
        counter={counter}
        onRootClick={handleRootClick}
        onBack={handleBack}
        newFolderName={newFolderName}
        onNewFolderNameChange={setNewFolderName}
        onCreateFolder={handleCreateFolder}
        creatingFolder={creatingFolder}
      >
        <FolderPickerListPanel
          loading={loadingFolders}
          folders={folders1}
          counter={counter}
          getTextAfterSlashes={getTextAfterSlashes}
          onOpenFolder={handleItemClick}
        />
      </FolderDestinationModal>

      {loading2 && <Loader2 />}
    </>
  );
}

export default MoveFolderPopup;
