import React, { useState } from 'react';
import Logo from '../images/logo.png';
import axios from 'axios'
import SideNav from '../components/SideNav';
import Footer from '../components/Footer';
import ToggleNav from '../components/ToggleNav';


import { showToast } from "../components/ToastProvider";



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