import React, { useContext , useState, useEffect, useCallback } from 'react';
import Logo from '../images/logo.png';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import Dropzone from 'react-dropzone';
import axios from 'axios'
import SideNav from '../components/SideNav';
import Footer from '../components/Footer';
import ToggleNav from '../components/ToggleNav';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { ChakraProvider, Button, Stack, useToast } from '@chakra-ui/react';
import { UploadContext } from './UploadContext';
import { uploadFolderViaMultipart } from "../utils/uploadFolderViaMultipart";


const AddFiles = () => {
  const { uploads, addUpload, updateUploadProgress, updateUploadMeta, removeUpload, getUpload, isPausing } = useContext(UploadContext);

  const currentYear = new Date().getFullYear();
  const token = sessionStorage.getItem("number");
  const [fileList, setFileList] = useState([])
  const [folderStructure, setFolderStructure] = useState({});
  const [files, setFiles] = useState([]);
  const [directory, setDirectory] = useState('')
  const apiUrl = process.env.REACT_APP_API_ENDPOINT;
  const navigate = useNavigate()
  const counter = useSelector((state) => state.getdata.counter)
  const t = useSelector((state) => state.getdata.folderName)
  const [preLoader2, setPreLoader2] = useState(false)
  const [pubpri, setPubPri] = useState("private")
  const [pubpri2, setPubPri2] = useState("private")
  const [nameOfFolder,setNameOfFolder]=useState('')
  const getUcer = (file, counter) => {
    const parts = file.split('/');
    return parts.slice(0, counter).join('/') + '/';
  }

  if (counter > 0) {
    var path = getUcer(t, counter)
    console.log("path will be", path)

  } else {
    path = '';
  }








  const removeFile = (index) => {
    const updatedFiles = [...files];
    updatedFiles.splice(index, 1);
    setFiles(updatedFiles);
  };

  const fileList2 = files.map((file, index) => (
    <li key={file.name}>
      <div>
        {file.type.startsWith('image/') ? (
          <div className='file_img'>
            <img
              src={URL.createObjectURL(file)}
              alt={file.name}
              style={{}}
            />
          </div>
        ) : (
          <div>
            <i className="mdi mdi-file-document-box-multiple-outline" style={{ fontSize: '48px' }}></i>
          </div>
        )}
        <div className='upload_file_content'>
          <button onClick={() => removeFile(index)}><i className='mdi mdi-close'></i></button>
        </div>
      </div>
    </li>
  ));
  //Get Folder Name
  function getTextBeforeFirstSlash(text) {
    const indexOfFirstSlash = text.indexOf('/');
    if (indexOfFirstSlash !== -1) {
      return text.substring(0, indexOfFirstSlash);
    }
    return text; // Return the entire text if no slash is found
  }

  //Anurag's code
  //Upload File Code 
  const handleFileUpload = async () => {
    if (files.length===0) {
      showToast('error','Please select the file!')
      return;
    }
    for (let i = 0; i < files.length; i++) {
    const file = files[i]; // Get the current file from the files array
    const fileName = file.name; // Get the file name
    const uploadId = Date.now() + i; // Create a unique ID for each file

    addUpload(uploadId, "Uploading "+fileName);

      console.log("File Upload Started...", pubpri)
      setPreLoader2(true)
      const formData = new FormData();
      formData.append('files', files[i]);
      formData.append('isPrivate', pubpri);
      formData.append('folderPath', path);
      formData.append('storageClass', 'STANDARD');
      // Add folderPath to FormData

      try {
        const response = await axios.post(`${apiUrl}upload-file`, formData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const totalLength = progressEvent.lengthComputable
              ? progressEvent.total
              : file.size; // Use the size of the current file
  
            if (totalLength) {
              const progress = Math.round((progressEvent.loaded * 100) / totalLength);
              console.log('Upload Progress:', progress, '%');
              updateUploadProgress(uploadId, progress); // Update the specific upload progress
            }
          },
        });
        console.log('File uploaded successfully:', response.data);
        removeUpload(uploadId)

      } catch (error) {
        showToast('error','Error uploading file');
      }
    }
    showToast('success','File uploaded successfully!')
    setPreLoader2(false)
    setFiles([])
  }

  useEffect(() => {
    console.log("fileList", fileList);
  }, [fileList]);
  function removeLastSlashAndText(inputString) {
    const lastSlashIndex = inputString.lastIndexOf('/');


    if (lastSlashIndex === -1) {
      return inputString;
    }

    return inputString.substring(0, lastSlashIndex);
  }





  // //Anurag folder upload
  const handleFolderChange = (event) => {
    console.log("Event", event);
    const files = event;
    const updatedFileList = [];
    const updatedFolderStructure = {};

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      const relativePath = file.webkitRelativePath;
      
      // Separate the folder path and file name
      const folderPath = relativePath.substring(0, relativePath.lastIndexOf('/'));
      
      setNameOfFolder(folderPath)
      // Update the file list with the folder path and file
      updatedFileList.push({
        path: folderPath, // Only the folder path without the file name
        file: file
      });

      // Update the folder structure without including the file name
      updatedFolderStructure[file.name] = folderPath;
    }

    setFileList(updatedFileList);
    setFolderStructure(updatedFolderStructure);

    if (updatedFileList.length > 0) {
      setDirectory(getTextBeforeFirstSlash(updatedFileList[0].path));
    }

    console.log('Updated file list:', updatedFileList);
    console.log('Folder structure:', updatedFolderStructure);
  };



  const uploadFolder = async () => {
    if (!fileList?.length) {
      showToast("warning", "Please select a folder first.");
      return;
    }

    setPreLoader2(true);
    try {
      const result = await uploadFolderViaMultipart({
        apiUrl,
        token,
        fileList,
        basePath: removeLastSlashAndText(path || ""),
        folderName: nameOfFolder || "folder",
        visibility: pubpri2,
        uploads,
        addUpload,
        updateUploadProgress,
        updateUploadMeta,
        removeUpload,
        getUpload,
        isPausing,
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
        showToast("success", `Folder "${displayName}" uploaded successfully!`);
        navigate("/Files");
      } else if (anySucceeded && anyCanceled) {
        showToast("info", "Upload stopped. Finished files are available.");
        navigate("/Files");
      } else if (anySucceeded && anyFailed) {
        showToast("warning", "Some folder files failed to upload.");
        navigate("/Files");
      } else if (allCanceled) {
        showToast("info", "Folder upload was canceled.");
      } else if (anyFailed) {
        showToast("error", "Error uploading folder files");
      }
    } catch (error) {
      showToast("error", "Error uploading folder");
    } finally {
      setPreLoader2(false);
    }
  };

  //Create Folder
  const createJustFolder = async () => {
    const folderfield = document.getElementById('folname').value;
    if (folderfield) {
      const folderName = path + document.getElementById('folname').value;
      console.log(folderName)
      try {
        const res = await axios.post(`${apiUrl}create-folder`, { "folderName": folderName }, {

          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        })
        console.log(res.data)
        showToast('success','Folder created successfully!')

      }
      catch (error) {
        console.error(`There's error at ${error}`)
      }
      document.getElementById('folname').value = null;

    }

  }

  useEffect(() => {

    if (sessionStorage.getItem('reloaded')) {

      navigate('/Files');
    } else {

      sessionStorage.setItem('reloaded', 'true');
    }
    return () => {
      sessionStorage.removeItem('reloaded');
    };
  }, [navigate]);

  const handlePubChange = (event) => {
    setPubPri(event.target.value);
  };
  const handleRadioChange = (event) => {
    setPubPri2(event.target.value);
  };







  //folder upload bug
  const onDrop = useCallback((acceptedFiles) => {
    setFiles(acceptedFiles);
    handleFolderChange(acceptedFiles);
  }, [handleFolderChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    // This will attempt to get all files from a folder
    directory: true,
    // Disable click and keydown behavior
    noClick: true,
    noKeyboard: true,
  });

  const handleSelectFolder = () => {
    // Create an input element
    const input = document.createElement('input');
    input.type = 'file';
    input.webkitdirectory = true;
    input.directory = true;
    input.multiple = true;

    input.onchange = (e) => {
      console.log('kale', e)
      const files = Array.from(e.target.files);
      setFiles(files);
      handleFolderChange(files);
    };

    // Trigger the file input click
    input.click();
  };

  // ERROR MESSAGE
  const toast = useToast();


  const showToast = (status, message) => {
    toast({
      title: `${status.charAt(0).toUpperCase() + status.slice(1)}`,
      description: message,
      status: status, // Set this to 'error' for a red-colored pop-up
      duration: 3000,
      isClosable: true,
    });
  };
  return (
    <>
    <ChakraProvider>
                
    </ChakraProvider>

      
      <SideNav />

      <div className="container-fluid page-body-wrapper">

        <nav className="navbar p-0 fixed-top d-flex flex-row">

          <div className="navbar-brand-wrapper d-flex d-lg-none align-items-center justify-content-center">
            <a className="navbar-brand brand-logo-mini" href="#"><img src={Logo} alt="logo" /></a>
          </div>
          <div className="navbar-menu-wrapper flex-grow d-flex align-items-stretch">
            <ToggleNav />
            <div className="navbar-nav page_title">
              <h1>Files Add</h1>
            </div>

          </div>
        </nav>
        {/* partial */}
        <div className="main-panel">

          <div className="content-wrapper">

            <Tabs>
              <TabList>
                <Tab>
                  <i className='mdi mdi-file-document-box-multiple-outline'></i> Files
                </Tab>
                <Tab>
                  <i className='mdi mdi-folder-multiple-outline'></i> Upload Folder
                </Tab>
                <Tab>
                  <i className='mdi mdi-folder-multiple-outline'></i> Folder
                </Tab>
              </TabList>

              <TabPanel>
                <h5 className='card-title'>Upload File {"-" + path}</h5>

                <Dropzone onDrop={onDrop}>
                  {({ getRootProps, getInputProps }) => (
                    <section className="">
                      <div {...getRootProps({ className: 'fileupload' })}>
                        <input
                          {...getInputProps()} />
                        <p>Drag your documents, photos, or videos here to start uploading.<br />
                          <span className='btn_choosefile'>Choose Files</span></p>
                      </div>
                      <ul className='upload_thumbnails_list'>{fileList2}</ul>
                    </section>
                  )}
                </Dropzone>

                <ul className='radio_checkbox_list'>
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
                    />
                    <label htmlFor="FilePrivate">Private</label>
                  </li>
                </ul>

                <div className='btn_group mt-4'>
                  <button className='btn_back btn_width_same btn_grey_ripple ripple_effect'>Back</button>
                  <button onClick={handleFileUpload} className='btn_gradient btn_width_same btn_red_ripple ripple_effect'>Submit</button>
                </div>



              </TabPanel>

              <TabPanel>
                <h5 className='card-title'>Upload Folder {"-" + path}</h5>

                <div {...getRootProps({ className: 'fileupload' })}>
                  <input {...getInputProps()} />
                  {isDragActive ? (
                    <p>Drop the folder here ...</p>
                  ) : (
                    <p>Drag your folder here to start uploading, or</p>
                  )}
                  <button onClick={handleSelectFolder} className='btn_choosefile'>
                    Choose Folder
                  </button>
                </div>

                <ul className='upload_thumbnails_list font-extrabold'>
                  {nameOfFolder}
                </ul>


                <ul className='radio_checkbox_list'>
                  <li><input type="radio" name="FileUpload2"
                    value="public-read"
                    onChange={handleRadioChange}
                    id="FilePublic2" /><label htmlFor="FilePublic2">Public</label></li>
                  <li><input type="radio" name="FileUpload2"
                    value="private"
                    onChange={handleRadioChange}
                    id="FilePrivate2" /><label htmlFor="FilePrivate2">Private</label></li>
                </ul>

                <div className='btn_group mt-4'>
                  <button className='btn_back btn_width_same btn_grey_ripple ripple_effect'>Back</button>
                  <button onClick={uploadFolder} className='btn_gradient btn_width_same btn_red_ripple ripple_effect'>Submit</button>
                </div>
              </TabPanel>

              <TabPanel>
                <h5 className='card-title'>Create Folder {"-" + path}</h5>
                <form class="form page__form max_width_div" action="javascript:void(0);" method="POST">
                  <div className="form__linput">
                    <input class="form__input" type="text" name="fname" id="folname" pattern="\w{1,}" required />
                    {/* <label class="form__label" for="fname">Enter Your Folder Name</label> */}
                  </div>
                </form>


                <div className='btn_group mt-4'>
                  <button className='btn_back btn_width_same btn_grey_ripple ripple_effect'>Back</button>
                  <button onClick={createJustFolder} className='btn_gradient btn_width_same btn_red_ripple ripple_effect'>Submit</button>

                </div>

              </TabPanel>

            </Tabs>

          </div>

          <Footer />
        </div>
        {/* main-panel ends */}
      </div>
    </>
  )
}

export default AddFiles