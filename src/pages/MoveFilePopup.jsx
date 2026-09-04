import React, { useContext, useState, useEffect } from "react";
import { UploadContext } from "./UploadContext";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { FaCheckCircle } from "react-icons/fa"; //<FaCheckCircle />
import { BsXCircleFill } from "react-icons/bs"; // <BsXCircleFill />
import { IoIosInformationCircle } from "react-icons/io"; // <IoIosInformationCircle />
import { FaExclamationTriangle } from "react-icons/fa"; // <FaExclamationTriangle />
import { handleS3CopyError } from "../utils/handleS3CopyError";
import {
  startMoveTransfer,
  finishMoveTransfer,
  failMoveTransfer,
} from "../utils/moveTransferProgress";
import { afterLoaderComplete } from "../utils/actionLoaderDelay";
import {
  normalizeFolderPath,
  normalizeMovePath,
  isSameMoveDestination,
  isRedundantFolderMove,
  resolveSourceFolderAndKeys,
} from "../utils/movePath";



import {
  addFolder,
  incrementCounter,
  incrementFCounter,
  removeLastFolder,
  decrementFCounter,
  removeLastFolder2,
  resetFCounter,
} from "../store/fileSlicer";
import axios from "axios";
import { ChakraProvider, Stack, useToast } from "@chakra-ui/react";
import Loader2 from "../components/Loader2";
import FolderPickerListPanel from "../components/FolderPickerListPanel";
import FolderDestinationModal, {
  formatModalItemSummary,
} from "../components/FolderDestinationModal";
import {
  buildGetFolderParams,
  parseFolderListingItems,
} from "../utils/getFolderParams";
import { fetchFolderListing } from "../utils/fetchFolderListing";

const MoveFilePopup = ({
  moveKey,
  source,
  onClose,
  files,
  folders,
  reloadAfterTast,
  showToast: showToastProp,
}) => {
  const { addUpload, updateUploadProgress, removeUpload } =
    useContext(UploadContext);
  const [isRadioChecked, setIsRadioChecked] = useState(false);
  const [locationPath, setLocationPath] = useState("");
  const apiUrl = process.env.REACT_APP_API_ENDPOINT;
  const token = sessionStorage.getItem("number");
  const rootFolderList = useSelector((state) => state.getdata.rootFolderList);
  const sharedFolderList = useSelector(
    (state) => state.getdata.sharedFolderList
  );
  console.log("rootFolderList", rootFolderList);
  console.log("sharedFolderList", sharedFolderList);
  const filenameRedux = useSelector((state) => state.getdata.fileName);
  const isSharedValue = useSelector((state) => state.getdata.isSharedValue);
  const counter = useSelector((state) => state.getdata.folderCounter);
  const counter2 = useSelector((state) => state.getdata.counter);
  console.log("counter : ", counter2);
  const counterPrime = counter;
  const counterPrime2 = counter2;
  console.log("counter : ", counter);
  const dispatch = useDispatch();
  const sourceFol = source.replace(/\/$/, "");
  console.log("soruce", sourceFol);

  const [selectedPath, setSelectedPath] = useState(null);
  const [folders1, setFolders1] = useState([]);
  const [loadingFolders, setLoadingFolders] = useState(true);
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

    // Ensure counter is within bounds
    if (counter >= parts.length) {
      return parts[parts.length - 1]; // Return the last segment if counter is too high
    }

    return parts.slice(counter).join("/");
  }

  function getTextAfterLastSlash(text) {
    const parts = text.split("/");

    return parts[parts.length - 1];
  }
 
  const keys = Array.isArray(moveKey)
  ? moveKey.map(item => item.split('/').pop())
  : [moveKey.split('/').pop()];

  const getLastSegment = (path) => {
    // Split the path by slashes
    const parts = path.split("/");

    // Return the last segment
    return parts[parts.length - 1];
  };

  const lastSegments = (Array.isArray(files) ? files : []).map(getLastSegment);



// const handleItemClick = async (path) => {
//   console.log(path);
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
//     console.log("Response data from folder moveFolderPopup is ", folders);

//     setLocationPath((prev) => {
//       if (prev) {
//         return `${prev} / ${getTextAfterSlashes(path, counter)}`;
//       } else {
//         return getTextAfterSlashes(path, counter);
//       }
//     });
//     setFolders1(folders);
//     setSelectedPath(path); // Set selectedPath to current folder
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




const [progress, setProgress] = useState(0);

// const handleMove = async () => {
//   // START loading
//   setLoading2(true);
  
//   // onClose();
//   console.log("wwwww: handleMove called: Closing modal...");
//   console.log("wwwww: selectedPath:", selectedPath);
//   console.log("wwwww: moveKey:", moveKey);
//   console.log("wwwww: sourceFol:", sourceFol);

//   if (sourceFol === selectedPath) {
//     console.log("wwwww: Source and destination are the same. Nothing to move.");
//     onClose();
//     setLoading2(false); // Early exit
//     return;
//   }

//   let hasError = false;
//   setProgress(0); // Reset progress to 0

//   try {
//     const sharedParams = isSharedValue ? { shared: filenameRedux } : {};

//     let adjustedSourceFolder = sourceFol.replace(/\\/g, "/");

