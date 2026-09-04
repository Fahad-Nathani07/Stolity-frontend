import React, {
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { DownloadContext } from "./DownloadContext";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import Logo from "../images/logo.png";
import AvatarDefault from "../images/AvatarDefault.jpg";
import sharedIcon from "../images/shared_icon.svg";
import { resolveFileIconPath } from "../utils/fileIcon";
import { afterMinLoaderDisplay } from "../utils/actionLoaderDelay";
import { buildFileStreamUrl, preloadStreamedImage } from "../utils/fileStream";
import EmptyFilesState from "../components/EmptyFilesState";
import SortByDropdown from "../components/SortByDropdown";
import { gatePremiumSort } from "../utils/premiumSort";
import "../css/FilesToolbar.css";
import "../css/FolderDestModalViewport.css";
import CardFilePreview from "../components/CardFilePreview";
import FilesPaginationFooter from "../components/FilesPaginationFooter";
import { useStickyListHeader } from "../hooks/useStickyListHeader";
import { getBulkRowActionToggleProps } from "../utils/bulkSelectionRowActions";
import BulkSelectionToolbar from "../components/BulkSelectionToolbar";
import FolderDestinationModal, {
  formatModalItemSummary,
} from "../components/FolderDestinationModal";
import FolderPickerListPanel from "../components/FolderPickerListPanel";
import { useSessionEndCleanup } from "../hooks/useSessionEndCleanup";
import useListPageSize from "../hooks/useListPageSize";
import useFileSearch from "../hooks/useFileSearch";
import fullscreeen from "../images/mediaPlayer/fullscreen.svg";
import zoomin from "../images/mediaPlayer/add-button.svg";
import zoomout from "../images/mediaPlayer/subtracting-button.svg";
import deleteIcon from "../images/mediaPlayer/trash1.svg";
import svgCrown from "../images/crown.svg"
import IconFolder from "../images/folder.svg";
import IconHome from "../images/Grid.svg";
import IconList from "../images/list.svg";
import IconHomeW from "../images/GridWhite.svg";
import IconListW from "../images/listWhite.svg";
import DeletePopup from "../images/deletePopup.svg";
import SortHome from "../images/SortHome.svg";
import FilterHome from "../images/filterHome.svg";
import SortIcon from "../images/sort-style-1.svg";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import deleteIcon2 from "../images/DropdownIcons/deleteIcon.svg";
import loaderGif from "../images/Loaders/Animation4.gif";
import Dropzone from "react-dropzone";
import createFolderPopup from "../images/createFolderPopup.svg";
import StarIcon from "@mui/icons-material/Star"; // Filled star
import restoreIcon from "../images/DropdownIcons/MoveIcon.svg"; // Temporary - replace with actual restore icon later
import { fetchUserFolderSize } from "../store/subscriptionSlice";
import svgDoc from "../images/TypesDoc.svg"
import svgFolder from "../images/TypesFolder.svg"



import { FaCheckCircle } from "react-icons/fa"; //<FaCheckCircle />
import { BsXCircleFill } from "react-icons/bs"; // <BsXCircleFill />
import { IoIosInformationCircle } from "react-icons/io"; // <IoIosInformationCircle />
import { FaExclamationTriangle } from "react-icons/fa"; // <FaExclamationTriangle />



import SearchIcon from "../images/SearchIcon.svg";
import {
  Tooltip,
  Whisper,
  SelectPicker,
  Dropdown,
  Modal,
  Popover,
  Placeholder,
  Button,
} from "rsuite";
import "rsuite/Tooltip/styles/index.css";
import "rsuite/SelectPicker/styles/index.css";
import "rsuite/dist/rsuite.min.css";
import { useDropzone } from "react-dropzone";
import { UploadContext } from "./UploadContext";
import { Modal as BootstrapModal } from "react-bootstrap";
import { ChakraProvider, Stack, useToast } from "@chakra-ui/react";
import VideoPlayer from "../components/VideoPlayer";
import { buildVideoStreamUrl } from "../utils/videoPlayer";
import SideNav from "../components/SideNav";
import Footer from "../components/Footer";
import ToggleNav from "../components/ToggleNav";

//LIGHTBOX
import { Lightbox } from "yet-another-react-lightbox";
import MoveFilePopup from "./MoveFilePopup";
import MoveFolderPopup from "./MoveFolderPopup";
import CopyFilePopup from "./CopyFilePopup";
import "yet-another-react-lightbox/styles.css";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Video from "yet-another-react-lightbox/plugins/video";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/plugins/captions.css";
import BackgroundImageFileUpload from "../images/Background.svg";
import UploadIcon from "../images/UploadIcon.svg";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import {
  addToken,
  addFolder,
  resetUserData,
  resetCounter,
  incrementCounter,
  setFolderPath,
  incrementFCounter,
  resetFolderList,
  addNewFolder,
  setIsSharedValue,
  setParentFolderName,
  setIsSharedFalse,
  setLoader,
} from "../store/fileSlicer";
import { isAudioExtension } from "../utils/audioPlayer";
import DownloadModal from "./DownloadModal/DownloadModal";
import SelectFolderModal from "./DownloadModal/SelectFolderModal";
import FileConversionModal from "../components/FileConversionModal";
import LoaderRestore from "../components/LoaderRestore";
import LoaderPermanentDelete from "../components/LoaderPermanentDelete";

let c = 1;

//Anurag Imports



const RecycleBin = () => {
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
 

    const [loader_Permanent_Delete, setLoader_Permanent_Delete] = useState(false);
    const [loader_Restore, setLoader_Restore] = useState(false);

  const loader = useSelector((state) => state.getdata.loading);

  const [newFolderName, setNewFolderName] = useState("");
const [creatingFolder, setCreatingFolder] = useState(false);


  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

   const subscription = useSelector((state) => state.subscription.subscription);
  const folderSize = useSelector((state) => state.subscription.folderSize);
  
    const isPremium =
      !!subscription &&
      Array.isArray(subscription.entitlement_ids) &&
      subscription.entitlement_ids.length > 0;

  



  // const { addUpload, updateUploadProgress, removeUpload } = useContext(UploadContext);
  // const { addUpload, updateUploadProgress, updateUploadMeta, removeUpload, abortUpload } = useContext(UploadContext);
  

  const {
  addUpload,
  updateUploadProgress,
  updateUploadMeta,
  removeUpload,
  abortUpload,
  pauseUpload,
  resumeUpload,
  getUpload,
  isPausing, // <-- new
} = useContext(UploadContext);




  //Anurag Declaration
  const token = sessionStorage.getItem("number");
  const [selectedFilter, setSelectedFilter] = useState("Sort By");
  const prevPageRef = useRef();
  const [isVisibility, setIsVisibility] = useState(false);
  const [visiKey, setVisiKey] = useState("");
  const [errorMessage2, setErrorMessage2] = useState("");

  const [nameOfFolder, setNameOfFolder] = useState("");
  const [lastFileCount, setLastFileCount] = useState(10);
  const [startIndex, setStartIndex] = useState(0);
  const dispatch = useDispatch();
  const [rootsize, setRootSize] = useState("");
  const [currentFile, setCurrentFile] = useState({});
  const [isOpen, setIsOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [videoSrc, setVideoSrc] = useState("");
  const [isProgressVisible, setIsProgressVisible] = useState(false);

  

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [folderFieldError, setFolderFieldError] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const [modalKeys, setModalKeys] = useState([]);


  // Access denied modal state
const [showAccessDeniedModal, setShowAccessDeniedModal] = useState(false);
const [fileToAccess, setFileToAccess] = useState(null);

const [showMultiRestoreModal, setShowMultiRestoreModal] = useState(false);



  const [isVideo, setisVideo] = useState(false);
  const [audioSrc, setAudioSrc] = useState("");
  const [isAudio, setIsAudio] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [showFTPopup, setShowFTPopup] = useState(false);
  const fileTypeDropdownRef = useRef(null);
  const [customExtInput, setCustomExtInput] = useState("");
  const [entriesnum, setEntriesnum] = useState(0);
  const nav = useNavigate();
  const userProfile = useSelector((state) => state.userProfile);
  const avatarUrl = userProfile.avatar || sessionStorage.getItem("avatar");
  const name = userProfile.name || sessionStorage.getItem("name");
  const userData = (() => {
    try {
      return JSON.parse(sessionStorage.getItem("userData"));
    } catch {
      return null;
    }
  })();

  useEffect(() => {
    const token = sessionStorage.getItem("number");
    // console.log("token", token);
    if (!token) {
      alert("Session expired. Please login again.");
      nav("/Login");
    }
  }, [nav]);

  const [pdfSrc, setPdfSrc] = useState("");
  const [isPdf, setIsPdf] = useState(false);
  const [folderList, setFolderList] = useState([]);
  const [movedFol, setMovedFol] = useState("");
  const [pubpri2, setPubPri2] = useState("private");
  const [pubpri3, setPubPri3] = useState("private");
  const [imageArray, setImageArray] = useState([]);

  const [isCWhisperClicked, setIsCWhisperClicked] = useState(false);
  const [copiedFile, setCopiedFile] = useState("");
  const [selectedFile, setSelectedFile] = useState(null); // Store the file to download
  const [progress, setProgress] = useState(0); // Track download progress
  const cancelToken = useRef(null); // Ref for cancel token
  const [loading, isSetLoading] = useState(false);
  const [downloadLink, setDownloadLink] = useState(null);
  const [modalFile, setModalFile] = useState("");


  const [openingFolder, setOpeningFolder] = useState(null);



  const [sharePopup, setSharepopup] = useState(false);
  const [shareLink, setShareLink] = useState("");

  const [isCommon, setIsCommon] = useState(false);
  const [fn, setFn] = useState("");
  const apiUrl = process.env.REACT_APP_API_ENDPOINT;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [infoShower, setInfoShower] = useState(false);
  const [placeholderLoading, setPlaceholderLoading] = useState(true);
  const [fileInfo, setFileInfo] = useState({
    fileName: "",
    fileSize: "",
    fileType: "",
    fileUrl: "",
    uploadDateTime: "",
    fileIcon: "",
  });
  const [show, setShow] = useState(false);
  const [showImage, setShowImage] = useState(false);
  const [codePopup, setCodePopup] = useState(false);

  useEffect(() => {
    const lockScroll = () => {
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
    };

    const unlockScroll = () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    };

    if (showImage || codePopup) {
      lockScroll();
    } else {
      unlockScroll();
    }

    return () => unlockScroll(); // cleanup
  }, [showImage, codePopup]);

  const [endIndex, setEndIndex] = useState(0);
  const [filedata, setFileData] = useState([]);
  const [allEntries, setAllEntries] = useState([]); // This holds all data permanently
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useListPageSize();
  const [totalEntries, setTotalEntries] = useState(0);


    const email = sessionStorage.getItem("email");
    const { role, companies: assignedCompanyIds } = useSelector(
        (state) => state.jobPortal
      );
  


  // Restore modal states
// Restore modal states
const [showRestoreModal, setShowRestoreModal] = useState(false);
const [fileToRestore, setFileToRestore] = useState(null);
const [currentFolders, setCurrentFolders] = useState([]); // Current level folders
const [selectedDestination, setSelectedDestination] = useState("");
const [loadingFolders, setLoadingFolders] = useState(false);
const [folderNavigationPath, setFolderNavigationPath] = useState([]); // Breadcrumb path


const [showRestoreFolderModal, setShowRestoreFolderModal] = useState(false);
const [showMultiRestoreConfirm, setShowMultiRestoreConfirm] = useState(false);

const [folderToRestore, setFolderToRestore] = useState(null);






  const [sortedData, setSortedData] = useState([]); // Stores sorted results




  // *************** File Conversion *************** // 
  
  const [showConversionModal, setShowConversionModal] = useState(false);
  const [convertedFiles, setConvertedFiles] = useState([]);


  const handleFilesConverted = (updatedFiles) => {
    setFiles(updatedFiles);
    setConvertedFiles(updatedFiles);
    setShowConversionModal(false);
  };





  const totalPages = Math.ceil(totalEntries / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalEntries);
  const isNextPage = currentPage < totalPages;



  

  // useEffect(() => {
  //   getFileData(); // Initial load
  //   // console.log("On root page!!!!!!!");
  //   dispatch(setIsSharedFalse());
  // }, []);


  useEffect(() => {
  const fetchData = async () => {
    setPlaceholderLoading(true); // Start loading

    try {
      await getFileData(); // Initial load
      console.log("On root page!!!!!!!");
      setPlaceholderLoading(false); // End loading
      dispatch(setIsSharedFalse());
    } catch (error) {
      console.log("Error in useEffect:", error);
    } finally {
      // setPlaceholderLoading(false); // End loading
    }
  };

  fetchData();
}, []);


  // useEffect(() => {
  //   // Whenever currentPage or itemsPerPage changes, update displayed data
  //   const startIndex = (currentPage - 1) * itemsPerPage;
  //   const endIndex = startIndex + itemsPerPage;
  //   const slicedData = allEntries.slice(startIndex, endIndex);
  //   setFileData(slicedData);
  // }, [currentPage, itemsPerPage, allEntries]);
  
  const fileTypes = ["pdf", "jpg", "jpeg", "png", "mov", "mp3", "mp4", "zip"];
  const [selectedFileTypes, setSelectedFileTypes] = useState([]);

  const getFileIcon = (file) =>
    resolveFileIconPath(file, {
      sharedIconSrc: sharedIcon,
    });

  useEffect(() => {
    if (!showFTPopup) return;
    const handleOutside = (e) => {
      const target = e.target;
      if (!fileTypeDropdownRef.current) return;
      if (fileTypeDropdownRef.current.contains(target)) return;
      setShowFTPopup(false);
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [showFTPopup]);

useEffect(() => {
  // Use sortedData if available, otherwise use allEntries
  const dataSource =
    sortedData.length > 0 || (sortedData.length === 0 && selectedFileTypes.length > 0)
      ? sortedData
      : allEntries;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const slicedData = dataSource.slice(startIndex, endIndex);
  setFileData(slicedData);
}, [currentPage, itemsPerPage, allEntries, sortedData, selectedFileTypes]);



  
  const handleImageClose = () => {
    // console.log("Close button clicked!");

    // Exit fullscreen if currently in fullscreen mode
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }

    setIsFullscreen(false); // Reset fullscreen state
    setZoomLevel(1); // Reset zoom level to default
    setShowImage(false);
    setCurrentImageIndex(0);
    setImageSrc("");
    setVideoSrc("");
    setAudioSrc("");
    setPdfSrc("");
  };

  const [selectStatus, setSelectStatus] = useState(false);
  const [selectStatus2, setSelectStatus2] = useState(false);
  const [checkedFiles, setCheckedFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [keys, setKeys] = useState([]);
  const [keys2, setKeys2] = useState([]);
  const hasBulkSelection = keys.length > 0 || keys2.length > 0;

  const [moveFol, setMoveFol] = useState(false);

  const [view, setView] = useState(localStorage.getItem("view") || "list");
  const { filterBarRef, tableBoxRef, tableBoxClassName } = useStickyListHeader(view, hasBulkSelection);

  const toggleView = (selectedView) => {
    setView(selectedView);
    localStorage.setItem("view", selectedView); // Save selection in localStorage
  };

  const runOnce = useRef(false);

  //Move File code

  
  // Copy File code

  const handleCClose = () => {
    dispatch(resetFolderList());
    setIsCWhisperClicked(false);
    setKeys([]);
  };


  //Checkbox code
  const [isSelectAll, setIsSelectAll] = useState(false);

const handleCheckboxChange = (file) => {
  // console.log("ggggg handleCheckboxChange called with file:", file);

  if (file.isFolder) {
    // If the file is a folder, update the keys2 list
    setKeys2((prevKeys2) => {
      const isChecked = prevKeys2.includes(file.fileName);
      const newKeys2 = isChecked
        ? prevKeys2.filter((f) => f !== file.fileName)
        : [...prevKeys2, file.fileName];

      // console.log("ggggg (folder) prevKeys2:", prevKeys2);
      // console.log("ggggg (folder) isChecked:", isChecked);
      console.log("ggggg (folder) newKeys2:", newKeys2);

      return newKeys2;
    });
  } else {
    // If the file is not a folder, update the keys list
    setKeys((prevKeys) => {
      const isChecked = prevKeys.includes(file.fileName);
      const newKeys = isChecked
        ? prevKeys.filter((f) => f !== file.fileName)
        : [...prevKeys, file.fileName];

      console.log("ggggg (file) newKeys:", newKeys);

      return newKeys;
    });
  }
};

  /** When any row is selected, row clicks toggle selection instead of open */
  const trySelectInsteadOfOpen = (file) => {
    if (keys.length === 0 && keys2.length === 0) return false;
    if (file.fileName === "blackbox" || file.isShared) return true;
    handleCheckboxChange(file);
    return true;
  };


  const handleSelectAllToggle = () => {
    if (!isSelectAll) {
      // Select all - preserve existing selections and add all other items
      const allFiles = filedata
        .filter((file) => !file.isFolder)
        .map((file) => file.fileName);
      const allFolders = filedata
        .filter((file) => file.isFolder)
        .map((file) => file.fileName);

      setKeys((prevKeys) => [...new Set([...prevKeys, ...allFiles])]);
      setKeys2((prevKeys2) => [...new Set([...prevKeys2, ...allFolders])]);
    } else {
      // Deselect all
      setKeys([]);
      setKeys2([]);
    }
    setIsSelectAll(!isSelectAll);
  };

  useEffect(() => {
    // Check if all files and folders are selected
    const allFiles = filedata
      .filter((file) => !file.isFolder)
      .map((file) => file.fileName);
    const allFolders = filedata
      .filter((file) => file.isFolder)
      .map((file) => file.fileName);

    const areAllFilesSelected = allFiles.every((file) => keys.includes(file));
    const areAllFoldersSelected = allFolders.every((folder) =>
      keys2.includes(folder)
    );

    // Update the isSelectAll state
    setIsSelectAll(areAllFilesSelected && areAllFoldersSelected);
  }, [keys, keys2, filedata]);



const handleMulDelete = async () => {
  const loaderStartedAt = Date.now();
  setLoader_Permanent_Delete(true); // ← start global permanent delete loader

  try {
    // Optional: keep this guard if you still want to block shared folder permanent delete
    const hasSharedFolders = filedata.some(
      (file) => file.isShared && keys2.includes(file.fileName)
    );

    if (hasSharedFolders) {
      showToast("error", "Shared folders cannot be permanently deleted.");
      setLoader_Permanent_Delete(false);
      return;
    }

    // ────────────────────────────────────────────────
    // 1. Permanent delete FILES (from recycle bin)
    // ────────────────────────────────────────────────
    if (keys.length > 0) {
      const dataToSend = {
        keys: keys,               // these should be the original file keys/names
        fromRecycleBin: true,
      };

      await axios.delete(`${apiUrl}delete-file`, {
        data: dataToSend,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
    }

    // ────────────────────────────────────────────────
    // 2. Permanent delete FOLDERS (from recycle bin)
    // ────────────────────────────────────────────────
    if (keys2.length > 0) {
      // Assuming your backend now expects the same format as single delete
      await axios.delete(`${apiUrl}delete-folder`, {
        data: {
          folderName: keys2.map(checkLastHash), // ← apply same transformation as single delete
          fromRecycleBin: true,
        },
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
    }

    // ────────────────────────────────────────────────
    // Success path
    // ────────────────────────────────────────────────
    const deletedCount = keys.length + keys2.length;
    const message =
      deletedCount === 1
        ? "Item permanently deleted"
        : "Items permanently deleted";

    // Refresh everything
    getLatestFolderList();
    setIsSelectAll(false);
    setSelectStatus(false);
    getFileData(1);
    setCurrentPage(1);
    getRootFolderSize();
    setKeys([]);
    setKeys2([]);

    // Delayed stop loader + toast (matching your single delete UX)
    afterMinLoaderDisplay(loaderStartedAt, () => {
      setLoader_Permanent_Delete(false);
      showToast("success", message);
    });

  } catch (error) {
    console.error("Multi permanent delete failed:", error);

    showToast(
      "error",
      error?.response?.data?.message || "Error during permanent deletion"
    );

    afterMinLoaderDisplay(loaderStartedAt, () => {
      setLoader_Permanent_Delete(false);
    });
  }
};


// function parseStorageToBytes(storageStr) {
//   if (!storageStr) return 0;
//   const [value, unit] = storageStr.split(" ");
//   const units = { KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3, TB: 1024 ** 4 };
//   return parseFloat(value) * (units[unit] || 1);
// }


// const totalBytes = subscription && subscription.storage
//   ? parseStorageToBytes(subscription.storage)
//   : 5 * 1024 ** 3;

// const usedBytes = folderSize ? folderSize.sizeInBytes : 0;
// const remainingBytes = totalBytes - usedBytes;

// const currentFileSizeBytes = fileToRestore?.fileSize ? parseStorageToBytes(fileToRestore.fileSize) : 0;
// const currentFileSizeGB = (currentFileSizeBytes / 1024 ** 3).toFixed(2);
// const isSizeExceeded = currentFileSizeBytes > remainingBytes;

function parseStorageToBytes(storageStr) {
  if (!storageStr) return 0;

  // More robust parsing (handles extra spaces, case insensitivity)
  const parts = storageStr.trim().split(/\s+/);
  if (parts.length < 2) return 0;

  const value = parseFloat(parts[0]);
  if (isNaN(value)) return 0;

  const unit = parts[1].toUpperCase();

  const units = {
    KB: 1000,
    MB: 1000 ** 2,          // 1_000_000
    GB: 1000 ** 3,          // 1_000_000_000
    TB: 1000 ** 4,          // 1_000_000_000_000
    // PB: 1000 ** 5,       // optional – add if needed
  };

  const multiplier = units[unit] || 1;
  return Math.round(value * multiplier);  // avoid floating-point drift
}

const totalBytes = subscription && subscription.storage
  ? parseStorageToBytes(subscription.storage)
  : 5 * 1_000_000_000;                    // default 5 GB in decimal bytes

const usedBytes = folderSize ? folderSize.sizeInBytes : 0;
const remainingBytes = totalBytes - usedBytes;

const currentFileSizeBytes = fileToRestore?.fileSize 
  ? parseStorageToBytes(fileToRestore.fileSize) 
  : 0;

// Changed to decimal GB (matches API style and user expectation)
const currentFileSizeGB = (currentFileSizeBytes / 1_000_000_000).toFixed(2);

const isSizeExceeded = currentFileSizeBytes > remainingBytes;

// 2. Format function - returns { value: number, unit: string }
function formatFileSize(bytes) {
  if (bytes === 0) return { value: 0, unit: 'KB' };

  const kb = bytes / 1000;
  const mb = kb / 1000;
  const gb = mb / 1000;

  if (gb >= 1) {
    return { value: gb, unit: 'GB' };
  }
  if (mb >= 1) {
    return { value: mb, unit: 'MB' };
  }
  // otherwise KB (even if < 1 KB, show 0.xx KB)
  return { value: kb, unit: 'KB' };
}

const { value: fileSizeValue, unit: fileSizeUnit } = formatFileSize(currentFileSizeBytes);

// Optional: control decimal places based on unit
const fileSizeDisplay = fileSizeValue.toFixed(
  fileSizeUnit === 'GB' ? 2 :
  fileSizeUnit === 'MB' ? 1 :
  0   // KB usually whole numbers or 1 decimal
) + ' ' + fileSizeUnit;





  useEffect(() => {
    if (token) {
      // console.log("Current page value is", currentPage);

      dispatch(resetUserData());
      dispatch(resetCounter());
    }
  }, [token]);

  // useEffect(() => {
  //   getFileData(currentPage);
  //   getRootFolderSize();
  // }, [currentPage]);
  //Set image
  const getFileTypeIcon = (fileType) => {
    switch (fileType) {
      case "zip":
        return "icon-zip.svg";
      case "jfif":
        return "logo.png";
      case "jpg":
        return "icon-jpg.svg";
      case "PNG":
        return "icon-png.svg";
      case "png":
        return "icon-png.svg";
      case "msi":
        return "logo.png";
      case "pdf":
        return "pdf.svg";
      case "mp4":
        return "mp4.png";
      case "jpeg":
        return "logo.png";

      default:
        return "folder.png";
    }
  };

const applyTypeAndSort = (typesOverride, sortLabel = selectedFilter) => {
  const types = Array.isArray(typesOverride)
    ? typesOverride
    : selectedFileTypes;

  let list = [...allEntries];

  if (types.length > 0) {
    list = list.filter(
      (file) =>
        file.fileType && types.includes(file.fileType.toLowerCase())
    );
  }

  switch (sortLabel) {
    case "By Name(A-Z)":
      list.sort((a, b) => a.fileName.localeCompare(b.fileName));
      break;
    case "By Name(Z-A)":
      list.sort((a, b) => b.fileName.localeCompare(a.fileName));
      break;
    case "By Size(Asc)":
      list.sort(
        (a, b) => parseSizeToBytes(a.fileSize) - parseSizeToBytes(b.fileSize)
      );
      break;
    case "By Size(Desc)":
      list.sort(
        (a, b) => parseSizeToBytes(b.fileSize) - parseSizeToBytes(a.fileSize)
      );
      break;
    case "By Date(Oldest)":
      list.sort(
        (a, b) => new Date(a.uploadDateTime) - new Date(b.uploadDateTime)
      );
      break;
    case "By Date(Newest)":
      list.sort(
        (a, b) => new Date(b.uploadDateTime) - new Date(a.uploadDateTime)
      );
      break;
    default:
      break;
  }

  const hasTypeOrSort =
    types.length > 0 || (sortLabel && sortLabel !== "Sort By");

  if (!hasTypeOrSort) {
    setSortedData([]);
    setTotalEntries(allEntries.length);
  } else {
    setSortedData(list);
    setTotalEntries(list.length);
  }
  setCurrentPage(1);
};

const applyFilter = (typesOverride, options = {}) => {
  const { keepOpen = false, sortLabel = selectedFilter } = options;
  const types = Array.isArray(typesOverride)
    ? typesOverride
    : selectedFileTypes;

  applyTypeAndSort(types, sortLabel);

  if (!keepOpen) closeOnlyPopup();
};

const closeOnlyPopup = () => {
    clearSearchBar();
    setShowFTPopup(false);
  };

  const handleFTCheckboxChange = (fileType) => {
  clearSearchBar();
  const next = selectedFileTypes.includes(fileType)
    ? selectedFileTypes.filter((type) => type !== fileType)
    : [...selectedFileTypes, fileType];
  setSelectedFileTypes(next);
  applyFilter(next, { keepOpen: true });
};

  const addCustomExtension = () => {
    const cleaned = customExtInput
      .trim()
      .replace(/^\.+/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    if (!cleaned) return;
    clearSearchBar();
    if (selectedFileTypes.includes(cleaned)) {
      setCustomExtInput("");
      return;
    }
    const next = [...selectedFileTypes, cleaned];
    setSelectedFileTypes(next);
    setCustomExtInput("");
    applyFilter(next, { keepOpen: true });
  };

  const clearFileTypeFilter = () => {
    setSelectedFileTypes([]);
    setCustomExtInput("");
    applyFilter([], { keepOpen: true });
  };

const handleFTypeSelect = (eventKey) => {
  clearSearchBar();
  if (eventKey === "File Type") {
    setShowFTPopup(true);
  }
};




const getFilePathOnly = (fullName) => {
  const parts = fullName.split("/");
  if (parts.length > 1) {
    const pathPart = parts.slice(0, parts.length - 1).join("/");
    return pathPart && pathPart.trim().length > 0 ? pathPart : "/";
  }
  return "/";
};


  const handleFilterSelect = (eventKey) => {
    if (
      !gatePremiumSort({
        eventKey,
        isPremium,
        onUpgradeRequired: () => setShowUpgradeModal(true),
      })
    ) {
      return;
    }
    // console.log("Filter selected !", eventKey);
    if (eventKey === "name-filter1") {
      setSelectedFilter("By Name(A-Z)");
      nameFilter1();
    } else if (eventKey === "name-filter2") {
      setSelectedFilter("By Name(Z-A)");
      nameFilter2();
    } else if (eventKey === "size-filter1") {
      setSelectedFilter("By Size(Asc)");
      sizeFilter1();
    } else if (eventKey === "size-filter2") {
      setSelectedFilter("By Size(Desc)");
      sizeFilter2();
    } else if (eventKey === "date-filter1") {
      setSelectedFilter("By Date(Oldest)");
      dateFilter1();
    } else if (eventKey === "date-filter2") {
      setSelectedFilter("By Date(Newest)");
      dateFilter2();
    } else {
      setSelectedFilter("Sort By");
      applyTypeAndSort(selectedFileTypes, "Sort By");
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

    const currentPath = folderNavigationPath.join("/");

    const folderPath = currentPath
      ? `${currentPath}/${cleanName}`
      : cleanName;

    await axios.post(
      `https://stolityapi.infomanav.in/api/aws/create-folder`,
      {
        folderName: folderPath,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    showToast("success", "Folder created successfully");

    setNewFolderName("");

    // 🔥 refresh current folder
    fetchFoldersAtLevel(currentPath || "");

  } catch (error) {
    console.error("Create folder error:", error);
    showToast("error", "Failed to create folder");
  } finally {
    setCreatingFolder(false);
  }
};


function formatStorageSize(bytes) {
  if (bytes <= 0) {
    return `${(bytes / 1_000_000_000).toFixed(2)} GB`; // allow negative for over-limit cases
  }

  const gb = bytes / 1_000_000_000;
  const mb = bytes / 1_000_000;
  const kb = bytes / 1_000;

  if (gb >= 1) return `${gb.toFixed(2)} GB`;
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${Math.round(kb)} KB`;
}





// Helper function to convert file size string to bytes for sorting
const parseSizeToBytes = (sizeStr) => {
  if (!sizeStr) return 0;
  const units = { 'B': 1, 'KB': 1024, 'MB': 1024**2, 'GB': 1024**3, 'TB': 1024**4 };
  const match = sizeStr.match(/^([\d.]+)\s*(\w+)$/);
  if (!match) return 0;
  const [, size, unit] = match;
  return parseFloat(size) * (units[unit.toUpperCase()] || 1);
};

const nameFilter1 = () => {
  clearSearchBar();
  applyTypeAndSort(selectedFileTypes, "By Name(A-Z)");
};

const nameFilter2 = () => {
  clearSearchBar();
  applyTypeAndSort(selectedFileTypes, "By Name(Z-A)");
};

const sizeFilter1 = () => {
  clearSearchBar();
  applyTypeAndSort(selectedFileTypes, "By Size(Asc)");
};

const sizeFilter2 = () => {
  clearSearchBar();
  applyTypeAndSort(selectedFileTypes, "By Size(Desc)");
};

const dateFilter1 = () => {
  clearSearchBar();
  applyTypeAndSort(selectedFileTypes, "By Date(Oldest)");
};

const dateFilter2 = () => {
  clearSearchBar();
  applyTypeAndSort(selectedFileTypes, "By Date(Newest)");
};



  const closePopup = () => {
  setSelectedFileTypes([]);
  setCustomExtInput("");
  setSortedData([]); // Clear filters and sorting
  setTotalEntries(allEntries.length);
  setCurrentPage(1);
  getFileData(); // Reload favorites
  setShowFTPopup(false);
};



  const [isNextNextPage, setIsNextNextPage] = useState(false);
  const [showGoogleAuthPopup, setShowGoogleAuthPopup] = useState(false);

  //Anurag Get Files
  // Modify your getFileData function to ensure it correctly handles pagination
const getFileData = async () => {
  try {
    const response = await axios.get(`${apiUrl}get-recycle-bin`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const recycleBinFiles = response.data.result || response.data;
    setAllEntries(recycleBinFiles);
    setTotalEntries(recycleBinFiles.length);
    setFileData(recycleBinFiles.slice(0, itemsPerPage));

    // Refresh storage info whenever recycle bin is reloaded
    dispatch(fetchUserFolderSize({ token, force: true }));
  } catch (error) {
    console.log("Error fetching recycle bin files", error);
    showToast("error", "Failed to load recycle bin files");
  }
};

  const {
    query,
    searchLoading,
    handleSearchChange,
    clearSearch,
    resetSearchBar,
  } = useFileSearch({
    apiUrl,
    token,
    onResults: (list) => {
      setAllEntries(list);
      setTotalEntries(list.length);
      setCurrentPage(1);
    },
    onSearchClear: () => {
      setAllEntries([]);
      setTotalEntries(0);
    },
    reloadList: () => getFileData(),
  });

  const clearSearchBar = resetSearchBar;

  // Pagination control handlers (no API calls now)
  const goToFirstPage = () => setCurrentPage(1);

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (isNextPage) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToLastPage = () => {
    if (isNextPage) {
      setCurrentPage(totalPages);
    }
  };

  const handleItemsPerPageChange = (e) => {
    const newValue = parseInt(e.target.value);
    setItemsPerPage(newValue);
    setCurrentPage(1); // Reset to first page
  };

  //Anurag Check Folder or File
  // Anurag Check Folder or File
  const chkFileorFolder = (file, size) => {
    const isFolder = file.fileType === "Folder" || file.isFolder === true;

    if (isFolder) {
      // console.log("It's a folder.");
      dispatch(
        setFolderPath({
          folderPath: file.fileName + "/",
          isShared: file.isShared || false, // Pass isShared value
        })
      );
      getFolderFiles(file, size);
    } else {
      // It's a file
      openFile(file);
    }
  };

  //Anurag get into folder

  const getFolderFiles = async (foldername, size) => {
    try {
      const cleanfoldername = checkLastHash(foldername.fileName);

      let res;

      const isShared = foldername?.isShared ?? false;

      if (isShared) {
        res = await axios.get(`${apiUrl}getFolder`, {
          params: { shared: cleanfoldername },
          headers: { Authorization: `Bearer ${token}` },
        });
        // Trigger getting shared folder list
        getFolderList(true, foldername.fileName);
      } else {
        res = await axios.get(`${apiUrl}getFolder`, {
          params: { folderPath: cleanfoldername },
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      const routepath = 1;
      nav(`/nested/${routepath}`, {
        state: { value: size },
      });

      dispatch(
        addToken({
          id: routepath,
          Files: res.data,
          isShared: foldername.isShared,
        })
      );

      dispatch(setIsSharedValue(isShared));
      dispatch(setParentFolderName(foldername.fileName));

      // if (!isShared) {
      dispatch(incrementCounter());
      // console.log("this is testing of counter ");

      // }
    } catch (error) {
      console.log("error:", error.response?.data?.error);
      if (error.response?.data?.error === "jwt expired") {
        alert("Session expired. Please login again.");
        setTimeout(() => {
          nav("/Login");
        }, 0); // Navigate immediately after alert closes
      }
      // console.error(`There's error at ${error}`);
    }
  };

  const removeSlash2 = (filename) => {
    // Split the filename by slashes
    const parts = filename.split("/");

    // Check if there is at least one slash
    if (parts.length > 1) {
      // Join everything after the first slash
      return parts.slice(1).join("/");
    } else {
      // If there are no slashes, return the original filename
      return filename;
    }
  };

  //Anurag extract first part of the file
  const extractFirstPart = (str) => {
    const index = str.indexOf("/");
    if (index === -1) {
      // Return the whole string if there's no slash
      return str;
    }
    return str.substring(0, index);
  };

  //Anurag Search file — see useFileSearch hook

  //Image getting function
  const getImageInfo = async (filename) => {
    setIsProgressVisible(true);
    setImageSrc("");
    try {
      const url = buildFileStreamUrl(apiUrl, token, filename);
      await preloadStreamedImage(url);
      setImageSrc(url);
    } catch (error) {
      console.error(error);
    } finally {
      setIsProgressVisible(false);
    }
  };
  //Audio getting function
  const getAudioInfo = async (filename) => {
    try {
      const res = await axios.get(`${apiUrl}getFile`, {
        params: {
          filePath: filename,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "arraybuffer",
      });
      setIsProgressVisible(false);
      const fileType = res.headers["content-type"];
      const blob = new Blob([res.data], { type: fileType });
      const url = window.URL.createObjectURL(blob);
      setAudioSrc(url);
    } catch (error) {
      console.error(error);
    }
  };

  //Pdf getting function
  const getPdfInfo = async (filename) => {
    try {
      const res = await axios.get(`${apiUrl}getFile`, {
        params: {
          filePath: filename,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "arraybuffer",
      });
      setIsProgressVisible(false);
      const fileType = res.headers["content-type"];
      const blob = new Blob([res.data], { type: fileType });
      const url = window.URL.createObjectURL(blob);
      setPdfSrc(url);
    } catch (error) {
      console.error(error);
    }
  };

  //Anurag View Image, Video
  const openFile = async (file) => {
    const filename = file.fileName;
    try {
      const res = await axios.get(`${apiUrl}getFile`, {
        params: {
          filePath: file.fileName,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "arraybuffer",
      });
      setIsProgressVisible(false);
      // console.log("res", res);
      const exactFile = removeSlash2(file.fileName);
      const fileType = res.headers["content-type"];
      const metadata = res.headers["x-file-metadata"];
      // console.log("metadata", metadata);
      setCurrentFile(fileTypeExtractor(fileType));

      const blob = new Blob([res.data], { type: fileType });
      const url = window.URL.createObjectURL(blob);
      //  console.log(fileType);
      if (extractFirstPart(fileType) === "video") {
        // console.log("Handling video...");   
        if (
          fileType === "video/mp4" ||
          fileType === "video/webm" ||
          fileType === "video/ogg" ||
          fileType === "video/quicktime"
        ) {
          setIsOpen(!isOpen);
          setVideoSrc(url);
          setisVideo(true);
        } else {
          setErrorMessage(
            "This video format is not supported by your browser."
          );
        }
      } else if (extractFirstPart(fileType) === "image") {
        setIsOpen(!isOpen);
        // console.log("Handling image...");
      } else if (fileType === "application/pdf") {
        // console.log("Handling pdf...");

        setOpenPDFModal(true);
        setPdfSrc(url);
        // console.log(pdfSrc);
      } else if (extractFirstPart(fileType) === "text") {
        // console.log("Handling text file...");
        setOpenPDFModal(true);
        setPdfSrc(url);
        // console.log(pdfSrc);
      } else if (extractFirstPart(fileType) === "audio") {
        setIsAudio(true);

        // console.log("Handling audio...");
        setAudioSrc(url);
      } else {
        // console.log("Handling Common file...");
        setFn(removeSlash2(file.fileName));

        setIsOpen(!isOpen);
      }
    } catch (error) {
      showToast("error", "Error fetching file");
    } finally {
      setIsProgressVisible(false);
    }
  };
  function arrayBufferToBase64(buffer) {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
  const fileTypeExtractor = (file) => {
    const partBeforeSlash = file.split("/")[0];
    return partBeforeSlash;
  };

  useEffect(() => {
    return () => {
      if (audioSrc) {
        URL.revokeObjectURL(audioSrc);
      }
    };
  }, [audioSrc]);
  const audioFalse = () => {
    setIsAudio(false);
    setAudioSrc("");
  };
  //Get Root Directory Size
  //Get root folder size
  const getRootFolderSize = async () => {
    try {
      const res = await axios.get(`${apiUrl}get-folder-size`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      setRootSize(res.data.totalSize);
    } catch (error) {
      console.error(`There's error at ${error}`);
    }
  };

  const data = ["10", "20", "50", "100"].map((item) => ({
    label: item,
    value: item,
  }));

  const [isLoading, setLoading] = useState(true); // State to manage loading state
  useEffect(() => {
    // Simulate an API call or data loading delay
    setTimeout(() => setLoading(false), 500); // Simulate 2 seconds loading time
  }, []);

  // INPUT VALUE
  const [inputValue, setInputValue] = useState("");
  const handleInputChange = (e) => setInputValue(e.target.value);

  //POPOVER WITH TABLE ROW ACTIVE
  const [activeRow, setActiveRow] = useState(null);
  const [wholeFile, setWholeFile] = useState(null);
  const [renamePop, setRenamepop] = useState(false);
  const [extension, setExtension] = useState("");
 



  const handlePChange = (e) => {
    // console.log("public private", e.target.value);
    setPubPri(e.target.value);
  };

  //Check last /
  const checkLastHash = (name) => {
    if (name.endsWith("/")) {
      return name.slice(0, -1);
    }
    return name;
  };

  //Rename Api call
  const [isRenaming, setIsRenaming] = useState(false);




  // DELETE POPOVER
  const [activeDeleteRow, setActiveDeleteRow] = useState(null);
  const [deletePop, setDeletepop] = useState(false);
  // Function to open delete popover
  const handleOpenDeletePopover = (id) => {
    setActiveDeleteRow(id);
    setDeletepop(true);
  };

  // Function to close delete popover
  const handleCloseDeletePopover = () => {
    setActiveDeleteRow(null);
    setDeletepop(false);
  };

  useSessionEndCleanup(() => {
    setShowImage(false);
    setCodePopup(false);
    setIsCWhisperClicked(false);
    setMoveFol(false);
    setInfoShower(false);
    setRenamepop(false);
    setDeletepop(false);
  });

  


const handleFileDelete = async (file) => {
  const loaderStartedAt = Date.now();
  setLoader_Permanent_Delete(true); // Start permanent delete loader

  if (file?.isFolder === true) {
    // Permanent folder delete
    try {
      const res = await axios.delete(`${apiUrl}delete-folder`, {
        data: { folderName: [checkLastHash(file.fileName)], fromRecycleBin: true },
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      getLatestFolderList();
      handleCloseDeletePopover();
      getFileData(currentPage);
      getRootFolderSize();
      afterMinLoaderDisplay(loaderStartedAt, () => {
        setLoader_Permanent_Delete(false);
        showToast("success", "Folder permanently deleted");
      });
    } catch (error) {
      showToast("error", `There's an error while deleting folder`);
      afterMinLoaderDisplay(loaderStartedAt, () => setLoader_Permanent_Delete(false));
    }
  } else {
    // Permanent file delete from recycle bin
    const deleteKey = file.fileName;

    const dataToSend = {
      keys: [deleteKey],
      fromRecycleBin: true, // Flag to indicate deletion from recycle bin
    };

    try {
      const res = await axios.delete(`${apiUrl}delete-file`, {
        data: dataToSend,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      handleCloseDeletePopover();
      getFileData(currentPage);
      getRootFolderSize();
      afterMinLoaderDisplay(loaderStartedAt, () => {
        setLoader_Permanent_Delete(false);
        showToast("success", "File permanently deleted");
      });
    } catch (error) {
      showToast("error", "There's an error while permanently deleting file!");
      afterMinLoaderDisplay(loaderStartedAt, () => setLoader_Permanent_Delete(false));
    }
  }
};



// Fetch all folders recursively for restore modal

const handleRestore = async (file) => {
  setFileToRestore(file);
  if (file?.isFolder) {
    setShowRestoreFolderModal(true);
  } else {
    setShowRestoreModal(true);
    setSelectedDestination(""); // Start with root for files
    setFolderNavigationPath([]);
    fetchFoldersAtLevel("");
  }
};




const handleMulRestore = async () => {
  try {
    // Check if any shared folders in selection
    const selectedFolders = [];
    const selectedFiles = [];

    keys.forEach((key) => {
      const file = filedata.find((f) => f.fileName === key);
      if (file) {
        if (file.isFolder) {
          selectedFolders.push(key);
        } else {
          selectedFiles.push(key);
        }
      }
    });

    keys2.forEach((folderName) => {
      const file = filedata.find((f) => f.fileName === folderName);
      if (file && file.isFolder) {
        selectedFolders.push(folderName);
      }
    });

    // Remove duplicate folders if any
    const uniqueFolders = Array.from(new Set(selectedFolders));

    const hasSharedFolders = uniqueFolders.some((folder) => {
      const file = filedata.find((f) => f.fileName === folder);
      return file && file.isShared;
    });
    if (hasSharedFolders) {
      showToast("error", "Shared folders cannot be restored.");
      return;
    }

    // Restore folders immediately if any
    if (uniqueFolders.length > 0) {
      await performFolderMultiRestore(uniqueFolders);
    }

    // Show modal for files if any
    if (selectedFiles.length > 0) {
      setKeys(selectedFiles); // update keys for files to restore
       setModalKeys(selectedFiles); // store snapshot for modal usage
      setShowMultiRestoreModal(true);
      setSelectedDestination("");
      setFolderNavigationPath([]);
      fetchFoldersAtLevel("");
    }
  } catch (error) {
    console.error("Error during multi-restore:", error);
    showToast("error", "Error restoring items!");
  }
};

// Modify performFolderMultiRestore to accept folders argument
const performFolderMultiRestore = async (folders) => {
  console.log("ggggg performFolderMultiRestore called with folders:", folders);

  if (!Array.isArray(folders) || folders.length === 0) {
    console.log("ggggg No folders passed to performFolderMultiRestore, aborting.");
    showToast("error", "No folders selected to restore.");
    return;
  }

  // Start loaders
  const loaderStartedAt = Date.now();
  setLoader_Restore(true);
  dispatch(setLoader(true));

  // 1) Build name -> size map from allEntries
  const sizeByName = {};
  (allEntries || []).forEach((item) => {
    if (!item?.fileName) return;
    sizeByName[item.fileName] = item.fileSize || "0 Bytes";
  });

  console.log("ggggg sizeByName map:", sizeByName);

  // 2) Compute total size of selected folders
  const selectedTotalBytes = folders.reduce((sum, name) => {
    const sizeStr = sizeByName[name];
    const bytes = sizeStr ? parseStorageToBytes(sizeStr) : 0;
    console.log("ggggg folder:", name, "sizeStr:", sizeStr, "bytes:", bytes);
    return sum + bytes;
  }, 0);

  const selectedTotalGB = (selectedTotalBytes / 1024 ** 3).toFixed(2);
  const isMultiSizeExceeded = selectedTotalBytes > remainingBytes;

  console.log("ggggg selectedTotalBytes:", selectedTotalBytes);
  console.log("ggggg remainingBytes:", remainingBytes);
  console.log("ggggg isMultiSizeExceeded:", isMultiSizeExceeded);

  // 3) Block restore entirely if over limit
  if (isMultiSizeExceeded) {
    showToast(
      "error",
      `Not enough storage to restore selected folders. Required: ${selectedTotalGB} GB.`
    );
    setLoader_Restore(false);
    dispatch(setLoader(false));
    return;
  }

  try {
    console.log("ggggg Preparing restore-folders API call");
    console.log("ggggg API URL:", `${apiUrl}restore-folders`);
    console.log("ggggg Payload:", { folders });
    console.log("ggggg Auth token present:", !!token);

    const response = await axios.post(
      `${apiUrl}restore-folders`,
      { folders },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("ggggg restore-folders response status:", response.status);
    console.log("ggggg restore-folders response data:", response.data);

    // Refresh storage info
    dispatch(fetchUserFolderSize({ token, force: true }));

    console.log("ggggg Calling resetSelectionAndRefresh()");
    resetSelectionAndRefresh();

    afterMinLoaderDisplay(loaderStartedAt, () => {
      setLoader_Restore(false);
      showToast("success", "Folders restored successfully!");
    });
  } catch (error) {
    console.error("ggggg Error restoring folders:", error);
    console.error("ggggg Error response:", error.response?.data);
    showToast("error", "Error restoring folders");

    afterMinLoaderDisplay(loaderStartedAt, () => {
      setLoader_Restore(false);
    });
  } finally {
    dispatch(setLoader(false));
  }
};




// confirmMultiFileRestore remains same (uses updated keys state)
const confirmMultiFileRestore = async (selectedDestination) => {
  console.log("ggggg confirmMultiFileRestore called with:", {
    selectedDestination,
    keys,
  });

  if (!Array.isArray(keys) || keys.length === 0) {
    console.log("ggggg No files selected to restore, aborting.");
    showToast("error", "No files selected to restore.");
    return;
  }

  setShowMultiRestoreModal(false);

  // Start loaders
  const loaderStartedAt = Date.now();
  setLoader_Restore(true);
  dispatch(setLoader(true));

  // 1) Build name -> size map from allEntries
  const sizeByName = {};
  (allEntries || []).forEach((item) => {
    if (!item?.fileName) return;
    sizeByName[item.fileName] = item.fileSize || "0 Bytes";
  });

  console.log("ggggg sizeByName map (files):", sizeByName);

  // 2) Compute total size of selected files
  const selectedTotalBytes = keys.reduce((sum, name) => {
    const sizeStr = sizeByName[name];
    const bytes = sizeStr ? parseStorageToBytes(sizeStr) : 0;
    console.log("ggggg file:", name, "sizeStr:", sizeStr, "bytes:", bytes);
    return sum + bytes;
  }, 0);

  const selectedTotalGB = (selectedTotalBytes / 1024 ** 3).toFixed(2);
  const isMultiSizeExceeded = selectedTotalBytes > remainingBytes;

  console.log("ggggg selectedTotalBytes (files):", selectedTotalBytes);
  console.log("ggggg remainingBytes:", remainingBytes);
  console.log("ggggg isMultiSizeExceeded (files):", isMultiSizeExceeded);

  // 3) Block restore entirely if over limit
  if (isMultiSizeExceeded) {
    showToast(
      "error",
      `Not enough storage to restore selected files. Required: ${selectedTotalGB} GB.`
    );
    setLoader_Restore(false);
    dispatch(setLoader(false));
    return;
  }

  try {
    const payload = { keys, destinationFolder: selectedDestination };
    console.log("ggggg Preparing restore-objects API call");
    console.log("ggggg API URL:", `${apiUrl}restore-objects`);
    console.log("ggggg Payload:", payload);

    await axios.post(`${apiUrl}restore-objects`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    // Refresh storage info
    dispatch(fetchUserFolderSize({ token, force: true }));

    resetSelectionAndRefresh();

    afterMinLoaderDisplay(loaderStartedAt, () => {
      setLoader_Restore(false);
      showToast("success", "Files restored successfully!");
    });
  } catch (error) {
    console.error("ggggg Error restoring files:", error);
    console.error("ggggg Error response:", error.response?.data);
    showToast("error", "Error restoring files!");

    afterMinLoaderDisplay(loaderStartedAt, () => {
      setLoader_Restore(false);
    });
  } finally {
    dispatch(setLoader(false));
  }
};



const resetSelectionAndRefresh = () => {
  setIsSelectAll(false);
  setSelectStatus(false);
  setKeys([]);
  setKeys2([]);
  getFileData(currentPage);
  getRootFolderSize();
};









// const navigateIntoFolder = (folder) => {
//   console.log("=== Navigate Into Folder Debug ===");
//   console.log("Current folderNavigationPath:", folderNavigationPath);
//   console.log("Clicking on folder:", folder);
//   console.log("folder.fileName:", folder.fileName);
  
//   // Extract only the last part of the folder name (in case API returns full path)
//   const folderNameOnly = folder.fileName.includes('/') 
//     ? folder.fileName.split('/').pop()  // Get last part after last slash
//     : folder.fileName;
  
//   console.log("Extracted folder name only:", folderNameOnly);
  
//   // Just add the folder name to the path array
//   const newPathArray = [...folderNavigationPath, folderNameOnly];
//   console.log("New path array:", newPathArray);
  
//   setFolderNavigationPath(newPathArray);
  
//   // Build the full path from the navigation array
//   const newPath = newPathArray.join("/");
//   console.log("Full path to fetch:", newPath);
//   console.log("=================================");
  
//   fetchFoldersAtLevel(newPath);
// };



// Navigate back to parent folder

const navigateIntoFolder = async (folder) => {
  console.log("=== Navigate Into Folder Debug ===");
  console.log("Current folderNavigationPath:", folderNavigationPath);
  console.log("Clicking on folder:", folder);
  console.log("folder.fileName:", folder.fileName);

  try {
    // 🔥 START LOADING
    setOpeningFolder(folder.fileName);

    // Extract only the last part of the folder name
    const folderNameOnly = folder.fileName.includes('/')
      ? folder.fileName.split('/').pop()
      : folder.fileName;

    console.log("Extracted folder name only:", folderNameOnly);

    // Build new path array
    const newPathArray = [...folderNavigationPath, folderNameOnly];
    console.log("New path array:", newPathArray);

    // Update navigation path
    setFolderNavigationPath(newPathArray);

    // Build full path
    const newPath = newPathArray.join("/");
    console.log("Full path to fetch:", newPath);
    console.log("=================================");

    // 🔥 Fetch folders
    await fetchFoldersAtLevel(newPath);

  } catch (error) {
    console.error("Error navigating folder:", error);
  } finally {
    // 🔥 STOP LOADING
    setOpeningFolder(null);
  }
};



const navigateBack = () => {
  const newPath = [...folderNavigationPath];
  newPath.pop();
  setFolderNavigationPath(newPath);
  
  const folderPath = newPath.join("/");
  fetchFoldersAtLevel(folderPath);
};

const closeRestoreDestinationModal = () => {
  setShowRestoreModal(false);
  setFileToRestore(null);
  setSelectedDestination("");
  setFolderNavigationPath([]);
  setNewFolderName("");
};

const closeMultiRestoreDestinationModal = () => {
  setShowMultiRestoreModal(false);
  setSelectedDestination("");
  setFolderNavigationPath([]);
  setNewFolderName("");
};

const handleRestoreRootClick = () => {
  setFolderNavigationPath([]);
  setSelectedDestination("");
  fetchFoldersAtLevel("");
};

const getRestoreFolderLabel = (fileName) => {
  const parts = String(fileName || "").split("/").filter(Boolean);
  return parts[parts.length - 1] || fileName;
};

  
const performRestore = async () => {
  // don't start loader if there's nothing to do
  setShowRestoreModal(false);
  if (!fileToRestore) return;

  setLoader_Restore(true); // Start restore loader
  const loaderStartedAt = Date.now();
  dispatch(setLoader(true)); // START loader

  const totalBytes = subscription && subscription.storage
    ? parseStorageToBytes(subscription.storage)
    : 5 * 1024 ** 3;
  const usedBytes = folderSize ? folderSize.sizeInBytes : 0;
  const remainingBytes = totalBytes - usedBytes;

  const fileSize = fileToRestore.fileSize
    ? parseStorageToBytes(fileToRestore.fileSize)
    : 0;

  if (fileSize > remainingBytes) {
    dispatch(setLoader(false)); // STOP loader before early return
    showToast("error", "Not enough storage space to restore this file or folder.");
    setLoader_Restore(false); // Stop restore loader
    return;
  }

  try {
    const destination = folderNavigationPath.join("/");

    if (fileToRestore.isFolder) {
      const payload = { folders: [fileToRestore.fileName] };
      await axios.post(`${apiUrl}restore-folders`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const locationMsg = destination === "" ? "Root Folder" : destination;
      dispatch(setLoader(false));

      // Refresh storage after successful folder restore
      dispatch(fetchUserFolderSize({ token, force: true }));

      afterMinLoaderDisplay(loaderStartedAt, () => {
        setLoader_Restore(false);
        showToast("success", `Folder restored to ${locationMsg} successfully`);
      });
    } else {
      const dataToSend = {
        keys: [fileToRestore.fileName],
        destinationFolder: destination,
      };

      await axios.post(`${apiUrl}restore-objects`, dataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const locationMsg = destination === "" ? "Root Folder" : destination;
      dispatch(setLoader(false));

      // Refresh storage after successful file restore
      dispatch(fetchUserFolderSize({ token, force: true }));

      afterMinLoaderDisplay(loaderStartedAt, () => {
        setLoader_Restore(false);
        showToast("success", `File restored to ${locationMsg} successfully`);
      });
    }

    setShowRestoreModal(false);
    setFileToRestore(null);
    setSelectedDestination("");
    setFolderNavigationPath([]);

    // Refresh recycle bin and quota UI
    getFileData(currentPage);
    getRootFolderSize();
  } catch (error) {
    console.error("Error restoring item:", error);
    showToast("error", "There's an error while restoring item!");
    dispatch(setLoader(false));
    afterMinLoaderDisplay(loaderStartedAt, () => setLoader_Restore(false));
  } finally {
    // Loader stop handled in branches
  }
};










// Fetch folders for current level (not recursive anymore)
const fetchFoldersAtLevel = async (folderPath = "") => {
  setLoadingFolders(true);
  try {
    if (folderPath === "") {
      // Fetch root level folders
      const [sharedFoldersResult, filesResult] = await Promise.allSettled([
        axios.get(`${apiUrl}shared-folders`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
        axios.get(`${apiUrl}getAllObjectsNew`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          params: {
            limit: 1000,
          },
        }),
      ]);

      const sharedFolders =
        sharedFoldersResult.status === "fulfilled"
          ? sharedFoldersResult.value.data.result || []
          : [];

      const files =
        filesResult.status === "fulfilled"
          ? filesResult.value.data.result || []
          : [];

      const combinedData = isGoogleAuth
        ? [...sharedFolders, ...files]
        : [...files];

      // Filter only folders from root level
      const rootFolders = combinedData.filter((item) => item.isFolder === true);
      setCurrentFolders(rootFolders);
    } else {
      // Fetch subfolders for the given path
      const res = await axios.get(`${apiUrl}getFolder`, {
        params: { folderPath },
        headers: { Authorization: `Bearer ${token}` },
      });

      const subFolders = res.data.filter((item) => item.isFolder === true);
      setCurrentFolders(subFolders);
    }
    setLoadingFolders(false);
  } catch (error) {
    console.error("Error fetching folders:", error);
    showToast("error", "Failed to load folders");
    setLoadingFolders(false);
  }
};









  const [openPDFModal, setOpenPDFModal] = useState(false);
  const handleOpenPDFModal = () => setOpenPDFModal(true);
  const handleClosePDFModal = () => setOpenPDFModal(false);
  const [openFileUploadModal, setOpenFileUploadModal] = useState(false);
  const [createFolderButton, setCreateFolderButton] = useState(false);
  const pageFilter = (data) => {
    getFileData(currentPage, data);
  };

 

  const handleCloseFileUploadModal = () => setOpenFileUploadModal(false);
  const handleOpenCreateFolder = () => setCreateFolderButton(true);
  const handleCloseCreateFolder = () => {
    setCreateFolderButton(false);
    setFolderFieldError("");
  };

  const [pubpri, setPubPri] = useState("private");
  const [files, setFiles] = useState([]);
  const [directory, setDirectory] = useState("");
  const [fileList, setFileList] = useState([]);
  const [preLoader2, setPreLoader2] = useState(false);
  const [folderStructure, setFolderStructure] = useState({});
  const t = useSelector((state) => state.getdata.folderName);
  const isGoogleAuth = useSelector((state) => state.getdata.isGoogleAuth);

  //Anurag move file api
  const getFolderList = async (isShared = false, parentFolder = null) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        params: {},
      };

      // Add params based on shared status and parent folder
      if (isShared) {
        config.params.shared = parentFolder;
      } else if (parentFolder) {
        config.params.folderPath = parentFolder;
      }

      const endpoint = `${apiUrl}get-root-folders`;
      const response = await axios.get(endpoint, config);

      

      const folders = response.data;

      // Dispatch folders with the isShared context
      dispatch(setIsSharedValue(isShared));
      dispatch(addFolder(folders));

      // Only increment counter for non-shared folders
      // if (!isShared) {
      //   dispatch(incrementCounter());
      //   console.log("this is testing of counter ")
      // }

      return folders;
    } catch (error) {
      console.error(`There's an error fetching folder list: ${error}`);
      return [];
    }
  };



  const getLatestFolderList = async () => {
    try {
      // console.log("Folders are loading...");

      const response = await axios.get(`${apiUrl}get-root-folders`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      //  console.log("Second Root Folder list is", response.data);
      const folders = response.data;
      setFolderList(folders);
      let arr = [folders];
      // console.log("vav", arr);
      dispatch(addNewFolder(arr));
    } catch (error) {
      console.error(`There's an error: ${error}`);
    }
  };

  if (c <= 1) {
    getFolderList();

    c++;
  }


  





  const [isLoading1, setIsLoading1] = useState(false);
  const [codeChunks, setCodeChunks] = useState([]); // chunks of lines
  const [fullLines, setFullLines] = useState([]); // entire line array
  const [chunkSize] = useState(500); // lines per chunk
  const [hasMoreChunks, setHasMoreChunks] = useState(false);





  async function processZipFile(file, destinationPath = "") {
    const apiUrl1 = `${apiUrl}zip-object`;

    const requestData = {
      filePath: removeSlash2(file.fileName),
      destinationPath, // Defaults to empty string if not provided
    };

    try {
      const response = await axios.post(apiUrl1, requestData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 0,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      // console.log("Zip successful:", response.data);
      showToast("success", "File successfully zipped!");
    } catch (error) {
      console.error("Error zipping file:", error);
      showToast(
        "error",
        error?.code === "ECONNABORTED" || /timeout/i.test(error?.message || "")
          ? "Zip timed out. Large folders need more time on the host proxy."
          : error?.response?.data?.error || "Failed to zip file."
      );
    }
  }

  const [showFolderModalUnZip, setShowFolderModalUnZip] = useState(false);
  const [currentFileToUnzip, setCurrentFileToUnzip] = useState(null);

  async function UnzipFile(file) {
    // Show the folder selection modal before proceeding
    setShowFolderModalUnZip(true);
    setCurrentFileToUnzip(file);
  }

  async function processUnzipFile(file, destinationPath = "") {
    const apiUrl1 = `${apiUrl}unzip-object`;

    const requestData = {
      zipFilePath: removeSlash2(file.fileName), // Ensure zip file path is correct
      destinationPath, // Default to empty string for root folder
    };

    try {
      const response = await axios.post(apiUrl1, requestData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 0,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      //    console.log("Unzip successful:", response.data);
      showToast("success", "File successfully unzipped!");
    } catch (error) {
      console.error("Error unzipping file:", error);
      showToast(
        "error",
        error?.code === "ECONNABORTED" || /timeout/i.test(error?.message || "")
          ? "Unzip timed out. Large ZIPs need more time on the host proxy."
          : error?.response?.data?.error || "Failed to unzip file."
      );
    }
  }

  const customTruncateFileName = (name, maxLength) => {
    if (name.length > maxLength) {
      return `${name.substring(0, maxLength - 9)} of the ${name.substring(
        maxLength - 6,
        maxLength
      )}...`;
    }
    return name;
  };


  function getFileNameWithoutExtension(fileName) {
    const lastDotIndex = fileName.lastIndexOf(".");

    if (lastDotIndex !== -1) {
      // If a dot is found, return the file name without the extension
      return fileName.substring(0, lastDotIndex);
    } else {
      // If no dot is found, return the entire name (assuming it's a folder)
      return fileName;
    }
  }



function getTextAfterLastSlash(text) {
  if (text.includes("/")) {
    return text.substring(text.lastIndexOf("/") + 1);
  } else {
    return text;
  }
}

function getModifiedRecentFolderText(input) {
  const index = input.indexOf("/");
  if (index !== -1 && index < input.length - 1) {
    // Extract the substring after the first slash
    const textAfterSlash = input.substring(index + 1);
    // Replace all '/' with '<'
    return textAfterSlash.replace(/\//g, "<");
  } else {
    return "";
  }
}




  const handleFolderChange = (event) => {
    // console.log("Event", event);
    const files = event;
    const updatedFileList = [];
    const updatedFolderStructure = {};

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const relativePath = file.webkitRelativePath;

      // Separate the folder path and file name
      const folderPath = relativePath.substring(
        0,
        relativePath.lastIndexOf("/")
      );
      setNameOfFolder(folderPath);
      // Update the file list with the folder path and file
      updatedFileList.push({
        path: folderPath, // Only the folder path without the file name
        file: file,
      });

      // Update the folder structure without including the file name
      updatedFolderStructure[file.name] = folderPath;
    }

    setFileList(updatedFileList);
    setFolderStructure(updatedFolderStructure);

    if (updatedFileList.length > 0) {
      setDirectory(getTextBeforeFirstSlash(updatedFileList[0].path));
    }

    // console.log("Updated file list:", updatedFileList);
    // console.log("Folder structure:", updatedFolderStructure);
  };
  //upload folder bug
  const onDrop = useCallback(
    (acceptedFiles) => {
      setFiles(acceptedFiles);
      handleFolderChange(acceptedFiles);
    },
    [handleFolderChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    // This will attempt to get all files from a folder
    directory: true,
    // Disable click and keydown behavior
    noClick: true,
    noKeyboard: true,
  });

  const handlePubChange = (event) => {
    setPubPri(event.target.value);
  };
  function getTextBeforeFirstSlash(text) {
    const indexOfFirstSlash = text.indexOf("/");
    if (indexOfFirstSlash !== -1) {
      return text.substring(0, indexOfFirstSlash);
    }
    return text; // Return the entire text if no slash is found
  }

  function removeLastSlashAndText(inputString) {
    const lastSlashIndex = inputString.lastIndexOf("/");

    // If no slash is found, return the original string
    if (lastSlashIndex === -1) {
      return inputString;
    }

    return inputString.substring(0, lastSlashIndex);
  }

  const handleSelectFolder = () => {
    // Create an input element
    const input = document.createElement("input");
    input.type = "file";
    input.webkitdirectory = true;
    input.directory = true;
    input.multiple = true;

    input.onchange = (e) => {
      const files = Array.from(e.target.files);
      setFiles(files);
      handleFolderChange(files);
    };

    // Trigger the file input click
    input.click();
  };
  const path = "";
  const removeFile = (index) => {
    const updatedFiles = [...files];
    updatedFiles.splice(index, 1);
    setFiles(updatedFiles);
  };
  //Anurag folder upload

  const fileList2 = files.map((file, index) => (
    <li key={file.name}>
      <div>
        {file.type.startsWith("image/") ? (
          <div className="file_img">
            <img src={URL.createObjectURL(file)} alt={file.name} style={{}} />
          </div>
        ) : (
          <div>
            <i
              className="mdi mdi-file-document-box-multiple-outline"
              style={{ fontSize: "48px" }}
            ></i>
          </div>
        )}
        <div className="upload_file_content">
          <button onClick={() => removeFile(index)}>
            <i className="mdi mdi-close"></i>
          </button>
        </div>
      </div>
    </li>
  ));

  const sanitizeFilename = (filename, options = {}) => {
    // Default options
    const maxLength = options.maxLength || 50;

    // Handle empty or invalid input
    if (!filename || typeof filename !== "string") {
      return "unnamed_file";
    }

    // Check if file has an extension
    const lastDotIndex = filename.lastIndexOf(".");
    const hasExtension = lastDotIndex > 0 && lastDotIndex < filename.length - 1;

    // Extract extension and name parts
    let extension = "";
    let nameWithoutExt = filename;

    if (hasExtension) {
      extension = filename.substring(lastDotIndex + 1);
      nameWithoutExt = filename.substring(0, lastDotIndex);
    }

    // Extract season and episode info (like S01E02)
    const seasonEpisodeMatch = nameWithoutExt.match(/[sS]\d{1,2}[eE]\d{1,2}/);
    const seasonEpisode = seasonEpisodeMatch
      ? seasonEpisodeMatch[0].toUpperCase()
      : "";

    // Extract resolution info (like 1080p, 720p, 4K)
    const resolutionMatch = nameWithoutExt.match(
      /\b(1080p|720p|4[kK]|8[kK]|2160p|UHD)\b/i
    );
    const resolution = resolutionMatch ? resolutionMatch[0] : "";

    // Extract year in parentheses (like "(2023)")
    const yearMatch = nameWithoutExt.match(/\((\d{4})\)/);
    const year = yearMatch ? yearMatch[0] : "";

    // For numeric-only filenames, add a prefix
    let mainTitle = nameWithoutExt;
    if (/^\d+$/.test(mainTitle)) {
      mainTitle = `${mainTitle}`;
    }

    // Clean the main title - keep only alphanumeric, spaces, and some safe characters
    mainTitle = mainTitle
      .replace(/[sS]\d{1,2}[eE]\d{1,2}/g, " ") // Remove season/episode pattern from title
      .replace(/\b(1080p|720p|4[kK]|8[kK]|2160p|UHD)\b/gi, " ") // Remove resolution from title
      .replace(/\(\d{4}\)/g, " ") // Remove year from title
      .replace(/[^\w\s.-]/g, " ") // Replace unsafe chars with spaces
      .replace(/\s+/g, " ") // Collapse multiple spaces
      .trim();

    // Handle purely numeric or empty titles after cleaning
    if (!mainTitle || /^\d+$/.test(mainTitle)) {
      mainTitle = `${mainTitle || nameWithoutExt || "unnamed"}`;
    }

    // Truncate the main title if it's too long
    if (mainTitle.length > maxLength) {
      mainTitle = mainTitle.substring(0, maxLength);
    }

    // Build the final name with metadata in a consistent order
    let finalName = mainTitle;

    // Add year if present
    if (year) {
      finalName += ` ${year}`;
    }

    // Add season/episode if present
    if (seasonEpisode) {
      finalName += ` ${seasonEpisode}`;
    }

    // Add resolution if present
    if (resolution) {
      finalName += ` ${resolution}`;
    }

    // Replace spaces with underscores for a more URL-friendly name
    finalName = finalName.replace(/\s+/g, "_");

    // Ensure the filename doesn't start or end with special characters
    finalName = finalName.replace(/^[.-]+|[.-]+$/g, "");

    // Add the extension back if it exists
    if (extension) {
      finalName += `.${extension.toLowerCase()}`;
    }

    return finalName;
  };

  //Upload File Code

  const isVideoFile = (filename) => {
    const videoExtensions = ["mp4", "mkv", "avi", "mov", "flv", "wmv", "webm"];
    const ext = filename.split(".").pop().toLowerCase();
    return videoExtensions.includes(ext);
  };

  

// ================= CONFIG =================
const PART_SIZE = 5 * 1024 * 1024; // 5 MB per part
// ==========================================

// Safe URL builder to avoid duplicated 'aws' segments
const buildAwsUrl = (apiUrlRaw, endpointPath) => {
  const base = apiUrlRaw.replace(/\/+$/, "");
  const ep = endpointPath.replace(/^\/+/, "");
  if (base.match(/\/aws(\/|$)/)) {
    return `${base}/${ep}`;
  }
  return `${base}/aws/${ep}`;
};

// START multipart (sends basename and optional folderPath)
const startMultipart = async (fileName, folderPath) => {
  const url = buildAwsUrl(apiUrl, "start-multipart-upload");
  const basename = fileName.replace(/^.*[\\/]/, "");
  const payload = folderPath ? { fileName: basename, folderPath } : { fileName: basename };
  const resp = await axios.post(url, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  return resp.data;
};

/**
 * uploadPart now accepts an optional `signal` (from AbortController).
 * axios supports the `signal` option which will abort the request if controller.abort() is called.
 */
const uploadPart = async ({ partNumber, uploadId, key, chunk, fileType, signal }) => {
  const encodedKey = encodeURIComponent(key);
  const url = buildAwsUrl(apiUrl, `upload-part?partNumber=${partNumber}&uploadId=${encodeURIComponent(uploadId)}&key=${encodedKey}`);

  // POST binary chunk (change to PUT if backend expects PUT)
  const resp = await axios.post(url, chunk, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": fileType || "application/octet-stream",
    },
    signal, // <-- wire AbortController.signal here
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });

  const etag =
    (resp.headers && (resp.headers.etag || resp.headers.ETag)) ||
    (resp.data && (resp.data.ETag || resp.data.etag)) ||
    null;

  return { etag, resp };
};

const completeMultipart = async ({ key, uploadId, parts }) => {
  const url = buildAwsUrl(apiUrl, "complete-multipart-upload");
  const resp = await axios.post(
    url,
    { key, uploadId, parts },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  return resp.data;
};

const abortMultipart = async ({ key, uploadId }) => {
  const url = buildAwsUrl(apiUrl, "abort-multipart-upload");
  try {
    await axios.post(
      url,
      { key, uploadId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (e) {
    console.error("Abort multipart failed", e);
  }
};

// -------------------- Updated handleFileUpload --------------------

const handleFileUpload = async () => {
  if (files.length === 0) {
    showToast("error", "Please select a file to upload.");
    return;
  }

  handleCloseFileUploadModal();

  // Helper: waits until upload is resumed or removed (cancelled)
  const waitUntilResumed = (uploadUiId) =>
    new Promise((resolve, reject) => {
      const interval = setInterval(() => {
        const pausingIntent = isPausing ? !!isPausing(uploadUiId) : false;
        const u = getUpload ? getUpload(uploadUiId) : null;

        if (pausingIntent) return; // still pausing → keep waiting

        if (u && !u.paused) {
          clearInterval(interval);
          resolve(); // resumed
          return;
        }

        if (!pausingIntent && !u) {
          clearInterval(interval);
          reject(new Error("upload-removed"));
          return;
        }
      }, 300);
    });

  try {
    // Queue all files in UI first, then upload one-by-one with a gap
    const MULTI_UPLOAD_GAP_MS = 900;
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const uploadEntries = files.map((file, i) => {
      const originalName = file.name;
      const sanitizedName = isVideoFile(originalName)
        ? sanitizeFilename(originalName)
        : originalName;
      const uploadUiId = Date.now() + i;
      const controller =
        typeof AbortController !== "undefined" ? new AbortController() : null;
      addUpload(uploadUiId, "Uploading " + sanitizedName, {
        controller,
        operation: "upload",
        sizeInBytes: file.size || 0,
      });
      return { file, uploadUiId, sanitizedName, controller };
    });

    const results = [];
    for (let i = 0; i < uploadEntries.length; i++) {
      const { file, uploadUiId, sanitizedName, controller } = uploadEntries[i];

      if (!getUpload?.(uploadUiId)) {
        results.push({ status: "fulfilled", value: "canceled" });
        continue;
      }

      if (getUpload?.(uploadUiId)?.paused || isPausing?.(uploadUiId)) {
        try {
          await waitUntilResumed(uploadUiId);
        } catch {
          results.push({ status: "fulfilled", value: "canceled" });
          continue;
        }
      }

      try {
        const cleanPath = (path || "").replace(/^\/+|\/+$/g, "");
        const basename = sanitizedName.replace(/^.*[\\/]/, "");

        // 1) Start multipart upload
        let startResp;
        try {
          startResp = await startMultipart(basename, cleanPath || undefined);
        } catch (err) {
          removeUpload(uploadUiId);
          results.push({ status: "rejected", reason: err });
          if (i < uploadEntries.length - 1) await delay(MULTI_UPLOAD_GAP_MS);
          continue;
        }

        const key = startResp.key || startResp.data?.key;
        const uploadId = startResp.uploadId || startResp.data?.uploadId;

        if (!key || !uploadId) {
          removeUpload(uploadUiId);
          results.push({
            status: "rejected",
            reason: new Error(`Invalid start-multipart response for ${sanitizedName}`),
          });
          if (i < uploadEntries.length - 1) await delay(MULTI_UPLOAD_GAP_MS);
          continue;
        }

        const ctxController = getUpload?.(uploadUiId)?.controller;
        const liveController =
          ctxController && !ctxController.signal?.aborted
            ? ctxController
            : controller && !controller.signal?.aborted
              ? controller
              : typeof AbortController !== "undefined"
                ? new AbortController()
                : null;
        updateUploadMeta(uploadUiId, {
          key,
          uploadId,
          controller: liveController,
          currentPart: 1,
        });

        // 2) Upload parts sequentially
        const totalSize = file.size;
        const partSize = PART_SIZE;
        const partsCount = Math.ceil(totalSize / partSize);
        const partsArray = [];
        let partFailed = false;

        for (let pi = 0; pi < partsCount; pi++) {
          const start = pi * partSize;
          const end = Math.min(start + partSize, totalSize);
          const chunk = file.slice(start, end);
          const partNumber = pi + 1;

          try {
            const currentController =
              (getUpload && getUpload(uploadUiId) && getUpload(uploadUiId).controller)
                ? getUpload(uploadUiId).controller
                : controller;

            const { etag } = await uploadPart({
              partNumber,
              uploadId,
              key,
              chunk,
              fileType: file.type,
              signal: currentController ? currentController.signal : undefined,
            });

            if (!etag) throw new Error("No ETag returned for uploaded part");

            partsArray.push({
              ETag: etag,
              PartNumber: partNumber,
            });

            const uploadedBytes = end;
            const progress = Math.round((uploadedBytes * 100) / totalSize);
            updateUploadProgress(uploadUiId, progress);
            updateUploadMeta(uploadUiId, { currentPart: partNumber + 1 });
          } catch (err) {
            const isCanceled =
              err &&
              (err.name === "CanceledError" ||
                err.code === "ERR_CANCELED" ||
                /canceled/i.test(err.message || "") ||
                /abort/i.test(err.message || ""));

            if (isCanceled) {
              const maybeUpload = getUpload ? getUpload(uploadUiId) : null;
              const pausingIntent = isPausing ? isPausing(uploadUiId) : false;

              if ((maybeUpload && maybeUpload.paused) || pausingIntent) {
                try {
                  await waitUntilResumed(uploadUiId);
                  pi = pi - 1; // retry same part after resume
                  continue;
                } catch {
                  try {
                    await abortMultipart({ key, uploadId });
                  } catch {}
                  removeUpload(uploadUiId);
                  results.push({ status: "fulfilled", value: "canceled" });
                  partFailed = true;
                  break;
                }
              }
            }

            try {
              await abortMultipart({ key, uploadId });
            } catch {}

            removeUpload(uploadUiId);

            if (isCanceled) {
              results.push({ status: "fulfilled", value: "canceled" });
            } else {
              results.push({ status: "rejected", reason: err });
            }
            partFailed = true;
            break;
          }
        }

        if (!partFailed) {
          // 3) Complete multipart upload
          try {
            await completeMultipart({ key, uploadId, parts: partsArray });
            removeUpload(uploadUiId);
            results.push({ status: "fulfilled", value: "success" });
          } catch (err) {
            try {
              await abortMultipart({ key, uploadId });
            } catch {}
            removeUpload(uploadUiId);
            results.push({ status: "rejected", reason: err });
          }
        }
      } catch (err) {
        results.push({ status: "rejected", reason: err });
      }

      // Wait before next file's start-multipart-upload (avoids "Too many calls")
      if (i < uploadEntries.length - 1) {
        await delay(MULTI_UPLOAD_GAP_MS);
      }
    }

    const allCanceled = results.every(
      (r) => r.status === "fulfilled" && r.value === "canceled"
    );
    const anyFailed = results.some((r) => r.status === "rejected");
    const anySucceeded = results.some(
      (r) => r.status === "fulfilled" && r.value === "success"
    );

    if (anySucceeded && !anyFailed && !allCanceled) {
      showToast("success", "Files uploaded successfully!");
      setCurrentPage(1);
      setPubPri("private");
      getFileData(1);
    } else if (anySucceeded && anyFailed) {
      showToast("warning", "Some files failed to upload.");
    } else if (allCanceled) {
      showToast("info", "Uploads were canceled successfully.");
    } else if (anyFailed) {
      showToast("error", "Error uploading some files.");
    }
  } catch (error) {
    showToast("error", error.message || "Error uploading files");
  }

  setFiles([]);
};






  const toast = useToast();

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

// Build name -> size map from allEntries
const sizeByName = useMemo(() => {
  const map = {};
  (allEntries || []).forEach((item) => {
    if (!item?.fileName) return;
    map[item.fileName] = item.fileSize || "0 Bytes";
  });
  return map;
}, [allEntries]);

// Total size of selected files (keys) in bytes
const selectedTotalBytes = useMemo(() => {
  return (keys || []).reduce((sum, name) => {
    const sizeStr = sizeByName[name];
    return sum + (sizeStr ? parseStorageToBytes(sizeStr) : 0);
  }, 0);
}, [keys, sizeByName]);

const selectedTotalGB = (selectedTotalBytes / 1024 ** 3).toFixed(2);
const isMultiSizeExceeded = selectedTotalBytes > remainingBytes;



  //Image slider functionality
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const zoomIn = () => setZoomLevel((prevZoom) => Math.min(prevZoom + 0.2, 3));
  const zoomOut = () => setZoomLevel((prevZoom) => Math.max(prevZoom - 0.2, 1));
  const toggleFullscreen = () => {
    const modalElement = document.getElementById("modal-container");

    if (!isFullscreen) {
      if (modalElement.requestFullscreen) {
        modalElement.requestFullscreen();
      } else if (modalElement.mozRequestFullScreen) {
        // Firefox
        modalElement.mozRequestFullScreen();
      } else if (modalElement.webkitRequestFullscreen) {
        // Chrome, Safari, and Opera
        modalElement.webkitRequestFullscreen();
      } else if (modalElement.msRequestFullscreen) {
        // IE/Edge
        modalElement.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.mozCancelFullScreen) {
        // Firefox
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) {
        // Chrome, Safari, and Opera
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        // IE/Edge
        document.msExitFullscreen();
      }
    }

    setIsFullscreen((prev) => !prev);
  };

  // const handleImageClose = () => {
  //   setShowImage(false);
  // };

  const handleNext = () => {
    setErrorMessage2("");
    setIsProgressVisible(true);
    setCurrentImageIndex((prevIndex) => {
      let newIndex = (prevIndex + 1) % filedata.length;
      let fileType = filedata[newIndex].fileType;

      // Skip folders and audio (audio uses floating player, not preview modal)
      while (
        (!fileType || isAudioExtension(fileType)) &&
        filedata.length > 0
      ) {
        newIndex = (newIndex + 1) % filedata.length;
        fileType = filedata[newIndex].fileType;

        if (newIndex === prevIndex) {
          setErrorMessage2("No previewable files available");
          setIsProgressVisible(false);
          return prevIndex;
        }
      }

      if (
        fileType === "jpeg" ||
        fileType === "jpg" ||
        fileType === "png" ||
        fileType === "gif" ||
        fileType === "hevc" ||
        fileType === "heif" ||
        fileType === "JPEG" ||
        fileType === "JPG" ||
        fileType === "PNG" ||
        fileType === "GIF" ||
        fileType === "HEVC" ||
        fileType === "HEIF" ||
        fileType === "svg" ||
        fileType === "SVG" ||
        fileType === "webp" ||
        fileType === "WEBP"
      ) {
        setVideoSrc("");
        setAudioSrc("");
        setPdfSrc("");
        getImageInfo(filedata[newIndex].fileName);
        //  console.log("mantra", filedata[newIndex].fileName);
        setModalFile(filedata[newIndex].fileName);
      } else if (
        fileType === "pdf" ||
        fileType === "PDF" ||
        fileType === "txt" ||
        fileType === "TXT"
      ) {
        setImageSrc("");
        setVideoSrc("");
        setAudioSrc("");
        getPdfInfo(filedata[newIndex].fileName);
        setModalFile(filedata[newIndex].fileName);
      } else if (
        fileType === "mkv" ||
        fileType === "mp4" ||
        fileType === "mov" ||
        fileType === "mpeg" ||
        fileType === "webm" ||
        fileType === "MOV"
      ) {
        setImageSrc("");
        setAudioSrc("");
        setPdfSrc("");
        setIsProgressVisible(false);
        setVideoSrc(filedata[newIndex].fileName);
        setModalFile(filedata[newIndex].fileName);
      } else {
        setImageSrc("");
        setAudioSrc("");
        setPdfSrc("");
        setVideoSrc("");
        setIsProgressVisible(false);
        setErrorMessage2("Unsupported file format");
        setModalFile(filedata[newIndex].fileName);
      }

      setZoomLevel(1);
      return newIndex;
    });
  };

  const handlePrev = () => {
    setErrorMessage2("");
    setIsProgressVisible(true);
    setCurrentImageIndex((prevIndex) => {
      let newIndex = (prevIndex - 1 + filedata.length) % filedata.length;
      let fileType = filedata[newIndex].fileType;

      // Skip folders and audio (audio uses floating player, not preview modal)
      while (
        (!fileType || isAudioExtension(fileType)) &&
        filedata.length > 0
      ) {
        newIndex = (newIndex - 1 + filedata.length) % filedata.length;
        fileType = filedata[newIndex].fileType;

        if (newIndex === prevIndex) {
          setErrorMessage2("No previewable files available");
          setIsProgressVisible(false);
          return prevIndex;
        }
      }

      if (
        fileType === "jpeg" ||
        fileType === "jpg" ||
        fileType === "png" ||
        fileType === "gif" ||
        fileType === "hevc" ||
        fileType === "heif" ||
        fileType === "JPEG" ||
        fileType === "JPG" ||
        fileType === "PNG" ||
        fileType === "GIF" ||
        fileType === "HEVC" ||
        fileType === "HEIF" ||
        fileType === "svg" ||
        fileType === "SVG" ||
        fileType === "webp" ||
        fileType === "WEBP"
      ) {
        setVideoSrc("");
        setAudioSrc("");
        setPdfSrc("");
        getImageInfo(filedata[newIndex].fileName);
        setModalFile(filedata[newIndex].fileName);
      } else if (
        fileType === "pdf" ||
        fileType === "PDF" ||
        fileType === "txt" ||
        fileType === "TXT"
      ) {
        setImageSrc("");
        setVideoSrc("");
        setAudioSrc("");
        getPdfInfo(filedata[newIndex].fileName);
        setModalFile(filedata[newIndex].fileName);
      } else if (
        fileType === "mkv" ||
        fileType === "mp4" ||
        fileType === "mov" ||
        fileType === "mpeg" ||
        fileType === "webm" ||
        fileType === "MOV"
      ) {
        setIsProgressVisible(false);
        setImageSrc("");
        setAudioSrc("");
        setPdfSrc("");
        setVideoSrc(filedata[newIndex].fileName);
        setModalFile(filedata[newIndex].fileName);
      } else {
        setIsProgressVisible(false);
        setImageSrc("");
        setAudioSrc("");
        setPdfSrc("");
        setVideoSrc("");
        setErrorMessage2("Unsupported file format");
        setModalFile(filedata[newIndex].fileName);
      }
      setZoomLevel(1);
      return newIndex;
    });
  };

  const deleteFromModal = async (filename) => {
    // console.log("Deleting file", filename);
    const dataToSend = {
      keys: [filename],
    };
    try {
      const res = await axios.delete(`${apiUrl}delete-file`, {
        data: dataToSend,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });
      // console.log(res);
      async function executeFunctionsInOrder() {
        try {
          showToast("success", "File deleted successfully");

          await getFileData(currentPage);

          await getRootFolderSize();

          handleNext();
        } catch (error) {
          console.error("Error executing functions:", error);
        }
      }

      executeFunctionsInOrder();
    } catch (error) {
      showToast("error", `There's an error while deleting file!`);
    }
  };


  //Handle prev by arrow
  useEffect(() => {
    // Function to handle keydown events
    const handleKeyDown = (event) => {
      if (showImage && event.key === "ArrowLeft") {
        handlePrev(); // Trigger the function when the left arrow key is pressed and the modal is open
      }
    };

    // Add the event listener when the component mounts
    window.addEventListener("keydown", handleKeyDown);

    // Clean up the event listener when the component unmounts
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showImage]);

  useEffect(() => {
    // Function to handle keydown events
    const handleKeyDown = (event) => {
      if (showImage) {
        if (event.key === "ArrowLeft") {
          handlePrev(); // Trigger handlePrev when the left arrow key is pressed
        } else if (event.key === "ArrowRight") {
          handleNext(); // Trigger handleNext when the right arrow key is pressed
        }
      }
    };

    // Add the event listener when the component mounts
    window.addEventListener("keydown", handleKeyDown);

    // Clean up the event listener when the component unmounts
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showImage]);

  //Drag to move
  const [draggedItem, setDraggedItem] = useState(null);




  const [folders, setFolders] = useState([]);

  useEffect(() => {
    if (showImage) {
      const fetchInitialFolders = async () => {
        try {
          const res = await axios.get(`${apiUrl}get-recent-folders`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
          // console.log("Recent folders are", res.data.result);
          setFolders(res.data.result);
          // console.log("folders are ", folders);
        } catch (error) {
          console.error("There is a error at", error);
        }
      };
      fetchInitialFolders();
    }
  }, [showImage]);

  const folderOptions = folders.map((folder) => ({
    value: getModifiedRecentFolderText(folder.folder),
    label: getModifiedRecentFolderText(folder.folder),
  }));
  const [selectedFolder, setSelectedFolder] = useState(null);

  const handleChange = (event) => {
    const selectedOption = folderOptions.find(
      (folder) => folder.value === event.target.value
    );
    setSelectedFolder(selectedOption.value);
    handleFolderSelect(selectedOption); // Pass the selected folder to the handler
  };
  const handleFolderSelect = async (selectedOption) => {
    // console.log(modalFile);
    // console.log(selectedOption);

    try {
      const res = await axios.post(
        `${apiUrl}move-file`,
        {
          sourceFolder: "",
          destinationFolder: selectedOption.value.replace(/</g, "/"),
          keys: [modalFile],
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      //  console.log(res.data.message);
      setSelectedFolder(null);
      async function executeFunctionsInOrder() {
        try {
          showToast("success", "File Moved successfully");
          setShowImage(false);

          await getFileData(currentPage);

          await getRootFolderSize();

          handleNext();
        } catch (error) {
          console.error("Error executing functions:", error);
        }
      }

      executeFunctionsInOrder();
    } catch (error) {
      console.error("There's a error");
      showToast("error", `Failed to move file.`);
    }
  };

  return (
    <>
      <ChakraProvider></ChakraProvider>


    
    

      {deletePop && (
        <div className="rename_popup_wrapper">
          <div className="rename_modal">
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: "15px",
              }}
            >
              <img src={DeletePopup} alt="" />
            </div>
            <h2 className="rename_title2">Are you sure you want to permanently delete?</h2>
            <p className="rename_subtext">This file will be permanently deleted and cannot be restored.</p>
            <div className="rename_buttons">
              <button
                className="rename_btn cancel"
                onClick={handleCloseDeletePopover}
              >
                No
              </button>
              <button
                className="rename_btn ok"
                onClick={() => handleFileDelete(activeDeleteRow)}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
        
      )}



   

      {/* // Modal component */}



      <SideNav />
      <div className="container-fluid page-body-wrapper">
        {/* partial:partials/_navbar.html */}
        <nav className="navbar p-0 fixed-top d-flex flex-row">
          <div className="navbar-brand-wrapper d-flex d-lg-none align-items-center justify-content-center">
            <a className="navbar-brand brand-logo-mini" href="#">
              <img src={Logo} alt="logo" />
            </a>
          </div>
          <div className="navbar-menu-wrapper flex-grow d-flex align-items-stretch">
            <ToggleNav />
            <div className="navbar-nav page_title">
              <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
              }}>
                <div>
                  <h1>Recycle Bin</h1>
                </div>

                <div style={{
                  display:'flex',
                  alignItems:"center",
                  gap:"10px"
                }}>
                  <div style={{
                    color: "#494949",
                    fontWeight:"510"
                  }}>
                    <div style={{fontSize:"12px"}}>Welcome, Back!</div>
                    <div style={{fontSize:"16px"}}>{userProfile.name || userData?.userData?.name || userData?.name || name}</div>
                  </div>

                  <div
                    role="button"
                    tabIndex={0}
                    title="Edit profile"
                    aria-label="Open profile"
                    onClick={() => nav("/UserProfile")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        nav("/UserProfile");
                      }
                    }}
                    style={{
                    height: "45px",
                    width: "45px",
                    borderRadius: "100px",
                    overflow: "hidden",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}>
                    <img
                      src={avatarUrl || AvatarDefault}
                      alt="Profile"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = AvatarDefault;
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </nav>
        {/* partial */}
        <div className="main-panel"> 
          <div className="content-wrapper">
            <div className={tableBoxClassName} ref={tableBoxRef}>
              <div className="filerbar_row" ref={filterBarRef}>
                <div className="show_entries_row">
                 
                </div>

                <div className="files-toolbar filter-row-new">
                  <div className="files-toolbar__main">
                    <div className="files-toolbar__view">
                  <div
                    className={`switcher-container ${
                      view === "list" ? "list-active" : "grid-active"
                    }`}
                  >
                    <img
                      src={view === "list" ? IconListW : IconList}
                      alt="List View"
                      className={`list-view-img ${
                        view === "list" ? "active" : ""
                      }`}
                      onClick={() => toggleView("list")}
                    />
                    {/* <div className="switcher-divider"></div> */}
                    <img
                      src={view === "grid" ? IconHomeW : IconHome}
                      alt="Grid View"
                      className={`grid-view-img ${
                        view === "grid" ? "active" : ""
                      }`}
                      onClick={() => toggleView("grid")}
                    />
                  </div>
                    </div>

                    <div className="files-toolbar__filters">
                      <div className="files-toolbar__sort">
                      <SortByDropdown
                        value={selectedFilter}
                        onSelect={handleFilterSelect}
                        isPremium={isPremium}
                        onUpgradeRequired={() => setShowUpgradeModal(true)}
                        sortIcon={SortHome}
                        crownIcon={svgCrown}
                      />
                      </div>

                      <div
                        className="files-toolbar__filetype"
                        ref={fileTypeDropdownRef}
                      >
                      <Dropdown
                        onSelect={handleFTypeSelect}
                        title={
                          <span className="sort-filter-span">
                            <img src={FilterHome} alt="" />
                            <span className="sort-filter-label">
                              {selectedFileTypes.length > 0
                                ? `File Type (${selectedFileTypes.length})`
                                : "File Type"}
                            </span>
                            {!isPremium && (
                              <img
                                src={svgCrown}
                                alt=""
                                className="sort-filter-crown"
                              />
                            )}
                          </span>
                        }
                        className="filter_dropdown"
                        onClick={() => {
                          if (!isPremium) {
                              setShowUpgradeModal(true);
                              return;
                            }
                            setShowFTPopup(true)}}
                      >
                      </Dropdown>

                      {showFTPopup && (
                        <div className="ft-filter-popup ft-filter-popup--end">
                          <div className="ft-filter-popup-header">
                            <div className="ft-filter-popup-title">
                              File Type Filter
                            </div>
                            <div className="ft-filter-popup-subtitle">
                              Choose formats to filter
                            </div>
                          </div>

                          <div className="ft-custom-ext-card">
                            <div className="ft-custom-ext-top">
                              <span className="ft-custom-ext-label">
                                Custom Extension
                              </span>
                            </div>
                            <p className="ft-custom-ext-hint">
                              Can’t find your format? Add any extension.
                            </p>
                            <div className="ft-custom-ext-row">
                              <span className="ft-custom-ext-dot">.</span>
                              <input
                                type="text"
                                className="ft-custom-ext-input"
                                placeholder="docx, csv, zip…"
                                value={customExtInput}
                                onChange={(e) =>
                                  setCustomExtInput(e.target.value)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    addCustomExtension();
                                  }
                                }}
                                maxLength={12}
                              />
                              <button
                                type="button"
                                className="ft-custom-ext-add"
                                onClick={addCustomExtension}
                              >
                                Add
                              </button>
                            </div>
                            {selectedFileTypes.filter(
                              (t) => !fileTypes.includes(t)
                            ).length > 0 && (
                              <div className="ft-custom-ext-chips">
                                {selectedFileTypes
                                  .filter((t) => !fileTypes.includes(t))
                                  .map((ext) => (
                                    <button
                                      key={ext}
                                      type="button"
                                      className="ft-custom-ext-chip"
                                      onClick={() =>
                                        handleFTCheckboxChange(ext)
                                      }
                                      title="Remove"
                                    >
                                      .{ext}
                                      <span aria-hidden="true">×</span>
                                    </button>
                                  ))}
                              </div>
                            )}
                          </div>

                          <div className="ft-filter-popup-list">
                            {fileTypes.map((fileType) => {
                              const isSelected =
                                selectedFileTypes.includes(fileType);
                              return (
                                <label
                                  key={fileType}
                                  className={`ft-filter-type-item${
                                    isSelected ? " is-selected" : ""
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() =>
                                      handleFTCheckboxChange(fileType)
                                    }
                                  />
                                  <span>{fileType.toUpperCase()}</span>
                                </label>
                              );
                            })}
                          </div>

                          <div className="ft-filter-popup-footer">
                            <button
                              type="button"
                              className="ft-filter-btn-cancel"
                              onClick={closeOnlyPopup}
                            >
                              Done
                            </button>
                            <button
                              type="button"
                              className="ft-filter-btn-apply"
                              onClick={clearFileTypeFilter}
                            >
                              Clear
                            </button>
                          </div>
                        </div>
                      )}
                      </div>
                    </div>
                  </div>
                
                </div>
              </div>

              <BulkSelectionToolbar
                selectedCount={keys.length + keys2.length}
                isSelectAll={isSelectAll}
                onSelectAllToggle={handleSelectAllToggle}
                variant="recycleBin"
                onRestore={() => {
                  if ((keys?.length || 0) === 0 && (keys2?.length || 0) === 0) {
                    showToast("error", "No items selected to restore.");
                    return;
                  }
                  setShowMultiRestoreConfirm(true);
                }}
                onDelete={() => {
                  if (keys.length === 0 && keys2.length === 0) {
                    showToast("error", "No items selected to delete");
                  } else {
                    setShowDeleteModal(true);
                  }
                }}
              />

             
              
                <div id="dataView">



                  {view === "list" ? (
                    placeholderLoading || searchLoading ? (
                      <div
                        className="table-responsive"
                        id="listViewContent"
                        style={{ margin: "20px" }}
                      >
                        <Placeholder.Grid
                          rows={11}
                          columns={5}
                          active
                          style={{
                            paddingLeft: 20,
                            paddingRight: 20,
                            paddingTop: 12,
                          }}
                        />
                      </div>
                    ) : filedata.length === 0 ? (
                      <div style={{ margin: "20px" }}>
                        <EmptyFilesState
                          variant="recycleBin"
                          isFiltered={
                            selectedFileTypes.length > 0 ||
                            query.trim().length > 0
                          }
                        />
                      </div>
                    ) : (
                    <div className="table-responsive" id="listViewContent">
                      <table id="filestable" className="table table-striped">
                        <thead>
                          <tr>
                            <th style={{ width: "40px", textAlign: "center" }} className="files-col-check">
                              <input
                                id="check-Atharva"
                                type="checkbox"
                                onChange={handleSelectAllToggle}
                                checked={isSelectAll}
                              />
                            </th>

                         <th
  className="files-col-name"
  style={{
    width: "60%",
    fontWeight: 600,
    color: "#181818",
  }}
>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      width: "100%"
    }}
  >
    <span className="column-name-new" style={{ display: "flex", alignItems: "center" }}>
      File Name
      <img
        src={SortIcon}
        alt=""
        style={{ cursor: "pointer", marginLeft: 6 }}
        onClick={() =>
          handleFilterSelect(
            selectedFilter === "By Name(A-Z)"
              ? "name-filter2"
              : "name-filter1"
          )
        }
      />
    </span>
  
  </div>
</th>


                            <th
                              className="files-col-size"
                              style={{
                                width: "15%",
                                fontWeight: 600,
                                color: "#181818",
                                justifyContent: "center",
                              }}
                            >
                              <span
                                className="column-name-new"
                                style={{
                                  justifyContent: "center",
                                  alignItems: "center",
                                }}
                              >
                                File Size
                                <img
                                  src={SortIcon}
                                  alt=""
                                  style={{ cursor: "pointer", marginLeft: 6 }}
                                  onClick={() =>
                                    handleFilterSelect(
                                      selectedFilter === "By Size(Asc)"
                                        ? "size-filter2"
                                        : "size-filter1"
                                    )
                                  }
                                />
                              </span>
                            </th>

                            <th
                              className="files-col-date"
                              style={{
                                width: "15%",
                                fontWeight: 600,
                                color: "#181818",
                                justifyContent: "center",
                              }}
                            >
                              <span
                                className="column-name-new"
                                style={{
                                  justifyContent: "center",
                                  alignItems: "center",
                                }}
                              >
                                Modified On
                                <img
                                  src={SortIcon}
                                  alt=""
                                  style={{ cursor: "pointer", marginLeft: 6 }}
                                  onClick={() =>
                                    handleFilterSelect(
                                      selectedFilter === "By Date(Oldest)"
                                        ? "date-filter2"
                                        : "date-filter1"
                                    )
                                  }
                                />
                              </span>
                            </th>

                            <th
                              className="files-col-action"
                              style={{
                                width: "15%",
                                fontWeight: 600,
                                color: "#181818",
                                textAlign: "center",
                              }}
                            >
                              Action
                            </th>
                          </tr>
                        </thead>


 

                      {filedata.map((file, index) => {
    return (
                              <tbody>
                                <tr
                                  className={`hover_cell ${
                                    activeRow === 1 ? "active-row" : ""
                                  }`}
                                
                                >
                                  <td>
                                    <input
                                      id="check-Atharva"
                                      type="checkbox"
                                      onChange={() =>
                                        handleCheckboxChange(file)
                                      }
                                      checked={
                                        file.isFolder
                                          ? keys2.includes(file.fileName)
                                          : keys.includes(file.fileName)
                                      }
                                    />
                                  </td>
                                  <td
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "10px",
                                    }}
                                  >
                                    <span
                                      className="filename_link"
                                      style={{ cursor: "pointer" }}
                                    >
                                      {/* Check if the file is shared and display the sharedIcon, otherwise display file.icon */}
                                      <img
                                        src={getFileIcon(file)}
                                        height={32}
                                        alt="file icon"
                                        onError={(e) => {
                                          e.target.onerror = null;
                                          e.target.src = "/images/icons/doc.svg";
                                      }}
                                      />
                                    </span>
                                    <div className="file-item">
                                    
                                     <span
                                        title={getTextAfterLastSlash(file.fileName)}
                                        className="file-name filename_link"
                                        style={{ cursor: "pointer" }} // Keep pointer to indicate it's clickable
                                        onClick={(e) => {
                                          e.preventDefault();
                                          if (trySelectInsteadOfOpen(file)) return;
                                          // Show access denied modal
                                          setFileToAccess(file);
                                          setShowAccessDeniedModal(true);
                                        }}
                                      >
                                        {getTextAfterLastSlash(
                                          customTruncateFileName(file.fileName, 55)
                                        )}
                                      </span>


                                    
                                    </div>
                                  </td>

                                  <td
                                    class="fileSizeTL"
                                    data-sort={1673004}
                                    style={{
                                      textAlign: "center",
                                      fontWeight: "500",
                                    }}
                                  >
                                    <span style={{ fontWeight: "500" }}>
                                      {file.fileSize}
                                    </span>
                                  </td>
                                  <td
                                    class="fileSizeTD"
                                    data-sort="2023-12-16 07:32:38"
                                    style={{ textAlign: "center" }}
                                  >
                                    <p>
                                      {file.uploadDateTime.substring(
                                        0,
                                        file.uploadDateTime.indexOf(",")
                                      )}
                                    </p>
                                    <span>
                                      {file.uploadDateTime
                                        .substring(
                                          file.uploadDateTime.indexOf(",") + 1
                                        )
                                        .trim()}
                                    </span>
                                  </td>

                                  <td style={{ textAlign: "center" }}>
                                    <div className="dropdown">
                                      <button
                                        type="button"
                                        id="dropdownMenuButton"
                                        aria-haspopup="true"
                                        aria-expanded="false"
                                        {...getBulkRowActionToggleProps(hasBulkSelection, showToast)}
                                      >
                                        <svg
                                          width="24"
                                          height="24"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          stroke-width="2"
                                          stroke-linecap="round"
                                          stroke-linejoin="round"
                                          class="feather feather-more-vertical"
                                        >
                                          <circle
                                            cx="12"
                                            cy="12"
                                            r="1"
                                          ></circle>
                                          <circle cx="12" cy="5" r="1"></circle>
                                          <circle
                                            cx="12"
                                            cy="19"
                                            r="1"
                                          ></circle>
                                        </svg>
                                      </button>
                                      <div
                                        className="dropdown-menu custom-dropdown-menu"
                                        style={{
                                          transform:
                                            "translate3d(-242px, -25px, 0px)",
                                        }}
                                        // aria-labelledby="dropdownMenuButton"
                                      >
                                        <a className="file-container">
                                          <div className="file-icon">
                                            <img
                                              src={getFileIcon(file)}
                                              onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = "/images/icons/doc.svg";
                                            }}
                                              alt="file icon"
                                            />
                                          </div>
                                          <div className="file-details">
                                            <div className="file-name">
                                              {file.fileName}
                                            </div>
                                            <div className="upload-date">
                                              <p>
                                                Uploaded on{" "}
                                                {file.uploadDateTime.substring(
                                                  0,
                                                  file.uploadDateTime.indexOf(
                                                    ","
                                                  )
                                                )}
                                              </p>
                                              <span>• {file.fileSize}</span>
                                            </div>
                                          </div>
                                        </a>
                                      




                                       {/* Restore option */}
                                        <a
                                          className="dropdown-item dropdown-item-custom"
                                          href="#"
                                          onClick={() => handleRestore(file)}
                                        >
                                          <img
                                            src={restoreIcon}
                                            alt="Restore"
                                            className="dropdown-icon-list"
                                          />
                                          Restore
                                        </a>

                                        {/* Delete permanently option */}
                                        <a
                                          className="dropdown-item dropdown-item-custom"
                                          href="#"
                                          onClick={() => handleOpenDeletePopover(file)}
                                        >
                                          <img
                                            src={deleteIcon2}
                                            alt="Delete"
                                            className="dropdown-icon-list"
                                          />
                                          Delete Permanently
                                        </a>

                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              </tbody>
                            );
                          })}
                      </table>
                    </div>
                    )
                  ) : (
                    <>
                      <div className="grid-view2">
                        {placeholderLoading || searchLoading ? (
                                                 <div className="file-grid-placeholder" id="cardPlaceHolder" style={{width:"100%"}}>
                                                   <Placeholder.Grid
                                                     rows={2}
                                                     columns={5}
                                                     active
                                                     style={{ paddingLeft: 20, paddingRight: 20, paddingTop: 12 }}
                                                   />
                                                 </div>
                                               ) : filedata.length === 0 ? (
                        <EmptyFilesState
                          variant="recycleBin"
                          isFiltered={
                            selectedFileTypes.length > 0 ||
                            query.trim().length > 0
                          }
                        />
                      ) : (
                          filedata.map((file, index) => (
  <div
    className={`grid-item2 ${
      draggedItem?.fileName === file.fileName ? "dragging" : ""
    }`}
    key={index}
    style={{ cursor: "pointer" }}
    
    onClick={(e) => {
      // ────────────────────────────────────────────────
      // Prevent modal when clicking three-dots or dropdown menu
      if (e.target.closest(".menu-icon2") || e.target.closest(".dropdown-menu")) {
        return;
      }
      // ────────────────────────────────────────────────

      e.preventDefault();
      if (trySelectInsteadOfOpen(file)) return;
      // Show access denied modal
      setFileToAccess(file);
      setShowAccessDeniedModal(true);
    }}
  >
    <input
      id="check-Atharva"
      type="checkbox"
      className="checkbox-input"
      style={{
        position: "absolute",
        top: "8px",
        left: "8px",
      }}
      onClick={(event) => event.stopPropagation()} // Stops click from bubbling to parent
      onChange={() => handleCheckboxChange(file)}
      checked={
        file.isFolder
          ? keys2.includes(file.fileName)
          : keys.includes(file.fileName)
      }
    />

    {/* Three Dots Menu */}
    <div className="menu-icon2">
      <div className="dropdown">
        <button
          type="button"
          id="dropdownMenuButton"
          aria-haspopup="true"
          aria-expanded="false"
          {...getBulkRowActionToggleProps(hasBulkSelection, showToast)}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="feather feather-more-vertical"
          >
            <circle cx="12" cy="12" r="1" />
            <circle cx="12" cy="5" r="1" />
            <circle cx="12" cy="19" r="1" />
          </svg>
        </button>
        <div
          className="dropdown-menu custom-dropdown-menu"
          style={{
            transform: "translate3d(-242px, -25px, 0px)",
          }}
        >
          <a className="file-container">
            <div className="file-icon">
              <img
                src={getFileIcon(file)}
                height={32}
                onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/images/icons/doc.svg";
                }}
                alt="file icon"
              />
            </div>
            <div className="file-details">
              <div className="file-name">{file.fileName}</div>
              <div className="upload-date">
                <p>
                  Uploaded on{" "}
                  {file.uploadDateTime.substring(
                    0,
                    file.uploadDateTime.indexOf(",")
                  )}
                </p>
                <span>• {file.fileSize}</span>
              </div>
            </div>
          </a>

          {/* Restore option */}
          <a
            className="dropdown-item dropdown-item-custom"
            href="#"
            onClick={() => handleRestore(file)}
          >
            <img
              src={restoreIcon}
              alt="Restore"
              className="dropdown-icon-list"
            />
            Restore
          </a>

          {/* Delete permanently option */}
          <a
            className="dropdown-item dropdown-item-custom"
            href="#"
            onClick={() => handleOpenDeletePopover(file)}
          >
            <img
              src={deleteIcon2}
              alt="Delete Permanently"
              className="dropdown-icon-list"
            />
            Delete Permanently
          </a>
        </div>
      </div>
    </div>

    {/* File Icon / public image preview (visible cards only) */}
    <CardFilePreview
      file={file}
      sharedIconSrc={sharedIcon}
      getIcon={getFileIcon}
    />

    <div style={{ padding: "18px" }}>
      {/* File Name */}
      <div
        className="file-name2"
        style={{
          cursor: "pointer",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          maxWidth: "100%",
        }}
        title={file.fileName}
      >
        {getTextAfterLastSlash(file.fileName)}
      </div>

      {/* File Path */}
      <div
        className="file-path2"
        style={{
          fontSize: "12px",
          color: "#9a9a9a",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          maxWidth: "100%",
        }}
        title={getFilePathOnly(file.fileName)}
      >
        {getFilePathOnly(file.fileName)}
      </div>

      {/* Date & Items */}
      <div className="file-info2" style={{ textAlign: "left" }}>
        <span className="file-date2">
          {file.uploadDateTime.substring(
            0,
            file.uploadDateTime.indexOf(",")
          )}
        </span>
        <span className="file-items2">• {file.fileSize}</span>
      </div>
    </div>
  </div>
))
                        )}
                      </div>
                    </>
                  )}
                </div>
           





           

   

            
            </div>
          </div>
          <FilesPaginationFooter
            totalEntries={totalEntries}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(size) => {
              setItemsPerPage(size);
              setCurrentPage(1);
            }}
          />
        </div>
        {/* main-panel ends */}
      </div>

      {/*All files Shower */}
      <Modal
        open={showImage}
        onClose={handleImageClose}
        className="file_upload_modal_style"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          padding: "0",
          borderRadius: "15px",
          margin: "auto",
        }}
      >
        <div
          id="modal-container"
          style={{
            width: isFullscreen ? "100vw" : "100%",
            maxWidth: isFullscreen ? "none" : "720px",
            backgroundColor: "white",
            borderRadius: "8px",
            overflow: "hidden",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            height: isFullscreen ? "100vh" : "90vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "15px 20px",
              textAlign: "center",
              position: "relative",
              borderBottom: "1px solid #eee",
            }}
          >
            <h2
              style={{
                margin: "0",
                color: "#E9A54D",
                fontSize: "20px",
                fontWeight: "500",
              }}
            >
              Uploaded File
            </h2>
            <button
              onClick={handleImageClose}
              style={{
                position: "absolute",
                top: "15px",
                right: "15px",
                background: "none",
                border: "none",
                fontSize: "30px",
                cursor: "pointer",
                color: "#888",
              }}
            >
              ×
            </button>
          </div>

          {/* Content Area */}
          <div
            style={{
              flex: 1,
              padding: "0",
              position: "relative",
              // backgroundColor: "#f9f9f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "auto", // Make content scrollable if it exceeds the height
            }}
          >
            <button
              onClick={handlePrev}
              style={{
                position: "fixed",
                left: "20px",
                background: "none",
                border: "none",
                fontSize: "30px",
                cursor: "pointer",
                zIndex: 10,
                backgroundColor: "white",
                borderRadius: "25px",
                padding: "0 15px",
              }}
            >
              ❮
            </button>

            {isProgressVisible ? (
              // Show loader *inside* the content area
              <div
                style={{
                  height: "100px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <img src={loaderGif} alt="" style={{ height: "50%" }} />
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  // backgroundColor: isFullscreen
                  //   ? "rgba(0, 0, 0, 0.8)"
                  //   : "rgba(0, 0, 0, 0.5)",
                  padding: isFullscreen ? "0" : "20px",
                  width: isFullscreen ? "100%" : "80%",
                  height: isFullscreen ? "100%" : "90%",
                  transform: `scale(${zoomLevel})`,
                  transition: "transform 0.2s ease-in-out",
                }}
              >
                {videoSrc ? (
                  <VideoPlayer
                    url={buildVideoStreamUrl(apiUrl, token, videoSrc)}
                    fileName={videoSrc}
                  />
                ) : pdfSrc ? (
                  <iframe
                    src={pdfSrc}
                    border="0"
                    width="100%"
                    style={{
                      height: isFullscreen ? "100%" : "220px",
                      border: "none",
                      backgroundColor: "white",
                    }}
                  />
                ) : imageSrc ? (
                  <img
                    src={imageSrc}
                    alt="Image format not supported"
                    decoding="async"
                    style={{
                      width: "auto",
                      maxWidth: isFullscreen ? "90vw" : "100%",
                      maxHeight: isFullscreen ? "90vh" : "80vh",
                      objectFit: "contain",
                      borderRadius: "6px",
                      transform: `scale(${zoomLevel})`,
                      transition: "transform 0.2s ease-in-out",
                    }}
                  />
                ) : audioSrc ? (
                  <div className="audio_player_modal">
                    <audio
                      controls
                      style={{
                        width: "100%",
                      }}
                    >
                      <source src={audioSrc} type="audio/ogg" />
                      <source src={audioSrc} type="audio/mpeg" />
                      <source src={audioSrc} type="audio/wav" />
                      <source src={audioSrc} type="audio/mp3" />
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                ) : errorMessage2 ? (
                  <p>{errorMessage2}</p>
                ) : (
                  <p></p>
                )}
              </div>
            )}
            <button
              onClick={handleNext}
              style={{
                position: "fixed",
                right: "20px",
                background: "none",
                border: "none",
                fontSize: "30px",
                cursor: "pointer",
                zIndex: 10,
                backgroundColor: "white",
                borderRadius: "25px",
                padding: "0 15px",
              }}
            >
              ❯
            </button>
          </div>

          <div style={{ padding: "15px 20px" }}>
            <div
              style={{
                marginBottom: "15px",
                display: "flex",
                justifyContent: "space-between",
                flexDirection: "column", // stack label and scroll area
              }}
            >
              <label
                style={{
                  fontWeight: "500",
                  fontSize: isFullscreen ? "19px" : "16px",
                  marginBottom: "8px",
                }}
              >
                Move file to:
              </label>

              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  overflowX: "auto",
                  gap: "20px",
                  whiteSpace: "nowrap",
                  width: "100%",
                  paddingBottom: "5px",
                }}
                className="scrollable-div"
              >
                {folderOptions
                  .filter(
                    (folder) =>
                      folder.value.trim() !== "" && folder.label.trim() !== ""
                  )
                  .map((folder) => (
                    <div
                      key={folder.value}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      <input
                        type="radio"
                        id={folder.value}
                        name="folder"
                        value={folder.value}
                        checked={selectedFolder === folder.value}
                        onChange={handleChange}
                        style={{ marginRight: "5px", flexShrink: 0 }}
                      />
                      <label
                        htmlFor={folder.value}
                        title={folder.label.replace(/</g, "/")} // tooltip shows full path with slashes
                        style={{
                          fontSize: isFullscreen ? "17px" : "15px",
                          display: "block",
                          marginBottom: "0px",
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                        }}
                      >
                        {folder.label.replace(/</g, "/")}
                      </label>
                    </div>
                  ))}
              </div>
            </div>

            {/* Footer with Buttons */}
            <div
              style={{
                padding: "15px 20px",
                borderTop: "1px solid #eee",
                backgroundColor: "white",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#f5f5f5",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  <Button onClick={zoomIn}>
                    <img
                      src={zoomin}
                      alt="Zoom In"
                      style={{ width: "19px", height: "19px" }}
                    />
                  </Button>
                  Zoom
                  <Button onClick={zoomOut}>
                    <img
                      src={zoomout}
                      alt="Zoom Out"
                      style={{ width: "19px", height: "19px" }}
                    />
                  </Button>
                </div>

                <button
                  onClick={toggleFullscreen}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "8px 12px",
                    backgroundColor: "#f5f5f5",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  <img
                    src={fullscreeen}
                    alt="Zoom Out"
                    style={{
                      width: "15px",
                      height: "15px",
                      marginRight: "6px",
                    }}
                  />
                  {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                </button>

                <button
                  onClick={() => deleteFromModal(modalFile)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "8px 12px",
                    backgroundColor: "#f5f5f5",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  <img
                    src={deleteIcon}
                    alt="Zoom Out"
                    style={{
                      width: "15px",
                      height: "15px",
                      marginRight: "6px",
                    }}
                  />
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      </Modal>

     





{/* Restore Folder Picker Modal */}
{showRestoreModal && (
  <FolderDestinationModal
    variant="restore"
    title="Restore to"
    itemSummary={formatModalItemSummary(fileToRestore?.fileName)}
    selectedPath={folderNavigationPath.join("/")}
    onClose={closeRestoreDestinationModal}
    onConfirm={() => {
      const destination = folderNavigationPath.join("/");
      setSelectedDestination(destination);
      performRestore();
    }}
    confirmLabel="Restore here"
    locationPath={folderNavigationPath.join(" / ")}
    counter={folderNavigationPath.length}
    onRootClick={handleRestoreRootClick}
    onBack={navigateBack}
    newFolderName={newFolderName}
    onNewFolderNameChange={setNewFolderName}
    onCreateFolder={handleCreateFolder}
    creatingFolder={creatingFolder}
    footerExtra={
      <div className="fdm-storage-hint">
        <div className="filesize-warning-div" style={{ gap: 0 }}>
          <span className="filesize-warning-span">
            <div className="warning-icon">!</div>
            {`Storage left: ${(remainingBytes / 1_000_000_000).toFixed(2)} GB`}
          </span>
          <span
            className="filesize-warning-span"
            style={{
              marginTop: "8px",
              color: isSizeExceeded ? "red" : "#5d5d5d",
            }}
          >
            {`Current file size: ${fileSizeDisplay}`}
          </span>
        </div>
      </div>
    }
  >
    <FolderPickerListPanel
      loading={loadingFolders}
      folders={currentFolders}
      counter={folderNavigationPath.length}
      getTextAfterSlashes={getRestoreFolderLabel}
      onOpenFolder={(fileName) => {
        if (openingFolder) return;
        navigateIntoFolder({ fileName });
      }}
    />
  </FolderDestinationModal>
)}





{/* Access Denied Modal – Spacious Premium Version */}
{showAccessDeniedModal && (
  <div
    className="modal fade show"
    style={{
      display: "block",
      backgroundColor: "rgba(0,0,0,0.7)",
      backdropFilter: "blur(6px)",
    }}
    onClick={() => {
      setShowAccessDeniedModal(false);
      setFileToAccess(null);
    }}
  >
    <div
      className="modal-dialog modal-dialog-centered"
      onClick={(e) => e.stopPropagation()}
      style={{ maxWidth: "420px" }}  // slightly wider for better proportions with more padding
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "20px",
          overflow: "hidden",
          boxShadow: "0 30px 70px -20px rgba(0,0,0,0.4)",
          border: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        {/* Icon + Title Section – more vertical space */}
        <div
          style={{
            padding: "48px 32px 32px",   // ← increased top/bottom
            textAlign: "center",
            background: "linear-gradient(to bottom, #fffaf0, #ffffff)",
          }}
        >
          <div
            style={{
              width: "72px",
              height: "72px",
              margin: "0 auto 24px",      // more space below icon
              background: "rgba(255, 171, 73, 0.15)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFAB49",
              fontSize: "36px",
              boxShadow: "0 6px 16px rgba(255, 171, 73, 0.25)",
            }}
          >
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 9.9-1" />
              <circle cx="12" cy="15" r="1" />
            </svg>
          </div>

          <h5
            style={{
              margin: "0 0 12px",
              fontSize: "22px",
              fontWeight: 700,
              color: "#111",
            }}
          >
            Access Restricted
          </h5>

          <p
            style={{
              margin: 0,
              fontSize: "15px",
              color: "#555",
              lineHeight: 1.6,
            }}
          >
            This {fileToAccess?.isFolder ? "folder" : "file"} is in the Recycle Bin.
          </p>
        </div>

        {/* File Name Highlight – more padding around */}
        <div
          style={{
            padding: "0 40px 32px",   // ← increased horizontal & bottom padding
            textAlign: "center",
            fontSize: "15.5px",
            color: "#222",
            lineHeight: 1.5,
          }}
        >
          <strong style={{ color: "#000" }}>{fileToAccess?.fileName}</strong><br />
          needs to be restored before you can access it.
        </div>

        {/* Actions – more generous padding + taller buttons */}
        <div
          style={{
            padding: "32px 40px 40px",   // ← significantly increased
            display: "flex",
            gap: "16px",
            borderTop: "1px solid #eee",
            background: "#fafafa",
          }}
        >
          <button
            onClick={() => {
              setShowAccessDeniedModal(false);
              setFileToAccess(null);
            }}
            style={{
              flex: 1,
              padding: "14px 0",          // taller buttons
              borderRadius: "12px",
              border: "1px solid #ddd",
              background: "white",
              color: "#444",
              fontWeight: 600,
              fontSize: "15.5px",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            Cancel
          </button>

          <button
            onClick={() => {
              setShowAccessDeniedModal(false);
              handleRestore(fileToAccess);
              setFileToAccess(null);
            }}
            style={{
              flex: 1,
              padding: "14px 0",
              borderRadius: "12px",
              border: "none",
              background: "linear-gradient(135deg, #FFAB49, #ff9a2e)",
              color: "white",
              fontWeight: 600,
              fontSize: "15.5px",
              boxShadow: "0 5px 16px rgba(255, 171, 73, 0.35)",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            Restore Now
          </button>
        </div>
      </div>
    </div>
  </div>
)}


{showRestoreFolderModal && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(0,0,0,0.55)",
      backdropFilter: "blur(3px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
      animation: "fadeIn 0.2s ease-out",
    }}
    onClick={() => {
      setShowRestoreFolderModal(false);
      setFileToRestore(null);
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        width: "100%",
        maxWidth: "420px",
        background: "#ffffff",
        borderRadius: "16px",
        boxShadow: "0 12px 35px rgba(0,0,0,0.18)",
        overflow: "hidden",
        animation: "slideUp 0.25s ease-out",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 22px",
          background: "linear-gradient(135deg,#fff7ec,#ffe2bf)",
          borderBottom: "1px solid #f1e0cc",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h5
          style={{
            margin: 0,
            fontSize: "18px",
            fontWeight: 600,
            color: "#333",
          }}
        >
          Restore Folder
        </h5>

        <button
          type="button"
          onClick={() => {
            setShowRestoreFolderModal(false);
            setFileToRestore(null);
          }}
          style={{
            background: "none",
            border: "none",
            fontSize: "20px",
            cursor: "pointer",
            color: "#777",
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: "20px 24px", color: "#444" }}>
        <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.5 }}>
          Are you sure you want to restore
          <strong> {fileToRestore?.fileName}</strong> from the recycle bin?
        </p>

        <ul
          style={{
            marginTop: "12px",
            paddingLeft: "18px",
            fontSize: "13px",
            color: "#777",
          }}
        >
          <li>- This folder will return to its original location.</li>
          <li>- All permissions and sharing settings will remain intact.</li>
        </ul>

        {isSizeExceeded && (
          <p
            style={{
              color: "#EF4444",
              fontSize: "13px",
              marginTop: 8,
              fontWeight: 500,
            }}
          >
            Not enough storage to restore this folder. 
            <br />
            Required:{" "}
            {currentFileSizeGB} GB.
          </p>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "14px 24px 18px",
          borderTop: "1px solid #f1f3f5",
          display: "flex",
          justifyContent: "flex-end",
          gap: "10px",
        }}
      >
        {/* Cancel Button */}
        <button
          type="button"
          onClick={() => {
            setShowRestoreFolderModal(false);
            setFileToRestore(null);
          }}
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            backgroundColor: "#f5f5f5",
            border: "1px solid #dedede",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 500,
            color: "#555",
          }}
        >
          Cancel
        </button>

        {/* Restore Button */}
        <button
  type="button"
  onClick={async () => {
    if (!fileToRestore) return;

    if (isSizeExceeded) {
      showToast(
        "error",
        `Not enough storage to restore "${fileToRestore.fileName}".`
      );
      setShowRestoreFolderModal(false);
      setFileToRestore(null);
      return;
    }

    const folderName = fileToRestore.fileName;
    setShowRestoreFolderModal(false);
    setFileToRestore(null);

    const loaderStartedAt = Date.now();
    setLoader_Restore(true);
    dispatch(setLoader(true));

    try {
      const apiEndpoint = `${apiUrl}restore-folders`;
      await axios.post(
        apiEndpoint,
        { folders: [folderName] },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      dispatch(fetchUserFolderSize({ token, force: true }));
      getFileData(currentPage);
      getRootFolderSize();

      afterMinLoaderDisplay(loaderStartedAt, () => {
        setLoader_Restore(false);
        showToast("success", `Folder restored successfully`);
      });
    } catch (error) {
      console.error("Error restoring folder:", error);
      showToast("error", "Error restoring folder");

      afterMinLoaderDisplay(loaderStartedAt, () => {
        setLoader_Restore(false);
      });
    } finally {
      dispatch(setLoader(false));
    }
  }}
  style={{
    padding: "8px 20px",
    borderRadius: "8px",
    background: "#FFAB49",
    border: "none",
    color: "#fff",
    fontWeight: 600,
    fontSize: "13px",
    cursor: "pointer",
    boxShadow: "0 3px 10px rgba(255,171,73,0.4)",
  }}
>
  Restore
</button>

      </div>
    </div>

    {/* Inline Animations */}
    <style>
      {`
        @keyframes fadeIn {
          from { opacity: 0 }
          to { opacity: 1 }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0 }
          to { transform: translateY(0); opacity: 1 }
        }
      `}
    </style>
  </div>
)}


{showMultiRestoreConfirm && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(0,0,0,0.55)",
      backdropFilter: "blur(3px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
      animation: "fadeIn 0.2s ease-out",
    }}
    onClick={() => setShowMultiRestoreConfirm(false)}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        width: "100%",
        maxWidth: "420px",
        background: "#ffffff",
        borderRadius: "16px",
        boxShadow: "0 12px 35px rgba(0,0,0,0.18)",
        overflow: "hidden",
        animation: "slideUp 0.25s ease-out",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 22px",
          background: "linear-gradient(135deg,#fff7ec,#ffe2bf)",
          borderBottom: "1px solid #f1e0cc",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h5
          style={{
            margin: 0,
            fontSize: "18px",
            fontWeight: 600,
            color: "#333",
          }}
        >
          Restore items
        </h5>

        <button
          type="button"
          onClick={() => setShowMultiRestoreConfirm(false)}
          style={{
            background: "none",
            border: "none",
            fontSize: "20px",
            cursor: "pointer",
            color: "#777",
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      {/* Body */}
<div style={{ padding: "20px 24px", color: "#444" }}>
  <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.5 }}>
    All selected folders will be restored to their original locations in your storage. 
    Selected files can be restored to a destination of your choice.
  </p>

  <ul
    style={{
      marginTop: "12px",
      paddingLeft: "18px",
      fontSize: "13px",
      color: "#777",
    }}
  >
    <li>- Folders: restored back to their original paths.</li>
    <li>- Files: you can choose where to restore them.</li>
  </ul>
</div>


      {/* Footer */}
      <div
        style={{
          padding: "14px 24px 18px",
          borderTop: "1px solid #f1f3f5",
          display: "flex",
          justifyContent: "flex-end",
          gap: "10px",
        }}
      >
        <button
          type="button"
          onClick={() => setShowMultiRestoreConfirm(false)}
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            backgroundColor: "#f5f5f5",
            border: "1px solid #dedede",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 500,
            color: "#555",
          }}
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={() => {
            setShowMultiRestoreConfirm(false);
            handleMulRestore();
          }}
          style={{
            padding: "8px 20px",
            borderRadius: "8px",
            background: "#FFAB49",
            border: "none",
            color: "#fff",
            fontWeight: 600,
            fontSize: "13px",
            cursor: "pointer",
            boxShadow: "0 3px 10px rgba(255,171,73,0.4)",
          }}
        >
          Restore
        </button>
      </div>
    </div>

    <style>
      {`
        @keyframes fadeIn {
          from { opacity: 0 }
          to { opacity: 1 }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0 }
          to { transform: translateY(0); opacity: 1 }
        }
      `}
    </style>
  </div>
)}








{/* Multi-File Restore Modal - Folder Picker */}
{showMultiRestoreModal && (
  <FolderDestinationModal
    variant="restore"
    title="Restore to"
    itemSummary={formatModalItemSummary(modalKeys.length ? modalKeys : keys)}
    selectedPath={folderNavigationPath.join("/")}
    onClose={closeMultiRestoreDestinationModal}
    onConfirm={() => {
      if (isMultiSizeExceeded) return;
      const destination = folderNavigationPath.join("/");
      confirmMultiFileRestore(destination, modalKeys);
    }}
    confirmLabel="Restore here"
    confirmDisabled={isMultiSizeExceeded}
    locationPath={folderNavigationPath.join(" / ")}
    counter={folderNavigationPath.length}
    onRootClick={handleRestoreRootClick}
    onBack={navigateBack}
    newFolderName={newFolderName}
    onNewFolderNameChange={setNewFolderName}
    onCreateFolder={handleCreateFolder}
    creatingFolder={creatingFolder}
    footerExtra={
      <div className="fdm-storage-hint">
        <div className="filesize-warning-div" style={{ gap: 0 }}>
          <span className="filesize-warning-span">
            <div className="warning-icon">!</div>
            Storage left: {formatStorageSize(remainingBytes)}
          </span>
          <span
            className="filesize-warning-span"
            style={{
              marginTop: "8px",
              color: isMultiSizeExceeded ? "red" : "#5d5d5d",
            }}
          >
            {`Selected files total size: ${selectedTotalGB} GB`}
          </span>
        </div>
      </div>
    }
  >
    <FolderPickerListPanel
      loading={loadingFolders}
      folders={currentFolders}
      counter={folderNavigationPath.length}
      getTextAfterSlashes={getRestoreFolderLabel}
      onOpenFolder={(fileName) => {
        if (openingFolder) return;
        navigateIntoFolder({ fileName });
      }}
    />
  </FolderDestinationModal>
)}

{/* Upgrade Plan */}
     {showUpgradeModal && (
        <div className="premium-upgrade-overlay">
          <div className="premium-upgrade-modal">
            <h3 className="premium-upgrade-title">Unlock Premium Feature</h3>
            <p className="premium-upgrade-text">
              This action is available for premium users only. You can upgrade
              your Stolity plan by clicking the button below.
            </p>
            <div className="premium-upgrade-actions">
              <button
                type="button"
                className="premium-upgrade-cancel"
                onClick={() => setShowUpgradeModal(false)}
              >
                Not now
              </button>
              <button
                type="button"
                className="premium-upgrade-confirm"
                onClick={() => {
                  setShowUpgradeModal(false);
                  nav("/Payment");
                }}
              >
                Go to Upgrade
              </button>
            </div>
          </div>
        </div>
      )}


      {showDeleteModal && (
       <>
       

          <div className="rename_popup_wrapper">
          <div className="rename_modal">
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: "15px",
              }}
            >
              <img src={DeletePopup} alt="" />
            </div>
            <h2 className="rename_title2">Are you sure you want to permanently delete?</h2>
            <p className="rename_subtext">This file will be permanently deleted and cannot be restored.</p>
            <div className="rename_buttons">
              <button
                className="rename_btn cancel"
                // onClick={handleCloseDeletePopover}
                onClick={() => setShowDeleteModal(false)}
              >
                No
              </button>
              <button
                className="rename_btn ok"
                onClick={() => {
                  handleMulDelete();
                  setShowDeleteModal(false);
                }}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
       </>
      )}

{loader_Restore && (<LoaderRestore/>)}
{loader_Permanent_Delete && (<LoaderPermanentDelete/>)}



    </>
  );
};

export default RecycleBin;
