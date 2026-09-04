import React, { useState } from 'react';
import Logo from '../images/logo.png';
import axios from 'axios'
import SideNav from '../components/SideNav';
import Footer from '../components/Footer';
import ToggleNav from '../components/ToggleNav';
import { ChakraProvider,  Stack, useToast } from '@chakra-ui/react';

import { FaCheckCircle } from "react-icons/fa"; //<FaCheckCircle />
import { BsXCircleFill } from "react-icons/bs"; // <BsXCircleFill />
import { IoIosInformationCircle } from "react-icons/io"; // <IoIosInformationCircle />
import { FaExclamationTriangle } from "react-icons/fa"; // <FaExclamationTriangle />



const ChangePassword = () => {
  const apiUrl = process.env.REACT_APP_API_ENDPOINT;
  const email = sessionStorage.getItem("email");
  const token = sessionStorage.getItem("number");
  const [oldPass,setOldPass]=useState("")
  const [newPass,setNewPass]=useState("")
  const [confirmPass,setConfirmPass]=useState("")
  
  const handleConfirmPassChange = (e) =>{
    setConfirmPass(e.target.value)
  }

  const handleNewPassChange =(e)=>{
    setNewPass(e.target.value)
  }

  const handleOldPassChange = (e) =>{
    setOldPass(e.target.value)
  }

  const handlePassWordChange = async() =>{
    const res = await axios.post(
      `${apiUrl}change-password`,
      {
        email:email,
        oldPassword:oldPass,
        newPassword:newPass,
        confirmNewPassword:confirmPass
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    showToast('success',"Password is changed!")
  }

  const handleReset = () =>{
    setConfirmPass("")
    setNewPass("");
    setOldPass("");
  }

  const toast = useToast();


  const iconMap = {
   success: FaCheckCircle,
   error: BsXCircleFill,
   info: IoIosInformationCircle,
   warning: FaExclamationTriangle,
 };
 
 
 const getStatusColors = (status) => {
   return {
     bg: 'rgba(255, 255, 255, 0.85)',     // Clean white glass
     border: status === 'success' ? 'rgba(16, 185, 129, 0.3)' :
             status === 'error' ? 'rgba(239, 68, 68, 0.3)' :
             status === 'info' ? 'rgba(59, 130, 246, 0.3)' :
             'rgba(245, 158, 11, 0.3)',        // Status-colored border
     icon: status === 'success' ? '#10b981' :
           status === 'error' ? '#ef4444' :
           status === 'info' ? '#3b82f6' :
           '#f59e0b'
   };
 };
 
 
 
 const showToast = (status, message) => {
   const IconComponent = iconMap[status];
   const colors = getStatusColors(status);
   
   toast({
     // position: 'bottom-center',
     position: 'bottom-right',
     duration: 4000,
     isClosable: true,
     render: () => (
       <div className="premium-toast" style={{
         background: `linear-gradient(135deg, ${colors.bg}, rgba(255,255,255,0.9))`,
         backdropFilter: 'blur(20px)',
         border: `2px solid ${colors.border}`,
         borderRadius: '16px',
         boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.05)',
         padding: '20px',
         maxWidth: '720px',
         fontFamily: "'SF Pro', 'SFProText', -apple-system, BlinkMacSystemFont, sans-serif",
         animation: 'toastSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
       }}>
         <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
           <IconComponent 
             style={{ 
               width: '24px', 
               height: '24px', 
               color: colors.icon,
               flexShrink: 0,
               marginTop: '2px'
             }} 
           />
           <div style={{ flex: 1, minWidth: 0 }}>
             <div style={{
               fontSize: '14px',
               fontWeight: '600',
               color: '#1f2937',
               marginBottom: '4px',
               lineHeight: '1.3'
             }}>
               {status.charAt(0).toUpperCase() + status.slice(1)}
             </div>
             <div style={{
               fontSize: '14px',
               color: '#6b7280',
               lineHeight: '1.4'
             }}>
               {message}
             </div>
           </div>
           <button 
             style={{
               background: 'none',
               border: 'none',
               padding: '4px',
               cursor: 'pointer',
               color: '#9ca3af',
               borderRadius: '4px',
               opacity: 0.7,
               transition: 'all 0.2s'
             }}
             onClick={() => toast.closeAll()}
             onMouseEnter={(e) => e.target.style.opacity = 1}
             onMouseLeave={(e) => e.target.style.opacity = 0.7}
           >
             ✕
           </button>
         </div>
       </div>
     ),
   });
 };


  return (
    <>
    <ChakraProvider>
                
    </ChakraProvider>
    <SideNav />
    <div className="container-fluid page-body-wrapper">

    <nav className="navbar p-0 fixed-top d-flex flex-row">
        <div className="navbar-brand-wrapper d-flex d-lg-none align-items-center justify-content-center">
          <a className="navbar-brand brand-logo-mini" href="#"><img src={Logo} alt="logo" /></a>
          </div>
          <div className="navbar-menu-wrapper flex-grow d-flex align-items-stretch">
          <ToggleNav />
          <div className="navbar-nav page_title">
              <h1>Change Password</h1>
          </div>        
        </div>
    </nav>
    {/* partial */}
    <div className="main-panel">
        <div className="content-wrapper">
          <div className='card_view'>          
            <div style={{maxWidth:560}}>
              <div className='mb-4'>
                  <h5 className='card_title'>Old Password</h5>
                  <div class="form__linput">
                      <input value={oldPass} onChange={handleOldPassChange} class="form__input" type="password" name="opassword" id="opassword" pattern="\w{1,}" required />
                      <label class="form__label" for="opassword">Enter Old Password</label>
                  </div>
              </div>
              <div className='mb-4'>
                  <h5 className='card_title'>New Password</h5>
                  <div class="form__linput">
                      <input value={newPass} onChange={handleNewPassChange} class="form__input" type="password" name="npassword" id="npassword" pattern="\w{1,}" required />
                      <label class="form__label" for="npassword">Enter New Password</label>
                  </div>
              </div>
              <div className='mb-4'>
                  <h5 className='card_title'>Confirm Password</h5>
                  <div class="form__linput">
                      <input value={confirmPass} onChange={handleConfirmPassChange} class="form__input" type="password" name="cpassword" id="cpassword" pattern="\w{1,}" required />
                      <label class="form__label" for="cpassword">Enter Confirm Password</label>
                  </div>
              </div>
              <div className='btn_group mt-4'>
                <button onClick={handleReset} className='btn_back btn_width_same btn_grey_ripple ripple_effect'>Reset</button>
                <button onClick={handlePassWordChange} className='btn_gradient btn_width_same btn_red_ripple ripple_effect'>Submit</button>
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

export default ChangePassword