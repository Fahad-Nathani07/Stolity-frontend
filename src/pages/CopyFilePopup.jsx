import React, { useContext, useState, useEffect } from "react";
import { UploadContext } from "./UploadContext";
import { useSelector, useDispatch } from "react-redux";
import { FaCheckCircle } from "react-icons/fa"; //<FaCheckCircle />
import { BsXCircleFill } from "react-icons/bs"; // <BsXCircleFill />
import { IoIosInformationCircle } from "react-icons/io"; // <IoIosInformationCircle />
import { FaExclamationTriangle } from "react-icons/fa"; // <FaExclamationTriangle />
import {
  incrementFCounter,
  removeLastFolder,
  decrementFCounter,
  removeLastFolder2,
  resetFCounter,
  setLoader,
} from "../store/fileSlicer";
import { ChakraProvider, useToast } from "@chakra-ui/react";
import axios from "axios";
import Loader2 from "../components/Loader2";
import FolderPickerListPanel from "../components/FolderPickerListPanel";
import FolderDestinationModal, {
  formatModalItemSummary,
} from "../components/FolderDestinationModal";
import { handleS3CopyError } from "../utils/handleS3CopyError";
import { resolveSourceFolderAndKeys, normalizeMovePath } from "../utils/movePath";
import {
  buildGetFolderParams,
  parseFolderListingItems,
  shouldUseGetFolderForListing,
} from "../utils/getFolderParams";

function CopyFilePopup({ moveKey, source, onClose, files, fileSize, setTriggerUpdate, onCopySuccess, showToast }) {
  const { addUpload, updateUploadProgress, removeUpload } = useContext(UploadContext);
  const [locationPath, setLocationPath] = useState("");
  const apiUrl = process.env.REACT_APP_API_ENDPOINT;
  const token = sessionStorage.getItem("number");
  const [folders1, setFolders1] = useState([]);
  const [loadingFolders, setLoadingFolders] = useState(true);
  const filenameRedux = useSelector((state) => state.getdata.fileName);
  const isSharedValue = useSelector((state) => state.getdata.isSharedValue);
  const counter = useSelector((state) => state.getdata.folderCounter);
  const dispatch = useDispatch();
  const sourceFol = source.replace(/\/$/, "");
  const [selectedPath, setSelectedPath] = useState("");
  const [progress, setProgress] = useState(0);
  const [loading2, setLoading2] = useState(false);
  const toast = useToast();
  const [newFolderName, setNewFolderName] = useState("");
const [creatingFolder, setCreatingFolder] = useState(false);

  useEffect(() => {
    dispatch(resetFCounter());
    fetchFolders("");
  }, []);

  const fetchFolders = async (folderPath = "") => {
    setLoadingFolders(true);
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
    } finally {
      setLoadingFolders(false);
    }
  };

  function getTextAfterSlashes(text, counter) {
    const parts = text.split("/");
    if (counter >= parts.length) {
      return parts[parts.length - 1];
    }
    return parts.slice(counter).join("/");
  }

  // const handleItemClick = async (path) => {
  //   try {
  //     const params = {
  //       folderPath: path,
  //       ...(isSharedValue && { shared: filenameRedux }),
  //     };

  //     const res = await axios.get(`${apiUrl}getFolder`, {
  //       params,
  //       headers: { Authorization: `Bearer ${token}` },
  //     });

  //     const folders = res.data.filter(
  //       (item) => item?.isFolder === true || item?.isFolder === "true"
  //     );
  //     setLocationPath((prev) => {
  //       if (prev) {
  //         return `${prev} / ${getTextAfterSlashes(path, counter)}`;
  //       } else {
  //         return getTextAfterSlashes(path, counter);
  //       }
  //     });
  //     setFolders1(folders);
  //     setSelectedPath(path);
  //     dispatch(incrementFCounter());
  //   } catch (error) {
  //     console.error("Error fetching folder data:", error);
  //   }
  // };


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
      if (prev) {
        return `${prev} / ${getTextAfterSlashes(path, counter)}`;
      } else {
        return getTextAfterSlashes(path, counter);
      }
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


  const specialUserFlag = useSelector((state) => state.subscription.specialUserFlag);
  const subscription = useSelector((state) => state.subscription.subscription);
  const folderSize = useSelector((state) => state.subscription.folderSize);



