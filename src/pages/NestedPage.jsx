import React, {
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  startTransition,
} from "react";
import { LONG_RUNNING_AWS_REQUEST_OPTIONS } from "../utils/longRunningAwsRequest";
import {
  postZipOrUnzip,
  getZipUnzipErrorMessage,
  getZipSuccessMessage,
} from "../utils/zipUnzipRequest";
import { uploadFolderViaMultipart } from "../utils/uploadFolderViaMultipart";
import { DownloadContext } from "./DownloadContext";
import { resolveFileIconPath, normalizeFolderFilesForPreview } from "../utils/fileIcon";
import { endUserSession } from "../utils/endUserSession";
import { buildGetFolderParams } from "../utils/getFolderParams";
import {
  isSameMoveDestination,
  normalizeMovePath,
  resolveNestedDropTargetPath,
} from "../utils/movePath";
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
import "../css/FilesToolbar.css";
import "../css/NestedBreadcrumb.css";
import CardFilePreview from "../components/CardFilePreview";
import UploadFolderPanel from "../components/UploadFolderPanel";
import FilesPaginationFooter from "../components/FilesPaginationFooter";
import { useStickyListHeader } from "../hooks/useStickyListHeader";
import {
  getBulkRowActionToggleProps,
  closeAllRowDropdowns,
} from "../utils/bulkSelectionRowActions";
import BulkSelectionToolbar from "../components/BulkSelectionToolbar";
import RenameModal from "../components/RenameModal";
import { useSessionEndCleanup } from "../hooks/useSessionEndCleanup";
import useListPageSize from "../hooks/useListPageSize";
import useFileSearch from "../hooks/useFileSearch";
import UploadFilesPreview from "../components/UploadFilesPreview";
import UploadConflictModal from "../components/UploadConflictModal";
import {
  applyUploadConflictResolution,
  findUploadNameConflicts,
  UPLOAD_CONFLICT_CANCEL,
} from "../utils/uploadConflictUtils";
import FileSearchBar from "../components/FileSearchBar";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import SortHome from "../images/SortHome.svg";
import FilterHome from "../images/filterHome.svg";
import Logo from "../images/logo.png";
import fullscreeen from "../images/fullscreen.png";
import zoomin from "../images/zoomin.png";
import svgCrown from "../images/crown.svg"
import zoomout from "../images/zoomout.png";
import moveIcon from "../images/move.png";
import deleteIcon from "../images/trash.png";
import DeletePopup from "../images/deletePopup.svg";
import deleteIcon3 from "../images/mediaPlayer/trash1.svg";
import IconJPG from "../images/icon-jpg.svg";
import IconPNG from "../images/icon-png.svg";
import IconPSD from "../images/icon-psd.svg";
import IconPDF from "../images/pdf.svg";
import IconFolder from "../images/folder.png";
import IconJfif from "../images/jfif.png";
import IconMsi from "../images/msi.png";
import IconZip from "../images/zip.png";
import IconJpeg from "../images/jpeg.png";
import IconHome from "../images/Grid.svg";
import IconList from "../images/list.svg";
import IconHomeW from "../images/GridWhite.svg";
import IconListW from "../images/listWhite.svg";
import copyIcon from "../images/DropdownIcons/copyIcon.svg";
import deleteIcon2 from "../images/DropdownIcons/deleteIcon.svg";
import downloadIcon from "../images/DropdownIcons/downloadIcon.svg";
import ZipIcon from "../images/DropdownIcons/Zip.svg";
import UnZipIcon from "../images/DropdownIcons/Unzip.svg";
import InfoIcon from "../images/DropdownIcons/InfoIcon.svg";
import favouritesIcon from "../images/DropdownIcons/favouritesIcon.svg";
import linkIcon from "../images/DropdownIcons/linkIcon.svg";
import moveIcon2 from "../images/DropdownIcons/MoveIcon.svg";
import renameIcon from "../images/DropdownIcons/renameIcon.svg";
import shareIcon from "../images/DropdownIcons/shareIcon.svg";
import eyeIcon from "../images/DropdownIcons/eyeIcon.svg";
import BackgroundImageFileUpload from "../images/Background.svg";
import UploadIcon from "../images/UploadIcon.svg";
// import IconUpload from "../images/iconUpload.svg";
import SortIcon from "../images/sort-style-1.svg";
import createFolderPopup from "../images/createFolderPopup.svg";
import IconVideo from "../images/video.svg";
import { Link } from "react-router-dom";
import loaderGif from "../images/Loaders/Animation4.gif";
import FileConversionModal from '../components/FileConversionModal';
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import svgDoc from "../images/TypesDoc.svg"
import svgFolder from "../images/TypesFolder.svg"
import { FaDownload } from "react-icons/fa";
import svgJpg from "../images/TypesJpg.svg"
import svgMp3 from "../images/TypesMp3.svg"
import svgMp4 from "../images/TypesMp4.svg"
import svgPng from "../images/TypesPng.svg"
import svgTxt from "../images/TypesTxt.svg"
import svgZip from "../images/TypesZip.svg"
import warningIcon from "../images/warningIcon.svg"
// import DocViewer, { DocViewerRenderers } from '@cyntler/react-doc-viewer';

import { FaCheckCircle } from "react-icons/fa"; //<FaCheckCircle />
import { BsXCircleFill } from "react-icons/bs"; // <BsXCircleFill />
import { IoIosInformationCircle } from "react-icons/io"; // <IoIosInformationCircle />
import { FaExclamationTriangle } from "react-icons/fa"; // <FaExclamationTriangle />

import { FaLock } from "react-icons/fa";


import { fetchUserFolderSize } from "../store/subscriptionSlice";
import {
  addFavoriteName,
  removeFavoriteName,
} from "../store/favoritesSlice";


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
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import Dropzone from "react-dropzone";
import "rsuite/Tooltip/styles/index.css";
import "rsuite/SelectPicker/styles/index.css";
import "rsuite/dist/rsuite.min.css";
import SideNav from "../components/SideNav";
import ToggleNav from "../components/ToggleNav";
import IconUpload from "../images/iconUpload.svg";
import CreateFolder from "../images/CreateFolderNavbar.svg";
import DownloafFromUrl from "../images/Download_Link_Icon_1 1.svg";
import { ChakraProvider, Stack, useToast } from "@chakra-ui/react";
import { UploadContext } from "./UploadContext";
import { Modal as BootstrapModal } from "react-bootstrap";
//LIGHTBOX
import MoveFilePopup from "./MoveFilePopup";
import MoveFolderPopup from "./MoveFolderPopup";
import CopyFilePopup from "./CopyFilePopup";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";
import axios from "axios";
import { useLocation, useNavigate, useNavigationType, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import AvatarDefault from "../images/AvatarDefault.jpg";

//Anurag Imports
import {
  addToken,
  incrementCounter,
  removeLastToken,
  decrementCounter,
  setFolderPath,
  restoreNestedNavigation,
  addFolder,
  incrementFCounter,
  replacelasttoken,
  breadCrum,
  resetFolderList,
  setLoader,
} from "../store/fileSlicer";
import {
  saveNestedNav,
  loadNestedNav,
  clearNestedNav,
} from "../utils/nestedNavPersistence";
import { usePlayAudio } from "../hooks/usePlayAudio";
import DownloadModal from "./DownloadModal/DownloadModal";
import SelectFolderModal from "./DownloadModal/SelectFolderModal";
import CustomFileModal from "./CustomFileModal";
import Loader2 from "../components/Loader2";
import LoaderRecycleBin from "../components/LoaderRecycleBin";
import { use } from "react";

export const ListIcon = ({ className, onClick, alt, active }) => {
  // Use white color when active, gray when inactive
  const color = active ? "#FFFFFF" : "#5D6B7A";

  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      onClick={onClick}
      alt={alt}
    >
      <circle cx="4" cy="6" r="2" fill={color} />
      <rect x="8" y="5" width="12" height="2" rx="1" fill={color} />
      <circle cx="4" cy="12" r="2" fill={color} />
      <rect x="8" y="11" width="12" height="2" rx="1" fill={color} />
      <circle cx="4" cy="18" r="2" fill={color} />
      <rect x="8" y="17" width="12" height="2" rx="1" fill={color} />
    </svg>
  );
};

// Grid Icon Component
export const GridIcon = ({ className, onClick, alt, active }) => {
  // Use white color when active, gray when inactive
  const color = active ? "#FFFFFF" : "#5D6B7A";

  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      onClick={onClick}
      alt={alt}
    >
      <rect
        x="3"
        y="3"
        width="7"
        height="7"
        rx="1"
        stroke={color}
        strokeWidth="2"
        fill="none"
      />
      <rect
        x="14"
        y="3"
        width="7"
        height="7"
        rx="1"
        stroke={color}
        strokeWidth="2"
        fill="none"
      />
      <rect
        x="3"
        y="14"
        width="7"
        height="7"
        rx="1"
        stroke={color}
        strokeWidth="2"
        fill="none"
      />
      <rect
        x="14"
        y="14"
        width="7"
        height="7"
        rx="1"
        stroke={color}
        strokeWidth="2"
        fill="none"
      />
    </svg>
  );
};

const NestedPage = () => {
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [triggerUpdate, setTriggerUpdate] = useState(0);
  const [breadCrumClickTrigger, setBreadCrumClickTrigger] = useState(0);
  const loader = useSelector((state) => state.getdata.loading);
  const userProfile = useSelector((state) => state.userProfile);
  const [loader_Recycle, setLoader_Recycle] = useState(false);
  const [loader2, setLoader2] = useState(false);
  const userData = JSON.parse(sessionStorage.getItem("userData"));
  const name = userProfile.name || sessionStorage.getItem("name");
  const avatarUrl = userProfile.avatar || sessionStorage.getItem("avatar");
  




  const handleDownload = async (downloadInfo) => {
  };
  const openPathSelectionModal = () => {
    setMoveFol(true);
  };

  const closePathSelectionModal = (selectedPath) => {
    setMoveFol(false);
    // Testing Fahad
    // if (selectedPath) {
      // setDownloadPath(selectedPath);
    // }
  };

  // const { addUpload, updateUploadProgress, removeUpload } = useContext(UploadContext);
  const {
    uploads,
    addUpload,
    updateUploadProgress,
    updateUploadMeta,
    removeUpload,
    getUpload,
    isPausing,
    clearUploads,
    registerCancelRefresh,
  } = useContext(UploadContext);
  //Anurag Declaration
  const apiUrl = process.env.REACT_APP_API_ENDPOINT;
  const [selectedFilter, setSelectedFilter] = useState("Sort By");
  const token = sessionStorage.getItem("number");
  const [errorMessage2, setErrorMessage2] = useState("");
  const [paginatedData, setPaginatedData] = useState([]);
  // const [currentPage, setCurrentPage] = useState(1);
  const [startIndex, setStartIndex] = useState(0);
  const [endIndex, setEndIndex] = useState(10);
  const [totalPages, settotalPages] = useState(0);
  const [filedata, setFileData] = useState([]);
  const [filedata2, setFileData2] = useState([]);
  const dispatch = useDispatch();
  const { playAudioFile } = usePlayAudio();
  const [onlyfolderlist, setOnlyFolderList] = useState([]);
  const [rootsize, setRootSize] = useState("");
  const [currentFile, setCurrentFile] = useState({});
  const [isProgressVisible, setIsProgressVisible] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showFTPopup, setShowFTPopup] = useState(false);
  const fileTypeDropdownRef = useRef(null);
  const [imageSrc, setImageSrc] = useState("");
  const [docSrc, setDocSrc] = useState(""); 
  const [errorMessage, setErrorMessage] = useState("");
  const [videoSrc, setVideoSrc] = useState("");
  const [isVideo, setisVideo] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const counter = useSelector((state) => state.getdata.counter);
  const select = useSelector((state) => state.getdata.userdata);
  const isSharedValue = useSelector((state) => state.getdata.isSharedValue);
  const filenameRedux = useSelector((state) => state.getdata.fileName);

  /** Original zip stream folder download (fallback). */
  const downloadFolderViaZipProxy = useCallback(
    async ({ fileName, signal, onProgress }) => {
      const writable = await createDownloadWritable({ fileName, isFolder: true });
      if (!writable) {
        throw new Error(
          "Choose a save location to download folders (use Chrome/Edge)."
        );
      }
      const params = {
        filePath: fileName,
        ...(isSharedValue && filenameRedux ? { shared: filenameRedux } : {}),
      };
      const response = await fetch(
        `${apiUrl}download-folder?${new URLSearchParams(params)}`,
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
    [apiUrl, token, isSharedValue, filenameRedux]
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
          "[NestedPage] Presigned no-zip folder download failed, falling back to zip:",
          err?.message || err
        );
        await downloadFolderViaZipProxy({ fileName, signal, onProgress });
      }
    },
    [apiUrl, token, isSharedValue, filenameRedux, downloadFolderViaZipProxy]
  );

  /** Root shared-folder shortcuts only — not files/folders inside shared view */
  const isSharedFolderShortcut = (item) =>
    Boolean(item?.isShared && item?.isFolder && !isSharedValue);

  const [placeholderLoading, setPlaceholderLoading] = useState(true);


  const selectedItem = select.find((item) => item.id === counter);
  const nav = useNavigate();
  const navigate = useNavigate();
  const responseData = selectedItem?.Files;
  const isShared = selectedItem ? selectedItem.isShared : false;
  const [pdfSrc, setPdfSrc] = useState("");
  const [pubpri2, setPubPri2] = useState("private");
  const [pubpri3, setPubPri3] = useState("private");
  const newPath = useSelector((state) => state.getdata.folderName);
  const clearSearchBarRef = useRef(() => {});
  const clearSearchBar = useCallback(() => clearSearchBarRef.current(), []);
  const [folderList, setFolderList] = useState([]);
  const [nameOfFolder, setNameOfFolder] = useState("");
  const [isVisibility, setIsVisibility] = useState(false);
  const [visiKey, setVisiKey] = useState("");
  const [infoShower, setInfoShower] = useState(false);
  const [modalFile, setModalFile] = useState("");
  const [previewFile, setPreviewFile] = useState(null);
  const [folderFieldError, setFolderFieldError] = useState("");
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [dragPop, setDragPop] = useState(false);
  const [dragFile, setDragFile] = useState({});
  const [targetFolder, setTargetFolder] = useState("");
  const [copiedFileSize, setCopiedFileSize] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);


    // Add these states (probably already have some modal states)
  const [showPrivateWarning, setShowPrivateWarning] = useState(false);
  const [fileToShare, setFileToShare] = useState(null);


  // Add this:
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
    console.log("zxcvb isSharedValue",isSharedValue)
    console.log("zxcvb filenameRedux",filenameRedux)
  }, [isSharedValue, filenameRedux])
  




const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  // Current user's subscription + used storage (loaded once in App.js)
  const subscription = useSelector((state) => state.subscription.subscription);
  const folderSize = useSelector((state) => state.subscription.folderSize);
  const favoriteFiles = useSelector((state) => state.favorites.fileNames);

  const isPremium =
    !!subscription &&
    Array.isArray(subscription.entitlement_ids) &&
    subscription.entitlement_ids.length > 0;

  useEffect(() => {
    console.log("subscription",subscription)
  }, [subscription])
  useEffect(() => {
      console.log("folderSize",folderSize)
    }, [folderSize])





  // console.log("Get Is Shared value :", getIsShared)


  // File Conversion
const [showConversionModal, setShowConversionModal] = useState(false);
const [convertedFiles, setConvertedFiles] = useState([]);



  const handleFilesConverted = (updatedFiles) => {
    setFiles(updatedFiles);
    setConvertedFiles(updatedFiles);
    setShowConversionModal(false);
  };


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

    if (showImage) {
      lockScroll();
    } else {
      unlockScroll();
    }

    return () => unlockScroll(); // cleanup
  }, [showImage]);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useListPageSize();
  const [totalEntries, setTotalEntries] = useState(0);
  const [allData, setAllData] = useState([]);
  // const [fileData, setFileData] = useState([]);

  const totalPageCount = Math.ceil(totalEntries / itemsPerPage);
  const isNextPage = currentPage < totalPageCount;
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalEntries);
  const [view, setView] = useState(localStorage.getItem("view") || "list");

  const toggleView = (selectedView) => {
    setView(selectedView);
    localStorage.setItem("view", selectedView); // Save selection in localStorage
  };

  useEffect(() => {
    // Only used when user picks a folder from NestedPage's own dropdown (selectedFolder).
    // Landing from Files relies on reloadAfterTast() further below.
    if (!selectedFolder?.fileName) {
      return;
    }
    console.log("ttttt getFolderFiles is called at line 447 in useeffect");
    setPlaceholderLoading(true);
    getFolderFiles(selectedFolder);
  }, [selectedFolder, triggerUpdate]);
  
  
  // useEffect(() => {
  //   // Initial data load
  //   // getFolderFiles(selectedFolder);
  //   setPlaceholderLoading(true); // Start loading
  //   console.log("ttttt setPlaceholderLoading(true) is called at line 454");
  //   reloadAfterTast();
  //   // setTimeout(() => {
  //     setPlaceholderLoading(false); // Stop loading
  //     console.log("ttttt setPlaceholderLoading(false) is called at line 458");
  //   // }, 1500);
  //   console.log("yyyyy ✅pathhhhhhhh --> calling reload", path);
  // }, [ path]);


  // useEffect(() => {
  //   console.log("zxcvb Reloading now")
  //   // setTimeout(() => {
  //     reloadAfterTast();
  //   // }, 3000);
  // }, [ breadCrumClickTrigger]);


  const prevValueRef = useRef();

useEffect(() => {
  if (prevValueRef.current !== undefined && prevValueRef.current !== breadCrumClickTrigger) {
    console.log("zxcvb Reloading now");
    reloadAfterTast();
  }

  prevValueRef.current = breadCrumClickTrigger;
}, [breadCrumClickTrigger]);

  

  // Fetch all folder files


