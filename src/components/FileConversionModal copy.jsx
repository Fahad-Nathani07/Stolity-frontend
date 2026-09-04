import React, { useState, useRef, useEffect } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL, fetchFile } from '@ffmpeg/util';
import imageCompression from 'browser-image-compression';
import { detectFileType, getAvailableButtons } from '../utils/fileTypeDetector';
import { convertImage, convertData } from '../services/conversionService';
import { FiFile, FiX } from 'react-icons/fi';
import { MdOutlineChangeCircle, MdOutlineCompress } from 'react-icons/md';
import { BiSliderAlt } from 'react-icons/bi';

function FileConversionModal({ isOpen, onClose, files, onFilesUpdated }) {
  const [selectedFilesList, setSelectedFilesList] = useState([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [fileInfo, setFileInfo] = useState(null);
  const [availableButtons, setAvailableButtons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  
// ADD THESE NEW LINES:
const [formatMessage, setFormatMessage] = useState(''); // Format modal only
const [bitrateMessage, setBitrateMessage] = useState(''); // Bitrate modal only
const [compressMessage, setCompressMessage] = useState(''); // Compress modal only

  // Format states
  const [showFormatModal, setShowFormatModal] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState(null);

  // Compress states
  const [showCompressModal, setShowCompressModal] = useState(false);
  const [qualityLevel, setQualityLevel] = useState(3);
  const [maxWidth, setMaxWidth] = useState(1920);
  const [maxHeight, setMaxHeight] = useState(1080);
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });

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
      <div style={{ 
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
      </div>

      {/* Body */}
      <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
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
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    }}>
      Files ({selectedFilesList.length})
    </p>
    <div style={{ 
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap',
      padding: '12px',
      background: '#f9f9f9',
      borderRadius: '8px',
      border: '1px solid #e0e0e0'
    }}>
      {selectedFilesList.map((fileData, index) => (
        <button
          key={fileData.id}
          onClick={() => handleSwitchFile(index)}
          style={{
            padding: '10px 18px',
            border: '2px solid',
            borderColor: currentFileIndex === index ? '#FFAB49' : '#e0e0e0',
            borderRadius: '20px',
            background: currentFileIndex === index ? '#FFAB49' : 'white',
            cursor: 'pointer',
            fontWeight: currentFileIndex === index ? '600' : '500',
            color: currentFileIndex === index ? 'white' : '#666',
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
          onMouseEnter={(e) => {
            if (currentFileIndex !== index) {
              e.target.style.borderColor = '#FFAB49';
              e.target.style.color = '#FFAB49';
            }
          }}
          onMouseLeave={(e) => {
            if (currentFileIndex !== index) {
              e.target.style.borderColor = '#e0e0e0';
              e.target.style.color = '#666';
            }
          }}
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
<div style={{ marginBottom: '24px' }}>
  {/* File Name - Separate Card */}
  <div style={{
    background: '#FFAB49',
    padding: '16px 20px',
    borderRadius: '10px',
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  }}>
    <FiFile size={24} color="white" />
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{
        margin: 0,
        fontSize: '1em',
        color: 'white',
        fontWeight: '600',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}>
        {currentFile.name}
      </p>
    </div>
  </div>

  {/* Stats Cards - Horizontal */}
  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px'
  }}>
    {/* Size Card */}
    <div style={{
      background: 'white',
      border: '2px solid #FFE3CA',
      borderRadius: '10px',
      padding: '18px 16px',
      textAlign: 'center'
    }}>
      <p style={{
        margin: '0 0 8px 0',
        fontSize: '0.75em',
        color: '#999',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        Size
      </p>
      <p style={{
        margin: 0,
        fontSize: '1.2em',
        color: '#FFAB49',
        fontWeight: '700'
      }}>
        {formatBytes(currentFile.size)}
      </p>
    </div>

    {/* Type Card */}
    <div style={{
      background: 'white',
      border: '2px solid #FFE3CA',
      borderRadius: '10px',
      padding: '18px 16px',
      textAlign: 'center'
    }}>
      <p style={{
        margin: '0 0 8px 0',
        fontSize: '0.75em',
        color: '#999',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        Type
      </p>
      <p style={{
        margin: 0,
        fontSize: '1.2em',
        color: '#FFAB49',
        fontWeight: '700',
        textTransform: 'uppercase'
      }}>
        {fileInfo.type}
      </p>
    </div>

    {/* Format Card */}
    <div style={{
      background: 'white',
      border: '2px solid #FFE3CA',
      borderRadius: '10px',
      padding: '18px 16px',
      textAlign: 'center'
    }}>
      <p style={{
        margin: '0 0 8px 0',
        fontSize: '0.75em',
        color: '#999',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        Format
      </p>
      <p style={{
        margin: 0,
        fontSize: '1.2em',
        color: '#FFAB49',
        fontWeight: '700',
        textTransform: 'uppercase'
      }}>
        .{fileInfo.extension}
      </p>
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

            {/* Action Buttons */}
<div style={{ 
  display: 'grid', 
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', 
  gap: '12px', 
  marginBottom: '20px' 
}}>
  {availableButtons.includes('changeFormat') && (
    <button
      onClick={() => setShowFormatModal(true)}
      disabled={loading}
      style={{
        padding: '14px 18px',
        background: loading ? '#ddd' : '#FFE3CA',
        color: loading ? '#999' : '#333',
        border: loading ? '2px solid #ccc' : '2px solid #FFD5A9',
        borderRadius: '8px',
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
        if (!loading) {
          e.target.style.background = '#FFD5A9';
          e.target.style.borderColor = '#FFAB49';
        }
      }}
      onMouseLeave={(e) => { 
        if (!loading) {
          e.target.style.background = '#FFE3CA';
          e.target.style.borderColor = '#FFD5A9';
        }
      }}
    >
      <MdOutlineChangeCircle size={18} />
      Change Format
    </button>
  )}

  {availableButtons.includes('compress') && (
    <button
      onClick={() => setShowCompressModal(true)}
      disabled={loading}
      style={{
        padding: '14px 18px',
        background: loading ? '#ddd' : '#FFE3CA',
        color: loading ? '#999' : '#333',
        border: loading ? '2px solid #ccc' : '2px solid #FFD5A9',
        borderRadius: '8px',
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
        if (!loading) {
          e.target.style.background = '#FFD5A9';
          e.target.style.borderColor = '#FFAB49';
        }
      }}
      onMouseLeave={(e) => { 
        if (!loading) {
          e.target.style.background = '#FFE3CA';
          e.target.style.borderColor = '#FFD5A9';
        }
      }}
    >
      <MdOutlineCompress size={18} />
      Compress
    </button>
  )}

  {availableButtons.includes('changeBitrate') && (
    <button
      onClick={() => setShowBitrateModal(true)}
      disabled={loading}
      style={{
        padding: '14px 18px',
        background: loading ? '#ddd' : '#FFE3CA',
        color: loading ? '#999' : '#333',
        border: loading ? '2px solid #ccc' : '2px solid #FFD5A9',
        borderRadius: '8px',
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
        if (!loading) {
          e.target.style.background = '#FFD5A9';
          e.target.style.borderColor = '#FFAB49';
        }
      }}
      onMouseLeave={(e) => { 
        if (!loading) {
          e.target.style.background = '#FFE3CA';
          e.target.style.borderColor = '#FFD5A9';
        }
      }}
    >
      <BiSliderAlt size={18} />
      Change Bitrate
    </button>
  )}
</div>


              {/* ===== NESTED MODALS ===== */}

              {/* Format Modal */}
{/* Format Modal - Updated */}
{showFormatModal && (
  <div style={{ 
    position: 'fixed', 
    inset: 0, 
    background: 'rgba(0,0,0,0.5)', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    zIndex: 10000
  }}>
    <div style={{ 
      background: 'white', 
      borderRadius: '10px', 
      maxWidth: '500px', 
      width: '90%',
      overflow: 'hidden',
      boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
      border: '2px solid #FFAB49'
    }} onClick={(e) => e.stopPropagation()}>
      
      {/* Header with Icon */}
      <div style={{
        background: '#FFAB49',
        padding: '18px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <MdOutlineChangeCircle size={24} color="white" />
          <h3 style={{ 
            margin: 0, 
            fontSize: '1.15em', 
            color: 'white',
            fontWeight: '600'
          }}>
            Change Format
          </h3>
        </div>
        {!loading && (
          <button 
            onClick={() => setShowFormatModal(false)}
            style={{ 
              background: 'transparent', 
              border: 'none',
              cursor: 'pointer', 
              color: 'white',
              padding: '4px'
            }}
          >
            <FiX size={22} />
          </button>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '24px' }}>
        {!loading ? (
          <>
            {/* Current Format - Inline Style */}
<p style={{
  marginBottom: '20px',
  padding: '14px 18px',
  background: 'white',
  borderRadius: '6px',
  border: '2px solid #ddd',
  fontSize: '0.9em',
  color: '#666',
  fontWeight: '500'
}}>
  Current Format: <span style={{ 
    color: '#FFAB49', 
    fontWeight: '700',
    fontSize: '1.1em',
    marginLeft: '8px'
  }}>.{fileInfo?.extension?.toUpperCase()}</span>
</p>


            {/* Format Grid */}
            <p style={{
              margin: '0 0 12px 0',
              fontSize: '0.8em',
              color: '#666',
              fontWeight: '600'
            }}>
              SELECT NEW FORMAT:
            </p>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: '10px', 
              marginBottom: '20px' 
            }}>
              {formatOptions.map((format) => (
                <button
                  key={format}
                  onClick={() => handleFormatConvert(format)}
                  style={{
                    padding: '16px 10px',
                    background: '#FFE3CA',
                    color: '#333',
                    border: '2px solid #FFAB49',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '1em',
                    fontWeight: '700',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#FFAB49';
                    e.target.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#FFE3CA';
                    e.target.style.color = '#333';
                  }}
                >
                  {format}
                </button>
              ))}
            </div>

            {/* Cancel Button with Hover & Active */}
            <button
              onClick={() => setShowFormatModal(false)}
              style={{
                padding: '12px',
                background: '#f5f5f5',
                color: '#333',
                border: '2px solid #ddd',
                borderRadius: '6px',
                cursor: 'pointer',
                width: '100%',
                fontWeight: '600',
                fontSize: '0.95em',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#e8e8e8';
                e.target.style.borderColor = '#bbb';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#f5f5f5';
                e.target.style.borderColor = '#ddd';
              }}
              onMouseDown={(e) => {
                e.target.style.transform = 'scale(0.98)';
              }}
              onMouseUp={(e) => {
                e.target.style.transform = 'scale(1)';
              }}
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            {progress === 0 ? (
              // Loading
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
                <p style={{ fontSize: '1.2em', fontWeight: '600', marginBottom: '8px' }}>
                  Initializing...
                </p>
                <p style={{ fontSize: '0.9em', color: '#999', margin: 0 }}>
                  Please wait
                </p>
              </div>
            ) : (
              // Progress
              <>
                <div style={{ marginBottom: '24px' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px'
                  }}>
                    <p style={{ 
                      margin: 0,
                      color: '#333', 
                      fontSize: '1em',
                      fontWeight: '600'
                    }}>
                      Converting...
                    </p>
                    <p style={{ 
                      margin: 0,
                      color: '#FFAB49', 
                      fontSize: '1.3em',
                      fontWeight: '700'
                    }}>
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
                    }}></div>
                  </div>
                </div>

                {formatMessage && (
                  <div style={{
                    background: formatMessage.includes('❌') || formatMessage.includes('✕') ? '#ffebee' : '#e8f5e9',
                    color: formatMessage.includes('❌') || formatMessage.includes('✕') ? '#c62828' : '#2e7d32',
                    padding: '12px',
                    borderRadius: '6px',
                    marginBottom: '16px',
                    fontSize: '0.9em',
                    textAlign: 'center',
                    fontWeight: '600'
                  }}>
                    {formatMessage}
                  </div>
                )}

                <button
                  onClick={handleCancelConversion}
                  style={{
                    padding: '12px',
                    background: '#ff6b6b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    width: '100%',
                    fontWeight: '600',
                    fontSize: '0.95em',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#ff5252';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#ff6b6b';
                  }}
                  onMouseDown={(e) => {
                    e.target.style.transform = 'scale(0.98)';
                  }}
                  onMouseUp={(e) => {
                    e.target.style.transform = 'scale(1)';
                  }}
                >
                  Cancel Conversion
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  </div>
)}




              {/* Compress Modal */}
{/* Compress Modal - Premium Design */}


{showCompressModal && (
  <div style={{ 
    position: 'fixed', 
    inset: 0, 
    background: 'rgba(0,0,0,0.5)', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    zIndex: 10000
  }}>
    <div style={{ 
      background: 'white', 
      borderRadius: '10px', 
      maxWidth: '500px', 
      width: '90%',
      overflow: 'hidden',
      boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
      border: '2px solid #FFAB49'
    }} onClick={(e) => e.stopPropagation()}>
      
      {/* Header */}
      <div style={{
        background: '#FFAB49',
        padding: '18px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <MdOutlineCompress size={24} color="white" />
          <h3 style={{ 
            margin: 0, 
            fontSize: '1.15em', 
            color: 'white',
            fontWeight: '600'
          }}>
            Compress Image
          </h3>
        </div>
        {!loading && (
          <button 
            onClick={() => setShowCompressModal(false)}
            style={{ 
              background: 'transparent', 
              border: 'none',
              cursor: 'pointer', 
              color: 'white',
              padding: '4px'
            }}
          >
            <FiX size={22} />
          </button>
        )}
      </div>

      {/* Body */}
  {/* Body */}
<div style={{ padding: '28px' }}>
  {!loading ? (
    <>
      {/* Original Dimensions Display */}
      {originalDimensions.width > 0 && (
        <div style={{
          marginBottom: '24px',
          padding: '16px 20px',
          background: 'linear-gradient(135deg, #FFE3CA 0%, #FFD5B8 100%)',
          borderRadius: '10px',
          border: '2px solid #FFAB49',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <p style={{ 
              margin: '0 0 4px 0', 
              fontSize: '0.75em', 
              color: '#666',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.8px'
            }}>
              Original Dimensions
            </p>
            <p style={{ 
              margin: 0, 
              fontSize: '1.1em', 
              color: '#333',
              fontWeight: '700'
            }}>
              {originalDimensions.width} × {originalDimensions.height} px
            </p>
          </div>
          <FiFile size={28} color="#FFAB49" />
        </div>
      )}

      {/* Compression Level - Full Width Row */}
      <div style={{ 
        marginBottom: '20px',
        padding: '20px',
        background: 'white',
        borderRadius: '10px',
        border: '2px solid #f0f0f0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '14px'
        }}>
          <label style={{ 
            margin: 0,
            fontSize: '0.85em',
            color: '#666',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.8px'
          }}>
            Compression Quality
          </label>
          <div style={{
            padding: '6px 14px',
            background: '#FFAB49',
            borderRadius: '20px',
            fontSize: '0.8em',
            color: 'white',
            fontWeight: '700',
            boxShadow: '0 2px 6px rgba(255, 171, 73, 0.3)'
          }}>
            {qualityLevels[qualityLevel].label}
          </div>
        </div>
        <input
          type="range"
          min="0"
          max="5"
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
          <span style={{ fontSize: '0.7em', color: '#999', fontWeight: '600' }}>Max</span>
          <span style={{ fontSize: '0.7em', color: '#999', fontWeight: '600' }}>Min</span>
        </div>
      </div>

      {/* Max Width - Full Width Row */}
      <div style={{ 
        marginBottom: '20px',
        padding: '20px',
        background: 'white',
        borderRadius: '10px',
        border: '2px solid #f0f0f0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        transition: 'all 0.2s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#FFAB49';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 171, 73, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#f0f0f0';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '14px'
        }}>
          <label style={{ 
            margin: 0,
            fontSize: '0.85em',
            color: '#666',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.8px'
          }}>
            Maximum Width
          </label>
          <div style={{
            padding: '6px 14px',
            background: '#FFE3CA',
            borderRadius: '20px',
            fontSize: '0.9em',
            color: '#FFAB49',
            fontWeight: '700',
            border: '1px solid #FFAB49'
          }}>
            {maxWidth} px
          </div>
        </div>
        <input
          type="range"
          min="320"
          max="3840"
          step="160"
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
      </div>

      {/* Max Height - Full Width Row */}
      <div style={{ 
        marginBottom: '28px',
        padding: '20px',
        background: 'white',
        borderRadius: '10px',
        border: '2px solid #f0f0f0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        transition: 'all 0.2s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#FFAB49';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 171, 73, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#f0f0f0';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '14px'
        }}>
          <label style={{ 
            margin: 0,
            fontSize: '0.85em',
            color: '#666',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.8px'
          }}>
            Maximum Height
          </label>
          <div style={{
            padding: '6px 14px',
            background: '#FFE3CA',
            borderRadius: '20px',
            fontSize: '0.9em',
            color: '#FFAB49',
            fontWeight: '700',
            border: '1px solid #FFAB49'
          }}>
            {maxHeight} px
          </div>
        </div>
        <input
          type="range"
          min="240"
          max="2160"
          step="120"
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
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={() => setShowCompressModal(false)}
          style={{
            flex: 1,
            padding: '14px',
            background: 'white',
            color: '#666',
            border: '2px solid #e0e0e0',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '0.95em',
            transition: 'all 0.2s',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#f9f9f9';
            e.target.style.borderColor = '#ccc';
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'white';
            e.target.style.borderColor = '#e0e0e0';
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleCompressImage}
          style={{
            flex: 1.5,
            padding: '14px',
            background: '#FFAB49',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '700',
            fontSize: '0.95em',
            transition: 'all 0.2s',
            boxShadow: '0 4px 12px rgba(255, 171, 73, 0.35)',
            letterSpacing: '0.3px'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#ff9a2e';
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 20px rgba(255, 171, 73, 0.45)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = '#FFAB49';
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 12px rgba(255, 171, 73, 0.35)';
          }}
        >
          Compress Image
        </button>
      </div>
    </>
  ) : (
    <>
      {/* Progress section stays the same */}
    </>
  )}
</div>

    </div>
  </div>
)}



              {/* Bitrate Modal */}
             {/* Bitrate Modal - Premium Design */}
{showBitrateModal && (
  <div style={{ 
    position: 'fixed', 
    inset: 0, 
    background: 'rgba(0,0,0,0.5)', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    zIndex: 10000
  }}>
    <div style={{ 
      background: 'white', 
      borderRadius: '10px', 
      maxWidth: '500px', 
      width: '90%',
      overflow: 'hidden',
      boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
      border: '2px solid #FFAB49'
    }} onClick={(e) => e.stopPropagation()}>
      
      {/* Header */}
      <div style={{
        background: '#FFAB49',
        padding: '18px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BiSliderAlt size={24} color="white" />
          <h3 style={{ 
            margin: 0, 
            fontSize: '1.15em', 
            color: 'white',
            fontWeight: '600'
          }}>
            Change Bitrate
          </h3>
        </div>
        {!loading && !ffmpegReady && (
          <button 
            onClick={() => setShowBitrateModal(false)}
            style={{ 
              background: 'transparent', 
              border: 'none',
              cursor: 'pointer', 
              color: 'white',
              padding: '4px'
            }}
          >
            <FiX size={22} />
          </button>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '24px' }}>
        {!ffmpegReady ? (
          // FFmpeg Loading
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
            <p style={{ fontSize: '1.2em', fontWeight: '600', marginBottom: '8px' }}>
              Loading FFmpeg...
            </p>
            <p style={{ fontSize: '0.9em', color: '#999', margin: 0 }}>
              This may take a moment
            </p>
          </div>
        ) : (
          <>
            {!loading ? (
              <>
                {/* File Type Info */}
                <p style={{
                  marginBottom: '20px',
                  padding: '14px 18px',
                  background: 'white',
                  borderRadius: '6px',
                  border: '2px solid #ddd',
                  fontSize: '0.9em',
                  color: '#666',
                  fontWeight: '500'
                }}>
                  File Type: <span style={{ 
                    color: '#FFAB49', 
                    fontWeight: '700',
                    fontSize: '1.1em',
                    marginLeft: '8px',
                    textTransform: 'uppercase'
                  }}>{fileInfo?.type}</span>
                </p>

                {/* Bitrate Options */}
                <p style={{
                  margin: '0 0 12px 0',
                  fontSize: '0.8em',
                  color: '#666',
                  fontWeight: '600'
                }}>
                  SELECT BITRATE:
                </p>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', 
                  gap: '10px', 
                  marginBottom: '20px' 
                }}>
                  {bitrateOptions.map((bitrate) => (
                    <button
                      key={bitrate}
                      onClick={() => setSelectedBitrate(bitrate)}
                      style={{
                        padding: '16px 10px',
                        background: selectedBitrate === bitrate ? '#FFAB49' : '#FFE3CA',
                        color: selectedBitrate === bitrate ? 'white' : '#333',
                        border: selectedBitrate === bitrate ? 'none' : '2px solid #FFAB49',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '1em',
                        fontWeight: '700',
                        transition: 'all 0.15s'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedBitrate !== bitrate) {
                          e.target.style.background = '#FFD5A9';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedBitrate !== bitrate) {
                          e.target.style.background = '#FFE3CA';
                        }
                      }}
                    >
                      {bitrate}
                    </button>
                  ))}
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setShowBitrateModal(false)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: '#f5f5f5',
                      color: '#333',
                      border: '2px solid #ddd',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '0.95em',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#e8e8e8';
                      e.target.style.borderColor = '#bbb';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = '#f5f5f5';
                      e.target.style.borderColor = '#ddd';
                    }}
                    onMouseDown={(e) => {
                      e.target.style.transform = 'scale(0.98)';
                    }}
                    onMouseUp={(e) => {
                      e.target.style.transform = 'scale(1)';
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBitrateConvert}
                    disabled={!selectedBitrate || !ffmpegReady}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: !selectedBitrate || !ffmpegReady ? '#ccc' : '#FFAB49',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: !selectedBitrate || !ffmpegReady ? 'not-allowed' : 'pointer',
                      fontWeight: '600',
                      fontSize: '0.95em',
                      transition: 'all 0.15s',
                      opacity: !selectedBitrate || !ffmpegReady ? 0.6 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (selectedBitrate && ffmpegReady) {
                        e.target.style.background = '#ff9a2e';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedBitrate && ffmpegReady) {
                        e.target.style.background = '#FFAB49';
                      }
                    }}
                    onMouseDown={(e) => {
                      if (selectedBitrate && ffmpegReady) {
                        e.target.style.transform = 'scale(0.98)';
                      }
                    }}
                    onMouseUp={(e) => {
                      if (selectedBitrate && ffmpegReady) {
                        e.target.style.transform = 'scale(1)';
                      }
                    }}
                  >
                    Change Bitrate
                  </button>
                </div>
              </>
            ) : (
              <>
                {progress === 0 ? (
                  // Loading
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
                    <p style={{ fontSize: '1.2em', fontWeight: '600', marginBottom: '8px' }}>
                      Initializing...
                    </p>
                    <p style={{ fontSize: '0.9em', color: '#999', margin: 0 }}>
                      Please wait
                    </p>
                  </div>
                ) : (
                  // Progress
                  <>
                    <div style={{ marginBottom: '24px' }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '12px'
                      }}>
                        <p style={{ 
                          margin: 0,
                          color: '#333', 
                          fontSize: '1em',
                          fontWeight: '600'
                        }}>
                          Converting...
                        </p>
                        <p style={{ 
                          margin: 0,
                          color: '#FFAB49', 
                          fontSize: '1.3em',
                          fontWeight: '700'
                        }}>
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
                        }}></div>
                      </div>
                    </div>

                    {bitrateMessage && (
                      <div style={{
                        background: bitrateMessage.includes('❌') || bitrateMessage.includes('✕') ? '#ffebee' : '#e8f5e9',
                        color: bitrateMessage.includes('❌') || bitrateMessage.includes('✕') ? '#c62828' : '#2e7d32',
                        padding: '12px',
                        borderRadius: '6px',
                        marginBottom: '16px',
                        fontSize: '0.9em',
                        textAlign: 'center',
                        fontWeight: '600'
                      }}>
                        {bitrateMessage}
                      </div>
                    )}

                    <button
                      onClick={handleCancelConversion}
                      style={{
                        padding: '12px',
                        background: '#ff6b6b',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        width: '100%',
                        fontWeight: '600',
                        fontSize: '0.95em',
                        transition: 'all 0.15s'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = '#ff5252';
                        e.target.style.transform = 'translateY(-1px)';
                        e.target.style.boxShadow = '0 4px 12px rgba(255, 107, 107, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = '#ff6b6b';
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = 'none';
                      }}
                    >
                      Cancel Conversion
                    </button>
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  </div>
)}

          </>
        )}
      </div>

      {/* Footer */}
      <div style={{ 
        background: '#FFE3CA', 
        borderTop: '2px solid #FFAB49', 
        padding: '16px 24px', 
        display: 'flex', 
        gap: '12px', 
        justifyContent: 'flex-end' 
      }}>
        <button
          onClick={onClose}
          style={{
            padding: '12px 28px',
            background: 'white',
            color: '#333',
            border: '2px solid #FFAB49',
            borderRadius: '8px',
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
            padding: '12px 28px',
            background: loading ? '#ddd' : '#FFAB49',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
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
