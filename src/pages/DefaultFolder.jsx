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
import {
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { DownloadContext } from "./DownloadContext";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import Logo from "../images/logo.png";
import sharedIcon from "../images/shared_icon.svg";
import { resolveFileIconPath } from "../utils/fileIcon";
import { buildFileStreamUrl, preloadStreamedImage } from "../utils/fileStream";
import FileInfoModal from "../components/FileInfoModal";
import VisibilityModal from "../components/VisibilityModal";
import RenameModal from "../components/RenameModal";
import FileShareModal from "../components/FileShareModal";
import { gatePremiumSort } from "../utils/premiumSort";
import CardFilePreview from "../components/CardFilePreview";
import useListPageSize from "../hooks/useListPageSize";
import useFileSearch from "../hooks/useFileSearch";
import {
  buildDefaultFileListing,
  mergeFilesWithSharedFolders,
} from "../utils/mergeFileListing";
import { useSessionEndCleanup } from "../hooks/useSessionEndCleanup";
import FileSearchBar from "../components/FileSearchBar";
import fullscreeen from "../images/mediaPlayer/fullscreen.svg";
import zoomin from "../images/mediaPlayer/add-button.svg";
import zoomout from "../images/mediaPlayer/subtracting-button.svg";
import deleteIcon from "../images/mediaPlayer/trash1.svg";
import moveIcon from "../images/move.png";
import Cookies from "js-cookie";
import IconJPG from "../images/icon-jpg.svg";
import IconPNG from "../images/icon-png.svg";
import IconPSD from "../images/icon-psd.svg";
import IconPDF from "../images/pdf.svg";
import IconFolder from "../images/folder.svg";
import IconVideo from "../images/video.svg";
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
import favouritesIcon from "../images/DropdownIcons/favouritesIcon.svg";
import linkIcon from "../images/DropdownIcons/linkIcon.svg";
import moveIcon2 from "../images/DropdownIcons/MoveIcon.svg";
import renameIcon from "../images/DropdownIcons/renameIcon.svg";
import shareIcon from "../images/DropdownIcons/shareIcon.svg";
import eyeIcon from "../images/DropdownIcons/eyeIcon.svg";
import loaderGif from "../images/Loaders/Animation4.gif";
import Dropzone from "react-dropzone";
import createFolderPopup from "../images/createFolderPopup.svg";
import { FaCheckCircle } from "react-icons/fa"; //<FaCheckCircle />
import { BsXCircleFill } from "react-icons/bs"; // <BsXCircleFill />
import { IoIosInformationCircle } from "react-icons/io"; // <IoIosInformationCircle />
import { FaExclamationTriangle } from "react-icons/fa"; // <FaExclamationTriangle />
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
import { useNavigate, useParams } from "react-router-dom";
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
} from "../store/fileSlicer";
import { usePlayAudio } from "../hooks/usePlayAudio";
import { isAudioExtension } from "../utils/audioPlayer";
import DownloadModal from "./DownloadModal/DownloadModal";
import SelectFolderModal from "./DownloadModal/SelectFolderModal";
let c = 1;

//Anurag Imports

