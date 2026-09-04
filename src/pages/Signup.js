import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CustomGoogleAuthButton from "../components/CustomGoogleAuthButton";

import Illustration from "../images/Illustration.svg";
import IconFacebook from "../images/icon-fb.svg";
import IconApple from "../images/icon-apple.svg";
import Logo from "../images/logo.png";
import LogoStolity from "../images/prelogin-img/logo-stolity.svg";
import IconMail from "../images/iconMail.svg";
import IconLock from "../images/iconLock.svg";
import IconLGoogle from "../images/iconGLogin.svg";
import { Link } from "react-router-dom";
import LogoMini from "../images/logo-mini.svg";
import NewLogo from "../images/NewLogo.svg";
import { motion } from "framer-motion";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { ReactComponent as PasswordShow } from "../images/icon-eye.svg";
import { ReactComponent as PasswordHide } from "../images/icon-eye-hide.svg";
import protectionIcon from "../images/protectionIcon.svg";
import axios from "axios";
import { FaCheckCircle, FaArrowLeft } from "react-icons/fa"; //<FaCheckCircle />
import { BsXCircleFill } from "react-icons/bs"; // <BsXCircleFill />
import { IoIosInformationCircle } from "react-icons/io"; // <IoIosInformationCircle />
import { FaExclamationTriangle } from "react-icons/fa"; // <FaExclamationTriangle />

import {
  background,
  ChakraProvider,
  position,
  Stack,
  useToast,
} from "@chakra-ui/react";

const Signup = () => {
  const apiUrl = process.env.REACT_APP_API_ENDPOINT;
  const token = sessionStorage.getItem("number");

  // Multi-step state
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Complete Signup
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoggingIn, setIsGoogleLoggingIn] = useState(false);

  const navigate = useNavigate();
  const toast = useToast();

  // LOGIN ANIMATION
  const [buttonClicked, setButtonClicked] = useState(false);
  const [spanExpanded, setSpanExpanded] = useState(false);
  const [resendTimer, setResendTimer] = useState(0); // In seconds, start at 0

  // Password validation states
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);

  

  const validatePassword = (pwd) => {
    setPasswordStrength({
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd),
    });
  };

  useEffect(() => {
  let timerInterval = null;
  if (resendTimer > 0) {
    timerInterval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
  }
  return () => clearInterval(timerInterval);
}, [resendTimer]);



  // Utility masking function
