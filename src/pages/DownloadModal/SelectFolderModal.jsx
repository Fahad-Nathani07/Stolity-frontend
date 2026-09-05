import React, { useState, useEffect } from "react";
import { ChakraProvider, useToast } from "@chakra-ui/react";
import { useSelector } from "react-redux";
import axios from "axios";
import { FaCheckCircle } from "react-icons/fa";
import { BsXCircleFill } from "react-icons/bs";
import { IoIosInformationCircle } from "react-icons/io";
import { FaExclamationTriangle } from "react-icons/fa";
import FolderPickerListPanel from "../../components/FolderPickerListPanel";
import FolderDestinationModal, {
  formatModalItemSummary,
} from "../../components/FolderDestinationModal";
import { buildGetFolderParams, parseFolderListingItems } from "../../utils/getFolderParams";
import { fetchFolderListing } from "../../utils/fetchFolderListing";

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
  const toast = useToast();
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

  const iconMap = {
    success: FaCheckCircle,
    error: BsXCircleFill,
    info: IoIosInformationCircle,
    warning: FaExclamationTriangle,
  };

  const getStatusColors = (status) => ({
    bg: "rgba(255, 255, 255, 0.85)",
    border:
      status === "success"
        ? "rgba(16, 185, 129, 0.3)"
        : status === "error"
          ? "rgba(239, 68, 68, 0.3)"
          : status === "info"
            ? "rgba(59, 130, 246, 0.3)"
            : "rgba(245, 158, 11, 0.3)",
    icon:
      status === "success"
        ? "#10b981"
        : status === "error"
          ? "#ef4444"
          : status === "info"
            ? "#3b82f6"
            : "#f59e0b",
  });

  const showToast = (status, message) => {
    const IconComponent = iconMap[status];
    const colors = getStatusColors(status);

    toast({
      position: "bottom-right",
      duration: 4000,
      isClosable: true,
      render: () => (
        <div
          className="premium-toast"
          style={{
            background: `linear-gradient(135deg, ${colors.bg}, rgba(255,255,255,0.9))`,
            backdropFilter: "blur(20px)",
            border: `2px solid ${colors.border}`,
            borderRadius: "16px",
            boxShadow:
              "0 25px 50px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.05)",
            padding: "20px",
            maxWidth: "720px",
            fontFamily:
              "'SF Pro', 'SFProText', -apple-system, BlinkMacSystemFont, sans-serif",
            animation: "toastSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
            <IconComponent
              style={{
                width: "24px",
                height: "24px",
                color: colors.icon,
                flexShrink: 0,
                marginTop: "2px",
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#1f2937",
                  marginBottom: "4px",
                  lineHeight: 1.3,
                }}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </div>
              <div
                style={{
                  fontSize: "14px",
                  color: "#6b7280",
                  lineHeight: 1.4,
                }}
              >
                {message}
              </div>
            </div>
            <button
              type="button"
              style={{
                background: "none",
                border: "none",
                padding: "4px",
                cursor: "pointer",
                color: "#9ca3af",
                borderRadius: "4px",
                opacity: 0.7,
                transition: "all 0.2s",
              }}
              onClick={() => toast.closeAll()}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = 1;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = 0.7;
              }}
            >
              ✕
            </button>
          </div>
        </div>
      ),
    });
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
      <ChakraProvider />
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