//     if (isSharedValue && adjustedSourceFolder === filenameRedux) {
//       adjustedSourceFolder = "";
//     } else if (isSharedValue && adjustedSourceFolder.startsWith(`${filenameRedux}/`)) {
//       adjustedSourceFolder = adjustedSourceFolder.replace(`${filenameRedux}/`, "");
//     }

//     try {
//       const res = await axios.post(
//         `${apiUrl}move-file`,
//         {
//           sourceFolder: adjustedSourceFolder,
//           destinationFolder: selectedPath,
//           keys: keys,
//         },
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//           params: sharedParams,
//         }
//       );
//       console.log("wwwww: File moved successfully:", res.data);
//       setProgress(100); // Set progress to 100 when API completes
//     } catch (error) {
//       console.error("wwwww: Error moving file:", error);
//       hasError = true;
//       setProgress(0); // Reset progress on error
//     }

//     if (hasError) {
//       console.log("wwwww: Some items failed to move.");
//       showToast("error", "Some items failed to move.");
//     } else {
//       console.log("wwwww: All items moved successfully!");
//       showToast("success", "All items moved successfully!");
//     }

//     if (typeof reloadAfterTast === "function") {
//       setTimeout(() => {
//         reloadAfterTast();
//       }, 1000);
//     }
//   } catch (error) {
//     console.error("wwwww: Unexpected error during move:", error);
//     showToast("error", "An unexpected error occurred.");
//   } finally {
//     console.log("wwwww: handleMove finished. Closing modal...");
//     setLoading2(false); // END loading
//     onClose();
//   }
// };


const movePathOptions = {
  isShared: isSharedValue,
  sharedRoot: filenameRedux,
};

const handleMove = async () => {
  if (
    isSameMoveDestination(sourceFol, selectedPath, movePathOptions)
  ) {
    showToast("warning", "Source and destination are the same.");
    return;
  }

  const fileKeys = Array.isArray(moveKey)
    ? moveKey.map((item) => String(item).trim()).filter(Boolean)
    : moveKey
      ? [String(moveKey).trim()]
      : [];

  const folderKeys = (Array.isArray(folders) ? folders : [])
    .map((f) =>
      typeof f === "string" ? f : f?.filePath || f?.fileName || f?.path || ""
    )
    .map((f) => normalizeFolderPath(f))
    .filter(Boolean);

  if (fileKeys.length === 0 && folderKeys.length === 0) {
    showToast("error", "No files or folders selected.");
    return;
  }

  // Block moving a folder into itself / its descendant
  const normalizedDest = normalizeMovePath(selectedPath, movePathOptions);
  const invalidFolderDest = folderKeys.some((folder) => {
    const src = normalizeMovePath(folder, movePathOptions);
    return normalizedDest === src || normalizedDest.startsWith(`${src}/`);
  });
  if (invalidFolderDest) {
    showToast(
      "warning",
      "Cannot move a folder into itself or one of its subfolders."
    );
    return;
  }

  setLoading2(true);
  setProgress(0);
  let uploadId = null;

  try {
    const sharedParams = isSharedValue ? { shared: filenameRedux } : {};

    const { sourceFolder: adjustedSourceFolder, keys: apiFileKeys } =
      resolveSourceFolderAndKeys(fileKeys, sourceFol, movePathOptions);

    uploadId = startMoveTransfer(
      addUpload,
      updateUploadProgress,
      "Moving items…"
    );

    if (apiFileKeys.length > 0) {
      await axios.post(
        `${apiUrl}move-file`,
        {
          sourceFolder: adjustedSourceFolder,
          destinationFolder: selectedPath,
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
    }

    if (folderKeys.length > 0) {
      await axios.post(
        `${apiUrl}move-folder`,
        {
          sourceFolders: folderKeys,
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
    }

    setProgress(100);
    finishMoveTransfer(updateUploadProgress, removeUpload, uploadId);
    uploadId = null;

    const parts = [];
    if (apiFileKeys.length) parts.push(`${apiFileKeys.length} file(s)`);
    if (folderKeys.length) parts.push(`${folderKeys.length} folder(s)`);
    showToast("success", `Moved ${parts.join(" and ")} successfully!`);

    if (typeof reloadAfterTast === "function") {
      setTimeout(() => {
        reloadAfterTast();
      }, 300);
    }
    afterLoaderComplete(() => {
      setLoading2(false);
      onClose();
    });
  } catch (error) {
    console.error("wwwww: Error moving items:", error);
    setProgress(0);
    failMoveTransfer(removeUpload, uploadId);
    uploadId = null;
    handleS3CopyError(
      error,
      showToast,
      "Failed to move selected items. Please try again."
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

  setIsRadioChecked(false);

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
    dispatch(resetFCounter()); // Reset folderCounter to 0
    onClose(); // Call the existing close function
  };

  const handleRootClick = () => {
    setLocationPath("");
    setSelectedPath("");
    fetchFolders("");
  };

  return (
    <>
      <FolderDestinationModal
        variant="move"
        title="Move to"
        itemSummary={formatModalItemSummary(keys)}
        selectedPath={selectedPath ?? ""}
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
};

export default MoveFilePopup;
