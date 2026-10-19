import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  incrementFCounter,
  removeLastFolder,
  decrementFCounter,
  removeLastFolder2,
  resetFCounter,
} from "../store/fileSlicer";
import axios from "axios";

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
import { showToast as globalShowToast } from "../components/ToastProvider";
import { useZippingProgressModal } from "../hooks/useZippingProgressModal";
import { refreshRootListingIfDestinationIsRoot } from "../utils/rootListingRefresh";
import { LONG_RUNNING_AWS_REQUEST_OPTIONS } from "../utils/longRunningAwsRequest";
import {
  captureListingContext,
  isStillOnListingPath,
} from "../utils/listingRefreshGuard";

function MoveFolderPopup({ moveKey, onClose, onRenameSuccess, showToast: showToastProp }) {
  const { beginZipping, endZipping, zippingModal } = useZippingProgressModal();
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
const [loading2, setLoading2] = useState(false);
const [newFolderName, setNewFolderName] = useState("");
const [creatingFolder, setCreatingFolder] = useState(false);

  const showToast = (status, message, title) => {
    if (typeof showToastProp === "function") {
      showToastProp(status, message, title);
      return;
    }
    globalShowToast(status, message, title);
  };

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

  const progressLabel =
    sourceFolders.length > 1
      ? `${sourceFolders.length} folders`
      : sourceFolders[0]?.split("/").filter(Boolean).pop() || "folder";

  setLoading2(true);
  const startedListing = captureListingContext();
  beginZipping(progressLabel, {
    mode: "move",
    sourcePaths: sourceFolders,
    destinationPath: selectedPath,
  });
  try {
    const sharedParams = isSharedValue ? { shared: filenameRedux } : {};

    await axios.post(
      `${apiUrl}move-folder`,
      {
        sourceFolders,
        destinationFolder: selectedPath,
      },
      {
        ...LONG_RUNNING_AWS_REQUEST_OPTIONS,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        params: sharedParams,
      }
    );

    showToast("success", "Folder moved successfully!");
    endZipping();
    setLoading2(false);
    onClose();
    // Only refresh if user is still on the same page/folder as when move started
    if (isStillOnListingPath(startedListing)) {
      refreshRootListingIfDestinationIsRoot(selectedPath);
      await onRenameSuccess?.();
    }
  } catch (error) {
    endZipping();
    console.error("wwwww: Error moving folder:", error);
    // Keep destination picker open so the user can pick another destination
    showToast(
      "error",
      getApiErrorMessage(error, "Failed to move folder. Please try again.")
    );
    setLoading2(false);
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
      {!loading2 && (
        <FolderDestinationModal
          variant="move-folder"
          title="Move folder"
          itemSummary={formatModalItemSummary(moveKey)}
          selectedPath={selectedPath}
          onClose={handleClose}
          onConfirm={handleMove}
          confirmLabel="Move here"
          confirmLoading={false}
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
            disabledFolderPaths={
              Array.isArray(moveKey) ? moveKey : moveKey ? [moveKey] : []
            }
          />
        </FolderDestinationModal>
      )}
      {zippingModal}
    </>
  );
}

export default MoveFolderPopup;