const getFolderFiles = async (foldername, size) => {
  if (!foldername?.fileName) {
    console.warn("getFolderFiles skipped: missing foldername.fileName");
    return;
  }

  setPlaceholderLoading(true);
  console.log("ttttt setPlaceholderLoading(true) is called at line 471");

  console.log("ppppp  foldername =", foldername);
  console.log("  size =", size);

  try {
    let cleanfoldername = foldername.fileName;
    console.log("  cleanfoldername =", cleanfoldername);
    console.log("  isSharedValue =", isSharedValue);
    console.log("  filenameRedux =", filenameRedux);

    const params = buildGetFolderParams({
      folderPath: cleanfoldername,
      isShared: Boolean(isSharedValue || foldername?.isShared),
      sharedRoot: filenameRedux || cleanfoldername,
    });

    console.log("zxcvb  API params =", params);

    const res = await axios.get(`${apiUrl}getFolder`, {
      params,
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log("  API response =", res.data);

    const folderFiles = normalizeFolderFilesForPreview(
      Array.isArray(res.data) ? res.data : res.data?.result || []
    );

    console.log("  updating state with data length =", folderFiles.length);
    setAllData(folderFiles);
    setTotalEntries(folderFiles.length);
    setCurrentPage(1);
    setFileData(folderFiles);

    console.log("  navigating to nested", counter + 1, "size =", size);
    nav(`/nested/${counter + 1}`, { state: { value: size } });

    dispatch(
      addToken({
        id: counter + 1,
        Files: folderFiles,
        isShared: Boolean(isSharedValue || foldername?.isShared),
      })
    );

    dispatch(incrementCounter());
  } catch (error) {
    console.error("  getFolderFiles ERROR =", error);

    if (error.response?.data?.error === "jwt expired") {
      console.log("  jwt expired – redirecting to login");
      alert("Session expired. Please login again.");
      setTimeout(() => {
        nav("/Login");
      }, 0);
    }

    if (error.response && error.response.status === 500) {
      console.log("  server 500 – unable to retrieve folder contents");
    }
  } finally {
    setTimeout(() => {
      setPlaceholderLoading(false);
      console.log("ttttt setPlaceholderLoading(false) is called at line 542");
    }, 300);
  }
};


  // Handle pagination — only change page; filedata stays full and is sliced in useEffect
  const goToFirstPage = () => setCurrentPage(1);

  const goToPrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const goToNextPage = () => {
    if (currentPage < totalPageCount) setCurrentPage(currentPage + 1);
  };

  // Helper function to get the appropriate icon (local /public/images/icons)
const getFileIcon = (file) =>
  resolveFileIconPath(file, {
    // shared folders: keep backend file.icon (unchanged)
  });




  const goToLastPage = () => {
    if (currentPage < totalPageCount) setCurrentPage(totalPageCount);
  };

  // Handle items per page change
  const handleItemsPerPageChange = (e) => {
    pageFilter(e.target.value);
  };

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
  const location = useLocation();
  const value = location.state?.value;

  const [downloadPopup, setDownloadpopup] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [loading, isSetLoading] = useState(false);
  const cancelToken = useRef(null);
  const [downloadLink, setDownloadLink] = useState(null);

  const [sharePopup, setSharepopup] = useState(false);

  const [keys, setKeys] = useState([]);
  const [keys2, setKeys2] = useState([]);
  const hasBulkSelection = keys.length > 0 || keys2.length > 0;
  const { filterBarRef, tableBoxRef, tableBoxClassName } = useStickyListHeader(view, hasBulkSelection);
  const [selectStatus, setSelectStatus] = useState(false);

  // console.log("responseData", responseData, isShared);
  // console.log("select", select);

  //Anurag Code
  const navigationType = useNavigationType();
  const location2 = useLocation();
  const previousLocationRef = useRef(location2);

  const [isWhisperClicked, setIsWhisperClicked] = useState(false);
  const [movedFile, setMovedFile] = useState("");

  const [isCWhisperClicked, setIsCWhisperClicked] = useState(false);
  const [copiedFile, setCopiedFile] = useState("");

  const [audioSrc, setAudioSrc] = useState("");
  const [isAudio, setIsAudio] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [moveFol, setMoveFol] = useState(false);
  const [movedFol, setMovedFol] = useState("");
  const fileTypes = ["pdf", "jpg", "jpeg", "png", "mov", "mp3", "mp4", "webp"];
  const [selectedFileTypes, setSelectedFileTypes] = useState([]);
  const [customExtInput, setCustomExtInput] = useState("");

  const handleMClick = (name) => {
    closeAllRowDropdowns();
    setIsWhisperClicked(true);
    setMovedFile(name);
  };

  const handleMClose = () => {
    setIsWhisperClicked(false);
    setKeys([]);
    setKeys2([]);
    dispatch(resetFolderList());
  };


// ────────────────────────────────────────────────
// Returns the full destination path (which targetFolder already is)
// ────────────────────────────────────────────────
const getFullTargetPath = () => {
  return targetFolder || '—'; // fallback if somehow empty
};

// Extracts only the last folder name for the headline
const getFolderNameOnly = (fullPath) => {
  if (!fullPath) return '—';
  const parts = fullPath.split('/').filter(Boolean);
  return parts[parts.length - 1] || fullPath;
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
    closeAllRowDropdowns();
    setMoveFol(true);
    setMovedFol([name]);
  };
  const handleMFClose = () => {
    setMoveFol(false);
    dispatch(resetFolderList());
    setKeys([]);
    setKeys2([]);
    setIsSelectAll(false);
  };

  // Copy File code
  const handleCClick = (name, size) => {
    closeAllRowDropdowns();
    setIsCWhisperClicked(true);
    setCopiedFile(name);
    setCopiedFileSize(size)
  };
  const handleCClose = () => {
    console.log("ggggg handleCClose is being called")
    // reloadAfterTast();
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
    // If the file is not a folder, update the keys list
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


  // Breadcrumb handlers are defined after `parts` (see below)

  const reduksData = useSelector((state) => state.getdata.userdata);
  // console.log("reduksData", reduksData);

  const [isSelectAll, setIsSelectAll] = useState(false);
  // Handle select/deselect all
  const handleSelectAllToggle = () => {
    if (!isSelectAll) {
      // Select all - preserve existing selections and add all other items
      const allFiles = paginatedData
        .filter((file) => !file.isFolder)
        .map((file) => file.fileName);
      const allFolders = paginatedData
        .filter((file) => file.isFolder)
        .map((file) => file.fileName);

      setKeys((prevKeys) => {
        const newKeys = [...new Set([...prevKeys, ...allFiles])];
        return newKeys;
      });

      setKeys2((prevKeys2) => {
        const newKeys2 = [...new Set([...prevKeys2, ...allFolders])];
        return newKeys2;
      });
    } else {
      // Deselect all
      setKeys([]);
      setKeys2([]);
      // console.log("arrays are", keys, keys2);
    }
    setIsSelectAll(!isSelectAll);
  };
  useEffect(() => {
    // console.log("Current arrays are:", keys, keys2);
  }, [keys, keys2]);


const handleMulDelete = async () => {
  if (filenameRedux === "blackbox") {
    showToast(
      "warning",
      "You cannot open or preview files inside the blackbox folder."
    );
    return;
  }

  setLoader_Recycle(true);
  dispatch(setLoader(true));
  const loaderStartedAt = Date.now();

  try {
    let params = {};
    if (isSharedValue) {
      params.shared = filenameRedux;
    }

    const filesToDelete = keys.length;
    const foldersToDelete = keys2.length;

    let fileDeleted = false;
    let folderDeleted = false;

    // Prepare file names by stripping any folder prefixes
    const fileNamesOnly = keys.map((key) => {
      const parts = key.split("/");
      return parts[parts.length - 1];
    });

    // Clean sourceFolder - remove trailing slash if any
    let cleanedSourceFolder = (path || "").replace(/\/$/, "");

    // For SHARED folder, mimic single-delete behavior by stripping shared root prefix
    if (isSharedValue && filenameRedux) {
      if (cleanedSourceFolder === filenameRedux) {
        cleanedSourceFolder = ""; // root inside shared
      } else if (cleanedSourceFolder.startsWith(`${filenameRedux}/`)) {
        cleanedSourceFolder = cleanedSourceFolder.replace(
          `${filenameRedux}/`,
          ""
        );
      }
    }

    // Soft delete files
    if (filesToDelete > 0) {
      const payload = {
        sourceFolder: cleanedSourceFolder,
        keys: fileNamesOnly,
      };

      await axios.delete(`${apiUrl}soft-delete`, { ...LONG_RUNNING_AWS_REQUEST_OPTIONS, 
        data: payload,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        params,
      });

      fileDeleted = true;
    }

    // Soft delete folders
    if (foldersToDelete > 0) {
      const sharedPathOptions = {
        isShared: isSharedValue,
        sharedRoot: filenameRedux,
      };
      const sourceFolders = keys2.map((folder) =>
        normalizeMovePath(folder, sharedPathOptions)
      );

      await axios.delete(`${apiUrl}soft-delete-folder`, { ...LONG_RUNNING_AWS_REQUEST_OPTIONS, 
        data: { sourceFolders },
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        ...(isSharedValue && {
          params: { shared: filenameRedux },
        }),
      });
      folderDeleted = true;
    }

    // toast logic
    let toastMessage = "";
    if (fileDeleted && !folderDeleted) {
      toastMessage =
        filesToDelete === 1
          ? "File moved to recycle bin successfully!"
          : "Files moved to recycle bin successfully!";
    } else if (!fileDeleted && folderDeleted) {
      toastMessage =
        foldersToDelete === 1
          ? "Folder moved to recycle bin successfully!"
          : "Folders moved to recycle bin successfully!";
    } else if (fileDeleted && folderDeleted) {
      const fileLabel = filesToDelete === 1 ? "File" : "Files";
      const folderLabel = foldersToDelete === 1 ? "Folder" : "Folders";
      toastMessage = `${fileLabel} and ${folderLabel} moved to recycle bin successfully!`;
    }

    // Refresh lists / storage
    setIsSelectAll(false);
    setSelectStatus(false);
    reloadAfterTast();
    setKeys([]);
    setKeys2([]);

    // Update storage in Redux
    dispatch(fetchUserFolderSize({ token, force: true }));

    afterMinLoaderDisplay(loaderStartedAt, () => {
      setLoader_Recycle(false);
      showToast("success", toastMessage);
    });
  } catch (error) {
    showToast("error", "Some error has occurred");
    console.error("handleMulDelete (other page) error:", error);
    afterMinLoaderDisplay(loaderStartedAt, () => setLoader_Recycle(false));
  } finally {
    dispatch(setLoader(false));
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
        const params = {
          filePath: fileName,
          ...(isSharedValue && filenameRedux ? { shared: filenameRedux } : {}),
        };
        const response = await fetch(
          `${apiUrl}${endpoint}?${new URLSearchParams(params)}`,
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
        } catch (e) {}
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
        } catch (e) {}
      });
    }, cleanupDelay);
  }
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

