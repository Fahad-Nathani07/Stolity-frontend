import React, { useState, useEffect } from 'react';
import Logo from '../images/logo.png';
import IconQR from '../images/qr.png';

import { Tooltip, Whisper, SelectPicker, Placeholder, Popover } from 'rsuite';
import { CopyToClipboard } from 'react-copy-to-clipboard';

import 'rsuite/Tooltip/styles/index.css';
import "rsuite/SelectPicker/styles/index.css";
import 'rsuite/dist/rsuite.min.css';

import SideNav from '../components/SideNav';
import Footer from '../components/Footer';
import ToggleNav from '../components/ToggleNav';


const QrCode = () => {
const data = ['10', '20', '50', '100'].map(
  item => ({ label: item, value: item })
);


// COPY TOOLTIP TEXT
const [copied, setCopied] = useState(false);
const handleCopy = () => {
setCopied(true);
setTimeout(() => setCopied(false), 2000); // Reset the tooltip after 2 seconds
};

const [isLoading, setLoading] = useState(true); // State to manage loading state
useEffect(() => {
    // Simulate an API call or data loading delay
    setTimeout(() => setLoading(false), 2000); // Simulate 2 seconds loading time
  }, []);


// DELETE POPOVER
const [activeDeleteRow, setActiveDeleteRow] = useState(null);

const handleOpenDeletePopover = (id) => {
setActiveDeleteRow(id);
};

const handleCloseDeletePopover = () => {
setActiveDeleteRow(null);
};

const renderDeletePopover = () => (
    <Popover title="" className='delete_popover common_popover'>
      <div className='popover_content'>
        <div className='delete_modal_content common_modal_style_content'>
            <h5>Are you sure you want to delete?</h5>
            <p>This action cannot be reversed</p>
          <div className='btn_group mt-4' style={{justifyContent:'center'}}>
            <button className='btn_back btn_width_same btn_grey_ripple ripple_effect' onClick={handleCloseDeletePopover} style={{maxWidth:110, height:40}}>No</button>
            <button className='btn_gradient btn_width_same btn_red_ripple ripple_effect' style={{maxWidth:110, height:40}}>Yes</button>
          </div>
        </div>
      </div>
    </Popover>
  );

  return (
    <>
    <SideNav />
    <div className="container-fluid page-body-wrapper">
    {/* partial:partials/_navbar.html */}
    <nav className="navbar p-0 fixed-top d-flex flex-row">
        <div className="navbar-brand-wrapper d-flex d-lg-none align-items-center justify-content-center">
        <a className="navbar-brand brand-logo-mini" href="#"><img src={Logo} alt="logo" /></a>
        </div>
        <div className="navbar-menu-wrapper flex-grow d-flex align-items-stretch">
        <ToggleNav />
        <div className="navbar-nav page_title">
            <h1>QR Code</h1>
        </div>
        
        </div>
    </nav>
    {/* partial */}
    <div className="main-panel">
        <div className="content-wrapper">
        <div className="table_box">
            <div className='filerbar_row'>
                <div className='show_entries_row'>
                    <div class="dataTables_length">
                        <label className='label_show_drop'>Show</label>
                        <SelectPicker
                          data={data}
                          searchable={false}
                          style={{ width: 90, }}
                          placeholder=""
                        />
                        <label>entries</label>
                    </div>

                    <div className='fiter_search'>
                        <input type='text' className='form-control' placeholder='Search...' />
                    </div>
                </div>
            </div>
            {isLoading && (
               <Placeholder.Grid rows={10} columns={5} active style={{paddingLeft:20, paddingRight:20, paddingTop:12}} />
              )}

              {/* Table */}
              {!isLoading && (
            <div className='table-responsive'>
                <table id="filestable" className="table table-striped">
                    <thead>
                    <tr>
                        <td width={35} align="center"><b>No.</b></td>
                        <th width="50%">String</th>
                        <th width={75} className='text-center'>Type</th>
                        <th width={90} className='text-center'>Code</th>
                        <th width={90} className='text-center'>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr className="hover_cell">
                        <td align="center">1</td>                        
                        <td>
                        <Whisper
                            speaker={<Tooltip className="tooltip_custom_copy">{copied ? 'Copied!' : 'Click to Copy'}</Tooltip>}
                            trigger="hover"
                            placement="top"
                        >
                            <CopyToClipboard text="9876543211" onCopy={handleCopy}>
                            <span
                                className="filename_link"
                                style={{ display: 'inline-block', maxWidth: '40vw', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }}
                            >
                                9876543211
                            </span>
                            </CopyToClipboard>
                        </Whisper>
                        
                        </td>
                        <td align="center">Phone</td>
                        <td align="center">
                             <a href={IconQR} target='_blank' className="qrcode_icon" rel="noopener noreferrer">
                            <img src={IconQR} alt="QR Code" height={50} />
                            </a>
                        </td>
                                                
                        <td className="actions">
                            <div className='action_col'>
                                <a href="#" className='icon_edit_btn ripple_effect'><i className="icon-edit-fill"></i></a>
                                <Whisper
                                placement="auto"
                                trigger="click"
                                speaker={renderDeletePopover()}
                                onOpen={() => handleOpenDeletePopover(1)}
                                onClose={handleCloseDeletePopover}
                              >
                                <a href='#' className='icon_delete_btn ripple_effect'><i className="icon-delete"></i></a>
                              </Whisper>
                            
                            </div>
                        </td>
                    </tr>

                    <tr className="hover_cell">
                        <td align="center">2</td>                        
                        <td>
                        <Whisper
                            speaker={<Tooltip className="tooltip_custom_copy">{copied ? 'Copied!' : 'Click to Copy'}</Tooltip>}
                            trigger="hover"
                            placement="top"
                        >
                            <CopyToClipboard text="https://mangesh1.s3.ap-south-1.amazonaws.com/javed/CASA_Guru/CASA_Guru_05_07_2021.apk?response-content-disposition=attachment%3B%20filename%3D%22CASA_Guru_05_07_2021.apk%22&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIATDDSIP2VITZHHFCC%2F20210705%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20210705T062649Z&X-Amz-SignedHeaders=host&X-Amz-Expires=432000&X-Amz-Signature=dd39d0b23ce4c2e1422e023b7c1de8e04153d67fe29d7e01241aee892825e04a" onCopy={handleCopy}>
                            <span
                                className="filename_link"
                                style={{ display: 'inline-block', maxWidth: '40vw', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }}
                            >
                                https://mangesh1.s3.ap-south-1.amazonaws.com/javed/CASA_Guru/CASA_Guru_05_07_2021.apk?response-content-disposition=attachment%3B%20filename%3D%22CASA_Guru_05_07_2021.apk%22&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIATDDSIP2VITZHHFCC%2F20210705%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20210705T062649Z&X-Amz-SignedHeaders=host&X-Amz-Expires=432000&X-Amz-Signature=dd39d0b23ce4c2e1422e023b7c1de8e04153d67fe29d7e01241aee892825e04a
                            </span>
                            </CopyToClipboard>
                        </Whisper>
                        </td>
                        <td align="center">URL</td>
                        <td align="center">
                             <a href={IconQR} target='_blank' className="qrcode_icon" rel="noopener noreferrer">
                            <img src={IconQR} alt="QR Code" height={50} />
                            </a>
                        </td>
                                                
                        <td className="actions">
                            <div className='action_col'>
                                <a href="#" className='icon_edit_btn ripple_effect'><i className="icon-edit-fill"></i></a>
                                <Whisper
                                placement="auto"
                                trigger="click"
                                speaker={renderDeletePopover()}
                                onOpen={() => handleOpenDeletePopover(1)}
                                onClose={handleCloseDeletePopover}
                              >
                                <a href='#' className='icon_delete_btn ripple_effect'><i className="icon-delete"></i></a>
                              </Whisper>
                            
                            </div>
                        </td>
                    </tr>

                    <tr className="hover_cell">
                        <td align="center">3</td>                        
                        <td>
                        <Whisper
                            speaker={<Tooltip className="tooltip_custom_copy">{copied ? 'Copied!' : 'Click to Copy'}</Tooltip>}
                            trigger="hover"
                            placement="top"
                        >
                            <CopyToClipboard text="http://google.com" onCopy={handleCopy}>
                            <span
                                className="filename_link"
                                style={{ display: 'inline-block', maxWidth: '40vw', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }}
                            >
                             http://google.com
                            </span>
                            </CopyToClipboard>
                        </Whisper>                            
                        </td>
                        <td align="center" className='text-center'>URL</td>
                        <td align="center" className='text-center'>
                             <a href={IconQR} target='_blank' className="qrcode_icon" rel="noopener noreferrer">
                            <img src={IconQR} alt="QR Code" height={50} />
                            </a>
                        </td>
                                                
                        <td className="actions">
                            <div className='action_col'>
                                <a href="#" className='icon_edit_btn ripple_effect'><i className="icon-edit-fill"></i></a>
                                <Whisper
                                placement="auto"
                                trigger="click"
                                speaker={renderDeletePopover()}
                                onOpen={() => handleOpenDeletePopover(1)}
                                onClose={handleCloseDeletePopover}
                              >
                                <a href='#' className='icon_delete_btn ripple_effect'><i className="icon-delete"></i></a>
                              </Whisper>
                            
                            </div>
                        </td>
                    </tr>

                    <tr className="hover_cell">
                        <td align="center">4</td>                        
                        <td>
                        <Whisper
                            speaker={<Tooltip className="tooltip_custom_copy">{copied ? 'Copied!' : 'Click to Copy'}</Tooltip>}
                            trigger="hover"
                            placement="top"
                        >
                            <CopyToClipboard text="9876543211" onCopy={handleCopy}>
                            <span
                                className="filename_link"
                                style={{ display: 'inline-block', maxWidth: '40vw', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }}
                            >
                                9876543211
                            </span>
                            </CopyToClipboard>
                        </Whisper>
                        
                        </td>
                        <td align="center">Phone</td>
                        <td align="center">
                             <a href={IconQR} target='_blank' className="qrcode_icon" rel="noopener noreferrer">
                            <img src={IconQR} alt="QR Code" height={50} />
                            </a>
                        </td>
                                                
                        <td className="actions">
                            <div className='action_col'>
                                <a href="#" className='icon_edit_btn ripple_effect'><i className="icon-edit-fill"></i></a>
                                <Whisper
                                placement="auto"
                                trigger="click"
                                speaker={renderDeletePopover()}
                                onOpen={() => handleOpenDeletePopover(1)}
                                onClose={handleCloseDeletePopover}
                              >
                                <a href='#' className='icon_delete_btn ripple_effect'><i className="icon-delete"></i></a>
                              </Whisper>
                            
                            </div>
                        </td>
                    </tr>

                    <tr className="hover_cell">
                        <td align="center">5</td>                        
                        <td>
                        <Whisper
                            speaker={<Tooltip className="tooltip_custom_copy">{copied ? 'Copied!' : 'Click to Copy'}</Tooltip>}
                            trigger="hover"
                            placement="top"
                        >
                            <CopyToClipboard text="https://mangesh1.s3.ap-south-1.amazonaws.com/javed/CASA_Guru/CASA_Guru_05_07_2021.apk?response-content-disposition=attachment%3B%20filename%3D%22CASA_Guru_05_07_2021.apk%22&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIATDDSIP2VITZHHFCC%2F20210705%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20210705T062649Z&X-Amz-SignedHeaders=host&X-Amz-Expires=432000&X-Amz-Signature=dd39d0b23ce4c2e1422e023b7c1de8e04153d67fe29d7e01241aee892825e04a" onCopy={handleCopy}>
                            <span
                                className="filename_link"
                                style={{ display: 'inline-block', maxWidth: '40vw', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }}
                            >
                                https://mangesh1.s3.ap-south-1.amazonaws.com/javed/CASA_Guru/CASA_Guru_05_07_2021.apk?response-content-disposition=attachment%3B%20filename%3D%22CASA_Guru_05_07_2021.apk%22&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIATDDSIP2VITZHHFCC%2F20210705%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20210705T062649Z&X-Amz-SignedHeaders=host&X-Amz-Expires=432000&X-Amz-Signature=dd39d0b23ce4c2e1422e023b7c1de8e04153d67fe29d7e01241aee892825e04a
                            </span>
                            </CopyToClipboard>
                        </Whisper>
                        </td>
                        <td align="center">URL</td>
                        <td align="center">
                             <a href={IconQR} target='_blank' className="qrcode_icon" rel="noopener noreferrer">
                            <img src={IconQR} alt="QR Code" height={50} />
                            </a>
                        </td>
                                                
                        <td className="actions">
                            <div className='action_col'>
                                <a href="#" className='icon_edit_btn ripple_effect'><i className="icon-edit-fill"></i></a>
                                <Whisper
                                placement="auto"
                                trigger="click"
                                speaker={renderDeletePopover()}
                                onOpen={() => handleOpenDeletePopover(1)}
                                onClose={handleCloseDeletePopover}
                              >
                                <a href='#' className='icon_delete_btn ripple_effect'><i className="icon-delete"></i></a>
                              </Whisper>
                            
                            </div>
                        </td>
                    </tr>

                    <tr className="hover_cell">
                        <td align="center">6</td>                        
                        <td>
                        <Whisper
                            speaker={<Tooltip className="tooltip_custom_copy">{copied ? 'Copied!' : 'Click to Copy'}</Tooltip>}
                            trigger="hover"
                            placement="top"
                        >
                            <CopyToClipboard text="http://google.com" onCopy={handleCopy}>
                            <span
                                className="filename_link"
                                style={{ display: 'inline-block', maxWidth: '40vw', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }}
                            >
                             http://google.com
                            </span>
                            </CopyToClipboard>
                        </Whisper>                            
                        </td>
                        <td align="center" className='text-center'>URL</td>
                        <td align="center" className='text-center'>
                             <a href={IconQR} target='_blank' className="qrcode_icon" rel="noopener noreferrer">
                            <img src={IconQR} alt="QR Code" height={50} />
                            </a>
                        </td>
                                                
                        <td className="actions">
                            <div className='action_col'>
                                <a href="#" className='icon_edit_btn ripple_effect'><i className="icon-edit-fill"></i></a>
                                <Whisper
                                placement="auto"
                                trigger="click"
                                speaker={renderDeletePopover()}
                                onOpen={() => handleOpenDeletePopover(1)}
                                onClose={handleCloseDeletePopover}
                              >
                                <a href='#' className='icon_delete_btn ripple_effect'><i className="icon-delete"></i></a>
                              </Whisper>
                            
                            </div>
                        </td>
                    </tr>
                    
                </tbody>
            </table>
            </div>

            )}

    
    <div className='container-fluid'>
        <div className="row align-items-center">
            <div className="col-sm-12 col-md-5 mt-4">
                    <div className="dataTables_info">Showing 1 to 3 of 3 entries</div>
                </div>
                <div className="col-sm-12 col-md-7 mt-4">
                    <div className="dataTables_paginate paging_simple_numbers">
                        <ul className="pagination">
                            <li className="paginate_button page-item previous disabled">
                                <a href="#" className="page-link">Previous</a>
                            </li>
                            <li className="paginate_button page-item active">
                                <a href="#" className="page-link">1</a>
                            </li>

                            <li className="paginate_button page-item">
                                <a href="#" className="page-link">2</a>
                            </li>
                            <li className="paginate_button page-item">
                                <a href="#" className="page-link">3</a>
                            </li>
                            <li className="paginate_button page-item next">
                                <a href="#" className="page-link">Next</a>
                            </li>
                        </ul>
                    </div>
                </div>
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

export default QrCode