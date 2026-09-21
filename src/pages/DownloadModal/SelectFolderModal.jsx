import React, { useState, useEffect } from "react";

import { useSelector } from "react-redux";
import axios from "axios";
import FolderPickerListPanel from "../../components/FolderPickerListPanel";
import FolderDestinationModal, {
  formatModalItemSummary,
} from "../../components/FolderDestinationModal";
import { buildGetFolderParams, parseFolderListingItems } from "../../utils/getFolderParams";
import { fetchFolderListing } from "../../utils/fetchFolderListing";
import { showToast } from "../../components/ToastProvider";

function resolvePickerMode(selectedFile) {
  if (selectedFile == null) {
    return "download";
  }
  if (selectedFile?.fileType === "zip") {
    return "unzip";
  }
  return "zip";
}

const MODE_COPY = {
  download: {
    title: "Download to",
    confirmLabel: "Download here",
  },
  unzip: {
    title: "Unzip to",
    confirmLabel: "Unzip here",
  },
  zip: {
    title: "Zip to",
    confirmLabel: "Zip here",
  },
};

function SelectFolderModal({ onClose, onSelect, selectedFile, fileName }) {
  const apiUrl = process.env.REACT_APP_API_ENDPOINT;
  const token = sessionStorage.getItem("number");
const isSharedValue = useSelector((state) => state.getdata.isSharedValue);
  const filenameRedux = useSelector((state) => state.getdata.fileName);

  const mode = resolvePickerMode(selectedFile);
  const modeCopy = MODE_COPY[mode];

  const [folders1, setFolders1] = useState([]);
  const [locationPath, setLocationPath] = useState("");
  const [selectedPath, setSelectedPath] = useState("");
  const [counter, setCounter] = useState(0);
  const [loadingFolders, setLoadingFolders] = useState(true);
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);

  useEffect(() => {
    fetchFolders("");
  }, []);

  const fetchFolders = async (folderPath = "") => {
    setLoadingFolders(true);
    try {
      const folders = await fetchFolderListing({
        apiUrl,
        token,
        folderPath,
        isShared: isSharedValue,
        sharedRoot: filenameRedux,
      });
      setFolders1(folders);
    } catch (error) {
      console.error("Error fetching folders:", error);
      setFolders1([]);
    } finally {
      setLoadingFolders(false);
    }
  };

  function getTextAfterSlashes(text, depth) {
    const parts = String(text || "").split("/");
    if (depth >= parts.length) {
      return parts[parts.length - 1];
    }
    return parts.slice(depth).join("/");
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
        if (prev) {
          return `${prev} / ${getTextAfterSlashes(path, counter)}`;
        }
        return getTextAfterSlashes(path, counter);
      });
      setFolders1(folders);
      setSelectedPath(path);
      setCounter((prev) => prev + 1);
    } catch (error) {
      console.error("Error fetching folder data:", error);
    } finally {
      setLoadingFolders(false);
    }
  };

  const handleBack = () => {
    setLocationPath((prev) => {
      if (!prev.includes(" / ")) return "";
      return prev.substring(0, prev.lastIndexOf(" / "));
    });

    const parentPath = selectedPath?.includes("/")
      ? selectedPath.replace(/\/[^/]+$/, "")
      : "";
    setSelectedPath(parentPath);
    setCounter((prev) => Math.max(0, prev - 1));
    fetchFolders(parentPath);
  };

  const handleRootClick = () => {
    setLocationPath("");
    setSelectedPath("");
    setCounter(0);
    fetchFolders("");
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
      const folderPath = selectedPath ? `${selectedPath}/${cleanName}` : cleanName;

      await axios.post(
        `${apiUrl}create-folder`,
        { folderName: folderPath },
        {
          headers: { Authorization: `Bearer ${token}` },
          ...(isSharedValue && {
            params: { shared: filenameRedux },
          }),
        }
      );

      showToast("success", "Folder created successfully");
      setNewFolderName("");
      fetchFolders(selectedPath || "");
    } catch (error) {
      console.error("Create folder error:", error);
      showToast("error", "Failed to create folder");
    } finally {
      setCreatingFolder(false);
    }
  };

  const handleConfirm = () => {
    onSelect(selectedPath || "");
    onClose();
  };

  const itemSummary = formatModalItemSummary(
    selectedFile?.fileName || selectedFile?.name || fileName || "file"
  );

  return (
    <>
<FolderDestinationModal
        variant={mode}
        title={modeCopy.title}
        itemSummary={itemSummary}
        selectedPath={selectedPath}
        onClose={onClose}
        onConfirm={handleConfirm}
        confirmLabel={modeCopy.confirmLabel}
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
    </>
  );
}

export default SelectFolderModal;