const DefaultFolder = () => {
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const { folderName } = useParams();
  console.log("folderName", folderName);
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
    getUpload,
    isPausing,
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
  const [showDropdown, setShowDropdown] = useState(false);

  const [isVideo, setisVideo] = useState(false);
  const [audioSrc, setAudioSrc] = useState("");
  const [isAudio, setIsAudio] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [showFTPopup, setShowFTPopup] = useState(false);
  const [entriesnum, setEntriesnum] = useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const nav = useNavigate();
  const subscription = useSelector((state) => state.subscription.subscription);
  const isPremium =
    !!subscription &&
    Array.isArray(subscription.entitlement_ids) &&
    subscription.entitlement_ids.length > 0;

  useEffect(() => {
    const token = sessionStorage.getItem("number");
    console.log("token", token);
    if (!token) {
      alert("Session expired. Please login again.");
      nav("/Login");
    }
  }, [nav]);

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
  const [downloadPopup, setDownloadpopup] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null); // Store the file to download
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
  }, [showImage,codePopup]);

  const [endIndex, setEndIndex] = useState(0);
  const [filedata, setFileData] = useState([]);
  const [allEntries, setAllEntries] = useState([]); // This holds all data permanently
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useListPageSize();
  const [totalEntries, setTotalEntries] = useState(0);

  const totalPages = Math.ceil(totalEntries / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalEntries);
  const isNextPage = currentPage < totalPages;

  useEffect(() => {
    getFileData(); // Initial load
    // console.log("On root page!!!!!!!");
    dispatch(setIsSharedFalse());
  }, [folderName]);

  useEffect(() => {
    // Whenever currentPage or itemsPerPage changes, update displayed data
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const slicedData = allEntries.slice(startIndex, endIndex);
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

  const [moveFol, setMoveFol] = useState(false);

  const fileTypes = ["pdf", "jpg", "jpeg", "png", "mov", "mp3", "mp4"];
  const [selectedFileTypes, setSelectedFileTypes] = useState([]);
  const [view, setView] = useState(localStorage.getItem("view") || "list");

  const toggleView = (selectedView) => {
    setView(selectedView);
    localStorage.setItem("view", selectedView); // Save selection in localStorage
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
    getFileData(1);
    setIsWhisperClicked(false);
    setKeys([]);
    setKeys2([]);
    setCurrentPage(1);
    getLatestFolderList();
  };
  const handleMFClick = (name) => {
    setMoveFol(true);
    setMovedFol(name);
    setCurrentPage(1);
  };
  const handleMFClose = () => {
    dispatch(resetFolderList());
    getFileData(1);
    setMoveFol(false);
    setEndIndex(1);
  };
  // Copy File code
  const handleCClick = (name) => {
    setIsCWhisperClicked(true);
    setCopiedFile(name);
    setCurrentPage(1);
  };
  const handleCClose = () => {
    dispatch(resetFolderList());
    setIsCWhisperClicked(false);
    setKeys([]);
  };

  // const location = useLocation();

  // useEffect(() => {
  //   if (location.pathname === "/file-system/Files") {
  //     console.log("/file-system/Files value changed ")
  //     dispatch(setIsSharedValue(false));
  //   }
  // }, [location.pathname, dispatch]);

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
        return newKeys2;
      });
    } else {
      // If the file is not a folder, update the keys list
      setKeys((prevKeys) => {
        const isChecked = prevKeys.includes(file.fileName);
        const newKeys = isChecked
          ? prevKeys.filter((f) => f !== file.fileName)
          : [...prevKeys, file.fileName];
        return newKeys;
      });
    }
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
    try {
      console.log(keys, keys2);

      // Check if any selected item is a shared folder
      const hasSharedFolders = filedata.some(
        (file) => file.isShared && keys2.includes(file.fileName)
      );

      if (hasSharedFolders) {
        // showToast("error", "Shared folders cannot be deleted.");
        return;
      }

      // Perform delete for files if keys have items
      if (keys.length > 0) {
        const res = await axios.delete(`${apiUrl}delete-file`, {
          data: { keys: keys }, // Send keys for files
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        // console.log("Files deleted:", res.data);
        showToast("success", "Files deleted Successfully!");
      }

      // Perform delete for folders if keys2 have items
      if (keys2.length > 0) {
        const resFolders = await axios.delete(`${apiUrl}delete-folder`, { ...LONG_RUNNING_AWS_REQUEST_OPTIONS, 
          data: { folderName: keys2 }, // Send keys for folders
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        // console.log("Folders deleted:", resFolders.data);
        showToast("success", "Folder deleted Successfully!");
      }

      // After successful delete, reset states and refresh data
      getLatestFolderList();
      setIsSelectAll(false);
      setSelectStatus(false);
      getFileData(1); // Refresh file data
      setCurrentPage(1);
      getRootFolderSize(); // Refresh folder size
      setKeys([]); // Reset keys for files
      setKeys2([]); // Reset keys for folders
    } catch (error) {
      showToast("error", "Some error has occurred");
    }
  };

  useEffect(() => {
    if (token) {
      // console.log("Current page value is", currentPage);

      dispatch(resetUserData());
      dispatch(resetCounter());
    }
  }, [token]);

  useEffect(() => {
    getFileData();
    getRootFolderSize()
  }, [folderName]);
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
  const applyFilter = async () => {
    try {
      if (selectedFileTypes.length > 0) {
        // Filter applied — only fetch files matching types
        const response = await axios.get(`${apiUrl}get-all-files`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          params: {
            fileTypes: selectedFileTypes.join(","),
          },
        });
  
        setFileData(response.data);
      } else {
        // No filter selected — fetch both shared folders and all files
        const [sharedFoldersResponse, filesResponse] = await Promise.all([
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
  
        const sharedFolders = sharedFoldersResponse.data.result || [];
        const files = filesResponse.data.result || [];

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

        setFileData(combinedData.slice(0, itemsPerPage)); // optional pagination
      }
    } catch (error) {
      console.error(`Error applying filter: ${error}`);
    }
  
    closePopup();
  };
  
  

  const handleFTCheckboxChange = (fileType) => {
    setSelectedFileTypes(
      (prevSelected) =>
        prevSelected.includes(fileType)
          ? prevSelected.filter((type) => type !== fileType) // Remove if already selected
          : [...prevSelected, fileType] // Add if not selected
    );
  };

  const handleFTypeSelect = (eventKey) => {
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
      setSelectedFilter("By Size(Ascending)");
      sizeFilter1();
    } else if (eventKey === "size-filter2") {
      setSelectedFilter("By Size(Descending)");
      sizeFilter2();
    } else if (eventKey === "date-filter1") {
      setSelectedFilter("By Date(Oldest)");
      dateFilter1();
    } else if (eventKey === "date-filter2") {
      setSelectedFilter("By Date(Newest)");
      dateFilter2();
    }
  };

  // Common function to fetch and combine shared folders with sorted files
  const fetchWithSharedFolders = async (apiParams) => {
    let sharedFolders = [];
    let files = [];
  
    if (isGoogleAuth) {
      const [sharedFoldersResponse, filesResponse] = await Promise.all([
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
  
      sharedFolders = sharedFoldersResponse.data.result || [];
      files = filesResponse.data || [];
    } else {
      const filesResponse = await axios.get(`${apiUrl}get-all-files`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        params: apiParams,
      });
  
      files = filesResponse.data || [];
    }
  
    return mergeFilesWithSharedFolders(files, sharedFolders, {
      isGoogleAuth,
      sortParams: apiParams,
      fileTypes: apiParams?.fileTypes,
    });
  };
  

  const nameFilter1 = async () => {
    try {
      const combinedData = await fetchWithSharedFolders({ ascending: true });
      setFileData(combinedData);
      setEndIndex(1);
    } catch (error) {
      console.error(`Error in nameFilter1: ${error}`);
    }
  };

  const nameFilter2 = async () => {
    try {
      const combinedData = await fetchWithSharedFolders({ ascending: false });
      setFileData(combinedData);
      setEndIndex(1);
    } catch (error) {
      console.error(`Error in nameFilter2: ${error}`);
    }
  };

  const sizeFilter1 = async () => {
    try {
      const combinedData = await fetchWithSharedFolders({ sortSize: true });
      setFileData(combinedData);
      setEndIndex(1);
    } catch (error) {
      console.error(`Error in sizeFilter1: ${error}`);
    }
  };

  const sizeFilter2 = async () => {
    try {
      const combinedData = await fetchWithSharedFolders({ sortSize: false });
      setFileData(combinedData);
      setEndIndex(1);
    } catch (error) {
      console.error(`Error in sizeFilter2: ${error}`);
    }
  };

  const dateFilter1 = async () => {
    try {
      const combinedData = await fetchWithSharedFolders({ sortByDate: "asc" });
      setFileData(combinedData);
      setEndIndex(1);
    } catch (error) {
      console.error(`Error in dateFilter1: ${error}`);
    }
  };

  const dateFilter2 = async () => {
    try {
      const combinedData = await fetchWithSharedFolders({ sortByDate: "desc" });
      setFileData(combinedData);
      setEndIndex(1);
    } catch (error) {
      console.error(`Error in dateFilter2: ${error}`);
    }
  };

  const closePopup = () => setShowFTPopup(false);
  const [continuationToken, setContinuationToken] = useState("");
  // const [isNextPage, setIsNextPage] = useState(false);
  const [isNextNextPage, setIsNextNextPage] = useState(false);
  const [showGoogleAuthPopup, setShowGoogleAuthPopup] = useState(false);

  //Anurag Get Files
  // Modify your getFileData function to ensure it correctly handles pagination
  const getFileData = async () => {
    try {
      // Wait until folderName is available
      if (!folderName) {
        console.log("Waiting for folderName...");
        return; // Exit early if it's not ready — you can call this function again when it's set
      }
  
      console.log("Fetching files for folder:", folderName);
  
      const response = await axios.get(`${apiUrl}getFolder`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        params: { folderPath: folderName },
      });
  
      const files = response.data.result || [];
  
      setAllEntries(files);
      setTotalEntries(files.length);
      setFileData(files.slice(0, itemsPerPage));
    } catch (error) {
      console.error("Error fetching files:", error);
  
      if (error.response?.data?.error === "jwt expired") {
        alert("Session expired. Please login again.");
        setTimeout(() => {
          nav("/Login");
        }, 0);
      }
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
      console.log("It's a folder.");
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

  //Get pagination last Index
  // const getLastIndex = async() => {
  //   try {
  //     console.log("Files are loaded...");

  //     const response = await axios.get(`${apiUrl}getAllObjectsNew`, {
  //       headers: {
  //         'Authorization': `Bearer ${token}`,
  //         'Content-Type': 'application/json',
  //       },
  //       params: {
  //         page: 10000000,
  //         limit: 10
  //       },
  //     });

  //     setEndIndex(response.data.totalPages);
  //     setEntriesnum(response.data.totalEntries);

  //     console.log("Total pages are", response.data.totalPages,"Total entries",response.data.totalEntries,"Endindex value is",endIndex);

  //   } catch (error) {
  //     console.error(`There's an error at ${error}`);
  //   }
  // }

  //Anurag get into folder

  const getFolderFiles = async (foldername, size) => {
    try {
      const cleanfoldername = checkLastHash(foldername.fileName);
      console.log("cleanfoldername", cleanfoldername);
      console.log("foldername", foldername);

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
      console.log("res", res);
      const exactFile = removeSlash2(file.fileName);
      const fileType = res.headers["content-type"];
      const metadata = res.headers["x-file-metadata"];
      console.log("metadata", metadata);
      setCurrentFile(fileTypeExtractor(fileType));

      const blob = new Blob([res.data], { type: fileType });
      const url = window.URL.createObjectURL(blob);
      console.log(fileType);
      if (extractFirstPart(fileType) === "video") {
        console.log("Handling video...");
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
        console.log("Handling image...");
      } else if (fileType === "application/pdf") {
        console.log("Handling pdf...");

        setOpenPDFModal(true);
        setPdfSrc(url);
        console.log(pdfSrc);
      } else if (extractFirstPart(fileType) === "text") {
        console.log("Handling text file...");
        setOpenPDFModal(true);
        setPdfSrc(url);
        console.log(pdfSrc);
      } else if (extractFirstPart(fileType) === "audio") {
        setIsAudio(true);

        console.log("Handling audio...");
        setAudioSrc(url);
      } else {
        console.log("Handling Common file...");
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
    console.log("extension", extension, "first", inputValue);
  };

  const handleClosePopover = () => {
    setActiveRow(null);
    setRenamepop(false);
  };

  const handlePChange = (e) => {
    console.log("public private", e.target.value);
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

  const handleFileRename = async (oldkey, newkey, file) => {
    console.log("Started to rename files, folders...");
    if (file?.isFolder == true) {
      console.log("Folder", file);

      try {
        console.log(token);
        console.log("oldkey", oldkey);
        console.log("new wrong key", newkey);
        const res = await axios.post(
          `${apiUrl}rename-folder`,
          {
            oldFolderName: oldkey,
            newFolderName: newkey,
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
      }
    } else {
      try {
        console.log("File");
        console.log(oldkey);
        console.log(newkey);
        const res = await axios.post(
          `${apiUrl}rename-file`,
          {
            oldKey: oldkey,
            newKey: newkey,
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
        showToast("error", `There's an error while renaming file!`);
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
        console.log(res.data);
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

  useSessionEndCleanup(() => {
    setShowImage(false);
    setCodePopup(false);
    setIsWhisperClicked(false);
    setIsCWhisperClicked(false);
    setMoveFol(false);
    setInfoShower(false);
    setRenamepop(false);
    setDeletepop(false);
  });

  //Anurag  Delete File or Folder
  const handleFileDelete = async (file) => {
    console.log("Started to delete files, folder...");
    console.log(file);

    if (file?.isFolder == true) {
      console.log("folder");
      console.log(file);
      try {
        const res = await axios.delete(`${apiUrl}delete-folder`, { ...LONG_RUNNING_AWS_REQUEST_OPTIONS, 
          data: { folderName: [checkLastHash(file.fileName)] },
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        getLatestFolderList();
        handleCloseDeletePopover();
        getFileData(currentPage);
        getRootFolderSize();
        showToast("success", "Folder deleted successfully");
      } catch (error) {
        showToast("error", `There's an error while deleting folder`);
      }
    } else {
      console.log("file");
      console.log(file.fileName);
      const deleteKey = file.fileName;

      const dataToSend = {
        keys: [deleteKey], // This will correctly pass an array with the file name
      };
      try {
        const res = await axios.delete(`${apiUrl}delete-file`, {
          data: dataToSend,
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        });
        showToast("success", "File deleted successfully");
        handleCloseDeletePopover();
        getFileData(currentPage);
        getRootFolderSize();
      } catch (error) {
        showToast("error", `There's an error while deleting file!`);
      }
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

  // Functions to handle modal visibility
  const handleOpenFileUploadModal = () => setOpenFileUploadModal(true);

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

      console.log(
        isShared ? "Shared Folder list is" : "Root Folder list is",
        response.data
      );

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
      console.log("Second Root Folder list is", response.data);
      const folders = response.data;
      setFolderList(folders);
      let arr = [folders];
      console.log("vav", arr);
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
    const tokenSource = axios.CancelToken.source();
  
    // Add download and immediately close the popup
    addDownload(downloadId, fileName, tokenSource, isFolder);
    setDownloadpopup(false);
  
    isSetLoading(true);
    setProgress(0);
    cancelToken.current = tokenSource;
  
    try {
      const endpoint = isFolder ? "download-folder" : "download-file";
      const res = await axios.get(`${apiUrl}${endpoint}`, {
        params: { filePath: fileName },
        headers: { Authorization: `Bearer ${token}` },
        responseType: "arraybuffer",
        cancelToken: tokenSource.token,
        onDownloadProgress: (progressEvent) => {
          let percentCompleted;
          if (progressEvent.lengthComputable) {
            percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
          } else {
            percentCompleted = Math.min((progress || 0) + 10, 90);
          }
          setProgress(percentCompleted);
          updateDownloadProgress(downloadId, percentCompleted);
        },
      });
  
      const blob = new Blob([res.data], { type: res.headers["content-type"] });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
  
      setProgress(100);
      updateDownloadProgress(downloadId, 100);
  
      setTimeout(() => {
        isSetLoading(false);
        setProgress(0);
        removeDownload(downloadId);
      }, 500);
    } catch (error) {
      if (axios.isCancel(error)) {
        console.warn("Download canceled:", error.message);
      } else {
        alert("Error downloading file. Please try again.");
      }
      isSetLoading(false);
      setProgress(0);
      removeDownload(downloadId);
    }
  };
  

  const handleCancelDownload = () => {
    if (cancelToken.current) {
      cancelToken.current.cancel("Download canceled by user.");
    }
    isSetLoading(false);
    setProgress(0);
    setDownloadpopup(false);
  };

  // const downloadFile = (file) => {
  //   console.log("started to download...");

  //   if (file?.isFolder == true) {
  //     console.log("It's a folder.");
  //     return;
  //   }

  //   setDownloadpopup(true); // Show the modal immediately
  //   isSetLoading(true); // Indicate that the file is being fetched

  //   console.log("It's a file.");
  //   try {
  //     const getDownLink = async () => {
  //       const res = await axios.get(`${apiUrl}getFile`, {
  //         params: { filePath: removeSlash2(file.fileName) },
  //         headers: { Authorization: `Bearer ${token}` },
  //         responseType: "arraybuffer",
  //       });

  //       console.log("Headers", res.headers);

  //       const exactFile = removeSlash2(file.fileName);
  //       const fileType = res.headers["content-type"];

  //       const blob = new Blob([res.data], { type: fileType });
  //       const url = window.URL.createObjectURL(blob);

  //       console.log(fileType);

  //       const metadata = res.headers["x-file-metadata"];
  //       if (metadata) {
  //         const parsedMetadata = JSON.parse(metadata);
  //         console.log("X-File-Metadata:", parsedMetadata);
  //       } else {
  //         console.warn("x-file-metadata header is not present.");
  //       }

  //       setDownloadLink({ url, name: exactFile });
  //       setLoading(false); // Hide the loading state when the file is ready
  //     };

  //     getDownLink();
  //   } catch (error) {
  //     console.error("Error fetching file:", error);
  //     isSetLoading(false); // Hide loading state in case of an error
  //   }
  // };


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

  const previewCodeFile = async (file) => {
    try {
      const res = await axios.get(`${apiUrl}getFile`, {
        params: { filePath: file.fileName },
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "text", // Expecting raw text source code
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
      setCodeContent(res.data);
      setCodePopup(true);
    } catch (error) {
      console.error("Error fetching file:", error);
    }
  };

  const [showFolderModal, setShowFolderModal] = useState(false);
  const [currentFileToZip, setCurrentFileToZip] = useState(null);

  async function ZipFile(file) {
    // Show the folder selection modal
    setShowFolderModal(true);
    setCurrentFileToZip(file);
  }

  async function processZipFile(file, destinationPath = "") {
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

      console.log("Zip successful");
      showToast("success", getZipSuccessMessage(zipResult));
    } catch (error) {
      console.error("Error zipping file:", error);
      showToast(
        "error",
        getZipUnzipErrorMessage(error, "Failed to zip file.")
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
      await postZipOrUnzip(apiUrl1, requestData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Unzip successful");
      showToast("success", "File successfully unzipped!");
    } catch (error) {
      console.error("Error unzipping file:", error);
      showToast(
        "error",
        getZipUnzipErrorMessage(error, "Failed to unzip file.")
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
    event.preventDefault();
    const input = document.getElementById("folname");
    const folderInput = input?.value?.trim();
  
    const isValid = /^[a-zA-Z0-9_\- ]{1,}$/.test(folderInput);
  
    if (!isValid) {
      setFolderFieldError(
        "Folder name can only contain letters, numbers, underscores, hyphens, and spaces."
      );
      return;
    }
  
    if (folderInput) {
      const folderPath = folderName ? `${folderName}/${folderInput}` : folderInput;
      console.log("Creating folder at path:", folderPath);
  
      try {
        const res = await axios.post(
          `${apiUrl}create-folder`,
          { folderName: folderPath },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
          }
        );
  
        handleCloseFileUploadModal();
        getLatestFolderList();
        getFileData(currentPage);
        handleCloseCreateFolder();
        setOpenFileUploadModal(false);
        showToast("success", "Folder created successfully!");
        input.value = ""; // Clear the input
      } catch (error) {
        console.error("Error creating folder:", error);
      }
    }
  };

  const uploadFolder = async () => {
    if (!fileList?.length) {
      showToast("warning", "Please select a folder first.");
      return;
    }

    const result = await uploadFolderViaMultipart({
      apiUrl,
      token,
      fileList,
      basePath: removeLastSlashAndText(path || ""),
      folderName: nameOfFolder || "folder",
      visibility: pubpri3,
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
      },
    });

    if (result.status === "busy") {
      showToast(
        "info",
        "Uploads are already in progress. Please wait for them to finish."
      );
      return;
    }

    const { displayName, allCanceled, anyFailed, anySucceeded, anyCanceled } =
      result;
    if (anySucceeded && !anyFailed && !anyCanceled) {
      setPubPri3("private");
      showToast("success", `Folder "${displayName}" uploaded successfully!`);
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

    handleCloseFileUploadModal();
  };

  const handleRadioChange2 = (event) => {
    setPubPri3(event.target.value);
  };

  const handleFolderChange = (event) => {
    console.log("Event", event);
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

    console.log("Updated file list:", updatedFileList);
    console.log("Folder structure:", updatedFolderStructure);
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

  const sanitizeFilename = (filename) => {
    // First extract the file extension
    const extension = filename.split('.').pop();
    let nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
  
    // Preserve season/episode info first (like S01E02)
    const seasonEpisodeMatch = nameWithoutExt.match(/([sS]\d{1,2}[eE]\d{1,2})/);
    const seasonEpisode = seasonEpisodeMatch ? seasonEpisodeMatch[0] : '';
  
    // Patterns to remove - more comprehensive language tags and metadata
    const patternsToRemove = [
      // Quality/resolution
      /(1080p|720p|480p|2160p|4k|uhd|hd)/i,
      // Codecs
      /(x264|x265|h264|h265|avc|hevc)/i,
      // Audio
      /(aac|ac3|dts|dd5\.1)/i,
      // Release groups
      /(- \w+$|-\w+$|\.\w+$)/i,
      // Language tags - more comprehensive list
      /\b(hindi|english|portuguese|spanish|french|german|esubs?|subs?|dub(bed)?|multi)\b/gi,
      // Common file tags
      /(repack|proper|extended|uncut|unrated|dc|directors[ .]cut|theatrical)/i,
      // Website names
      /(yts|moviesmod|yify|rarbg|ettv|web[-\s]?dl|bluray|brrip|webrip)/i,
      // Special characters
      /[\[\]\(\)]/g,
      // Remove year patterns if they're at the end
      /(19|20)\d{2}$/,
      // Remove random alphanumeric tags at end
      /[.-][a-z0-9]{2,8}$/i
    ];
  
    // First pass cleanup
    let cleaned = nameWithoutExt;
    patternsToRemove.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });
  
    // Special handling for season/episode
    if (seasonEpisode) {
      // Remove the season/episode from the original string so we can place it properly later
      cleaned = cleaned.replace(new RegExp(seasonEpisode, 'i'), '');
      // Reconstruct with season/episode in a standard format
      cleaned = `${cleaned} ${seasonEpisode.toUpperCase()}`;
    }
  
    // Final cleanup
    cleaned = cleaned
      .replace(/\.+/g, ' ')         // Replace all dots with spaces
      .replace(/\s+/g, ' ')         // Collapse multiple spaces
      .replace(/[ -]+$/, '')        // Trim trailing spaces/hyphens
      .trim();
  
    // Fallback if we removed too much
    if (cleaned.length < 3) {
      cleaned = nameWithoutExt
        .replace(/[\[\]\(\)]/g, '')
        .replace(/\.+/g, ' ')
        .trim();
    }
  
    // Ensure we don't have double extensions
    if (cleaned.endsWith(`.${extension}`)) {
      cleaned = cleaned.substring(0, cleaned.lastIndexOf('.'));
    }
  
    return `${cleaned}.${extension}`;
  };

  
  //Upload File Code
  const handleFileUpload = async () => {
    if (files.length === 0) {
      showToast("error", "Please select a file to upload.");
      return;
    }

    // Array to hold all file upload promises
    const uploadPromises = files.map((file, i) => {
      // Sanitize the filename before uploading
      const originalName = file.name;
      const sanitizedName = sanitizeFilename(originalName);
      
      // Create a new File object with the sanitized name
      const renamedFile = new File([file], sanitizedName, { type: file.type });
  
      const uploadId = Date.now() + i;
      addUpload(uploadId, "Uploading " + sanitizedName);
  
      const formData = new FormData();
      formData.append("files", renamedFile);  // Use the sanitized file
      formData.append("isPrivate", pubpri);
      formData.append("folderPath", path);
      formData.append("storageClass", "STANDARD");

      // Individual file upload request
      return axios
        .post(`${apiUrl}upload-file`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            const totalLength = progressEvent.lengthComputable
              ? progressEvent.total
              : file.size;

            if (totalLength) {
              const progress = Math.round(
                (progressEvent.loaded * 100) / totalLength
              );
              console.log("Upload Progress:", progress, "%");
              updateUploadProgress(uploadId, progress); // Update individual file progress
            }
          },
        })
        .then((response) => {
          removeUpload(uploadId); // Remove the progress bar once completed
          setPubPri("private");
          getFileData(1);
        })
        .catch((error) => {
          showToast("error", `Error uploading file`);
        });
    });

    try {
      // Wait for all file uploads to complete
      await Promise.all(uploadPromises);
      showToast("success", "Files uploaded successfully!");
      handleCloseFileUploadModal();
      setCurrentPage(1);
    } catch (error) {
      showToast("error", "Error uploading files");
    }

    setFiles([]);
  };

  //File information shower
  const getFileInfo = async (name) => {
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
      console.log("File information is", res.data);
      let fileData = res.data;

      // If res.data is a string, parse it as JSON
      if (typeof res.data === "string") {
        fileData = JSON.parse(res.data);
      }

      console.log("File information is", fileData);
      setFileInfo({
        fileName: fileData.filePath,
        fileSize: fileData.fileSize,
        fileType: fileData.fileType,
        uploadDateTime: fileData.uploadDateTime,
        fileUrl: fileData.url,
        fileIcon: resolveFileIconPath({
          fileName: fileData.filePath || name,
          fileType: fileData.fileType,
        }),
      });
      console.log(res.data.filePath);
      console.log("File info", fileInfo);
    } catch (error) {
      console.log(error);
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
          handleImageClose();
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
        console.log("mantra", filedata[newIndex].fileName);
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
          handleImageClose();
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
    console.log("Deleting file", filename);
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
      console.log(res);
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

  const moveFromModal = async () => {};

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

  // Function called when dragging over a folder
  const handleDragOver = (e) => {
    e.preventDefault(); // Necessary to allow a drop
    e.dataTransfer.dropEffect = "move";
  };
  const handleDragEnd = (e) => {
    e.target.classList.remove("dragging");
  };
  // Function called when a draggable item enters a droppable area
  const handleDragEnter = (e) => {
    e.preventDefault();
  };

  // Function called when the drop action occurs
  const handleDrop = (e, targetFolder) => {
    e.preventDefault();

    if (draggedItem && targetFolder.isFolder) {
      // Prevent moving into a shared folder
      if (targetFolder.isShared) {
        showToast("error", "Cannot move files into a shared folder.");
        return;
      }

      // Show move pop-up and then call move API
      console.log(
        "Dragged item is",
        draggedItem,
        "Target folder is",
        targetFolder.isFolder
      );

      if (targetFolder.isFolder === true) {
        setDragPop(true);
        setDragFile(draggedItem);
        setTargetFolder(targetFolder.fileName);
      }
    }

    // Reset the dragged item
    setDraggedItem(null);
  };

  const moveDraggedFile = async (filename) => {
    if (filename.isFolder === true) {
      console.log(
        "Shrey move folder console logg",
        [filename.fileName],
        [targetFolder]
      );
      try {
        const uploadId = Date.now() + Math.random(); // Ensures a unique uploadId for each file
        addUpload(uploadId, "Moving " + filename.fileName);
        const res = await axios.post(
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
            onUploadProgress: (progressEvent) => {
              const progress = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              updateUploadProgress(uploadId, progress);
            },
          }
        );
        removeUpload(uploadId);
        setDragPop(false);
        getFileData(currentPage);
        console.log("Response is", res.data);
        showToast("success", "Folder Moved Successfully!");
      } catch (error) {
        showToast("error", "Failed to move folder!");
        console.error("Error moving file:", error);
      }
    } else {
      const uploadId = Date.now() + Math.random(); // Ensures a unique uploadId for each file
      const movingFile = filename.fileName;
      addUpload(uploadId, "Moving " + movingFile);
      try {
        const res = await axios.post(
          `${apiUrl}move-file`,
          {
            sourceFolder: "",
            destinationFolder: targetFolder,
            keys: [filename.fileName], // Handle each file (segment) separately
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            onUploadProgress: (progressEvent) => {
              const progress = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              updateUploadProgress(uploadId, progress);
            },
          }
        );
        setDragPop(false);
        removeUpload(uploadId);
        getFileData(currentPage);
        console.log(`"${movingFile}" moved successfully:`, res.data);
        showToast("success", `"${movingFile}" Moved Successfully!`);
      } catch (error) {
        console.error(`Error moving file "${movingFile}":`, error);
        showToast(
          "error",
          `Failed to move file "${movingFile}". Please try again.`
        );
      }
    }
  };

  //Move multiple files
  const moveMultipleDrag = async (arr, folname) => {
    try {
      const uploadId = Date.now() + Math.random();
      addUpload(uploadId, "Moving Files..");
      console.log("File to move is", arr);
      for (const key of arr) {
        const res = await axios.post(
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
            onUploadProgress: (progressEvent) => {
              // Simulating progress for folder move
              const progress = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              updateUploadProgress(uploadId, progress);
            },
          }
        );
        setKeys([]);
        console.log(res);
        setDragPop(false);
        removeUpload(uploadId);
        getFileData(currentPage);
        showToast("success", "Files Moved Successfully!");
      }
    } catch (error) {
      console.error(error);
    }
  };

  //Move multiple folders
  const moveMultipleDrag2 = async (arr, folname) => {
    console.log("moveMultipleDrag2 : ", arr);
    try {
      if (arr && arr.length > 0) {
        // Check if any folder is shared
        const sharedFolders = arr.filter(
          (folder) => folder.isShared === true || folder.isShared === "true"
        );

        if (sharedFolders.length > 0) {
          const sharedNames = sharedFolders
            .map((f) => f.fileName || f.name)
            .join(", ");
          showToast("error", `Cannot move shared folder(s): ${sharedNames}`);
          return;
        }

        const movingFolders = arr.map((f) => f.fileName || f.name).join(", ");
        const uploadId = Date.now();
        addUpload(uploadId, "Moving " + movingFolders);

        const folderMoveRes = await axios.post(
          `${apiUrl}move-folder`,
          {
            sourceFolders: arr.map((f) => f.filePath || f.path),
            destinationFolder: folname,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            onUploadProgress: (progressEvent) => {
              const progress = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              updateUploadProgress(uploadId, progress);
            },
          }
        );

        setKeys2([]);
        setDragPop(false);
        removeUpload(uploadId);
        getFileData(currentPage);
        console.log("Folders moved successfully:", folderMoveRes.data);
        showToast("success", "Folders Moved Successfully!");
      }
    } catch (error) {
      console.error(error);
      showToast("error", "Failed to move folders. Please try again.");
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
          console.log("Recent folders are", res.data.result);
          setFolders(res.data.result);
          console.log("folders are ", folders);
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
    console.log(modalFile);
    console.log(selectedOption);

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
      console.log(res.data.message);
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

      {codePopup && (
  <div className="code-popup-overlay">
    <div className="code-popup-container">
      {/* Close Button */}
      <button
        className="code-popup-close-btn"
        onClick={() => setCodePopup(false)}
        aria-label="Close"
      >
        ×
      </button>

      <h2 className="code-popup-title">Code Preview</h2>

      <SyntaxHighlighter
        language={codeLanguage}
        style={oneLight}
        wrapLines
        wrapLongLines
        className="code-popup-highlighter"
      >
        {codeContent}
      </SyntaxHighlighter>
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
            <h2 className="rename_title2">Are you sure you want to delete?</h2>
            <p className="rename_subtext">This action cannot be reversed</p>
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
            <h2 className="rename_title2">Are you sure you want to Move?</h2>

            <div className="drag_buttons">
              <button
                className="drag_btn cancel"
                onClick={() => setDragPop(false)}
              >
                No
              </button>
              <button
                className="drag_btn ok"
                onClick={() => {
                  moveDraggedFile(dragFile);
                  if (keys.length > 0) {
                    moveMultipleDrag(keys, targetFolder);
                  }
                  if (keys2.length > 0) {
                    moveMultipleDrag2(keys2, targetFolder);
                  }
                }}
              >
                Yes
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

      <FileShareModal
        isOpen={sharePopup}
        onClose={closeSharePopup}
        file={selectedFile}
        resolveFilePath={(file) => removeSlash2(file.fileName)}
        apiUrl={apiUrl}
        token={token}
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
              <h1>Recent Uploads</h1>
            </div>
          </div>
        </nav>
        {/* partial */}
        <div className="main-panel">
          <div className="content-wrapper">
            <div className="table_box">
              <div className="filerbar_row">
                <div className="show_entries_row">
                  <FileSearchBar
                    value={query}
                    onChange={handleSearchChange}
                    onClear={clearSearch}
                  />
                </div>

                <div
                  style={{ display: "flex", alignItems: "center", gap: 15 }}
                  className="filter-row-new"
                >
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

                  <div className="filterbar">
                    <div
                      className="dropdown dropdown-processed"
                      style={{
                        // borderLeft: "1px solid #d7d6ef",
                        width: "-webkit-fill-available",
                      }}
                    >
                      <Dropdown
                        onSelect={handleFilterSelect}
                        title={
                          <span className="sort-filter-span">
                            <img src={SortHome} alt="" /> {selectedFilter}
                          </span>
                        }
                        className="filter_dropdown"
                      >
                        <Dropdown.Item eventKey="name-filter1">
                          By Name(A-Z)
                        </Dropdown.Item>
                        <Dropdown.Item eventKey="name-filter2">
                          By Name(Z-A)
                        </Dropdown.Item>
                        <Dropdown.Item eventKey="size-filter1">
                          By Size(Ascending)
                        </Dropdown.Item>
                        <Dropdown.Item eventKey="size-filter2">
                          By Size(Descending)
                        </Dropdown.Item>
                        <Dropdown.Item eventKey="date-filter1">
                          By Date(Oldest)
                        </Dropdown.Item>
                        <Dropdown.Item eventKey="date-filter2">
                          By Date(Newest)
                        </Dropdown.Item>
                      </Dropdown>
                    </div>
                    <div
                      className="dropdown dropdown-processed"
                      style={{ width: "-webkit-fill-available" }}
                    >
                      <Dropdown
                        onSelect={handleFTypeSelect}
                        title={
                          <span className="sort-filter-span">
                            <img src={FilterHome} alt="" /> File Type
                          </span>
                        }
                        className="filter_dropdown"
                        onClick={() => setShowFTPopup(true)} // Show the modal when dropdown is clicked
                      >
                        {/* You can remove the Dropdown.Item since it’s not needed anymore */}
                      </Dropdown>

                      <BootstrapModal
                        show={showFTPopup}
                        onHide={closePopup}
                        className="file-type-filter-modal"
                      >
                        <BootstrapModal.Header>
                          <BootstrapModal.Title className="file-type-filter-title">
                            File Type Filter
                          </BootstrapModal.Title>
                        </BootstrapModal.Header>
                        <BootstrapModal.Body className="file-type-filter-body">
                          <p className="file-type-filter-instruction">
                            Select the file types you want to filter by:
                          </p>

                          <div className="file-type-checkbox-container">
                            {fileTypes.map((fileType) => (
                              <div
                                key={fileType}
                                className="file-type-checkbox-item"
                              >
                                <input
                                  type="checkbox"
                                  id={fileType}
                                  value={fileType}
                                  checked={selectedFileTypes.includes(fileType)}
                                  onChange={() =>
                                    handleFTCheckboxChange(fileType)
                                  }
                                  className="file-type-checkbox-input"
                                />
                                <label
                                  htmlFor={fileType}
                                  className="file-type-checkbox-label"
                                >
                                  {fileType.toUpperCase()}
                                </label>
                              </div>
                            ))}
                          </div>
                        </BootstrapModal.Body>
                        <BootstrapModal.Footer className="file-type-filter-footer">
                          <div className="file-type-button-group">
                            <button
                              onClick={closePopup}
                              className="file-type-cancel-button"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={applyFilter}
                              className="file-type-apply-button"
                            >
                              Filter
                            </button>
                          </div>
                        </BootstrapModal.Footer>
                      </BootstrapModal>
                    </div>
                  </div>
                  <button
                    onClick={handleOpenCreateFolder}
                    className="download-btn2"
                  >
                    <img src={CreateFolder} />
                    Create Folder
                  </button>

                  <button
                    onClick={() => setIsDownloadModalOpen(true)}
                    className="download-btn"
                  >
                    <img src={DownloafFromUrl} alt="" />
                    <span>Download from URL</span>
                  </button>
                  <button
                    onClick={handleOpenFileUploadModal}
                    className="btn__upload__file_modal"
                  >
                    <img src={IconUpload} />
                    Upload Files
                  </button>
                </div>
              </div>

              {(keys.length > 0 || keys2.length > 0) && (
                <div className="selected_table_row">
                  <div className="selected_table_text">
                    <button
                      onClick={() => {
                        setKeys([]);
                        setKeys2([]);
                      }}
                      className="selected_close_table"
                    >
                      <i className="icon-cross"></i>
                    </button>
                    <span>{keys.length + keys2.length} Selected</span>

                    <button onClick={handleSelectAllToggle} class="button-18">
                      {isSelectAll ? "Deselect All" : "Select All"}
                    </button>
                  </div>

                  <ul className="selected_table_icons">
                    <li>
                      <button
                        onClick={() => {
                          if (keys2.length > 0) {
                            showToast("error", "Copy folder is not available!");
                          } else {
                            setIsCWhisperClicked(true);
                          }
                        }}
                        class="icon-copy"
                      ></button>
                    </li>
                    <li>
                      <button
                        onClick={() => {
                          setIsWhisperClicked(true);
                        }}
                        class="icon-move"
                      ></button>
                    </li>
                    <li>
                      <button
                        onClick={() => {
                          handleMulDelete();
                        }}
                        class="icon-delete2"
                      ></button>
                    </li>
                  </ul>
                </div>
              )}

              {(isLoading || searchLoading) ? (
                <Placeholder.Grid
                  rows={10}
                  columns={5}
                  active
                  style={{ paddingLeft: 20, paddingRight: 20, paddingTop: 12 }}
                />
              ) : (
                <div id="dataView">
                  {view === "list" ? (
                    <div className="table-responsive" id="listViewContent">
                      <table id="filestable" className="table table-striped">
                        <thead>
                          <tr>
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
                                  style={{ cursor: "pointer", marginLeft: 6 }}
                                  onClick={() =>
                                    handleFilterSelect(
                                      selectedFilter === "By Size(Ascending)"
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

                        {filedata.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="text-center">
                              No files or folders found.
                            </td>
                          </tr>
                        ) : (
                          filedata.map((file, index) => {
                            return (
                              <tbody>
                                <tr
                                  className={`hover_cell ${
                                    activeRow === 1 ? "active-row" : ""
                                  }`}
                                  draggable={true}
                                  onDragStart={(e) => handleDragStart(e, file)}
                                  onDragOver={
                                    file.isFolder ? handleDragOver : null
                                  }
                                  onDragEnter={
                                    file.isFolder ? handleDragEnter : null
                                  }
                                  onDragEnd={handleDragEnd}
                                  onDrop={
                                    file.isFolder
                                      ? (e) => handleDrop(e, file)
                                      : null
                                  }
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
                                        src={
                                          file.isShared ? sharedIcon : file.icon
                                        }
                                        height={32}
                                        alt="file icon"
                                      />
                                    </span>
                                    <div className="file-item">
                                      <span
                                        title={getTextAfterLastSlash(
                                          file.fileName
                                        )}
                                        className="file-name filename_link"
                                        style={{ cursor: "pointer" }}
                                        onClick={() => {
                                          setErrorMessage2("");
                                        
                                          const isFolder =
                                            file.fileType === "Folder" || file.isFolder === true;
                                        
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
                                            // show code modal for supported source code files
                                            previewCodeFile(file); // Assuming this calls the API and sets codeContent
                                            return;
                                          }
                                        
                                          if (
                                            ["mkv", "mp4", "mov", "mpeg", "webm"].includes(fileTypeLower)
                                          ) {
                                            setModalFile(file.fileName);
                                            handleImageShow();
                                            setVideoSrc(file.fileName);
                                            const index = filedata.findIndex((f) => f.fileName === file.fileName);
                                            if (index !== -1) setCurrentImageIndex(index);
                                            return;
                                          }
                                        
                                          if (
                                            ["jpeg", "jpg", "png", "gif", "hevc", "heif", "svg", "webp"].includes(fileTypeLower)
                                          ) {
                                            setModalFile(file.fileName);
                                            handleImageShow();
                                            getImageInfo(file.fileName);
                                            const index = filedata.findIndex((f) => f.fileName === file.fileName);
                                            if (index !== -1) setCurrentImageIndex(index);
                                            return;
                                          }
                                        
                                          if (
                                            ["mp3", "wav", "ogg", "aac", "m4a"].includes(fileTypeLower)
                                          ) {
                                            playAudioFile(allEntries, file.fileName);
                                            return;
                                          }
                                        
                                          if (
                                            ["pdf", "txt"].includes(fileTypeLower)
                                          ) {
                                            setModalFile(file.fileName);
                                            handleImageShow();
                                            getPdfInfo(file.fileName);
                                            const index = filedata.findIndex((f) => f.fileName === file.fileName);
                                            if (index !== -1) setCurrentImageIndex(index);
                                            return;
                                          }
                                        
                                          handleImageShow();
                                          setErrorMessage2("File format not supported!");
                                          const index = filedata.findIndex((f) => f.fileName === file.fileName);
                                          if (index !== -1) setCurrentImageIndex(index);
                                        }}
                                        
                                      >
                                        {getTextAfterLastSlash(
                                          customTruncateFileName(
                                            file.fileName,
                                            55
                                          )
                                        )}
                                      </span>
                                      <span
                                        className="file-path"
                                        title={getTextBeforeLastSlash(
                                          file.fileName
                                        ).replace(/>/g, "/")}
                                      >
                                        {getTextBeforeLastSlash(
                                          file.fileName
                                        ).replace(/>/g, "/")}
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
                                        className="dropdown-toggle"
                                        type="button"
                                        id="dropdownMenuButton"
                                        data-toggle="dropdown"
                                        aria-haspopup="true"
                                        aria-expanded="false"
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
                                              src={
                                                file.isShared
                                                  ? sharedIcon
                                                  : file.icon
                                              }
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
                                        {file.isFolder === false && (
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

                                        {file.fileName.includes(".zip") ? (
                                          <a
                                            className={`dropdown-item dropdown-item-custom ${
                                              file?.isShared
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
                                            className={`dropdown-item dropdown-item-custom ${
                                              file?.isShared
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
                                        )}

                                        {/* {file.isFolder === false && ( */}
                                        <a
                                          className={`dropdown-item dropdown-item-custom ${
                                            file?.isShared
                                              ? "disabled blur-effect"
                                              : ""
                                          }`}
                                          href="#"
                                          onClick={() =>
                                            !file?.isShared &&
                                            downloadFile(file)
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
                                            src={downloadIcon}
                                            alt="Download"
                                            className="dropdown-icon-list"
                                          />
                                          Download
                                        </a>
                                        {/* )} */}

                                        <a
                                          className={`dropdown-item dropdown-item-custom ${
                                            file?.isShared
                                              ? "disabled blur-effect"
                                              : ""
                                          }`}
                                          href="#"
                                          onClick={() =>
                                            !file?.isShared &&
                                            handleOpenPopover(file)
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
                                              handleCClick(file.fileName)
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
                                              getFileInfo(file.fileName);
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
                                        </a>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              </tbody>
                            );
                          })
                        )}
                      </table>
                    </div>
                  ) : (
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

                      <div className="grid-view2">
                        {filedata.length === 0 ? (
                          <div style={{ display: "flex" }}>
                            <span className="text-center">
                              No files or folders found.
                            </span>
                          </div>
                        ) : (
                          filedata.map((file, index) => (
                            <div
                              className={`grid-item2 ${
                                draggedItem?.fileName === file.fileName
                                  ? "dragging"
                                  : ""
                              }`}
                              key={index}
                              style={{ cursor: "pointer" }}
                              draggable={true}
                              onDragStart={(e) => handleDragStart(e, file)}
                              onDragOver={(e) => {
                                e.preventDefault(); // Necessary to allow dropping
                                if (file.isFolder)
                                  e.dataTransfer.dropEffect = "move";
                              }}
                              onDragEnter={(e) => {
                                if (file.isFolder) e.preventDefault();
                              }}
                              onDragEnd={handleDragEnd}
                              onDrop={(e) => {
                                if (file.isFolder) handleDrop(e, file);
                              }}
                              onClick={(event) => {
                                if (
                                  !event.target.closest(".dropdown-toggle") &&
                                  !event.target.closest(".checkbox-input") &&
                                  !event.target.closest(".custom-dropdown-menu")
                                ) {
                                  setErrorMessage2("");
                              
                                  const codeExtensions = [
                                    "js", "jsx", "ts", "tsx", "html", "css", "json", "xml",
                                    "py", "java", "c", "cpp", "rb", "php", "sh", "go", "cs",
                                  ];
                                  const fileTypeLower = file.fileType?.toLowerCase();
                              
                                  // CODE FILE DETECTION
                                  if (codeExtensions.includes(fileTypeLower)) {
                                    previewCodeFile(file); // <-- handles API call + setCodeContent + open modal
                                    return;
                                  }
                              
                                  if (
                                    ["mkv", "mp4", "mov", "mpeg", "webm", "MOV"].includes(fileTypeLower)
                                  ) {
                                    setModalFile(file.fileName);
                                    handleImageShow();
                                    const index = filedata.findIndex(f => f.fileName === file.fileName);
                                    if (index !== -1) setCurrentImageIndex(index);
                                    setVideoSrc(file.fileName);
                                  } else if (
                                    [
                                      "jpeg", "jpg", "png", "gif", "hevc", "heif", "svg", "webp",
                                      "JPEG", "JPG", "PNG", "GIF", "HEVC", "HEIF", "SVG", "WEBP"
                                    ].includes(file.fileType)
                                  ) {
                                    setModalFile(file.fileName);
                                    handleImageShow();
                                    const index = filedata.findIndex(f => f.fileName === file.fileName);
                                    if (index !== -1) setCurrentImageIndex(index);
                                    getImageInfo(file.fileName);
                                  } else if (
                                    ["mp3", "MP3", "wav", "WAV", "ogg", "OGG", "aac", "AAC", "m4a", "M4A"].includes(file.fileType)
                                  ) {
                                    playAudioFile(allEntries, file.fileName);
                                  } else if (
                                    ["pdf", "PDF", "txt", "TXT"].includes(file.fileType)
                                  ) {
                                    setModalFile(file.fileName);
                                    handleImageShow();
                                    const index = filedata.findIndex(f => f.fileName === file.fileName);
                                    if (index !== -1) setCurrentImageIndex(index);
                                    getPdfInfo(file.fileName);
                                  } else {
                                    if (file.isFolder === true) {
                                      chkFileorFolder(file, file.fileSize);
                                    } else {
                                      handleImageShow();
                                      setErrorMessage2("File format not supported!");
                                      const index = filedata.findIndex(f => f.fileName === file.fileName);
                                      if (index !== -1) setCurrentImageIndex(index);
                                    }
                                  }
                                }
                              }}
                              
                            >
                              <input
                                id="check-Atharva"
                                type="checkbox"
                                className="checkbox-input"
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
                                    className="dropdown-toggle"
                                    type="button"
                                    id="dropdownMenuButton"
                                    data-toggle="dropdown"
                                    aria-haspopup="true"
                                    aria-expanded="false"
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
                                    {/* {file.isFolder === false && (
                                    <a
                                      className="dropdown-item"
                                      href="#"
                                      onClick={() => {
                                        setIsVisibility(true);
                                        setVisiKey(file.fileName);
                                        setPubPri(file.ACL);
                                      }}
                                    >
                                      <i className="icon-view" />
                                      Change Visibility
                                    </a>
                                  )} */}
                                    <a className="file-container">
                                      <div className="file-icon">
                                        <img
                                          src={
                                            file.isShared
                                              ? sharedIcon
                                              : file.icon
                                          }
                                          height={32}
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
                                              file.uploadDateTime.indexOf(",")
                                            )}
                                          </p>
                                          <span>• {file.fileSize}</span>
                                        </div>
                                      </div>
                                    </a>
                                    {file.isFolder === false && (
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

                                    {file.fileName.includes(".zip") ? (
                                      <a
                                        className={`dropdown-item dropdown-item-custom ${
                                          file?.isShared
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
                                        className={`dropdown-item dropdown-item-custom ${
                                          file?.isShared
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
                                    )}
                                    {/* {file.isFolder === false && ( */}
                                    <a
                                      className={`dropdown-item dropdown-item-custom ${
                                        file?.isShared
                                          ? "disabled blur-effect"
                                          : ""
                                      }`}
                                      href="#"
                                      onClick={() =>
                                        !file?.isShared && downloadFile(file)
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
                                        src={downloadIcon}
                                        alt="Download"
                                        className="dropdown-icon-list"
                                      />
                                      Download
                                    </a>
                                    {/* )} */}
                                    <a
                                      className={`dropdown-item dropdown-item-custom ${
                                        file?.isShared
                                          ? "disabled blur-effect"
                                          : ""
                                      }`}
                                      href="#"
                                      onClick={() =>
                                        !file?.isShared &&
                                        handleOpenPopover(file)
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
                                      onClick={() => handleAddToFavorites(file)}
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
                                          handleCClick(file.fileName)
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
                                      onClick={() => handleGenerateLink(file)}
                                    >
                                      <img
                                        src={linkIcon}
                                        alt="Generate Short Link"
                                        className="dropdown-icon-list"
                                      />
                                      Generate Short Link
                                    </a>
                                  )} */}
                                    {/* {file.isFolder === false && (
                                    <a
                                      className="dropdown-item"
                                      href="#"
                                      onClick={() => {
                                        setInfoShower(true);
                                        getFileInfo(file.fileName);
                                      }}
                                      
                                    >
                                      <i className="mdi mdi-information-outline" />
                                      Information
                                    </a>
                                  )} */}

                                    <a
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
                                    </a>
                                  </div>
                                </div>
                              </div>

                              {/* File Icon / public image preview (visible cards only) */}
                              <CardFilePreview
                                file={file}
                                sharedIconSrc={sharedIcon}
                              />

                              <div>
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
                    </>
                  )}
                </div>
              )}
              {isWhisperClicked && (
                <MoveFilePopup
                  moveKey={movedFile}
                  source={""}
                  onClose={handleMClose}
                  currentP={currentPage}
                  files={keys}
                  folders={keys2}
                />
              )}

              {moveFol && (
                <MoveFolderPopup
                  moveKey={movedFol}
                  source={""}
                  onClose={handleMFClose}
                  currentP={currentPage}
                />
              )}

              {showFolderModal && (
                <SelectFolderModal
                  onClose={() => setShowFolderModal(false)}
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
                />
              )}
            </div>
          </div>
          {/* <Footer /> */}
          <footer className="files-pagination-footer">
            <div className="container-fluid">
              <div className="pagination-container">
                {/* Results per page dropdown */}
                <div className="results-dropdown">
                  <span className="label">Results per page</span>
                  <select
                    value={itemsPerPage}
                    onChange={handleItemsPerPageChange}
                    className="select-dropdown"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>

                {/* Page info and navigation */}
                <div className="page-info">
                  <span className="page-range">
                    {totalEntries > 0
                      ? `${startItem}-${endItem} of ${totalEntries}`
                      : "0-0 of 0"}
                  </span>

                  <div className="pagination-buttons">
                    <button
                      onClick={goToFirstPage}
                      disabled={currentPage === 1}
                      className="page-btn"
                    >
                      <ChevronFirst className="icon" />
                    </button>

                    <button
                      onClick={goToPrevPage}
                      disabled={currentPage === 1}
                      className="page-btn"
                    >
                      <ChevronLeft className="icon" />
                    </button>

                    <span className="current-page">{currentPage}</span>

                    <button
                      onClick={goToNextPage}
                      disabled={!isNextPage}
                      className="page-btn"
                    >
                      <ChevronRight className="icon" />
                    </button>

                    <button
                      onClick={goToLastPage}
                      disabled={!isNextPage}
                      className="page-btn"
                    >
                      <ChevronLast className="icon" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="card-header use_storage">
              <span>You have used {rootsize} size from storage</span>
            </div>
          </footer>
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

                      <ul className="upload_thumbnails_list">{fileList2}</ul>
                    </section>
                  )}
                </Dropzone>
                <div className="filesize-warning-div">
                  <span className="filesize-warning-span">
                    <div class="warning-icon">!</div>Max File size is 5 GB
                  </span>
                  <p className="visibility-label">Set Visibility:</p>
                </div>

                <ul className="radio_checkbox_list mt-0">
                  <li>
                    <input
                      type="radio"
                      name="FileUpload"
                      id="FilePublic"
                      value="public-read"
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
                      defaultChecked
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
                  <button
                    onClick={handleFileUpload}
                    className="btn_width_same ripple_effect btn-upload"
                  >
                    Submit
                  </button>
                </div>
              </TabPanel>

              <TabPanel>
                <h5 className="upload-title">Upload Folder</h5>

                <div {...getRootProps({ className: "dropzone-box" })}>
                  <input {...getInputProps()} />
                  <p className="dropzone-text">
                    {isDragActive
                      ? "Drop the folder here ..."
                      : "Choose a file or drag & drop it here"}
                  </p>
                  <p className="dropzone-subtext">
                    JPEG, PNG, PDG, and MP4 formats, up to 50MB
                  </p>
                  <button
                    type="button"
                    onClick={handleSelectFolder}
                    className="browse-button"
                  >
                    Browse File
                  </button>
                </div>

                {files.length > 0 && (
                  <ul className="upload-folder-name">{nameOfFolder}</ul>
                )}

                <div className="visibility-group">
                  <p className="visibility-label">Set Visibility:</p>
                  <ul className="radio_checkbox_list justify-center">
                    <li>
                      <input
                        type="radio"
                        name="FileUpload3"
                        onChange={handleRadioChange2}
                        value="public-read"
                        id="FilePublic3"
                      />
                      <label htmlFor="FilePublic3">Public</label>
                    </li>
                    <li>
                      <input
                        type="radio"
                        name="FileUpload3"
                        onChange={handleRadioChange2}
                        value="private"
                        id="FilePrivate3"
                        defaultChecked
                      />
                      <label htmlFor="FilePrivate3">Private</label>
                    </li>
                  </ul>
                </div>

                <div className="btn_group mt-4">
                  <button
                    onClick={handleCloseFileUploadModal}
                    className=" btn_width_same btn_grey_ripple ripple_effect btn-cancel"
                  >
                    Close
                  </button>
                  <button
                    onClick={uploadFolder}
                    className="btn_width_same ripple_effect btn-upload"
                  >
                    Upload
                  </button>
                </div>
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
        <div className="popup-overlay">
          <div className="create-folder-card">
            <div
              className="folder-icon"
              style={{ display: "flex", justifyContent: "center" }}
            >
              <img src={createFolderPopup} alt="Create Folder" height={48} />
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

              <div className="rename_buttons mt-3">
                <button
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
      />

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
    </>
  );
};

export default DefaultFolder;
