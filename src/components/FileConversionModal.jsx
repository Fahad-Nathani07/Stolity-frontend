import React, { useState, useRef, useEffect } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL, fetchFile } from '@ffmpeg/util';
import imageCompression from 'browser-image-compression';
import { detectFileType, getAvailableButtons } from '../utils/fileTypeDetector';
import { convertImage, convertData } from '../services/conversionService';
import { FiFile, FiX } from 'react-icons/fi';
import { MdOutlineChangeCircle, MdOutlineCompress } from 'react-icons/md';
import { BiSliderAlt } from 'react-icons/bi';
import { FaFileAlt } from "react-icons/fa";
import "../App.css"

function FileConversionModal({ isOpen, onClose, files, onFilesUpdated }) {
  const [selectedFilesList, setSelectedFilesList] = useState([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [fileInfo, setFileInfo] = useState(null);
  const [availableButtons, setAvailableButtons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');


  const [showFileProperties, setShowFileProperties] = useState(true);


  
// ADD THESE NEW LINES:
// const [formatMessage, setFormatMessage] = useState(''); // Format modal only
// const [bitrateMessage, setBitrateMessage] = useState(''); // Bitrate modal only
// const [compressMessage, setCompressMessage] = useState(''); // Compress modal only

const [activeTab, setActiveTab] = useState(null);

  // Format states
  const [showFormatModal, setShowFormatModal] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState(null);

  // Compress states
  const [showCompressModal, setShowCompressModal] = useState(false);
  const [qualityLevel, setQualityLevel] = useState(3);
  const [maxWidth, setMaxWidth] = useState(1920);
  const [maxHeight, setMaxHeight] = useState(1080);
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });

  const [formatMessage, setFormatMessage] = useState('');
const [compressMessage, setCompressMessage] = useState('');
const [bitrateMessage, setBitrateMessage] = useState('');

  // Bitrate states
  const [showBitrateModal, setShowBitrateModal] = useState(false);
  const ffmpegRef = useRef(new FFmpeg());
  const [selectedBitrate, setSelectedBitrate] = useState(null);
  const [ffmpegReady, setFfmpegReady] = useState(false);
  const [progress, setProgress] = useState(0);

  const FILE_SIZE_LIMIT = 150 * 1024 * 1024;

  const qualityLevels = [
    { label: 'Maximum Compression', quality: 0.3 },
    { label: 'High Compression', quality: 0.5 },
    { label: 'Medium Compression', quality: 0.65 },
    { label: 'Moderate Compression', quality: 0.75 },
    { label: 'Low Compression', quality: 0.85 },
    { label: 'Minimal Compression', quality: 0.95 },
  ];

  const currentFile = selectedFilesList[currentFileIndex];

  useEffect(() => {
    if (isOpen && files && files.length > 0) {
      const filesArray = files.map((file, index) => {
        const detection = detectFileType(file);
        return {
          file: file,
          name: file.name,
          size: file.size,
          type: detection.type,
          extension: detection.extension,
          id: `${file.name}-${index}`
        };
      });

      setSelectedFilesList(filesArray);
      setCurrentFileIndex(0);
      updateCurrentFileInfo(filesArray[0]);
    }
  }, [isOpen, files]);

  const updateCurrentFileInfo = (fileData) => {
    if (!fileData) return;
    const buttons = getAvailableButtons(fileData.type);
    setFileInfo(fileData);
    setAvailableButtons(buttons);
    setMessage('');
  };

  const handleSwitchFile = (index) => {
    setCurrentFileIndex(index);
    updateCurrentFileInfo(selectedFilesList[index]);
  };

  const handleUpdateFile = (updatedFile) => {
    const updatedList = [...selectedFilesList];
    updatedList[currentFileIndex] = {
      ...updatedList[currentFileIndex],
      file: updatedFile,
      name: updatedFile.name,
      size: updatedFile.size,
      extension: updatedFile.name.split('.').pop().toLowerCase()
    };
    setSelectedFilesList(updatedList);
    updateCurrentFileInfo(updatedList[currentFileIndex]);
  };

  // ===== FORMAT CONVERSION =====
  const getFormatOptions = () => {
  switch (fileInfo?.type) {
    case 'image':
      return ['PNG', 'JPG', 'JPEG', 'WebP', 'GIF', 'HEIC'];
    case 'video':
      return ['MP4', 'WebM', 'AVI', 'MOV', 'MP3', 'WAV', 'AAC'];
    case 'data':
      if (fileInfo?.extension === 'csv') return ['JSON', 'Excel (.xlsx)', 'XML', 'TXT'];
      if (fileInfo?.extension === 'json') return ['CSV', 'Excel (.xlsx)', 'XML', 'TXT'];
      if (['xlsx', 'xls'].includes(fileInfo?.extension)) return ['CSV', 'JSON', 'XML'];
      if (fileInfo?.extension === 'xml') return ['JSON', 'CSV', 'Excel (.xlsx)'];
      if (fileInfo?.extension === 'txt') return ['JSON', 'CSV', 'XML'];
      return [];
    default:
      return [];
  }
};


  const handleFormatConvert = async (newFormat) => {
    if (!currentFile) return;

     // If it's a video, use FFmpeg conversion
  if (fileInfo.type === 'video') {
    return handleVideoFormatConvert(newFormat);
  }

    setLoading(true);
    setMessage('');

    try {
      let convertedFile;

      if (fileInfo.type === 'image') {
        convertedFile = await convertImage(currentFile.file, newFormat);
      } else if (fileInfo.type === 'data') {
        convertedFile = await convertData(currentFile.file, newFormat);
      } else {
        throw new Error('Conversion not supported');
      }

      handleUpdateFile(convertedFile);
      setMessage(`✓ Converted to ${newFormat}!`);
      setShowFormatModal(false);
    } catch (error) {
    //   setMessage(`❌ ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

const handleVideoFormatConvert = async (newFormat) => {
  if (!currentFile || !fileInfo || !ffmpegReady) return;
  
  setLoading(true);
  setProgress(0);
  setFormatMessage('');

  try {
    const ffmpeg = ffmpegRef.current;

    if (!ffmpeg.loaded) {
      throw new Error('FFmpeg is not ready');
    }

    const fileExtension = currentFile.name.split('.').pop().toLowerCase();
    const nameWithoutExt = currentFile.name.split('.').slice(0, -1).join('.');
    const inputName = `input.${fileExtension}`;
    const newExtension = newFormat.toLowerCase();
    const outputName = `${nameWithoutExt}.${newExtension}`;

    console.log('=== VIDEO/AUDIO FORMAT CONVERSION START ===');
    console.log('Converting from', fileExtension, 'to', newFormat);
    console.log('Input:', inputName);
    console.log('Output:', outputName);

    await ffmpeg.writeFile(inputName, await fetchFile(currentFile.file));
    console.log('Input file written');

    // Check if converting to audio format
    const audioFormats = ['mp3', 'wav', 'aac'];
    const isAudioConversion = audioFormats.includes(newExtension);

    let command;
    if (isAudioConversion) {
      // Extract audio only
      console.log('Audio extraction mode');
      if (newExtension === 'mp3') {
        command = [
          '-i', inputName,
          '-vn', // No video
          '-acodec', 'libmp3lame',
          '-b:a', '192k',
          '-ar', '44100',
          outputName
        ];
      } else if (newExtension === 'wav') {
        command = [
          '-i', inputName,
          '-vn', // No video
          '-acodec', 'pcm_s16le',
          '-ar', '44100',
          outputName
        ];
      } else if (newExtension === 'aac') {
        command = [
          '-i', inputName,
          '-vn', // No video
          '-acodec', 'aac',
          '-b:a', '192k',
          '-ar', '44100',
          outputName
        ];
      }
    } else {
      // Video format conversion
      console.log('Video conversion mode');
      command = [
        '-i', inputName,
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-c:a', 'aac',
        '-b:a', '128k',
        outputName
      ];
    }

    console.log('Executing command:', command.join(' '));

    const startTime = Date.now();
    await ffmpeg.exec(command);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`Conversion completed in ${duration}s`);

    const data = await ffmpeg.readFile(outputName);
    const mimeType = isAudioConversion ? `audio/${newExtension}` : `video/${newExtension}`;

    const blob = new Blob([data.buffer], { type: mimeType });
    const convertedFile = new File([blob], outputName, { type: mimeType });

    console.log('Output file created:', outputName);
    console.log('Output file size:', convertedFile.size);
    console.log('MIME type:', mimeType);

    handleUpdateFile(convertedFile);
    setFormatMessage(`✓ Converted to ${newFormat.toUpperCase()}!`);

    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);
    console.log('Temp files deleted');

    console.log('=== CONVERSION SUCCESS ===');

    // Close modal after successful conversion
    setTimeout(() => {
      setShowFormatModal(false);
      setProgress(0);
      setFormatMessage('');
    }, 800);

  } catch (error) {
    console.error('=== CONVERSION FAILED ===');
    console.error('Conversion error:', error);
    setFormatMessage(`❌ ${error?.message || 'Conversion failed'}`);
  } finally {
    setLoading(false);
  }
};


// Auto-select first available tab when file changes
useEffect(() => {
  if (availableButtons.length > 0) {
    if (availableButtons.includes('changeFormat')) {
      setActiveTab('format');
    } else if (availableButtons.includes('compress')) {
      setActiveTab('compress');
    } else if (availableButtons.includes('changeBitrate')) {
      setActiveTab('bitrate');
    }
  }
}, [availableButtons, currentFileIndex]);





  // ===== IMAGE COMPRESSION =====
  // const handleCompressImage = async () => {
  //   if (!currentFile) return;
  //   setLoading(true);
  //   setMessage('');

  //   try {
  //     const currentQuality = qualityLevels[qualityLevel].quality;

  //     const options = {
  //       maxSizeMB: Infinity,
  //       maxWidthOrHeight: Math.max(maxWidth, maxHeight),
  //       initialQuality: currentQuality,
  //       useWebWorker: true,
  //     };

  //     const compressedFile = await imageCompression(currentFile.file, options);
  //     handleUpdateFile(compressedFile);
  //     setMessage(`✓ Image compressed!`);
  //     setShowCompressModal(false);
  //   } catch (error) {
  //   //   setMessage(`❌ ${error.message}`);
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  const handleCompressImage = async () => {
  if (!currentFile) return;
  setLoading(true);
  setProgress(0);
  setCompressMessage('');

  try {
    const currentQuality = qualityLevels[qualityLevel].quality;

    const options = {
      maxSizeMB: Infinity,
      maxWidthOrHeight: Math.max(maxWidth, maxHeight),
      initialQuality: currentQuality,
      useWebWorker: true,
      onProgress: (progressPercent) => {
        // browser-image-compression provides 0-100 progress
        setProgress(Math.round(progressPercent));
      }
    };

    const compressedFile = await imageCompression(currentFile.file, options);
    handleUpdateFile(compressedFile);
    setCompressMessage(`✓ Image compressed!`);
    
    // Close modal after 800ms
    setTimeout(() => {
      setShowCompressModal(false);
      setProgress(0);
      setCompressMessage('');
    }, 800);
  } catch (error) {
    console.error('Compression error:', error);
    setCompressMessage(`❌ ${error?.message || 'Compression failed'}`);
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    if (showCompressModal && fileInfo?.type === 'image' && currentFile) {
      const img = new Image();
      img.src = URL.createObjectURL(currentFile.file);
      img.onload = () => {
        setOriginalDimensions({ width: img.width, height: img.height });
        setMaxWidth(img.width);
        setMaxHeight(img.height);
      };
    }
  }, [showCompressModal, fileInfo?.type, currentFile]);

  // ===== BITRATE CONVERSION =====
  const loadFFmpeg = async () => {
  try {
    console.log('=== FFMPEG LOAD START ===');
    const ffmpeg = ffmpegRef.current;

    console.log('1. FFmpeg instance created:', ffmpeg);

    ffmpeg.on('log', ({ message: msg }) => {
      console.log('[FFmpeg Log]:', msg);
    });

    // ffmpeg.on('progress', ({ progress: prog }) => {
    //   console.log('[FFmpeg Progress]:', Math.round(prog * 100) + '%');
    //   setProgress(Math.round(prog * 100));
    // });

    ffmpeg.on('progress', ({ progress: prog }) => {
  // Ignore invalid progress values (FFmpeg sends >1.0 at start)
  // Only accept progress between 0 and 1, and only update if it increases
  if (prog >= 0 && prog <= 1) {
    const percentage = Math.round(prog * 100);
    setProgress((prevProgress) => {
      // Only update if new progress is greater than previous
      // This prevents 100% -> 0% jumps
      return Math.max(prevProgress, percentage);
    });
    console.log('[FFmpeg Progress]:', percentage + '%');
  }
});



    // const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm';
    const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core-mt@0.12.6/dist/esm';
    console.log('2. Base URL set:', baseURL);

    const coreURL = `${baseURL}/ffmpeg-core.js`;
    const wasmURL = `${baseURL}/ffmpeg-core.wasm`;
    const workerURL = `${baseURL}/ffmpeg-core.worker.js`;

    console.log('3. URLs to load:');
    console.log('   - coreURL:', coreURL);
    console.log('   - wasmURL:', wasmURL);
    console.log('   - workerURL:', workerURL);

    console.log('4. Converting URLs to blobs...');
    const coreBlob = await toBlobURL(coreURL, 'text/javascript');
    console.log('   ✓ coreBlob created:', coreBlob);

    const wasmBlob = await toBlobURL(wasmURL, 'application/wasm');
    console.log('   ✓ wasmBlob created:', wasmBlob);

    const workerBlob = await toBlobURL(workerURL, 'text/javascript');
    console.log('   ✓ workerBlob created:', workerBlob);

    console.log('5. Loading FFmpeg with blobs...');
    await ffmpeg.load({
      coreURL: coreBlob,
      wasmURL: wasmBlob,
      workerURL: workerBlob,
    });

    console.log('6. FFmpeg loaded successfully!');
    console.log('   - FFmpeg loaded status:', ffmpeg.loaded);

    setFfmpegReady(true);
    // setMessage('✓ FFmpeg ready!');
    console.log('=== FFMPEG LOAD SUCCESS ===');
  } catch (error) {
    console.error('=== FFMPEG LOAD FAILED ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error:', error);
    // setMessage('❌ Failed to load FFmpeg: ' + error.message);
  }
};


// const handleCancelConversion = async () => {
//   try {
//     const ffmpeg = ffmpegRef.current;
//     if (ffmpeg && ffmpeg.loaded) {
//       await ffmpeg.terminate();
//       setFfmpegReady(false);
//     }
//   } catch (error) {
//     console.error('Error terminating FFmpeg:', error);
//   } finally {
//     setLoading(false);
//     setProgress(0);
//     // setMessage('❌ Conversion cancelled');
//   }
// };



//   useEffect(() => {
//     if (showBitrateModal && !ffmpegReady) {
//       loadFFmpeg();
//     }
//   }, [showBitrateModal, ffmpegReady]);



// Auto-select first available tab when file changes AND load FFmpeg if needed
useEffect(() => {
  if (availableButtons.length > 0) {
    if (availableButtons.includes('changeFormat')) {
      setActiveTab('format');
    } else if (availableButtons.includes('compress')) {
      setActiveTab('compress');
    } else if (availableButtons.includes('changeBitrate')) {
      setActiveTab('bitrate');
    }
  }
}, [availableButtons, currentFileIndex]);

// Load FFmpeg when bitrate tab becomes active
useEffect(() => {
  if (activeTab === 'bitrate' && !ffmpegReady) {
    loadFFmpeg();
  }
}, [activeTab, ffmpegReady]);


// const handleCancelConversion = async () => {
//   try {
//     const ffmpeg = ffmpegRef.current;
//     if (ffmpeg && ffmpeg.loaded) {
//       await ffmpeg.terminate();
//       setFfmpegReady(false);
//     }
//   } catch (error) {
//     console.error('Error terminating FFmpeg:', error);
//   } finally {
//     setLoading(false);
//     setProgress(0);
//     setMessage('⏹️ Canceling...');
    
//     // Close modal after 1 second
//     setTimeout(() => {
//       setShowFormatModal(false);
//       setShowBitrateModal(false);
//       setShowCompressModal(false);
//       setMessage('');
//     }, 1000);
//   }
// };

const handleCancelConversion = async () => {
  try {
    const ffmpeg = ffmpegRef.current;
    if (ffmpeg && ffmpeg.loaded) {
      await ffmpeg.terminate();
      setFfmpegReady(false);
    }
  } catch (error) {
    console.error('Error terminating FFmpeg:', error);
  } finally {
    setLoading(false);
    setProgress(0);
    // Set message to the appropriate modal's message state
    if (showFormatModal) {
      setFormatMessage('⏹️ Canceling...');
    } else if (showBitrateModal) {
      setBitrateMessage('⏹️ Canceling...');
    }
    
    // Close all modals after 1 second
    setTimeout(() => {
      setShowFormatModal(false);
      setShowBitrateModal(false);
      setShowCompressModal(false);
      setFormatMessage('');
      setBitrateMessage('');
      setCompressMessage('');
    }, 1000);
  }
};





useEffect(() => {
  if ((showBitrateModal || (showFormatModal && fileInfo?.type === 'video')) && !ffmpegReady) {
    loadFFmpeg();
  }
}, [showBitrateModal, showFormatModal, fileInfo?.type, ffmpegReady]);


//   const getBitrateOptions = () => {
//     if (fileInfo?.type === 'audio') return ['64k', '128k', '192k', '256k', '320k'];
//     return [];
//   };

const getBitrateOptions = () => {
  if (fileInfo?.type === 'video') return ['500k', '1000k', '2000k', '4000k', '8000k'];
  if (fileInfo?.type === 'audio') return ['64k', '128k', '192k', '256k', '320k'];
  return [];
};


 const handleBitrateConvert = async () => {
  if (!selectedBitrate || !currentFile || !ffmpegReady) return;

  setLoading(true);
  setProgress(0);

  try {
    const ffmpeg = ffmpegRef.current;

    if (!ffmpeg.loaded) {
      throw new Error('FFmpeg is not ready');
    }

    const fileExtension = currentFile.name.split('.').pop().toLowerCase();
    const nameWithoutExt = currentFile.name.split('.').slice(0, -1).join('.');
    const inputName = `input.${fileExtension}`;
    const outputName = `${nameWithoutExt}.${fileExtension}`;

    console.log('=== BITRATE CONVERSION START ===');
    console.log('File:', currentFile.name);
    console.log('Type:', fileInfo.type);
    console.log('Selected Bitrate:', selectedBitrate);

    await ffmpeg.writeFile(inputName, await fetchFile(currentFile.file));
    console.log('Input file written');

    let command = [];

    if (fileInfo.type === 'video') {
      command = [
        '-i', inputName,
        '-b:v', selectedBitrate,
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-c:a', 'aac',
        '-b:a', '128k',
        outputName
      ];
    } else if (fileInfo.type === 'audio') {
      command = [
        '-i', inputName,
        '-b:a', selectedBitrate,
        '-ar', '44100',
        outputName
      ];
    }

    console.log('Executing command:', command.join(' '));

    const startTime = Date.now();
    await ffmpeg.exec(command);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`Conversion completed in ${duration}s`);

    const data = await ffmpeg.readFile(outputName);
    const mimeType = fileInfo.type === 'video' ? `video/${fileExtension}` : `audio/${fileExtension}`;
    
    const blob = new Blob([data.buffer], { type: mimeType });
    const convertedFile = new File([blob], outputName, { type: mimeType });

    console.log('Output file created:', outputName);

    handleUpdateFile(convertedFile);
    setMessage(`✓ Bitrate changed!`);
    setShowBitrateModal(false);

    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);
    
    console.log('=== BITRATE CONVERSION SUCCESS ===');
  } catch (error) {
    console.error('=== BITRATE CONVERSION FAILED ===');
    console.error('Conversion error:', error);
    // setMessage(`❌ ${error?.message || 'Conversion failed'}`);
  } finally {
    setLoading(false);
    setProgress(0);
    setSelectedBitrate(null);
  }
};


  const formatBytes = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  // Add this function