function maskEmail(email) {
  if (!email) return "";
  const [user, domain] = email.split("@");
  // Keep first character of user, then 'xxx', then first part of domain (before .)
  const maskedUser = user ? user[0] + "xxx" : "";
  const domainPart = domain ? domain.split(".")[0] : "";
  return maskedUser + domainPart + ".com";
}

  useEffect(() => {
    if (buttonClicked) {
      const buttonTimeout = setTimeout(() => {
        setButtonClicked(false);
        navigate("/login");
      }, 1500);
      return () => clearTimeout(buttonTimeout);
    }
  }, [buttonClicked, navigate]);

  useEffect(() => {
    if (spanExpanded) {
      const spanTimeout = setTimeout(() => setSpanExpanded(false), 1500);
      return () => clearTimeout(spanTimeout);
    }
  }, [spanExpanded]);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword((prev) => !prev);
  };

 
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

  // STEP 1: Send OTP to Email
  const handleSendOtp = async (e) => {
    e.preventDefault();

    if (!email) {
      showToast("error", "Please enter your email address");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(
        `${apiUrl}register-otp`,
        { email },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("OTP sent response:", response.data);
      showToast("success", "OTP sent to your email!");
      setStep(2); // Move to OTP verification step
    } catch (error) {
      console.error("Error sending OTP:", error);
      showToast("error", error.response?.data?.message || "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (!otp) {
      showToast("error", "Please enter the OTP");
      return;
    }

    showToast("success", "Proceeding to complete signup...");
    // showToast("success", "OTP verified! Complete your signup");
    setStep(3); // Move to final signup step
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(
        `${apiUrl}register-otp`,
        { email },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("OTP resent:", response.data);
      showToast("success", "OTP resent to your email!");
    } catch (error) {
      console.error("Error resending OTP:", error);
      showToast("error", "Failed to resend OTP");
    } finally {
      setIsLoading(false);
      setResendTimer(30); // Start 30s timer after resend
    }
  };

  // STEP 3: Complete Signup with verified email
  const handleCompleteSignup = async (e) => {
    e.preventDefault();

    if (!name || !password || !confirmPassword) {
      showToast("error", "Please fill out all fields.");
      return;
    }

    if (password !== confirmPassword) {
      showToast("error", "Passwords do not match.");
      return;
    }

    setButtonClicked(true);
    setSpanExpanded(true);
    setIsLoading(true);

    try {
      const res = await axios.post(
        `${apiUrl}verified-register-user`,
        {
          name: name,
          email: email,
          password: password,
          confirmPassword: confirmPassword,
          otp: otp,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      console.log(res.data);
      showToast("success", "Account has been created successfully!");
    } catch (error) {
      console.error("Error creating account:", error);
      showToast("error", error.response?.data?.message || "Error creating account!");
      setIsLoading(false);
    }
  };

  const handleSignUpSuccess = async (response) => {
    if (isGoogleLoggingIn) return;
    if (!response?.credential) {
      showToast("error", "Google Sign-In failed. Please try again.");
      return;
    }

    setIsGoogleLoggingIn(true);
    setSpanExpanded(true);

    try {
      const res = await axios.post(
        `${apiUrl}firebaseAuth`,
        { googleToken: response.credential },
        { withCredentials: true }
      );
      const data = res.data;

      if (!data?.accessToken || !data?.userData) {
        throw new Error(data?.message || "Authentication failed. Please try again.");
      }

      showToast("success", data.message || "Signed in successfully");
      sessionStorage.setItem("userData", JSON.stringify(data.userData));
      sessionStorage.setItem("number", data.accessToken.toString());
      sessionStorage.setItem("email", data.userData.email.toString());
      if (data.loginId) {
        sessionStorage.setItem("userId", data.loginId.toString());
      }
      navigate("/Files");
    } catch (error) {
      setSpanExpanded(false);
      const apiMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Authentication failed. Please try again.";
      showToast("error", apiMsg);
    } finally {
      setIsGoogleLoggingIn(false);
    }
  };

  const handleFailure = () => {
    showToast("error", "Google Sign-In Failed. Please try again.");
  };

  const handleBack = () => {
    if (step === 1) {
      navigate("/login");
      return;
    }
    if (step === 2) {
      setOtp("");
      setStep(1);
      return;
    }
    if (step === 3) {
      setStep(2);
    }
  };

  // Render different steps
  const renderStepContent = () => {
    // STEP 1: Email Input
    if (step === 1) {
      return (
        <>
          <h3 className="mt-4">Create an Account</h3>
          <p style={{ color: "#666", marginBottom: "20px" }}>
            Enter your email to get started
          </p>
          <form onSubmit={handleSendOtp} autoComplete="off">
            <div className="row custom_row">
              <div className="col-md-12 mt-3">
                <label className="login_label">Email Address</label>
                <input
                  type="email"
                  className="form-control form_control"
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="mt-4">
              <button
                type="submit"
                className="btn_login ripple_effect"
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Send OTP"}
              </button>

              <div className="have_acc mt-3">
                Already have an Account?{" "}
                <Link to="/login" style={{ color: "#E94545" }}>
                  Login
                </Link>
              </div>
            </div>
          </form>
        </>
      );
    }

    // STEP 2: OTP Verification
  // STEP 2: OTP Verification
if (step === 2) {
  return (
    <>
      <h3 className="mt-4">Verify Your Email</h3>
      <p style={{ color: "#666", marginBottom: "20px", fontSize: "14px" }}>
        Enter the OTP sent to <strong>{email}</strong>
      </p>
      <form onSubmit={handleVerifyOtp} autoComplete="off">
        <div className="row custom_row">
          <div style={{
  display: 'flex',
  alignItems: 'center',
  background: '#FFF6EE',
  borderRadius: '16px',
  padding: '18px 20px',
  marginTop: '20px',
  width: "100%"
}}>
  <div style={{margin:"0px 10px 0 0"}}>
     <img src={protectionIcon} className="img_responsive" alt="Illustration" />
    
   
  </div>
  <div style={{textAlign: "left"}}>
    <span style={{ color: '#FFAB49', fontWeight: 600, fontSize: '18px' }}>Enter the 6-digit code</span><br />
    <span style={{ color: '#494949', fontSize: '15px' }}>
  sent to your <b>{maskEmail(email)}</b>
</span> 
  </div>
</div>

        </div>

        <div className="row custom_row">
          <div className="col-md-12 mt-3">
            <label className="login_label" style={{ marginBottom: "15px" }}>
              Enter OTP
            </label>
           <div
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
    marginTop: "10px",
  }}
>
  {[0, 1, 2, 3, 4, 5].map((index) => (
    <input
      key={index}
      id={`otp-input-${index}`}
      type="text"
      maxLength="1"
      value={otp[index] || ""}
      onChange={(e) => {
        const value = e.target.value;
        if (value.match(/^[0-9]$/)) {
          const newOtp = otp.split("");
          newOtp[index] = value;
          setOtp(newOtp.join(""));
          // Auto-focus next input
          if (index < 5) {
            document.getElementById(`otp-input-${index + 1}`).focus();
          }
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Backspace") {
          const newOtp = otp.split("");
          if (newOtp[index]) {
            newOtp[index] = "";
            setOtp(newOtp.join(""));
          } else if (index > 0) {
            document.getElementById(`otp-input-${index - 1}`).focus();
          }
        }
      }}
      onPaste={(e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").slice(0, 6);
        if (pastedData.match(/^[0-9]+$/)) {
          setOtp(pastedData.padEnd(6, ""));
          const lastIndex = Math.min(pastedData.length, 5);
          document.getElementById(`otp-input-${lastIndex}`).focus();
        }
      }}
      style={{
        width: "50px",
        height: "55px",
        textAlign: "center",
        fontSize: "24px",
        fontWeight: "700",
        border: "2px solid #E5E5E5",
        borderRadius: "12px",
        outline: "none",
        transition: "all 0.3s ease",
        backgroundColor: "#FFFFFF",
        color: "#212121",
        letterSpacing: "2px",
      }}
      onFocus={(e) => {
        e.target.style.borderColor = "#FFAB49";
        e.target.style.backgroundColor = "#FFF9F0";
        e.target.style.transform = "scale(1.05)";
        e.target.style.boxShadow = "0 4px 12px rgba(255, 171, 73, 0.15)";
      }}
      onBlur={(e) => {
        e.target.style.borderColor = "#E5E5E5";
        e.target.style.backgroundColor = "#FFFFFF";
        e.target.style.transform = "scale(1)";
        e.target.style.boxShadow = "none";
      }}
      autoComplete="off"
    />
  ))}
</div>

          </div>
        </div>

        <div className="mt-4">
          <button
            type="submit"
            className="btn_login ripple_effect"
            disabled={isLoading}
            style={{
              background: "linear-gradient(135deg, #FFAB49 0%, #FF8C42 100%)",
              border: "none",
              boxShadow: "0 4px 15px rgba(255, 171, 73, 0.3)",
            }}
          >
            {isLoading ? "Verifying..." : "Verify OTP"}
          </button>

          {/* <div className="mt-3 text-center">
            <span style={{ color: "#666", fontSize: "14px" }}>
              Didn't receive OTP?{" "}
            </span>
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={isLoading}
              style={{
                color: "#FFAB49",
                background: "none",
                border: "none",
                textDecoration: "underline",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "14px",
              }}
            >
              Resend OTP
            </button>
          </div> */}
          <div className="mt-3 text-center">
  <span style={{ color: "#666", fontSize: "14px" }}>
    Didn't receive OTP?{" "}
  </span>
  {resendTimer > 0 ? (
    <button
      type="button"
      disabled
      style={{
        color: "#AAA",
        background: "none",
        border: "none",
        textDecoration: "underline",
        cursor: "not-allowed",
        fontWeight: "600",
        fontSize: "14px",
      }}
    >
      Resend Code in <span style={{color:"#E94545"}}> {resendTimer}s </span>
    </button>
  ) : (
    <button
      type="button"
      onClick={handleResendOtp}
      style={{
        color: "#FFAB49",
        background: "none",
        border: "none",
        textDecoration: "underline",
        cursor: "pointer",
        fontWeight: "600",
        fontSize: "14px",
      }}
    >
      Resend OTP
    </button>
  )}
</div>

        </div>
      </form>
    </>
  );
}

   


    // STEP 3: Complete Signup Form
    if (step === 3) {
  return (
    <>
      <h3 className="mt-4">Create an Account</h3>
      <form autoComplete="off">

        {/* Full Name */}
        <div className="row custom_row">
          <div className="col-md-12 mt-3">
            <label className="login_label">Full Name</label>
            <input
              type="text"
              className="form-control form_control"
              placeholder="Enter full name"
              value={name}
              onChange={(e) => setName(e.target.value.trim())}
              autoComplete="off"
              name="fullname"
            />
          </div>
        </div>

        {/* Email (disabled) */}
        <div className="row custom_row">
          <div className="col-md-12 mt-3">
            <label className="login_label">Email Address</label>
            <input
              type="email"
              className="form-control form_control"
              value={email}
              disabled
              style={{ backgroundColor: "#f5f5f5", cursor: "not-allowed" }}
              autoComplete="off"
            />
          </div>
        </div>

        {/* Password */}
        <div className="row custom_row">
          <div className="col-md-12 mt-3">
            <label className="login_label">Password</label>
            <div className="text_field">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                className="form-control form_control"
                onChange={(e) => {
                  const val = e.target.value;
                  setPassword(val);
                  validatePassword(val);
                  setPasswordTouched(true);
                }}
                onFocus={() => setPasswordTouched(true)}
                onBlur={() => setPasswordTouched(true)} // keep visible briefly after blur
                placeholder="Enter your Password"
                autoComplete="new-password"
                name="new-password"
              />
              <div className="icon_field" onClick={togglePasswordVisibility}>
                {showPassword ? <PasswordShow /> : <PasswordHide />}
              </div>
            </div>

            {/* Password strength feedback */}
           {passwordTouched && password && (
  <div 
    className="password-requirements mt-2" 
    style={{ 
      fontSize: "0.88rem",
      color: "#4b5563",
      padding: "8px 12px",
      background: "rgba(243, 244, 246, 0.5)",
      borderRadius: "6px",
      marginTop: "6px",
    }}
  >
    <div 
      style={{ 
        display: "flex", 
        flexWrap: "wrap", 
        gap: "16px 32px",
        justifyContent: "space-between"
      }}
    >
      {/* Left column - 3 items */}
      <div style={{ flex: "1", minWidth: "160px" }}>
        <div style={{ 
          marginBottom: "4px", 
          color: passwordStrength.length ? "#10b981" : "#6b7280",
          textAlign: "left"
        }}>
          {passwordStrength.length ? "✔" : "•"} At least 8 characters
        </div>
        <div style={{ 
          marginBottom: "4px", 
          color: passwordStrength.uppercase ? "#10b981" : "#6b7280",
          textAlign: "left"
        }}>
          {passwordStrength.uppercase ? "✔" : "•"} At least one uppercase
        </div>
        <div style={{ 
          color: passwordStrength.lowercase ? "#10b981" : "#6b7280",
          textAlign: "left"
        }}>
          {passwordStrength.lowercase ? "✔" : "•"} At least one lowercase
        </div>
      </div>

      {/* Right column - 2 items */}
      <div style={{ flex: "1", minWidth: "160px" }}>
        <div style={{ 
          marginBottom: "4px", 
          color: passwordStrength.number ? "#10b981" : "#6b7280",
          textAlign: "left"
        }}>
          {passwordStrength.number ? "✔" : "•"} At least one number
        </div>
        <div style={{ 
          color: passwordStrength.special ? "#10b981" : "#6b7280",
          textAlign: "left"
        }}>
          {passwordStrength.special ? "✔" : "•"} At least one special char
        </div>
      </div>
    </div>
  </div>
)}
          </div>
        </div>

        {/* Confirm Password */}
        <div className="row custom_row">
          <div className="col-md-12 mt-3">
            <label className="login_label">Confirm Password</label>
            <div className="text_field">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                className="form-control form_control"
                onChange={(e) => {
                  const val = e.target.value;
                  setConfirmPassword(val);
                  setConfirmTouched(true);

                  if (val && val !== password) {
                    setConfirmPasswordError("Passwords do not match");
                  } else {
                    setConfirmPasswordError("");
                  }
                }}
                onBlur={() => confirmPassword && setConfirmTouched(true)}
                placeholder="Confirm your Password"
                autoComplete="new-password"
                name="confirm-password"
              />
              <div
                className="icon_field"
                onClick={toggleConfirmPasswordVisibility}
              >
                {showConfirmPassword ? <PasswordShow /> : <PasswordHide />}
              </div>
            </div>

            {/* Confirm password error */}
            {confirmTouched && confirmPasswordError && (
              <div className="error-message mt-1" style={{ color: "#ef4444", fontSize: "0.875rem" }}>
                {confirmPasswordError}
              </div>
            )}
          </div>
        </div>

        {/* Terms + Button + Google + Login link */}
        <div className="mt-4">
          <div
            className="btn_login_group"
            style={{
              flexDirection: "column",
              alignItems: "flex-start",
              gap: "0.75rem",
            }}
          >
            <div
              style={{
                marginBottom: "16px",
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                flexWrap: "wrap",
                width: "100%",
              }}
            >
              <input
                type="checkbox"
                id="termsCheckbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                style={{
                  width: "20px",
                  height: "20px",
                  marginTop: "4px",
                  flexShrink: 0,
                  accentColor: "#FFAB49",
                  cursor: "pointer",
                }}
              />
              <label
                htmlFor="termsCheckbox"
                style={{
                  fontSize: "1rem",
                  color: "#212121",
                  lineHeight: "1.4",
                  userSelect: "none",
                  wordBreak: "break-word",
                  margin: 0,
                  cursor: "pointer",
                  width: "calc(100% - 40px)",
                }}
              >
                I agree to the{" "}
                <Link
                  to="/terms-and-conditions"
                  rel="noopener noreferrer"
                  style={{
                    color: "#e50000",
                    textDecoration: "underline",
                    wordBreak: "break-word",
                  }}
                >
                  Terms and Conditions
                </Link>{" "}
                and{" "}
                <Link
                  to="/privacy-policy"
                  rel="noopener noreferrer"
                  style={{
                    color: "#e50000",
                    textDecoration: "underline !important",
                    wordBreak: "break-word",
                  }}
                >
                  Privacy Policy
                </Link>
                .
              </label>
            </div>

            <button
              type="button"
              className={`btn_login ripple_effect ${buttonClicked ? "btn--clicked" : ""}`}
              onClick={handleCompleteSignup}
              disabled={
                !agreed ||
                isLoading ||
                !name.trim() ||
                !password.trim() ||
                !confirmPassword.trim() ||
                !passwordStrength.length ||
                !passwordStrength.uppercase ||
                !passwordStrength.lowercase ||
                !passwordStrength.number ||
                !passwordStrength.special ||
                password !== confirmPassword
              }
            >
              {isLoading ? "Creating Account..." : "Sign up"}
            </button>
          </div>

          <div className="divider">
            <span>OR</span>
          </div>

          <div className="stolity-google-login">
            <CustomGoogleAuthButton
              onSuccess={handleSignUpSuccess}
              onError={handleFailure}
              label="Sign up with Google"
              text="signup_with"
              disabled={!agreed || isGoogleLoggingIn}
            />
          </div>

          <div className="have_acc mt-3">
            Already have an Account?{" "}
            <Link to="/login" style={{ color: "#E94545" }}>
              Login
            </Link>
          </div>
        </div>
      </form>
    </>
  );
}
  };

  return (
    <>
      <ChakraProvider />
      <div className="form_container">
        <button
          type="button"
          className="login-back-btn"
          onClick={handleBack}
          aria-label={step === 1 ? "Back to login" : "Back to previous step"}
        >
          <FaArrowLeft />
          <span>Back</span>
        </button>

        <div className="login_left_col">
          <div className="login_graphic_text">
            <h2>Upload Files</h2>
            <p>
              Store upto 5GB data in a centralised location for easy access and
              management.
            </p>
          </div>
          <div className="login_graphic">
            <img src={Illustration} className="img_responsive" alt="Illustration" />
          </div>
        </div>

        <div className="login_content">
          <div className="login_form">
            <div className="logo_login">
              <img src={LogoStolity} alt="logo" style={{ height: "50px" }} />
            </div>
            {renderStepContent()}
          </div>
        </div>
      </div>

      <span
        className={`animate_logo animate_logo_loader ${
          spanExpanded ? "expanded" : ""
        }`}
        data-value="1"
        style={{
          background: `conic-gradient(from 0deg at 50% 50%, #E5252A 0deg, #E7400C 120deg, #FFAB49 240deg, #E5252A 360deg)`,
        }}
      >
        <div className="logo__load" style={{ width: "100px", height: "100px" }}>
          <motion.img
            src={NewLogo}
            alt="Logo"
            style={{
              width: "90px",
              height: "90px",
              filter: "brightness(0) invert(1)",
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
      </span>
    </>
  );
};

export default Signup;
