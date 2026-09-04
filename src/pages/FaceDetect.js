import React, { useState } from 'react';
import Logo from '../images/logo.png';

import SideNav from '../components/SideNav';
import Footer from '../components/Footer';
import Dropzone from 'react-dropzone';
import ToggleNav from '../components/ToggleNav';
const FaceDetect = () => {

  const [files, setFiles] = useState([]);

  const onDrop = (droppedFiles) => {
    setFiles([...files, ...droppedFiles]);
  };

  const removeFile = (index) => {
    const updatedFiles = [...files];
    updatedFiles.splice(index, 1);
    setFiles(updatedFiles);
  };

  const fileList = files.map((file, index) => (
    <li key={file.name}>
      <div>
        {file.type.startsWith('image/') ? (
        <div className='file_img'>
          <img
            src={URL.createObjectURL(file)}
            alt={file.name}
            style={{ }}
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

  return (
    <>
    <SideNav />
    <div className="container-fluid page-body-wrapper">

    <nav className="navbar p-0 fixed-top d-flex flex-row">
        <div className="navbar-brand-wrapper d-flex d-lg-none align-items-center justify-content-center">
          <a className="navbar-brand brand-logo-mini" href="#"><img src={Logo} alt="logo" /></a>
          </div>
          <div className="navbar-menu-wrapper flex-grow d-flex align-items-stretch">
          <ToggleNav />
          <div className="navbar-nav page_title">
              <h1>Face Detect Add</h1>
          </div>        
        </div>
    </nav>
    {/* partial */}
    <div className="main-panel">
        <div className="content-wrapper">
          <div className='card_view'>
          <h5 className='card_title'>File</h5>
            <div style={{maxWidth:700}}>
              <Dropzone onDrop={onDrop} multiple={false}>
                  {({ getRootProps, getInputProps }) => (
                      <section className="">
                      <div {...getRootProps({ className: 'fileupload' })}>
                          <input {...getInputProps()} />
                          <p>Drag your documents, photos, or videos here to start uploading.<br />
                      <span className='btn_choosefile'>Choose Files</span></p>
                      </div>
                      <ul className='upload_thumbnails_list'>{fileList}</ul>
                      </section>
                  )}
              </Dropzone>
              <div className='btn_group mt-4'>
                <button className='btn_gradient btn_width_same btn_red_ripple ripple_effect'>Upload</button>
              </div>
            </div>
          </div>
        </div>
        <Footer />
    </div>
    {/* main-panel ends */}
    </div>
    </>
  )
}

export default FaceDetect