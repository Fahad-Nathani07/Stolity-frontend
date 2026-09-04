import React, { useState } from 'react';
import Logo from '../images/logo.png';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import Dropzone from 'react-dropzone';

import SideNav from '../components/SideNav';
import Footer from '../components/Footer';
import { Toggle } from 'rsuite';
import ToggleNav from '../components/ToggleNav';

const AddQrCode = () => {
const currentYear = new Date().getFullYear();

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
            <h1>QR Code Add</h1>
        </div>
        
        </div>
    </nav>
    {/* partial */}
    <div className="main-panel">
        <div className="content-wrapper">
        <Tabs>
            <TabList>
                <Tab>
                   <i className='mdi mdi-file-document-box-multiple-outline'></i> Text
                </Tab>
                <Tab>
                <i className='mdi mdi-web'></i> URL
                </Tab>
                <Tab>
                 <i className='mdi mdi-email-open-outline'></i> Email
                </Tab>

                <Tab>
                 <i className='mdi mdi-cellphone-iphone'></i> Phone
                </Tab>

                <Tab>
                 <i className='mdi mdi-comment-processing-outline'></i> SMS
                </Tab>
                <Tab>
                 <i className='mdi mdi-account-box-outline'></i> Contact
                </Tab>
            </TabList>

            <TabPanel>
            <div style={{maxWidth:560}}>
                <div className='mb-4'>
                    <h5 className='card-title'>Text</h5>
                    <div className="form__linput">
                        <input className="form__input" type="text" name="fname" id="fname" pattern="\w{1,}" required />
                        <label className="form__label" for="fname">Enter Your Text</label>
                    </div>
                </div>
            
                    <h5 className='card-title'>Company Logo</h5>
                    <Dropzone onDrop={onDrop}>
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
                </div>

                {/* <ul className='radio_checkbox_list'>
                    <li><input type="radio" name="FileUpload" id="FilePublic" /><label htmlFor="FilePublic">Public</label></li>
                    <li><input type="radio" name="FileUpload" id="FilePrivate" /><label htmlFor="FilePrivate">Private</label></li>
                </ul> */}

                <div className='btn_group mt-4'>
                    <button className='btn_back btn_width_same btn_grey_ripple ripple_effect'>Back</button>
                    <button className='btn_gradient btn_width_same btn_red_ripple ripple_effect'>Submit</button>
                </div>

            </TabPanel>

            <TabPanel>
            <div style={{maxWidth:560}}>
                <div className='mb-4'>
                    <h5 className='card-title'>URL</h5>
                    <div className="form__linput">
                        <input className="form__input" type="text" name="URL" id="URL" pattern="\w{1,}" required />
                        <label className="form__label" for="URL">Enter Your URL</label>
                    </div>
                </div>
            
                <h5 className='card-title'>Company Logo</h5>
                <Dropzone onDrop={onDrop}>
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
                </div>

                <div className='btn_group mt-4'>
                    <button className='btn_back btn_width_same btn_grey_ripple ripple_effect'>Back</button>
                    <button className='btn_gradient btn_width_same btn_red_ripple ripple_effect'>Submit</button>
                </div>
            </TabPanel>

            <TabPanel>
                <div style={{maxWidth:560}}>
                    <div className='mb-4'>
                        <h5 className='card-title'>Email To</h5>
                        <div className="form__linput">
                            <input className="form__input" type="text" name="Email" id="Email" pattern="\w{1,}" required />
                            <label className="form__label" for="Email">Enter Your Email</label>
                        </div>
                    </div>

                    <div className='mb-4'>
                        <h5 className='card-title'>Subject</h5>
                        <div className="form__linput">
                            <input className="form__input" type="text" name="Subject" id="Subject" pattern="\w{1,}" required />
                            <label className="form__label" for="Subject">Enter Your Email Subject</label>
                        </div>
                    </div>

                    <div className='mb-4'>
                        <h5 className='card-title'>Message</h5>
                        <div className="form__linput">
                            <textarea class="form__input form__textarea" rows={3} name="Message" id="Message" pattern="\w{1,}" required></textarea>
                            <label className="form__label" for="Message">Enter Your Message</label>
                        </div>
                    </div>

                    <h5 className='card-title'>Company Logo</h5>
                    <Dropzone onDrop={onDrop}>
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
                </div>
                

                <div className='btn_group mt-4'>
                    <button className='btn_back btn_width_same btn_grey_ripple ripple_effect'>Back</button>
                    <button className='btn_gradient btn_width_same btn_red_ripple ripple_effect'>Submit</button>
                </div>
            </TabPanel>

            <TabPanel>
             <div style={{maxWidth:560}}>
                    <div className='mb-4'>
                        <h5 className='card-title'>Phone</h5>
                        <div className="form__linput">
                            <input className="form__input" type="text" name="Phone" id="Phone" pattern="\w{1,}" required />
                            <label className="form__label" for="Phone">Enter Your Phone</label>
                        </div>
                    </div>

                    <h5 className='card-title'>Company Logo</h5>
                    <Dropzone onDrop={onDrop}>
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
                </div>
                

                <div className='btn_group mt-4'>
                    <button className='btn_back btn_width_same btn_grey_ripple ripple_effect'>Back</button>
                    <button className='btn_gradient btn_width_same btn_red_ripple ripple_effect'>Submit</button>
                </div>
            </TabPanel>

            <TabPanel>
              <div style={{maxWidth:560}}>
                    <div className='mb-4'>
                        <h5 className='card-title'>SMS To</h5>
                        <div className="form__linput">
                            <input className="form__input" type="text" name="SMS" id="SMS" pattern="\w{1,}" required />
                            <label className="form__label" for="SMS">Enter Your SMS</label>
                        </div>
                    </div>

                    <div className='mb-4'>
                        <h5 className='card-title'>Message</h5>
                        <div className="form__linput">
                            <textarea class="form__input form__textarea" rows={3} name="Message" id="Message" pattern="\w{1,}" required></textarea>
                            <label className="form__label" for="Message">Enter Your Message</label>
                        </div>
                    </div>

                    <h5 className='card-title'>Company Logo</h5>
                    <Dropzone onDrop={onDrop}>
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
                </div>
                

                <div className='btn_group mt-4'>
                    <button className='btn_back btn_width_same btn_grey_ripple ripple_effect'>Back</button>
                    <button className='btn_gradient btn_width_same btn_red_ripple ripple_effect'>Submit</button>
                </div>
            </TabPanel>

            <TabPanel>
                <div style={{maxWidth:560}}>
                    <div className='mb-4'>
                        <h5 className='card-title'>Name</h5>
                        <div className="form__linput">
                            <input className="form__input" type="text" name="CName" id="CName" pattern="\w{1,}" required />
                            <label className="form__label" for="CName">Enter Your Name</label>
                        </div>
                    </div>

                    <div className='mb-4'>
                        <h5 className='card-title'>Email</h5>
                        <div className="form__linput">
                            <input className="form__input" type="text" name="CEmail" id="CEmail" pattern="\w{1,}" required />
                            <label className="form__label" for="CEmail">Enter Your Phone</label>
                        </div>
                    </div>

                    <div className='mb-4'>
                        <h5 className='card-title'>Phone</h5>
                        <div className="form__linput">
                            <input className="form__input" type="text" name="CPhone" id="CPhone" pattern="\w{1,}" required />
                            <label className="form__label" for="CPhone">Enter Your Phone</label>
                        </div>
                    </div>

                    <div className='mb-4'>
                        <h5 className='card-title'>Address</h5>
                        <div className="form__linput">
                            <textarea class="form__input form__textarea" rows={3} name="Address" id="Address" pattern="\w{1,}" required></textarea>
                            <label className="form__label" for="Address">Enter Your Address</label>
                        </div>
                    </div>

                    <h5 className='card-title'>Company Logo</h5>
                    <Dropzone onDrop={onDrop}>
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
                </div>
                

                <div className='btn_group mt-4'>
                    <button className='btn_back btn_width_same btn_grey_ripple ripple_effect'>Back</button>
                    <button className='btn_gradient btn_width_same btn_red_ripple ripple_effect'>Submit</button>
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

export default AddQrCode