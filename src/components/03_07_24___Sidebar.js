import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Logo from '../images/logo.png';
import LogoMini from '../images/logo-mini.png';

const SideNav = () => {
    const location = useLocation();
    const [openMenus, setOpenMenus] = useState({});
    const [activeMenu, setActiveMenu] = useState(null);

    // Function to handle main menu click
    const handleMenuClick = (menu) => {
        // Toggle the clicked menu and close all other menus
        setOpenMenus((prevOpenMenus) => {
            const newOpenMenus = Object.keys(prevOpenMenus).reduce((acc, key) => {
                acc[key] = key === menu ? !prevOpenMenus[menu] : false;
                return acc;
            }, {});
            return newOpenMenus;
        });
        setActiveMenu(menu);
    };

    // Effect to set active menu based on route change
    useEffect(() => {
        const path = location.pathname;
        const pathMap = {
            '/Home': 'Home',
            '/Files': 'FilesPage',
            '/AddFiles': 'FilesPage',
            '/QrCode': 'QRCode',
            '/AddQrCode': 'QRCode',
            '/ShortLink': 'ShortLink',
            '/TextDetect': 'TextDetect',
            '/FaceDetect': 'FaceDetect',
            '/ChangePassword': 'ChangePassword'
        };

        const menu = Object.keys(pathMap).find(key => path.startsWith(key));
        const activeMenu = menu ? pathMap[menu] : null;

        setActiveMenu(activeMenu);
        setOpenMenus(activeMenu ? { [activeMenu]: true } : {});
    }, [location.pathname]);

    return (
        <nav className="sidebar sidebar-offcanvas" id="sidebar">
            <div className="sidebar-brand-wrapper d-none d-lg-flex align-items-center justify-content-center fixed-top">
                <Link className="sidebar-brand brand-logo" to="/Home"><img src={Logo} alt="logo" /></Link>
                <Link className="sidebar-brand brand-logo-mini" to="/Home"><img src={LogoMini} alt="logo" /></Link>
            </div>
            <div className='left_navigation_row'>
                <ul className="nav">
                    <li className={`nav-item menu-items ${activeMenu === 'Home' ? 'active' : ''}`}>
                        <Link className="nav-link ripple_effect" to="/Home" onClick={() => handleMenuClick('Home')}>
                            <span className="menu-icon">
                                <i className="icon-dashboard" />
                            </span>
                            <span className="menu-title">Dashboard</span>
                        </Link>
                    </li>
                    <li className={`nav-item menu-items ${activeMenu === 'FilesPage' ? 'active' : ''}`}>
                        <a
                            className="nav-link ripple_effect collapsed"
                            data-toggle="collapse"
                            href="#FilesPage"
                            aria-expanded={openMenus['FilesPage'] ? 'true' : 'false'}
                            onClick={() => handleMenuClick('FilesPage')}
                        >
                            <span className="menu-icon">
                                <i className="icon-files" />
                            </span>
                            <span className="menu-title">Files</span>
                            <i className={`menu-arrow ${openMenus['FilesPage'] ? 'rotate' : ''}`} />
                        </a>
                        <div className={`collapse ${openMenus['FilesPage'] ? 'show' : ''}`} id="FilesPage">
                            <ul className="nav flex-column sub-menu">
                                <li className={`nav-item ${location.pathname === '/Files' ? 'active' : ''}`}>
                                    <Link className="nav-link ripple_effect" to="/Files">Files List</Link>
                                </li>
                                <li className={`nav-item ${location.pathname === '/AddFiles' ? 'active' : ''}`}>
                                    <Link className="nav-link ripple_effect" to="/AddFiles">Add Files</Link>
                                </li>
                            </ul>
                        </div>
                    </li>
                    <li className={`nav-item menu-items ${activeMenu === 'QRCode' ? 'active' : ''}`}>
                        <a
                            className="nav-link ripple_effect collapsed"
                            data-toggle="collapse"
                            href="#QRCode"
                            aria-expanded={openMenus['QRCode'] ? 'true' : 'false'}
                            onClick={() => handleMenuClick('QRCode')}
                        >
                            <span className="menu-icon">
                                <i className="icon-qrcode" />
                            </span>
                            <span className="menu-title">QR Code</span>
                            <i className={`menu-arrow ${openMenus['QRCode'] ? 'rotate' : ''}`} />
                        </a>
                        <div className={`collapse ${openMenus['QRCode'] ? 'show' : ''}`} id="QRCode">
                            <ul className="nav flex-column sub-menu">
                                <li className={`nav-item ${location.pathname === '/QrCode' ? 'active' : ''}`}>
                                    <Link className="nav-link ripple_effect" to="/QrCode">QR Code List</Link>
                                </li>
                                <li className={`nav-item ${location.pathname === '/AddQrCode' ? 'active' : ''}`}>
                                    <Link className="nav-link ripple_effect" to="/AddQrCode">Add QR Code</Link>
                                </li>
                            </ul>
                        </div>
                    </li>
                    <li className={`nav-item menu-items ${activeMenu === 'ShortLink' ? 'active' : ''}`}>
                        <Link className="nav-link ripple_effect" to="/ShortLink" onClick={() => handleMenuClick('ShortLink')}>
                            <span className="menu-icon">
                                <i className="icon-link1" />
                            </span>
                            <span className="menu-title">Short Link</span>
                        </Link>
                    </li>
                    <li className={`nav-item menu-items ${activeMenu === 'TextDetect' ? 'active' : ''}`}>
                        <Link className="nav-link ripple_effect" to="/TextDetect" onClick={() => handleMenuClick('TextDetect')}>
                            <span className="menu-icon">
                                <i className="icon-text-detect" />
                            </span>
                            <span className="menu-title">Text Detect</span>
                        </Link>
                    </li>
                    <li className={`nav-item menu-items ${activeMenu === 'FaceDetect' ? 'active' : ''}`}>
                        <Link className="nav-link ripple_effect" to="/FaceDetect" onClick={() => handleMenuClick('FaceDetect')}>
                            <span className="menu-icon">
                                <i class="icon-face-detect" />
                            </span>
                            <span className="menu-title">Face Detect</span>
                        </Link>
                    </li>
                    <li className={`nav-item menu-items ${activeMenu === 'ChangePassword' ? 'active' : ''}`}>
                        <Link className="nav-link ripple_effect" to="/ChangePassword" onClick={() => handleMenuClick('ChangePassword')}>
                            <span className="menu-icon">
                                <i className="icon-change-password" />
                            </span>
                            <span className="menu-title">Change Password</span>
                        </Link>
                    </li>
                </ul>
                <div className="footer_left">
                    <Link className="logout_button ripple_effect" to="/">
                        <i className="icon-logout" />
                        <span className="menu-title">Logout</span>
                    </Link>
                </div>
            </div>
        </nav>
    );
};

export default SideNav;
