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
import { handleS3CopyError } from "../utils/handleS3CopyError";
import { resolveSourceFolderAndKeys } from "../utils/movePath";
import {
  buildGetFolderParams,
  parseFolderListingItems,
  shouldUseGetFolderForListing,
} from "../utils/getFolderParams";
import { useZippingProgressModal } from "../hooks/useZippingProgressModal";
import { refreshRootListingIfDestinationIsRoot } from "../utils/rootListingRefresh";

function progressLabelFromItems(files, moveKey) {
  if (Array.isArray(files) && files.length > 1) {
    return `${files.length} files`;
  }
  const first =
    (Array.isArray(files) && files[0]) ||
    (Array.isArray(moveKey) ? moveKey[0] : moveKey) ||
    "";
  const raw =
    typeof first === "string"
      ? first
      : first?.fileName || first?.filePath || first?.path || "";
  return String(raw).replace(/\\/g, "/").split("/").filter(Boolean).pop() || "files";
}

function CopyFilePopup({ moveKey, source, onClose, files, fileSize, setTriggerUpdate, onCopySuccess, showToast }) {
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
  const [loading2, setLoading2] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const { beginZipping, endZipping, zippingModal } = useZippingProgressModal();

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

  const sharedParams = isSharedValue ? { shared: filenameRedux } : {};
  const copyPathOptions = {
    isShared: isSharedValue,
    sharedRoot: filenameRedux,
  };

  if (!Array.isArray(files)) {
    showToast("error", "No files selected to copy.");
    return;
  }

  // Resolve From before starting so we can lock From + To folders
  let adjustedSourceFolder = sourceFol;
  if (files.length > 0) {
    adjustedSourceFolder = resolveSourceFolderAndKeys(
      files,
      sourceFol,
      copyPathOptions
    ).sourceFolder;
  } else if (moveKey) {
    adjustedSourceFolder = resolveSourceFolderAndKeys(
      [moveKey],
      sourceFol,
      copyPathOptions
    ).sourceFolder;
  }

  setLoading2(true);
  beginZipping(progressLabelFromItems(files, moveKey), {
    mode: "copy",
    sourcePaths: [adjustedSourceFolder],
    destinationPath: selectedPath,
  });

  try {
    let copiedAnything = false;

    if (files.length > 0) {
      const resolved = resolveSourceFolderAndKeys(files, sourceFol, copyPathOptions);
      adjustedSourceFolder = resolved.sourceFolder;
      const apiFileKeys = resolved.keys;
      console.log("ddddd: copy payload:", adjustedSourceFolder, apiFileKeys);

      await axios.post(
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

      await axios.post(
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
      console.log("ddddd: Files1 source: ", adjustedSourceFolder);
      console.log("ddddd: Files1 destination: ", selectedPath);

      // Always refresh the current listing after copy (same as move).
      // NestedPage's triggerUpdate effect often no-ops without selectedFolder,
      // so onCopySuccess (reloadAfterTast / getFileData) is the reliable path.
      setTriggerUpdate?.((x) => x + 1);
      onCopySuccess?.();
      // User may have breadcrumbed to root while copy ran — NestedPage refresh is gone
      refreshRootListingIfDestinationIsRoot(selectedPath);

      showToast("success", "File(s) copied successfully!");
      endZipping();
      setLoading2(false);
      onClose();
    } else {
      endZipping();
      setLoading2(false);
    }
  } catch (error) {
    console.error("ddddd: Error copying file:", error);
    handleS3CopyError(error, showToast, "Failed to copy file. Please try again.");
    endZipping();
    setLoading2(false);
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
      {!loading2 && (
        <FolderDestinationModal
          variant="copy"
          title="Copy to"
          itemSummary={copyItemSummary}
          selectedPath={selectedPath}
          onClose={handleClose}
          onConfirm={handleMove}
          confirmLabel="Copy here"
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
            disabledFolderPaths={[sourceFol]}
          />
        </FolderDestinationModal>
      )}
      {zippingModal}
    </>
  );
}

export default CopyFilePopup;

