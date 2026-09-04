// src/ModalCarousel.js
import React, { useState, useEffect } from 'react';
import { Tooltip, Whisper, SelectPicker, Dropdown, Modal, Popover, Placeholder, Button} from 'rsuite';
import IconJPG from '../images/icon-jpg.svg';
import IconPNG from '../images/icon-png.svg';
import IconPSD from '../images/icon-psd.svg';
import IconPDF from '../images/pdf.svg';
import IconFolder from '../images/folder.svg';
import Slider from 'react-slick';
import 'rsuite/dist/rsuite.min.css';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import 'rsuite/Tooltip/styles/index.css';
import "rsuite/SelectPicker/styles/index.css";
const ModalCarousel = () => {
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
    
    // DELETE POPOVER
    const [activeDeleteRow, setActiveDeleteRow] = useState(null);
    
    // Function to open delete popover
    const handleOpenDeletePopover = (id) => {
    setActiveDeleteRow(id);
    };
    
    // Function to close delete popover
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

    // MODAL
    const [openPreviewModal, setOpenPreviewModal] = useState(false);
    const handleOpenPreviewModal = () => setOpenPreviewModal(true);
    const handleClosePreviewModal = () => setOpenPreviewModal(false);


    const settings = {
        dots: true,
        infinite: true,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1
    };

    return (
        <div>

            <div className='table-responsive'>
                <table id="filestable" className="table table-striped">
                    <thead>
                        <tr>
                            <td width={35} align="center"><b>No.</b></td>
                            <th width={35}>Ext.</th>
                            <th width="50%" className="dropdown dropdown-processed">
                                <Dropdown title={
                                    <span style={{ fontWeight: 600, color: '#181818', }}>
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
                                <span className="filename_link" style={{ cursor: 'pointer' }}><img src={IconFolder} height={32} /></span>
                            </td>
                            <td>
                                <span className="filename_link" style={{ cursor: 'pointer' }} onClick={handleOpenPreviewModal}>Aqua Banner</span>
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
                                        ><a href='#' style={{ color: '#4256b3' }}><i className="icon-move" style={{ fontSize: 21 }} /></a></Whisper>
                                    </li>
                                    <li>
                                        <Whisper speaker={<Tooltip className="tooltip-custom">Click to Share</Tooltip>} trigger="hover"
                                            placement="top"
                                        ><a href='#' style={{ color: '#4BBF8E' }}><i className="icon-share" style={{ fontSize: 21 }} /></a></Whisper>
                                    </li>
                                </ul>
                            </td>
                            <td data-sort={1673004}>1.60 MB</td>
                            <td data-sort="2023-12-16 07:32:38">
                                <p>16 Dec 2023 <span>1:02 PM</span></p>
                            </td>

                            <td className="actions">
                                <Whisper
                                    placement="auto"
                                    trigger="click"
                                    speaker={renderDeletePopover()}
                                    onOpen={() => handleOpenDeletePopover(1)}
                                    onClose={handleCloseDeletePopover}
                                >
                                    <a href='#' className='icon_delete_btn ripple_effect'><i className="icon-delete"></i></a>
                                </Whisper>
                            </td>
                        </tr>
                        <tr key={2} className={`hover_cell ${activeRow === 2 ? 'active-row' : ''}`} onClick={() => handleOpenPopover(2)}>
                            <td align="center">2</td>
                            <td>
                                <span style={{ cursor: 'pointer' }} className="filename_link">
                                    <img src={IconPDF} height={32} />
                                </span>
                            </td>
                            <td>
                                <span style={{ cursor: 'pointer' }} className="filename_link" onClick={handleOpenPreviewModal}>
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
                                        ><a href='#' style={{ color: '#4256b3' }}><i className="icon-move" style={{ fontSize: 21 }} /></a></Whisper>
                                    </li>
                                    <li>
                                        <Whisper speaker={<Tooltip className="tooltip-custom">Click to Share</Tooltip>} trigger="hover"
                                            placement="top"
                                        ><a href='#' style={{ color: '#4BBF8E' }}><i className="icon-share" style={{ fontSize: 21 }} /></a></Whisper>
                                    </li>
                                </ul>
                            </td>
                            <td data-sort={6006936}>5.73 MB</td>
                            <td data-sort="2023-12-16 07:31:09">
                                <p>16 Dec 2023 <span>1:02 PM</span></p>
                            </td>
                            <td cl>
                                <Whisper
                                    placement="auto"
                                    trigger="click"
                                    speaker={renderDeletePopover()}
                                    onOpen={() => handleOpenDeletePopover(1)}
                                    onClose={handleCloseDeletePopover}
                                >
                                    <a href='#' className='icon_delete_btn ripple_effect'><i className="icon-delete"></i></a>
                                </Whisper>
                            </td>
                        </tr>

                        <tr key={3} className={`hover_cell ${activeRow === 3 ? 'active-row' : ''}`} onClick={() => handleOpenPopover(3)}>
                            <td align="center">3</td>
                            <td>
                                <span style={{ cursor: 'pointer' }} className="filename_link">
                                    <img src={IconPDF} height={32} />
                                </span>
                            </td>
                            <td>
                                <span style={{ cursor: 'pointer' }} className="filename_link" onClick={handleOpenPreviewModal}>
                                    Propstack Admin.pdf</span>
                            </td>
                            <td>
                                <ul className="table_hover_links">
                                    <li>
                                        <Whisper
                                            placement="auto"
                                            trigger="click"
                                            speaker={renderPopover()}
                                            onOpen={() => handleOpenPopover(3)}
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
                                        ><a href='#' style={{ color: '#4256b3' }}><i className="icon-move" style={{ fontSize: 21 }} /></a></Whisper>
                                    </li>
                                    <li>
                                        <Whisper speaker={<Tooltip className="tooltip-custom">Click to Share</Tooltip>} trigger="hover"
                                            placement="top"
                                        ><a href='#' style={{ color: '#4BBF8E' }}><i className="icon-share" style={{ fontSize: 21 }} /></a></Whisper>
                                    </li>
                                </ul>
                            </td>
                            <td data-sort={87423}>85.37 KB</td>
                            <td data-sort="2023-12-16 07:31:09">
                                <p>16 Dec 2023 <span>1:02 PM</span></p>
                            </td>
                            <td className="actions">
                                <Whisper
                                    placement="auto"
                                    trigger="click"
                                    speaker={renderDeletePopover()}
                                    onOpen={() => handleOpenDeletePopover(1)}
                                    onClose={handleCloseDeletePopover}
                                >
                                    <a href='#' className='icon_delete_btn ripple_effect'><i className="icon-delete"></i></a>
                                </Whisper>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <Modal open={openPreviewModal} onClose={handleClosePreviewModal} className='PreviewModal'>
                <Modal.Header>
                    <Modal.Title>Modal with Carousel</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Slider {...settings}>
                        <div>
                            <iframe src="https://www.princexml.com/samples/invoice/invoicesample.pdf" alt="slide 1" border="0" width="100%" style={{height:'100vh',}} />
                        </div>
                        <div>
                            <img src="https://as2.ftcdn.net/v2/jpg/08/39/34/03/1000_F_839340361_BXDv39guFXpjJ6z44HFIHmS4qV9loY3c.jpg" alt="slide 2" />
                        </div>
                        <div>
                            <img src="https://as2.ftcdn.net/v2/jpg/08/12/78/87/1000_F_812788787_8OfejbAdSrwsjYCu3qdACVCZUi0EAra1.jpg" alt="slide 3" />
                        </div>
                    </Slider>
                </Modal.Body>
                 
            </Modal>
        </div>
    );
};

export default ModalCarousel;
