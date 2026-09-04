import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Logo from "../images/logo.png";
import ToggleNav from "../components/ToggleNav";
import LogoStolity from "../images/LogoStolity.png";
import JobPortalBriefcase from "../images/JobPortalBriefcase.svg";
import JobPortalBriefcase_active from "../images/JobPortalBriefcase_active.svg";
import LogoStolityMini from "../images/NewLogo.svg";
import SuperAdminDashboard_Active from "../images/SuperAdminDashboard_Active.svg";
import SuperAdminDashboard from "../images/SuperAdminDashboard.svg";
import { ChakraProvider, Stack, useToast } from "@chakra-ui/react";
import homeSidebar from "../images/homeSidebar.svg";
import profileSidebar from "../images/profileSidebar.svg";
import settingsSidebar from "../images/settingsSidebar.svg";
import SettingsGearIcon from "../images/SettingsGearIcon.svg";

// Material-UI Icons
import DownloadIcon from "@mui/icons-material/Download";
import FolderIcon from "@mui/icons-material/Folder";
import DescriptionIcon from "@mui/icons-material/Description";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import { RiAdminFill } from "react-icons/ri";
import { FiHeadphones } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";

import axios from "axios";

const SESSION_END_EVENT = "stolity:session-end";

const SideNav = () => {
  const [openMenus, setOpenMenus] = useState({});
  const [activeMenu, setActiveMenu] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const token = sessionStorage.getItem("number");
  const location = useLocation();
  const count = useSelector((state) => state.getdata.counter);
  const apiUrl = process.env.REACT_APP_API_ENDPOINT;
  const [defaultFolders, setDefaultFolders] = useState([]);
  const isSoftBan = useSelector((state) => state.usersAdmin?.currentUser?.isSoftBan);
  const dispatch = useDispatch();
  const { role, loading } = useSelector((state) => state.jobPortal);
  const userProfile = useSelector((state) => state.userProfile);
  const showSuperAdminPanel = role === "SUPER_ADMIN";
  const showJobPortal =
    role === "SUPER_ADMIN" ||
    role === "ADMIN" ||
    role === "JOB_PORTAL_MANAGER";
  const agentEmail = (
    userProfile?.email ||
    sessionStorage.getItem("email") ||
    ""
  ).toLowerCase();
  const showSupportDashboard = agentEmail.includes("infomanav");

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const subscription = useSelector((state) => state.subscription.subscription);
  const folderSize = useSelector((state) => state.subscription.folderSize);
  const isPremium =
    !!subscription &&
    Array.isArray(subscription.entitlement_ids) &&
    subscription.entitlement_ids.length > 0;

  const toast = useToast();

  const showToast = (status, message) => {
    toast({
      title: `${status.charAt(0).toUpperCase() + status.slice(1)}`,
      description: message,
      status: status,
      duration: 3000,
      isClosable: true,
    });
  };

  // Countdown state (for warning card)
  const [countdown, setCountdown] = useState(15);

  // Countdown + auto-logout logic
  useEffect(() => {
    if (!isSoftBan) return;

    if (countdown <= 0) {
      handleLogout();
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isSoftBan, countdown]);

  // Function to handle main menu click
  const handleMenuClick = (menu) => {
    setOpenMenus((prevOpenMenus) => ({
      ...Object.keys(prevOpenMenus).reduce((acc, key) => {
        acc[key] = key === menu ? !prevOpenMenus[menu] : false;
        return acc;
      }, {}),
    }));
    setActiveMenu(menu);
  };

  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const settingsRef = useRef();

  useEffect(() => {
    function handleClickOutside(event) {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowSettingsMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getFolderIcon = (folderName) => {
    switch (folderName.toLowerCase()) {
      case "downloads":
        return <DownloadIcon />;
      case "documents":
        return <DescriptionIcon />;
      case "videos":
        return <VideoLibraryIcon />;
      case "music":
        return <MusicNoteIcon />;
      case "photos":
        return <PhotoLibraryIcon />;
      default:
        return <FolderIcon />;
    }
  };

  const handleSidebarToggle = () => {
    setSidebarOpen((prevState) => !prevState);
  };

  useEffect(() => {
    const path = location.pathname;
    const pathMap = {
      "/Home": "Home",
      "/Files": "FilesPage",
      "/Favourites": "FavouritesPage",
      "/AddFiles": "AddFilesPage",
      "/Bin": "RecycleBin",
      "/QrCode": "QRCode",
      "/AddQrCode": "QRCode",
      "/ShortLink": "ShortLink",
      "/TextDetect": "TextDetect",
      "/FaceDetect": "FaceDetect",
      "/ChangePassword": "ChangePassword",
      "/nested": "FilesPage",
      "/UserProfile": "UserProfile",
      "/JobPortalAdmin": "JobPortalAdmin",
      "/JobPortal": "JobPortal",
      "/HelpSupportCenter": "HelpSupportCenter",
      "/FAQPage": "FAQPage",
      "/SupportDashboard": "SupportDashboard",
    };
    const menu = Object.keys(pathMap).find((key) => path.startsWith(key));
    const activeMenu = menu ? pathMap[menu] : null;

    console.log("Active Menu Set To:", activeMenu);

    setActiveMenu(activeMenu);
    setOpenMenus(activeMenu ? { [activeMenu]: true } : {});
    setSidebarOpen(true);
  }, [location.pathname]);

  useEffect(() => {
    setSidebarOpen(true);
  }, []);

  const finishLogout = () => {
    if (typeof document !== "undefined") {
      document.querySelectorAll("audio, video").forEach((el) => {
        try {
          el.pause();
          el.removeAttribute("src");
          if (typeof el.load === "function") el.load();
        } catch {
          /* ignore */
        }
      });
      document.body.classList.remove("audio-player-active");
    }
    dispatch({ type: "RESET" });
    window.dispatchEvent(new CustomEvent(SESSION_END_EVENT));
    localStorage.clear();
    sessionStorage.clear();
    sessionStorage.setItem("intentionalLogout", "1");
    navigate("/Login");
  };

  const handleLogout = () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    axios
      .get(`${apiUrl}logout-user`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      .then((res) => {
        showToast("success", "You have logged out successfully!");
        console.log("Response received:", res.data);
        finishLogout();
      })
      .catch((error) => {
        showToast("error", `There's an error while logging out!`);
        console.log(error.response?.data?.error || error);
        finishLogout();
      });
  };

  return (
    <>
      {/* Soft ban warning card (overlay) - always on top when banned */}
      {isSoftBan && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.85)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              maxWidth: "520px",
              width: "100%",
              padding: "40px 32px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
              textAlign: "center",
              border: "1px solid #fee2e2",
            }}
          >
            <div style={{ fontSize: "64px", marginBottom: "24px" }}>⛔</div>

            <h2
              style={{
                fontSize: "28px",
                fontWeight: 700,
                color: "#991b1b",
                margin: "0 0 16px",
              }}
            >
              Account Temporarily Restricted
            </h2>

            <p
              style={{
                fontSize: "16px",
                lineHeight: 1.6,
                color: "#374151",
                margin: "0 0 32px",
              }}
            >
              Your account is currently under a temporary restriction.  
              Access to the platform has been paused. Please contact support to resolve this.
            </p>

            <div
              style={{
                background: "#f9fafb",
                padding: "20px",
                borderRadius: "12px",
                marginBottom: "32px",
              }}
            >
              <p style={{ fontWeight: 600, color: "#1e293b", margin: "0 0 12px" }}>
                Contact Support
              </p>
              <p style={{ margin: "0 0 8px", fontSize: "15px" }}>
                Email: support@infomanav.com
              </p>
              {/* <p style={{ margin: 0, fontSize: "15px" }}>
                Or submit a ticket via the helpdesk system.
              </p> */}
            </div>

            <p
              style={{
                fontSize: "15px",
                color: "#4b5563",
                marginTop: "24px",
              }}
            >
              Logging you out in <strong>{countdown}s</strong>...
            </p>
          </div>
        </div>
      )}

      {/* Sidebar - always visible */}
      <nav
        className={`sidebar sidebar-offcanvas ${
          sidebarOpen ? "open" : "closed"
        }`}
        id="sidebar"
      >
        <div className="sidebar-brand-wrapper d-none d-lg-flex align-items-center justify-content-center fixed-top">
          <Link className="sidebar-brand brand-logo" to="/Files">
            <img src={LogoStolity} alt="logo" />
          </Link>
          <Link className="sidebar-brand brand-logo-mini" to="/Files">
            <img
              src={LogoStolityMini}
              alt="logo"
              style={{ height: "40px", width: "40px" }}
            />
          </Link>
        </div>

        <div className="left_navigation_row">
          <ul className="nav">
            {/* Files Page */}
            <li
              className={`nav-item menu-items ${
                activeMenu === "FilesPage" ? "active" : ""
              }`}
            >
              <Link
                className="nav-link ripple_effect"
                to="/Files"
                onClick={() => setSidebarOpen(true)}
              >
                <span
                  className={`menu-icon ${
                    activeMenu === "FilesPage" ? "active-icon" : ""
                  }`}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="sidebar-icon"
                  >
                    <path
                      d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M9 22V12H15V22"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </Link>
            </li>

            {/* Favourites Page */}
            {isPremium && (
              <li
                className={`nav-item menu-items ${
                  activeMenu === "FavouritesPage" ? "active" : ""
                }`}
              >
                <Link
                  className="nav-link ripple_effect"
                  to="/Favourites"
                  onClick={() => setSidebarOpen(true)}
                >
                  <span
                    className={`menu-icon ${
                      activeMenu === "FavouritesPage" ? "active-icon" : ""
                    }`}
                  >
                    <StarBorderIcon
                      style={{
                        color:
                          activeMenu === "FavouritesPage"
                            ? "#ffffffff"
                            : "currentColor",
                        fontSize:
                          activeMenu === "FavouritesPage" ? "28px" : "24px",
                      }}
                    />
                  </span>
                </Link>
              </li>
            )}

            {/* Recycle Bin Page */}
            <li
              className={`nav-item menu-items ${
                activeMenu === "RecycleBin" ? "active" : ""
              }`}
            >
              <Link
                className="nav-link ripple_effect"
                to="/Bin"
                onClick={() => setSidebarOpen(true)}
              >
                <span
                  className={`menu-icon ${
                    activeMenu === "RecycleBin" ? "active-icon" : ""
                  }`}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="sidebar-icon"
                    style={{
                      width: activeMenu === "RecycleBin" ? "24px" : "22px",
                      height: activeMenu === "RecycleBin" ? "24px" : "22px",
                    }}
                  >
                    <path
                      d="M3 6H5H21"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M10 11V17"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M14 11V17"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </Link>
            </li>

            {/* User Profile */}
            <li
              className={`nav-item menu-items ${
                activeMenu === "UserProfile" ? "active" : ""
              }`}
            >
              <Link
                className="nav-link ripple_effect"
                to="/UserProfile"
                onClick={() => setSidebarOpen(true)}
              >
                <span
                  className={`menu-icon ${
                    activeMenu === "UserProfile" ? "active-icon" : ""
                  }`}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="sidebar-icon"
                  >
                    <path
                      d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </Link>
            </li>

            {showSupportDashboard && (
              <li
                className={`nav-item menu-items ${
                  activeMenu === "SupportDashboard" ? "active" : ""
                }`}
              >
                <Link
                  className="nav-link ripple_effect"
                  to="/SupportDashboard"
                  onClick={() => setSidebarOpen(true)}
                  title="Support dashboard"
                >
                  <span
                    className={`menu-icon ${
                      activeMenu === "SupportDashboard" ? "active-icon" : ""
                    }`}
                  >
                    <FiHeadphones
                      style={{
                        color:
                          activeMenu === "SupportDashboard"
                            ? "#ffffffff"
                            : "currentColor",
                        fontSize:
                          activeMenu === "SupportDashboard" ? "26px" : "22px",
                      }}
                    />
                  </span>
                </Link>
              </li>
            )}

            {showSuperAdminPanel && (
              <li className={`nav-item menu-items ${activeMenu === "JobPortalAdmin" ? "active" : ""}`}>
                <Link
                  className="nav-link ripple_effect"
                  to="/JobPortalAdmin"
                  onClick={() => setSidebarOpen(true)}
                >
                  <span className={`menu-icon ${activeMenu === "JobPortalAdmin" ? "active-icon" : ""}`}>
                    <img 
                      style={{ height: `${activeMenu === "JobPortalAdmin" ? "42px" : "25px"}` }}
                      src={`${activeMenu === "JobPortalAdmin" ? SuperAdminDashboard_Active : SuperAdminDashboard}`} 
                      alt="Job Portal Admin" 
                    />
                  </span>
                </Link>
              </li>
            )}

            {showJobPortal && (
              <li className={`nav-item menu-items ${activeMenu === "JobPortal" ? "active" : ""}`}>
                <Link
                  className="nav-link ripple_effect"
                  to="/JobPortal"
                  onClick={() => setSidebarOpen(true)}
                >
                  <span className={`menu-icon ${activeMenu === "JobPortal" ? "active-icon" : ""}`}>
                    <img 
                      style={{ height: `${activeMenu === "JobPortal" ? "42px" : "22px"}` }}
                      src={`${activeMenu === "JobPortal" ? JobPortalBriefcase_active : JobPortalBriefcase}`} 
                      alt="Job Portal" 
                    />
                  </span>
                </Link>
              </li>
            )}
          </ul>

          <div>
            <div className="sidebar-settings-wrapper" ref={settingsRef} style={{ position: "relative" }}>
              <button
                className="settings-gear-btn ripple_effect"
                onClick={() => setShowSettingsMenu(v => !v)}
                style={{
                  background: "none",
                  border: "none",
                  outline: "none",
                  padding: "0",
                  margin: "0 auto",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  cursor: "pointer",
                  width: "44px",
                  height: "44px"
                }}
                aria-label="Settings"
              >
                <img src={SettingsGearIcon} alt="Settings" style={{ width: "24px", height: "24px" }} />
              </button>

              {showSettingsMenu && (
                <div
                  className="settings-dropdown-menu"
                  style={{
                    position: "absolute",
                    left: "100%",
                    top: "50%",
                    transform: "translateY(-110%) translateX(-32px)",
                    background: "#ffffffff",
                    boxShadow: "0 14px 36px rgba(255,171,73,0.15)",
                    borderRadius: "16px",
                    padding: "8px 0",
                    minWidth: "190px",
                    zIndex: 22,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "stretch",
                    border: "1.5px solid #FFE3CA",
                    animation: "fadeInRight 0.18s",
                  }}
                >
                  <button
                    className="settings-menu-item"
                    style={{
                      background: "none",
                      border: "none",
                      padding: "13px 28px",
                      fontSize: "15px",
                      color: "#222",
                      cursor: "pointer",
                      textAlign: "left",
                      fontWeight: 500,
                      letterSpacing: "-0.03em",
                      transition: "background .16s, color .16s"
                    }}
                    onClick={() => { navigate("/Payment"); setShowSettingsMenu(false); }}
                    onMouseOver={e => (e.currentTarget.style.color = "#FFAB49")}
                    onMouseOut={e => (e.currentTarget.style.color = "#222")}
                  >
                    Upgrade Plan
                  </button>
                  <button
                    className="settings-menu-item"
                    style={{
                      background: "none",
                      border: "none",
                      padding: "13px 28px",
                      fontSize: "15px",
                      color: "#222",
                      cursor: "pointer",
                      textAlign: "left",
                      fontWeight: 500,
                      letterSpacing: "-0.03em",
                      transition: "background .16s, color .16s"
                    }}
                    onClick={() => { navigate("/HelpSupportCenter"); setShowSettingsMenu(false); }}
                    onMouseOver={e => (e.currentTarget.style.color = "#FFAB49")}
                    onMouseOut={e => (e.currentTarget.style.color = "#222")}
                  >
                    Help & Support Center
                  </button>
                  <button
                    className="settings-menu-item"
                    style={{
                      background: "none",
                      border: "none",
                      padding: "13px 28px",
                      fontSize: "15px",
                      color: "#222",
                      cursor: "pointer",
                      textAlign: "left",
                      fontWeight: 500,
                      letterSpacing: "-0.03em",
                      transition: "background .16s, color .16s"
                    }}
                    onClick={() => { navigate("/FAQPage"); setShowSettingsMenu(false); }}
                    onMouseOver={e => (e.currentTarget.style.color = "#FFAB49")}
                    onMouseOut={e => (e.currentTarget.style.color = "#222")}
                  >
                    FAQ
                  </button>
                </div>
              )}
            </div>

            <div className="footer_left">
              <button
                className="logout_button ripple_effect"
                onClick={() => setShowLogoutModal(true)}
                disabled={isLoggingOut}
              >
                <i className="icon-logout" />
                <span className="menu-title">
                  {isLoggingOut ? "Logging out…" : "Logout"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {showLogoutModal && (
        <div className="rename_popup_wrapper" style={{ zIndex: 10000 }}>
          <div className="rename_modal">
            <h2 className="rename_title2">Are you sure you want to logout?</h2>
            <p className="rename_subtext">
              You will need to sign in again to access your account.
            </p>
            <div className="rename_buttons">
              <button
                type="button"
                className="rename_btn cancel"
                disabled={isLoggingOut}
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rename_btn ok"
                disabled={isLoggingOut}
                onClick={handleLogout}
              >
                {isLoggingOut ? "Logging out…" : "Logout"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-logout countdown logic – only when banned */}
      {isSoftBan && countdown > 0 && (
        <CountdownToLogout seconds={15} onComplete={handleLogout} />
      )}
    </>
  );
};

// Countdown component (invisible – just runs timer)
const CountdownToLogout = ({ seconds = 15, onComplete }) => {
  const [countdown, setCountdown] = useState(seconds);

  useEffect(() => {
    if (countdown <= 0) {
      onComplete?.();
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, onComplete]);

  return null;
};

export default SideNav;