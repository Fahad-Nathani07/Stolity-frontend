import React, { useState, useEffect } from 'react';
import Logo from '../images/logo.png';

import { Tooltip, Whisper, SelectPicker, Dropdown, Placeholder } from 'rsuite';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import 'rsuite/Tooltip/styles/index.css';
import "rsuite/SelectPicker/styles/index.css";
import 'rsuite/dist/rsuite.min.css';

import SideNav from '../components/SideNav';
import Footer from '../components/Footer';
import ToggleNav from '../components/ToggleNav';


const ShortLink = () => {

const data = ['10', '20', '50', '100'].map(
  item => ({ label: item, value: item })
);

// COPY TOOLTIP TEXT
const [copied, setCopied] = useState(false);
const handleCopy = () => {
setCopied(true);
setTimeout(() => setCopied(false), 2000); // Reset the tooltip after 2 seconds
};

const [url, setUrl] = useState('');
    const [buttonText, setButtonText] = useState('Shorten');

    const handleInputChange = (event) => {
        setUrl(event.target.value);
    };

    const handleButtonClick = () => {
        if (buttonText === 'Shorten' && url.trim() !== '') {
            // Simulate the URL shortening process
            const shortUrl = `https://files.infomanav.com/${Math.random().toString(36).substring(7)}`;
            setUrl(shortUrl);
            setButtonText('Copy');
        } else if (buttonText === 'Copy' && url.trim() !== '') {
            // Copy the shortened URL to the clipboard
            navigator.clipboard.writeText(url).then(() => {
                setButtonText('Copied');
                setTimeout(() => setButtonText('Copy'), 2000); // Reset to 'Copy' after 2 seconds
            });
        }
    };


const [isLoading, setLoading] = useState(true); // State to manage loading state
useEffect(() => {
    // Simulate an API call or data loading delay
    setTimeout(() => setLoading(false), 2000); // Simulate 2 seconds loading time
    }, []);

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
            <h1>Short URL's</h1>
        </div>
        
        </div>
    </nav>
    {/* partial */}
    <div className="main-panel">
        <div className="content-wrapper">
            <div className='shorten_box'>
                <div className='shortlink_row'>
                    <input type='text' placeholder='Enter Your URL' value={url} onChange={handleInputChange} />
                    <button type='button' className='btn_shorten' onClick={handleButtonClick}>{buttonText}</button>
                </div>

                <p>By clicking SHORTEN, you are agreeing to Infomanav Terms of Service and Privacy Policy</p>
            </div>

            

        

            <div className="table_box mt-4">
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
        {!isLoading && (
            <div className='table-responsive'>
                <table id="filestable" className="table table-striped">
                    <thead>
                    <tr>
                        <td width={35} align="center"><b>No.</b></td>
                        <th width={35}>Short Link</th>
                        <th width="50%">URL</th>
                        <th width={75}>Alias</th>
                        <th width={90}>Created</th>
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
                            <CopyToClipboard text="https://files.infomanav.com/03UJc1" onCopy={handleCopy}>
                            <span
                                className="filename_link"
                                style={{ display: 'inline-block', maxWidth: '20vw', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }}
                            >
                               https://files.infomanav.com/03UJc1
                            </span>
                            </CopyToClipboard>
                        </Whisper>                                                                         
                        </td>
                        <td className="filename_link">
                        <Whisper
                            speaker={<Tooltip className="tooltip_custom_copy">{copied ? 'Copied!' : 'Click to Copy'}</Tooltip>}
                            trigger="hover"
                            placement="top"
                        >
                            <CopyToClipboard text="https://mangesh1.s3.ap-south-1.amazonaws.com/javed/MyBudddyAPK/MyBuddy_V3_0.apk?63fdf659b330f2d46037" onCopy={handleCopy}>
                            <span
                                className="filename_link"
                                style={{ display: 'inline-block', maxWidth: '35vw', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }}
                            >
                                https://mangesh1.s3.ap-south-1.amazonaws.com/javed/MyBudddyAPK/MyBuddy_V3_0.apk?63fdf659b330f2d46037
                            </span>
                            </CopyToClipboard>
                        </Whisper>
                            
                        </td>
                        <td>
                        <p style={{fontWeight:500, color:"#333"}}>03UJc1</p>
                        </td>                        
                        <td><p>24-06-2021</p></td>
                    </tr>
                    <tr className="hover_cell">
                        <td align="center">2</td>
                        <td>
                        <Whisper
                            speaker={<Tooltip className="tooltip_custom_copy">{copied ? 'Copied!' : 'Click to Copy'}</Tooltip>}
                            trigger="hover"
                            placement="top"
                        >
                            <CopyToClipboard text="https://files.infomanav.com/03UJc1" onCopy={handleCopy}>
                            <span
                                className="filename_link"
                                style={{ display: 'inline-block', maxWidth: '20vw', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }}
                            >
                               https://files.infomanav.com/03UJc1
                            </span>
                            </CopyToClipboard>
                        </Whisper>                                                                         
                        </td>
                        <td className="filename_link">
                        <Whisper
                            speaker={<Tooltip className="tooltip_custom_copy">{copied ? 'Copied!' : 'Click to Copy'}</Tooltip>}
                            trigger="hover"
                            placement="top"
                        >
                            <CopyToClipboard text="https://mangesh1.s3.ap-south-1.amazonaws.com/javed/MyBudddyAPK/MyBuddy_V3_0.apk?63fdf659b330f2d46037" onCopy={handleCopy}>
                            <span
                                className="filename_link"
                                style={{ display: 'inline-block', maxWidth: '35vw', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }}
                            >
                                https://mangesh1.s3.ap-south-1.amazonaws.com/javed/MyBudddyAPK/MyBuddy_V3_0.apk?63fdf659b330f2d46037
                            </span>
                            </CopyToClipboard>
                        </Whisper>
                            
                        </td>
                        <td>
                        <p style={{fontWeight:500, color:"#333"}}>03UJc1</p>
                        </td>                        
                        <td><p>24-06-2021</p></td>
                    </tr>
                    <tr className="hover_cell">
                        <td align="center">3</td>
                        <td>
                        <Whisper
                            speaker={<Tooltip className="tooltip_custom_copy">{copied ? 'Copied!' : 'Click to Copy'}</Tooltip>}
                            trigger="hover"
                            placement="top"
                        >
                            <CopyToClipboard text="https://files.infomanav.com/03UJc1" onCopy={handleCopy}>
                            <span
                                className="filename_link"
                                style={{ display: 'inline-block', maxWidth: '20vw', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }}
                            >
                               https://files.infomanav.com/03UJc1
                            </span>
                            </CopyToClipboard>
                        </Whisper>                                                                         
                        </td>
                        <td className="filename_link">
                        <Whisper
                            speaker={<Tooltip className="tooltip_custom_copy">{copied ? 'Copied!' : 'Click to Copy'}</Tooltip>}
                            trigger="hover"
                            placement="top"
                        >
                            <CopyToClipboard text="https://mangesh1.s3.ap-south-1.amazonaws.com/javed/MyBudddyAPK/MyBuddy_V3_0.apk?63fdf659b330f2d46037" onCopy={handleCopy}>
                            <span
                                className="filename_link"
                                style={{ display: 'inline-block', maxWidth: '35vw', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }}
                            >
                                https://mangesh1.s3.ap-south-1.amazonaws.com/javed/MyBudddyAPK/MyBuddy_V3_0.apk?63fdf659b330f2d46037
                            </span>
                            </CopyToClipboard>
                        </Whisper>
                            
                        </td>
                        <td>
                        <p style={{fontWeight:500, color:"#333"}}>03UJc1</p>
                        </td>                        
                        <td><p>24-06-2021</p></td>
                    </tr>
                    <tr className="hover_cell">
                        <td align="center">4</td>
                        <td>
                        <Whisper
                            speaker={<Tooltip className="tooltip_custom_copy">{copied ? 'Copied!' : 'Click to Copy'}</Tooltip>}
                            trigger="hover"
                            placement="top"
                        >
                            <CopyToClipboard text="https://files.infomanav.com/03UJc1" onCopy={handleCopy}>
                            <span
                                className="filename_link"
                                style={{ display: 'inline-block', maxWidth: '20vw', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }}
                            >
                               https://files.infomanav.com/03UJc1
                            </span>
                            </CopyToClipboard>
                        </Whisper>                                                                         
                        </td>
                        <td className="filename_link">
                        <Whisper
                            speaker={<Tooltip className="tooltip_custom_copy">{copied ? 'Copied!' : 'Click to Copy'}</Tooltip>}
                            trigger="hover"
                            placement="top"
                        >
                            <CopyToClipboard text="https://mangesh1.s3.ap-south-1.amazonaws.com/javed/MyBudddyAPK/MyBuddy_V3_0.apk?63fdf659b330f2d46037" onCopy={handleCopy}>
                            <span
                                className="filename_link"
                                style={{ display: 'inline-block', maxWidth: '35vw', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }}
                            >
                                https://mangesh1.s3.ap-south-1.amazonaws.com/javed/MyBudddyAPK/MyBuddy_V3_0.apk?63fdf659b330f2d46037
                            </span>
                            </CopyToClipboard>
                        </Whisper>
                            
                        </td>
                        <td>
                        <p style={{fontWeight:500, color:"#333"}}>03UJc1</p>
                        </td>                        
                        <td><p>24-06-2021</p></td>
                    </tr>
                    <tr className="hover_cell">
                        <td align="center">5</td>
                        <td>
                        <Whisper
                            speaker={<Tooltip className="tooltip_custom_copy">{copied ? 'Copied!' : 'Click to Copy'}</Tooltip>}
                            trigger="hover"
                            placement="top"
                        >
                            <CopyToClipboard text="https://files.infomanav.com/03UJc1" onCopy={handleCopy}>
                            <span
                                className="filename_link"
                                style={{ display: 'inline-block', maxWidth: '20vw', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }}
                            >
                               https://files.infomanav.com/03UJc1
                            </span>
                            </CopyToClipboard>
                        </Whisper>                                                                         
                        </td>
                        <td className="filename_link">
                        <Whisper
                            speaker={<Tooltip className="tooltip_custom_copy">{copied ? 'Copied!' : 'Click to Copy'}</Tooltip>}
                            trigger="hover"
                            placement="top"
                        >
                            <CopyToClipboard text="https://mangesh1.s3.ap-south-1.amazonaws.com/javed/MyBudddyAPK/MyBuddy_V3_0.apk?63fdf659b330f2d46037" onCopy={handleCopy}>
                            <span
                                className="filename_link"
                                style={{ display: 'inline-block', maxWidth: '35vw', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }}
                            >
                                https://mangesh1.s3.ap-south-1.amazonaws.com/javed/MyBudddyAPK/MyBuddy_V3_0.apk?63fdf659b330f2d46037
                            </span>
                            </CopyToClipboard>
                        </Whisper>
                            
                        </td>
                        <td>
                        <p style={{fontWeight:500, color:"#333"}}>03UJc1</p>
                        </td>                        
                        <td><p>24-06-2021</p></td>
                    </tr>
                    <tr className="hover_cell">
                        <td align="center">6</td>
                        <td>
                        <Whisper
                            speaker={<Tooltip className="tooltip_custom_copy">{copied ? 'Copied!' : 'Click to Copy'}</Tooltip>}
                            trigger="hover"
                            placement="top"
                        >
                            <CopyToClipboard text="https://files.infomanav.com/03UJc1" onCopy={handleCopy}>
                            <span
                                className="filename_link"
                                style={{ display: 'inline-block', maxWidth: '20vw', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }}
                            >
                               https://files.infomanav.com/03UJc1
                            </span>
                            </CopyToClipboard>
                        </Whisper>                                                                         
                        </td>
                        <td className="filename_link">
                        <Whisper
                            speaker={<Tooltip className="tooltip_custom_copy">{copied ? 'Copied!' : 'Click to Copy'}</Tooltip>}
                            trigger="hover"
                            placement="top"
                        >
                            <CopyToClipboard text="https://mangesh1.s3.ap-south-1.amazonaws.com/javed/MyBudddyAPK/MyBuddy_V3_0.apk?63fdf659b330f2d46037" onCopy={handleCopy}>
                            <span
                                className="filename_link"
                                style={{ display: 'inline-block', maxWidth: '35vw', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }}
                            >
                                https://mangesh1.s3.ap-south-1.amazonaws.com/javed/MyBudddyAPK/MyBuddy_V3_0.apk?63fdf659b330f2d46037
                            </span>
                            </CopyToClipboard>
                        </Whisper>
                            
                        </td>
                        <td>
                        <p style={{fontWeight:500, color:"#333"}}>03UJc1</p>
                        </td>                        
                        <td><p>24-06-2021</p></td>
                    </tr>

                    <tr className="hover_cell">
                        <td align="center">7</td>
                        <td>
                        <Whisper
                            speaker={<Tooltip className="tooltip_custom_copy">{copied ? 'Copied!' : 'Click to Copy'}</Tooltip>}
                            trigger="hover"
                            placement="top"
                        >
                            <CopyToClipboard text="https://files.infomanav.com/03UJc1" onCopy={handleCopy}>
                            <span
                                className="filename_link"
                                style={{ display: 'inline-block', maxWidth: '20vw', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }}
                            >
                               https://files.infomanav.com/03UJc1
                            </span>
                            </CopyToClipboard>
                        </Whisper>                                                                         
                        </td>
                        <td className="filename_link">
                        <Whisper
                            speaker={<Tooltip className="tooltip_custom_copy">{copied ? 'Copied!' : 'Click to Copy'}</Tooltip>}
                            trigger="hover"
                            placement="top"
                        >
                            <CopyToClipboard text="https://mangesh1.s3.ap-south-1.amazonaws.com/javed/MyBudddyAPK/MyBuddy_V3_0.apk?63fdf659b330f2d46037" onCopy={handleCopy}>
                            <span
                                className="filename_link"
                                style={{ display: 'inline-block', maxWidth: '35vw', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }}
                            >
                                https://mangesh1.s3.ap-south-1.amazonaws.com/javed/MyBudddyAPK/MyBuddy_V3_0.apk?63fdf659b330f2d46037
                            </span>
                            </CopyToClipboard>
                        </Whisper>
                            
                        </td>
                        <td>
                        <p style={{fontWeight:500, color:"#333"}}>03UJc1</p>
                        </td>                        
                        <td><p>24-06-2021</p></td>
                    </tr>

                    <tr className="hover_cell">
                        <td align="center">8</td>
                        <td>
                        <Whisper
                            speaker={<Tooltip className="tooltip_custom_copy">{copied ? 'Copied!' : 'Click to Copy'}</Tooltip>}
                            trigger="hover"
                            placement="top"
                        >
                            <CopyToClipboard text="https://files.infomanav.com/03UJc1" onCopy={handleCopy}>
                            <span
                                className="filename_link"
                                style={{ display: 'inline-block', maxWidth: '20vw', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }}
                            >
                               https://files.infomanav.com/03UJc1
                            </span>
                            </CopyToClipboard>
                        </Whisper>                                                                         
                        </td>
                        <td className="filename_link">
                        <Whisper
                            speaker={<Tooltip className="tooltip_custom_copy">{copied ? 'Copied!' : 'Click to Copy'}</Tooltip>}
                            trigger="hover"
                            placement="top"
                        >
                            <CopyToClipboard text="https://mangesh1.s3.ap-south-1.amazonaws.com/javed/MyBudddyAPK/MyBuddy_V3_0.apk?63fdf659b330f2d46037" onCopy={handleCopy}>
                            <span
                                className="filename_link"
                                style={{ display: 'inline-block', maxWidth: '35vw', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }}
                            >
                                https://mangesh1.s3.ap-south-1.amazonaws.com/javed/MyBudddyAPK/MyBuddy_V3_0.apk?63fdf659b330f2d46037
                            </span>
                            </CopyToClipboard>
                        </Whisper>
                            
                        </td>
                        <td>
                        <p style={{fontWeight:500, color:"#333"}}>03UJc1</p>
                        </td>                        
                        <td><p>24-06-2021</p></td>
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

export default ShortLink