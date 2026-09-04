import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import Illustration from '../images/LoginIllustration.svg';
import IconFacebook from '../images/icon-fb.svg';
import IconApple from '../images/icon-apple.svg';
import Logo from '../images/logo.png';
import IconMail from '../images/iconMail.svg';
import IconLock from '../images/iconLock.svg';
import IconLGoogle from '../images/iconGLogin.svg';
import { Link } from "react-router-dom";
import LogoMini from '../images/logo-mini.svg';
import { motion } from 'framer-motion';
import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'
import { ReactComponent as PasswordShow } from "../images/icon-eye.svg";
import { ReactComponent as PasswordHide } from "../images/icon-eye-hide.svg";

const SignupWithGoogle = () => {
  const [inputs, setInputs] = useState({
    email: '',
    password: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInputs((prevInputs) => ({
      ...prevInputs,
      [name]: value
    }));
  };

  const handleInputFocus = (e) => {
    const targetName = e.target.name;
    document.querySelector(`.f-label-${targetName}`).classList.add('f-up');
  };

  const handleInputBlur = (e) => {
    const { name, value } = e.target;
    const label = document.querySelector(`.f-label-${name}`);
    if (value === '') {
      label.classList.remove('f-up');
    }
  };

  const navigate = useNavigate();

  // LOGIN ANIMATION
  const [buttonClicked, setButtonClicked] = useState(false);
  const [spanExpanded, setSpanExpanded] = useState(false);

  useEffect(() => {
    if (buttonClicked) {
      const buttonTimeout = setTimeout(() => {
        setButtonClicked(false);
        navigate('/Home'); // Navigate after button animation
      }, 3000);
      return () => clearTimeout(buttonTimeout);
    }
  }, [buttonClicked, navigate]);

  useEffect(() => {
    if (spanExpanded) {
      const spanTimeout = setTimeout(() => setSpanExpanded(false), 3000);
      return () => clearTimeout(spanTimeout);
    }
  }, [spanExpanded]);

  const handleClick = (e) => {
    e.preventDefault();
    setButtonClicked(true);
    setSpanExpanded(true);
  };

  const pathVariants = {
    hidden: { pathLength: 0, fill: '' },
      animate:{
        scale: [1, 2, 2, 1, 1],
        rotate: [0, 0, 180, 180, 0],
        borderRadius: ["0%", "0%", "50%", "50%", "0%"]
      },
      transition:{
        duration: 2,
        ease: "easeInOut",
        times: [0, 0.2, 0.5, 0.8, 1],
        repeat: Infinity,
        repeatDelay: 1
      }
  };

  const [phone, setPhone] = useState('');

const [password, setPassword] = useState('');
const [showPassword, setShowPassword] = useState(false);
const togglePasswordVisibility = () => {
  setShowPassword(!showPassword);
};

  return (
    <>
      <div className='form_container'>
        <div className="login_left_col">
          <div className='login_graphic_text'>
            <h2>Upload Files</h2>
            <p>Store upto 5GB data in a centralised location for easy access and management.</p>
          </div>
          <div className='login_graphic'><img src={Illustration} className='img_responsive' /></div>
        </div>

        <div className="login_content">
          <div className="login_form">
            <div className="logo_login">
              <img src={Logo} alt="logo" />
            </div>
            <h3 className="mt-4">Create an Account</h3>
            <form>
              <div className="row custom_row">
                <div className='col-md-6 mt-3'>
                  <label className='login_label'>First Name</label>
                  <input
                    type="email"
                    className="form-control form_control"
                    placeholder='Enter first name'
                  />
                </div>

                <div className='col-md-6 mt-3'>
                  <label className='login_label'>Last Name</label>
                  <input
                    type="text"
                    className="form-control form_control"
                    placeholder='Enter last name'
                  />
                </div>
                
              </div>
              <div className="row custom_row">
                <div className='col-md-12 mt-3'>
                  <label className='login_label'>Email Address</label>
                  <input
                    type="text"
                    className="form-control form_control"
                    placeholder='Enter email address'
                  />
                  </div>
                </div>

                <div className="row custom_row">
                 <div className='col-md-12 mt-3'>
                   <label className='login_label'>Phone Number</label>
                   {/* <input
                    type="number"
                    className="form-control form_control"
                    placeholder='Enter phone number'
                  /> */}
                  <PhoneInput
                  country={'in'}
                  value={phone}
                  onChange={setPhone}
                  enableSearch={true}
                  // className="form_control"
                />
                  </div>
                </div>

                <div className="row custom_row">
                  <div className='col-md-12 mt-3'>
                    <label className='login_label'>Password</label>
                    <div className='text_field'>
                      <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      className="form-control form_control"
                      onChange={(e) => setPassword(e.target.value)} 
                      placeholder='Enter your Password'
                    />

                      <div className='icon_field' onClick={togglePasswordVisibility}>
                        {showPassword ? <PasswordShow /> : <PasswordHide />}
                      </div>
                    </div>
                    </div>
                </div>

              <div className="mt-4">
                <div className="btn_login_group">
                  <button type='button' className={`btn_login ripple_effect ${buttonClicked ? 'btn--clicked' : ''}`} onClick={handleClick}>Sign up</button>
                </div>

                <div className='have_acc mt-3'>
                 have an Account ? <Link to='#' className=''>Login</Link>
                </div>
              </div>
            </form>
            
          </div>
        </div>
      </div>

      <span className={`animate_logo animate_logo_loader ${spanExpanded ? 'expanded' : ''}`} data-value="1">
        <div className='logo__load'>
          {/* <img src={LogoMini} /> */}

          <motion.svg
              width="100%"
              height="100%"
              viewBox="0 0 168 168"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"

              className="box"
              animate={{
                scale: [1, 2, 2, 1, 1],
                rotate: [0, 0, 180, 180, 0],
                // borderRadius: ["0%", "0%", "50%", "50%", "0%"]
              }}
              transition={{
                duration: 2,
                ease: "easeInOut",
                times: [0, 0.2, 0.5, 0.8, 1],
                repeat: Infinity,
                repeatDelay: 1
              }}
            >
            <mask id="mask0_321_2" style={{maskType:'luminance'}} maskUnits="userSpaceOnUse" x="61" y="2" width="94" height="46">
              <path d="M75.2414 2.57851L73.1217 2.83041C71.1292 3.16626 67.3986 3.75399 64.7279 5.39127C49.5935 14.6692 88.892 38.8086 130.395 45.6935C161.723 50.8992 154.559 41.0336 152.185 37.759C152.143 37.717 147.988 32.0076 145.826 31.3778C138.153 40.9076 81.9395 22.4778 77.4882 9.00169C75.1142 1.82285 94.827 -1.82955 122.425 11.0168C121.323 10.471 119.839 9.75735 118.694 9.25357C117.847 8.86174 116.575 8.32998 114.879 7.65828C114.088 7.35041 112.901 6.91661 111.318 6.35685C110.555 6.10496 109.41 5.75512 107.884 5.30732C107.121 5.08341 105.948 4.77554 104.366 4.38372C103.136 4.08985 103.051 4.08985 100.635 3.58607C99.7022 3.39016 98.2891 3.15227 96.3956 2.87239C91.8171 2.28465 88.2137 2.07474 84.7799 2.07474C81.6428 2.07474 78.6752 2.28464 75.2414 2.57851Z" fill="white"/>
              </mask>
              <g mask="url(#mask0_321_2)">
              <path d="M57.8554 -30.9035L35.6146 46.9827L153.385 79.9629L175.626 2.07674L57.8554 -30.9035Z" fill="url(#paint0_linear_321_2)"/>
              </g>
              <mask id="mask1_321_2" style={{maskType:'luminance'}} maskUnits="userSpaceOnUse" x="23" y="14" width="145" height="77">
              <path d="M35.6039 17.9018C32.8907 20.0008 29.4145 22.9395 26.8709 25.1646C20.7663 31.1259 24.0729 39.8161 36.1126 49.6818C53.9601 64.3333 89.104 79.3627 121.535 86.2897C169.057 96.4072 168.167 85.1562 167.531 77.7254C167.065 71.974 166.556 71.0084 165.92 69.707C163.377 74.4929 150.362 75.3325 131.116 72.0159C77.9122 62.78 19.2401 29.6566 40.903 14.4173C39.2921 15.4249 37.2148 16.8522 35.6463 17.9437" fill="white"/>
              </mask>
              <g mask="url(#mask1_321_2)">
              <path d="M30.2819 -24.4813L-2.5141 90.3685L157.927 135.298L190.723 20.4481L30.2819 -24.4813Z" fill="url(#paint1_linear_321_2)"/>
              </g>
              <mask id="mask2_321_2" style={{maskType:'luminance'}} maskUnits="userSpaceOnUse" x="2" y="50" width="161" height="84">
              <path d="M4.69954 61.8563L3.21579 67.8597C3.17339 68.3215 3.0462 68.9932 3.00381 69.455C2.53748 84.6103 33.4421 103.838 62.3542 115.215C108.393 133.393 147.098 137.129 154.347 129.195C155.916 126.718 157.824 123.275 159.223 120.714C160.198 118.825 161.257 116.138 162.105 114.165C161.427 115.551 160.367 116.18 159.816 116.516C135.398 130.874 -2.33772 85.1561 8.76928 50.6473C7.4127 53.9218 5.80175 58.4139 4.65714 61.8144" fill="white"/>
              </mask>
              <g mask="url(#mask2_321_2)">
              <path d="M9.82565 7.9829L-25.2198 130.71L149.947 179.763L184.993 57.0362L9.82565 7.9829Z" fill="url(#paint2_linear_321_2)"/>
              </g>
              <mask id="mask3_321_2" style={{maskType:'luminance'}} maskUnits="userSpaceOnUse" x="2" y="99" width="132" height="62">
              <path d="M4.65696 106.819C5.50483 109.547 6.819 113.116 7.79405 115.761C18.2228 139.312 97.8795 166.894 119.542 159.044L121.196 158.288C125.944 155.937 126.452 155.601 132.981 151.319L133.956 150.605C115.854 162.024 11.8214 130.874 2.79169 99.0939C3.25801 101.445 4.06345 104.552 4.61456 106.861" fill="white"/>
              </mask>
              <g mask="url(#mask3_321_2)">
              <path d="M12.5055 65.0549L-15.1456 161.887L124.246 200.922L151.897 104.09L12.5055 65.0549Z" fill="url(#paint3_linear_321_2)"/>
              </g>
              <mask id="mask4_321_2" style={{maskType:'luminance'}} maskUnits="userSpaceOnUse" x="26" y="142" width="63" height="25">
              <path d="M34.4172 149.934C36.876 151.739 37.2575 151.991 41.0305 154.426C42.8534 155.517 42.9806 155.601 46.2449 157.364L46.8807 157.7C55.4017 161.982 63.0325 163.872 65.5337 164.501C66.4664 164.711 67.6958 164.963 68.6284 165.173C69.5611 165.341 70.9742 165.579 72.8677 165.887C79.6082 166.852 85.5433 166.684 88.7228 166.6C71.8927 166.684 40.9033 156.357 26.2353 142.965C29.33 145.945 29.9235 146.407 34.4172 149.976" fill="white"/>
              </mask>
              <g mask="url(#mask4_321_2)">
              <path d="M30.845 126.669L19.8976 165.006L84.1065 182.987L95.0539 144.65L30.845 126.669Z" fill="url(#paint4_linear_321_2)"/>
              </g>
              <defs>
              <linearGradient id="paint0_linear_321_2" x1="-476.235" y1="-137.495" x2="24.7938" y2="5.5763" gradientUnits="userSpaceOnUse">
              <stop stop-color="#FFF"/>
              <stop offset="0.01" stop-color="#FFF"/>
              <stop offset="0.52" stop-color="#FFF"/>
              <stop offset="1" stop-color="#FFF"/>
              </linearGradient>
              <linearGradient id="paint1_linear_321_2" x1="-485.516" y1="-104.878" x2="15.5128" y2="38.1933" gradientUnits="userSpaceOnUse">
              <stop stop-color="#FFF"/>
              <stop offset="0.01" stop-color="#FFF"/>
              <stop offset="0.52" stop-color="#FFF"/>
              <stop offset="1" stop-color="#FFF"/>
              </linearGradient>
              <linearGradient id="paint2_linear_321_2" x1="-496.297" y1="-67.2616" x2="4.73127" y2="75.8099" gradientUnits="userSpaceOnUse">
              <stop stop-color="#FFF"/>
              <stop offset="0.01" stop-color="#FFF"/>
              <stop offset="0.52" stop-color="#FFF"/>
              <stop offset="1" stop-color="#FFF"/>
              </linearGradient>
              <linearGradient id="paint3_linear_321_2" x1="-507.404" y1="-28.4041" x2="-6.37562" y2="114.667" gradientUnits="userSpaceOnUse">
              <stop stop-color="#FFF"/>
              <stop offset="0.01" stop-color="#FFF"/>
              <stop offset="0.52" stop-color="#FFF"/>
              <stop offset="1" stop-color="#FFF"/>
              </linearGradient>
              <linearGradient id="paint4_linear_321_2" x1="-513.994" y1="-5.22699" x2="-12.9655" y2="137.844" gradientUnits="userSpaceOnUse">
              <stop stop-color="#FFF"/>
              <stop offset="0.01" stop-color="#FFF"/>
              <stop offset="0.52" stop-color="#FFF"/>
              <stop offset="1" stop-color="#FFF"/>
              </linearGradient>
              </defs>
          </motion.svg>
        </div>
      </span>
    </>
  );
};

export default SignupWithGoogle;
