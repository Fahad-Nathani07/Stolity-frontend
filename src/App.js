import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Files from './pages/Files';
import AddFiles from './pages/AddFiles';
import QrCode from './pages/QrCode';
import AddQrCode from './pages/AddQrCode';
import ShortLink from './pages/ShortLink';
import TextDetect from './pages/TextDetect';
import FaceDetect from './pages/FaceDetect';
import ChangePassword from './pages/ChangePassword';
import Table from './pages/Table';
import TestPage from './pages/TestPage';
import TestLightbox from './pages/TestLightbox';
import Signup from './pages/Signup';
import SignupWithGoogle from './pages/SignupWithGoogle';
import NestedPage from './pages/NestedPage';
import Loader from './pages/Loader';
import { UploadProvider } from './pages/UploadContext';
import UploadProgressModal from './pages/UploadProgressModal';
import UserProfile from './pages/UserProfile'
import { GoogleOAuthProvider } from '@react-oauth/google';
import PreLogin from './pages/PreLogin';
import { DownloadProvider } from './pages/DownloadContext';
import { Download } from 'lucide-react';
import DownloadProgressModal from './pages/DownloadProgressModal';
import DefaultFolder from './pages/DefaultFolder';
import TermsAndConditions from './pages/TermsAndConditions';  // <-- NEW IMPORT
import PrivacyPolicy from './pages/PrivacyPolicy';  // <-- NEW IMPORT
import Favourites from './pages/Favourites';
import RecycleBin from './pages/RecycleBin';
import AudioPlayerModal from "./pages/AudioPlayerModal";
import { useSelector, useDispatch } from 'react-redux';
import { closeAudioPlayer, playNextTrack, playPrevTrack, shuffleTrack, setRepeatMode } from './store/fileSlicer';
import { buildAudioStreamUrl } from './utils/audioPlayer';
import ForgotPassword from './pages/ForgotPassword';
import SearchUsersPage from './pages/SearchUsersPage';
import HelpSupportCenter from './pages/HelpSupportCenter';
import SupportDashboard from './pages/SupportDashboard';
import FAQPage from './pages/FAQPage';
import PaymentIntegrationPage from './pages/PaymentIntegrationPage';
import { ChakraProvider } from "@chakra-ui/react";
import JobDashboard from '../src/pages/JobPortal/JobDashboard';
import CareerJobListing from "./pages/JobPortal/CareerJobListing";
import JobPortalAdmin from "./pages/JobPortal/JobPortalAdmin";
import { fetchJobPortalByEmail } from './store/jobPortalSlice';
import { fetchUserSubscription, fetchUserFolderSize } from './store/subscriptionSlice';
import { fetchFavoriteFiles } from './store/favoritesSlice';
import { fetchCurrentUserByEmail } from "./store/usersAdminSlice";
import { ToastRoot } from './components/ToastProvider';
import { motion } from "framer-motion";
import NewLogo from "./images/NewLogo.svg";
import InactivityHandler from './components/InactivityHandler';
import StorageWarningModal from './components/StorageWarningModal';
import PrivateRoute from './components/PrivateRoute';








