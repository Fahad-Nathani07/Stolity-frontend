import React from 'react';
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



const App = () => {

  const clientid = process.env.REACT_APP_GOOGLE_AUTH_CLIENT_ID;

  const clientId = clientid; // <-- Replace this with your actual client ID
  
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <UploadProvider>
      <DownloadProvider>
        <Router basename="/">
        {/* <Router basename="/file-system">   */}
       
      
          <UploadProgressModal />
          <DownloadProgressModal />
            <Routes>
              {/* Specific routes first */}
              <Route path="/Login" element={<Login />} />
              <Route path="/Files" element={<Files />} />
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
              <Route path="/Signup" element={<Signup />} />
              <Route path="/SignupWithGoogle" element={<SignupWithGoogle />} />
              <Route path="/UserProfile" element={<UserProfile />} />
              <Route path="/nested/:folderId" element={<NestedPage />} />
              <Route path="/folder/:folderName" element={<DefaultFolder />} />
              <Route path="/Loader" element={<Loader />} />
              <Route path="/pre-login" element={<PreLogin />} />
              
              {/* Home/root route */}
              <Route path="/" element={<PreLogin />} />
              
              {/* Catch-all route - must be last */}
              {/* <Route path="*" element={<PreLogin />} /> */}
            </Routes>
          </Router>
      </DownloadProvider>
      </UploadProvider>
    </GoogleOAuthProvider>
  );
};

export default App;
