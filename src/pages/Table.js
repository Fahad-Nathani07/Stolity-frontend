import React, { useState, useEffect } from 'react';
import Logo from '../images/logo.png';
import IconJPG from '../images/icon-jpg.svg';
import IconPNG from '../images/icon-png.svg';
import IconPSD from '../images/icon-psd.svg';
import IconPDF from '../images/pdf.svg';
import IconFolder from '../images/folder.svg';

import { Tooltip, Whisper, SelectPicker, Dropdown, Popover, Placeholder, Button} from 'rsuite';
import 'rsuite/Tooltip/styles/index.css';
import "rsuite/SelectPicker/styles/index.css";
import 'rsuite/dist/rsuite.min.css';

import SideNav from '../components/SideNav';
import Footer from '../components/Footer';

const File = () => {
const [isOpen, setIsOpen] = useState(false);

const handleDropdownClick = (e) => {
e.preventDefault();
setIsOpen(!isOpen);
};

const handleOutsideClick = () => {
setIsOpen(false);
};

const data = ['10', '20', '50', '100'].map(
  item => ({ label: item, value: item })
);

const [isLoading, setLoading] = useState(true); // State to manage loading state
useEffect(() => {
    // Simulate an API call or data loading delay
    setTimeout(() => setLoading(false), 2000); // Simulate 2 seconds loading time
  }, []);

// INPUT VALUE 
const [inputValue, setInputValue] = useState('Manual Racing_compressed.pdf');
const handleInputChange = (e) => setInputValue(e.target.value);

//POPOVER WITH TABLE ROW ACTIVE
const [activeRow, setActiveRow] = useState(null);

  const handleOpenPopover = (id) => {
    setActiveRow(id);
  };

  const handleClosePopover = () => {
    setActiveRow(null);
  };

  const renderPopover = () => (
    <Popover title="" className='edit_popover common_popover'>
        <div className='popover_content'>
         <div className='edit_modal_content common_modal_style_content'>
            <div>
                <h5 className='card_title'>Rename File</h5>
                <div className="form__linput">
                    <input className="form__input" type="text" value={inputValue} onChange={handleInputChange} />
                </div>
                <ul className='radio_checkbox_list mt-4' style={{justifyContent:'center'}}>
                    <li><input type="radio" name="FileUpload" id="FilePublic" /><label htmlFor="FilePublic">Public</label></li>
                    <li><input type="radio" name="FileUpload" id="FilePrivate" /><label htmlFor="FilePrivate">Private</label></li>
                </ul>

                <div className='btn_group mt-4' style={{justifyContent:'center'}}>
                    <button className='btn_back btn_width_same btn_grey_ripple ripple_effect'>Cancel</button>
                    <button className='btn_gradient btn_width_same btn_red_ripple ripple_effect'>Submit</button>
                </div>
            </div>

            <div className='thankyou_popover' style={{display:'none'}}>
                <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                    <circle class="checkmark__circle" cx="26" cy="26" r="25" fill="none"/>
                    <path class="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                </svg>
                <h1>Thank You!</h1>
                <p>For Rename File</p>
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
        <button className="navbar-toggler navbar-toggler align-self-center" type="button" data-toggle="minimize">
            <span className="icon-arrow-dropdown" />
        </button>
        <button className="navbar-toggler navbar-toggler-right d-lg-none align-self-center" type="button" data-toggle="offcanvas">
         <span className="icon-arrow-dropdown" />
        </button>
        <div className="navbar-nav page_title">
            <h1>Files</h1>
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

                    <div className="filterbar">
                        <div className="dropdown dropdown-processed">                    
                            <Dropdown title={
                                <span>
                                <i className="icon-filter" /> Filter
                                </span>
                            } className="filter_dropdown">
                                <Dropdown.Item>Name</Dropdown.Item>
                                <Dropdown.Item>File Size</Dropdown.Item>
                                <Dropdown.Item>Modified On</Dropdown.Item>                        
                            </Dropdown>
                        </div>
                        <div className="dropdown dropdown-processed" style={{borderLeft:"1px solid #d7d6ef"}}>
                        {/* <a className="dropdown-link" href="#"><i className='icon-sorting'></i> <span id="sortingtxt">Sorting</span></a> */}
                            <Dropdown title={
                                <span>
                                <i className="icon-sorting" /> Sorting
                                </span>
                            } className="filter_dropdown">
                                <Dropdown.Item>Ascending</Dropdown.Item>
                                <Dropdown.Item>Descending</Dropdown.Item>
                        </Dropdown>
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
                            <th width={35}>Ext.</th>
                            <th width="50%" className="dropdown dropdown-processed">
                            <Dropdown title={
                                <span style={{fontWeight:600,color: '#181818',}}>
                                File Name
                                </span>
                            } className="filter_dropdown">
                                <Dropdown.Item>Older to newer</Dropdown.Item>
                                <Dropdown.Item>Newer to older</Dropdown.Item>
                        </Dropdown>
                            </th>
                            <th width={90}>&nbsp;&nbsp;</th>
                            <th width={75}>File Size</th>
                            <th width={90}>Modified On</th>
                            <th width={30}>&nbsp;</th>
                        </tr>
                        </thead>
                        <tbody>
                            
                        <tr key={1} className={`hover_cell ${activeRow === 1 ? 'active-row' : ''}`} onClick={() => handleOpenPopover(1)}>
                            <td align="center">1</td>
                            <td>
                            <span className="filename_link" style={{cursor: 'pointer'}}><img src={IconFolder} height={32} /></span>                                                                            
                            </td>
                            <td>
                            <span className="filename_link" style={{cursor: 'pointer'}}>Aqua Banner</span>                                                                            
                            </td>
                            <td>
                                <ul className="table_hover_links">
                                    <li>
                                    <Whisper
                                        placement="auto"
                                        trigger="click"
                                        speaker={renderPopover()}
                                        onOpen={() => handleOpenPopover(1)}
                                        onClose={handleClosePopover}
                                    >
                                        <a href='#'><i className="icon-edit-fill" /></a>
                                    </Whisper>
                                    </li>
                                    
                                    <li>
                                    <Whisper speaker={<Tooltip className="tooltip-custom">Click to Copy</Tooltip>} trigger="hover"
                                            placement="top"
                                        ><a href='#'><i className="icon-copy-fill" /></a>
                                    </Whisper>                         
                                    </li>
                                    <li>
                                    <Whisper speaker={<Tooltip className="tooltip-custom">Click to Download</Tooltip>} trigger="hover"
                                            placement="top"
                                        ><a href='#'><i className="icon-cloud-download" /></a></Whisper>
                                    </li>
                                    <li>
                                        <Whisper speaker={<Tooltip className="tooltip-custom">Click to Move</Tooltip>} trigger="hover"
                                            placement="top"
                                        ><a href='#' style={{color:'#4256b3'}}><i className="icon-move" style={{fontSize:21}} /></a></Whisper>
                                    </li>
                                    <li>
                                        <Whisper speaker={<Tooltip className="tooltip-custom">Click to Share</Tooltip>} trigger="hover"
                                            placement="top"
                                        ><a href='#' style={{color:'#4BBF8E'}}><i className="icon-share" style={{fontSize:21}} /></a></Whisper>
                                    </li>
                                </ul>
                            </td>
                            <td data-sort={1673004}>1.60 MB</td>
                            <td data-sort="2023-12-16 07:32:38">
                            <p>16 Dec 2023 <span>1:02 PM</span></p>
                            </td>
                            
                            <td className="actions">
                            <a href="#" className='icon_delete_btn ripple_effect'><i className="icon-delete"></i></a>
                            </td>
                        </tr>
                        <tr key={2} className={`hover_cell ${activeRow === 2 ? 'active-row' : ''}`} onClick={() => handleOpenPopover(2)}>
                            <td align="center">2</td>
                            <td>
                            <span style={{cursor: 'pointer'}} className="filename_link">
                                <img src={IconPDF} height={32} />                                              </span>
                            </td>
                            <td>
                            <span style={{cursor: 'pointer'}} className="filename_link">
                                Manual Racing_compressed.pdf </span>
                            </td>
                            <td>
                            <ul className="table_hover_links">
                                <li>
                                    <Whisper
                                        placement="auto"
                                        trigger="click"
                                        speaker={renderPopover()}
                                        onOpen={() => handleOpenPopover(2)}
                                        onClose={handleClosePopover}
                                    >
                                        <a href='#'><i className="icon-edit-fill" /></a>
                                    </Whisper>
                                </li>
                                
                                <li>
                                <Whisper speaker={<Tooltip className="tooltip-custom">Click to Copy</Tooltip>} trigger="hover"
                                        placement="top"
                                    ><a href='#'><i className="icon-copy-fill" /></a>
                                </Whisper>                         
                                </li>
                                <li>
                                <Whisper speaker={<Tooltip className="tooltip-custom">Click to Download</Tooltip>} trigger="hover"
                                        placement="top"
                                    ><a href='#'><i className="icon-cloud-download" /></a></Whisper>
                                </li>
                                <li>
                                    <Whisper speaker={<Tooltip className="tooltip-custom">Click to Move</Tooltip>} trigger="hover"
                                        placement="top"
                                    ><a href='#' style={{color:'#4256b3'}}><i className="icon-move" style={{fontSize:21}} /></a></Whisper>
                                </li>
                                <li>
                                    <Whisper speaker={<Tooltip className="tooltip-custom">Click to Share</Tooltip>} trigger="hover"
                                        placement="top"
                                    ><a href='#' style={{color:'#4BBF8E'}}><i className="icon-share" style={{fontSize:21}} /></a></Whisper>
                                </li>
                            </ul>
                            </td>
                            <td data-sort={6006936}>5.73 MB</td>
                            <td data-sort="2023-12-16 07:31:09">
                            <p>16 Dec 2023 <span>1:02 PM</span></p>
                            </td>
                            <td cl>
                                <a href="#" className='icon_delete_btn ripple_effect'><i className="icon-delete"></i></a>
                            </td>
                        </tr>

                        <tr key={3} className={`hover_cell ${activeRow === 3 ? 'active-row' : ''}`} onClick={() => handleOpenPopover(3)}>
                            <td align="center">3</td>
                            <td>
                            <span style={{cursor: 'pointer'}} className="filename_link">
                                <img src={IconPDF} height={32} />                                              </span>
                            </td>
                            <td>
                            <span style={{cursor: 'pointer'}} className="filename_link">
                                Propstack Admin.pdf</span>
                            </td>
                            <td>
                            <ul className="table_hover_links">
                                <li>
                                    <Whisper
                                        placement="auto"
                                        trigger="click"
                                        speaker={renderPopover()}
                                        onOpen={() => handleOpenPopover(2)}
                                        onClose={handleClosePopover}
                                    >
                                        <a href='#'><i className="icon-edit-fill" /></a>
                                    </Whisper>
                                </li>
                                
                                <li>
                                <Whisper speaker={<Tooltip className="tooltip-custom">Click to Copy</Tooltip>} trigger="hover"
                                        placement="top"
                                    ><a href='#'><i className="icon-copy-fill" /></a>
                                </Whisper>                         
                                </li>
                                <li>
                                <Whisper speaker={<Tooltip className="tooltip-custom">Click to Download</Tooltip>} trigger="hover"
                                        placement="top"
                                    ><a href='#'><i className="icon-cloud-download" /></a></Whisper>
                                </li>
                                <li>
                                    <Whisper speaker={<Tooltip className="tooltip-custom">Click to Move</Tooltip>} trigger="hover"
                                        placement="top"
                                    ><a href='#' style={{color:'#4256b3'}}><i className="icon-move" style={{fontSize:21}} /></a></Whisper>
                                </li>
                                <li>
                                    <Whisper speaker={<Tooltip className="tooltip-custom">Click to Share</Tooltip>} trigger="hover"
                                        placement="top"
                                    ><a href='#' style={{color:'#4BBF8E'}}><i className="icon-share" style={{fontSize:21}} /></a></Whisper>
                                </li>
                            </ul>
                            </td>
                            <td data-sort={87423}>85.37 KB</td>
                            <td data-sort="2023-12-16 07:31:09">
                            <p>16 Dec 2023 <span>1:02 PM</span></p>
                            </td>
                            <td className="actions">
                            <a href="#" className='icon_delete_btn ripple_effect'><i className="icon-delete"></i></a>
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

                <div className="card-header use_storage">
                    <span>You have used 7.41 MB size from storage</span>
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

export default File