const App = () => {

  const ComingSoon = () => (
    <div style={{ padding: "20px", fontSize: "18px" }}>
      🚧 Coming Soon
    </div>
  );



  const clientid = process.env.REACT_APP_GOOGLE_AUTH_CLIENT_ID;
  const apiUrl = process.env.REACT_APP_API_ENDPOINT;
  const token = sessionStorage.getItem("number");
  const isLoggedIn = Boolean(sessionStorage.getItem("email"));
  const dispatch = useDispatch();
const {
  showAudioPlayer,
  currentAudioFile,
  isShuffleEnabled,
  repeatMode,
  audioQueue,
  currentTrackIndex,
} = useSelector((state) => state.getdata);
  const isSharedValue = useSelector((state) => state.getdata.isSharedValue);
  const filenameRedux = useSelector((state) => state.getdata.fileName);
  const [spanExpanded, setSpanExpanded] = useState(false);


  

  



  const clientId = clientid; // <-- Replace this with your actual client ID

    const email = sessionStorage.getItem("email");
    
    useEffect(() => {
      if (email) {
        dispatch(fetchJobPortalByEmail({ email }));
      }
    }, [dispatch, email]);

    useEffect(() => {
      // const email = sessionStorage.getItem("email"); // or from auth
      if (email) {
        dispatch(fetchCurrentUserByEmail(email));
        console.log("mmmmm fetchCurrentUserByEmail executed")
      }
    }, [dispatch, email]);

    useEffect(() => {
      if (token) {
        dispatch(fetchUserSubscription({ token }));
        dispatch(fetchUserFolderSize({ token }));
        dispatch(fetchFavoriteFiles({ token }));
      }
    }, [token, dispatch, email]);
  
  return (
    <GoogleOAuthProvider clientId={clientId}>
     
      <UploadProvider>
      <DownloadProvider>
        <Router basename="/">
      <InactivityHandler />
      <StorageWarningModal />
      <ToastRoot />
        {/* <Router basename="/file-system">   */}

       <div
          className={`animate_logo animate_logo_loader ${
            spanExpanded ? "expanded" : ""
          }`}
          data-value="1"
          style={{
            position: "fixed",      // ✅ important
            // inset: 0,               // ✅ full screen
            // width: "100vw",
            // height: "100vh",
            zIndex: 99999,          // ✅ higher than sidebar/header/footer
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: `conic-gradient(
              from 0deg at 50% 50%,
              #E5252A 0deg,
              #E7400C 120deg,
              #FFAB49 240deg,
              #E5252A 360deg
            )`,
            pointerEvents: spanExpanded ? "all" : "none", // optional
          }}
        >
        <div className="logo__load" style={{width:"100px", height:"100px"}}>
          <motion.img
            src={NewLogo}
            alt="Logo"
            style={{
              width: "90px",
              height: "90px",
              filter: "brightness(0) invert(1)"
            }}
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 360],
            }}
            transition={{
              duration: 2,
              ease: "easeInOut",
              repeat: Infinity,
              repeatDelay: 1,
            }}
          />
        </div>
      </div>
       
      
          <UploadProgressModal />
          <DownloadProgressModal />
            <Routes>
              {/* Public routes */}
              <Route path="/Login" element={<Login spanExpanded={spanExpanded} setSpanExpanded={setSpanExpanded} />} />
              <Route path="/Signup" element={<Signup />} />
              <Route path="/ForgotPassword" element={<ForgotPassword />} />
              <Route path="/SignupWithGoogle" element={<SignupWithGoogle />} />
              <Route path="/pre-login" element={<PreLogin />} />
              <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/:companySlug/careers" element={<CareerJobListing />} />
              <Route path="/" element={<PreLogin />} />

              {/* Protected routes — require sessionStorage email */}
              <Route element={<PrivateRoute />}>
                <Route path="/SearchUsersPage" element={<SearchUsersPage />} />
                <Route path="/Files" element={<Files setSpanExpanded={setSpanExpanded} />} />
                <Route path="/Favourites" element={<Favourites />} />
                <Route path="/Bin" element={<RecycleBin />} />
                <Route path="/AddFiles" element={<AddFiles />} />
                <Route path="/QrCode" element={<QrCode />} />
                <Route path="/AddQrCode" element={<AddQrCode />} />
                <Route path="/ShortLink" element={<ShortLink />} />
                <Route path="/TextDetect" element={<TextDetect />} />
                <Route path="/FaceDetect" element={<FaceDetect />} />
                <Route path="/ChangePassword" element={<ChangePassword />} />
                <Route path="/Table" element={<Table />} />
                <Route path="/TestPage" element={<TestPage />} />
                <Route path="/TestLightbox" element={<TestLightbox />} />
                <Route path="/UserProfile" element={<UserProfile />} />
                <Route path="/nested/:folderId" element={<NestedPage />} />
                <Route path="/folder/:folderName" element={<DefaultFolder />} />
                <Route path="/Loader" element={<Loader />} />
                <Route path="/JobPortal" element={<JobDashboard />} />
                <Route path="/HelpSupportCenter" element={<HelpSupportCenter />} />
                <Route path="/SupportDashboard" element={<SupportDashboard />} />
                <Route path="/FAQPage" element={<FAQPage />} />
                <Route path="/Payment" element={<PaymentIntegrationPage />} />
                <Route path="/JobPortalAdmin" element={<JobPortalAdmin />} />
              </Route>
            </Routes>
          </Router>

          {/* {showAudioPlayer && (
            <AudioPlayerModal
              audioSrc={`${apiUrl}getFileDefault?token=${token}&filePath=${currentAudioFile}`}
              fileName={currentAudioFile}
              onClose={() => dispatch(closeAudioPlayer())}
              onNext={() => dispatch(playNextTrack())}
              onPrev={() => dispatch(playPrevTrack())}
            />
          )} */}
          {isLoggedIn && showAudioPlayer && currentAudioFile && (
            <AudioPlayerModal
              audioSrc={buildAudioStreamUrl(apiUrl, token, currentAudioFile, {
                shared: isSharedValue,
                sharedName: filenameRedux,
              })}
              nextAudioSrc={
                audioQueue.length > 1
                  ? buildAudioStreamUrl(
                      apiUrl,
                      token,
                      audioQueue[(currentTrackIndex + 1) % audioQueue.length],
                      { shared: isSharedValue, sharedName: filenameRedux }
                    )
                  : null
              }
              fileName={currentAudioFile}
              onClose={() => dispatch(closeAudioPlayer())}
              onNext={() => dispatch(playNextTrack())}
              onPrev={() => dispatch(playPrevTrack())}
              onShuffle={() => dispatch(shuffleTrack())}
              isShuffleEnabled={isShuffleEnabled}
              repeatMode={repeatMode}
              onSetRepeatMode={(mode) => dispatch(setRepeatMode(mode))}
            />
          )}



      </DownloadProvider>
      </UploadProvider>

    </GoogleOAuthProvider>
  );
};


export default App;