const truncateFilename = (filename, maxLength = 15) => {
  if (filename.length <= maxLength) return filename;
  return filename.substring(0, maxLength) + '...';
};

  const handleApplyAndClose = () => {
    onFilesUpdated(selectedFilesList.map(f => f.file));
    onClose();
  };

  const formatOptions = getFormatOptions();
  const bitrateOptions = getBitrateOptions();

  if (!isOpen) return null;

return (
  <div style={{ 
    position: 'fixed', 
    inset: 0, 
    background: 'rgba(0,0,0,0.5)', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    zIndex: 9999
  }}>
    <div style={{ 
      background: 'white', 
      borderRadius: '12px', 
      boxShadow: '0 10px 40px rgba(0,0,0,0.2)', 
      maxWidth: '650px', 
      width: '90%', 
      maxHeight: '85vh', 
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      
      {/* Header */}
      {/* <div style={{ 
        background: '#FFAB49', 
        padding: '18px 24px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center'
      }}>
        <h2 style={{ 
          margin: 0, 
          fontSize: '1.4em', 
          color: 'white',
          fontWeight: '600'
        }}>
          File Conversion Options
        </h2>
        <button 
          onClick={onClose} 
          style={{ 
            background: 'rgba(255,255,255,0.2)', 
            border: 'none', 
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            cursor: 'pointer', 
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
          onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
        >
          <FiX size={20} />
        </button>
      </div> */}
      {/* Header */}
<div style={{
  // background: 'cyan',
  color:"black",
  padding: '12px 24px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom:"1px solid #F6F6F6"
}}>
  <div style={{display:"flex", justifyContent:"center", alignItems:"center", gap:"10px" }}>
    <div>
      <div style={{padding:"5px", backgroundColor:"#F9F9F9", borderRadius:"10px", display:'flex', justifyContent:"center", alignItems:"center"}}>
        <FaFileAlt style={{fontSize:"30px", color:"#FFAB49"}} />
      </div>
    </div>
    <div>
    <p style={{
    margin: 0,
    fontSize: '1.3em',
    color: 'black',
    fontWeight: '600'
  }}>
    File Conversion
  </p>
  <p style={{marginTop:"0"}}>Manage file format and compression</p>
  </div>
  </div>
  <button
    onClick={onClose}
    style={{
      background: 'rgba(255,255,255,0.2)',
      border: 'none',
      width: '36px',
      height: '36px',
      borderRadius: '8px',
      cursor: 'pointer',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background 0.2s'
    }}
    onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.3)'; }}
    onMouseLeave={(e) => { e.target.style.background = 'rgba(255,255,255,0.2)'; }}
  >
    <FiX size={20} />
  </button>
</div>


        {/* Action Buttons - Now functioning as Tabs */}
<div style={{width:"90%",   display:"flex", margin:"10px auto" }}>
    <div style={{backgroundColor:"#F6F6F6", padding:"3px", height:"52px", width:"100%", borderRadius:"28px"}}>
      <div style={{ 
  display: 'grid', 
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', 
  gap: '12px', 
  marginBottom: '20px' ,
  padding: "2px 5px"
}}>
  {availableButtons.includes('changeFormat') && (
    <button
      onClick={() => setActiveTab('format')}
      disabled={loading}
      style={{
        padding: '10px 18px',
        // background: loading ? '#ddd' : (activeTab === 'format' ? '#FFAB49' : '#FFE3CA'),
        background: loading ? '#ddd' : (activeTab === 'format' ? 'white' : '#ffffff01'),
        color: loading ? '#999' : (activeTab === 'format' ? '#be1717ff' : '#333'),
        // border: loading ? '2px solid #ccc' : (activeTab === 'format' ? '2px solid #FFAB49' : '2px solid #FFD5A9'),
        borderRadius: '28px',
        cursor: loading ? 'not-allowed' : 'pointer',
        fontSize: '0.95em',
        fontWeight: '600',
        opacity: loading ? 0.6 : 1,
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px'
      }}
      onMouseEnter={(e) => { 
        if (!loading && activeTab !== 'format') {
          e.target.style.background = 'white';
          e.target.style.borderColor = 'white';
        }
      }}
      onMouseLeave={(e) => { 
        if (!loading && activeTab !== 'format') {
          e.target.style.background = '#ffffff01';
          e.target.style.borderColor = '#ffffff01';
        }
      }}
    >
      <MdOutlineChangeCircle size={18} />
      Change Format
    </button>
  )}


  {availableButtons.includes('compress') && (
    <button
      onClick={() => setActiveTab('compress')}
      disabled={loading}
      style={{
        padding: '10px 18px',
         background: loading ? '#ddd' : (activeTab === 'compress' ? 'white' : '#ffffff01'),
        color: loading ? '#999' : (activeTab === 'compress' ? '#be1717ff' : '#333'),

        // background: loading ? '#ddd' : (activeTab === 'compress' ? '#FFAB49' : '#FFE3CA'),
        // color: loading ? '#999' : (activeTab === 'compress' ? '#fff' : '#333'),
        // border: loading ? '2px solid #ccc' : (activeTab === 'compress' ? '2px solid #FFAB49' : '2px solid #FFD5A9'),
        borderRadius: '28px',
        cursor: loading ? 'not-allowed' : 'pointer',
        fontSize: '0.95em',
        fontWeight: '600',
        opacity: loading ? 0.6 : 1,
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px'
      }}
      onMouseEnter={(e) => { 
        if (!loading && activeTab !== 'compress') {
          e.target.style.background = 'white';
          e.target.style.borderColor = "white";
        }
      }}
      onMouseLeave={(e) => { 
        if (!loading && activeTab !== 'compress') {
          e.target.style.background = '#ffffff01';
          e.target.style.borderColor = '#ffffff01';
        }
      }}
    >
      <MdOutlineCompress size={18} />
      Compress
    </button>
  )}


  {availableButtons.includes('changeBitrate') && (
    <button
      onClick={() => setActiveTab('bitrate')}
      disabled={loading}
      style={{
        padding: '10px 18px',
         background: loading ? '#ddd' : (activeTab === 'bitrate' ? 'white' : '#ffffff01'),
        color: loading ? '#999' : (activeTab === 'bitrate' ? '#be1717ff' : '#333'),

        // background: loading ? '#ddd' : (activeTab === 'bitrate' ? '#FFAB49' : '#FFE3CA'),
        // color: loading ? '#999' : (activeTab === 'bitrate' ? '#fff' : '#333'),
        // border: loading ? '2px solid #ccc' : (activeTab === 'bitrate' ? '2px solid #FFAB49' : '2px solid #FFD5A9'),
        borderRadius: '28px',
        cursor: loading ? 'not-allowed' : 'pointer',
        fontSize: '0.95em',
        fontWeight: '600',
        opacity: loading ? 0.6 : 1,
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px'
      }}
      onMouseEnter={(e) => { 
        if (!loading && activeTab !== 'bitrate') {
          e.target.style.background = 'white';
          e.target.style.borderColor = 'white';
        }
      }}
      onMouseLeave={(e) => { 
        if (!loading && activeTab !== 'bitrate') {
          e.target.style.background = '#ffffff01';
          e.target.style.borderColor = '#ffffff01';
        }
      }}
    >
      <BiSliderAlt size={18} />
      Change Bitrate
    </button>
  )}
</div>
    </div>

</div>


      {/* Body */}
      <div style={{padding:"5px", backgroundColor:"#F6F6F6"}}>
        <div style={{ padding: '12px', margin:"12px", overflowY: 'scroll', maxHeight:"52vh" ,flex: 1, backgroundColor:"white", borderRadius:"10px" }}>
        {selectedFilesList.length > 0 && currentFile && fileInfo && (
          <>
            {/* File Selector - NEW DESIGN for multiple files */}
            {/* File Tabs - Pill Style */}
{selectedFilesList.length > 1 && (
  <div style={{ marginBottom: '24px' }}>
    <p style={{ 
      margin: '0 0 12px 0', 
      fontSize: '0.85em', 
      color: '#666', 
      fontWeight: '600',
      // textTransform: 'uppercase',
      letterSpacing: '0.5px'
    }}>
      Files ({selectedFilesList.length}) <span style={{color:"red"}}>*</span>
    </p>
    <div style={{ 
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap',
      padding: '12px',
      // background: '#f9f9f9',
      background: 'white',
      borderRadius: '12px',
      border: '1px solid #FFAB49',
      maxHeight:"110px",
      overflowY:"auto"
    }}>
      {selectedFilesList.map((fileData, index) => (
        <button
          key={fileData.id}
          onClick={() => handleSwitchFile(index)}
          style={{
            padding: '6px 12px',
            border: '1px solid #f0f0f0ff',
            // borderColor: currentFileIndex === index ? '#FFAB49' : '#e0e0e0',
            borderRadius: '20px',
            background: currentFileIndex === index ? '#FFAB49' : '#f9f9f9',
            cursor: 'pointer',
            fontWeight: currentFileIndex === index ? '600' : '500',
            color: currentFileIndex === index ? 'white' : '#686666ff',
            fontSize: '0.85em',
            maxWidth: '160px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
          title={fileData.name}
          // onMouseEnter={(e) => {
          //   if (currentFileIndex !== index) {
          //     e.target.style.borderColor = '#FFAB49';
          //     e.target.style.color = '#FFAB49';
          //   }
          // }}
          // onMouseLeave={(e) => {
          //   if (currentFileIndex !== index) {
          //     e.target.style.borderColor = '#e0e0e0';
          //     e.target.style.color = '#666';
          //   }
          // }}
        >
          <FiFile size={14} />
          {/* {fileData.name} */}
          {truncateFilename(fileData.name, 15)}
        </button>
      ))}
    </div>
  </div>
)}


            {/* File Info Card */}
           {/* File Info - Horizontal Card Layout */}
{/* File Properties - Collapsible Card */}
<div
  style={{
    marginBottom: '24px',
    background: '#FFFAF5',
    border: '2px solid #FFAB49',
    borderRadius: '10px',
    overflow: 'hidden'
  }}
>
  {/* Accordion Header */}
  <div
    onClick={() => setShowFileProperties(!showFileProperties)}
    style={{
      background: '#FFFAF5',
      padding: '6px 20px',
      cursor: 'pointer',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      transition: 'all 0.2s'
    }}
    onMouseEnter={(e) => {
      // e.currentTarget.style.borderColor = '#FFE3CA';
      // e.currentTarget.style.background = '#FFFBF7';
    }}
    onMouseLeave={(e) => {
      // e.currentTarget.style.background = 'white';
    }}
  >
    <h3 style={{ margin: 0, fontSize: '1em', color: '#333', fontWeight: '600' }}>
      File Properties
    </h3>
    <div
      style={{
        transform: showFileProperties ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: 'transform 0.3s',
        display: 'flex',
        alignItems: 'center',
        color: '#999'
      }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    </div>
  </div>

  {/* Accordion Content */}
  <div
    style={{
      maxHeight: showFileProperties ? '600px' : '0',
      overflow: 'hidden',
      transition: 'max-height 0.4s ease-in-out, opacity 0.3s ease-in-out',
      opacity: showFileProperties ? 1 : 0
    }}
  >
    <div style={{ padding: '0 20px 16px 20px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 0',
          borderBottom: '1px solid #e8e8e8'
        }}
      >
        <span style={{ fontSize: '0.9em', color: '#666', fontWeight: '500' }}>
          File Name
        </span>
        <span
          style={{
            fontSize: '0.9em',
            color: '#333',
            fontWeight: '600',
            maxWidth: '60%',
            textAlign: 'right',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {currentFile.name}
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 0',
          borderBottom: '1px solid #e8e8e8'
        }}
      >
        <span style={{ fontSize: '0.9em', color: '#666', fontWeight: '500' }}>
          File Size
        </span>
        <span style={{ fontSize: '0.9em', color: '#333', fontWeight: '600' }}>
          {formatBytes(currentFile.size)}
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 0',
          borderBottom: '1px solid #e8e8e8'
        }}
      >
        <span style={{ fontSize: '0.9em', color: '#666', fontWeight: '500' }}>
          File Type
        </span>
        <span
          style={{
            fontSize: '0.9em',
            color: '#333',
            fontWeight: '600',
            textTransform: 'capitalize'
          }}
        >
          {fileInfo.type}
        </span>
      </div>

      {fileInfo.type === 'image' && originalDimensions.width > 0 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 0',
            borderBottom: '1px solid #e8e8e8'
          }}
        >
          <span style={{ fontSize: '0.9em', color: '#666', fontWeight: '500' }}>
            Original Dimension
          </span>
          <span style={{ fontSize: '0.9em', color: '#333', fontWeight: '600' }}>
            {originalDimensions.width} × {originalDimensions.height} px
          </span>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 0 0 0'
        }}
      >
        <span style={{ fontSize: '0.9em', color: '#666', fontWeight: '500' }}>
          Current Format
        </span>
        <span
          style={{
            fontSize: '0.9em',
            color: '#333',
            fontWeight: '600',
            textTransform: 'uppercase'
          }}
        >
          .{fileInfo.extension}
        </span>
      </div>
    </div>
  </div>
</div>




            {/* Success Message */}
            {formatMessage && (
              <div style={{
                background: formatMessage.includes('✕') || formatMessage.includes('❌') ? '#ffebee' : '#e8f5e9',
                color: formatMessage.includes('✕') || formatMessage.includes('❌') ? '#c62828' : '#2e7d32',
                padding: '14px 18px',
                borderRadius: '8px',
                marginBottom: '24px',
                fontSize: '0.9em',
                textAlign: 'center',
                fontWeight: '500',
                border: `2px solid ${formatMessage.includes('✕') || formatMessage.includes('❌') ? '#ffcdd2' : '#c8e6c9'}`
              }}>
                {formatMessage}
              </div>
            )}




              {/* ===== NESTED MODALS ===== */}

              {/* Format Modal */}
{/* Tab Content Area - Displays below buttons */}
{activeTab && (
  <div style={{
    marginTop: '20px',
    padding: '24px',
    background: 'white',
    borderRadius: '10px',
    border: '2px solid #FFE3CA'
  }}>
    {/* FORMAT TAB CONTENT */}
   {activeTab === 'format' && !loading && (
  <div>
    {/* Select New Format Label */}
    <p style={{
      margin: '0 0 16px 0',
      fontSize: '0.85em',
      color: '#666',
      fontWeight: '600',
      letterSpacing: '0.3px'
    }}>
      Select new Format *
    </p>
    
    {/* Radio Button List - Horizontal with Wrap */}
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: '12px 16px',
      marginBottom: '24px'
    }}>
      {formatOptions.map(format => (
        <label
          key={format}
          style={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            fontSize: '0.9em',
            color: '#333',
            minWidth: 'fit-content'
          }}
        >
          <input
            type="radio"
            name="formatOption"
            value={format}
            checked={selectedFormat === format}
            onChange={(e) => setSelectedFormat(e.target.value)}
            style={{
              width: '18px',
              height: '18px',
              cursor: 'pointer',
              accentColor: '#FFAB49',
              marginRight: '8px',
              flexShrink: 0
            }}
          />
          <span style={{ fontWeight: '500', whiteSpace: 'nowrap' }}>
            .{format}
          </span>
        </label>
      ))}
    </div>

    {/* Change Format Button */}
    <div style={{display:"flex", justifyContent:"end", alignItems:"center"}}>
      <button
      onClick={() => handleFormatConvert(selectedFormat)}
      disabled={!selectedFormat}
      style={{
        width: '170px',
        // padding: '14px 20px',
        padding: '8px 12px',
        background: selectedFormat ? '#FFAB49' : '#E0E0E0',
        color: selectedFormat ? 'white' : '#999',
        border: 'none',
        borderRadius: '25px',
        cursor: selectedFormat ? 'pointer' : 'not-allowed',
        fontSize: '1em',
        fontWeight: '700',
        transition: 'all 0.2s',
        marginBottom: '16px'
      }}
      onMouseEnter={(e) => {
        if (selectedFormat) {
          e.target.style.background = '#FF9830';
        }
      }}
      onMouseLeave={(e) => {
        if (selectedFormat) {
          e.target.style.background = '#FFAB49';
        }
      }}
    >
      Change Format
    </button>
    </div>

    {/* Format Message */}
    {formatMessage && (
      <div style={{
        background: formatMessage.includes('fail') || formatMessage.includes('error') ? '#ffebee' : '#e8f5e9',
        color: formatMessage.includes('fail') || formatMessage.includes('error') ? '#c62828' : '#2e7d32',
        padding: '12px',
        borderRadius: '6px',
        fontSize: '0.9em',
        textAlign: 'center',
        fontWeight: '600'
      }}>
        {formatMessage}
      </div>
    )}
  </div>
)}





    {/* COMPRESS TAB CONTENT */}
{activeTab === 'compress' && !loading && (
  <div>
    {/* Original Dimensions */}
    {originalDimensions.width > 0 && (
      <div style={{
        marginBottom: '24px',
        padding: '14px 18px',
        background: 'white',
        borderRadius: '8px',
        border: '1px solid #f0e6dc'
      }}>
        <p style={{
          margin: '0 0 4px 0',
          fontSize: '0.75em',
          color: '#666',
          fontWeight: '600'
        }}>Original Dimension</p>
        <p style={{
          margin: 0,
          fontSize: '1em',
          color: '#333',
          fontWeight: '600'
        }}>{originalDimensions.width} * {originalDimensions.height} px</p>
      </div>
    )}

    {/* Compression Quality */}
    <div style={{ marginBottom: '24px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
        
      }}>
        <label style={{
          margin: 0,
          fontSize: '0.85em',
          color: '#333',
          fontWeight: '600'
        }}>Compression Quality *</label>
        <div style={{
          padding: '4px 12px',
          background: '#FFE3CA',
          borderRadius: '12px',
          fontSize: '0.75em',
          color: '#FFAB49',
          fontWeight: '700'
        }}>
          {qualityLevels[qualityLevel].label}
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={5}
        value={qualityLevel}
        onChange={(e) => setQualityLevel(parseInt(e.target.value))}
        style={{
          width: '100%',
          cursor: 'pointer',
          height: '6px',
          borderRadius: '3px',
          accentColor: '#FFAB49'
        }}
      />
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '8px'
      }}>
        <span style={{ fontSize: '0.75em', color: '#999', fontWeight: '500' }}>Max</span>
        <span style={{ fontSize: '0.75em', color: '#999', fontWeight: '500' }}>Min</span>
      </div>
    </div>

    {/* Maximum Width */}
    <div style={{ marginBottom: '24px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <label style={{
          margin: 0,
          fontSize: '0.85em',
          color: '#333',
          fontWeight: '600'
        }}>Maximum Width</label>
        <div style={{
          padding: '4px 12px',
          background: '#FFE3CA',
          borderRadius: '12px',
          fontSize: '0.75em',
          color: '#FFAB49',
          fontWeight: '700'
        }}>
          {maxWidth} px
        </div>
      </div>
      <input
        type="range"
        min={320}
        max={3840}
        step={160}
        value={maxWidth}
        onChange={(e) => setMaxWidth(parseInt(e.target.value))}
        style={{
          width: '100%',
          cursor: 'pointer',
          height: '6px',
          borderRadius: '3px',
          accentColor: '#FFAB49'
        }}
      />
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '8px'
      }}>
        <span style={{ fontSize: '0.75em', color: '#999', fontWeight: '500' }}>Max</span>
        <span style={{ fontSize: '0.75em', color: '#999', fontWeight: '500' }}>Min</span>
      </div>
    </div>

    {/* Maximum Height */}
    <div style={{ marginBottom: '24px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <label style={{
          margin: 0,
          fontSize: '0.85em',
          color: '#333',
          fontWeight: '600'
        }}>Maximum Width</label>
        <div style={{
          padding: '4px 12px',
          background: '#FFE3CA',
          borderRadius: '12px',
          fontSize: '0.75em',
          color: '#FFAB49',
          fontWeight: '700'
        }}>
          {maxHeight} px
        </div>
      </div>
      <input
        type="range"
        min={240}
        max={2160}
        step={120}
        value={maxHeight}
        onChange={(e) => setMaxHeight(parseInt(e.target.value))}
        style={{
          width: '100%',
          cursor: 'pointer',
          height: '6px',
          borderRadius: '3px',
          accentColor: '#FFAB49'
        }}
      />
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '8px'
      }}>
        <span style={{ fontSize: '0.75em', color: '#999', fontWeight: '500' }}>Max</span>
        <span style={{ fontSize: '0.75em', color: '#999', fontWeight: '500' }}>Min</span>
      </div>
    </div>

    {/* Compress Button */}
   {/* <div > */}
   <div style={{display:"flex", justifyContent:"end", alignItems:"center"}}>
     <button
      onClick={handleCompressImage}
      style={{
        width: '170px',
        padding: '8px 12px',
        background: '#FFAB49',
        color: 'white',
        border: 'none',
        borderRadius: '25px',
        cursor: 'pointer',
        fontWeight: '700',
        fontSize: '1em',
        transition: 'all 0.2s',
        marginBottom: '16px'
      }}
      onMouseEnter={(e) => {
        e.target.style.background = '#FF9830';
      }}
      onMouseLeave={(e) => {
        e.target.style.background = '#FFAB49';
      }}
    >
      Compress Image
    </button>
   </div>

    {compressMessage && (
      <div style={{
        background: compressMessage.includes('fail') || compressMessage.includes('error') ? '#ffebee' : '#e8f5e9',
        color: compressMessage.includes('fail') || compressMessage.includes('error') ? '#c62828' : '#2e7d32',
        padding: '12px',
        borderRadius: '6px',
        fontSize: '0.9em',
        textAlign: 'center',
        fontWeight: '600'
      }}>
        {compressMessage}
      </div>
    )}
  </div>
)}


   {/* BITRATE TAB CONTENT */}
{activeTab === 'bitrate' && (
  <div>
    {!ffmpegReady ? (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
        <p style={{ fontSize: '1.2em', fontWeight: '600', marginBottom: '8px' }}>
          Loading FFmpeg...
        </p>
        <p style={{ fontSize: '0.9em', color: '#999', margin: 0 }}>
          This may take a moment
        </p>
      </div>
    ) : !loading ? (
      <>
        {/* Select Bitrate Label */}
        <p style={{
          margin: '0 0 16px 0',
          fontSize: '0.85em',
          color: '#666',
          fontWeight: '600',
          letterSpacing: '0.3px'
        }}>
          Select Bitrate *
        </p>
        
        {/* Radio Button List - Horizontal with Wrap */}
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: '12px 16px',
          marginBottom: '24px'
        }}>
          {bitrateOptions.map(bitrate => (
            <label
              key={bitrate}
              style={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                fontSize: '0.9em',
                color: '#333',
                minWidth: 'fit-content'
              }}
            >
              <input
                type="radio"
                name="bitrateOption"
                value={bitrate}
                checked={selectedBitrate === bitrate}
                onChange={(e) => setSelectedBitrate(e.target.value)}
                style={{
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer',
                  accentColor: '#FFAB49',
                  marginRight: '8px',
                  flexShrink: 0
                }}
              />
              <span style={{ fontWeight: '500', whiteSpace: 'nowrap' }}>
                {bitrate}
              </span>
            </label>
          ))}
        </div>

        {/* Change Bitrate Button */}
        <button
          onClick={handleBitrateConvert}
          disabled={!selectedBitrate || !ffmpegReady}
          style={{
            width: '100%',
            padding: '14px 20px',
            background: selectedBitrate && ffmpegReady ? '#FFAB49' : '#E0E0E0',
            color: selectedBitrate && ffmpegReady ? 'white' : '#999',
            border: 'none',
            borderRadius: '25px',
            cursor: selectedBitrate && ffmpegReady ? 'pointer' : 'not-allowed',
            fontSize: '1em',
            fontWeight: '700',
            transition: 'all 0.2s',
            marginBottom: '16px'
          }}
          onMouseEnter={(e) => {
            if (selectedBitrate && ffmpegReady) {
              e.target.style.background = '#FF9830';
            }
          }}
          onMouseLeave={(e) => {
            if (selectedBitrate && ffmpegReady) {
              e.target.style.background = '#FFAB49';
            }
          }}
        >
          Change Bitrate
        </button>

        {bitrateMessage && (
          <div style={{
            background: bitrateMessage.includes('fail') || bitrateMessage.includes('error') ? '#ffebee' : '#e8f5e9',
            color: bitrateMessage.includes('fail') || bitrateMessage.includes('error') ? '#c62828' : '#2e7d32',
            padding: '12px',
            borderRadius: '6px',
            fontSize: '0.9em',
            textAlign: 'center',
            fontWeight: '600'
          }}>
            {bitrateMessage}
          </div>
        )}
      </>
    ) : null}
  </div>
)}


    {/* LOADING STATE - Shows for all tabs */}
    {loading && progress > 0 && (
  <div style={{ marginTop: '20px' }}>
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '12px'
    }}>
      <p className="progress-converting-text" style={{ margin: 0, color: '#333', fontSize: '1em', fontWeight: '600', letterSpacing: '0.5px' }}>
        Converting<span className="progress-loading-dots"></span>
      </p>
      <p style={{ margin: 0, color: '#FFAB49', fontSize: '1.3em', fontWeight: '700' }}>
        {Math.min(progress, 100)}%
      </p>
    </div>
    <div style={{
      background: '#e0e0e0',
      borderRadius: '4px',
      overflow: 'hidden',
      height: '10px'
    }}>
      <div style={{
        background: '#FFAB49',
        height: '100%',
        width: `${Math.min(progress, 100)}%`,
        transition: 'width 0.3s ease'
      }} />
    </div>
    <button
      onClick={handleCancelConversion}
      style={{
        marginTop: '16px',
        width: '100%',
        padding: '12px',
        background: '#ff6b6b',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '0.95em'
      }}
    >
      Cancel Conversion
    </button>
  </div>
)}

  </div>
)}



          </>
        )}
      </div>
      </div>
      

      {/* Footer */}
      <div style={{ 
        background: 'white', 
        borderTop: '2px solid #fff9f3ff', 
        padding: '16px 24px', 
        display: 'flex', 
        gap: '12px', 
        justifyContent: 'center',
        alignItems:"center"

      }}>
        <button
          onClick={onClose}
          style={{
            padding: '10px 24px',
            background: 'white',
            color: '#333',
            border: '1px solid #f2f2f2ff',
            borderRadius: '28px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '0.95em',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.background = '#f5f5f5'}
          onMouseLeave={(e) => e.target.style.background = 'white'}
        >
          Close
        </button>
        <button
          onClick={handleApplyAndClose}
          disabled={loading}
          style={{
            padding: '10px 24px',
            background: loading ? '#ddd' : '#FFAB49',
            color: 'white',
            border: 'none',
            borderRadius: '28px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: '600',
            fontSize: '0.95em',
            opacity: loading ? 0.6 : 1,
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => { if (!loading) e.target.style.background = '#ff9a2e'; }}
          onMouseLeave={(e) => { if (!loading) e.target.style.background = '#FFAB49'; }}
        >
          {loading ? 'Processing...' : 'Apply & Close'}
        </button>
      </div>
    </div>
  </div>
);


}

export default FileConversionModal;
