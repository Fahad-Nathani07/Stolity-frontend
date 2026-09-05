import React, {
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { LONG_RUNNING_AWS_REQUEST_OPTIONS } from "../utils/longRunningAwsRequest";
import {
  postZipOrUnzip,
  getZipUnzipErrorMessage,
  getZipSuccessMessage,
} from "../utils/zipUnzipRequest";
import { uploadFolderViaMultipart } from "../utils/uploadFolderViaMultipart";
import { DownloadContext } from "./DownloadContext";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { resolveFileIconPath, normalizeFolderFilesForPreview } from "../utils/fileIcon";
import { buildGetFolderParams } from "../utils/getFolderParams";
import { clearNestedNav } from "../utils/nestedNavPersistence";
import { buildFileStreamUrl, preloadStreamedImage } from "../utils/fileStream";
import { validateItemName, isRenameNameTaken } from "../utils/validateItemName";
import { getApiErrorMessage } from "../utils/handleS3CopyError";
import { streamDownloadResponse, createDownloadWritable, isDownloadCancelledError, scheduleDownloadRemoval } from "../utils/downloadWithProgress";
import { downloadFolderNoZip } from "../utils/downloadFolderNoZip";
import FileInfoModal from "../components/FileInfoModal";
import VisibilityModal from "../components/VisibilityModal";
import FileShareModal from "../components/FileShareModal";
import EmptyFilesState from "../components/EmptyFilesState";
import SortByDropdown from "../components/SortByDropdown";
import { gatePremiumSort } from "../utils/premiumSort";
import {
  openPreviewFile,
  resolvePreviewAfterDelete,
} from "../utils/previewModalNavigation";
import { afterMinLoaderDisplay, afterLoaderComplete } from "../utils/actionLoaderDelay";
import {
  startMoveTransfer,
  finishMoveTransfer,
  failMoveTransfer,
} from "../utils/moveTransferProgress";
import CardFilePreview from "../components/CardFilePreview";
import UploadFolderPanel from "../components/UploadFolderPanel";
import FilesPaginationFooter from "../components/FilesPaginationFooter";
import { useStickyListHeader } from "../hooks/useStickyListHeader";
import { getBulkRowActionToggleProps } from "../utils/bulkSelectionRowActions";
import BulkSelectionToolbar from "../components/BulkSelectionToolbar";
import RenameModal from "../components/RenameModal";
import { useSessionEndCleanup } from "../hooks/useSessionEndCleanup";
import useListPageSize from "../hooks/useListPageSize";
import useFileSearch from "../hooks/useFileSearch";
import {
  buildDefaultFileListing,
  mergeFilesWithSharedFolders,
  mergeSearchWithSharedFolders,
  dedupeFileListingByName,
} from "../utils/mergeFileListing";
import UploadFilesPreview from "../components/UploadFilesPreview";
import UploadConflictModal from "../components/UploadConflictModal";
import {
  applyUploadConflictResolution,
  findUploadNameConflicts,
  UPLOAD_CONFLICT_CANCEL,
} from "../utils/uploadConflictUtils";
import FileSearchBar from "../components/FileSearchBar";
import "../css/FilesToolbar.css";
import "../css/FilesPage.css";
import sharedIcon from "../images/shared_icon.svg";
import fullscreeen from "../images/mediaPlayer/fullscreen.svg";
import zoomin from "../images/mediaPlayer/add-button.svg";
import zoomout from "../images/mediaPlayer/subtracting-button.svg";
import deleteIcon from "../images/mediaPlayer/trash1.svg";
import IconHome from "../images/Grid.svg";
import IconList from "../images/list.svg";
import IconHomeW from "../images/GridWhite.svg";
import IconListW from "../images/listWhite.svg";
import IconUpload from "../images/NewIconUpload.svg";
import DeletePopup from "../images/deletePopup.svg";
import CreateFolder from "../images/CreateFolderNavbar.svg";
import DownloafFromUrl from "../images/Download_Link_Icon_1 1.svg";
import SortHome from "../images/SortHome.svg";
import FilterHome from "../images/filterHome.svg";
import SortIcon from "../images/sort-style-1.svg";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import copyIcon from "../images/DropdownIcons/copyIcon.svg";
import deleteIcon2 from "../images/DropdownIcons/deleteIcon.svg";
import downloadIcon from "../images/DropdownIcons/downloadIcon.svg";
import InfoIcon from "../images/DropdownIcons/InfoIcon.svg";
import ZipIcon from "../images/DropdownIcons/Zip.svg";
import UnZipIcon from "../images/DropdownIcons/Unzip.svg";
import moveIcon2 from "../images/DropdownIcons/MoveIcon.svg";
import renameIcon from "../images/DropdownIcons/renameIcon.svg";
import shareIcon from "../images/DropdownIcons/shareIcon.svg";
import eyeIcon from "../images/DropdownIcons/eyeIcon.svg";
// import loaderGif from "../images/Loaders/Animation4.gif";
import loaderGif from "../images/Loaders/Animation4.gif";
import Dropzone from "react-dropzone";
import createFolderPopup from "../images/createFolderPopup.svg";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import svgDoc from "../images/TypesDoc.svg"
import svgFolder from "../images/TypesFolder.svg"
import svgJpg from "../images/TypesJpg.svg"
import svgMp3 from "../images/TypesMp3.svg"
import svgMp4 from "../images/TypesMp4.svg"
import svgPng from "../images/TypesPng.svg"
import svgTxt from "../images/TypesTxt.svg"
import svgZip from "../images/TypesZip.svg"
import svgCrown from "../images/crown.svg"
import blackboxImg from "../images/blackboxImg.svg"
import AvatarDefault from "../images/AvatarDefault.jpg";

import { FaCheckCircle } from "react-icons/fa"; //<FaCheckCircle />
import { BsXCircleFill } from "react-icons/bs"; // <BsXCircleFill />
import { IoIosInformationCircle } from "react-icons/io"; // <IoIosInformationCircle />
import { FaExclamationTriangle } from "react-icons/fa"; // <FaExclamationTriangle />
import { FaLock } from "react-icons/fa";


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
import { UploadContext } from "./UploadContext";
import { Modal as BootstrapModal } from "react-bootstrap";
import { ChakraProvider, Stack, useToast } from "@chakra-ui/react";
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

import CustomFileModal from './CustomFileModal';
import ImageGridView from './ImageGridView';

import { fetchUserFolderSize, setRedirectToPaymentAfterLogin } from "../store/subscriptionSlice";
import {
  addFavoriteName,
  removeFavoriteName,
} from "../store/favoritesSlice";


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
import { usePlayAudio } from "../hooks/usePlayAudio";


import DownloadModal from "./DownloadModal/DownloadModal";
import SelectFolderModal from "./DownloadModal/SelectFolderModal";
import FileConversionModal from "../components/FileConversionModal";
// import Loader from "../components/Loader";
import LoaderRecycleBin from "../components/LoaderRecycleBin";
import Loader2 from "../components/Loader2";
import LoaderLogo from "../components/LoaderLogo";
// import Loader3 from "../components/Loader3";

let c = 1;

//Anurag Imports

const Files = ({setSpanExpanded}) => {
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [triggerUpdate, setTriggerUpdate] = useState(0);
  const [remainingDownloads, setRemainingDownloads] = useState([]);
  const loader = useSelector((state) => state.getdata.loading);
  const userProfile = useSelector((state) => state.userProfile);
  const [docSrc, setDocSrc] = useState('');

  // const [loader_Permanent_Delete, setLoader_Permanent_Delete] = useState(false);
  const [loader_Recycle, setLoader_Recycle] = useState(false);
  const [loader2, setLoader2] = useState(false);

    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const navigate = useNavigate();
  const avatarUrl = userProfile.avatar || sessionStorage.getItem("avatar");
  const name = userProfile.name || sessionStorage.getItem("name");
  // const userData = sessionStorage.getItem("userData");
  const userData = JSON.parse(sessionStorage.getItem("userData"));

  const [hoveredFolderName, setHoveredFolderName] = useState(null);

  useEffect(()=>{
    console.log("[] hoveredFolderName",hoveredFolderName)
  },[hoveredFolderName])







  const handleDownload = async (downloadInfo) => {
    // console.log("Downloading:", downloadInfo);
    // console.log("Download path:", downloadPath);
    // Implement your actual download logic here
    // You would typically use fetch or axios to download the file
  };
  const openPathSelectionModal = () => {
    setMoveFol(true);
  };



  const closePathSelectionModal = (selectedPath) => {
    setMoveFol(false);
    // Testing Fahad
    // if (selectedPath) {
    //   setDownloadPath(selectedPath);
    // }
  };



  
  const {
    uploads,
    addUpload,
    updateUploadProgress,
    updateUploadMeta,
    removeUpload,
    abortUpload,
    pauseUpload,
    resumeUpload,
    getUpload,
    clearUploads,
    isPausing, // <-- new
    registerCancelRefresh,
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
  const { playAudioFile } = usePlayAudio();
  const [rootsize, setRootSize] = useState("");
  const [currentFile, setCurrentFile] = useState({});
  const [isOpen, setIsOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [videoSrc, setVideoSrc] = useState("");
  const [isProgressVisible, setIsProgressVisible] = useState(false);
  const [dragPop, setDragPop] = useState(false);
  const [dragFile, setDragFile] = useState({});
  const [targetFolder, setTargetFolder] = useState("");

  const [folderFieldError, setFolderFieldError] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const [isVideo, setisVideo] = useState(false);
  const [audioSrc, setAudioSrc] = useState("");
  const [isAudio, setIsAudio] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [showFTPopup, setShowFTPopup] = useState(false);
  const fileTypeDropdownRef = useRef(null);
  const getFileDataInFlightRef = useRef(null);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  
  const [testToggle, setTestToggle] = useState(false);


  const [entriesnum, setEntriesnum] = useState(0);
  const nav = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem("number");
    // console.log("token", token);
    if (!token) {
      alert("Session expired. Please login again.");
      nav("/Login");
      // showToast("error", "Session expired. Please login again.");
      // setTimeout(() => {
      //   nav("/Login");
      // }, 2000);
    }
  }, [nav]);

  useEffect(()=>{
    // setSpanExpanded(false)
    const buttonTimeout = setTimeout(() => {
        setSpanExpanded(false);
      }, 2750);
      return () => clearTimeout(buttonTimeout);
  },[])

  useEffect(() => {
    if (!showFTPopup) return;

    const onDocMouseDown = (e) => {
      const target = e.target;
      if (!fileTypeDropdownRef.current) return;
      if (fileTypeDropdownRef.current.contains(target)) return;
      setShowFTPopup(false);
    };

    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [showFTPopup]);

  useEffect(() => {
  const interval = setInterval(() => {
    setTestToggle(prev => !prev);
  }, 10000);

  // Cleanup when component unmounts
  return () => clearInterval(interval);
}, []); // empty dependency array = run once on mount

  const [pdfSrc, setPdfSrc] = useState("");
  const [isPdf, setIsPdf] = useState(false);
  const [folderList, setFolderList] = useState([]);
  const [isWhisperClicked, setIsWhisperClicked] = useState(false);
  const [movedFile, setMovedFile] = useState("");
  const [movedFol, setMovedFol] = useState("");
  const [pubpri2, setPubPri2] = useState("private");
  const [pubpri3, setPubPri3] = useState("private");
  const [imageArray, setImageArray] = useState([]);

  const [isCWhisperClicked, setIsCWhisperClicked] = useState(false);
  const [copiedFile, setCopiedFile] = useState("");
  const [copiedFileSize, setCopiedFileSize] = useState(0);
  const [downloadPopup, setDownloadpopup] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null); // Store the file to download
  const [previewFile, setPreviewFile] = useState(null); // Store the file to download
  const [progress, setProgress] = useState(0); // Track download progress
  const cancelToken = useRef(null); // Ref for cancel token
  const [loading, isSetLoading] = useState(false);
  const [downloadLink, setDownloadLink] = useState(null);
  const [modalFile, setModalFile] = useState("");

  const [sharePopup, setSharepopup] = useState(false);

  const [isCommon, setIsCommon] = useState(false);
  const [fn, setFn] = useState("");
  const apiUrl = process.env.REACT_APP_API_ENDPOINT;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [infoShower, setInfoShower] = useState(false);
  const [fileInfo, setFileInfo] = useState({
    fileName: "",
    fileSize: "",
    fileType: "",
    fileUrl: "",
    uploadDateTime: "",
    fileIcon: "",
    ACL: "",
  });
  const [show, setShow] = useState(false);
  const [showImage, setShowImage] = useState(false);
  const [codePopup, setCodePopup] = useState(false);
  const isSharedValue = useSelector((state) => state.getdata.isSharedValue);
  const filenameRedux = useSelector((state) => state.getdata.fileName);
  const isSoftBan = useSelector((state) => state.usersAdmin?.currentUser?.isSoftBan);

  /** Original zip stream folder download (fallback). */
  const downloadFolderViaZipProxy = useCallback(
    async ({ fileName, signal, onProgress }) => {
      const writable = await createDownloadWritable({ fileName, isFolder: true });
      if (!writable) {
        throw new Error(
          "Choose a save location to download folders (use Chrome/Edge)."
        );
      }
      const response = await fetch(
        `${apiUrl}download-folder?filePath=${encodeURIComponent(fileName)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          signal,
        }
      );
      if (!response.ok) throw new Error("Network response was not ok");
      await streamDownloadResponse({
        response,
        fileName,
        isFolder: true,
        writable,
        onProgress,
      });
    },
    [apiUrl, token]
  );

  /** Presigned no-zip folder download, falls back to zip proxy on failure. */
  const downloadFolderWithFallback = useCallback(
    async ({ fileName, signal, onProgress }) => {
      const shared =
        isSharedValue && filenameRedux ? filenameRedux : undefined;
      try {
        await downloadFolderNoZip({
          apiUrl,
          token,
          filePath: fileName,
          shared,
          signal,
          onProgress,
        });
      } catch (err) {
        if (err?.name === "AbortError") throw err;
        console.warn(
          "[Files] Presigned no-zip folder download failed, falling back to zip:",
          err?.message || err
        );
        await downloadFolderViaZipProxy({ fileName, signal, onProgress });
      }
    },
    [apiUrl, token, isSharedValue, filenameRedux, downloadFolderViaZipProxy]
  );


  const [placeholderLoading, setPlaceholderLoading] = useState(true);
  const [filterSortLoading, setFilterSortLoading] = useState(false);
  const filterSortLoaderStartedAtRef = useRef(0);
  //   const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  // const [currentAudioFile, setCurrentAudioFile] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);


  const docBlobRef = useRef(null);

  useEffect(() => {
    return () => {
      // cleanup: revoke blob URL on unmount
      if (docBlobRef.current && docBlobRef.current.startsWith("blob:")) {
        URL.revokeObjectURL(docBlobRef.current);
        docBlobRef.current = null;
      }
    };
  }, []);




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


  useEffect(() => {
      console.log("zxcvb isSharedValue ROOOTT!!! ",isSharedValue)
    }, [isSharedValue])

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setPlaceholderLoading(true); // Start loading

      try {
        dispatch(setIsSharedFalse());
        await getFileData(); // Initial load
        if (cancelled) return;
        setTimeout(() => {
          if (!cancelled) setPlaceholderLoading(false);
        }, 300);
        if (!cancelled) console.log("On root page!!!!!!");
      } catch (error) {
        if (!cancelled) console.log("Error in useEffect:", error);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [triggerUpdate]);


  useEffect(() => {
    // Whenever currentPage or itemsPerPage changes, update displayed data
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const slicedData = dedupeFileListingByName(allEntries).slice(
      startIndex,
      endIndex
    );
    setFileData(slicedData);
  }, [currentPage, itemsPerPage, allEntries]);

  const handleShow = () => setShow(true);
  const handleClose = () => setShow(false);
  const handleImageShow = () => setShowImage(true);
  const handleImageClose = () => {
    // console.log("Close button clicked!");

    // Exit fullscreen if currently in fullscreen mode
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }

    setIsFullscreen(false); // Reset fullscreen state
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

  // Add these states (probably already have some modal states)
const [showPrivateWarning, setShowPrivateWarning] = useState(false);
const [fileToShare, setFileToShare] = useState(null);

  const [moveFol, setMoveFol] = useState(false);

  const [hoveredFolderId, setHoveredFolderId] = useState(null);  // or hoveredFolder object

// ────────────────────────────────────────────────
// NEW: Track which folder is currently hovered
// ────────────────────────────────────────────────
const handleDragEnterFolder = (e, file) => {
  e.preventDefault();
  if (file.isFolder) {
    setHoveredFolderName(file.fileName);
    e.currentTarget.classList.add("drag-over");
  }
};

// ────────────────────────────────────────────────
// NEW: Remove visual highlight when leaving
// ────────────────────────────────────────────────
const handleDragLeaveFolder = (e) => {
  e.currentTarget.classList.remove("drag-over");
  // Important: do NOT clear hoveredFolderName here
};

// ────────────────────────────────────────────────
// UPDATED: Keep simple, just allow drop
// ────────────────────────────────────────────────
const handleDragOver = (e) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
};

// ────────────────────────────────────────────────
// UPDATED: Use hoveredFolderName instead of the row parameter
// ────────────────────────────────────────────────

// const handleDrop = (e) => {
//   e.preventDefault();
//   e.stopPropagation();

//   if (!hoveredFolderName) {
//     console.warn("[] No folder was hovered when drop occurred");
//     return;
//   }

//   const targetFolder = filedata.find(
//     (f) => f.fileName === hoveredFolderName && f.isFolder === true
//   );

//   if (!targetFolder) {
//     console.warn("[] Could not find hovered folder in filedata:", hoveredFolderName);
//     setHoveredFolderName(null);
//     return;
//   }

//   console.log("[] Real target folder (from hover tracking):", targetFolder.fileName);
//   console.log("[] Dragged item:", draggedItem?.fileName);

//   if (draggedItem && targetFolder.isFolder) {
//     if (targetFolder.isShared) {
//       showToast("error", "Cannot move files into a shared folder.");
//       setHoveredFolderName(null);
//       return;
//     }

//     setDragPop(true);
//     setDragFile(draggedItem);
//     setTargetFolder(targetFolder.fileName);
//   }

//   // Cleanup
//   setDraggedItem(null);
//   setHoveredFolderName(null);
// };


const handleDrop = (e) => {
  e.preventDefault();
  e.stopPropagation();

  if (!hoveredFolderName) {
    console.warn("[] No folder was hovered when drop occurred");
    showToast("warning", "Please drop over a valid folder.");
    return;
  }

  const targetFolder = filedata.find(
    (f) => f.fileName === hoveredFolderName && f.isFolder === true
  );

  if (!targetFolder) {
    console.warn("[] Could not find hovered folder in filedata:", hoveredFolderName);
    showToast("error", "Target folder not found.");
    setHoveredFolderName(null);
    return;
  }

  // Prevent self-drop
  if (draggedItem && draggedItem.fileName === targetFolder.fileName) {
    showToast("warning", "Cannot move an item into itself.");
    setHoveredFolderName(null);
    return;
  }

  if (draggedItem && targetFolder.isFolder) {
    if (targetFolder.isShared) {
      showToast("error", "Cannot move files into a shared folder.");
      setHoveredFolderName(null);
      return;
    }

    setDragPop(true);
    setDragFile(draggedItem);
    setTargetFolder(targetFolder.fileName);
  }

  // Cleanup
  setDraggedItem(null);
  setHoveredFolderName(null);
};



// ────────────────────────────────────────────────
// UPDATED: Add cleanup of hover state
// ────────────────────────────────────────────────
const handleDragEnd = (e) => {
  e.target.classList.remove("dragging");
  setHoveredFolderName(null);
  // If you have other cleanup in your original handleDragEnd, keep it
};





const handleDragOverFolder = (e) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
  // No need to set state here — enter already did
};





  const fileTypes = ["pdf", "jpg", "jpeg", "png", "mov", "mp3", "mp4"];
  const [selectedFileTypes, setSelectedFileTypes] = useState([]);
  const [customExtInput, setCustomExtInput] = useState("");
  const filterReqIdRef = useRef(0);
  const FILTER_SORT_LOADER_MIN_MS = 300;

  const beginFilterSortLoading = () => {
    filterSortLoaderStartedAtRef.current = Date.now();
    setFilterSortLoading(true);
  };

  const endFilterSortLoading = () => {
    const elapsed = Date.now() - filterSortLoaderStartedAtRef.current;
    const remaining = Math.max(0, FILTER_SORT_LOADER_MIN_MS - elapsed);
    setTimeout(() => setFilterSortLoading(false), remaining);
  };
  const [view, setView] = useState(localStorage.getItem("view") || "list");
  const FILES_MOBILE_BP = 767;
  const [isMobile, setIsMobile] = useState(
    () =>
      typeof window !== "undefined" && window.innerWidth <= FILES_MOBILE_BP
  );

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${FILES_MOBILE_BP}px)`);
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (isMobile && view !== "list") {
      setView("list");
    }
  }, [isMobile, view]);

  const displayView = isMobile ? "list" : view;
  const { filterBarRef: filesFilterBarRef, tableBoxRef: filesTableBoxRef, tableBoxClassName: filesTableBoxClassName } =
    useStickyListHeader(displayView, hasBulkSelection);

  const toggleView = (selectedView) => {
    if (isMobile && selectedView === "grid") return;
    setView(selectedView);
    localStorage.setItem("view", selectedView);
  };

  const runOnce = useRef(false);

  //Move File code
  const handleMClick = (name) => {
    setIsWhisperClicked(true);
    setMovedFile(name);
    setCurrentPage(1);
  };
  const handleMClose = () => {
    dispatch(resetFolderList());
    setCurrentPage(1);
    refreshFileListWithSkeleton();
    setIsWhisperClicked(false);
    setKeys([]);
    setKeys2([]);
    getLatestFolderList();
 
  };
 

  const handleBulkMoveSelection = () => {
    if (keys.length === 0 && keys2.length === 0) {
      showToast("error", "No files or folders selected.");
      return;
    }

    // Files only OR mixed (files + folders) → MoveFilePopup handles both
    if (keys.length > 0) {
      setMovedFile(keys);
      setIsWhisperClicked(true);
      return;
    }

    // Folders only
    setMovedFol(keys2);
    setMoveFol(true);
  };

  const handleMultiCopyClick = () => {
    console.log("lllll: handleMultiCopyClick called");

    // Filter out folders and get only files
    const selectedFiles = keys.filter(key => {
      const file = filedata.find(f => f.fileName === key);
      return file && !file.isFolder;
    });

    console.log("lllll: selectedFiles (files only):", selectedFiles);

    if (selectedFiles.length === 0) {
      console.log("lllll: No files selected for copy.");
      showToast("error", "No files selected for copy.");
      return;
    }

    // Calculate total size of selected files
    const totalSelectedSize = selectedFiles.reduce((sum, key) => {
      const file = filedata.find(f => f.fileName === key);
      console.log("lllll: Parsing file size for:", file.fileName, "Size:", file.fileSize);
      return sum + parseStorageToBytes(file.fileSize);
    }, 0);

    console.log("lllll: totalSelectedSize:", totalSelectedSize);
    console.log("lllll: remainingBytes:", remainingBytes);

    // Check storage
    if (totalSelectedSize > remainingBytes) {
      console.log("lllll: Not enough storage space");
      showToast("error", "Not enough storage space to copy these files.");
      return;
    }

    console.log("lllll: Enough storage space, proceeding with copy");
    setIsCWhisperClicked(true);
  };




  const handleMFClick = (name) => {
    setMoveFol(true);
    setMovedFol([name]);
    setCurrentPage(1);
  };
  const handleMFClose = () => {
    dispatch(resetFolderList());
    setMoveFol(false);
    setEndIndex(1);
    setKeys([]);
    setKeys2([]);
    setIsSelectAll(false);
  };
  // Copy File code
  const handleCClick = (name, size) => {
    setIsCWhisperClicked(true);
    setCopiedFile(name);
    setCopiedFileSize(size);
    console.log("qwerty Size:", size)
    setCurrentPage(1);
  };
  const handleCClose = () => {
    console.log("ggggg handleCClose is being called")
    dispatch(fetchUserFolderSize({ token, force: true }));
    console.log("ggggg fetchUserFolderSize executed")
    dispatch(resetFolderList());
    setIsCWhisperClicked(false);
    setKeys([]);
    
  };


  // Simple debounce helper – no external library needed
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}


  // ────────────────────────────────────────────────
  // Debounced copy handler – prevents spam clicks
  // ────────────────────────────────────────────────
  const handleCopyButton = debounce(() => {
    if (keys2.length > 0) {
      showToast("error", "Copy folder is not available!");
      // or more polite: "Copying folders is not supported yet."
    } else {
      handleMultiCopyClick();
    }
  }, 450);   // 450 ms – feels responsive but blocks spam



  //Checkbox code
  const [isSelectAll, setIsSelectAll] = useState(false);

  const handleCheckboxChange = (file) => {
    if (file.isFolder) {
      // If the file is a folder, update the keys2 list
      setKeys2((prevKeys2) => {
        const isChecked = prevKeys2.includes(file.fileName);
        const newKeys2 = isChecked
          ? prevKeys2.filter((f) => f !== file.fileName)
          : [...prevKeys2, file.fileName];
        console.log("Updated keys2:", newKeys2);
        return newKeys2;
      });
    } else {
      // If the file is not   a folder, update the keys list
      setKeys((prevKeys) => {
        const isChecked = prevKeys.includes(file.fileName);
        const newKeys = isChecked
          ? prevKeys.filter((f) => f !== file.fileName)
          : [...prevKeys, file.fileName];
        console.log("Updated keys:", newKeys);
        return newKeys;
      });
    }
  };

  /** When any row is selected, row clicks toggle selection instead of open/navigate */
  const trySelectInsteadOfOpen = (file) => {
    if (keys.length === 0 && keys2.length === 0) return false;
    if (file.fileName === "blackbox" || file.isShared) return true;
    handleCheckboxChange(file);
    return true;
  };


  // const handleSelectAllToggle = () => {
  //   if (!isSelectAll) {
  //     // Select all - preserve existing selections and add all other items
  //     const allFiles = filedata
  //       .filter((file) => !file.isFolder)
  //       .map((file) => file.fileName);
  //     const allFolders = filedata
  //       .filter((file) => file.isFolder)
  //       .map((file) => file.fileName);

  //     setKeys((prevKeys) => [...new Set([...prevKeys, ...allFiles])]);
  //     setKeys2((prevKeys2) => [...new Set([...prevKeys2, ...allFolders])]);
  //   } else {
  //     // Deselect all
  //     setKeys([]);
  //     setKeys2([]);
  //   }
  //   setIsSelectAll(!isSelectAll);
  // };

  const handleSelectAllToggle = () => {
  if (!isSelectAll) {
    const allFiles = filedata
      .filter((file) => 
        !file.isFolder && 
        file.fileName !== "blackbox" && 
        !file.isShared
      )
      .map((file) => file.fileName);

    const allFolders = filedata
      .filter((file) => 
        file.isFolder && 
        file.fileName !== "blackbox" && 
        !file.isShared
      )
      .map((file) => file.fileName);

    setKeys((prevKeys) => [...new Set([...prevKeys.filter(k => k !== "blackbox" && !filedata.find(f => f.fileName === k)?.isShared), ...allFiles])]);
    setKeys2((prevKeys2) => [...new Set([...prevKeys2.filter(k => k !== "blackbox" && !filedata.find(f => f.fileName === k)?.isShared), ...allFolders])]);
  } else {
    setKeys([]);
    setKeys2([]);
  }

  setIsSelectAll(!isSelectAll);
};


  const subscription = useSelector((state) => state.subscription.subscription);
  const folderSize = useSelector((state) => state.subscription.folderSize);
  const favoriteFiles = useSelector((state) => state.favorites.fileNames);
  const redirectToPaymentAfterLogin = useSelector(
    (state) => state.subscription.redirectToPaymentAfterLogin
  );

   const isPremium =
    !!subscription &&
    Array.isArray(subscription.entitlement_ids) &&
    subscription.entitlement_ids.length > 0;

  // PreLogin premium CTA → after login land on /Payment once
  useEffect(() => {
    if (!redirectToPaymentAfterLogin) return;

    const redirectTimeout = setTimeout(() => {
      dispatch(setRedirectToPaymentAfterLogin(false));
      setSpanExpanded?.(false);
      navigate("/Payment", { replace: true });
    }, 3000);

    return () => clearTimeout(redirectTimeout);
  }, [redirectToPaymentAfterLogin, dispatch, navigate, setSpanExpanded]);

  const email = sessionStorage.getItem("email");
  const { role, companies: assignedCompanyIds } = useSelector(
      (state) => state.jobPortal
    );

  



  useEffect(() => {
    console.log("ggggg subscription", subscription)
  }, [subscription])
  useEffect(() => {
    console.log("folderSize", folderSize)
    console.log("folderSize.totalSize", folderSize?.totalSize)
  }, [folderSize])


  // useEffect(() => {
  //   // Check if all files and folders are selected
  //   const allFiles = filedata
  //     .filter((file) => !file.isFolder)
  //     .map((file) => file.fileName);
  //   const allFolders = filedata
  //     .filter((file) => file.isFolder)
  //     .map((file) => file.fileName);

  //   const areAllFilesSelected = allFiles.every((file) => keys.includes(file));
  //   const areAllFoldersSelected = allFolders.every((folder) =>
  //     keys2.includes(folder)
  //   );

  //   // Update the isSelectAll state
  //   setIsSelectAll(areAllFilesSelected && areAllFoldersSelected);
  // }, [keys, keys2, filedata]);

  useEffect(() => {
  // Filter out blackbox and shared items before checking "all selected"
  const validFiles = filedata
    .filter((file) => 
      !file.isFolder && 
      file.fileName !== "blackbox" && 
      !file.isShared
    )
    .map((file) => file.fileName);

  const validFolders = filedata
    .filter((file) => 
      file.isFolder && 
      file.fileName !== "blackbox" && 
      !file.isShared
    )
    .map((file) => file.fileName);

  // Check if ALL valid (non-excluded) files and folders are selected
  const areAllFilesSelected = validFiles.every((file) => keys.includes(file));
  const areAllFoldersSelected = validFolders.every((folder) => keys2.includes(folder));

  // Only set "Select All" to true if both valid groups are fully selected
  setIsSelectAll(areAllFilesSelected && areAllFoldersSelected);
}, [keys, keys2, filedata]);



// const handleMulDelete = async () => {
//   setLoader_Recycle(true); // Start recycle loader
//   dispatch(setLoader(true)); // START loader

//   try {
//     // Check if any selected item is a shared folder
//     const hasSharedFolders = filedata.some(
//       (file) => file.isShared && keys2.includes(file.fileName)
//     );

//     if (hasSharedFolders) {
//       dispatch(setLoader(false));
//       setLoader_Recycle(false); // Stop recycle loader
//       // showToast("error", "Shared folders cannot be deleted.");
//       return;
//     }

//     // Soft delete files if keys have items
//     if (keys.length > 0) {
//       const payload = {
//         sourceFolder: "", // empty string for root folder
//         keys: keys,
//       };
//       await axios.delete(`${apiUrl}soft-delete`, { ...LONG_RUNNING_AWS_REQUEST_OPTIONS, 
//         data: payload,
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//       });
//     }

//     // Soft delete folders if keys2 have items
//     if (keys2.length > 0) {
//       await axios.delete(`${apiUrl}soft-delete-folder`, { ...LONG_RUNNING_AWS_REQUEST_OPTIONS, 
//         data: { sourceFolders: keys2 },
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//       });
//     }

//     // After successful delete operations, reset states and refresh data
//     getLatestFolderList();
//     setIsSelectAll(false);
//     setSelectStatus(false);
//     getFileData(1); // Refresh file data
//     setCurrentPage(1);
//     getRootFolderSize(); // Refresh folder size

//     // Refresh storage info in Redux
//     dispatch(fetchUserFolderSize(token));

//     setKeys([]);  // Reset keys for files
//     setKeys2([]); // Reset keys for folders

//     // Show success toast and stop recycle loader after delay
//     setTimeout(() => {
//       setLoader_Recycle(false);
//       showToast(
//         "success",
//         "Files and folders moved to recycle bin successfully!"
//       );
//     }, 2800);
//   } catch (error) {
//     showToast("error", "Some error has occurred");
//     console.error("handleMulDelete error:", error);
//     setTimeout(() => setLoader_Recycle(false), 2800);
//   } finally {
//     dispatch(setLoader(false)); // STOP loader
//   }
// };













  // NOTE: if you want to change concurrency at runtime, add this state in your component:
  
  const handleMulDelete = async () => {
  const loaderStartedAt = Date.now();
  setLoader_Recycle(true); // Start recycle loader
  dispatch(setLoader(true)); // START loader

  try {
    // 1) Block shared folders
    const hasSharedFolders = filedata.some(
      (file) => file.isShared && keys2.includes(file.fileName)
    );

    if (hasSharedFolders) {
      dispatch(setLoader(false));
      setLoader_Recycle(false); // Stop recycle loader
      // showToast("error", "Shared folders cannot be deleted.");
      return;
    }

    // 2) Block blackbox file/folder
    const hasBlackbox =
      keys.includes("blackbox") || keys2.includes("blackbox");

    if (hasBlackbox) {
      dispatch(setLoader(false));
      setLoader_Recycle(false);
      // Optional toast
      showToast("warning", "The blackbox folder cannot be deleted.");
      return;
    }

    // Soft delete files if keys have items
    if (keys.length > 0) {
      const payload = {
        sourceFolder: "", // empty string for root folder
        keys: keys,
      };
      await axios.delete(`${apiUrl}soft-delete`, { ...LONG_RUNNING_AWS_REQUEST_OPTIONS, 
        data: payload,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
    }

    // Soft delete folders if keys2 have items
    if (keys2.length > 0) {
      await axios.delete(`${apiUrl}soft-delete-folder`, { ...LONG_RUNNING_AWS_REQUEST_OPTIONS, 
        data: { sourceFolders: keys2 },
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
    }

    // After successful delete operations, reset states and refresh data
    getLatestFolderList();
    setIsSelectAll(false);
    setSelectStatus(false);
    getFileData(1); // Refresh file data
    setCurrentPage(1);
    getRootFolderSize(); // Refresh folder size

    // Refresh storage info in Redux
    dispatch(fetchUserFolderSize({ token, force: true }));

    setKeys([]);  // Reset keys for files
    setKeys2([]); // Reset keys for folders

    // Show success toast and stop recycle loader after delay
    afterMinLoaderDisplay(loaderStartedAt, () => {
      setLoader_Recycle(false);
      showToast(
        "success",
        "Files and folders moved to recycle bin successfully!"
      );
    });
  } catch (error) {
    showToast("error", "Some error has occurred");
    console.error("handleMulDelete error:", error);
    afterMinLoaderDisplay(loaderStartedAt, () => setLoader_Recycle(false));
  } finally {
    dispatch(setLoader(false)); // STOP loader
  }
};

  
  
  const [downloadConcurrency, setDownloadConcurrency] = useState(1);
  // Then this function will pick that value. If you don't add it, the function falls back to 1.


  const handleMulDownload = async () => {
    if (keys.length === 0 && keys2.length === 0) {
      showToast("error", "No files or folders selected!");
      return;
    }

    const items = [
      ...keys.map((fileName) => ({ fileName, isFolder: false })),
      ...keys2.map((fileName) => ({ fileName, isFolder: true })),
    ];

    const batchId = Date.now() + "-" + Math.random().toString(36).slice(2, 9);

    const concurrency =
      typeof downloadConcurrency !== "undefined" && Number.isFinite(downloadConcurrency)
        ? Math.max(1, Number(downloadConcurrency))
        : 1;

    items.forEach((item, i) => {
      const downloadId = Date.now() + Math.random() + i;
      const abortController = new AbortController();
      addDownload(downloadId, item.fileName, abortController, item.isFolder);
      item.downloadId = downloadId;
      item.abortController = abortController;
      item.endpoint = item.isFolder ? "download-folder" : "download-file";
    });

    const downloadOne = async (item) => {
      const { fileName, endpoint, downloadId, abortController } = item;
      let succeeded = false;
      try {
        if (item.isFolder) {
          await downloadFolderWithFallback({
            fileName,
            signal: abortController.signal,
            onProgress: (percent) => updateDownloadProgress(downloadId, percent),
          });
        } else {
          const response = await fetch(`${apiUrl}${endpoint}?filePath=${encodeURIComponent(fileName)}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: abortController.signal,
          });

          if (!response.ok) throw new Error("Network response was not ok");

          await streamDownloadResponse({
            response,
            fileName,
            isFolder: false,
            writable: null,
            onProgress: (percent) => updateDownloadProgress(downloadId, percent),
          });
        }

        succeeded = true;
        updateDownloadProgress(downloadId, 100);
        return { success: true, downloadId };
      } catch (err) {
        if (isDownloadCancelledError(err)) {
          console.warn("Download cancelled", item.fileName);
          showToast("info", `Download cancelled: ${item.fileName}`);
        } else {
          console.error("Download error for", fileName, err);
          showToast("error", err?.message || `Error downloading ${fileName}.`);
        }
        return { success: false, downloadId, error: err };
      } finally {
        if (!succeeded) {
          scheduleDownloadRemoval(removeDownload, downloadId, { delayMs: 0 });
        }
      }
    };

    let cursor = 0;
    const runWorker = async () => {
      while (true) {
        if (cursor >= items.length) break;
        const myIndex = cursor;
        cursor += 1;
        const item = items[myIndex];
        if (!item) break;
        await downloadOne(item);
      }
    };

    const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => runWorker());
    try {
      await Promise.all(workers);
      showToast("success", "All downloads processed.");

      const cleanupDelay = 600;
      setTimeout(() => {
        items.forEach((it) => {
          try {
            removeDownload(it.downloadId);
          } catch (e) { }
        });
      }, cleanupDelay);
    } catch (err) {
      console.error("Queue error:", err);
      showToast("error", "One or more downloads failed.");

      const cleanupDelay = 600;
      setTimeout(() => {
        items.forEach((it) => {
          try {
            removeDownload(it.downloadId);
          } catch (e) { }
        });
      }, cleanupDelay);
    }
  };











  // Helper function to get the appropriate icon (local /public/images/icons)
  const getFileIcon = (file) =>
    resolveFileIconPath(file, {
      sharedIconSrc: sharedIcon, // shared folders: frontend sharedIcon (unchanged)
      blackboxIconSrc: blackboxImg,
    });



  useEffect(() => {
    if (token) {
      // console.log("Current page value is", currentPage);

      clearNestedNav();
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
  const buildSortParams = (filterLabel = selectedFilter) => {
    switch (filterLabel) {
      case "By Name(A-Z)":
        return { ascending: true };
      case "By Name(Z-A)":
        return { ascending: false };
      case "By Size(Asc)":
        return { sortSize: true };
      case "By Size(Desc)":
        return { sortSize: false };
      case "By Date(Oldest)":
        return { sortByDate: "asc" };
      case "By Date(Newest)":
        return { sortByDate: "desc" };
      default:
        return {};
    }
  };

  const buildListParams = (types = selectedFileTypes, filterLabel = selectedFilter) => {
    const params = { ...buildSortParams(filterLabel) };
    if (types.length > 0) {
      params.fileTypes = types.join(",");
    }
    return params;
  };

  const applyFilter = async (typesOverride, options = {}) => {
    const { keepOpen = false, sortLabel = selectedFilter } = options;
    const types = Array.isArray(typesOverride)
      ? typesOverride
      : selectedFileTypes;
    const reqId = ++filterReqIdRef.current;

    if (!keepOpen) {
      setShowFTPopup(false);
    }
    beginFilterSortLoading();
    try {
      const listParams = buildListParams(types, sortLabel);
      const hasTypeOrSort =
        types.length > 0 || Object.keys(buildSortParams(sortLabel)).length > 0;

      if (hasTypeOrSort) {
        // Keep file-type + sort compatible in one request
        const combinedData = await fetchWithSharedFolders(listParams);
        if (reqId !== filterReqIdRef.current) return;
        applySortedList(combinedData);
      } else {
        // No filter/sort — reload default listing (same resilient path as getFileData)
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

        if (reqId !== filterReqIdRef.current) return;

        if (filesResult.status === "rejected") {
          console.error("getAllObjectsNew failed:", filesResult.reason);
          showToast?.(
            "error",
            "Unable to load files from server. Please try again."
          );
          return;
        }

        const sharedFolders =
          sharedFoldersResult.status === "fulfilled"
            ? sharedFoldersResult.value.data.result || []
            : [];

        const files =
          filesResult.status === "fulfilled"
            ? filesResult.value.data.result || []
            : [];

        if (
          !isGoogleAuth &&
          sharedFolders.length > 0 &&
          !sessionStorage.getItem("googleAuthWarned")
        ) {
          setShowGoogleAuthPopup(true);
          sessionStorage.setItem("googleAuthWarned", "true");
        }

        const combinedData = buildDefaultFileListing(files, sharedFolders, {
          isGoogleAuth,
        });

        applySortedList(combinedData);
      }
    } catch (error) {
      console.error(`Error applying filter: ${error}`);
    } finally {
      if (reqId === filterReqIdRef.current) {
        if (!keepOpen) {
          closeOnlyPopup();
        } else {
          clearSearchBar();
        }
        endFilterSortLoading();
      }
    }
  };
  const closeOnlyPopup = () => {
    clearSearchBar();
    setShowFTPopup(false); // Just close modal
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
    // console.log("Filter selected !", eventKey);
    if (eventKey === "File Type") {
      // console.log("Something...");
      setShowFTPopup(true);
    }
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
      // Clear sort but keep any active file-type filter
      applyFilter(selectedFileTypes, { keepOpen: true, sortLabel: "Sort By" });
    }
  };
  // Common function to fetch and combine shared folders with sorted files
  const normalizeFilesList = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.result)) return data.result;
    if (Array.isArray(data?.results)) return data.results;
    return [];
  };

  const fetchWithSharedFolders = async (apiParams) => {
    let sharedFolders = [];
    let files = [];

    if (isGoogleAuth) {
      const [sharedFoldersResult, filesResult] = await Promise.allSettled([
        axios.get(`${apiUrl}shared-folders`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
        axios.get(`${apiUrl}get-all-files`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          params: apiParams,
        }),
      ]);

      sharedFolders =
        sharedFoldersResult.status === "fulfilled"
          ? sharedFoldersResult.value.data.result || []
          : [];
      files =
        filesResult.status === "fulfilled"
          ? normalizeFilesList(filesResult.value.data)
          : [];
    } else {
      const filesResponse = await axios.get(`${apiUrl}get-all-files`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        params: apiParams,
      });

      files = normalizeFilesList(filesResponse.data);
    }

    return mergeFilesWithSharedFolders(files, sharedFolders, {
      isGoogleAuth,
      sortParams: apiParams,
      fileTypes: apiParams?.fileTypes,
    });
  };

  const applySortedList = (combinedData) => {
    const list = dedupeFileListingByName(
      Array.isArray(combinedData) ? combinedData : []
    );
    setAllEntries(list);
    setTotalEntries(list.length);
    setCurrentPage(1);
    setFileData(list.slice(0, itemsPerPage));
  };

  const applySortWithFileTypes = async (sortLabel) => {
    const reqId = ++filterReqIdRef.current;
    beginFilterSortLoading();
    try {
      clearSearchBar();
      const combinedData = await fetchWithSharedFolders(
        buildListParams(selectedFileTypes, sortLabel)
      );
      if (reqId !== filterReqIdRef.current) return;
      applySortedList(combinedData);
    } catch (error) {
      console.error(`Error applying sort (${sortLabel}): ${error}`);
    } finally {
      if (reqId === filterReqIdRef.current) {
        endFilterSortLoading();
      }
    }
  };

  const nameFilter1 = () => applySortWithFileTypes("By Name(A-Z)");
  const nameFilter2 = () => applySortWithFileTypes("By Name(Z-A)");
  const sizeFilter1 = () => applySortWithFileTypes("By Size(Asc)");
  const sizeFilter2 = () => applySortWithFileTypes("By Size(Desc)");
  const dateFilter1 = () => applySortWithFileTypes("By Date(Oldest)");
  const dateFilter2 = () => applySortWithFileTypes("By Date(Newest)");

  const closePopup = () => {
    setSelectedFileTypes([]);
    setCustomExtInput("");
    getFileData();
    setShowFTPopup(false);
  };
  const [continuationToken, setContinuationToken] = useState("");
  // const [isNextPage, setIsNextPage] = useState(false);
  const [isNextNextPage, setIsNextNextPage] = useState(false);
  const [showGoogleAuthPopup, setShowGoogleAuthPopup] = useState(false);

  //Anurag Get Files
  // Modify your getFileData function to ensure it correctly handles pagination
  // const getFileData = async () => {
  //   try {
  //     const [sharedFoldersResult, filesResult] = await Promise.allSettled([
  //       axios.get(`${apiUrl}shared-folders`, {
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //           "Content-Type": "application/json",
  //         },
  //       }),
  //       axios.get(`${apiUrl}getAllObjectsNew`, {
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //           "Content-Type": "application/json",
  //         },
  //         params: {
  //           limit: 1000,
  //         },
  //       }),
  //     ]);

  //     const sharedFolders =
  //       sharedFoldersResult.status === "fulfilled"
  //         ? sharedFoldersResult.value.data.result || []
  //         : [];

  //     const files =
  //       filesResult.status === "fulfilled"
  //         ? filesResult.value.data.result || []
  //         : [];

  //     // Show Google Auth popup if needed
  //     if (
  //       !isGoogleAuth &&
  //       sharedFolders.length > 0 &&
  //       !sessionStorage.getItem("googleAuthWarned")
  //     ) {
  //       setShowGoogleAuthPopup(true);
  //       sessionStorage.setItem("googleAuthWarned", "true");
  //     }

  //     const combinedData = isGoogleAuth
  //       ? [...sharedFolders, ...files]
  //       : [...files];
  //     setAllEntries(combinedData);
  //     setTotalEntries(combinedData.length);
  //     console.log("combinedData ---------------->>>", combinedData)
  //     setFileData(combinedData.slice(0, itemsPerPage));
  //   } catch (error) {
  //     console.log("Unexpected error:", error);
  //   }
  // };

//   const getFileData = async () => {
//   try {
//     const [sharedFoldersResult, filesResult] = await Promise.allSettled([
//       axios.get(`${apiUrl}shared-folders`, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//       }),
//       // axios.get(`${apiUrl}get-all-files`, {
//       axios.get(`${apiUrl}getAllObjectsNew`, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//         params: {
//           limit: 1000,
//         },
//       }),
//     ]);

//     const sharedFolders =
//       sharedFoldersResult.status === "fulfilled"
//         ? sharedFoldersResult.value.data.result || []
//         : [];

//     let files =
//       filesResult.status === "fulfilled"
//         ? filesResult.value.data.result || []
//         : [];

//     // NEW: Reorder files - move "blackbox" to front
//     const blackboxIndex = files.findIndex(file => file.fileName === "blackbox");
//     if (blackboxIndex !== -1) {
//       const [blackbox] = files.splice(blackboxIndex, 1);  // Remove blackbox
//       files.unshift(blackbox);  // Add blackbox at start
//     }

//     // Show Google Auth popup if needed
//     if (
//       !isGoogleAuth &&
//       sharedFolders.length > 0 &&
//       !sessionStorage.getItem("googleAuthWarned")
//     ) {
//       setShowGoogleAuthPopup(true);
//       sessionStorage.setItem("googleAuthWarned", "true");
//     }

//     const combinedData = isGoogleAuth
//       ? [...sharedFolders, ...files]      // Order: [sharedFolders..., blackbox, other files...]
//       : [...files];                       // Order: [blackbox, other files...]
    
//     setAllEntries(combinedData);
//     setTotalEntries(combinedData.length);
//     console.log("combinedData ---------------->>>", combinedData)
//     setSelectedFilter("Sort By");
//     // djsfhjdbfljdhf
//     setFileData(combinedData.slice(0, itemsPerPage));
//   } catch (error) {
//     console.log("Unexpected error:", error);
//   }
// };

const getFileData = async () => {
  // Share one in-flight load (avoids Strict Mode / remount double calls)
  if (getFileDataInFlightRef.current) {
    return getFileDataInFlightRef.current;
  }

  const request = (async () => {
    try {
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

      // ✅ Detect failure ONLY for files API
      const filesFailed = filesResult.status === "rejected";

      if (filesFailed) {
        console.error("getAllObjectsNew failed:", filesResult.reason);

        setTimeout(() => {
          showToast?.(
            "error",
            "Unable to load files from server. Please try again."
          );
        }, 1500);
        return [];
      }

      const sharedFolders =
        sharedFoldersResult.status === "fulfilled"
          ? sharedFoldersResult.value.data.result || []
          : [];

      const files =
        filesResult.status === "fulfilled"
          ? filesResult.value.data.result || []
          : [];

      if (
        !isGoogleAuth &&
        sharedFolders.length > 0 &&
        !sessionStorage.getItem("googleAuthWarned")
      ) {
        setShowGoogleAuthPopup(true);
        sessionStorage.setItem("googleAuthWarned", "true");
      }

      const combinedData = buildDefaultFileListing(files, sharedFolders, {
        isGoogleAuth,
      });

      setAllEntries(combinedData);
      setTotalEntries(combinedData.length);

      console.log("combinedData ---------------->>>", combinedData);

      setSelectedFilter("Sort By");
      setFileData(combinedData.slice(0, itemsPerPage));
      return combinedData;
    } catch (error) {
      console.log("Unexpected error:", error);

      // 🔴 Rare case (Promise.allSettled usually prevents this)
      showToast?.(
        "error",
        "Unexpected issue occurred while loading data."
      );
      return [];
    } finally {
      getFileDataInFlightRef.current = null;
    }
  })();

  getFileDataInFlightRef.current = request;
  return request;
};

const refreshFileListWithSkeleton = async () => {
  setPlaceholderLoading(true);
  try {
    await getFileData();
  } finally {
    setPlaceholderLoading(false);
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
    getSearchParams: () => buildListParams(),
    onResults: async (list, searchQuery, isStillActive) => {
      let merged = list;
      if (isGoogleAuth) {
        try {
          const sharedResponse = await axios.get(`${apiUrl}shared-folders`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
          if (!isStillActive?.()) return;
          const sharedFolders = sharedResponse.data?.result || [];
          merged = mergeSearchWithSharedFolders(
            list,
            sharedFolders,
            searchQuery,
            {
              isGoogleAuth,
              sortParams: buildSortParams(),
              fileTypes: selectedFileTypes.length
                ? selectedFileTypes.join(",")
                : undefined,
            }
          );
        } catch (error) {
          console.error("Failed to merge shared folders into search:", error);
        }
      }
      if (!isStillActive?.()) return;
      const uniqueMerged = dedupeFileListingByName(merged);
      setAllEntries(uniqueMerged);
      setTotalEntries(uniqueMerged.length);
      setCurrentPage(1);
    },
    onSearchClear: () => {
      setAllEntries([]);
      setTotalEntries(0);
    },
    reloadList: () => getFileData(currentPage),
  });

  const clearSearchBar = resetSearchBar;

  // Cancel-all: refresh list once immediately, then aborts continue in background
  useEffect(() => {
    if (typeof registerCancelRefresh !== "function") return undefined;
    return registerCancelRefresh(() => {
      setCurrentPage(1);
      getFileData();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registerCancelRefresh]);


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
  // const chkFileorFolder = (file, size) => {
  //   const isFolder = file.fileType === "Folder" || file.isFolder === true;

  //   if (isFolder) {
  //     // console.log("It's a folder.");
  //     dispatch(
  //       setFolderPath({
  //         folderPath: file.fileName + "/",
  //         isShared: file.isShared || false, // Pass isShared value
  //       })
  //     );
  //     getFolderFiles(file, size);
  //   } else {
  //     // It's a file
  //     openFile(file);
  //   }
  // };

//   const chkFileorFolder = async (file, size) => {
//   const isFolder = file.fileType === "Folder" || file.isFolder === true;

//   if (isFolder) {
//     console.log("It's a folder:", file.fileName);
    
//     // Await Redux dispatch to ensure store is updated
//     await dispatch(
//       setFolderPath({
//         folderPath: file.fileName + "/",
//         isShared: file.isShared || false,
//       })
//     );
//     console.log("yyyyy setting folderpath as --> ", file.fileName + "/"); 
//     console.log("yyyyy After Updating we called from store `t` --> ", t); 
//     // Now safe to call - store is guaranteed updated
//     console.log("yyyyy Now calling getFolderFiles for --> ", file.fileName); 
//     getFolderFiles(file, size);
//   } else {
//     // It's a file
//     openFile(file);
//   }
// };



const chkFileorFolder = (file, size) => {
  const isFolder = file.fileType === "Folder" || file.isFolder === true;

  if (isFolder) {
    console.log("It's a folder:", file.fileName);
    
    // ✅ Dispatch AND immediately call with known value
    
    dispatch(
      setFolderPath({
        folderPath: file.fileName + "/",
        isShared: file.isShared || false,
      })
    );
    
    // Store is updated, nested page will see it on next render
    // Just call immediately - selector timing is React's job
    getFolderFiles(file, size);
  } else {
    openFile(file);
  }
};



  //Anurag get into folder

  const getFolderFiles = async (foldername, size) => {
    setPlaceholderLoading(true); // Start loading

    try {
      const cleanfoldername = checkLastHash(foldername.fileName);

      const isShared = foldername?.isShared ?? false;

      if (isShared) {
        dispatch(setIsSharedValue(true));
        dispatch(setParentFolderName(cleanfoldername));
      }

      const params = buildGetFolderParams({
        folderPath: isShared ? "" : cleanfoldername,
        isShared,
        sharedRoot: cleanfoldername,
      });

      const res = await axios.get(`${apiUrl}getFolder`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("zxcvb Shared? 1593", isShared, "params", params);

      // Frontend-only: fix outdated getFolder public URLs for nested card previews
      const folderFiles = normalizeFolderFilesForPreview(
        Array.isArray(res.data) ? res.data : res.data?.result || []
      );

      const routepath = 1;

      // Store data BEFORE navigate so NestedPage can read it on first paint
      dispatch(
        addToken({
          id: routepath,
          Files: folderFiles,
          isShared,
        })
      );
      if (!isShared) {
        dispatch(setParentFolderName(foldername.fileName));
      }
      dispatch(incrementCounter());

      nav(`/nested/${routepath}`, {
        state: { value: size },
      });
    } catch (error) {
      console.log("error:", error.response?.data?.error);
      if (error.response?.data?.error === "jwt expired") {
        alert("Session expired. Please login again.");
        setTimeout(() => {
          nav("/Login");
        }, 0);
      }
    } finally {
      setPlaceholderLoading(false); // End loading
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
  //Anurag handle Lightbox close
  const handleLightboxClose = () => {
    setIsOpen(false);
    setisVideo("");
    setImageSrc("");
    setAudioSrc("");
    setIsAudio(false);
    setFn("");
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

  //Anurag Search file — see useFileSearch hook above (after getFileData)

  const getImageInfo = async (filename) => {
    setIsProgressVisible(true);
    setImageSrc("");
    try {
      const url = buildFileStreamUrl(apiUrl, token, filename, {
        shared: isSharedValue,
        sharedName: filenameRedux,
      });
      await preloadStreamedImage(url);
      setImageSrc(url);
    } catch (error) {
      handleImageClose();
      console.error(error);
    } finally {
      setIsProgressVisible(false);
    }
  };
  //Audio getting function (legacy modal preview — unused for floating player)
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


  const getDocInfo = async (filename) => {
    try {
      console.log("getDocInfo: start ->", filename);
      const params = { filePath: filename };
      if (typeof isSharedValue !== "undefined" && isSharedValue) {
        params.shared = filenameRedux;
      }

      setIsProgressVisible(true);

      // Helper: map extension -> likely mime-type
      const extToMime = {
        doc: "application/msword",
        docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ppt: "application/vnd.ms-powerpoint",
        pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        xls: "application/vnd.ms-excel",
        xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        csv: "text/csv",
        odt: "application/vnd.oasis.opendocument.text",
        ods: "application/vnd.oasis.opendocument.spreadsheet",
        odp: "application/vnd.oasis.opendocument.presentation",
        pdf: "application/pdf",
        txt: "text/plain"
      };

      // Try protected fetch (arraybuffer -> File)
      try {
        const res = await axios.get(`${apiUrl}getFile`, {
          params,
          headers: { Authorization: `Bearer ${token}` },
          responseType: "arraybuffer",
        });

        console.log("getDocInfo: axios success, headers:", res.headers);

        // compute filename to attach
        let filenameClean = filename.split("/").pop();
        const contentDisp = res.headers["content-disposition"];
        if (contentDisp) {
          const match = contentDisp.match(/filename\*?=(?:UTF-8'')?["']?([^;"']+)["']?/i);
          if (match && match[1]) {
            try { filenameClean = decodeURIComponent(match[1]); } catch (e) { filenameClean = match[1]; }
          }
        }

        // Determine extension and prefer mapped mime
        const parts = filenameClean.split(".");
        const ext = (parts.length > 1 ? parts.pop().toLowerCase() : "");
        const mappedMime = extToMime[ext] || null;
        const serverMime = res.headers["content-type"] || "application/octet-stream";
        const finalMime = mappedMime || serverMime;

        // Create a File with the chosen MIME and proper filename
        const fileObject = new File([res.data], filenameClean, { type: finalMime });

        // revoke previous blob url if any
        if (docBlobRef.current && typeof docBlobRef.current === "string" && docBlobRef.current.startsWith("blob:")) {
          try { URL.revokeObjectURL(docBlobRef.current); } catch (e) { /* ignore */ }
        }

        const url = window.URL.createObjectURL(fileObject);
        docBlobRef.current = url;

        // clear other viewers & set docSrc
        setImageSrc("");
        setVideoSrc("");
        setAudioSrc("");
        setPdfSrc("");
        setDocSrc(url);

        console.log("getDocInfo: set docSrc -> (blob-file) ", url, " filename:", filenameClean, " chosen-mime:", finalMime);

      

        setIsProgressVisible(false);
        return;
      } catch (firstErr) {
        console.warn("getDocInfo: arraybuffer->file fetch failed, will fallback to streaming URL", firstErr);
        // continue to fallback
      }

      // Fallback: streaming URL (getFileDefault) — used by other viewers (may require token-in-query to be allowed)
      try {
        const streamingUrl = `${apiUrl}getFileDefault?token=${encodeURIComponent(token)}&filePath=${encodeURIComponent(filename)}`;

        // clear other viewers
        setImageSrc("");
        setVideoSrc("");
        setAudioSrc("");
        setPdfSrc("");
        setDocSrc(streamingUrl);
        console.log("getDocInfo: set docSrc -> (streaming) ", streamingUrl);

        setIsProgressVisible(false);
        return;
      } catch (fallbackErr) {
        console.error("getDocInfo: streaming fallback failed", fallbackErr);
        setIsProgressVisible(false);
        showToast?.("error", "Failed to load document preview (fallback).");
      }
    } catch (error) {
      console.error("getDocInfo: final error ->", error);
      setIsProgressVisible(false);
      showToast?.("error", "Failed to load document preview");
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
  const handleOpenPopover = (file) => {
    setWholeFile(file);
    setNewFileName(file.fileName);
    setActiveRow(file.fileName);
    if (file.isFolder) {
      setInputValue(file.fileName);
    } else {
      setInputValue(getFileNameWithoutExtension(file.fileName));
      setExtension(file.fileName.substring(file.fileName.lastIndexOf(".")));
    }
    setRenamepop(true);
    // console.log("extension", extension, "first", inputValue);
  };

  const handleClosePopover = () => {
    setActiveRow(null);
    setRenamepop(false);
  };

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

  const handleFileRename = async (oldkey, newkey, file) => {
    if (isRenaming) return; // Prevent multiple clicks

    const isFolder = !!file?.isFolder;
    const rawBase = isFolder
      ? newkey
      : extension && String(newkey).endsWith(extension)
        ? String(newkey).slice(0, -extension.length)
        : String(newkey ?? "");
    const validated = validateItemName(rawBase);
    if (!validated.ok) {
      showToast("warning", validated.message);
      return;
    }
    const finalNewKey = isFolder
      ? validated.name
      : `${validated.name}${extension || ""}`;

    if (
      String(oldkey || "").replace(/\/+$/, "").toLowerCase() ===
      String(finalNewKey || "").replace(/\/+$/, "").toLowerCase()
    ) {
      showToast("warning", "Please choose a different name.");
      return;
    }

    if (isRenameNameTaken(allEntries, oldkey, finalNewKey)) {
      showToast(
        "error",
        isFolder
          ? "A folder with this name already exists."
          : "A file with this name already exists."
      );
      return;
    }

    setIsRenaming(true);

    if (isFolder) {
      try {
        await axios.post(
          `${apiUrl}rename-folder`,
          {
            oldFolderName: oldkey,
            newFolderName: finalNewKey,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        getLatestFolderList();
        handleClosePopover();
        getFileData(currentPage);
        showToast("success", "Folder renamed successfully");
      } catch (error) {
        showToast("error", `There's an error`);
      } finally {
        setIsRenaming(false);
      }
    } else {
      try {
        await axios.post(
          `${apiUrl}rename-file`,
          {
            oldKey: oldkey,
            newKey: finalNewKey,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        setExtension("");
        handleClosePopover();
        getFileData(currentPage);
        showToast("success", "File renamed successfully");
      } catch (error) {
        console.log(error)
        // showToast("error", `There's an error while renaming file!`);
        showToast("warning", error?.response?.data?.message);
      } finally {
        setIsRenaming(false);
      }
    }
  };

  //Convert visibility
  const changeVisibility = (file) => {
    if (!pubpri) {
      // Show toast or pop-up if no radio button is selected
      showToast("error", "Please select Public or Private before proceeding.");
      return;
    }

    const actualoperation = async () => {
      try {
        const res = await axios.post(
          `${apiUrl}convert-visibility`,
          {
            key: file,
            targetVisibility: pubpri,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        //    console.log(res.data);
        showToast("success", "Visibility has been changed!");
        setPubPri("");
        setVisiKey("");
        setIsVisibility(false);
        getFileData(1);
      } catch (error) {
        console.error(`There's error at ${error}`);
        showToast("error", "Error while changing visibility!");
      }
    };

    actualoperation();
  };

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




  const handleAddToFavorites = async (file) => {
    try {
      await axios.post(
        `${apiUrl}mark-as-favorite`,
        { filePath: file.fileName },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      showToast("success", "Added to favorites");
      dispatch(addFavoriteName(file.fileName));
    } catch (error) {
      console.error("Error adding to favorites:", error);
      showToast("error", "Failed to add to favorites");
    }
  };


  const handleRemoveFromFavorites = async (file) => {
    try {
      await axios.post(
        `${apiUrl}unmark-as-favorite`,
        { filePath: file.fileName },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      showToast("success", "Removed from favorites");
      dispatch(removeFavoriteName(file.fileName));
    } catch (error) {
      console.error("Error removing from favorites:", error);
      showToast("error", "Failed to remove from favorites");
    }
  };

  // helper function
  const isFileFavorited = (fileName) => {
    return favoriteFiles.includes(fileName);
  };








  const handleFileDelete = async (file) => {
    const loaderStartedAt = Date.now();
    setLoader_Recycle(true); // Start recycle loader
    handleCloseDeletePopover();

    if (file?.isFolder === true) {
      // Soft delete folder using new API
      try {
        dispatch(setLoader(true));
        const res = await axios.delete(`${apiUrl}soft-delete-folder`, { ...LONG_RUNNING_AWS_REQUEST_OPTIONS, 
          data: { sourceFolders: [checkLastHash(file.fileName)] },
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        getLatestFolderList();
        getFileData(currentPage);
        getRootFolderSize();
        dispatch(setLoader(false));
        afterMinLoaderDisplay(loaderStartedAt, () => {
          setLoader_Recycle(false);
          showToast("success", "Folder moved to recycle bin successfully");
        }); // Stop recycle loader after min display
      } catch (error) {
        showToast("error", `There's an error while moving folder to recycle bin`);
        dispatch(setLoader(false));
        afterMinLoaderDisplay(loaderStartedAt, () => setLoader_Recycle(false)); // Stop recycle loader after min display
      }
    } else {
      // For files, derive sourceFolder and key using relativePath if available
      dispatch(setLoader(true));
      let sourceFolder = "";
      let key = file.fileName;

      // Debug: Log the file object
      console.log("File object:", file);

      if (file.relativePath) {
        const lastSlashIndex = file.relativePath.lastIndexOf("/");
        if (lastSlashIndex !== -1) {
          sourceFolder = file.relativePath.substring(0, lastSlashIndex);
          key = file.relativePath.substring(lastSlashIndex + 1);
        }
      }

      const dataToSend = {
        sourceFolder,
        keys: [key],
      };

      // Debug: Log what we're sending
      console.log("Soft delete payload:", dataToSend);
      console.log("Full file object:", JSON.stringify(file, null, 2));

      try {
        const res = await axios.delete(`${apiUrl}soft-delete`, { ...LONG_RUNNING_AWS_REQUEST_OPTIONS, 
          data: dataToSend,
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        console.log("Soft delete response:", res.data);
        getFileData(currentPage);
        getRootFolderSize();
      } catch (error) {
        console.error("Soft delete error:", error.response?.data || error.message);
        showToast("error", `There's an error while moving file to recycle bin!`);
      }

      dispatch(setLoader(false));
      afterMinLoaderDisplay(loaderStartedAt, () => {
        setLoader_Recycle(false);
        showToast("success", "File moved to recycle bin successfully");
      }); // Stop recycle loader after min display
    }

    // Update remaining storage after delete
    if (token) {
      dispatch(fetchUserFolderSize({ token, force: true }));
      console.log("fetchUserFolderSize executed");
    }
  };







  const [openPDFModal, setOpenPDFModal] = useState(false);
  const handleOpenPDFModal = () => setOpenPDFModal(true);
  const handleClosePDFModal = () => setOpenPDFModal(false);
  const [openFileUploadModal, setOpenFileUploadModal] = useState(false);
  const [uploadConflictNames, setUploadConflictNames] = useState(null);
  const uploadConflictResolverRef = useRef(null);
  const [createFolderButton, setCreateFolderButton] = useState(false);
  const pageFilter = (data) => {
    getFileData(currentPage, data);
  };

  // Functions to handle modal visibility
  const handleOpenFileUploadModal = () => setOpenFileUploadModal(true);

  // const handleCloseFileUploadModal = () => setOpenFileUploadModal(false);
  const handleCloseFileUploadModal = () => {
    setFiles([]); // Clear selected files
    setNewFolderName("");
    setFolderFieldError("");
    setOpenFileUploadModal(false); // Close the modal
  };

  const handleOpenCreateFolder = () => setCreateFolderButton(true);
  const handleCloseCreateFolder = () => {
    setCreateFolderButton(false);
    setNewFolderName("");
    setFolderFieldError("");
  };

  const [pubpri, setPubPri] = useState("public");
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
        dispatch(setIsSharedValue(isShared));
        config.params.shared = parentFolder;
      } else if (parentFolder) {
        config.params.folderPath = parentFolder;
      }

      const endpoint = `${apiUrl}get-root-folders`;
      const response = await axios.get(endpoint, config);

      console.log("zxcvb Shared? getFodlerList", isShared);
      console.log("zxcvb config?", config);

      



      const folders = response.data;

      // Dispatch folders with the isShared context
      // dispatch(setIsSharedValue(isShared));
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

  // In the component where you use the popup
  const handlePopupOpen = () => {
    // Initial fetch when popup opens
    getFolderList(); // This will fetch root folders by default
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

  // Download file function
  const downloadFile = (file) => {
    setSelectedFile(file);
    setDownloadpopup(true);
  };

  const {
    addDownload,
    updateDownloadProgress,
    removeDownload,
    cancelDownload,
  } = useContext(DownloadContext);


const handleConfirmDownload = async () => {
    if (!selectedFile) return;

    const fileName = removeSlash2(selectedFile.fileName);
    const isFolder = selectedFile.isFolder;
    const downloadId = Date.now();
    const abortController = new AbortController();
    let succeeded = false;

    addDownload(downloadId, fileName, abortController, isFolder);
    setDownloadpopup(false);
    isSetLoading(true);
    setProgress(0);
    cancelToken.current = abortController;

    try {
      if (isFolder) {
        await downloadFolderWithFallback({
          fileName,
          signal: abortController.signal,
          onProgress: (percent) => {
            setProgress(percent);
            updateDownloadProgress(downloadId, percent);
          },
        });
      } else {
        const response = await fetch(
          `${apiUrl}download-file?filePath=${encodeURIComponent(fileName)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: abortController.signal,
          }
        );

        if (!response.ok) throw new Error("Network response was not ok");

        await streamDownloadResponse({
          response,
          fileName,
          isFolder: false,
          writable: null,
          onProgress: (percent) => {
            setProgress(percent);
            updateDownloadProgress(downloadId, percent);
          },
        });
      }

      succeeded = true;
      setProgress(100);
      updateDownloadProgress(downloadId, 100);
    } catch (error) {
      if (isDownloadCancelledError(error)) {
        console.warn("Download canceled by user");
        showToast("info", "Download cancelled.");
      } else {
        console.error("Download error:", error);
        showToast("error", error.message || "Error downloading file. Please try again.");
      }
    } finally {
      isSetLoading(false);
      scheduleDownloadRemoval(removeDownload, downloadId, {
        delayMs: succeeded ? 500 : 0,
      });

      // Batch remainder: files use proxy; folders try presigned no-zip then zip fallback
      if (remainingDownloads.length > 0) {
        const downloadPromises = remainingDownloads.map(async (fileName) => {
          const isFolder = fileName === keys2.find((f) => f === fileName);
          try {
            if (isFolder) {
              await downloadFolderWithFallback({ fileName });
              return;
            }
            const response = await fetch(
              `${apiUrl}download-file?filePath=${encodeURIComponent(fileName)}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
            if (!response.ok) throw new Error("Network response was not ok");
            await streamDownloadResponse({
              response,
              fileName,
              isFolder: false,
              writable: null,
            });
          } catch (error) {
            if (!isDownloadCancelledError(error)) {
              console.error("Download error:", error);
              showToast("error", `Error downloading ${fileName}.`);
            }
          }
        });

        isSetLoading(true);
        await Promise.all(downloadPromises);
        isSetLoading(false);
        showToast("success", "All selected files and folders downloaded!");
      }
    }
  };



  const handleCancelDownload = () => {
    if (cancelToken.current) {
      // cancelToken.current.cancel("Download canceled by user.");
      cancelToken.current.abort();  // Use abort() to stop fetch
    }
    isSetLoading(false);
    setProgress(0);
    setDownloadpopup(false);
  };

  useEffect(() => {
    if (!downloadPopup) {
      setProgress(0);
      isSetLoading(false);
    }
  }, [downloadPopup]);

  const shareFile = (file) => {
    setSharepopup(true);
    setSelectedFile(file);
  };

  const closeSharePopup = () => {
    setSharepopup(false);
    setSelectedFile(null);
  };

  const [codeContent, setCodeContent] = useState("");
  const [codeLanguage, setCodeLanguage] = useState("javascript");
  const codeExtensions = [
    "js",
    "jsx",
    "ts",
    "tsx",
    "html",
    "css",
    "json",
    "py",
    "php",
    "cpp",
  ];

  const [isLoading1, setIsLoading1] = useState(false);
  const [codeChunks, setCodeChunks] = useState([]); // chunks of lines
  const [fullLines, setFullLines] = useState([]); // entire line array
  const [chunkSize] = useState(500); // lines per chunk
  const [hasMoreChunks, setHasMoreChunks] = useState(false);

  const previewCodeFile = async (file) => {
    try {
      setIsLoading1(true);
      setCodePopup(true); // Show popup immediately

      const res = await axios.get(`${apiUrl}getFile`, {
        params: { filePath: file.fileName },
        headers: { Authorization: `Bearer ${token}` },
        responseType: "text",
      });

      const ext = file.fileName.split(".").pop();
      const langMap = {
        js: "javascript",
        jsx: "jsx",
        ts: "typescript",
        tsx: "tsx",
        html: "html",
        css: "css",
        json: "json",
        py: "python",
        php: "php",
        cpp: "cpp",
      };
      setCodeLanguage(langMap[ext] || "text");

      const lines = res.data.split("\n");
      setFullLines(lines);
      setCodeChunks([lines.slice(0, chunkSize).join("\n")]);
      setHasMoreChunks(lines.length > chunkSize);
    } catch (error) {
      console.error("Error fetching file:", error);
    } finally {
      setIsLoading1(false);
    }
  };

  const handleScroll = (e) => {
    const bottom =
      e.target.scrollHeight - e.target.scrollTop === e.target.clientHeight;
    if (bottom && hasMoreChunks && !isLoading1) {
      setIsLoading1(true);

      setTimeout(() => {
        const currentLength = codeChunks.reduce(
          (acc, chunk) => acc + chunk.split("\n").length,
          0
        );
        const nextChunk = fullLines.slice(
          currentLength,
          currentLength + chunkSize
        );
        setCodeChunks((prev) => [...prev, nextChunk.join("\n")]);

        if (currentLength + chunkSize >= fullLines.length) {
          setHasMoreChunks(false);
        }

        setIsLoading1(false);
      }, 200); // simulate async delay
    }
  };

  const [showFolderModal, setShowFolderModal] = useState(false);
  const [currentFileToZip, setCurrentFileToZip] = useState(null);

  async function ZipFile(file) {
    // Show the folder selection modal
    setShowFolderModal(true);
    setCurrentFileToZip(file);
  }

  useEffect(()=>{
    console.log("currentFileToZip",currentFileToZip)
  },[currentFileToZip])

  async function processZipFile(file, destinationPath = "") {
  if (!file?.fileName) return;

  setLoader2(true);   // ← start loader

  const apiUrl1 = `${apiUrl}zip-object`;

  const requestData = {
    filePath: removeSlash2(file.fileName),
    destinationPath, // Defaults to empty string if not provided
  };

  try {
    const zipResult = await postZipOrUnzip(apiUrl1, requestData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // console.log("Zip successful:", response.data);
    showToast("success", getZipSuccessMessage(zipResult));
    getFileData();
  } catch (error) {
    console.error("Error zipping file:", error);
    showToast(
      "error",
      getZipUnzipErrorMessage(error, "Failed to zip file.")
    );
  } finally {
    setLoader2(false);   // ← always stop loader (success or fail)
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
  if (!file?.fileName) return;

  setLoader2(true);   // ← start loader

  const apiUrl1 = `${apiUrl}unzip-object`;

  const requestData = {
    zipFilePath: removeSlash2(file.fileName),
    destinationPath, // Default to empty string for root folder
  };

  try {
    await postZipOrUnzip(apiUrl1, requestData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // console.log("Unzip successful:", response.data);
    showToast("success", "File successfully unzipped!");
    getFileData();
  } catch (error) {
    console.error("Error unzipping file:", error);
    showToast(
      "error",
      getZipUnzipErrorMessage(error, "Failed to unzip file.")
    );
  } finally {
    setLoader2(false);   // ← always stop loader (success or fail)
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

  const getLastSegment = (text) => {
    // Check if the text contains a slash
    if (text.includes("/")) {
      const parts = text.split("/"); // Split the text by "/"
      return parts.pop(); // Return the last segment after the last slash
    }
    return text; // If no slash, return the original text
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

  const getTextBeforeLastSlash = (text) => {
    // Check if the text contains a slash
    if (text.includes("/")) {
      return text.slice(0, text.lastIndexOf("/")).replace(/\//g, ">"); // Replace all '/' with '>'
    }
    return ""; // If no slash, return an empty string
  };
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

  //Create Folder
  const createJustFolder = async (event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    const folderfield = (newFolderName || "").trim();
    const isValid = /^[a-zA-Z0-9_\- ]{1,}$/.test(folderfield);

    if (!folderfield) {
      setFolderFieldError("Please enter a folder name.");
      return;
    }

    if (!isValid) {
      setFolderFieldError(
        "Folder name can only contain letters, numbers, underscores, hyphens, and spaces."
      );
      return;
    }

    const folderName = path + folderfield;
    try {
      await axios.post(
        `${apiUrl}create-folder`,
        { folderName: folderName },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      setNewFolderName("");
      setFolderFieldError("");
      handleCloseFileUploadModal();
      getLatestFolderList();
      getFolderList();
      getFileData(currentPage);
      handleCloseCreateFolder();
      setOpenFileUploadModal(false);
      showToast("success", "Folder created successfully!");
    } catch (error) {
      console.error(`There's error at ${error}`);
      showToast("error", "Failed to create folder. Please try again.");
    }
  };

  const uploadFolder = async ({ fileList, folderName, isPrivate }) => {
    if (!fileList?.length) {
      showToast("warning", "Please select a folder first.");
      return;
    }

    const result = await uploadFolderViaMultipart({
      apiUrl,
      token,
      fileList,
      basePath: path,
      folderName,
      visibility: isPrivate,
      remainingBytes,
      sanitizeFilename,
      isVideoFile,
      uploads,
      addUpload,
      updateUploadProgress,
      updateUploadMeta,
      removeUpload,
      getUpload,
      isPausing,
      onBeforeStart: () => {
        handleCloseFileUploadModal();
        setFiles([]);
      },
    });

    if (result.status === "busy") {
      showToast(
        "info",
        "Uploads are already in progress. Please wait for them to finish."
      );
      return;
    }
    if (result.status === "quota") {
      showToast(
        "error",
        `Not enough storage for this folder (${(result.totalSize / 1_000_000_000).toFixed(2)} GB needed).`
      );
      return;
    }

    const { displayName, allCanceled, anyFailed, anySucceeded, anyCanceled } =
      result;
    if (anySucceeded && !anyFailed && !anyCanceled) {
      showToast("success", `Folder "${displayName}" uploaded successfully!`);
      setCurrentPage(1);
      getFileData(1);
    } else if (anySucceeded && anyCanceled) {
      showToast("info", "Upload stopped. Finished files are available.");
      getFileData(1);
    } else if (anySucceeded && anyFailed) {
      showToast("warning", "Some folder files failed to upload.");
      getFileData(1);
    } else if (allCanceled) {
      showToast("info", "Folder upload was canceled.");
    } else if (anyFailed) {
      showToast("error", "Error uploading folder files.");
    }

    if (token && anySucceeded) {
      dispatch(fetchUserFolderSize({ token, force: true }));
    }
  };

  const handleRadioChange2 = (event) => {
    setPubPri3(event.target.value);
  };

  // Folder selection logic moved into UploadFolderPanel





  // function parseStorageToBytes(storageStr) {
  //   if (!storageStr) return 0;
  //   const [value, unit] = storageStr.split(" ");
  //   const units = { KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3, TB: 1024 ** 4 };
  //   return parseFloat(value) * (units[unit] || 1);
  // }

  // const specialUserFlag = useSelector((state) => state.subscription.specialUserFlag);
  // const totalBytes = specialUserFlag
  //   ? 500 * 1024 ** 3 // 500 GB for special users
  //   : (subscription && subscription.storage ? parseStorageToBytes(subscription.storage) : 5 * 1024 ** 3);
  // const usedBytes = folderSize ? folderSize.sizeInBytes : 0;
  // const remainingBytes = totalBytes - usedBytes;
  // const totalSelectedSize = files ? files.reduce((acc, file) => acc + file.size, 0) : 0;
  // const postUploadRemainingBytes = remainingBytes - totalSelectedSize;

  function parseStorageToBytes(storageStr) {
  if (!storageStr) return 0;

  // More robust splitting (handles extra spaces, different casing)
  const parts = storageStr.trim().split(/\s+/);
  if (parts.length < 2) return 0;

  const value = parseFloat(parts[0]);
  if (isNaN(value)) return 0;

  const unit = parts[1].toUpperCase();

  const units = {
    KB: 1000,
    MB: 1000 ** 2,        //         1_000_000
    GB: 1000 ** 3,        //     1_000_000_000
    TB: 1000 ** 4,        // 1_000_000_000_000
    PB: 1000 ** 5,        // optional – future-proof
  };

  const multiplier = units[unit] || 1;
  return Math.round(value * multiplier);  // avoid floating-point precision issues
}

const specialUserFlag = useSelector((state) => state.subscription.specialUserFlag);

const totalBytes = specialUserFlag
  ? 500 * 1_000_000_000                // 500 GB → 500 000 000 000 bytes
  : (subscription && subscription.storage
      ? parseStorageToBytes(subscription.storage)
      : 5 * 1_000_000_000);            // default 5 GB → 5 000 000 000 bytes

const usedBytes = folderSize ? folderSize.sizeInBytes : 0;
const remainingBytes = totalBytes - usedBytes;

const totalSelectedSize = files 
  ? files.reduce((acc, file) => acc + (file.size || 0), 0) 
  : 0;

const postUploadRemainingBytes = remainingBytes - totalSelectedSize;


// Storage check -

useEffect(()=>{
  console.log("Storage check - usedBytes:", usedBytes);
  console.log("Storage check - remainingBytes:", remainingBytes);

},[usedBytes, remainingBytes])



  const onDrop = useCallback(
    (acceptedFiles) => {
      console.log('New files selected:', acceptedFiles);

      const totalSize = acceptedFiles.reduce((acc, file) => acc + file.size, 0);

      if (totalSize > remainingBytes) {
        showToast(
          "error",
          `You can only upload files up to ${(remainingBytes / 1_000_000_000).toFixed(2)} GB. Please remove some files or select smaller ones.`
        );
        return;
      }

      setFiles(prevFiles => {
        console.log('Previous files:', prevFiles);
        const newFiles = [...prevFiles, ...acceptedFiles];
        console.log('Merged files:', newFiles);
        return newFiles;
      });
    },
    [remainingBytes]
  );

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

  const path = "";

  const removeFile = (index) => {
    const updatedFiles = [...files];
    updatedFiles.splice(index, 1);
    setFiles(updatedFiles);
  };
  //Anurag folder upload



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
  // const PART_SIZE = 5 * 1024 * 1024; // 5 MB per part
  // const PART_SIZE = 55 * 1024 * 1024; // 5 MB per part
  const PART_SIZE = 10 * 1024 * 1024; // 5 MB per part
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
  const startMultipart = async (fileName, folderPath, visibilityOverride) => {
    const url = buildAwsUrl(apiUrl, "start-multipart-upload");
    const basename = fileName.replace(/^.*[\\/]/, "");
    const visibility =
      visibilityOverride === "public-read" || visibilityOverride === "public"
        ? "public"
        : visibilityOverride === "private"
          ? "private"
          : pubpri;
    const payload = folderPath
      ? { fileName: basename, folderPath, visibility }
      : { fileName: basename, visibility };
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

    // setTriggerDataSize((x) => x + 1)
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

     // Prevent starting a new batch while uploads are in progress
    if (uploads && uploads.length > 0) {
      showToast("info", "Uploads are already in progress. Please wait for them to finish.");
      console.log("Upload in progress, cannot start a new batch.", uploads);
      return;
    }

    const sanitizedNames = files.map((file) => {
      const originalName = file.name;
      return isVideoFile(originalName)
        ? sanitizeFilename(originalName)
        : originalName;
    });
    const conflicts = findUploadNameConflicts(sanitizedNames, filedata, path);
    let uploadQueue = files.map((file, i) => ({
      file,
      sanitizedName: sanitizedNames[i],
    }));

    if (conflicts.length > 0) {
      const choice = await new Promise((resolve) => {
        uploadConflictResolverRef.current = resolve;
        setUploadConflictNames(conflicts);
      });

      const resolved = applyUploadConflictResolution(
        files,
        sanitizedNames,
        conflicts,
        choice,
        filedata,
        path
      );
      if (!resolved || choice === UPLOAD_CONFLICT_CANCEL) {
        return;
      }
      if (resolved.length === 0) {
        showToast("info", "No files were uploaded.");
        return;
      }
      uploadQueue = resolved;
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
      // Add all files to upload list at the start
      const uploadEntries = uploadQueue.map((entry, i) => {
        const { file, sanitizedName } = entry;
        const uploadUiId = Date.now() + i;
        const controller =
          typeof AbortController !== "undefined" ? new AbortController() : null;

        console.log("Adding upload:", uploadUiId, sanitizedName); // Log addUpload
        addUpload(uploadUiId, "Uploading " + sanitizedName, {
          controller,
          operation: "upload",
          sizeInBytes: file.size || 0,
        });
        return { file, uploadUiId, sanitizedName, controller };
      });

      // Sequential upload: one file at a time (0.9s gap between files to avoid rate limits)
      const MULTI_UPLOAD_GAP_MS = 900;
      const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      const results = [];
      let batchCanceled = false;
      for (let i = 0; i < uploadEntries.length; i++) {
        const { file, uploadUiId, sanitizedName, controller } = uploadEntries[i];

        // Cancel-all clears the queue — stop immediately (don't wait on remaining aborts)
        if (!getUpload?.(uploadUiId)) {
          results.push({ status: "fulfilled", value: "canceled" });
          const anyLeft = uploadEntries
            .slice(i + 1)
            .some((e) => getUpload?.(e.uploadUiId));
          if (!anyLeft) {
            for (let j = i + 1; j < uploadEntries.length; j++) {
              results.push({ status: "fulfilled", value: "canceled" });
            }
            batchCanceled = true;
            break;
          }
          continue;
        }

        // If this item was paused (e.g. pause hit during gap between files), wait for play
        if (getUpload?.(uploadUiId)?.paused || isPausing?.(uploadUiId)) {
          try {
            await waitUntilResumed(uploadUiId);
          } catch {
            results.push({ status: "fulfilled", value: "canceled" });
            const anyLeft = uploadEntries
              .slice(i + 1)
              .some((e) => getUpload?.(e.uploadUiId));
            if (!anyLeft) {
              for (let j = i + 1; j < uploadEntries.length; j++) {
                results.push({ status: "fulfilled", value: "canceled" });
              }
              batchCanceled = true;
              break;
            }
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
            console.log("Removing upload due to error:", uploadUiId); // Log removeUpload
            removeUpload(uploadUiId);
            results.push({ status: "rejected", reason: err });
            if (i < uploadEntries.length - 1 && getUpload?.(uploadEntries[i + 1]?.uploadUiId)) {
              await delay(MULTI_UPLOAD_GAP_MS);
            }
            continue;
          }

          // Cancelled while start-multipart was in flight
          if (!getUpload?.(uploadUiId)) {
            try {
              const keyEarly = startResp.key || startResp.data?.key;
              const uploadIdEarly = startResp.uploadId || startResp.data?.uploadId;
              if (keyEarly && uploadIdEarly) {
                await abortMultipart({ key: keyEarly, uploadId: uploadIdEarly });
              }
            } catch { }
            results.push({ status: "fulfilled", value: "canceled" });
            const anyLeft = uploadEntries
              .slice(i + 1)
              .some((e) => getUpload?.(e.uploadUiId));
            if (!anyLeft) {
              for (let j = i + 1; j < uploadEntries.length; j++) {
                results.push({ status: "fulfilled", value: "canceled" });
              }
              batchCanceled = true;
              break;
            }
            continue;
          }

          const key = startResp.key || startResp.data?.key;
          const uploadId = startResp.uploadId || startResp.data?.uploadId;

          if (!key || !uploadId) {
            console.log("Removing upload due to invalid response:", uploadUiId); // Log removeUpload
            removeUpload(uploadUiId);
            results.push({ status: "rejected", reason: new Error("Invalid start-multipart response") });
            if (i < uploadEntries.length - 1 && getUpload?.(uploadEntries[i + 1]?.uploadUiId)) {
              await delay(MULTI_UPLOAD_GAP_MS);
            }
            continue;
          }

          // Never reuse an aborted controller (pause may have aborted the original)
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
            if (!getUpload?.(uploadUiId) && !(isPausing?.(uploadUiId))) {
              try {
                await abortMultipart({ key, uploadId });
              } catch { }
              results.push({ status: "fulfilled", value: "canceled" });
              partFailed = true;
              batchCanceled = true;
              break;
            }

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
              console.log("Updating progress:", uploadUiId, progress); // Log updateUploadProgress
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
                    } catch { }
                    console.log("Removing upload due to cancel:", uploadUiId); // Log removeUpload
                    removeUpload(uploadUiId);
                    results.push({ status: "fulfilled", value: "canceled" });
                    partFailed = true;
                    break;
                  }
                }

                // Cancel-all (or cancel) — stop this file and exit remaining queue
                try {
                  await abortMultipart({ key, uploadId });
                } catch { }
                removeUpload(uploadUiId);
                results.push({ status: "fulfilled", value: "canceled" });
                partFailed = true;
                batchCanceled = true;
                break;
              }

              try {
                await abortMultipart({ key, uploadId });
              } catch { }

              console.log("Removing upload due to error:", uploadUiId); // Log removeUpload
              removeUpload(uploadUiId);
              results.push({ status: "rejected", reason: err });
              partFailed = true;
              break;
            }
          }

          if (batchCanceled) {
            for (let j = i + 1; j < uploadEntries.length; j++) {
              results.push({ status: "fulfilled", value: "canceled" });
            }
            break;
          }

          if (!partFailed) {
            // 3) Complete multipart upload
            try {
              await completeMultipart({ key, uploadId, parts: partsArray });
              updateUploadProgress(uploadUiId, 100);
              results.push({ status: "fulfilled", value: "success" });
            } catch (err) {
              try {
                await abortMultipart({ key, uploadId });
              } catch { }
              console.log("Removing upload due to error:", uploadUiId); // Log removeUpload
              removeUpload(uploadUiId);
              results.push({ status: "rejected", reason: err });
            }
          }
        } catch (err) {
          results.push({ status: "rejected", reason: err });
        }

        // Wait before next file's start-multipart-upload (avoids "Too many calls")
        if (
          i < uploadEntries.length - 1 &&
          getUpload?.(uploadEntries[i + 1]?.uploadUiId)
        ) {
          await delay(MULTI_UPLOAD_GAP_MS);
        }
      }
      // After all uploads are done, show summary
      const allCanceled = results.every((r) => r.status === "fulfilled" && r.value === "canceled");
      const anyFailed = results.some((r) => r.status === "rejected");
      const anySucceeded = results.some((r) => r.status === "fulfilled" && r.value === "success");
      const anyCanceled = results.some((r) => r.status === "fulfilled" && r.value === "canceled");

      console.log("Upload results:", results); // Log results
      console.log("Upload entries:", uploadEntries); // Log uploadEntries

      if (anySucceeded && !anyFailed && !anyCanceled) {
        showToast("success", "Files uploaded successfully!");
        setCurrentPage(1);
        setPubPri("private");
        getFileData(1);
      } else if (anySucceeded && anyCanceled) {
        // List already refreshed on cancel-all; just toast
        showToast("info", "Upload stopped. Finished files are available.");
      } else if (anySucceeded && anyFailed) {
        showToast("warning", "Some files failed to upload.");
        getFileData(1);
      } else if (allCanceled) {
        showToast("info", "Uploads were canceled successfully.");
      } else if (anyFailed) {
        showToast("error", "Error uploading some files.");
      }

      // Only clear THIS batch — never wipe other in-flight uploads
      uploadEntries.forEach(({ uploadUiId }) => {
        try {
          if (getUpload?.(uploadUiId)) updateUploadProgress(uploadUiId, 100);
        } catch (e) {}
      });
      setTimeout(() => {
        uploadEntries.forEach(({ uploadUiId }) => {
          try {
            removeUpload(uploadUiId);
          } catch (e) {}
        });
      }, 800);
      if (token) {
        dispatch(fetchUserFolderSize({ token, force: true }));
      }

    } catch (error) {
      showToast("error", error.message || "Error uploading files");
    }

    setFiles([]);
  };

  // useEffect(() => {
  //   console.log("fffff Files", files)
  // }, [files])





  const getFileInfo = async (name, file) => {
    try {
      const res = await axios.get(`${apiUrl}file-info`, {
        params: {
          filePath: name,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "application/json",
      });
      // console.log("File information is", res.data);
      let fileData = res.data;

      // If res.data is a string, parse it as JSON
      if (typeof res.data === "string") {
        fileData = JSON.parse(res.data);
      }

      console.log("aaaaa File information is fileData", fileData);
      console.log("File information is name", name);
      console.log("File information is file", file);
      setFileInfo({
        fileName: fileData.filePath,
        fileSize: fileData.fileSize,
        fileType: fileData.fileType,
        uploadDateTime: fileData.uploadDateTime,
        fileUrl: fileData.url,
        fileIcon: getFileIcon({
          ...(file || {}),
          fileName: fileData.filePath || file?.fileName || name,
          fileType: fileData.fileType || file?.fileType,
        }),
        ACL: file.ACL,
      });
      // console.log(res.data.filePath);
      console.log("File info", fileInfo);
    } catch (error) {
      // console.log(error);
      showToast("error", "Unable to show information!");
    }
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

  //Image slider functionality
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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

  useSessionEndCleanup(() => {
    setShowImage(false);
    setShowImageGallery(false);
    setCodePopup(false);
    setShow(false);
    setIsWhisperClicked(false);
    setIsCWhisperClicked(false);
    setMoveFol(false);
    setShowFolderModal(false);
    setShowFolderModalUnZip(false);
    setShowDeleteModal(false);
    setShowDownloadModal(false);
    setShowUpgradeModal(false);
    setInfoShower(false);
    setIsVisibility(false);
    setRenamepop(false);
    setDeletepop(false);
    setSharepopup(false);
    setDownloadpopup(false);
    setDragPop(false);
    setShowGoogleAuthPopup(false);
    setShowPrivateWarning(false);
    setShowConversionModal(false);
    setOpenPDFModal(false);
    setOpenFileUploadModal(false);
    setCreateFolderButton(false);
    setShowFTPopup(false);
    setIsDownloadModalOpen(false);
    setIsFullscreen(false);
  });


  const handleNext = () => {
    console.log("✅handleNext is clicked");
    setErrorMessage2("");
    setIsProgressVisible(true);

    setCurrentImageIndex((prevIndex) => {
      let newIndex = (prevIndex + 1) % filedata.length;
      let fileType = filedata[newIndex].fileType;

      const audioTypes = ['mp3', 'm4a', 'MP3', 'wav', 'WAV', 'ogg', 'OGG', 'aac', 'AAC'];

      while ((!fileType || audioTypes.includes(fileType)) && filedata.length > 0) {
        newIndex = (newIndex + 1) % filedata.length;
        fileType = filedata[newIndex].fileType;

        if (newIndex === prevIndex) {
          setErrorMessage2("No non-audio files available");
          setIsProgressVisible(false);
          handleImageClose();
          return prevIndex;
        }
      }

      const ft = (fileType || "").toLowerCase();
      setPreviewFile(filedata[newIndex]);

      // Image types
      const imageTypes = ["jpeg", "jpg", "png", "gif", "heic", "hevc", "heif", "svg", "webp", "avif"];
      // Pdf / text
      const pdfTypes = ["pdf", "txt"];
      // Video types
      const videoTypes = ["mkv", "mp4", "mov", "mpeg", "webm"];
      // Document / ppt / excel types
      const docTypes = ["doc", "docx", "ppt", "pptx", "pptm", "pps", "ppsx", "xls", "xlsx", "xlsm", "csv", "ods"];

      // Clear previous srcs
      setIsProgressVisible(false);

      console.log("✅ FileType(ft)", ft)

      // Handle types
      if (imageTypes.includes(ft.toLowerCase())) {
        setVideoSrc("");
        setAudioSrc("");
        setPdfSrc("");
        setDocSrc("");
        getImageInfo(filedata[newIndex].fileName);
        setModalFile(filedata[newIndex].fileName);
      } else if (pdfTypes.includes(ft)) {
        setImageSrc("");
        setVideoSrc("");
        setAudioSrc("");
        setDocSrc("");
        getPdfInfo(filedata[newIndex].fileName);
        setModalFile(filedata[newIndex].fileName);
      } else if (videoTypes.includes(ft)) {
        setImageSrc("");
        setAudioSrc("");
        setPdfSrc("");
        setDocSrc("");
        setIsProgressVisible(false);
        setVideoSrc(filedata[newIndex].fileName);
        setModalFile(filedata[newIndex].fileName);
      } else if (docTypes.includes(ft)) {
        // documents / ppt / excel
        setImageSrc("");
        setVideoSrc("");
        setAudioSrc("");
        setPdfSrc("");
        // set docSrc via fetch
        console.log("✅DOCSSSS")
        getDocInfo(filedata[newIndex].fileName);
        setModalFile(filedata[newIndex].fileName);
      } else {
        setImageSrc("");
        setAudioSrc("");
        setPdfSrc("");
        setVideoSrc("");
        setDocSrc("");
        setIsProgressVisible(false);
        setErrorMessage2("Unsupported file format");
        setModalFile(filedata[newIndex].fileName);
      }

      return newIndex;
    });
  };

// useEffect(() => {
//   if (!filedata) return;

//   if (filedata.length === 0) {
//     console.log("No files left → closing modal");
//     handleImageClose(); // or onClose
//     return;
//   }

//   console.log("Filedata updated → moving to next");
//   handleNext();
// }, [filedata]);

  const handlePrev = () => {
    setErrorMessage2("");
    setIsProgressVisible(true);
    setCurrentImageIndex((prevIndex) => {
      let newIndex = (prevIndex - 1 + filedata.length) % filedata.length;
      let fileType = filedata[newIndex].fileType;

      // Define audio extensions to skip
      const audioTypes = ['mp3', 'm4a', 'MP3', 'wav', 'WAV', 'ogg', 'OGG', 'aac', 'AAC'];

      // Loop to find the next item that is NOT an audio file
      while ((!fileType || audioTypes.includes(fileType)) && filedata.length > 0) {
        newIndex = (newIndex - 1 + filedata.length) % filedata.length;
        fileType = filedata[newIndex].fileType;

        // Prevent infinite loop if all files are audio
        if (newIndex === prevIndex) {
          setErrorMessage2("No non-audio files available");
          setIsProgressVisible(false);
          return prevIndex;
        }
      }

      const ft = (fileType || "").toLowerCase();
      setPreviewFile(filedata[newIndex]);

      const imageTypes = ["jpeg", "jpg", "png", "gif", "heic", "hevc", "heif", "svg", "webp", "avif"];
      const pdfTypes = ["pdf", "txt"];
      const videoTypes = ["mkv", "mp4", "mov", "mpeg", "webm"];
      const docTypes = ["doc", "docx", "ppt", "pptx", "pptm", "pps", "ppsx", "xls", "xlsx", "xlsm", "csv", "ods"];

      // Clear previous srcs
      setIsProgressVisible(false);

      // Handle types
      if (imageTypes.includes(ft)) {
        setVideoSrc("");
        setAudioSrc("");
        setPdfSrc("");
        setDocSrc("");
        getImageInfo(filedata[newIndex].fileName);
        setModalFile(filedata[newIndex].fileName);
      } else if (pdfTypes.includes(ft)) {
        setImageSrc("");
        setVideoSrc("");
        setAudioSrc("");
        setDocSrc("");
        getPdfInfo(filedata[newIndex].fileName);
        setModalFile(filedata[newIndex].fileName);
      } else if (videoTypes.includes(ft)) {
        setImageSrc("");
        setAudioSrc("");
        setPdfSrc("");
        setDocSrc("");
        setIsProgressVisible(false);
        setVideoSrc(filedata[newIndex].fileName);
        setModalFile(filedata[newIndex].fileName);
      } else if (docTypes.includes(ft)) {
        // documents / ppt / excel
        setImageSrc("");
        setVideoSrc("");
        setAudioSrc("");
        setPdfSrc("");
        // set docSrc via fetch
        getDocInfo(filedata[newIndex].fileName);
        setModalFile(filedata[newIndex].fileName);
      } else {
        setImageSrc("");
        setAudioSrc("");
        setPdfSrc("");
        setVideoSrc("");
        setDocSrc("");
        setIsProgressVisible(false);
        setErrorMessage2("Unsupported file format");
        setModalFile(filedata[newIndex].fileName);
      }

      return newIndex;
    });
  };




  const deleteFromModal = async (filename) => {
    const loaderStartedAt = Date.now();
    setLoader_Recycle(true);
    const deletedIndex = currentImageIndex;

    const lastSlashIndex = filename.lastIndexOf("/");
    const dataToSend =
      lastSlashIndex === -1
        ? { sourceFolder: "", keys: [filename] }
        : {
            sourceFolder: filename
              .substring(0, lastSlashIndex)
              .replace(/\/$/, ""),
            keys: [filename.substring(lastSlashIndex + 1)],
          };

    try {
      await axios.delete(`${apiUrl}soft-delete`, { ...LONG_RUNNING_AWS_REQUEST_OPTIONS, 
        data: dataToSend,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const combined = await getFileData();
      await getRootFolderSize();

      const startIndex = (currentPage - 1) * itemsPerPage;
      const pageFiles = combined.slice(startIndex, startIndex + itemsPerPage);
      const next = resolvePreviewAfterDelete(
        pageFiles,
        filename,
        deletedIndex,
        { isSharedValue }
      );

      if (!next) {
        handleImageClose();
      } else {
        openPreviewFile(next.file, next.index, {
          handleImageShow,
          setCurrentImageIndex,
          setPreviewFile,
          setModalFile,
          setErrorMessage2,
          setIsProgressVisible,
          setImageSrc,
          setVideoSrc,
          setAudioSrc,
          setPdfSrc,
          setDocSrc,
          getImageInfo,
          getPdfInfo,
          getDocInfo,
        });
      }

      afterMinLoaderDisplay(loaderStartedAt, () => {
        setLoader_Recycle(false);
        showToast("success", "File moved to recycle bin successfully");
      });
    } catch (error) {
      showToast("error", "There's an error while moving file to recycle bin!");
      afterMinLoaderDisplay(loaderStartedAt, () => setLoader_Recycle(false));
    }
  };



  const moveFromModal = async () => { };

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


   // Function called when dragging starts
  const handleDragStart = (e, file) => {
    setDraggedItem(file); // Keep track of the currently dragged item
    e.dataTransfer.effectAllowed = "move";

    const totalSelectedItems = keys.length + keys2.length;

    const dragPreview = document.createElement("div");
    dragPreview.style.width = "200px"; // Adjust the size as needed
    dragPreview.style.height = "auto"; // Let the height adjust based on content
    dragPreview.style.backgroundColor = "white";
    dragPreview.style.border = "1px solid #ccc";
    dragPreview.style.padding = "10px";
    dragPreview.style.boxShadow = "0 4px 10px rgba(0, 0, 0, 0.2)";
    dragPreview.style.display = "flex";
    dragPreview.style.flexDirection = "column";
    dragPreview.style.alignItems = "center";
    dragPreview.style.justifyContent = "flex-start"; // Align items to the start
    dragPreview.style.gap = "10px"; // Add space between the icon and file name
    dragPreview.style.opacity = "1";

    dragPreview.style.position = "absolute";
    dragPreview.style.top = "-1000px"; // Move it way offscreen
    dragPreview.style.left = "-1000px";

    // Add the selected items
    if (totalSelectedItems > 1) {
      keys.forEach((fileName) => {
        const fileContainer = document.createElement("div");
        fileContainer.style.display = "flex";
        fileContainer.style.alignItems = "center";
        fileContainer.style.gap = "5px"; // Space between icon and name
        fileContainer.style.transition = "all 0.3s ease"; // Smooth transition on hover

        const fileIcon = document.createElement("div"); // Custom icon element
        fileIcon.style.width = "24px";
        fileIcon.style.height = "24px";
        fileIcon.style.backgroundColor = "#ddd"; // Custom icon color
        fileIcon.style.borderRadius = "4px"; // Rounded corners
        fileIcon.style.display = "flex";
        fileIcon.style.alignItems = "center";
        fileIcon.style.justifyContent = "center";
        fileIcon.innerText = "F"; // Replace "F" with a custom symbol or icon

        const fileNameSpan = document.createElement("span");
        fileNameSpan.innerText = fileName;
        fileNameSpan.style.fontSize = "14px";
        fileNameSpan.style.color = "#333";

        fileContainer.appendChild(fileIcon);
        fileContainer.appendChild(fileNameSpan);
        dragPreview.appendChild(fileContainer);

        // Apply the "dragging" style to each file container directly
        fileContainer.style.opacity = "1"; // Make sure it's fully visible
      });

      // Iterate over the keys2 array to add folder icons and names
      keys2.forEach((folderName) => {
        const folderContainer = document.createElement("div");
        folderContainer.style.display = "flex";
        folderContainer.style.alignItems = "center";
        folderContainer.style.gap = "5px"; // Space between icon and name
        folderContainer.style.transition = "all 0.3s ease"; // Smooth transition on hover

        const folderIcon = document.createElement("div"); // Folder icon element
        folderIcon.style.width = "24px";
        folderIcon.style.height = "24px";
        folderIcon.style.backgroundColor = "#ffcc00"; // Folder icon color
        folderIcon.style.borderRadius = "4px"; // Rounded corners
        folderIcon.style.display = "flex";
        folderIcon.style.alignItems = "center";
        folderIcon.style.justifyContent = "center";
        folderIcon.innerText = "📁"; // Folder emoji as an icon

        const folderNameSpan = document.createElement("span");
        folderNameSpan.innerText = folderName;
        folderNameSpan.style.fontSize = "14px";
        folderNameSpan.style.color = "#333";

        folderContainer.appendChild(folderIcon);
        folderContainer.appendChild(folderNameSpan);
        dragPreview.appendChild(folderContainer);

        // Apply the "dragging" style to each folder container directly
        folderContainer.style.opacity = "1"; // Make sure it's fully visible
      });
    } else {
    }

    // Add the dragged item to the preview (whether it’s selected or not)
    const draggedItemContainer = document.createElement("div");
    draggedItemContainer.style.display = "flex";
    draggedItemContainer.style.alignItems = "center";
    draggedItemContainer.style.gap = "5px"; // Space between icon and name
    draggedItemContainer.style.transition = "all 0.3s ease"; // Smooth transition on hover

    const draggedItemIcon = document.createElement("div"); // Custom icon element for dragged item
    draggedItemIcon.style.width = "24px";
    draggedItemIcon.style.height = "24px";
    draggedItemIcon.style.backgroundColor = "#4caf50"; // Different color for dragged item
    draggedItemIcon.style.borderRadius = "4px"; // Rounded corners
    draggedItemIcon.style.display = "flex";
    draggedItemIcon.style.alignItems = "center";
    draggedItemIcon.style.justifyContent = "center";
    draggedItemIcon.innerText = "D"; // "D" for dragged item (replace with custom icon)

    const draggedItemName = document.createElement("span");
    draggedItemName.innerText = file.fileName; // The dragged item's name
    draggedItemName.style.fontSize = "14px";
    draggedItemName.style.color = "#333";

    draggedItemContainer.appendChild(draggedItemIcon);
    draggedItemContainer.appendChild(draggedItemName);
    dragPreview.appendChild(draggedItemContainer);

    // Attach the custom drag image
    document.body.appendChild(dragPreview);
    e.dataTransfer.setDragImage(dragPreview, 0, 0);

    // Apply a 'dragging' effect to all items in the preview
    const previewItems = dragPreview.querySelectorAll("div"); // All items in the preview
    previewItems.forEach((item) => {
      item.style.opacity = "1"; // Ensure they are all visible during dragging
    });

    // Add the 'dragging' class to the target element
    e.target.classList.add("dragging");
  };




  const moveDraggedFile = async (filename) => {
    const sharedParams = isSharedValue ? { shared: filenameRedux } : {};
    let uploadId = null;

    if (filename.isFolder === true) {
      try {
        uploadId = startMoveTransfer(
          addUpload,
          updateUploadProgress,
          "Moving " + filename.fileName,
          { isFolder: true }
        );
        await axios.post(
          `${apiUrl}move-folder`,
          {
            sourceFolders: [filename.fileName],
            destinationFolder: targetFolder,
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
        showToast("success", "Folder Moved Successfully!");
      } catch (error) {
        failMoveTransfer(removeUpload, uploadId);
        uploadId = null;
        showToast(
          "error",
          getApiErrorMessage(error, "Failed to move folder!")
        );
        console.error("Error moving file:", error);
        throw error;
      }
    } else {
      const movingFile = filename.fileName;
      try {
        uploadId = startMoveTransfer(
          addUpload,
          updateUploadProgress,
          "Moving " + movingFile
        );
        await axios.post(
          `${apiUrl}move-file`,
          {
            sourceFolder: "",
            destinationFolder: targetFolder,
            keys: [filename.fileName],
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
        showToast("success", `"${movingFile}" Moved Successfully!`);
      } catch (error) {
        failMoveTransfer(removeUpload, uploadId);
        uploadId = null;
        showToast(
          "error",
          getApiErrorMessage(
            error,
            `Failed to move file "${movingFile}". Please try again.`
          )
        );
        throw error;
      }
    }
  };

  //Move multiple files
  const moveMultipleDrag = async (arr, folname) => {
    let uploadId = null;
    const sharedParams = isSharedValue ? { shared: filenameRedux } : {};
    try {
      uploadId = startMoveTransfer(
        addUpload,
        updateUploadProgress,
        "Moving files…"
      );
      for (const key of arr) {
        await axios.post(
          `${apiUrl}move-file`,
          {
            sourceFolder: "",
            destinationFolder: folname,
            keys: [key],
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            params: sharedParams,
          }
        );
      }
      setKeys([]);
      finishMoveTransfer(updateUploadProgress, removeUpload, uploadId);
      uploadId = null;
      showToast("success", "Files Moved Successfully!");
    } catch (error) {
      failMoveTransfer(removeUpload, uploadId);
      uploadId = null;
      console.error(error);
      showToast(
        "error",
        getApiErrorMessage(error, "Failed to move files. Please try again.")
      );
      throw error;
    }
  };

  //Move multiple folders
  const moveMultipleDrag2 = async (arr, folname) => {
    let uploadId = null;
    const sharedParams = isSharedValue ? { shared: filenameRedux } : {};

    try {
      if (!arr || arr.length === 0) return;

      const sharedFolders = arr.filter(
        (folder) =>
          (typeof folder === "object" && folder.isShared) ||
          (typeof folder === "string" &&
            filedata.find((f) => f.fileName === folder)?.isShared)
      );

      if (sharedFolders.length > 0) {
        const sharedNames = sharedFolders
          .map((f) => (typeof f === "string" ? f : f.fileName || f.name))
          .join(", ");
        showToast("error", `Cannot move shared folder(s): ${sharedNames}`);
        return;
      }

      const sourceFolders = arr
        .map((f) =>
          typeof f === "string"
            ? f
            : f.filePath || f.path || f.fileName || f.name || ""
        )
        .filter(Boolean);

      if (!sourceFolders.length) return;

      const movingFolders = sourceFolders.join(", ");
      uploadId = startMoveTransfer(
        addUpload,
        updateUploadProgress,
        "Moving " + movingFolders,
        { isFolder: true }
      );

      await axios.post(
        `${apiUrl}move-folder`,
        {
          sourceFolders,
          destinationFolder: folname,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          params: sharedParams,
        }
      );

      setKeys2([]);
      finishMoveTransfer(updateUploadProgress, removeUpload, uploadId);
      uploadId = null;
      showToast("success", "Folders Moved Successfully!");
    } catch (error) {
      failMoveTransfer(removeUpload, uploadId);
      uploadId = null;
      console.error(error);
      showToast(
        "error",
        getApiErrorMessage(error, "Failed to move folders. Please try again.")
      );
      throw error;
    }
  };

  const handleDragMoveConfirm = async () => {
    setDragPop(false);
    setLoader2(true);

    try {
      const tasks = [];
      if (dragFile?.fileName) {
        tasks.push(moveDraggedFile(dragFile));
      }
      if (keys.length > 0) {
        tasks.push(moveMultipleDrag(keys, targetFolder));
      }
      if (keys2.length > 0) {
        tasks.push(moveMultipleDrag2(keys2, targetFolder));
      }
      await Promise.all(tasks);
      setCurrentPage(1);
      afterLoaderComplete(() => setLoader2(false));
      await refreshFileListWithSkeleton();
    } catch (error) {
      console.error("Drag move failed:", error);
      afterLoaderComplete(() => setLoader2(false));
    }
  };

  // Function to show the dropdown when the "Move" button is clicked
  const handleMoveClick = () => {
    setShowDropdown(!showDropdown);
  };

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
      showToast(
        "error",
        getApiErrorMessage(error, "Failed to move file.")
      );
    }
  };

  return (
    <>
      <ChakraProvider></ChakraProvider>

      {codePopup && (
        <div className="code-popup-overlay">
          <div className="code-popup-container">
            <button
              className="code-popup-close-btn"
              onClick={() => setCodePopup(false)}
              aria-label="Close"
            >
              ×
            </button>

            <h2 className="code-popup-title">Code Preview</h2>

            <div
              className="code-scroll-container"
              style={{ maxHeight: "70vh", overflowY: "auto" }}
              onScroll={handleScroll}
            >
              {codeChunks.map((chunk, idx) => (
                <SyntaxHighlighter
                  key={idx}
                  language={codeLanguage}
                  style={oneLight}
                  wrapLines
                  wrapLongLines
                  className="code-popup-highlighter"
                >
                  {chunk}
                </SyntaxHighlighter>
              ))}

              {isLoading1 && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "10px",
                    display: "flex",
                    justifyContent: "center",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <img src={loaderGif} alt="" />
                  <p>Loading Code File....</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showGoogleAuthPopup && (
        <div className="rename_popup_wrapper">
          <div className="modal-content">
            <h2>Google Sign-In Required</h2>
            <p>
              Shared folder functionality is available for your account, but
              please log in with Google Sign-In to access it.
            </p>
            <button onClick={() => setShowGoogleAuthPopup(false)}>Okay</button>
          </div>
        </div>
      )}

     <FileInfoModal
        isOpen={infoShower}
        onClose={() => setInfoShower(false)}
        fileInfo={fileInfo}
        isPremium={isPremium}
        showVisibility
        onUpgrade={() => setShowUpgradeModal(true)}
      />



      <VisibilityModal
        isOpen={isVisibility}
        onClose={() => setIsVisibility(false)}
        value={pubpri}
        onChange={(next) => setPubPri(next)}
        onApply={() => changeVisibility(visiKey)}
        fileName={visiKey}
      />
      {renamePop && (
        <RenameModal
          isOpen={renamePop}
          onClose={handleClosePopover}
          value={inputValue}
          onChange={handleInputChange}
          onSubmit={() =>
            handleFileRename(
              checkLastHash(newFileName),
              inputValue + extension,
              wholeFile
            )
          }
          isSubmitting={isRenaming}
          currentName={newFileName}
          extensionSuffix={extension}
          description={
            wholeFile?.isFolder
              ? "Enter a new name for this folder."
              : "Enter a new name for this file."
          }
        />
      )}

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
            <h2 className="rename_title2">Move to Recycle Bin?</h2>
            <p className="rename_subtext">The item will be moved to the recycle bin. You can restore or permanently delete it later from there.</p>

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


      {dragPop && (
  <div
    className="drag_popup_wrapper"
    onClick={() => setDragPop(false)} // Close on backdrop click
    onKeyDown={(e) => e.key === "Escape" && setDragPop(false)}
    tabIndex={-1}
    role="dialog"
    aria-modal="true"
    aria-labelledby="move-confirm-title"
  >
    <div
      className="drag_modal"
      onClick={(e) => e.stopPropagation()} // Prevent close when clicking inside modal
    >
  

      <h2 id="move-confirm-title" className="rename_title2">
        Move to "{targetFolder}"?
      </h2>

      <p className="modal-subtitle" style={{marginBottom:"12px"}}>
        {keys.length + keys2.length > 1
          ? `${keys.length + keys2.length} items`
          : "This item"}{" "}
        will be moved to the selected folder. This action cannot be undone.
      </p>



      <div className="drag_buttons">
        <button
          className="drag_btn cancel"
          onClick={() => setDragPop(false)}
        >
          Cancel
        </button>

        <button
          className="drag_btn ok"
          onClick={handleDragMoveConfirm}
        >
          Move
        </button>
      </div>
    </div>
  </div>
)}

      {/* // Modal component */}

      {downloadPopup && (
        <div className="rename_popup_wrapper">
          <div className="rename_modal">
            <h2 className="rename_title2" style={{ marginBottom: 16 }}>
              {loading
                ? `Downloading... ${progress}%`
                : "Are you sure you want to download?"}
            </h2>

            {/* Progress Bar */}
            <div
              className="download_progress_wrapper"
              style={{ display: loading ? "block" : "none" }}
            >
              <div
                className="download_progress_bar"
                style={{ width: `${progress}%` }}
              ></div>
            </div>

            <div className="rename_buttons" style={{ marginTop: 24 }}>
              <button
                className="rename_btn cancel"
                onClick={handleCancelDownload}
              >
                {loading ? "Cancel" : "No"}
              </button>

              {!loading && (
                <button
                  className="rename_btn ok"
                  onClick={handleConfirmDownload}
                >
                  Yes
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="rename_popup_wrapper">
          <div className="rename_modal">
            <h2 className="rename_title2" style={{ marginBottom: 24 }}>
              Are you sure you want to Delete all the files and folder?
            </h2>

            <div className="rename_buttons" style={{ marginTop: 16 }}>
              <button
                className="rename_btn cancel"
                onClick={() => setShowDeleteModal(false)}
                style={{ marginRight: 12 }}
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
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showDownloadModal && (
        <div className="rename_popup_wrapper">
          <div className="rename_modal">
            <h2 className="rename_title2" style={{ marginBottom: 24 }}>
              Download all selected files?
            </h2>

            <div className="rename_buttons" style={{ marginTop: 16 }}>
              <button
                className="rename_btn cancel"
                onClick={() => setShowDownloadModal(false)}
                style={{ marginRight: 12 }}
              >
                Cancel
              </button>

              <button
                className="rename_btn ok"
                onClick={() => {
                  handleMulDownload();
                  setShowDownloadModal(false);
                }}
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}


      <FileShareModal
        isOpen={sharePopup}
        onClose={closeSharePopup}
        file={selectedFile}
        resolveFilePath={(file) => removeSlash2(file.fileName)}
        apiUrl={apiUrl}
        token={token}
        shared={isSharedValue ? filenameRedux : undefined}
        onCopied={() => showToast("success", "Copied to clipboard!")}
        onError={(msg) =>
          showToast("error", msg || "Failed to generate or copy link!")
        }
      />

      <SideNav />

      
      <div className={`container-fluid page-body-wrapper files-layout${isMobile ? " files-layout--mobile" : ""}`}>
        {/* partial:partials/_navbar.html */}
        <nav className="navbar p-0 fixed-top d-flex flex-row files-navbar">
          <div className="navbar-menu-wrapper flex-grow files-navbar__shell">
            <header className="files-app-header">
              <div className="files-app-header__menu">
                <ToggleNav />
              </div>

              <div className="files-app-header__titles">
                <h1 className="files-app-header__title">Recent Uploads</h1>
                <div className="files-app-header__welcome files-nav-welcome">
                  <span className="files-nav-welcome__greet">Welcome back</span>
                  <span className="files-nav-welcome__name">
                    {userProfile.name || userData?.userData?.name || userData?.name || name}
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="files-app-header__profile"
                title="Edit profile"
                aria-label="Open profile"
                onClick={() => navigate("/UserProfile")}
              >
                <img
                  src={avatarUrl || AvatarDefault}
                  alt=""
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = AvatarDefault;
                  }}
                />
              </button>
            </header>
          </div>
        </nav>
        {/* partial */}
        <div className="main-panel files-page">
          <div className="content-wrapper">
            <div className={filesTableBoxClassName} ref={filesTableBoxRef}>
              <div className="filerbar_row" ref={filesFilterBarRef}>
                <div className="show_entries_row">
                  <FileSearchBar
                    value={query}
                    onChange={handleSearchChange}
                    onClear={clearSearch}
                    isPremium={isPremium}
                    onPremiumGate={() => setShowUpgradeModal(true)}
                  />
                </div>

                <div className="files-toolbar filter-row-new">
                  <div className="files-toolbar__main">
                    {!isMobile && (
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
                    )}

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
                            setShowFTPopup(true);
                          }}
                        >
                        </Dropdown>

                        {showFTPopup && (
                          <div className="ft-filter-popup">
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

                  <div className="files-toolbar__actions">
                    <Whisper
                      placement="top"
                      trigger="hover"
                      speaker={<Tooltip>Create Folder</Tooltip>}
                    >
                      <button
                        onClick={handleOpenCreateFolder}
                        className="download-btn2"
                        type="button"
                        aria-label="Create Folder"
                      >
                        <img src={CreateFolder} alt="" />
                      </button>
                    </Whisper>

                    <Whisper
                      placement="top"
                      trigger="hover"
                      speaker={<Tooltip>Download from URL</Tooltip>}
                    >
                      <button
                        onClick={() => {
                          if (!isPremium) {
                            setShowUpgradeModal(true);
                            return;
                          }
                          setIsDownloadModalOpen(true);
                        }}
                        className="download-btn"
                        type="button"
                        aria-label="Download from URL"
                      >
                        <img src={DownloafFromUrl} alt="" />
                      </button>
                    </Whisper>

                    <Whisper
                      placement="top"
                      trigger="hover"
                      speaker={<Tooltip>Upload</Tooltip>}
                    >
                      <button
                        onClick={handleOpenFileUploadModal}
                        className="btn__upload__file_modal"
                        type="button"
                        aria-label="Upload"
                      >
                        <img src={IconUpload} alt="" />
                      </button>
                    </Whisper>
                  </div>
                </div>
              </div>

              <BulkSelectionToolbar
                selectedCount={keys.length + keys2.length}
                isSelectAll={isSelectAll}
                onSelectAllToggle={handleSelectAllToggle}
                variant="files"
                showCopy={keys2.length === 0}
                onDownload={() => {
                  if (keys.length === 0 && keys2.length === 0) {
                    showToast("error", "No files or folders selected!");
                  } else {
                    setShowDownloadModal(true);
                  }
                }}
                onCopy={handleCopyButton}
                onMove={handleBulkMoveSelection}
                onDelete={() => setShowDeleteModal(true)}
              />



              {/* {isLoading ? ( */}


              <div id="dataView">
                {displayView === "list" ? (
                  placeholderLoading || filterSortLoading || searchLoading ? (
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
                          <th
                            className="files-col-check"
                            style={{ width: "40px", textAlign: "center" }}
                          >
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
                            <span
                              className="column-name-new"
                              style={{ alignItems: "center" }}
                            >
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
    <tbody
      key={`${file.isShared ? "shared" : "own"}-${file.fileName || "item"}-${index}`}
    >
      <tr
        className={`hover_cell 
          ${activeRow === 1 ? "active-row" : ""} 
          ${hoveredFolderName === file.fileName ? "drag-over" : ""}`}
        draggable={!(file.fileName === "blackbox" || file.isShared)}
        onDragStart={
          (file.fileName === "blackbox" || file.isShared)
            ? null
            : (e) => handleDragStart(e, file)
        }
        onDragOver={
          (file.isFolder && !(file.fileName === "blackbox" || file.isShared))
            ? handleDragOver
            : null
        }
        onDragEnter={
          (file.isFolder && !(file.fileName === "blackbox" || file.isShared))
            ? (e) => handleDragEnterFolder(e, file)
            : null
        }
        onDragLeave={
          (file.isFolder && !(file.fileName === "blackbox" || file.isShared))
            ? handleDragLeaveFolder
            : null
        }
        onDragEnd={handleDragEnd}
        onDrop={
          (file.isFolder && !(file.fileName === "blackbox" || file.isShared))
            ? (e) => {
                console.log("[] DROP EVENT FIRED ON ROW →", file.fileName);
                console.log("[] Mouse position at drop:", e.clientX, e.clientY);
                handleDrop(e);
              }
            : null
        }
      >
        {/* Checkbox */}
        <td
          className={`files-col-check hover_cell 
            ${activeRow === 1 ? "active-row" : ""} 
            ${hoveredFolderName === file.fileName ? "drag-over" : ""}`}
        >
          <input
            id={`check-${file.fileName}`}
            type="checkbox"
            className={`hover_cell 
              ${activeRow === 1 ? "active-row" : ""} 
              ${hoveredFolderName === file.fileName ? "drag-over" : ""}`}
            style={{
              backgroundColor: hoveredFolderName === file.fileName ? "red" : "transparent",
              opacity: (file.fileName === "blackbox" || file.isShared) ? 0.5 : 1,
              cursor: (file.fileName === "blackbox" || file.isShared) ? "not-allowed" : "pointer",
            }}
            checked={
              file.isFolder
                ? keys2.includes(file.fileName)
                : keys.includes(file.fileName)
            }
            disabled={file.fileName === "blackbox" || file.isShared}
            onChange={() => {
              // Only allow change if NOT disabled
              if (file.fileName !== "blackbox" && !file.isShared) {
                handleCheckboxChange(file);
              }
            }}
          />
        </td>

        {/* Name + icon column blackbox */}
        <td
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            cursor: "pointer",
            height: "55px"
          }}
          className={
            `files-col-name hover_cell 
            ${activeRow === 1 ? "active-row" : ""} 
            ${hoveredFolderName === file.fileName ? "drag-over" : ""}
            `
          }
          onClick={() => {
            if (trySelectInsteadOfOpen(file)) return;

            setErrorMessage2("");
            setPreviewFile(file);

            const isFolder = file.fileType === "Folder" || file.isFolder === true;

            if (isFolder) {
              chkFileorFolder(file, file.fileSize);
              return;
            }

            const codeExtensions = [
              "js", "jsx", "ts", "tsx", "html", "css", "json", "xml",
              "py", "java", "c", "cpp", "rb", "php", "sh", "go", "cs",
            ];

            const fileTypeLower = file.fileType?.toLowerCase();

            if (codeExtensions.includes(fileTypeLower)) {
              previewCodeFile(file);
              return;
            }

            const imageTypes = ["jpeg", "jpg", "png", "gif", "heic", "hevc", "heif", "svg", "webp", "avif"];
            const pdfTypes = ["pdf", "txt"];
            const videoTypes = ["mkv", "mp4", "mov", "mpeg", "webm"];
            const audioTypes = ["mp3", "m4a", "wav", "ogg", "aac"];
            const docTypes = ["doc", "docx", "ppt", "pptx", "pptm", "pps", "ppsx", "xls", "xlsx", "xlsm", "csv", "ods"];

            if (videoTypes.includes(fileTypeLower)) {
              setModalFile(file.fileName);
              handleImageShow();
              setVideoSrc(file.fileName);
              const idx = filedata.findIndex(f => f.fileName === file.fileName);
              if (idx !== -1) setCurrentImageIndex(idx);
              return;
            }

            if (imageTypes.includes(fileTypeLower)) {
              setModalFile(file.fileName);
              handleImageShow();
              getImageInfo(file.fileName);
              const idx = filedata.findIndex(f => f.fileName === file.fileName);
              if (idx !== -1) setCurrentImageIndex(idx);
              return;
            }

            if (audioTypes.includes(fileTypeLower)) {
              playAudioFile(allEntries, file.fileName);
              return;
            }

            if (pdfTypes.includes(fileTypeLower)) {
              setModalFile(file.fileName);
              handleImageShow();
              getPdfInfo(file.fileName);
              const idx = filedata.findIndex(f => f.fileName === file.fileName);
              if (idx !== -1) setCurrentImageIndex(idx);
              return;
            }

            if (docTypes.includes(fileTypeLower)) {
              setModalFile(file.fileName);
              handleImageShow();
              if (["ppt", "pptx"].includes(fileTypeLower)) {
                getDocInfo(file.fileName);
              } else {
                getDocInfo(file.fileName);
              }
              const idx = filedata.findIndex(f => f.fileName === file.fileName);
              if (idx !== -1) setCurrentImageIndex(idx);
              return;
            }

            handleImageShow();
            setErrorMessage2("File format not supported!");
            setModalFile(file.fileName);
            const idx = filedata.findIndex(f => f.fileName === file.fileName);
            if (idx !== -1) {
              setCurrentImageIndex(idx);
              setModalFile(file.fileName);
            }
          }}
        >
          <span className="filename_link" style={{ cursor: "pointer" }}>
            <img
              src={getFileIcon(file)}
              height={32}
              alt="file icon"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = file.isFolder ? svgFolder : svgDoc;
              }}
            />
          </span>
          <div className="file-item">
            <span
              title={getTextAfterLastSlash(file.fileName)}
              className="file-name filename_link"
              style={{ cursor: "pointer" }}
            >
              {getTextAfterLastSlash(customTruncateFileName(file.fileName, 55))}
            </span>
            <span
              className="file-path"
              title={getTextBeforeLastSlash(file.fileName).replace(/>/g, "/")}
            >
              {getTextBeforeLastSlash(file.fileName).replace(/>/g, "/")}
            </span>
          </div>
        </td>

              {/* FileSize */}
        <td 
        // className="" 
        className={
            `files-col-size hover_cell fileSizeTL
            ${activeRow === 1 ? "active-row" : ""} 
            ${hoveredFolderName === file.fileName ? "drag-over" : ""}`
          }
        data-sort={1673004} 
        style={{ textAlign: "center", fontWeight: "500" }}>
          <span style={{ fontWeight: "500" }}>{file.fileSize}</span>
        </td>

            {/* Modified on */}
        <td 
        // className="" 
        className={
              `files-col-date hover_cell fileSizeTD
              ${activeRow === 1 ? "active-row" : ""} 
              ${hoveredFolderName === file.fileName ? "drag-over" : ""}`
            }
        data-sort="2023-12-16 07:32:38" 
        style={{ textAlign: "center" }}>
          <p>{file.uploadDateTime.substring(0, file.uploadDateTime.indexOf(","))}</p>
          <span>{file.uploadDateTime.substring(file.uploadDateTime.indexOf(",") + 1).trim()}</span>
        </td>

              {/* Action three dots */}
        <td 
        className={
              `files-col-action hover_cell 
              ${activeRow === 1 ? "active-row" : ""} 
              ${hoveredFolderName === file.fileName ? "drag-over" : ""}`
            }
            style={{ textAlign: "center" }}>
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
                // stroke-width="2"
                strokeWidth="2"
                strokeLinecap="round"
                // stroke-linejoin="round"
                strokeLinejoin="round"
                className="feather feather-more-vertical"
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
            //  aria-labelledby={`dropdownMenuButton-${file.fileName}`}
            >
              <a className="file-container">
                <div className="file-icon">
                  <img
                    src={getFileIcon(file)}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = file.isFolder
                        ? "/images/icons/Folder.svg"
                        : "/images/icons/doc.svg";
                    }}
                    alt="file icon"
                  />
                </div>
                <div className="file-details">
                 <div
                    className="file-name"
                    style={{
                      whiteSpace: 'nowrap',           // prevents wrapping to new line
                      overflow: 'hidden',             // hides overflowing text
                      textOverflow: 'ellipsis',       // adds ... at the end
                      maxWidth: '220px',              // ← adjust this value based on your menu width
                      display: 'block',               // or 'inline-block' — test what fits best
                    }}
                    title={file.fileName}             // full name shown on hover/tooltip
                  >
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



              {!isSharedValue && file.isFolder === false && (
                isFileFavorited(file.fileName) ? (
                  <a
                    className="dropdown-item dropdown-item-custom"
                    href="#"
                    style={{display: "flex",
  justifyContent: "space-between",}}
                    onClick={() => {
                        if (!isPremium) {
                        setShowUpgradeModal(true);   // or showUpgradeToast()
                        return;
                      }
                      handleRemoveFromFavorites(file)}
                    }
                  >
                    <span style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <StarIcon
                      style={{
                        fontSize: "20px",
                        color: "#FFAB49",
                        // marginRight: "8px"
                      }}
                    />
                    Remove from Favorites
                    </span>



                      {!isPremium && <span className="context-menu-icon">
                  <img src={svgCrown} alt="" style={{ height: "20px" }}  />
                  </span>}
                  </a>
                ) : (
                  <a
                    className="dropdown-item dropdown-item-custom"
                    href="#"
                    style={{display: "flex",
  justifyContent: "space-between",}}
                    onClick={() => {
                        if (!isPremium) {
                        setShowUpgradeModal(true);   // or showUpgradeToast()
                        return;
                      }
                      handleAddToFavorites(file)}}
                  >
                    <span style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <StarBorderIcon
                      style={{
                        fontSize: "20px",
                        color: "#494949",
                        // marginRight: "8px"
                      }}
                    />
                    Add to Favorites
                    </span>


                      {!isPremium && <span className="context-menu-icon">
                  <img src={svgCrown} alt="" style={{ height: "20px" }}  />
                  </span>}
                  </a>
                )
              )}

              {/* {file.isFolder === false && (
                <a
                  className="dropdown-item dropdown-item-custom"
                  href="#"
                  onClick={() => {
                    if (!isPremium) {
                      setShowUpgradeModal(true);   // or showUpgradeToast()
                      return;
                    }
                    shareFile(file)
                    console.log("file name is: ",file);
                  }}
                    style={{ display: "flex",
  justifyContent: "space-between"}}
                >
                  <span style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <img
                    src={shareIcon}
                    alt="Share"
                    className="dropdown-icon-list"
                  />
                  Share
                  </span>


                    {!isPremium && <span className="context-menu-icon">
                    <img src={svgCrown} alt="" style={{ height: "20px" }}  />
                    </span>}
                </a>
              )} */}
              {file.isFolder === false && (
  <a
    className="dropdown-item dropdown-item-custom"
    href="#"
    onClick={() => {
      if (file.ACL === "private") {
        setFileToShare(file);
        setShowPrivateWarning(true);
        return;
      }

      if (!isPremium) {
        setShowUpgradeModal(true);
        return;
      }

      shareFile(file);
      console.log("file name is: ", file);
    }}
    style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
  >
    <span style={{ display: "flex", gap: "10px", alignItems: "center" }}>
      <img
        src={shareIcon}
        alt="Share"
        className="dropdown-icon-list"
      />
      Share
    </span>

    {file.ACL === "private" ? (
      // <span style={{ fontSize: "0.9em", color: "#d9534f" }}>Private</span>
      <FaLock color="#656566" />
    ) : !isPremium ? (
      <span className="context-menu-icon">
        <img src={svgCrown} alt="Premium" style={{ height: "20px" }} />
      </span>
    ) : null}
  </a>
)}

              

              {file.fileName.includes(".zip") ? (
                <a
                  className={`dropdown-item dropdown-item-custom ${
                    file?.isShared || file?.fileName === "blackbox"
                      ? "disabled blur-effect"
                      : ""
                  }`}
                  href="#"
                  onClick={() =>
                    { 
                      if (!isPremium) {
                setShowUpgradeModal(true);   // or showUpgradeToast()
                return;
              }
              !file?.isShared && UnzipFile(file)}
                  }
                  style={
                    file?.isShared|| file?.fileName === "blackbox"
                      ? {
                        pointerEvents: "none",
                        opacity: 0.5,
                      }
                      : {display: "flex",
  justifyContent: "space-between",}
                  }
                >
                  <span style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <img
                    src={UnZipIcon}
                    alt="Unzip"
                    className="dropdown-icon-list"
                  />
                  Unzip
                  </span>

                    {!isPremium && <span className="context-menu-icon">
  <img src={svgCrown} alt="" style={{ height: "20px" }}  />
  </span>}


                </a>
              ) : (
                <a
                  // className={`dropdown-item dropdown-item-custom ${file?.isShared
                  //     ? "disabled blur-effect"
                  //     : ""
                  //   }`}
                  className={`dropdown-item dropdown-item-custom ${
                    file?.isShared || file?.fileName === "blackbox"
                      ? "disabled blur-effect"
                      : ""
                  }`}
                  href="#"
                  onClick={() =>
                    { 
                    if (!isPremium) {
                    setShowUpgradeModal(true);   // or showUpgradeToast()
                    return;
                  }

                  !file?.isShared && ZipFile(file)}
                  }
                  style={
                    file?.isShared|| file?.fileName === "blackbox"
                      ? {
                        pointerEvents: "none",
                        opacity: 0.5,
                      }
                      : {display: "flex",
  justifyContent: "space-between",}
                  }
                >
                  <span style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <img
                    src={ZipIcon}
                    alt="Zip"
                    className="dropdown-icon-list"
                  />
                  Zip
                  </span>


                  {!isPremium && <span className="context-menu-icon">
                    <img src={svgCrown} alt="" style={{ height: "20px" }}  />
                    </span>}
                </a>
              )}

                {file.isFolder === false && (
                <a
                  className="dropdown-item dropdown-item-custom"
                  href="#"
                  onClick={() => {
                    setIsVisibility(true);
                    setVisiKey(file.fileName);
                    setPubPri(file.ACL);
                    
                  }}
                >
                  <img
                    src={eyeIcon}
                    alt="Share"
                    className="dropdown-icon-list"
                  />
                  Change Visibility
                </a>
              )}

              {/* {file.isFolder === false && ( */}
              <a
                // className={`dropdown-item dropdown-item-custom ${file?.isShared
                //     ? "disabled blur-effect"
                //     : ""
                //   }`}
                className={`dropdown-item dropdown-item-custom ${
                    file?.isShared || file?.fileName === "blackbox"
                      ? "disabled blur-effect"
                      : ""
                  }`}
                href="#"
                onClick={() =>
                  !file?.isShared &&
                  downloadFile(file)
                }
                style={
                  file?.isShared || file?.fileName === "blackbox"
                    ? {
                      pointerEvents: "none",
                      opacity: 0.5,
                    }
                    : {}
                }
              >
                <img
                  src={downloadIcon}
                  alt="Download"
                  className="dropdown-icon-list"
                />
                Download
              </a>
              {/* )} */}

          <a
          className={`dropdown-item dropdown-item-custom ${
            file?.isShared || file?.fileName === "blackbox" ? "disabled blur-effect" : ""
          }`}
          href="#"
          onClick={() => {
            if (file?.isShared) return;

        

            handleOpenPopover(file);
          }}
          style={
            file?.isShared || file?.fileName === "blackbox"
              ? {
                  pointerEvents: "none",
                  opacity: 0.5,
                }
              : {}
          }
        >
        
          
            <img
              src={renameIcon}
              alt="Rename"
              className="dropdown-icon-list"
            />
            {/* Rename4 */}
            Rename

      
        </a>


              
              <a
                className="dropdown-item dropdown-item-custom"
                href="#"
                onClick={() => {
                  if (file.isFolder) {
                    handleMFClick(file.fileName);
                  } else {
                    handleMClick(file.fileName);
                  }
                }}
                style={
                  file?.isShared || file?.fileName === "blackbox"
                    ? {
                      pointerEvents: "none",
                      opacity: 0.5,
                    }
                    : {}
                }
              >
                <img
                  src={moveIcon2}
                  alt="Move"
                  className="dropdown-icon-list"
                />
                Move to
              </a>
              {file.isFolder === false && (
                <a
                  className="dropdown-item dropdown-item-custom"
                  href="#"
                  onClick={() => {
                    handleCClick(file.fileName, file.fileSize)
                  }
                  }
                >
                  <img
                    src={copyIcon}
                    alt="Copy"
                    className="dropdown-icon-list"
                  />
                  Copy to
                </a>
              )}
              {/* {file.isFolder === false && (
                <a
                  className="dropdown-item dropdown-item-custom"
                  href="#"
                  onClick={() =>
                    handleGenerateLink(file)
                  }
                >
                  <img
                    src={linkIcon}
                    alt="Generate Short Link"
                    className="dropdown-icon-list"
                  />
                  Generate Short Link
                </a>
              )} */}
              {file.isFolder === false && (
                <a
                  className="dropdown-item dropdown-item-custom"
                  href="#"
                  onClick={() => {
                    setInfoShower(true);
                    getFileInfo(file.fileName, file);
                  }}
                >
                  <img
                    src={InfoIcon}
                    alt="Copy"
                    className="dropdown-icon-list"
                  />
                  Information
                </a>
              )}

              {/* <a
                className="dropdown-item dropdown-item-custom"
                href="#"
                onClick={() =>
                  handleOpenDeletePopover(file)
                }
                style={
                  file?.isShared
                    ? {
                      pointerEvents: "none",
                      opacity: 0.5,
                    }
                    : {}
                }
              >
                <img
                  src={deleteIcon2}
                  alt="Delete"
                  className="dropdown-icon-list"
                />
                Delete
              </a> */}
              {/* <a
  // className="dropdown-item dropdown-item-custom"
  className={`dropdown-item dropdown-item-custom ${file?.isShared ? "disabled blur-effect" : ""}`}
  href="#"
  onClick={(e) => {
  if (file?.fileName === "blackbox") {
  e.preventDefault(); // hard block
  return;
  }
  handleOpenDeletePopover(file);
  }}
  style={
  file?.fileName === "blackbox"
  ? {
  pointerEvents: "none",
  opacity: 0.5,
  }
  : {}
  }
  >
  <img
  src={deleteIcon2}
  alt="Delete"
  className="dropdown-icon-list"
  />
  Delete
  </a> */}

  <a
  className={`dropdown-item dropdown-item-custom ${file?.isShared ? "disabled blur-effect" : ""}`}
  href="#"
  onClick={(e) => {
  if (file?.fileName === "blackbox" || file?.isShared) {
  e.preventDefault();
  return;
  }
  handleOpenDeletePopover(file);
  }}
  style={
  file?.isShared || file?.fileName === "blackbox"
  ? {
  pointerEvents: "none",
  opacity: 0.5,
  }
  : {}
  }
  >
  <img
  src={deleteIcon2}
  alt="Delete"
  className="dropdown-icon-list"
  />
  Delete
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
                    {(placeholderLoading || filterSortLoading || searchLoading || filedata.length > 0) && (
                      <>
                    <th style={{ width: "40px", textAlign: "center" }}>
                      <input
                        id="check-Atharva"
                        type="checkbox"
                        onChange={handleSelectAllToggle}
                        checked={isSelectAll}
                        
                      />
                    </th>

                    <th
                      style={{
                        width: "60%",
                        fontWeight: 600,
                        color: "#181818",
                      }}
                    >
                      <span
                        className="column-name-new"
                        style={{ alignItems: "center" }}
                      >
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
                    </th>
                      </>
                    )}

                   <div>
                     <div className="grid-view2">
                      {placeholderLoading || filterSortLoading || searchLoading ? (
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
                          isFiltered={
                            selectedFileTypes.length > 0 ||
                            query.trim().length > 0
                          }
                        />
                      ) : (
                        filedata.map((file, index) => (
                         <div
  className={`grid-item2 
    ${activeRow === 1 ? "active-row" : ""} 
    ${hoveredFolderName === file.fileName ? "border_highlight" : ""} 
    ${draggedItem?.fileName === file.fileName && !(file.fileName === "blackbox" || file.isShared) ? "dragging" : ""}`}
  key={`${file.isShared ? "shared" : "own"}-${file.fileName || "item"}-${index}`}
  style={{ 
    cursor: (file.fileName === "blackbox" || file.isShared) ? "default" : "pointer" 
  }}
  draggable={!(file.fileName === "blackbox" || file.isShared)}  // ← disabled
  onDragStart={
    (file.fileName === "blackbox" || file.isShared)
      ? undefined
      : (e) => handleDragStart(e, file)
  }
  onDragOver={
    (file.isFolder && !(file.fileName === "blackbox" || file.isShared))
      ? handleDragOver
      : undefined
  }
  onDragEnter={
    (file.isFolder && !(file.fileName === "blackbox" || file.isShared))
      ? (e) => handleDragEnterFolder(e, file)
      : undefined
  }
  onDragLeave={
    (file.isFolder && !(file.fileName === "blackbox" || file.isShared))
      ? handleDragLeaveFolder
      : undefined
  }
  onDragEnd={handleDragEnd}  // safe to keep (global handler)
  onDrop={
    (file.isFolder && !(file.fileName === "blackbox" || file.isShared))
      ? (e) => {
          console.log("[] DROP EVENT FIRED ON ROW →", file.fileName);
          console.log("[] Mouse position at drop:", e.clientX, e.clientY);
          handleDrop(e);
        }
      : undefined
  }
                            onClick={(event) => {
                              if (
                                !event.target.closest(".dropdown-toggle") &&
                                !event.target.closest(".checkbox-input") &&
                                !event.target.closest(".custom-dropdown-menu")
                              ) {
                                if (trySelectInsteadOfOpen(file)) return;

                                setErrorMessage2("");

                                const codeExtensions = [
                                  "js",
                                  "jsx",
                                  "ts",
                                  "tsx",
                                  "html",
                                  "css",
                                  "json",
                                  "xml",
                                  "py",
                                  "java",
                                  "c",
                                  "cpp",
                                  "rb",
                                  "php",
                                  "sh",
                                  "go",
                                  "cs",
                                ];
                                const fileTypeLower =
                                  file.fileType?.toLowerCase();

                                // CODE FILE DETECTION
                                if (codeExtensions.includes(fileTypeLower)) {
                                  previewCodeFile(file); // <-- handles API call + setCodeContent + open modal
                                  return;
                                }

                                if (
                                  [
                                    "mkv",
                                    "mp4",
                                    "mov",
                                    "mpeg",
                                    "webm",
                                    "MOV",
                                  ].includes(fileTypeLower)
                                ) {
                                  setModalFile(file.fileName);
                                  handleImageShow();
                                  const index = filedata.findIndex(
                                    (f) => f.fileName === file.fileName
                                  );
                                  if (index !== -1)
                                    setCurrentImageIndex(index);
                                  setVideoSrc(file.fileName);
                                } else if (
                                  [
                                    "jpeg",
                                    "jpg",
                                    "png",
                                    "gif",
                                    "hevc",
                                    "heif",
                                    "svg",
                                    "webp",
                                    "JPEG",
                                    "JPG",
                                    "PNG",
                                    "GIF",
                                    "HEVC",
                                    "HEIF",
                                    "SVG",
                                    "WEBP",
                                  ].includes(file.fileType)
                                ) {
                                  setModalFile(file.fileName);
                                  handleImageShow();
                                  const index = filedata.findIndex(
                                    (f) => f.fileName === file.fileName
                                  );
                                  if (index !== -1)
                                    setCurrentImageIndex(index);
                                  getImageInfo(file.fileName);
                                 
                                } else if (
                                  [
                                    "mp3",
                                    "MP3",
                                    "m4a",
                                    "wav",
                                    "WAV",
                                    "ogg",
                                    "OGG",
                                    "aac",
                                    "AAC",
                                  ].includes(file.fileType)
                                ) {
                                  playAudioFile(allEntries, file.fileName);
                                }



                                else if (
                                  ["pdf", "PDF", "txt", "TXT"].includes(
                                    file.fileType
                                  )
                                ) {
                                  setModalFile(file.fileName);
                                  handleImageShow();
                                  const index = filedata.findIndex(
                                    (f) => f.fileName === file.fileName
                                  );
                                  if (index !== -1)
                                    setCurrentImageIndex(index);
                                  getPdfInfo(file.fileName);
                                } else {
                                  if (file.isFolder === true) {
                                    chkFileorFolder(file, file.fileSize);
                                  } else {
                                    handleImageShow();
                                    setErrorMessage2(
                                      "File format not supported!"
                                    );
                                    const index = filedata.findIndex(
                                      (f) => f.fileName === file.fileName
                                    );
                                    if (index !== -1)
                                      setCurrentImageIndex(index);
                                  }
                                }
                              }
                            }}
                          >
                            <input
                              id="check-Atharva"
                              type="checkbox"
                              style={{
                                position: "absolute", top: "8px", left: "8px"
                              }}
                              className="checkbox-input"
                              onClick={(event) => event.stopPropagation()} // Stops click from bubbling to parent
                              onChange={() => handleCheckboxChange(file)}
                              disabled={file.fileName === "blackbox" || file.isShared}
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
                                  // style={{margin:"7px"}}
                                >
                                  <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    // stroke-width="2"
                                    strokeLinecap="round"
                                    // stroke-linejoin="round"
                                    strokeLinejoin="round"
                                    className="feather feather-more-vertical"
                                  >
                                    <circle cx="12" cy="12" r="1"></circle>
                                    <circle cx="12" cy="5" r="1"></circle>
                                    <circle cx="12" cy="19" r="1"></circle>
                                  </svg>
                                </button>
                                <div
                                  className="dropdown-menu custom-dropdown-menu"
                                  // style={{
                                  //   transform:
                                  //     "translate3d(-242px, -25px, 0px)",
                                  // }}
                                // aria-labelledby="dropdownMenuButton"
                                >
                                 
                                  <a className="file-container">
                                    <div className="file-icon">
                                      <img
                                        src={getFileIcon(file)}
                                        onError={(e) => {
                                          e.target.onerror = null;
                                          e.target.src = file.isFolder
                                            ? "/images/icons/Folder.svg"
                                            : "/images/icons/doc.svg";
                                        }}
                                        height={32}
                                        alt="file icon"
                                      />
                                    </div>
                                    <div className="file-details">
                                      <div
                                        className="file-name"
                                        style={{
                                          whiteSpace: 'nowrap',           // prevents wrapping to new line
                                          overflow: 'hidden',             // hides overflowing text
                                          textOverflow: 'ellipsis',       // adds ... at the end
                                          maxWidth: '220px',              // ← adjust this value based on your menu width
                                          display: 'block',               // or 'inline-block' — test what fits best
                                        }}
                                        title={file.fileName}             // full name shown on hover/tooltip
                                      >
                                        {file.fileName}
                                      </div>
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

                                   {!isSharedValue && file.isFolder === false && (
                                        isFileFavorited(file.fileName) ? (
                                          <a
                                            className="dropdown-item dropdown-item-custom"
                                            href="#"
                                            style={{display: "flex",
            justifyContent: "space-between",}}
                                            onClick={() => {
                                               if (!isPremium) {
                                                setShowUpgradeModal(true);   // or showUpgradeToast()
                                                return;
                                              }
                                              handleRemoveFromFavorites(file)}
                                            }
                                          >
                                            <span style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                            <StarIcon
                                              style={{
                                                fontSize: "20px",
                                                color: "#FFAB49",
                                                // marginRight: "8px"
                                              }}
                                            />
                                            Remove from Favorites
                                            </span>



                                             {!isPremium && <span className="context-menu-icon">
                                          <img src={svgCrown} alt="" style={{ height: "20px" }}  />
                                          </span>}
                                          </a>
                                        ) : (
                                          <a
                                            className="dropdown-item dropdown-item-custom"
                                            href="#"
                                            style={{display: "flex",
            justifyContent: "space-between",}}
                                            onClick={() => {
                                               if (!isPremium) {
                                                setShowUpgradeModal(true);   // or showUpgradeToast()
                                                return;
                                              }
                                              handleAddToFavorites(file)}}
                                          >
                                            <span style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                            <StarBorderIcon
                                              style={{
                                                fontSize: "20px",
                                                color: "#494949",
                                                // marginRight: "8px"
                                              }}
                                            />
                                            Add to Favorites
                                            </span>


                                              {!isPremium && <span className="context-menu-icon">
                                          <img src={svgCrown} alt="" style={{ height: "20px" }}  />
                                          </span>}
                                          </a>
                                        )
                                      )}
                                  {/* {file.isFolder === false && (
                                    isFileFavorited(file.fileName) ? (
                                      <a
                                        className="dropdown-item dropdown-item-custom"
                                        href="#"
                                        onClick={() => handleRemoveFromFavorites(file)}
                                      >
                                        <StarIcon
                                          style={{
                                            fontSize: "20px",
                                            color: "#FFAB49",
                                            marginRight: "8px"
                                          }}
                                        />
                                        Remove from Favorites
                                      </a>
                                    ) : (
                                      <a
                                        className="dropdown-item dropdown-item-custom"
                                        href="#"
                                        onClick={() => handleAddToFavorites(file)}
                                      >
                                        <StarBorderIcon
                                          style={{
                                            fontSize: "20px",
                                            color: "#494949",
                                            marginRight: "8px"
                                          }}
                                        />
                                        Add to Favorites
                                      </a>
                                    )
                                  )} */}

                                  {/* {file.isFolder === false && (
                                    <a
                                      className="dropdown-item dropdown-item-custom"
                                      href="#"
                                      onClick={() => shareFile(file)}
                                    >
                                      <img
                                        src={shareIcon}
                                        alt="Share"
                                        className="dropdown-icon-list"
                                      />
                                      Share
                                    </a>
                                  )} */}
                                  {file.isFolder === false && (
  <a
    className="dropdown-item dropdown-item-custom"
    href="#"
    onClick={() => {
      if (file.ACL === "private") {
        setFileToShare(file);
        setShowPrivateWarning(true);
        return;
      }

      if (!isPremium) {
        setShowUpgradeModal(true);
        return;
      }

      shareFile(file);
      console.log("file name is: ", file);
    }}
    style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
  >
    <span style={{ display: "flex", gap: "10px", alignItems: "center" }}>
      <img
        src={shareIcon}
        alt="Share"
        className="dropdown-icon-list"
      />
      Share
    </span>

    {file.ACL === "private" ? (
      // <span style={{ fontSize: "0.9em", color: "#d9534f" }}>Private</span>
      <FaLock color="#656566" />
    ) : !isPremium ? (
      <span className="context-menu-icon">
        <img src={svgCrown} alt="Premium" style={{ height: "20px" }} />
      </span>
    ) : null}
  </a>
)}


                                        {file.fileName.includes(".zip") ? (
                                        <a
                                          className={`dropdown-item dropdown-item-custom ${file?.isShared
                                              ? "disabled blur-effect"
                                              : ""
                                            }`}
                                          href="#"
                                          onClick={() =>
                                           { 
                                             if (!isPremium) {
                                        setShowUpgradeModal(true);   // or showUpgradeToast()
                                        return;
                                      }
                                      !file?.isShared && UnzipFile(file)}
                                          }
                                          style={
                                            file?.isShared  || file?.fileName === "blackbox"
                                              ? {
                                                pointerEvents: "none",
                                                opacity: 0.5,
                                              }
                                              : {display: "flex",
            justifyContent: "space-between",}
                                          }
                                        >
                                          <span style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                          <img
                                            src={UnZipIcon}
                                            alt="Unzip"
                                            className="dropdown-icon-list"
                                          />
                                          Unzip
                                          </span>

                                           {!isPremium && <span className="context-menu-icon">
            <img src={svgCrown} alt="" style={{ height: "20px" }}  />
            </span>}


                                        </a>
                                      ) : (
                                        <a
                                          className={`dropdown-item dropdown-item-custom ${file?.isShared
                                              ? "disabled blur-effect"
                                              : ""
                                            }`}
                                          href="#"
                                          onClick={() =>
                                           { 
                                            if (!isPremium) {
                                            setShowUpgradeModal(true);   // or showUpgradeToast()
                                            return;
                                          }
        
                                          !file?.isShared && ZipFile(file)}
                                          }
                                          style={
                                            file?.isShared || file?.fileName === "blackbox"
                                              ? {
                                                pointerEvents: "none",
                                                opacity: 0.5,
                                              }
                                              : {display: "flex",
            justifyContent: "space-between",}
                                          }
                                        >
                                          <span style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                          <img
                                            src={ZipIcon}
                                            alt="Zip"
                                            className="dropdown-icon-list"
                                          />
                                          Zip
                                          </span>


                                          {!isPremium && <span className="context-menu-icon">
            <img src={svgCrown} alt="" style={{ height: "20px" }}  />
            </span>}
                                        </a>
                                      )}

                                  {file.isFolder === false && (
                                    <a
                                      className="dropdown-item dropdown-item-custom"
                                      href="#"
                                      onClick={() => {
                                        setIsVisibility(true);
                                        setVisiKey(file.fileName);
                                        setPubPri(file.ACL);
                                      }}
                                    >
                                      <img
                                        src={eyeIcon}
                                        alt="Share"
                                        className="dropdown-icon-list"
                                      />
                                      Change Visibility
                                    </a>
                                  )}

                                   

                                  {/* {file.fileName.includes(".zip") ? (
                                    <a
                                      className={`dropdown-item dropdown-item-custom ${file?.isShared
                                          ? "disabled blur-effect"
                                          : ""
                                        }`}
                                      href="#"
                                      onClick={() =>
                                        !file?.isShared && UnzipFile(file)
                                      }
                                      style={
                                        file?.isShared
                                          ? {
                                            pointerEvents: "none",
                                            opacity: 0.5,
                                          }
                                          : {}
                                      }
                                    >
                                      <img
                                        src={UnZipIcon}
                                        alt="Unzip"
                                        className="dropdown-icon-list"
                                      />
                                      Unzip
                                    </a>
                                  ) : (
                                    <a
                                      className={`dropdown-item dropdown-item-custom ${file?.isShared
                                          ? "disabled blur-effect"
                                          : ""
                                        }`}
                                      href="#"
                                      onClick={() =>
                                        !file?.isShared && ZipFile(file)
                                      }
                                      style={
                                        file?.isShared
                                          ? {
                                            pointerEvents: "none",
                                            opacity: 0.5,
                                          }
                                          : {}
                                      }
                                    >
                                      <img
                                        src={ZipIcon}
                                        alt="Zip"
                                        className="dropdown-icon-list"
                                      />
                                      Zip
                                    </a>
                                  )} */}

                                  {/* {file.isFolder === false && ( */}
                                  <a
                                    className={`dropdown-item dropdown-item-custom ${file?.isShared || file?.fileName === "blackbox"
                                        ? "disabled blur-effect"
                                        : ""
                                      }`}
                                    href="#"
                                    onClick={() =>
                                      !file?.isShared && downloadFile(file)
                                    }
                                    style={
                                      file?.isShared || file?.fileName === "blackbox"
                                        ? {
                                          pointerEvents: "none",
                                          opacity: 0.5,
                                        }
                                        : {}
                                    }
                                  >
                                    <img
                                      src={downloadIcon}
                                      alt="Download"
                                      className="dropdown-icon-list"
                                    />
                                    Download
                                  </a>
                                  {/* )} */}
                                  <a
                                    className={`dropdown-item dropdown-item-custom ${file?.isShared
                                        ? "disabled blur-effect"
                                        : ""
                                      }`}
                                    href="#"
                                    onClick={() =>
                                      !file?.isShared &&
                                      handleOpenPopover(file)
                                    }
                                    style={
                                      file?.isShared || file?.fileName === "blackbox"
                                        ? {
                                          pointerEvents: "none",
                                          opacity: 0.5,
                                        }
                                        : {}
                                    }
                                  >
                                    <img
                                      src={renameIcon}
                                      alt="Rename"
                                      className="dropdown-icon-list"
                                    />
                                    Rename
                                  </a>
                                
                                  <a
                                    className="dropdown-item dropdown-item-custom"
                                    href="#"
                                    onClick={() => {
                                      if (file.isFolder) {
                                        handleMFClick(file.fileName);
                                      } else {
                                        handleMClick(file.fileName);
                                      }
                                    }}
                                    style={
                                      file?.isShared || file?.fileName === "blackbox"
                                        ? {
                                          pointerEvents: "none",
                                          opacity: 0.5,
                                        }
                                        : {}
                                    }
                                  >
                                    <img
                                      src={moveIcon2}
                                      alt="Move"
                                      className="dropdown-icon-list"
                                    />
                                    Move to
                                  </a>
                                  {file.isFolder === false && (
                                    <a
                                      className="dropdown-item dropdown-item-custom"
                                      href="#"
                                      onClick={() =>
                                        handleCClick(file.fileName, file.fileSize)
                                      }
                                    >
                                      <img
                                        src={copyIcon}
                                        alt="Copy"
                                        className="dropdown-icon-list"
                                      />
                                      Copy to
                                    </a>
                                  )}
                                 

                                  {/* <a
                                    className="dropdown-item dropdown-item-custom"
                                    href="#"
                                    onClick={() =>
                                      handleOpenDeletePopover(file)
                                    }
                                    style={
                                      file?.isShared
                                        ? {
                                          pointerEvents: "none",
                                          opacity: 0.5,
                                        }
                                        : {}
                                    }
                                  > */}

                                   {file.isFolder === false && (
                                      <a
                                        className="dropdown-item dropdown-item-custom"
                                        href="#"
                                        onClick={() => {
                                          setInfoShower(true);
                                          getFileInfo(file.fileName, file);
                                        }}
                                      >
                                        <img
                                          src={InfoIcon}
                                          alt="Copy"
                                          className="dropdown-icon-list"
                                        />
                                        Information
                                      </a>
                                    )}


                                    <a
                                    className="dropdown-item dropdown-item-custom"
                                    href="#"
                                    onClick={(e) => {
                                      if (file?.fileName === "blackbox") {
                                        e.preventDefault(); // hard block
                                        return;
                                      }
                                      handleOpenDeletePopover(file);
                                    }}
                                    style={
                                      file?.fileName === "blackbox"
                                        ? {
                                            pointerEvents: "none",
                                            opacity: 0.5,
                                          }
                                        : {}
                                    }
                                    >
                                    <img
                                      src={deleteIcon2}
                                      alt="Delete"
                                      className="dropdown-icon-list"
                                    />
                                    Delete
                                  </a>
                                </div>
                              </div>
                            </div>

                            {/* File Icon / public image preview (visible cards only) */}
                            <CardFilePreview
                              file={file}
                              sharedIconSrc={sharedIcon}
                              blackboxIconSrc={blackboxImg}
                              getIcon={getFileIcon}
                            />

                            <div style={{padding:"18px"}}>
                              {/* File Name */}
                              <div
                                className="file-name2"
                                style={{
                                  cursor: "pointer",
                                  whiteSpace: "nowrap", // Prevents wrapping
                                  overflow: "hidden", // Hides overflow
                                  textOverflow: "ellipsis", // Adds "..."
                                  maxWidth: "100%", // Ensures it doesn’t exceed its container
                                }}
                                title={file.fileName} // Tooltip to show full name
                              >
                                {file.fileName}
                              </div>

                              {/* Date & Items */}
                              <div
                                className="file-info2"
                                style={{ textAlign: "left" }}
                              >
                                <span className="file-date2">
                                  {file.uploadDateTime.substring(
                                    0,
                                    file.uploadDateTime.indexOf(",")
                                  )}
                                </span>
                                <span className="file-items2">
                                  • {file.fileSize}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                   </div>
                  </>
                )}
              </div>




              {isWhisperClicked && (
                <MoveFilePopup
                  moveKey={movedFile}
                  source={""}
                  onClose={handleMClose}
                  currentP={currentPage}
                  files={keys}
                  folders={keys2}
                  reloadAfterTast={handleMClose}
                  showToast={showToast}
                />
              )}

              {/* <ImageGridView filedata={filedata} /> */}



              {moveFol && (
                <MoveFolderPopup
                  moveKey={movedFol}
                  source={""}
                  onClose={handleMFClose}
                  currentP={currentPage}
                  onRenameSuccess={async () => {
                    setCurrentPage(1);
                    await refreshFileListWithSkeleton();
                  }}
                  showToast={showToast}
                />
              )}

              {showFolderModal && (
                <SelectFolderModal
                  onClose={() => setShowFolderModal(false)}
                  selectedFile={currentFileToZip}
                  onSelect={(selectedPath) => {
                    console.log("Folder selected:", selectedPath); // Debugging log
                    if (currentFileToZip) {
                      processZipFile(currentFileToZip, selectedPath || ""); // Default to ""
                    }
                    setShowFolderModal(false);
                  }}
                />
              )}

              {showFolderModalUnZip && (
                <SelectFolderModal
                  onClose={() => setShowFolderModalUnZip(false)}
                  selectedFile={currentFileToUnzip}
                  onSelect={(selectedPath) => {
                    console.log("Unzip destination selected:", selectedPath);
                    if (currentFileToUnzip) {
                      processUnzipFile(currentFileToUnzip, selectedPath || ""); // Ensure empty string for root
                    }
                    setShowFolderModalUnZip(false);
                  }}
                />
              )}

              {isCWhisperClicked && (
                <CopyFilePopup
                  moveKey={copiedFile}
                  source={""}
                  onClose={handleCClose}
                  files={keys}
                  fileSize={copiedFileSize}
                  setTriggerUpdate={setTriggerUpdate}
                  showToast={showToast}
                />
              )}
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

      {/*All files Shower - except audio */}
      <CustomFileModal
        show={showImage}
        onClose={handleImageClose}
        isFullscreen={isFullscreen}
        videoSrc={videoSrc}
        pdfSrc={pdfSrc}
        imageSrc={imageSrc}
        audioSrc={audioSrc}
        errorMessage2={errorMessage2}
        isProgressVisible={isProgressVisible}
        loaderGif={loaderGif}
        apiUrl={apiUrl}
        token={token}
        toggleFullscreen={toggleFullscreen}
        handlePrev={handlePrev}
        handleNext={handleNext}
        folderOptions={folderOptions}
        selectedFolder={selectedFolder}
        handleChange={handleChange}
        fullscreeen={fullscreeen}
        deleteFromModal={deleteFromModal}
        modalFile={modalFile}
        deleteIcon={deleteIcon}
        docSrc={docSrc}
        fileName={modalFile}
        isPublic={modalFile?.ACL == "public"}
        setModalFile={setModalFile}
        triggerUpdate={triggerUpdate}
        setTriggerUpdate={setTriggerUpdate}
        onRenameSuccess={() => getFileData(currentPage)}
        handleOpenCreateFolder={handleOpenCreateFolder}
        previewFile={previewFile}

      />


      {showImageGallery && (
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
          }}
          onClick={() => setShowImageGallery(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "960px",
              maxHeight: "90vh",
              background: "#ffffff",
              borderRadius: "16px",
              boxShadow: "0 12px 35px rgba(0,0,0,0.18)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "14px 20px",
                borderBottom: "1px solid #f1f3f5",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <h5 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "#333" }}>
                Image Gallery
              </h5>
              <button
                type="button"
                onClick={() => setShowImageGallery(false)}
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

            {/* Body – image grid will go here */}
            <div
              style={{
                padding: "14px 16px 18px",
                overflowY: "auto",
                flex: 1,
                backgroundColor: "#fafafa",
              }}
            >
              {/* Image grid component will be inserted here in the next step */}
              <div style={{ fontSize: "14px", color: "#777" }}>
                Image grid loading…
              </div>
            </div>
          </div>
        </div>
      )}




      <Modal
        open={openFileUploadModal}
        onClose={handleCloseFileUploadModal}
        className="pdf_modal_style file_upload_modal_style"
        style={{
          display: "flex",
          alignItems: "center",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <Modal.Body style={{ width: "100%" }}>
          <div className="">
            <Tabs>
              <TabList className="my-tab-list">
                <Tab>
                  <div className="my-tab-item">
                    <i className="mdi mdi-file-document-box-multiple-outline"></i>
                    <span>Files</span>
                  </div>
                </Tab>
                <Tab>
                  <div className="my-tab-item">
                    <i className="mdi mdi-folder-multiple-outline"></i>
                    <span>Upload Folder</span>
                  </div>
                </Tab>
                <Tab>
                  <div className="my-tab-item">
                    <i className="mdi mdi-folder-multiple-outline"></i>
                    <span>Folder</span>
                  </div>
                </Tab>
              </TabList>

              <TabPanel>
                <Dropzone onDrop={onDrop}>
                  {({ getRootProps, getInputProps }) => (
                    <section className="" style={{ paddingBottom: "0px" }}>
                      <div {...getRootProps({ className: "fileupload" })}>
                        <input {...getInputProps()} />

                        {/* Background Image with all icons */}
                        <img
                          src={BackgroundImageFileUpload}
                          alt="background-icons"
                          className="background-img"
                        />

                        {/* Center Upload Icon */}
                        <div className="upload-icon-container">
                          <img
                            src={UploadIcon}
                            alt="upload-icon"
                            className="upload-icon"
                          />
                        </div>
                      </div>

                      {/* Selected files — fixed height, lazy thumbs */}
                      <UploadFilesPreview files={files} onRemove={removeFile} />

                    </section>
                  )}
                </Dropzone>
                

                <div className="filesize-warning-div">
                  <span className="filesize-warning-span">
                    <div className="warning-icon">!</div>
                   

                    {/* {`Storage left: ${(remainingBytes / 1024 ** 3).toFixed(2)} GB`} */}
                    {`Storage left: ${(remainingBytes / 1_000_000_000).toFixed(2)} GB`}

                  </span>
                  <p className="visibility-label">Set Visibility:</p>
                </div>



                <ul className="radio_checkbox_list mt-0">
                  <li>
                    <input
                      type="radio"
                      name="FileUpload"
                      id="FilePublic"
                      value="public"
                      // defaultChecked
                      checked={pubpri === "public"}
                      onChange={handlePubChange}
                      />
                    <label htmlFor="FilePublic">Public</label>
                  </li>
                  <li>
                    <input
                      type="radio"
                      name="FileUpload"
                      id="FilePrivate"
                      value="private"
                      checked={pubpri === "private"}
                      onChange={handlePubChange}
                      
                    />
                    <label htmlFor="FilePrivate">Private</label>
                  </li>
                </ul>

             
                <div className="btn_group mt-4">
                  <button
                    onClick={handleCloseFileUploadModal}
                    className=" btn_width_same btn_grey_ripple ripple_effect btn-cancel"
                  >
                    Close
                  </button>

                  {files.length > 0 && (
                    <button
                      // onClick={() => setShowConversionModal(true)}
                      onClick={() => {
                         if (!isPremium) {
                          setShowUpgradeModal(true);
                          return;
                        }
                        console.log('Files array:', files);  // Debug
                        setShowConversionModal(true);
                      }}
                      style={{
                        padding: '14px 28px',
                        // background: '#FFE3CA',
                        background: '#ffffffff',
                        color: '#333',
                        border: '2px solid #FFD5A9',
                        borderRadius: '58px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        // fontSize: '0.95em',
                        fontSize: '14px',
                        transition: 'all 0.2s',
                        boxShadow: '0 2px 6px rgba(255, 171, 73, 0.15)',
                        letterSpacing: '0.3px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = '#FFE3CA';
                        e.target.style.color = 'black';
                        e.target.style.borderColor = '#FFAB49';
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 4px 12px rgba(255, 171, 73, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = '#ffffffff';
                        e.target.style.color = '#333';
                        e.target.style.borderColor = '#FFD5A9';
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 2px 6px rgba(255, 171, 73, 0.15)';
                      }}
                      onMouseDown={(e) => {
                        e.target.style.transform = 'translateY(-1px) scale(0.98)';
                      }}
                      onMouseUp={(e) => {
                        e.target.style.transform = 'translateY(-2px) scale(1)';
                      }}
                    >
                      Convert Files
                       {!isPremium && <span className="context-menu-icon">
            <img src={svgCrown} alt="" style={{ height: "20px" }}  />
            </span>}
                    </button>

                  )}
                  <button
                    onClick={handleFileUpload}
                    className="btn_width_same ripple_effect btn-upload"
                  >
                    Submit
                  </button>
                </div>

              </TabPanel>

              {/* Folder */}

              <TabPanel>
                <UploadFolderPanel
                  key={openFileUploadModal ? "folder-open" : "folder-closed"}
                  remainingBytes={remainingBytes}
                  onCancel={handleCloseFileUploadModal}
                  onUpload={uploadFolder}
                />
              </TabPanel>

              {/* Create Folder */}
              <TabPanel style={{ display: "flex", justifyContent: "center" }}>
                <div
                  className="create-folder-card"
                  style={{ boxShadow: "none" }}
                >
                  <div
                    className="folder-icon"
                    style={{ display: "flex", justifyContent: "center" }}
                  >
                    <img
                      src={createFolderPopup}
                      alt="Create Folder"
                      height={48}
                    />
                  </div>
                  <h5 className="folder-title">Create Folder</h5>

                  <form
                    className="folder-form"
                    onSubmit={createJustFolder}
                  >
                    <input
                      className="folder-input"
                      type="text"
                      name="fname"
                      id="folname-modal"
                      value={newFolderName}
                      onChange={(e) => {
                        setNewFolderName(e.target.value);
                        if (folderFieldError) setFolderFieldError("");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          e.stopPropagation();
                          createJustFolder(e);
                        }
                      }}
                      required
                      placeholder="Enter Folder Name"
                      autoFocus
                    />
                    {folderFieldError && (
                      <p className="error-message">{folderFieldError}</p>
                    )}

                    <div className="rename_buttons mt-4">
                      <button
                        type="button"
                        className="btn_width_same btn_grey_ripple ripple_effect rename_btn cancel"
                        onClick={handleCloseFileUploadModal}
                      >
                        Close
                      </button>

                      <button
                        type="submit"
                        className="btn_width_same ripple_effect rename_btn ok"
                      >
                        Create
                      </button>
                    </div>
                  </form>
                </div>
              </TabPanel>
            </Tabs>
          </div>
        </Modal.Body>
      </Modal>

      {createFolderButton && (
        <div
          className="popup-overlay"
          onClick={handleCloseCreateFolder}
          role="presentation"
        >
          <div
            className="create-folder-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Create Folder"
          >
            <div
              className="folder-icon"
              style={{ display: "flex", justifyContent: "center" }}
            >
              <img src={createFolderPopup} alt="Create Folder" height={48} />
            </div>
            <h5 className="folder-title">Create Folder</h5>

            <form
              className="folder-form"
              onSubmit={(e) => {
                e.preventDefault();
                createJustFolder(e);
              }}
            >
              <input
                className="folder-input"
                type="text"
                name="fname"
                id="folname-popup"
                value={newFolderName}
                onChange={(e) => {
                  setNewFolderName(e.target.value);
                  if (folderFieldError) setFolderFieldError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    e.stopPropagation();
                    createJustFolder(e);
                  }
                }}
                required
                placeholder="Enter Folder Name"
                autoFocus
              />
              {folderFieldError && (
                <p className="error-message">{folderFieldError}</p>
              )}

              <div className="rename_buttons mt-3">
                <button
                  type="button"
                  className="rename_btn cancel"
                  onClick={handleCloseCreateFolder}
                >
                  Close
                </button>
                <button type="submit" className="rename_btn ok">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
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
            navigate("/Payment");
          }}
        >
          Go to Upgrade
        </button>
      </div>
    </div>
  </div>
)}

{showPrivateWarning && fileToShare && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(0, 0, 0, 0.55)",      // slightly darker overlay for contrast
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1500,
    }}
    onClick={() => setShowPrivateWarning(false)}
  >
    <div
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "12px",
        width: "90%",
        maxWidth: "420px",
        padding: "28px 24px",                      // a bit more comfortable padding
        boxShadow: "0 12px 32px rgba(0,0,0,0.22)",
        border: "1px solid #f3f4f6",               // subtle border for polish
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <h3
        style={{
          margin: "0 0 20px 0",
          fontSize: "1.5rem",
          fontWeight: 600,
          textAlign: "center",
          color: "#1f2937",                        // dark gray / near-black
        }}
      >
        Private File
      </h3>

      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <div style={{ fontSize: "3.5rem", marginBottom: "12px" }}>🔒</div>
      </div>

      <p
        style={{
          textAlign: "center",
          margin: "0 0 12px 0",
          fontSize: "1.1rem",
          fontWeight: 500,
          color: "#1f2937",
        }}
      >
        This file is <strong>private</strong> and cannot be shared.
      </p>

      <p
        style={{
          textAlign: "center",
          color: "#4b5563",                        // cooler gray
          margin: "0 0 24px 0",
          fontSize: "1rem",
          lineHeight: 1.5,
        }}
      >
        To generate a shareable link, please change its visibility to <strong>public</strong>.
      </p>

      <p
        style={{
          textAlign: "center",
          fontSize: "0.95rem",
          color: "#6b7280",
          marginBottom: "28px",
          wordBreak: "break-all",
        }}
      >
        File: <strong>{fileToShare.fileName}</strong>
      </p>

      <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
        <button
          onClick={() => setShowPrivateWarning(false)}
          style={{
            padding: "12px 28px",
            border: "1px solid #d1d5db",
            borderRadius: "8px",
            backgroundColor: "white",
            color: "#374151",
            cursor: "pointer",
            fontSize: "1rem",
            fontWeight: 500,
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#f3f4f6";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "white";
          }}
        >
          Cancel
        </button>

        <button
          onClick={() => {
            setShowPrivateWarning(false);
            setIsVisibility(true);
            setVisiKey(fileToShare.fileName);
            setPubPri(fileToShare.ACL);
          }}
          style={{
            padding: "12px 28px",
            border: "none",
            borderRadius: "8px",
            backgroundColor: "#FFAB49",              // vivid orange (Tailwind amber-500)
            color: "white",
            cursor: "pointer",
            fontSize: "1rem",
            fontWeight: 600,
            boxShadow: "0 2px 8px rgba(249, 115, 22, 0.3)",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#fd9c2e"; // darker orange on hover
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(234, 88, 12, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#FFAB49";
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(249, 115, 22, 0.3)";
          }}
        >
          Change Visibility
        </button>
      </div>
    </div>
  </div>
)}



      {/* <Loader/> */}

      <DownloadModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        onDownload={handleDownload}
        openPathSelectionModal={openPathSelectionModal}
        reloadAfterTast={getFileData}
      />


      <FileConversionModal
        isOpen={showConversionModal}
        onClose={() => setShowConversionModal(false)}
        files={files}
        onFilesUpdated={handleFilesConverted}
      />

      {loader2 && (<Loader2/>)}

      <UploadConflictModal
        isOpen={Boolean(uploadConflictNames?.length)}
        conflictingNames={uploadConflictNames || []}
        onChoice={(choice) => {
          setUploadConflictNames(null);
          const resolve = uploadConflictResolverRef.current;
          uploadConflictResolverRef.current = null;
          resolve?.(choice);
        }}
      />
      
      {loader_Recycle && (<LoaderRecycleBin />)}

      {/* Need to discuss filedata.url */}
      {/* <ImageGridView
        // filedata={filedata}
        filedata={allEntries}
        apiUrl={apiUrl}
        token={token}
        isSharedValue={isSharedValue}
        filenameRedux={filenameRedux}
      /> */}

      

      




    </>
  );
};

export default Files;