const isFileFavorited = (fileName) => {
  return favoriteFiles.includes(fileName);
};


  useEffect(() => {
    // console.log("Value of counter is", counter);
    setFilteredFileData(responseData || [], setFileData, counter);
  }, [counter, responseData]);

  const setFilteredFileData = (responseData, setFileData) => {
    const newRecords =
      responseData.length > 0
        ? normalizeFolderFilesForPreview([...responseData])
        : [];

    setFileData(newRecords);
    settotalPages(Math.ceil(responseData.length / itemsPerPage) || 0);
    const totalEntries = responseData.length;
  };
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endSliceIndex = startIndex + itemsPerPage;

    setPaginatedData(filedata.slice(startIndex, endSliceIndex));
    settotalPages(Math.ceil(filedata.length / itemsPerPage) || 0);
  }, [filedata, currentPage, itemsPerPage, refreshKey]); // Add refreshKey

  const getFileTypeIcon = (fileType) => {
    switch (fileType) {
      case "zip":
        return IconZip;
      case "jfif":
        return IconJfif;
      case "jpg":
        return IconJPG;
      case "png":
        return IconPNG;
      case "msi":
        return IconMsi;
      case "jpeg":
        return IconJpeg;
      case "pdf":
        return IconPDF;
      default:
        return IconFolder;
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

  const applyFilter = async (typesOverride, options = {}) => {
    const { keepOpen = false, sortLabel = selectedFilter } = options;
    const types = Array.isArray(typesOverride)
      ? typesOverride
      : selectedFileTypes;
    clearSearchBar();

    const sortParams = buildSortParams(sortLabel);
    const hasTypeOrSort = types.length > 0 || Object.keys(sortParams).length > 0;

    if (!hasTypeOrSort) {
      if (!keepOpen) {
        closePopup(); // No filters → reload and close
        return;
      }
      await reloadAfterTast();
      return;
    }

    try {
      const params = { ...sortParams };
      if (types.length > 0) {
        params.fileTypes = types.join(",");
      }

      let normalizedPath = path.replace(/\/$/, "").trim();
      const normalizedFilenameRedux = filenameRedux.trim();
      let apiEndpoint = `${apiUrl}getFolder`;

      if (isSharedValue) {
        if (normalizedPath === normalizedFilenameRedux) {
          apiEndpoint = `${apiUrl}get-all-files`;
        }
        params.shared = filenameRedux;
        if (normalizedPath !== normalizedFilenameRedux) {
          params.folderPath = normalizedPath
            .replace(`${normalizedFilenameRedux}/`, "")
            .replace(/\/$/, "");
          params.page = 1;
        }
      } else {
        params.folderPath = normalizedPath.replace(/\/$/, "");
        if (normalizedPath !== normalizedFilenameRedux) {
          params.page = 1;
        }
      }

      const response = await axios.get(apiEndpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        params,
      });

      const list = normalizeFolderFilesForPreview(
        Array.isArray(response.data) ? response.data : response.data?.result || []
      );
      setFileData(list);
      setTotalEntries(list.length);
      setCurrentPage(1);
      settotalPages(Math.ceil(list.length / itemsPerPage) || 0);
    } catch (error) {
      console.error(`There's an error: ${error}`);
    }

    if (!keepOpen) {
      closeOnlyPopup(); // 👈 Don't reset selection or reload here
    }
  };

  const handleFTCheckboxChange = (fileType) => {
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
    // console.log("Filter selected !", eventKey);
    if (eventKey === "File Type") {
      // console.log("Something...");
      clearSearchBar();
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

  const fetchFilteredData = async (filterParams, types = selectedFileTypes) => {
    try {
      let params = { ...filterParams };
      if (types.length > 0) {
        params.fileTypes = types.join(",");
      }

      // Normalize path (remove trailing slash and trim spaces)
      let normalizedPath = path.replace(/\/$/, "").trim();
      let apiEndpoint = "getFolder"; // Default API

      if (isSharedValue) {
        params.shared = filenameRedux; // Add shared param if isShared is true

        if (normalizedPath === filenameRedux) {
          // If it's the root folder, switch API to get-all-files
          apiEndpoint = "get-all-files";
          delete params.folderPath; // Remove folderPath from payload
        } else {
          // Remove filenameRedux from folderPath when nested & ensure correct format
          params.folderPath = normalizedPath
            .replace(`${filenameRedux}/`, "") // Remove root folder prefix
            .replace(/\/$/, "") // Remove trailing slash
            .trim();
        }
      } else {
        params.folderPath = normalizedPath.replace(/\/$/, "").trim(); // Remove trailing slash for non-shared cases
      }

      const res = await axios.get(`${apiUrl}${apiEndpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        params: params, // Pass dynamic parameters
      });

      const list = normalizeFolderFilesForPreview(
        Array.isArray(res.data) ? res.data : res.data?.result || []
      );
      setFileData(list);
      setTotalEntries(list.length);
      setCurrentPage(1);
      settotalPages(Math.ceil(list.length / itemsPerPage) || 0);
    } catch (error) {
      console.error(`There's an error: ${error}`);
    }
  };

  // Name Filters — always preserve active file-type filter
  const nameFilter1 = () => fetchFilteredData({ ascending: true });
  const nameFilter2 = () => fetchFilteredData({ ascending: false });

  // Size Filters
  const sizeFilter1 = () => fetchFilteredData({ sortSize: true });
  const sizeFilter2 = () => fetchFilteredData({ sortSize: false });

  // Date Filters
  const dateFilter1 = () => fetchFilteredData({ sortByDate: "asc" });
  const dateFilter2 = () => fetchFilteredData({ sortByDate: "desc" });

  const closePopup = () => {
    setSelectedFileTypes([]); // 👈 Clear all selected file types
    setCustomExtInput("");
    reloadAfterTast();
    setShowFTPopup(false);
  };

  const closeOnlyPopup = () => {
    setShowFTPopup(false); // Just close modal
  };

  //Anurag Check Folder or File
  const chkFileorFolder = (file, size) => {
    if (
      file?.isFolder === "true" ||
      file?.isFolder === true ||
      file.fileType === "Folder"
    ) {
      // console.log("Nestedfile.fileName", file.fileName);

      const updatedFileName = isSharedValue
        ? `${filenameRedux}/${file.fileName}`
        : file.fileName;

      dispatch(
        setFolderPath({
          folderPath: updatedFileName + "/",
          isShared: file.isShared || false,
        })
      );

      getFolderFiles(file, size);
    } else {
      // console.log("Its a file.");

      openFile(file);
    }
  };

  const getLastSegment = (path) => {
    // Split the path by slashes
    const parts = path.split("/");

    // Return the last segment
    return parts[parts.length - 1];
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

  //Image getting function
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
      console.error(error);
    } finally {
      setIsProgressVisible(false);
    }
  };
  //Audio getting function
  // Audio getting function
  const getAudioInfo = async (filename) => {
    try {
      const params = {
        filePath: filename,
      };

      if (isSharedValue) {
        params.shared = filenameRedux;
      }
      setIsProgressVisible(true);

      console.log("aaaa audio params", params)

      const res = await axios.get(`${apiUrl}getFile`, {
        params: params,
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

  // Pdf getting function
  const getPdfInfo = async (filename) => {
    try {
      const params = {
        filePath: filename,
      };

      if (isSharedValue) {
        params.shared = filenameRedux;
      }
      setIsProgressVisible(true);

      const res = await axios.get(`${apiUrl}getFile`, {
        params: params,
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
    setIsProgressVisible(true);

    const clearOtherViewers = () => {
      setImageSrc("");
      setVideoSrc("");
      setAudioSrc("");
      setPdfSrc("");
    };

    const applyDocStreamUrl = (filePath) => {
      clearOtherViewers();
      const streamingUrl = buildFileStreamUrl(apiUrl, token, filePath, {
        shared: Boolean(isSharedValue),
        sharedName: filenameRedux,
      });
      setDocSrc(streamingUrl);
      console.log("getDocInfo: set docSrc -> (streaming) ", streamingUrl);
    };

    // Shared folders: getFileDefault only (getFile was wrong bucket/creds; images already use this)
    if (isSharedValue) {
      setDocSrc("");
      applyDocStreamUrl(filename);
      setIsProgressVisible(false);
      return;
    }

    const params = { filePath: filename };

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
      clearOtherViewers();
      setDocSrc(url);

      console.log("getDocInfo: set docSrc -> (blob-file) ", url, " filename:", filenameClean, " chosen-mime:", finalMime);

    

      setIsProgressVisible(false);
      return;
    } catch (firstErr) {
      console.warn("getDocInfo: arraybuffer->file fetch failed, will fallback to streaming URL", firstErr);
      // continue to fallback
    }

    // Fallback: streaming URL (getFileDefault)
    try {
      applyDocStreamUrl(filename);
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





  // Anurag View Image, Video
  const openFile = async (file) => {
    try {
      const params = {
        filePath: file.fileName,
      };

      if (isSharedValue) {
        params.shared = filenameRedux;
      }

      const res = await axios.get(`${apiUrl}getFile`, {
        params: params,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "arraybuffer",
      });
      const exactFile = removeSlash2(file.fileName);
      const fileType = res.headers["content-type"];
      setCurrentFile(fileTypeExtractor(fileType));

      const blob = new Blob([res.data], { type: fileType });
      const url = window.URL.createObjectURL(blob);
      // console.log(fileType);
      if (fileType === "application/zip") {
        // console.log("Handling zip...");
      } else if (extractFirstPart(fileType) === "video") {
        // console.log("Handling video...");
        if (fileType === "video/mkv") {
          setErrorMessage(
            "This video format is not supported by your browser."
          );
        } else {
          setIsOpen(!isOpen);
          setVideoSrc(url);
          setisVideo(true);
        }
      } else if (fileType === "application/pdf") {
        // console.log("Handling pdf...");
        setOpenPDFModal(true);
        setPdfSrc(url);
        // console.log(pdfSrc);
      } else if (extractFirstPart(fileType) === "image") {
        // console.log("Handling image...");
        setIsOpen(!isOpen);
        const base64Image = arrayBufferToBase64(res.data);
        setImageSrc(`data:${fileType};base64,${base64Image}`);
      } else if (extractFirstPart(fileType) === "audio") {
        setIsAudio(true);
        // console.log("Handling audio...");
        setAudioSrc(url);
      } else if (extractFirstPart(fileType) === "text") {
        // console.log("Handling text file...");
        setOpenPDFModal(true);
        setPdfSrc(url);
        // console.log(pdfSrc);
      }
    } catch (error) {
      // console.error("Error fetching file:", error);
    } finally {
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
  const data = ["10", "25", "50", "100"].map((item) => ({
    label: item,
    value: Number(item),
  }));

  const pageFilter = (selectedValue) => {
    const size = Number(selectedValue);
    if (!Number.isFinite(size) || size <= 0) return;
    setItemsPerPage(size);
    setEndIndex(size);
    // Reset to first page when changing items per page
    setCurrentPage(1);
  };

  const [openFileUploadModal, setOpenFileUploadModal] = useState(false);
  const [uploadConflictNames, setUploadConflictNames] = useState(null);
  const uploadConflictResolverRef = useRef(null);
  const [createFolderButton, setCreateFolderButton] = useState(false);

  // Functions to handle modal visibility
  const handleOpenFileUploadModal = () => setOpenFileUploadModal(true);
  // const handleCloseFileUploadModal = () => setOpenFileUploadModal(false);
  const handleCloseFileUploadModal = () => {
      setFiles([]); // Clear selected files
      setOpenFileUploadModal(false); // Close the modal
    };


  const handleOpenCreateFolder = () => setCreateFolderButton(true);
  const handleCloseCreateFolder = () => {
    setCreateFolderButton(false);
    setFolderFieldError("");
  };

  const [isLoading, setLoading] = useState(true); // State to manage loading state
  useEffect(() => {
    // Simulate an API call or data loading delay
    setTimeout(() => setLoading(false), 300); // Simulate 2 seconds loading time
  }, []);

  // INPUT VALUE
  // INPUT VALUE
  const [inputValue, setInputValue] = useState("");
  const handleInputChange = (e) => setInputValue(e.target.value);

  //POPOVER WITH TABLE ROW ACTIVE
  const [activeRow, setActiveRow] = useState(null);
  const [wholeFile, setWholeFile] = useState(null);

  const [renamePop, setRenamepop] = useState(false);
  const [extension, setExtension] = useState("");
  const handleOpenPopover = (file) => {
    closeAllRowDropdowns();
    setWholeFile(file);
    setNewFileName(file.fileName);
    setActiveRow(file.fileName);
    if (file.isFolder) {
      setInputValue(checkLastHash(file.fileName));
      // console.log(checkLastHash(file.fileName));
    } else {
      setInputValue(checkLastHash(getFileNameWithoutExtension(file.fileName)));
      setExtension(file.fileName.substring(file.fileName.lastIndexOf(".")));
    }
    setRenamepop(true);
  };

  const handleClosePopover = () => {
    setActiveRow(null);
    setRenamepop(false);
  };

  function removeSlashAndExtension(filePath) {
    // Extract the filename by removing everything before the last slash
    const fileName = filePath.substring(filePath.lastIndexOf("/") + 1);

    // Remove the extension after the last dot
    return fileName.substring(0, fileName.lastIndexOf(".")) || fileName;
  }
  function removeSlash(filePath) {
    // Extract the filename by removing everything before the last slash
    return filePath.substring(filePath.lastIndexOf("/") + 1);
  }

  const getTextBeforeLastSlash = (text) => {
    if (text.includes("/")) {
      return text.slice(0, text.lastIndexOf("/")).replace(/\//g, ">");
    }
    return "";
  };

  function getTextAfterLastSlash(text) {
    if (text.includes("/")) {
      return text.substring(text.lastIndexOf("/") + 1);
    }
    return text;
  }

  //Check last /
  const checkLastHash = (name) => {
    // Remove trailing slash if present
    if (name.endsWith("/")) {
      name = name.slice(0, -1);
    }

    // Split the string by slashes and return the last part
    const parts = name.split("/");
    return parts[parts.length - 1]; // Return the text after the last slash
  };

  //Rename Api call
  const handleRadioChange = (event) => {
    setPubPri2(event.target.value);
  };
  const handleRadioChange2 = (event) => {
    setPubPri3(event.target.value);
  };
  const [isRenaming, setIsRenaming] = useState(false);

  const handleFileRename = async (oldkey, newkey, file) => {
    if (isRenaming) return; // Prevent multiple clicks

    const validated = validateItemName(newkey);
    if (!validated.ok) {
      showToast("warning", validated.message);
      return;
    }
    const safeName = validated.name;
    const isFolder = !!file?.isFolder;

    let targetKey;
    if (!isFolder) {
      const lastSlashIndex = oldkey.lastIndexOf("/");
      const filePath = oldkey.substring(0, lastSlashIndex + 1);
      const fileExtension = oldkey.substring(oldkey.lastIndexOf("."));
      targetKey = `${filePath}${safeName}${fileExtension}`;
    } else {
      targetKey = `${oldkey.substring(0, oldkey.lastIndexOf("/") + 1)}${safeName}`;
    }

    if (
      String(oldkey || "").replace(/\/+$/, "").toLowerCase() ===
      String(targetKey || "").replace(/\/+$/, "").toLowerCase()
    ) {
      showToast("warning", "Please choose a different name.");
      return;
    }

    if (isRenameNameTaken(filedata, oldkey, targetKey)) {
      showToast(
        "error",
        isFolder
          ? "A folder with this name already exists."
          : "A file with this name already exists."
      );
      return;
    }

    setIsRenaming(true);

    const queryParams = isSharedValue ? { shared: filenameRedux } : {};

    if (!isFolder) {
      try {
        await axios.post(
          `${apiUrl}rename-file`,
          {
            oldKey: oldkey,
            newKey: targetKey,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            params: queryParams,
          }
        );

        showToast("success", "File renamed successfully!");
        setExtension("");
        reloadAfterTast();
        handleClosePopover();
      } catch (error) {
        console.log(error)
        showToast("warning", error?.response?.data?.message);
      } finally {
        setIsRenaming(false);
      }
    } else {
      try {
        await axios.post(
          `${apiUrl}rename-folder`,
          {
            oldFolderName: oldkey,
            newFolderName: targetKey,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            params: queryParams,
          }
        );

        showToast("success", "Folder renamed successfully!");
        reloadAfterTast();
        handleClosePopover();
      } catch (error) {
        console.log(error);
        showToast("warning", error?.response?.data?.message || "There's an error");
      } finally {
        setIsRenaming(false);
      }
    }
  };

  //Convert Visibility
  //Convert visibility
  const changeVisibility = (file) => {
    if (!pubpri2) {
      showToast("error", "Please select Public or Private before proceeding.");
      return;
    }

    const actualoperation = async () => {
      try {
        const queryParams = isSharedValue ? `?shared=${filenameRedux}` : "";
        const url = `${apiUrl}convert-visibility${queryParams}`;

        const res = await axios.post(
          url,
          {
            key: file,
            targetVisibility: pubpri2,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        // console.log(res.data);
        showToast("success", "Visibility has been changed!");
        setPubPri2("");
        setVisiKey("");
        setIsVisibility(false);
        reloadAfterTast();
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


const handleFileDelete = async (file) => {
  
  handleCloseDeletePopover();
  if (filenameRedux === "blackbox") {
      showToast(
        "warning",
        "You cannot open or preview files inside the blackbox folder."
        );
        return;
    }

  setLoader_Recycle(true); // Start recycle loader
  const loaderStartedAt = Date.now();
  // dispatch(setLoader(true)); // START loader

  const isShared = isSharedValue; // replace with your actual shared flag

  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    ...(isShared && {
      params: { shared: filenameRedux },
    }),
  };

  try {
    if (file?.isFolder) {
      const folderPath = normalizeMovePath(file.fileName, {
        isShared: isSharedValue,
        sharedRoot: filenameRedux,
      });

      await axios.delete(`${apiUrl}soft-delete-folder`, { ...LONG_RUNNING_AWS_REQUEST_OPTIONS, 
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        ...(isSharedValue && {
          params: { shared: filenameRedux },
        }),
        data: { sourceFolders: [folderPath] },
      });

      // dispatch(setLoader(false));
      afterMinLoaderDisplay(loaderStartedAt, () => {
        setLoader_Recycle(false);
        showToast("success", "Folder moved to recycle bin successfully!");
      });
    } else {
      // Soft delete file
      const apiEndpoint = `${apiUrl}soft-delete`;

      // Derive sourceFolder and key by falling back to splitting fileName if relativePath missing
      let sourceFolder = "";
      let key = file.fileName;

      if (file.relativePath && file.relativePath.length > 0) {
        const lastSlashIndex = file.relativePath.lastIndexOf("/");
        if (lastSlashIndex !== -1) {
          sourceFolder = file.relativePath.substring(0, lastSlashIndex);
          key = file.relativePath.substring(lastSlashIndex + 1);
        } else {
          key = file.relativePath;
          sourceFolder = "";
        }
      } else {
        // Use fileName split fallback
        const lastSlashIndex = file.fileName.lastIndexOf("/");
        if (lastSlashIndex !== -1) {
          sourceFolder = file.fileName.substring(0, lastSlashIndex);
          key = file.fileName.substring(lastSlashIndex + 1);
        } else {
          key = file.fileName;
          sourceFolder = "";
        }
      }

      console.log("Soft delete:", { sourceFolder, key });

      const dataToSend = {
        sourceFolder,
        keys: [key],
      };

      const res = await axios.delete(apiEndpoint, {
        ...LONG_RUNNING_AWS_REQUEST_OPTIONS,
        ...config,
        data: dataToSend,
      });

      // dispatch(setLoader(false));
      afterMinLoaderDisplay(loaderStartedAt, () => {
        setLoader_Recycle(false);
        showToast("success", "File moved to recycle bin successfully");
      });
    }

    await reloadAfterTast(isSharedValue);
    
  } catch (error) {
    const errMsg = file?.isFolder
      ? "There's an error while moving folder to recycle bin!"
      : "There's an error while moving file to recycle bin!";
    showToast("error", errMsg);
    console.error("Delete error:", error);
    // dispatch(setLoader(false));
    afterMinLoaderDisplay(loaderStartedAt, () => setLoader_Recycle(false));
  } finally {
    if (token) {
      dispatch(fetchUserFolderSize({ token, force: true }));
    }
  }
};






  //Remove data from redux after back button clicked
  const isRestoringNavRef = useRef(false);
  useEffect(() => {
    if (location2.pathname !== previousLocationRef.current.pathname) {
      if (isRestoringNavRef.current) {
        isRestoringNavRef.current = false;
        previousLocationRef.current = location2;
        return;
      }
      if (navigationType === "POP") {
        // User clicked the back button
        // console.log("Back button was clicked");
        // Perform your desired action here

        dispatch(decrementCounter());
        dispatch(removeLastToken());
      }
      previousLocationRef.current = location2;
    }
  }, [location2, navigationType]);
  //Restore nested folder after refresh (path lives in sessionStorage; Redux resets)
  const { folderId } = useParams();
  const didRestoreNestedNavRef = useRef(false);

  useEffect(() => {
    if (didRestoreNestedNavRef.current) return;
    didRestoreNestedNavRef.current = true;

    // Fresh SPA navigation already has Redux path/counter
    if (counter > 0 && (newPath || filenameRedux)) {
      return;
    }

    const saved = loadNestedNav();
    if (!saved) {
      clearNestedNav();
      navigate("/Files", { replace: true });
      return;
    }

    isRestoringNavRef.current = true;
    dispatch(restoreNestedNavigation(saved));
    if (String(folderId) !== String(saved.counter)) {
      nav(`/nested/${saved.counter}`, { replace: true });
    } else {
      isRestoringNavRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep current folder rememberable across refresh
  useEffect(() => {
    if (counter > 0 && (newPath || filenameRedux)) {
      saveNestedNav({
        folderPath: newPath || (filenameRedux ? `${filenameRedux}/` : ""),
        counter,
        isSharedValue,
        fileName: filenameRedux || "",
      });
    }
  }, [newPath, counter, isSharedValue, filenameRedux]);

  const [openPDFModal, setOpenPDFModal] = useState(false);
  const handleOpenPDFModal = () => setOpenPDFModal(true);
  const handleClosePDFModal = () => setOpenPDFModal(false);

  //Upload code starts here
  const [pubpri, setPubPri] = useState("public");
  const [files, setFiles] = useState([]);
  const [directory, setDirectory] = useState("");
  const [fileList, setFileList] = useState([]);
  const [preLoader2, setPreLoader2] = useState(false);
  const [folderStructure, setFolderStructure] = useState({});
  const t = useSelector((state) => state.getdata.folderName);
  const t2 = useSelector((state) => state.getdata.fileName);

  
const effectiveFolderPath = t || (t2 ? `${t2}/` : '/');

useEffect(() => {
  console.log("yyyyy NESTEDPAGE: t (folderName):", t);
console.log("yyyyy NESTEDPAGE: t2 (fileName):", t2);
console.log("yyyyy NESTEDPAGE: effectiveFolderPath:", effectiveFolderPath);
}, [t, t2, effectiveFolderPath]);

const [delayedFolderName, setDelayedFolderName] = useState(effectiveFolderPath);

useEffect(() => {
  const timeout = setTimeout(() => {
    setDelayedFolderName(effectiveFolderPath);
  }, 500);

  return () => clearTimeout(timeout);
}, [effectiveFolderPath]);

useEffect(() => {
  if (delayedFolderName && delayedFolderName !== '/') {
    console.log("yyyyy Calling getFileData with:", delayedFolderName);
    
    // This is commented out... idk where it is used... mostly breadcrums [rrrrreloadAfterTast]
    // reloadAfterTast();
  }
}, [delayedFolderName]);

 


  // console.log("t", t);

  const getUcer = (file, counter) => {
    const parts = file.split("/");
    return parts.slice(0, counter).join("/") + "/";
  };

//   const getUcer = (file, counter, file2) => {

//     const useFile = file;
    
//     console.log("uuuuu 1 getUcer called with:", { file, counter });
//     if (!file) {
//       console.log("uuuu getUcer early return: empty file, returning empty path");
//       useFile = file2+"/";
//        const parts = useFile.split("/");
//         console.log("uuuuu 2 split parts:", parts);

//         const sliced = parts.slice(0, counter);
//         console.log("uuuuu 3 sliced parts:", sliced);

//         const result = sliced.join("/") + "/";
//         console.log("uuuuu 4 getUcer result:", result);
//     return result;
//   }

//   const parts = file.split("/");
//   console.log("uuuuu 2 split parts:", parts);

//   const sliced = parts.slice(0, counter);
//   console.log("uuuuu 3 sliced parts:", sliced);

//   const result = sliced.join("/") + "/";
//   console.log("uuuuu 4 getUcer result:", result);

//   return result;
// };

  // console.log("Counter for path is :", counter);
  if (counter > 0) {
    var path = getUcer(effectiveFolderPath, counter, t2);
    // console.log("path will be", path);
    // console.log("uuuuu 111 getUcer input:", { effectiveFolderPath, counter, path });
  } else {
    path = "";
  }
  // const secondPath = path;
  // const parts = secondPath.split("/");

  const [parts, setParts] = useState([]);


//   useEffect(() => {
//   console.log("yyyyy Reduxxxxx folderName changed: `t`", t);
// }, [t]);
  
  
  useEffect(() => {
    setParts(String(path || "").split("/").filter(Boolean));
  }, [path]); // Recompute only when path changes

  const breadcrumbNavigatingRef = useRef(false);
  const [breadcrumbBusy, setBreadcrumbBusy] = useState(false);

  const finishBreadcrumbNav = useCallback(() => {
    setBreadCrumClickTrigger((x) => x + 1);
    breadcrumbNavigatingRef.current = false;
    setBreadcrumbBusy(false);
  }, []);

  const handleBreadClick = useCallback(
    (event, targetIndex) => {
      event.preventDefault();
      if (breadcrumbNavigatingRef.current) return;
      if (targetIndex < 0 || targetIndex >= parts.length - 1) return;

      breadcrumbNavigatingRef.current = true;
      setBreadcrumbBusy(true);
      setPlaceholderLoading(true);
      setKeys([]);
      setKeys2([]);
      clearSearchBar();

      const targetPath = `${parts.slice(0, targetIndex + 1).join("/")}/`;
      dispatch(
        setFolderPath({
          folderPath: targetPath,
          isShared: isSharedValue,
        })
      );
      dispatch(breadCrum({ number: targetIndex }));

      const stepsBack = parts.length - 1 - targetIndex;
      startTransition(() => {
        navigate(-stepsBack);
      });

      // Let history/POP reducers settle, then reload (was a janky 500ms wait)
      window.setTimeout(finishBreadcrumbNav, 32);
    },
    [
      parts,
      dispatch,
      isSharedValue,
      navigate,
      clearSearchBar,
      finishBreadcrumbNav,
    ]
  );

  const handleOneStepBack = useCallback(
    (event) => {
      event.preventDefault();
      if (breadcrumbNavigatingRef.current) return;

      if (parts.length <= 1) {
        clearNestedNav();
        navigate("/Files");
        return;
      }

      breadcrumbNavigatingRef.current = true;
      setBreadcrumbBusy(true);
      setPlaceholderLoading(true);
      setKeys([]);
      setKeys2([]);
      clearSearchBar();

      const parentPath = `${parts.slice(0, -1).join("/")}/`;
      dispatch(
        setFolderPath({
          folderPath: parentPath,
          isShared: isSharedValue,
        })
      );

      startTransition(() => {
        navigate(-1);
      });
      window.setTimeout(finishBreadcrumbNav, 32);
    },
    [
      parts,
      dispatch,
      isSharedValue,
      navigate,
      clearSearchBar,
      finishBreadcrumbNav,
    ]
  );

  const breadcrumbItems = useMemo(() => {
    if (parts.length <= 4) {
      return parts.map((part, originalIndex) => ({
        part,
        originalIndex,
        isEllipsis: false,
      }));
    }
    return [
      { part: parts[0], originalIndex: 0, isEllipsis: false },
      { part: "…", originalIndex: -1, isEllipsis: true },
      ...parts.slice(-3).map((part, i) => ({
        part,
        originalIndex: parts.length - 3 + i,
        isEllipsis: false,
      })),
    ];
  }, [parts]);

  const normalizedFolderPath = String(path || "").replace(/\/+$/, "");
  const prevFolderPathRef = useRef(normalizedFolderPath);

  useEffect(() => {
    if (prevFolderPathRef.current !== normalizedFolderPath) {
      setKeys([]);
      setKeys2([]);
      setIsSelectAll(false);
      setSelectStatus(false);
      clearSearchBarRef.current();
      prevFolderPathRef.current = normalizedFolderPath;
    }
  }, [normalizedFolderPath]);

  const removeFile = (index) => {
    const updatedFiles = [...files];
    updatedFiles.splice(index, 1);
    setFiles(updatedFiles);
  };

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
    if (lastSlashIndex === -1) {
      return inputString;
    }
    return inputString.substring(0, lastSlashIndex);
  }

  function removeAfterLastSlash(text) {
    const lastSlashIndex = text.lastIndexOf("/");
    if (lastSlashIndex === -1) {
      return text;
    }
    return text.substring(0, lastSlashIndex + 1);
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

 
 

  const sanitizeFilename = (filename, options = {}) => {
    // Default options
    const maxLength = options.maxLength || 50;
    
    // Handle empty or invalid input
    if (!filename || typeof filename !== 'string') {
      return 'unnamed_file';
    }
    
    // Check if file has an extension
    const lastDotIndex = filename.lastIndexOf('.');
    const hasExtension = lastDotIndex > 0 && lastDotIndex < filename.length - 1;
    
    // Extract extension and name parts
    let extension = '';
    let nameWithoutExt = filename;
    
    if (hasExtension) {
      extension = filename.substring(lastDotIndex + 1);
      nameWithoutExt = filename.substring(0, lastDotIndex);
    }
    
    // Extract season and episode info (like S01E02)
    const seasonEpisodeMatch = nameWithoutExt.match(/[sS]\d{1,2}[eE]\d{1,2}/);
    const seasonEpisode = seasonEpisodeMatch
      ? seasonEpisodeMatch[0].toUpperCase()
      : '';
    
    // Extract resolution info (like 1080p, 720p, 4K)
    const resolutionMatch = nameWithoutExt.match(/\b(1080p|720p|4[kK]|8[kK]|2160p|UHD)\b/i);
    const resolution = resolutionMatch ? resolutionMatch[0] : '';
    
    // Extract year in parentheses (like "(2023)")
    const yearMatch = nameWithoutExt.match(/\((\d{4})\)/);
    const year = yearMatch ? yearMatch[0] : '';
    
    // For numeric-only filenames, add a prefix
    let mainTitle = nameWithoutExt;
    if (/^\d+$/.test(mainTitle)) {
      mainTitle = `${mainTitle}`;
    }
    
    // Clean the main title - keep only alphanumeric, spaces, and some safe characters
    mainTitle = mainTitle
      .replace(/[sS]\d{1,2}[eE]\d{1,2}/g, ' ') // Remove season/episode pattern from title
      .replace(/\b(1080p|720p|4[kK]|8[kK]|2160p|UHD)\b/gi, ' ') // Remove resolution from title
      .replace(/\(\d{4}\)/g, ' ') // Remove year from title
      .replace(/[^\w\s.-]/g, ' ') // Replace unsafe chars with spaces
      .replace(/\s+/g, ' ') // Collapse multiple spaces
      .trim();
    
    // Handle purely numeric or empty titles after cleaning
    if (!mainTitle || /^\d+$/.test(mainTitle)) {
      mainTitle = `${mainTitle || nameWithoutExt || 'unnamed'}`;
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
    finalName = finalName.replace(/\s+/g, '_');
    
    // Ensure the filename doesn't start or end with special characters
    finalName = finalName.replace(/^[.-]+|[.-]+$/g, '');
    
    // Add the extension back if it exists
    if (extension) {
      finalName += `.${extension.toLowerCase()}`;
    }
    
    return finalName;
  };

  const isVideoFile = (filename) => {
    const videoExtensions = ["mp4", "mkv", "avi", "mov", "flv", "wmv", "webm"];
    const ext = filename.split(".").pop().toLowerCase();
    return videoExtensions.includes(ext);
  };

  
  // ================= CONFIG =================
// ================= CONFIG =================



// const PART_SIZE = 5 * 1024 * 1024; // 5 MB per part
// const PART_SIZE = 10 * 1024 * 1024; // 5 MB per part
// ==========================================

// Safe URL builder (unchanged)
// const buildAwsUrl = (apiUrlRaw, endpointPath) => {
//   const base = apiUrlRaw.replace(/\/+$/, "");
//   const ep = endpointPath.replace(/^\/+/, "");
//   if (base.match(/\/aws(\/|$)/)) {
//     return `${base}/${ep}`;
//   }
//   return `${base}/aws/${ep}`;
// };




// const startMultipart = async (fileName, folderPath, isShared, sharedView, currentPath) => {
//   const url = buildAwsUrl(apiUrl, "start-multipart-upload");
//   console.log("bbbbb : url", url);
//   console.log("bbbbb : isShared", isShared);
//   console.log("bbbbb : sharedView", sharedView);
//   console.log("bbbbb : currentPath", currentPath);

//   // Ensure fileName is basename (no folder prefixes)
//   const basename = fileName.replace(/^.*[\\/]/, "");
//   console.log("bbbbb : basename", basename);

//   // Normalize paths
//   const normalize = (p) => (typeof p === 'string' ? p.replace(/\/+$/, '') : p);
//   const sv = normalize(typeof sharedView === 'string' ? sharedView : '');
//   console.log("bbbbb : sv (sharedView normalized)", sv);
//   const cp = normalize(currentPath || '');
//   console.log("bbbbb : cp (currentPath normalized)", cp);
//   let folderPathValue = '';

//   if (cp) {
//     if (sv && cp === sv) {
//       folderPathValue = '';
//       console.log("bbbbb : folderPathValue (root of shared)", folderPathValue);
//     } else if (sv && cp.startsWith(`${sv}/`)) {
//       folderPathValue = cp.substring(sv.length + 1);
//       console.log("bbbbb : folderPathValue (subfolder of shared)", folderPathValue);
//     } else if (!sv) {
//       folderPathValue = cp;
//       console.log("bbbbb : folderPathValue (not shared)", folderPathValue);
//     }
//   }

//   // Build payload and URL
//   const params = [];

//   if (isShared && sv) {
//     params.push(`shared=${encodeURIComponent(sv)}`);
//     console.log("bbbbb : added shared param", params[params.length - 1]);
//   }
//   if (folderPathValue) {
//     params.push(`folderPath=${encodeURIComponent(folderPathValue)}`);
//     console.log("bbbbb : added folderPath param", params[params.length - 1]);
//   }

//   const endpoint = params.length ? `${url}?${params.join('&')}` : url;
//   console.log("bbbbb : endpoint", endpoint);

//   // Update fileName to include folderPath if in a subfolder
//   const finalFileName = folderPathValue ? `${folderPathValue}/${basename}` : basename;
//   const payload = { fileName: finalFileName, ACL: "public" };
//   console.log("bbbbb : payload", payload);

//   const resp = await axios.post(endpoint, payload, {
//     headers: {
//       Authorization: `Bearer ${token}`,
//       'Content-Type': 'application/json',
//     },
//   });
//   console.log("bbbbb : response", resp.data);
//   return resp.data; // expects { uploadId, key, bucket }
// };




// Replace existing uploadPart with this (in NestedPage.jsx)
// const uploadPart = async ({ partNumber, uploadId, key, chunk, fileType, signal }) => {
//   const encodedKey = encodeURIComponent(key);
//   const url = buildAwsUrl(apiUrl, `upload-part?partNumber=${partNumber}&uploadId=${encodeURIComponent(uploadId)}&key=${encodedKey}`);

//   // POST binary chunk. Pass signal so AbortController can cancel this request.
//   const resp = await axios.post(url, chunk, {
//     headers: {
//       Authorization: `Bearer ${token}`,
//       "Content-Type": fileType || "application/octet-stream",
//     },
//     signal, // <-- this is the important line (axios must support signal)
//     maxContentLength: Infinity,
//     maxBodyLength: Infinity,
//   });

//   const etag =
//     (resp.headers && (resp.headers.etag || resp.headers.ETag)) ||
//     (resp.data && (resp.data.ETag || resp.data.etag)) ||
//     null;

//   return { etag, resp };
// };


// const completeMultipart = async ({ key, uploadId, parts }) => {
//   const url = buildAwsUrl(apiUrl, "complete-multipart-upload");
//   const resp = await axios.post(
//     url,
//     { key, uploadId, parts },
//     {
//       headers: {
//         Authorization: `Bearer ${token}`,
//         "Content-Type": "application/json",
//       },
//     }
//   );
//   return resp.data;
// };

// const abortMultipart = async ({ key, uploadId }) => {
//   const url = buildAwsUrl(apiUrl, "abort-multipart-upload");
//   try {
//     await axios.post(
//       url,
//       { key, uploadId },
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );
//   } catch (e) {
//     console.error("Abort multipart failed", e);
//   }
// };


// const BATCH_SIZE = 10;

// const handleFileUpload = async () => {
//   if (files.length === 0) {
//     showToast("error", "Please select a file to upload.");
//     return;
//   }

//   setOpenFileUploadModal(false);
//   setPreLoader2(true);

//   // Generate a fixed batch ID for all files in this upload session
//   const batchStartId = Date.now();

//   // Register all files upfront with unique IDs
//   files.forEach((file, i) => {
//     const finalName = isVideoFile(file.name) ? sanitizeFilename(file.name) : file.name;
//     const uiUploadId = batchStartId + i;
//     if (typeof addUpload === "function" && addUpload.length >= 3) {
//       addUpload(uiUploadId, "Uploading " + finalName, { controller: null, progress: 0 });
//     } else {
//       addUpload(uiUploadId, "Uploading " + finalName);
//     }
//   });

//   const waitUntilResumed = (uploadUiId) =>
//     new Promise((resolve, reject) => {
//       const interval = setInterval(() => {
//         const pausingIntent = isPausing ? !!isPausing(uploadUiId) : false;
//         const u = getUpload ? getUpload(uploadUiId) : null;

//         if (pausingIntent) return; // keep waiting

//         if (u && !u.paused) {
//           clearInterval(interval);
//           resolve();
//           return;
//         }

//         if (!pausingIntent && !u) {
//           clearInterval(interval);
//           reject(new Error("upload-removed"));
//           return;
//         }
//       }, 300);
//     });

//   const uploadSingleFile = async (file, index) => {
//     const finalName = isVideoFile(file.name) ? sanitizeFilename(file.name) : file.name;
//     const uiUploadId = batchStartId + index;
//     const controller = typeof AbortController !== "undefined" ? new AbortController() : null;

//     if (typeof updateUploadMeta === "function") {
//       updateUploadMeta(uiUploadId, { controller, progress: 0, currentPart: 1 });
//     }

//     // console.log("ppppp : path",path)
//     // console.log("ppppp : isSharedValue",isSharedValue)
    
//     const rawPath = isSharedValue
//     ? path.startsWith(`${filenameRedux}/`) && path.split("/").length === 2
//     ? ""
//     : path.replace(`${filenameRedux}/`, "")
//     : path;
    
    
    
//     const folderPath = rawPath.replace(/^\/+|\/+$/g, "");
//     // console.log("ppppp : folderPath",folderPath)

//     const basename = finalName.replace(/^.*[\\/]/, "");

//     // Start multipart upload
//     let startResp;
//     try {
//       // startResp = await startMultipart(basename, folderPath || undefined, isSharedValue, );
//        startResp = await startMultipart(
//                                     basename,
//                                     folderPath || undefined,
//                                     isSharedValue, // pass isSharedValue
//                                     isSharedValue ? filenameRedux : undefined, // pass sharedView only if isSharedValue is true
//                                     path // pass currentPath
//                                   );
//     } catch (err) {
//       removeUpload(uiUploadId);
//       throw new Error(`start-multipart-upload failed for ${finalName}: ${err.message}`);
//     }
//     const key = startResp.key || startResp.data?.key;
//     const uploadId = startResp.uploadId || startResp.data?.uploadId;

//     if (!key || !uploadId) {
//       removeUpload(uiUploadId);
//       throw new Error(`Invalid start-multipart response for ${finalName}`);
//     }

//     if (typeof updateUploadMeta === "function") {
//       updateUploadMeta(uiUploadId, { key, uploadId, controller, currentPart: 1 });
//     } else {
//       try {
//         addUpload(uiUploadId, "Uploading " + finalName, { key, uploadId, controller });
//       } catch {}
//     }

//     const totalSize = file.size;
//     const partSize = PART_SIZE;
//     const partsCount = Math.ceil(totalSize / partSize);
//     const partsArray = [];

//     for (let pi = 0; pi < partsCount; pi++) {
//       const start = pi * partSize;
//       const end = Math.min(start + partSize, totalSize);
//       const chunk = file.slice(start, end);
//       const partNumber = pi + 1;

//       try {
//         const currentController =
//           getUpload && getUpload(uiUploadId) && getUpload(uiUploadId).controller
//             ? getUpload(uiUploadId).controller
//             : controller;

//         const { etag } = await uploadPart({
//           partNumber,
//           uploadId,
//           key,
//           chunk,
//           fileType: file.type,
//           signal: currentController ? currentController.signal : undefined,
//         });

//         if (!etag) throw new Error("No ETag returned for uploaded part");

//         partsArray.push({ ETag: etag, PartNumber: partNumber });
//         const uploadedBytes = end;
//         const progress = Math.round((uploadedBytes * 100) / totalSize);
//         updateUploadProgress(uiUploadId, progress);

//         if (typeof updateUploadMeta === "function") {
//           updateUploadMeta(uiUploadId, { currentPart: partNumber + 1 });
//         }
//       } catch (err) {
//         const isCanceled =
//           err &&
//           (err.name === "CanceledError" ||
//             err.code === "ERR_CANCELED" ||
//             /canceled/i.test(err.message || "") ||
//             /abort/i.test(err.message || ""));

//         if (isCanceled) {
//           const maybeUpload = getUpload ? getUpload(uiUploadId) : null;
//           const pausingIntent = isPausing ? isPausing(uiUploadId) : false;

//           if ((maybeUpload && maybeUpload.paused) || pausingIntent) {
//             try {
//               await waitUntilResumed(uiUploadId);
//               pi = pi - 1; // retry same part
//               continue;
//             } catch {
//               try {
//                 await abortMultipart({ key, uploadId });
//               } catch {}
//               removeUpload(uiUploadId);
//               return "canceled";
//             }
//           }
//         }

//         await abortMultipart({ key, uploadId });
//         removeUpload(uiUploadId);
//         if (isCanceled) return "canceled";
//         throw new Error(`Failed at part ${partNumber}: ${err.message}`);
//       }
//     }

//     // Complete upload
//     try {
//       await completeMultipart({ key, uploadId, parts: partsArray });
//       removeUpload(uiUploadId);

//       try {
//         setPubPri("private");
//         reloadAfterTast(isSharedValue);
//       } catch {}

//       return "success";
//     } catch (err) {
//       await abortMultipart({ key, uploadId });
//       removeUpload(uiUploadId);
//       throw new Error(`Complete failed for ${finalName}: ${err.message}`);
//     }
//   };

//   // Sequentially upload batches with a delay
//   try {
//     for (let startIdx = 0; startIdx < files.length; startIdx += BATCH_SIZE) {
//       const batch = files.slice(startIdx, startIdx + BATCH_SIZE);
//       const promises = batch.map((file, i) => uploadSingleFile(file, startIdx + i));
//       await Promise.allSettled(promises);
//       // Add delay between batches
//       await new Promise(resolve => setTimeout(resolve, 1000));
//     }
//     showToast("success", "All files uploaded!");
//     dispatch(fetchUserFolderSize(token));
//   } catch (err) {
//     showToast("error", err.message || "Upload error");
//   } finally {
//     setPreLoader2(false);
//     setFiles([]);
//   }
// };


// const handleFileUpload = async () => {
//   if (files.length === 0) {
//     showToast("error", "Please select a file to upload.");
//     return;
//   }

//   setOpenFileUploadModal(false);
//   setPreLoader2(true);

//   // Helper: waits until upload is resumed or removed (cancelled)
//   const waitUntilResumed = (uploadUiId) =>
//     new Promise((resolve, reject) => {
//       const interval = setInterval(() => {
//         const pausingIntent = isPausing ? !!isPausing(uploadUiId) : false;
//         const u = getUpload ? getUpload(uploadUiId) : null;

//         if (pausingIntent) return; // still pausing → keep waiting

//         if (u && !u.paused) {
//           clearInterval(interval);
//           resolve(); // resumed
//           return;
//         }

//         if (!pausingIntent && !u) {
//           clearInterval(interval);
//           reject(new Error("upload-removed"));
//           return;
//         }
//       }, 300);
//     });

//   try {
//     // Add all files to upload list at the start
//     const uploadEntries = files.map((file, i) => {
//       const originalName = file.name;
//       const sanitizedName = isVideoFile(originalName)
//         ? sanitizeFilename(originalName)
//         : originalName;
//       const uploadUiId = Date.now() + i;
//       const controller =
//         typeof AbortController !== "undefined" ? new AbortController() : null;

//       console.log("Adding upload:", uploadUiId, sanitizedName);
//       addUpload(uploadUiId, "Uploading " + sanitizedName, { controller });
//       return { file, uploadUiId, sanitizedName, controller };
//     });

//     // Sequential upload: one file at a time (REMOVED BATCHING)
//     const results = [];
//     for (const { file, uploadUiId, sanitizedName, controller } of uploadEntries) {
//       try {
//         const rawPath = isSharedValue
//           ? path.startsWith(`${filenameRedux}/`) && path.split("/").length === 2
//             ? ""
//             : path.replace(`${filenameRedux}/`, "")
//           : path;
        
//         const cleanPath = rawPath.replace(/^\/+|\/+$/g, "");
//         const basename = sanitizedName.replace(/^.*[\\/]/, "");

//         // 1) Start multipart upload
//         let startResp;
//         try {
//           startResp = await startMultipart(
//             basename,
//             cleanPath || undefined,
//             isSharedValue,
//             isSharedValue ? filenameRedux : undefined,
//             path
//           );
//         } catch (err) {
//           console.log("Removing upload due to error:", uploadUiId);
//           removeUpload(uploadUiId);
//           results.push({ status: "rejected", reason: err });
//           continue;
//         }

//         const key = startResp.key || startResp.data?.key;
//         const uploadId = startResp.uploadId || startResp.data?.uploadId;

//         if (!key || !uploadId) {
//           console.log("Removing upload due to invalid response:", uploadUiId);
//           removeUpload(uploadUiId);
//           results.push({ status: "rejected", reason: new Error("Invalid start-multipart response") });
//           continue;
//         }

//         updateUploadMeta(uploadUiId, { key, uploadId, controller, currentPart: 1 });

//         // 2) Upload parts sequentially
//         const totalSize = file.size;
//         const partSize = PART_SIZE;
//         const partsCount = Math.ceil(totalSize / partSize);
//         const partsArray = [];

//         for (let pi = 0; pi < partsCount; pi++) {
//           const start = pi * partSize;
//           const end = Math.min(start + partSize, totalSize);
//           const chunk = file.slice(start, end);
//           const partNumber = pi + 1;

//           try {
//             const currentController =
//               (getUpload && getUpload(uploadUiId) && getUpload(uploadUiId).controller)
//                 ? getUpload(uploadUiId).controller
//                 : controller;

//             const { etag } = await uploadPart({
//               partNumber,
//               uploadId,
//               key,
//               chunk,
//               fileType: file.type,
//               signal: currentController ? currentController.signal : undefined,
//             });

//             if (!etag) throw new Error("No ETag returned for uploaded part");

//             partsArray.push({
//               ETag: etag,
//               PartNumber: partNumber,
//             });

//             const uploadedBytes = end;
//             const progress = Math.round((uploadedBytes * 100) / totalSize);
//             console.log("Updating progress:", uploadUiId, progress);
//             updateUploadProgress(uploadUiId, progress);
//             updateUploadMeta(uploadUiId, { currentPart: partNumber + 1 });
//           } catch (err) {
//             const isCanceled =
//               err &&
//               (err.name === "CanceledError" ||
//                 err.code === "ERR_CANCELED" ||
//                 /canceled/i.test(err.message || "") ||
//                 /abort/i.test(err.message || ""));

//             if (isCanceled) {
//               const maybeUpload = getUpload ? getUpload(uploadUiId) : null;
//               const pausingIntent = isPausing ? isPausing(uploadUiId) : false;

//               if ((maybeUpload && maybeUpload.paused) || pausingIntent) {
//                 try {
//                   await waitUntilResumed(uploadUiId);
//                   pi = pi - 1; // retry same part after resume
//                   continue;
//                 } catch {
//                   try {
//                     await abortMultipart({ key, uploadId });
//                   } catch { }
//                   console.log("Removing upload due to cancel:", uploadUiId);
//                   removeUpload(uploadUiId);
//                   results.push({ status: "fulfilled", value: "canceled" });
//                   continue;
//                 }
//               }
//             }

//             try {
//               await abortMultipart({ key, uploadId });
//             } catch { }

//             console.log("Removing upload due to error:", uploadUiId);
//             removeUpload(uploadUiId);
//             results.push({ status: "rejected", reason: err });
//             continue;
//           }
//         }

//         // 3) Complete multipart upload
//         try {
//           await completeMultipart({ key, uploadId, parts: partsArray });
//           results.push({ status: "fulfilled", value: "success" });
//         } catch (err) {
//           try {
//             await abortMultipart({ key, uploadId });
//           } catch { }
//           console.log("Removing upload due to error:", uploadUiId);
//           removeUpload(uploadUiId);
//           results.push({ status: "rejected", reason: err });
//         }
//       } catch (err) {
//         results.push({ status: "rejected", reason: err });
//       }
//     }

//     // After all uploads are done, show summary + RELOAD ONCE
//     const allCanceled = results.every((r) => r.status === "fulfilled" && r.value === "canceled");
//     const anyFailed = results.some((r) => r.status === "rejected");
//     const anySucceeded = results.some((r) => r.status === "fulfilled" && r.value === "success");

//     console.log("Upload results:", results);

//     if (anySucceeded && !anyFailed && !allCanceled) {
//       showToast("success", "Files uploaded successfully!");
//       setPubPri("private");
//       reloadAfterTast(isSharedValue); // NestedPage reload (ONLY ONCE at end)
//       dispatch(fetchUserFolderSize(token));
//     } else if (anySucceeded && anyFailed) {
//       showToast("warning", "Some files failed to upload.");
//       reloadAfterTast(isSharedValue); // Reload even on partial success
//     } else if (allCanceled) {
//       showToast("info", "Uploads were canceled successfully.");
//     } else if (anyFailed) {
//       showToast("error", "Error uploading some files.");
//     }

//     clearUploads(); // Clear all at once

//   } catch (error) {
//     showToast("error", error.message || "Error uploading files");
//   } finally {
//     setPreLoader2(false);
//     setFiles([]);
//   }
// };


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
  // const startMultipart = async (fileName, folderPath) => {
  //   const url = buildAwsUrl(apiUrl, "start-multipart-upload");
  //   const basename = fileName.replace(/^.*[\\/]/, "");
  //   // const payload = folderPath ? { fileName: basename, folderPath, ACL: "public", } : { fileName: basename, ACL: "public", };
  //   const payload = folderPath ? { fileName: basename, folderPath, targetVisibility: "public", } : { fileName: basename, targetVisibility: "public", ACL: "public", acl: "public", };
  //   const resp = await axios.post(url, payload, {
  //     headers: {
  //       Authorization: `Bearer ${token}`,
  //       "Content-Type": "application/json",
  //     },
  //   });
  //   return resp.data;
  // };
  const startMultipart = async (fileName, folderPath) => {
  const url = buildAwsUrl(apiUrl, "start-multipart-upload");
  const basename = fileName.replace(/^.*[\\/]/, "");
  
  // Shared folder handling (matching createJustFolder logic)
  let adjustedFolderPath = folderPath;
  let params = {};
  
 if (isSharedValue) {
  const relativePath = folderPath
    .replace(new RegExp(`^${filenameRedux}(/|$)`), "") // ✅ FIXED
    .replace(/\/$/, "")
    .replace(/\/+/g, "/");

  adjustedFolderPath = relativePath || "";
  params.shared = filenameRedux;

  console.log("relativePathrelativePath folderPath", folderPath);
  console.log("relativePathrelativePath", relativePath);
}
  
  const payload = adjustedFolderPath ? { 
    fileName: basename, 
    folderPath: adjustedFolderPath,   // ← Now relative in shared mode
    visibility: pubpri, 
  } : { 
    fileName: basename, 
    visibility: pubpri, 
  };
  
  const resp = await axios.post(url, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    params,  // ← Adds ?shared=infomanav.in in shared mode
  });
  
  return resp.data;
};


  /**
   * uploadPart now accepts an optional `signal` (from AbortController).
   * axios supports the `signal` option which will abort the request if controller.abort() is called.
   */
  // const uploadPart = async ({ partNumber, uploadId, key, chunk, fileType, signal }) => {
  //   const encodedKey = encodeURIComponent(key);
  //   const url = buildAwsUrl(apiUrl, `upload-part?partNumber=${partNumber}&uploadId=${encodeURIComponent(uploadId)}&key=${encodedKey}`);

  //   // POST binary chunk (change to PUT if backend expects PUT)
  //   const resp = await axios.post(url, chunk, {
  //     headers: {
  //       Authorization: `Bearer ${token}`,
  //       "Content-Type": fileType || "application/octet-stream",
  //     },
  //     signal, // <-- wire AbortController.signal here
  //     maxContentLength: Infinity,
  //     maxBodyLength: Infinity,
  //   });

  //   const etag =
  //     (resp.headers && (resp.headers.etag || resp.headers.ETag)) ||
  //     (resp.data && (resp.data.ETag || resp.data.etag)) ||
  //     null;

  //   return { etag, resp };
  // };

  const uploadPart = async ({ partNumber, uploadId, key, chunk, fileType, signal }) => {
  const encodedKey = encodeURIComponent(key);
  const url = buildAwsUrl(
    apiUrl,
    `upload-part?partNumber=${partNumber}&uploadId=${encodeURIComponent(uploadId)}&key=${encodedKey}`
  );


  try {
    // console.log("bbbbb axios upload START", 
    //   {
    //   partNumber,
    //   chunkSize: chunk?.size ?? chunk?.byteLength,
    //   isAborted: signal?.aborted,
    // });

    const resp = await axios.post(url, chunk, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": fileType || "application/octet-stream",
      },
      signal,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    // console.log("bbbbb axios upload SUCCESS");
    // console.log("bbbbb response status:", resp.status);
    // console.log("bbbbb response headers:", resp.headers);
    // console.log("bbbbb response data:", resp.data);

    const etag =
      (resp.headers && (resp.headers.etag || resp.headers.ETag)) ||
      (resp.data && (resp.data.ETag || resp.data.etag)) ||
      null;

    // console.log("bbbbb extracted ETag:", etag);

    return { etag, resp };
  } catch (error) {
    // console.error("bbbbb axios upload FAILED");
    // console.error("bbbbb partNumber:", partNumber);
    // console.error("bbbbb chunk size (bytes):", chunk?.size ?? chunk?.byteLength);
    // console.error("bbbbb error message:", error?.message);
    // console.error("bbbbb error response:", error?.response);
    // console.error("bbbbb error response data:", error?.response?.data);
    // console.error("bbbbb error response status:", error?.response?.status);

    throw error;
  }
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
        // getFileData(1);
        reloadAfterTast();
      } else if (anySucceeded && anyCanceled) {
        // List already refreshed on cancel-all; just toast
        showToast("info", "Upload stopped. Finished files are available.");
      } else if (anySucceeded && anyFailed) {
        showToast("warning", "Some files failed to upload.");
        reloadAfterTast();
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



  
  
  // Folder selection logic moved into UploadFolderPanel

  //Upload folder2
  const uploadFolder = async ({ fileList, folderName, isPrivate }) => {
    if (!fileList?.length) {
      showToast("warning", "Please select a folder first.");
      return;
    }

    let basePath = removeLastSlashAndText(path || "");
    if (isSharedValue && filenameRedux) {
      basePath = basePath
        .replace(new RegExp(`^${filenameRedux}(/|$)`), "")
        .replace(/\/$/, "")
        .replace(/\/+/g, "/");
    }

    const result = await uploadFolderViaMultipart({
      apiUrl,
      token,
      fileList,
      basePath,
      folderName,
      visibility: isPrivate,
      shared: isSharedValue && filenameRedux ? filenameRedux : undefined,
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
        setOpenFileUploadModal(false);
        setFiles([]);
        handleCloseFileUploadModal();
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
      reloadAfterTast();
    } else if (anySucceeded && anyCanceled) {
      showToast("info", "Upload stopped. Finished files are available.");
      reloadAfterTast();
    } else if (anySucceeded && anyFailed) {
      showToast("warning", "Some folder files failed to upload.");
      reloadAfterTast();
    } else if (allCanceled) {
      showToast("info", "Folder upload was canceled.");
    } else if (anyFailed) {
      showToast("error", "Error uploading folder files.");
    }

    if (token && anySucceeded) {
      dispatch(fetchUserFolderSize({ token, force: true }));
    }
  };


  useEffect(() => {
    // console.log("fileList", fileList);
  }, [fileList]);
  //Create Folder
  const createJustFolder = async (event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    const form =
      event?.target?.tagName === "FORM"
        ? event.target
        : event?.target?.closest?.("form");
    const inputEl = form?.querySelector?.('input[name="fname"]');
    const folderInput = (
      inputEl?.value ||
      document.getElementById("folname-popup")?.value ||
      document.getElementById("folname")?.value ||
      ""
    ).trim();

    // Validation: Allow only letters, numbers, underscores, hyphens, and spaces
    const isValid = /^[a-zA-Z0-9_\- ]{1,}$/.test(folderInput);
    if (!folderInput) {
      setFolderFieldError("Please enter a folder name.");
      return;
    }
    if (!isValid) {
      setFolderFieldError(
        "Folder name can only contain letters, numbers, underscores, hyphens, and spaces."
      );
      return;
    }

    let folderName = folderInput;

    // Handle nested folder creation for shared paths
    if (isSharedValue) {
      // Remove the root folder name (filenameRedux) from the current path
      const relativePath = path
        .replace(new RegExp(`^${filenameRedux}/`), "") // Remove root folder prefix
        .replace(/\/$/, "") // Remove trailing slash
        .replace(/\/+/g, "/"); // Replace multiple slashes with single slash

      // Construct folder name with relative path
      folderName = relativePath
        ? `${relativePath}/${folderInput}`
        : folderInput;
    } else {
      // For non-shared paths, keep existing logic
      folderName = path + folderInput;
    }

    // Final cleanup to remove multiple consecutive slashes
    folderName = folderName.replace(/\/+/g, "/");

    try {
      // Define API parameters
      let params = {};
      if (isSharedValue) {
        params.shared = filenameRedux;
      }

      await axios.post(
        `${apiUrl}create-folder`,
        { folderName: folderName }, // Pass the adjusted folder name
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          params: params, // Add shared param dynamically
        }
      );

      if (inputEl) inputEl.value = "";
      setFolderFieldError("");
      handleCloseCreateFolder();
      setOpenFileUploadModal(false);
      showToast("success", "Folder created successfully!");
      reloadAfterTast();
    } catch (error) {
      console.error(`There's an error at ${error}`);
      showToast("error", "Failed to create folder. Please try again.");
    }
  };




//   function parseStorageToBytes(storageStr) {
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



  

// Files-tab drop only (folder upload handled by UploadFolderPanel)
const onDrop = useCallback(
  (acceptedFiles) => {
    if (!isSharedValue) {
      const totalSize = acceptedFiles.reduce((acc, file) => acc + file.size, 0);

      if (totalSize > remainingBytes) {
        showToast(
          "error",
          `You can only upload files up to ${(remainingBytes / 1_000_000_000).toFixed(2)} GB. Please remove some files or select smaller ones.`
        );
        return;
      }
    }

    setFiles(prevFiles => [...prevFiles, ...acceptedFiles]);
  },
  [remainingBytes, isSharedValue]
);

  const filterAndPaginateData = (response, path, query) => {
    const q = (query || "").toLowerCase();
    const list = Array.isArray(response) ? response : [];

    // Shared getFolder responses are already scoped to the current folder.
    // Their fileNames are relative to the shared root and must not be
    // re-filtered against breadcrumb paths like "infomanav.in/".
    if (isSharedValue) {
      const filteredRecords = list.filter((record) =>
        String(record.fileName || "")
          .toLowerCase()
          .includes(q)
      );
      setFileData(filteredRecords);
      setCurrentPage(1);
      return;
    }

    const filteredRecords = list.filter((record) => {
      const matchesPath = removeAfterLastSlash(record.fileName) === path;
      const matchesQuery = String(record.fileName || "")
        .toLowerCase()
        .includes(q);
      return matchesPath && matchesQuery;
    });

    // Keep full filtered list in filedata; pagination effect slices by itemsPerPage
    setFileData(filteredRecords);
    setCurrentPage(1);
  };

  // console.log("PaginatedData : ", paginatedData);

  const {
    query,
    searchLoading,
    handleSearchChange,
    clearSearch,
    resetSearchBar,
  } = useFileSearch({
    apiUrl,
    token,
    getSearchParams: () =>
      isSharedValue && filenameRedux ? { shared: filenameRedux } : {},
    onResults: (list) => {
      const normalized = normalizeFolderFilesForPreview(
        Array.isArray(list) ? list : []
      );
      setFileData(normalized);
      setCurrentPage(1);
    },
    onSearchClear: () => {
      setFileData([]);
    },
    reloadList: () => {
      filterAndPaginateData(responseData || [], path, "");
    },
  });

  clearSearchBarRef.current = resetSearchBar;

  useEffect(() => {
    if (query.trim()) return;
    filterAndPaginateData(responseData || [], path, "");
  }, [path, isSharedValue, responseData, query]);

const reloadAfterTast = async () => {
  
  try {
    console.log("yyyyy  reloadAfterTask START");

    let adjustedFolderPath = (path || "").replace(/\/+$/, "");
    console.log("  adjustedFolderPath =", adjustedFolderPath);
    console.log("  isSharedValue =", isSharedValue);
    console.log("  filenameRedux =", filenameRedux);

    const params = buildGetFolderParams({
      folderPath: adjustedFolderPath,
      isShared: Boolean(isSharedValue),
      sharedRoot: filenameRedux,
    });

    console.log("  getFolder params =", params);

    const res = await axios.get(`${apiUrl}getFolder`, {
      params,
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log("  API response =", res.data);

    const folderFiles = normalizeFolderFilesForPreview(
      Array.isArray(res.data) ? res.data : res.data?.result || []
    );

    console.log("  updating state, count =", folderFiles.length);
    setAllData(folderFiles);
    setTotalEntries(folderFiles.length);
    setCurrentPage(1);
    setFileData(folderFiles);
    setRefreshKey((prevKey) => prevKey + 1);

    dispatch(
      replacelasttoken({
        id: counter,
        Files: folderFiles,
        isShared: Boolean(isSharedValue),
      })
    );

    console.log("  reloadAfterTask END");
    return folderFiles;

  } catch (error) {
    console.error("  ERROR =", error);

    if (error.response?.status === 500) {
      endUserSession({ intentional: false });
      nav("/Login");
    } else {
      console.error("  DETAILED ERROR =", error);
    }
    return [];
  }
};

const refreshFolderListWithSkeleton = async () => {
  setPlaceholderLoading(true);
  try {
    await reloadAfterTast();
  } finally {
    setPlaceholderLoading(false);
  }
};

  // Cancel-all: refresh list once immediately, then aborts continue in background
  useEffect(() => {
    if (typeof registerCancelRefresh !== "function") return undefined;
    return registerCancelRefresh(() => {
      setCurrentPage(1);
      reloadAfterTast();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registerCancelRefresh]);

// When landing from Files: reuse Redux listing if already loaded (avoid duplicate getFolder).
// Only fetch when this nested level has no Files yet (e.g. hard refresh).
useEffect(() => {
  if (selectedFolder?.fileName) return; // dropdown path uses getFolderFiles instead
  if (counter < 1) return;
  if (!path && !filenameRedux) return;

  // Files.jsx / NestedPage getFolderFiles already populated this level via addToken
  if (selectedItem && Array.isArray(selectedItem.Files)) {
    const folderFiles = normalizeFolderFilesForPreview(selectedItem.Files);
    setAllData(folderFiles);
    setTotalEntries(folderFiles.length);
    setCurrentPage(1);
    setFileData(folderFiles);
    setPlaceholderLoading(false);
    return;
  }

  let cancelled = false;
  setPlaceholderLoading(true);

  (async () => {
    try {
      await reloadAfterTast();
    } finally {
      if (!cancelled) setPlaceholderLoading(false);
    }
  })();

  return () => {
    cancelled = true;
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [counter, path, isSharedValue, filenameRedux]);


   


  const downloadFile = (file) => {
    // console.log("Started to download...");
    setSelectedFile(file);
    setDownloadpopup(true);
  };
  const { addDownload, updateDownloadProgress, removeDownload } =
    useContext(DownloadContext);

  const handleConfirmDownload = async () => {
    if (!selectedFile) return;

    const fileName = selectedFile.fileName;
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
        const params = {
          filePath: fileName,
          ...(isSharedValue && { shared: filenameRedux }),
        };

        const response = await fetch(
          `${apiUrl}download-file?${new URLSearchParams(params)}`,
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

  //File information shower
  const getFileInfo = async (name, file) => {
    try {
      const res = await axios.get(`${apiUrl}file-info`, {
        params: {
          filePath: name,
          ...(isSharedValue && { shared: filenameRedux }), // Conditionally add 'shared' param
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

      // console.log("File information is", fileData);
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
      // console.log("File info", fileInfo);
    } catch (error) {
      // console.log(error);
      showToast("error", "Unable to show information!");
    }
  };

  const shareFile = (file) => {
    setSharepopup(true);
    setSelectedFile(file);
  };

  const closeSharePopup = () => {
    setSharepopup(false);
    setSelectedFile(null);
  };

  const [codePopup, setCodePopup] = useState(false);
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
    setShowFolderModal(true);
    setCurrentFileToZip(file);
  }

  // async function processZipFile(file, destinationPath = "") {
  //   const apiUrl1 = `${apiUrl}zip-object`;

  //   const requestData = {
  //     filePath: file.fileName,
  //     destinationPath, // Defaults to empty string if not provided
  //   };

  //   // console.log("Request data for zipping:", requestData);

  //   try {
  //     const response = await axios.post(apiUrl1, requestData, {
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //       },
  //       params: isSharedValue ? { shared: filenameRedux } : {},
  //     });

  //     // console.log("Zip successful:", response.data);
  //     showToast("success", "File successfully zipped!");
  //     reloadAfterTast()
  //   } catch (error) {
  //     console.error("Error zipping file:", error);
  //     showToast("error", "Failed to zip file.");
  //   }
  // }


  async function processZipFile(file, destinationPath = "") {
    if (!file?.fileName) return;

    setLoader2(true);           // ← start loader

    const apiUrl1 = `${apiUrl}zip-object`;

    const requestData = {
      filePath: file.fileName,
      destinationPath,
    };

    try {
      const zipResult = await postZipOrUnzip(apiUrl1, requestData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: isSharedValue ? { shared: filenameRedux } : {},
      });

      showToast("success", getZipSuccessMessage(zipResult));
      reloadAfterTast();
    } catch (error) {
      console.error("Error zipping file:", error);
      showToast(
        "error",
        getZipUnzipErrorMessage(error, "Failed to zip file.")
      );
    } finally {
      setLoader2(false);        // ← always stop loader (success or error)
    }
  }

  const [showFolderModalUnZip, setShowFolderModalUnZip] = useState(false);
  const [currentFileToUnzip, setCurrentFileToUnzip] = useState(null);

  async function UnzipFile(file) {
    setShowFolderModalUnZip(true);
    setCurrentFileToUnzip(file);
  }

 

 async function processUnzipFile(file, destinationPath = "") {
  if (!file?.fileName) return;

  setLoader2(true);   // ← start loader

  const apiUrl1 = `${apiUrl}unzip-object`;

  const requestData = {
    zipFilePath: file.fileName,
    destinationPath, // "" = root
  };

  // Build params like fetchInitialFolders
  const params = {};
  if (isSharedValue) {
    params.shared = filenameRedux;
  }

  try {
    await postZipOrUnzip(apiUrl1, requestData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      params,
    });

    showToast("success", "File successfully unzipped!");
    reloadAfterTast();
  } catch (error) {
    console.error("Error unzipping file:", error);
    showToast(
      "error",
      getZipUnzipErrorMessage(error, "Failed to unzip file.")
    );
  } finally {
    setLoader2(false);   // ← always stop loader — success or error
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

  // 👇 create unique id based on content
  const toastId = `${status}-${message}`;

  // 👇 prevent duplicate toast
  if (toast.isActive(toastId)) return;

  toast({
    id: toastId, // ✅ important
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
    setCodePopup(false);
    setIsWhisperClicked(false);
    setIsCWhisperClicked(false);
    setMoveFol(false);
    setShowFolderModal(false);
    setShowFolderModalUnZip(false);
    setInfoShower(false);
    setRenamepop(false);
    setDeletepop(false);
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

    // Image types
    const imageTypes = ["jpeg","jpg","png","gif","heic","hevc","heif","svg","webp"];
    // Pdf / text
    const pdfTypes = ["pdf","txt"];
    // Video types
    const videoTypes = ["mkv","mp4","mov","mpeg","webm"];
    // Document / ppt / excel types
    const docTypes = ["doc","docx","ppt","pptx","pptm","pps","ppsx","xls","xlsx","xlsm","csv","ods"];

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
      setDocSrc("");
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

    const imageTypes = ["jpeg", "jpg", "png", "gif", "heic", "hevc", "heif", "svg", "webp"];
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
      setDocSrc("");
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
  let sourceFolder = "";
  let keyOnly = filename;

  if (lastSlashIndex !== -1) {
    sourceFolder = filename.substring(0, lastSlashIndex).replace(/\/$/, "");
    keyOnly = filename.substring(lastSlashIndex + 1);
  }

  const dataToSend = {
    sourceFolder,
    keys: [keyOnly],
  };

  let endpoint = `${apiUrl}soft-delete`;
  if (isSharedValue) {
    endpoint += `?shared=${encodeURIComponent(filenameRedux)}`;
  }

  try {
    await axios.delete(endpoint, { ...LONG_RUNNING_AWS_REQUEST_OPTIONS, 
      data: dataToSend,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const freshFiles = await reloadAfterTast();
    const next = resolvePreviewAfterDelete(
      freshFiles,
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
  const [hoveredFolderName, setHoveredFolderName] = useState(null);


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

  const handleDragEnterFolder = (e, file) => {
  e.preventDefault();
  if (file.isFolder) {
    setHoveredFolderName(file.fileName);
    // the class is added via the tr className line above
  }
};

const handleDragLeaveFolder = () => {
  // Only remove visual — do NOT clear hoveredFolderName here
  // (prevents flicker when moving between child elements of the row)
};

const handleDragOver = (e) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
};

// const handleDrop = (e) => {
//   e.preventDefault();
//   e.stopPropagation();

//   if (!hoveredFolderName) {
//     console.warn("No folder was hovered at drop time");
//     return;
//   }

//   const targetFolder = filedata.find(   // ← change to your actual array name (files? items? content?)
//     (f) => f.fileName === hoveredFolderName && f.isFolder
//   );

//   if (!targetFolder) {
//     console.warn("Hovered folder not found in list:", hoveredFolderName);
//     setHoveredFolderName(null);
//     return;
//   }

//   if (targetFolder.isShared) {
//     showToast("error", "Cannot move files into a shared folder.");
//     setHoveredFolderName(null);
//     return;
//   }

//   setDragPop(true);
//   setDragFile(draggedItem);
//   setTargetFolder(targetFolder.fileName);

//   // cleanup
//   setDraggedItem(null);
//   setHoveredFolderName(null);
// };

const handleDrop = (e) => {
  e.preventDefault();
  e.stopPropagation();

  if (filenameRedux === "blackbox") {
    showToast(
    "warning",
    "You cannot move files/folders inside the blackbox folder."
  );
  return;
}


  if (!hoveredFolderName) {
    console.warn("No folder was hovered at drop time");
    showToast("warning", "Please drop over a valid folder.");
    return;
  }

  const targetFolder = filedata.find(   
    (f) => f.fileName === hoveredFolderName && f.isFolder
  );

  if (!targetFolder) {
    console.warn("Hovered folder not found in list:", hoveredFolderName);
    showToast("error", "Target folder not found.");
    setHoveredFolderName(null);
    return;
  }

  // Block dropping into a shared root folder from private Files — not moves within shared view
  if (targetFolder.isShared && !isSharedValue) {
    showToast("error", "Cannot move files into a shared folder.");
    setHoveredFolderName(null);
    return;
  }

  // Optional: prevent self-drop (if draggedItem is the same as target)
  if (draggedItem && draggedItem.fileName === targetFolder.fileName) {
    showToast("warning", "Cannot move an item into itself.");
    setHoveredFolderName(null);
    return;
  }

  const movePathOptions = {
    isShared: Boolean(isSharedValue),
    sharedRoot: filenameRedux,
  };
  const dropTargetPath = resolveNestedDropTargetPath(
    targetFolder.fileName,
    path,
    movePathOptions
  );
  if (isSameMoveDestination(path, dropTargetPath, movePathOptions)) {
    showToast("warning", "Source and destination are the same.");
    setHoveredFolderName(null);
    setDraggedItem(null);
    return;
  }

  setDragPop(true);
  setDragFile(draggedItem);
  setTargetFolder(targetFolder.fileName);

  // cleanup
  setDraggedItem(null);
  setHoveredFolderName(null);
};


const handleDragEnd = (e) => {
  e.target.classList.remove("dragging");
  setHoveredFolderName(null);           // ← important cleanup
  setDraggedItem(null);                 // optional extra safety
};


  // Function called when a draggable item enters a droppable area
  const handleDragEnter = (e) => {
    e.preventDefault();
  };



  const moveDraggedFile = async (filename) => {
    let uploadId = null;

    if (filename.isFolder === true) {
      try {
        const sharedPathOptions = {
          isShared: isSharedValue,
          sharedRoot: filenameRedux,
        };
        const params = filename.isShared ? { shared: filenameRedux } : {};
        const sourceFolder = normalizeMovePath(
          filename.fileName,
          sharedPathOptions
        );

        uploadId = startMoveTransfer(
          addUpload,
          updateUploadProgress,
          "Moving " + filename.fileName,
          { isFolder: true }
        );

        await axios.post(
          `${apiUrl}move-folder`,
          {
            sourceFolders: [sourceFolder],
            destinationFolder: targetFolder,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            params,
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
        console.error("Error moving folder:", error);
        throw error;
      }
    } else {
      const movingFile = filename.fileName;
      try {
        const params = filename.isShared ? { shared: filenameRedux } : {};

        let adjustedSourceFolder = path.replace(/\/+$/, "");

        if (filename.isShared) {
          if (adjustedSourceFolder === filenameRedux) {
            adjustedSourceFolder = "";
          } else if (adjustedSourceFolder.startsWith(filenameRedux + "/")) {
            adjustedSourceFolder = adjustedSourceFolder.replace(
              filenameRedux + "/",
              ""
            );
          }
        }

        const fileKey = movingFile.includes("/")
          ? movingFile.substring(movingFile.lastIndexOf("/") + 1)
          : movingFile;

        uploadId = startMoveTransfer(
          addUpload,
          updateUploadProgress,
          "Moving " + movingFile
        );

        await axios.post(
          `${apiUrl}move-file`,
          {
            sourceFolder: adjustedSourceFolder,
            destinationFolder: targetFolder.replace(/\/+$/, ""),
            keys: [fileKey],
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            params,
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
    const sourceFolder = path.replace(/\/$/, "");

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
            sourceFolder,
            destinationFolder: folname,
            keys: [key.substring(path.lastIndexOf("/") + 1)],
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

      const sharedPathOptions = {
        isShared: isSharedValue,
        sharedRoot: filenameRedux,
      };
      const sourceFolders = arr
        .map((f) => {
          if (typeof f === "string") {
            return normalizeMovePath(f, sharedPathOptions);
          }
          const raw = f.filePath || f.path || f.fileName || f.name || "";
          return normalizeMovePath(raw, sharedPathOptions);
        })
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
      afterLoaderComplete(() => setLoader2(false));
      await refreshFolderListWithSkeleton();
    } catch (error) {
      console.error("Drag move failed:", error);
      afterLoaderComplete(() => setLoader2(false));
    }
  };

  const [showDropdown, setShowDropdown] = useState(false);

  // Function to show the dropdown when the "Move" button is clicked
  const handleMoveClick = () => {
    setShowDropdown(!showDropdown);
  };

  const [folders, setFolders] = useState([]);

  useEffect(() => {
    if (showImage) {
      const fetchInitialFolders = async () => {
        try {
          // Define API parameters
          let params = {};
          if (isSharedValue) {
            params.shared = filenameRedux; // Add shared param if isShared is true
          }

          const res = await axios.get(`${apiUrl}get-recent-folders`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            params: params, // Pass params dynamically
          });

          // console.log("Recent folders are", res.data.result);
          setFolders(res.data.result);
          // console.log("folders are ", folders);
        } catch (error) {
          // console.error("There is an error at", error);
        }
      };

      fetchInitialFolders();
    }
  }, [showImage]);

  const folderOptions = folders.map((folder) => ({
    value: getModifiedRecentFolderText(folder.folder),
    label: getModifiedRecentFolderText(folder.folder),
  }));

  const handleChange = (event) => {
    const selectedOption = folderOptions.find(
      (folder) => folder.value === event.target.value
    );
    setSelectedFolder(selectedOption.value);
    handleFolderSelect(selectedOption); // Pass the selected folder to the handler
    console.log("  Handle changed clicked in CustomFileModal shown in NestedFile")
  };

 const handleFolderSelect = async (selectedOption) => {
   const path2 = path;
  console.log("ttttt path (source)--> ", path2);
  console.log("ttttt path (source)--> ", path2.replace(/\/+$/, "").replace(/\/+/g, "/"));
  console.log("ttttt Destination--> ", selectedOption);
  console.log("ttttt Destination--> ", selectedOption.value.replace(/</g, "/").replace(/\/+/g, "/"));

  try {
    const res = await axios.post(
      `${apiUrl}move-file`,
      {
        sourceFolder: path2.replace(/\/+$/, "").replace(/\/+/g, "/"),
        destinationFolder: selectedOption.value.replace(/</g, "/").replace(/\/+/g, "/"),
        keys: [modalFile.substring(path2.lastIndexOf("/") + 1)],
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    setSelectedFolder(null);

    async function executeFunctionsInOrder() {
      try {
        showToast("success", "File Moved successfully");
        await reloadAfterTast();
        handleNext();
      } catch (error) {
        console.error("Error executing functions:", error);
      }
    }

    executeFunctionsInOrder();
  } catch (error) {
    console.error("There's an error");
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
<FileInfoModal
  isOpen={infoShower}
  onClose={() => setInfoShower(false)}
  fileInfo={fileInfo}
  isPremium={isPremium}
  showVisibility
  requirePremiumForPublicUrl
  onUpgrade={() => setShowUpgradeModal(true)}
/>
      <VisibilityModal
        isOpen={isVisibility}
        onClose={() => setIsVisibility(false)}
        value={pubpri2}
        onChange={(next) => setPubPri2(next)}
        onApply={() => changeVisibility(visiKey)}
        fileName={visiKey}
      />
      {renamePop && (
        <RenameModal
          isOpen={renamePop}
          onClose={handleClosePopover}
          value={inputValue}
          onChange={handleInputChange}
          onSubmit={() => {
            const sanitizedNewName = inputValue.trim();
            handleFileRename(newFileName, sanitizedNewName, wholeFile);
          }}
          isSubmitting={isRenaming}
          currentName={newFileName}
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
  <div className="drag_popup_wrapper">
    <div className="drag_modal">
      {/* Short, user-friendly headline using only folder name */}
      <h2 className="rename_title2">
        Move to “<strong>{getFolderNameOnly(targetFolder)}</strong>”?
      </h2>

      <p className="modal-subtitle" style={{marginBottom:"12px"}}>
        {keys.length + keys2.length > 1
          ? `${keys.length + keys2.length} items`
          : "This item"}{" "}
        will be moved to the selected folder. This action cannot be undone.
      </p>

      {/* Full path shown below for context */}
      <p className="drag_path_hint">
        Full path: <span className="path-text">{getFullTargetPath()}</span>
      </p>

      <div className="drag_buttons">
        <button
          className="drag_btn cancel"
          onClick={() => setDragPop(false)}
        >
          No
        </button>

        <button
          className="drag_btn ok"
          onClick={handleDragMoveConfirm}
        >
          Yes
        </button>
      </div>
    </div>
  </div>
)}


      
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
        resolveFilePath={(file) => file.fileName}
        apiUrl={apiUrl}
        token={token}
        shared={isSharedValue ? filenameRedux : undefined}
        onCopied={() => showToast("success", "Copied to clipboard!")}
        onError={(msg) =>
          showToast("error", msg || "Failed to generate or copy link!")
        }
      />

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
                <div style={{
                  display:"flex",
                  alignItems:"center"
                }}>
                <h1>Recent Uploads</h1>
                
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
                  onClick={() => navigate("/UserProfile")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate("/UserProfile");
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
                }} />
                </div>
                </div>
              </div>

             






              {/* <div className="breadcrumb">
            {<Link to="/Files">← Back</Link>} &gt;&nbsp;
            {parts.map((part, index) => (
            <span key={index}>
            <a href="#" onClick={(event) => handleBreadClick(event, part, index, parts.length)}>
             
             {part}
            </a>
            {index < parts.length - 1 && <span> &gt; </span>}
            </span>
            ))}

            </div> */}
            </div>
          </div>
        </nav>
        {/* partial */}
        <div className="main-panel">
          <div className="content-wrapper">
            <div className={tableBoxClassName} ref={tableBoxRef}>
              <div className="filerbar_row" ref={filterBarRef}>
                <div className="show_entries_row">
                  <FileSearchBar
                    value={query}
                    onChange={handleSearchChange}
                    onClear={clearSearch}
                    isPremium={isPremium}
                    onPremiumGate={() => setShowUpgradeModal(true)}
                  />
                </div>
                <div className="files-toolbar">
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
                              setShowUpgradeModal(true);   // or showUpgradeToast()
                              return;
                            }
                            setShowFTPopup(true)}} // Show the modal when dropdown is clicked
                      >
                        {/* You can remove the Dropdown.Item since it’s not needed anymore */}
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
                  <Whisper placement="top" trigger="hover" speaker={<Tooltip>Create Folder</Tooltip>}>
                  <button
                    onClick={handleOpenCreateFolder}
                    className="download-btn2"
                  >
                    <img src={CreateFolder} />
                    {/* <span className="btn__text">Create Folder</span> */}
                  </button>
                  </Whisper>

                  <Whisper placement="top" trigger="hover" speaker={<Tooltip>Download from URL </Tooltip>}>
                  <button
                    // onClick={() => setIsDownloadModalOpen(true)}
                       onClick={() => {
                       if (!isPremium) {
                        setShowUpgradeModal(true);   // or showUpgradeToast()
                        return;
                      }
                      setIsDownloadModalOpen(true)}}
                    className="download-btn"
                  >
                    <img src={DownloafFromUrl} alt="" />
                    {/* <span className="btn__text">Download from URL</span> */}
                  </button>
                  </Whisper>

                  <Whisper placement="top" trigger="hover" speaker={<Tooltip>Upload</Tooltip>}>
                  <button
                    onClick={handleOpenFileUploadModal}
                    className="btn__upload__file_modal"
                  >
                    <img src={IconUpload} />
                    {/* <span className="btn__text">Upload</span> */}
                  </button>
                  </Whisper>
                  </div>
                </div>
              </div>


              <div className="np-breadcrumb-bar">
                <button
                  type="button"
                  className="np-breadcrumb-back"
                  onClick={handleOneStepBack}
                  disabled={breadcrumbBusy}
                  aria-label="Go up one folder"
                  title="Back"
                >
                  ←
                </button>

                <nav className="np-breadcrumb-nav" aria-label="breadcrumb">
                  <ol
                    className={`np-breadcrumb${breadcrumbBusy ? " is-navigating" : ""}`}
                  >
                    <li className="np-breadcrumb-item">
                      <Link
                        to="/Files"
                        className="np-breadcrumb-link np-breadcrumb-home"
                        onClick={() => clearNestedNav()}
                      >
                        Home
                      </Link>
                    </li>

                    {breadcrumbItems.map(
                      ({ part, originalIndex, isEllipsis }, index) => {
                        const isLast = originalIndex === parts.length - 1;

                        return (
                          <li
                            key={`${part}-${originalIndex}-${index}`}
                            className={`np-breadcrumb-item${isLast ? " is-current" : ""}`}
                          >
                            <span className="np-breadcrumb-sep" aria-hidden="true">
                              &gt;
                            </span>

                            {isEllipsis ? (
                              <span className="np-breadcrumb-ellipsis">…</span>
                            ) : isLast ? (
                              <span className="np-breadcrumb-current" title={part}>
                                {part}
                              </span>
                            ) : (
                              <button
                                type="button"
                                className="np-breadcrumb-link"
                                title={part}
                                disabled={breadcrumbBusy}
                                onClick={(event) =>
                                  handleBreadClick(event, originalIndex)
                                }
                              >
                                {part}
                              </button>
                            )}
                          </li>
                        );
                      }
                    )}
                  </ol>
                </nav>
              </div>

              {filenameRedux === "blackbox" && (
                <div
                  style={{
                    position: "fixed",
                    left: "50%",
                    transform: "translateX(-50%)",
                    bottom: "calc(var(--stolity-footer-bar-height, 72px) + 16px)",
                    zIndex: 90,
                    width: "min(900px, calc(100% - 48px))",
                    borderRadius: "16px",
                    padding: "16px 20px",
                    backgroundColor: "#ffecec",
                    border: "1px solid #ffb3b3",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                    color: "#b91c1c",
                    fontSize: "14px",
                    lineHeight: "1.5",
                    boxShadow: "0 12px 28px -12px rgba(185, 28, 28, 0.4)",
                  }}
                >
                  <span style={{ fontSize: "20px", lineHeight: "1" }}>
                    <img src={warningIcon} alt="" style={{ height: "30px" }} />
                  </span>
                  <p style={{ margin: 0 }}>
                    Once you move data into this folder you cannot recover or see your data.
                    If you want it back then{" "}
                    <Link
                      to="/HelpSupportCenter"
                      className="contact-link-underline"
                      style={{ fontWeight: 600, color: "#b45309" }}
                    >
                      Contact Us
                    </Link>
                    . This is a safe folder.
                  </p>
                </div>
              )}

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

              
             
                <div id="dataView">
                  {view === "list" ? (
                    !placeholderLoading && !searchLoading && paginatedData.length === 0 ? (
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
                            {/* <th style={{ width: "40px", textAlign: "center" }}>
                              <input
                                id="check-Atharva"
                                type="checkbox"
                                onChange={handleSelectAllToggle}
                                checked={isSelectAll}
                              />
                            </th> */}
                            {filenameRedux !== "blackbox" && (
                              <th style={{ width: "40px", textAlign: "center" }}>
                                <input
                                  id="check-Atharva"
                                  type="checkbox"
                                  onChange={handleSelectAllToggle}
                                  checked={isSelectAll}
                                />
                              </th>
                            )}


                            <th
                              style={{
                                width: "60%",
                                fontWeight: 600,
                                color: "#181818",
                                paddingLeft: filenameRedux === "blackbox" ? "35px" : 0,
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
                                  style={{ cursor: "pointer" }}
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
                                  style={{ cursor: "pointer" }}
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
                                  style={{ cursor: "pointer" }}
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

                            {/* <th
                              style={{
                                width: "15%",
                                fontWeight: 600,
                                color: "#181818",
                                textAlign: "center",
                              }}
                            >
                              Action
                            </th> */}
                            {filenameRedux !== "blackbox" && (
                              <th
                                style={{
                                  width: "15%",
                                  fontWeight: 600,
                                  color: "#181818",
                                  textAlign: "center",
                                }}
                              >
                                Action
                              </th>
                            )}

                          </tr>
                        </thead>


                          {/* <Placeholder.Grid
                  rows={10}
                  columns={5}
                  active
                  style={{ paddingLeft: 20, paddingRight: 20, paddingTop: 12 }}
                /> */}
                       {placeholderLoading || searchLoading ? (
  <tbody>
    <tr className="bgSameonHover">
      <td colSpan="6">
        <Placeholder.Grid
          rows={11}
          columns={5}
          active
          style={{ paddingLeft: 20, paddingRight: 20, paddingTop: 12 }}
        />
      </td>
    </tr>
  </tbody>
) : (
  paginatedData.map((file, index) => {
    return (
                              <tbody>
                               <tr
                              className={`hover_cell 
                                ${activeRow === 1 ? "active-row" : ""} 
                                ${hoveredFolderName === file.fileName ? "drag-over" : ""}`}   // ← added
                              draggable={true}
                              onDragStart={(e) => handleDragStart(e, file)}
                              onDragOver={file.isFolder ? handleDragOver : undefined}
                              onDragEnter={file.isFolder ? (e) => handleDragEnterFolder(e, file) : undefined}   // ← renamed & changed
                              onDragLeave={file.isFolder ? handleDragLeaveFolder : undefined}                   // ← added
                              onDragEnd={handleDragEnd}
                              onDrop={file.isFolder ? (e) => handleDrop(e) : undefined}                         // ← changed: no file param
                            >
                                {/* <tr
                                  className={`hover_cell ${activeRow === 1 ? "active-row" : ""}`}
                                  draggable={!file.isFolder} // only files draggable
                                  onDragStart={(e) => {
                                    if (!file.isFolder) handleDragStart(e, file);
                                  }}
                                  onDragOver={file.isFolder ? handleDragOver : undefined}
                                  onDragEnter={file.isFolder ? (e) => handleDragEnter(e, file) : undefined}
                                  onDragLeave={file.isFolder ? (e) => handleDragLeave(e, file) : undefined}
                                  onDragEnd={handleDragEnd}
                                  onDrop={file.isFolder ? (e) => handleDrop(e, file) : undefined}
                                  style={{
                                    transition:
                                      "background-color 0.15s ease, box-shadow 0.15s ease, transform 0.12s ease",
                                    backgroundColor:
                                      file.isFolder && dragOverFolder === file.fileName
                                        ? "rgba(255, 171, 73, 0.08)"
                                        : "transparent",
                                    boxShadow:
                                      file.isFolder && dragOverFolder === file.fileName
                                        ? "0 0 0 2px rgba(255, 171, 73, 0.45)"
                                        : "none",
                                    transform:
                                      file.isFolder && dragOverFolder === file.fileName
                                        ? "scale(1.01)"
                                        : "scale(1)",
                                  }}
                                > */}

                                  {/* <td>
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
                                    ></input>
                                  </td> */}
                                  {/* Checkbox */}
                                  {filenameRedux !== "blackbox" && (
                                    <td>
                                      <input
                                        id="check-Atharva"
                                        type="checkbox"
                                        onChange={() => handleCheckboxChange(file)}
                                        checked={
                                          file.isFolder
                                            ? keys2.includes(file.fileName)
                                            : keys.includes(file.fileName)
                                        }
                                      />
                                    </td>
                                  )}


                                 {/* Icon & FileName */}
                                  <td
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "10px",
                                      cursor:"pointer",
                                      height: "55px",
                                      paddingLeft: filenameRedux === "blackbox" ? "35px" : 0,
                                    }}
                                    onClick={() => {
                                       // Block access inside blackbox folder
                                     
                                        if (trySelectInsteadOfOpen(file)) return;

                                        setErrorMessage2("");
                                        setPreviewFile(file);

                                        const isFolder =
                                          file.fileType === "Folder" ||
                                          file.isFolder === true;

                                        if (isFolder) {
                                          chkFileorFolder(file, file.fileSize);
                                          return;
                                        }

                                         if (filenameRedux === "blackbox") {
                                        showToast(
                                          "warning",
                                          "You cannot open or preview files inside the blackbox folder."
                                        );
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

                                        const imageTypes = ["jpeg", "jpg", "png", "gif", "hevc", "heif", "heic", "svg", "webp", "avif"];
                                        const pdfTypes = ["pdf", "txt"];
                                        const videoTypes = ["mkv", "mp4", "mov", "mpeg", "webm"];
                                        const audioTypes = ["mp3", "wav", "m4a", "ogg", "aac"];
                                        const docTypes = ["doc", "docx", "ppt", "pptx", "pptm", "pps", "ppsx", "xls", "xlsx", "xlsm", "csv", "ods"];

                                        if (videoTypes.includes(fileTypeLower)) {
                                          setModalFile(file.fileName);
                                          handleImageShow();
                                          setVideoSrc(file.fileName);
                                          const index = filedata.findIndex(f => f.fileName === file.fileName);
                                          if (index !== -1) setCurrentImageIndex(index);
                                          return;
                                        }

                                        if (imageTypes.includes(fileTypeLower)) {
                                          setModalFile(file.fileName);
                                          handleImageShow();
                                          getImageInfo(file.fileName);
                                          const index = filedata.findIndex(f => f.fileName === file.fileName);
                                          if (index !== -1) setCurrentImageIndex(index);
                                          return;
                                        }

                                        if (audioTypes.includes(fileTypeLower)) {
                                          playAudioFile(filedata, file.fileName);
                                          return;
                                        }

                                        if (pdfTypes.includes(fileTypeLower)) {
                                          setModalFile(file.fileName);
                                          handleImageShow();
                                          getPdfInfo(file.fileName);
                                          const index = filedata.findIndex(f => f.fileName === file.fileName);
                                          if (index !== -1) setCurrentImageIndex(index);
                                          return;
                                        }

                                        if (docTypes.includes(fileTypeLower)) {
                                          setImageSrc("");
                                          setVideoSrc("");
                                          setAudioSrc("");
                                          setPdfSrc("");
                                          setDocSrc("");
                                          setModalFile(file.fileName);
                                          handleImageShow();
                                          getDocInfo(file.fileName);
                                          const index = filedata.findIndex(f => f.fileName === file.fileName);
                                          if (index !== -1) setCurrentImageIndex(index);
                                          return;
                                        }

                                        handleImageShow();
                                        setErrorMessage2("File format not supported!");
                                        setModalFile(file.fileName);
                                        const index = filedata.findIndex(f => f.fileName === file.fileName);
                                        if (index !== -1) setCurrentImageIndex(index); setModalFile(file.fileName);
                                      }}  
                                  >
                                    <span
                                      className="filename_link"
                                      style={{ cursor: "pointer" }}
                                    >
                                      {/* <img src={file.icon} height={32} /> */}
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
                                        {getTextAfterLastSlash(
                                          customTruncateFileName(file.fileName, 55)
                                        )}
                                      </span>
                                      <span
                                        className="file-path"
                                        title={getTextBeforeLastSlash(file.fileName).replace(/>/g, "/")}
                                      >
                                        {getTextBeforeLastSlash(file.fileName).replace(/>/g, "/")}
                                      </span>
                                    </div>
                                  </td>

                                      {/* File Size */}
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


                                    {/* Modified on */}
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


                                        {/* Action */}
                                {filenameRedux !== "blackbox" && (
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
                                              "translate3d(-321px, -25px, 0px)",
                                          }}
                                          // aria-labelledby="dropdownMenuButton"
                                        >
                                          
                                          <a className="file-container">
                                            <div className="file-icon">
                                              <img
                                                src={getFileIcon(file)}
                                                height={32}
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
                                              {/* <div className="file-name">
                                                {customTruncateFileName(
                                                  removeSlash(file.fileName),
                                                  55
                                                )}
                                              </div> */}
                                              <div
                                                className="file-name"
                                                style={{
                                                  whiteSpace: 'nowrap',
                                                  overflow: 'hidden',
                                                  textOverflow: 'ellipsis',
                                                  maxWidth: '220px',
                                                  display: 'block',
                                                }}
                                                title={getTextAfterLastSlash(file.fileName)}
                                              >
                                                {getTextAfterLastSlash(file.fileName)}
                                              </div>
                                              {getTextBeforeLastSlash(file.fileName) && (
                                                <div
                                                  className="file-path"
                                                  style={{
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    maxWidth: '220px',
                                                  }}
                                                  title={getTextBeforeLastSlash(
                                                    file.fileName
                                                  ).replace(/>/g, "/")}
                                                >
                                                  {getTextBeforeLastSlash(file.fileName).replace(
                                                    />/g,
                                                    "/"
                                                  )}
                                                </div>
                                              )}
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

                                          
                                        {/* {!isSharedValue && file.isFolder === false && (
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
                                                    // marginRight: "8px"
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
                                                    // marginRight: "8px"
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

                                            {/* {file.isFolder === false && (
                                              <a
                                                className="dropdown-item dropdown-item-custom"
                                                href="#"
                                                onClick={() => {
                                                  if (!isPremium) {
                                                    setShowUpgradeModal(true);   // or showUpgradeToast()
                                                    return;
                                                  }
                                                  shareFile(file)}}
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



                                             {/* {file.fileName.includes(".zip") ? (
                                              <a
                                                className={`dropdown-item dropdown-item-custom ${isSharedFolderShortcut(file)
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
                                            !isSharedFolderShortcut(file) && UnzipFile(file)}
                                                }
                                                style={
                                                  isSharedFolderShortcut(file)
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
                                                className={`dropdown-item dropdown-item-custom ${isSharedFolderShortcut(file)
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
              
                                                !isSharedFolderShortcut(file) && ZipFile(file)}
                                                }
                                                style={
                                                  isSharedFolderShortcut(file)
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
                                            )} */}
                                            {file.fileName.includes(".zip") ? (
                                                            <a
                                                              className={`dropdown-item dropdown-item-custom ${isSharedFolderShortcut(file)
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
                                                          !isSharedFolderShortcut(file) && UnzipFile(file)}
                                                              }
                                                              style={
                                                                isSharedFolderShortcut(file)
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
                                                              className={`dropdown-item dropdown-item-custom ${isSharedFolderShortcut(file)
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
                                            
                                                              !isSharedFolderShortcut(file) && ZipFile(file)}
                                                              }
                                                              style={
                                                                isSharedFolderShortcut(file)
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
                                                setPubPri2(file.ACL);
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
                                              className={`dropdown-item dropdown-item-custom ${
                                                isSharedFolderShortcut(file)
                                                  ? "disabled blur-effect"
                                                  : ""
                                              }`}
                                              href="#"
                                              onClick={() =>
                                                !isSharedFolderShortcut(file) && UnzipFile(file)
                                              }
                                              style={
                                                isSharedFolderShortcut(file)
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
                                              className={`dropdown-item dropdown-item-custom ${
                                                isSharedFolderShortcut(file)
                                                  ? "disabled blur-effect"
                                                  : ""
                                              }`}
                                              href="#"
                                              onClick={() =>
                                                !isSharedFolderShortcut(file) && ZipFile(file)
                                              }
                                              style={
                                                isSharedFolderShortcut(file)
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
                                            className={`dropdown-item dropdown-item-custom ${
                                              isSharedFolderShortcut(file)
                                                ? "disabled blur-effect"
                                                : ""
                                            }`}
                                            href="#"
                                            onClick={() =>
                                              !isSharedFolderShortcut(file) &&
                                              downloadFile(file)
                                            }
                                            style={
                                              isSharedFolderShortcut(file)
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
                                            className="dropdown-item dropdown-item-custom"
                                            href="#"
                                            onClick={() =>
                                              handleOpenPopover(file)
                                            }
                                          >
                                            <img
                                              src={renameIcon}
                                              alt="Rename"
                                              className="dropdown-icon-list"
                                            />
                                            Rename
                                          </a>
                                          {/* {file.isFolder === false && (
                                          <a
                                            className="dropdown-item dropdown-item-custom"
                                            href="#"
                                            onClick={() =>
                                              handleAddToFavorites(file)
                                            }
                                          >
                                            <img
                                              src={favouritesIcon}
                                              alt="Add to Favorites"
                                              className="dropdown-icon-list"
                                            />
                                            Add to Favorites
                                          </a>
                                        )} */}
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
                                            onClick={() =>
                                              handleOpenDeletePopover(file)
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
                                  )}
                                </tr>
                              </tbody>
                            );
                          })
                        )}
                      </table>
                    </div>
                    )
                  ) : (
                    <>
                      {(placeholderLoading || paginatedData.length > 0) && (
                        <>
                      <th style={{ width: "40px", textAlign: "center" }}>
                       {filenameRedux !== "blackbox" && (
                         <input
                          id="check-Atharva"
                          type="checkbox"
                          onChange={handleSelectAllToggle}
                          checked={isSelectAll}
                        />
                       )}
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
                        ) : paginatedData.length === 0 ? (
                        <EmptyFilesState
                          isFiltered={
                            selectedFileTypes.length > 0 ||
                            query.trim().length > 0
                          }
                        />
                      ) : (
                          paginatedData.map((file, index) => (
                            <div
                              // className={`grid-item2 ${
                              //   draggedItem?.fileName === file.fileName
                              //     ? "dragging"
                              //     : ""
                              // }`}
                              className={`grid-item2 
                                ${activeRow === 1 ? "active-row" : ""} 
                                ${hoveredFolderName === file.fileName ? "border_highlight" : ""} 
                                ${draggedItem?.fileName === file.fileName ? "dragging" : ""}`}
                              key={index}
                              style={{ cursor: "pointer" }}
                              // draggable={true}
                              // onDragStart={(e) => handleDragStart(e, file)}
                              // onDragOver={(e) => {
                              //   e.preventDefault(); // Necessary to allow dropping
                              //   if (file.isFolder)
                              //     e.dataTransfer.dropEffect = "move";
                              // }}
                              // onDragEnter={(e) => {
                              //   if (file.isFolder) e.preventDefault();
                              // }}
                              // onDragEnd={handleDragEnd}
                              // onDrop={(e) => {
                              //   if (file.isFolder) handleDrop(e, file);
                              // }}
                              draggable={true}
                              onDragStart={(e) => handleDragStart(e, file)}
                              onDragOver={file.isFolder ? handleDragOver : undefined}
                              onDragEnter={file.isFolder ? (e) => handleDragEnterFolder(e, file) : undefined}   // ← renamed & changed
                              onDragLeave={file.isFolder ? handleDragLeaveFolder : undefined}                   // ← added
                              onDragEnd={handleDragEnd}
                              onDrop={file.isFolder ? (e) => handleDrop(e) : undefined}
                              onClick={(event) => {
                               
                                if (
                                  !event.target.closest(".dropdown-toggle") &&
                                  !event.target.closest(".checkbox-input") &&
                                  !event.target.closest(".custom-dropdown-menu")
                                ) {
                                  if (trySelectInsteadOfOpen(file)) return;

                                  setErrorMessage2("");

                                  // FOLDER CHECK FIRST 🚀
                                  if (file.isFolder === true) {
                                    chkFileorFolder(file, file.fileSize);
                                    return;  // Exit early
                                  }

                                   if (filenameRedux === "blackbox") {
                                        showToast(
                                          "warning",
                                          "You cannot open or preview files inside the blackbox folder."
                                        );
                                        return;
                                      }

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
                                

                                   } 
                                  //  else if (
                                  //     [
                                  //       "mp3",
                                  //       "m4a",
                                  //       "MP3",
                                  //       "wav",
                                  //       "WAV",
                                  //       "ogg",
                                  //       "OGG",
                                  //       "aac",
                                  //       "AAC",
                                  //     ].includes(file.fileType)
                                  //   ) {
                                  //     // setCurrentAudioFile(file.fileName);
                                  //     // setShowAudioPlayer(true);
                                  //     // dispatch(playAudio(file.fileName));
                                  //     const audioFiles = filedata.filter(
                                  //                 f => ["mp3", "m4a", "wav", "aac", "ogg"].includes(f.fileType.toLowerCase())
                                  //               ).map(f => f.fileName);

                                  //               const currentIndex = audioFiles.findIndex(name => name === file.fileName);

                                  //               dispatch(setAudioQueue({ queue: audioFiles, index: currentIndex }));

                                  //             // }
                                  //   }

                                  else if (
                                    ["mp3", "m4a", "wav", "aac", "ogg"].includes(file.fileType?.toLowerCase() || "")
                                  ) {
                                    playAudioFile(filedata, file.fileName);
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
                              {filenameRedux !== "blackbox" && (
                              <input
                                id="check-Atharva"
                                type="checkbox"
                                style={{
                                position: "absolute", top: "8px", left: "8px"
                              }}
                                className="checkbox-input"
                                onClick={(event) => event.stopPropagation()} // Stops click from bubbling to parent
                                onChange={() => handleCheckboxChange(file)}
                                checked={
                                  file.isFolder
                                    ? keys2.includes(file.fileName)
                                    : keys.includes(file.fileName)
                                }
                              />
                              )}
                              {/* Three Dots Menu */}

{filenameRedux !== "blackbox" && (
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
                                      stroke-width="2"
                                      stroke-linecap="round"
                                      stroke-linejoin="round"
                                      class="feather feather-more-vertical"
                                    >
                                      <circle cx="12" cy="12" r="1"></circle>
                                      <circle cx="12" cy="5" r="1"></circle>
                                      <circle cx="12" cy="19" r="1"></circle>
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
                                              e.target.src = file.isFolder
                                                ? "/images/icons/Folder.svg"
                                                : "/images/icons/doc.svg";
                                          }}
                                          alt="file icon"
                                          height={32}
                                        />
                                      </div>
                                      <div className="file-details">
                                        {/* <div className="file-name">
                                          {customTruncateFileName(
                                            removeSlash(file.fileName),
                                            55
                                          )}
                                        </div> */}
                                        <div
                                                className="file-name"
                                                style={{
                                                  whiteSpace: 'nowrap',
                                                  overflow: 'hidden',
                                                  textOverflow: 'ellipsis',
                                                  maxWidth: '220px',
                                                  display: 'block',
                                                }}
                                                title={getTextAfterLastSlash(file.fileName)}
                                              >
                                                {getTextAfterLastSlash(file.fileName)}
                                              </div>
                                        {getTextBeforeLastSlash(file.fileName) && (
                                          <div
                                            className="file-path"
                                            style={{
                                              whiteSpace: 'nowrap',
                                              overflow: 'hidden',
                                              textOverflow: 'ellipsis',
                                              maxWidth: '220px',
                                            }}
                                            title={getTextBeforeLastSlash(
                                              file.fileName
                                            ).replace(/>/g, "/")}
                                          >
                                            {getTextBeforeLastSlash(file.fileName).replace(
                                              />/g,
                                              "/"
                                            )}
                                          </div>
                                        )}
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
                                          className={`dropdown-item dropdown-item-custom ${isSharedFolderShortcut(file)
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
                                      !isSharedFolderShortcut(file) && UnzipFile(file)}
                                          }
                                          style={
                                            isSharedFolderShortcut(file)
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
                                          className={`dropdown-item dropdown-item-custom ${isSharedFolderShortcut(file)
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
        
                                          !isSharedFolderShortcut(file) && ZipFile(file)}
                                          }
                                          style={
                                            isSharedFolderShortcut(file)
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
                                          setPubPri2(file.ACL);
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
                                        className={`dropdown-item dropdown-item-custom ${
                                          isSharedFolderShortcut(file)
                                            ? "disabled blur-effect"
                                            : ""
                                        }`}
                                        href="#"
                                        onClick={() =>
                                          !isSharedFolderShortcut(file) && UnzipFile(file)
                                        }
                                        style={
                                          isSharedFolderShortcut(file)
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
                                        className={`dropdown-item dropdown-item-custom ${
                                          isSharedFolderShortcut(file)
                                            ? "disabled blur-effect"
                                            : ""
                                        }`}
                                        href="#"
                                        onClick={() =>
                                          !isSharedFolderShortcut(file) && ZipFile(file)
                                        }
                                        style={
                                          isSharedFolderShortcut(file)
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
                                      className={`dropdown-item dropdown-item-custom ${
                                        isSharedFolderShortcut(file)
                                          ? "disabled blur-effect"
                                          : ""
                                      }`}
                                      href="#"
                                      onClick={() =>
                                        !isSharedFolderShortcut(file) && downloadFile(file)
                                      }
                                      style={
                                        isSharedFolderShortcut(file)
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
                                    {/* // )} */}
                                    <a
                                      className="dropdown-item dropdown-item-custom"
                                      href="#"
                                      onClick={() => handleOpenPopover(file)}
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
                                      onClick={() =>
                                        handleOpenDeletePopover(file)
                                      }
                                    >
                                      <img
                                        src={deleteIcon2}
                                        alt="Delete"
                                        className="dropdown-icon-list"
                                      />
                                      {/* Delete4 */}
                                      Delete
                                    </a>
                                  </div>
                                </div>
                              </div>
)}

                              {/* File Icon / public image preview (visible cards only) */}
                              <CardFilePreview
                                file={file}
                                getIcon={getFileIcon}
                              />

                              <div style={{padding:"18px"}}>
                                {/* File Name */}
                                <div
                                  className="file-name2"
                                  style={{
                                    cursor: "pointer",
                                    whiteSpace: "nowrap", // Prevents text wrapping
                                    overflow: "hidden", // Hides overflow
                                    textOverflow: "ellipsis", // Adds "..."
                                    maxWidth: "100%", // Ensures it stays within the container
                                  }}
                                  title={getTextAfterLastSlash(file.fileName)}
                                >
                                  {customTruncateFileName(
                                    getTextAfterLastSlash(file.fileName),
                                    55
                                  )}
                                </div>
                                {getTextBeforeLastSlash(file.fileName) && (
                                  <div
                                    className="file-path"
                                    style={{
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      maxWidth: "100%",
                                    }}
                                    title={getTextBeforeLastSlash(
                                      file.fileName
                                    ).replace(/>/g, "/")}
                                  >
                                    {getTextBeforeLastSlash(file.fileName).replace(
                                      />/g,
                                      "/"
                                    )}
                                  </div>
                                )}

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
                    </>
                  )}
                </div>



        

              {isWhisperClicked && (
                <MoveFilePopup
                  moveKey={movedFile}
                  source={query.trim() ? "" : path}
                  onClose={handleMClose}
                  files={keys}
                  folders={keys2}
                  reloadAfterTast={refreshFolderListWithSkeleton}
                  showToast={showToast}
                />
              )}

              {moveFol && (
                <MoveFolderPopup
                  moveKey={movedFol}
                  source={query.trim() ? "" : path}
                  onClose={handleMFClose}
                  files={keys}
                  folders={keys2}
                   reloadAfterTast={handleMClose}
                  onRenameSuccess={refreshFolderListWithSkeleton}
                  showToast={showToast}
                />
              )}

              {showFolderModal && (
                <SelectFolderModal
                  onClose={() => setShowFolderModal(false)}
                  selectedFile={currentFileToZip}
                  onSelect={(selectedPath) => {
                    // console.log("Folder selected:", selectedPath); // Debugging log
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
                  source={query.trim() ? "" : path}
                  onClose={handleCClose}
                  files={keys}
                  fileSize={copiedFileSize}
                  setTriggerUpdate={setTriggerUpdate}
                  onCopySuccess={reloadAfterTast}
                  showToast={showToast}
                />
              )}


            </div>
          </div>

          <FilesPaginationFooter
            totalEntries={totalEntries || filedata.length}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={pageFilter}
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
              fileName={modalFile}
              docSrc={docSrc}
              triggerUpdate={triggerUpdate}
  setTriggerUpdate={setTriggerUpdate}
        isPublic={modalFile?.isPublic}
        setModalFile={setModalFile}
        // onRenameSuccess={() => getFolderFiles(selectedFolder)}
        onRenameSuccess={() => reloadAfterTast()}
        previewFile={previewFile}
        
            />

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

                      <UploadFilesPreview files={files} onRemove={removeFile} />

                    </section>
                  )}
                </Dropzone>
              
              
                {!isSharedValue && (
                  <div className="filesize-warning-div">
                    <span className="filesize-warning-span">
                      <div className="warning-icon">!</div>
                      {`Storage left: ${(remainingBytes / 1_000_000_000).toFixed(2)} GB`}
                    </span>
                    <p className="visibility-label">Set Visibility:</p>
                  </div>
                )}



                <ul className="radio_checkbox_list mt-0">
                  <li>
                    <input
                      type="radio"
                      name="FileUpload"
                      id="FilePublic"
                      value="public"
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
                      onChange={handlePubChange}
                      checked={pubpri === "private"}
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

                   {/* NEW: Convert Files Button */}
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

              <TabPanel>
                <UploadFolderPanel
                  key={openFileUploadModal ? "folder-open" : "folder-closed"}
                  remainingBytes={remainingBytes}
                  skipStorageCheck={Boolean(isSharedValue)}
                  onCancel={handleCloseFileUploadModal}
                  onUpload={uploadFolder}
                />
              </TabPanel>

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
                    action="javascript:void(0);"
                    method="POST"
                  >
                    <input
                      className="folder-input"
                      type="text"
                      name="fname"
                      id="folname"
                      pattern="[a-zA-Z0-9_\- ]{1,}"
                      required
                      placeholder="Enter Folder Name"
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
                        className=" btn_width_same ripple_effect rename_btn ok"
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
                pattern="[a-zA-Z0-9_\- ]{1,}"
                required
                placeholder="Enter Folder Name"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    e.stopPropagation();
                    createJustFolder(e);
                  }
                }}
              />
              {folderFieldError && (
                <p className="error-message">{folderFieldError}</p>
              )}

              <div className="rename_buttons mt-4">
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
      <DownloadModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        onDownload={handleDownload}
        openPathSelectionModal={openPathSelectionModal}
        path={path} // Pass path here
        reloadAfterTast={reloadAfterTast}
      />

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
            setPubPri2(fileToShare.ACL);
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



      {/* File Conversion Modal */}
      {showConversionModal && (
        <FileConversionModal
          isOpen={showConversionModal}
          onClose={() => setShowConversionModal(false)}
          files={files}
          onFilesUpdated={handleFilesConverted}
        />
      )}


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

      {loader_Recycle && (<LoaderRecycleBin/>)}

    </>
  );
};

export default NestedPage;
// rrrrreloadAfterTast