const handleMove = async () => {
  console.log("ddddd: handleMove called");
  console.log("ddddd: moveKey", moveKey);
  console.log("ddddd: fileSize string:", fileSize);

  function parseStorageToBytes(storageStr) {
    if (!storageStr) return 0;
    const [valueStr, unit] = storageStr.split(" ");
    const value = parseFloat(valueStr);
    const units = { KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3, TB: 1024 ** 4 };
    return value * (units[unit] || 1);
  }

  console.log("ddddd: specialUserFlag:", specialUserFlag);
  console.log("ddddd: subscription:", subscription);
  console.log("ddddd: folderSize:", folderSize);

  const totalBytes = specialUserFlag
    ? 500 * 1024 ** 3
    : (subscription && subscription.storage
        ? parseStorageToBytes(subscription.storage)
        : 5 * 1024 ** 3);
  console.log("ddddd: totalBytes:", totalBytes);

  const usedBytes = folderSize ? folderSize.sizeInBytes : 0;
  console.log("ddddd: usedBytes:", usedBytes);

  const remainingBytes = totalBytes - usedBytes;
  console.log("ddddd: remainingBytes:", remainingBytes);

  const totalSelectedSize = parseStorageToBytes(fileSize);
  console.log("ddddd: totalSelectedSize (from fileSize):", totalSelectedSize);

  if (!isSharedValue && remainingBytes < totalSelectedSize) {
    console.log("ddddd: Not enough storage space");
    showToast("error", "Not enough storage space to copy these files.");
    return;
  }

  console.log("ddddd: Enough storage space, proceeding with copy");

  // Local loading for this copy modal
  setLoading2(true);

  dispatch(setLoader(true));
  setProgress(0);

  try {
    const sharedParams = isSharedValue ? { shared: filenameRedux } : {};
    const copyPathOptions = {
      isShared: isSharedValue,
      sharedRoot: filenameRedux,
    };

    if (!Array.isArray(files)) {
      throw new Error("files is not an array");
    }

    let copiedAnything = false;
    let adjustedSourceFolder = "";

    if (files.length > 0) {
      const resolved = resolveSourceFolderAndKeys(files, sourceFol, copyPathOptions);
      adjustedSourceFolder = resolved.sourceFolder;
      const apiFileKeys = resolved.keys;
      console.log("ddddd: copy payload:", adjustedSourceFolder, apiFileKeys);

      const res = await axios.post(
        `${apiUrl}copy-file`,
        {
          destinationFolder: selectedPath,
          sourceFolder: adjustedSourceFolder,
          keys: apiFileKeys,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          params: sharedParams,
        }
      );
      copiedAnything = true;
    }

    if (moveKey) {
      const resolved = resolveSourceFolderAndKeys(
        [moveKey],
        sourceFol,
        copyPathOptions
      );
      adjustedSourceFolder = resolved.sourceFolder;
      const apiFileKeys = resolved.keys;
      console.log("ddddd: single copy payload:", adjustedSourceFolder, apiFileKeys);

      const res = await axios.post(
        `${apiUrl}copy-file`,
        {
          destinationFolder: selectedPath,
          sourceFolder: adjustedSourceFolder,
          keys: apiFileKeys,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          params: sharedParams,
        }
      );
      copiedAnything = true;
    }

    if (copiedAnything) {
      console.log("ddddd: Files copied successfully");
      setProgress(100);
      console.log("ddddd: Files1 source: ", adjustedSourceFolder);
      console.log("ddddd: Files1 destination: ", selectedPath);

      const destFolder = normalizeMovePath(selectedPath ?? "", copyPathOptions);
      const viewingFolder = normalizeMovePath(sourceFol, copyPathOptions);
      const shouldRefreshView = destFolder === viewingFolder;

      if (shouldRefreshView) {
        setTriggerUpdate?.((x) => x + 1);
        onCopySuccess?.();
      }

      showToast("success", "File(s) copied successfully!");
      setTimeout(() => {
        setLoading2(false);
        dispatch(setLoader(false));
        onClose();
      }, 400);
    } else {
      setLoading2(false);
      dispatch(setLoader(false));
    }
  } catch (error) {
    console.error("ddddd: Error copying file:", error);
    handleS3CopyError(error, showToast, "Failed to copy file. Please try again.");
    setProgress(0);
    setLoading2(false);
    dispatch(setLoader(false));
  }
};


const handleCreateFolder = async () => {
  if (!newFolderName.trim()) {
    showToast("warning", "Please enter folder name");
    return;
  }

  try {
    setCreatingFolder(true);

    // If inside folder → append path
    const folderPath = selectedPath
      ? `${selectedPath}/${newFolderName}`
      : newFolderName;

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

    // 🔥 Refresh current folder
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



  const handleClose = () => {
    dispatch(resetFCounter());
    onClose();
  };

  const handleRootClick = () => {
    setLocationPath("");
    setSelectedPath("");
    fetchFolders("");
  };

  const copyItemSummary = formatModalItemSummary(
    files?.length ? files : moveKey
  );

  return (
    <>
      <FolderDestinationModal
        variant="copy"
        title="Copy to"
        itemSummary={copyItemSummary}
        selectedPath={selectedPath}
        onClose={handleClose}
        onConfirm={handleMove}
        confirmLabel="Copy here"
        confirmLoading={loading2}
        locationPath={locationPath}
        counter={counter}
        onRootClick={handleRootClick}
        onBack={handleBack}
        newFolderName={newFolderName}
        onNewFolderNameChange={setNewFolderName}
        onCreateFolder={handleCreateFolder}
        creatingFolder={creatingFolder}
        footerExtra={
          progress > 0 ? (
            <div className="fdm-progress">
              <div className="fdm-progress-track">
                <div
                  className="fdm-progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : null
        }
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

export default CopyFilePopup;

