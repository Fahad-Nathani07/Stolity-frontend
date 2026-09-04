// ForgotPassword.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// Note: Google imports remain because you asked to keep the file structure same.
// They are unused here but harmless to keep for parity with Signup.
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";

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
import axios from "axios";
import protectionIcon from "../images/protectionIcon.svg";

import { FaCheckCircle } from "react-icons/fa"; //<FaCheckCircle />
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

const ForgotPassword = () => {
  const apiUrl = process.env.REACT_APP_API_ENDPOINT;
  // token/session data not needed here, but kept for parity
  const token = sessionStorage.getItem("number");

  // Multi-step state
  const [step, setStep] = useState(1); // 1: Request OTP (email), 2: Verify OTP, 3: Reset Password, 4: Done
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(""); // will hold 6-digit string
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const toast = useToast();

  // animation states (kept same as Signup)
  const [buttonClicked, setButtonClicked] = useState(false);
  const [spanExpanded, setSpanExpanded] = useState(false);
  const [resendTimer, setResendTimer] = useState(0); // in seconds

  // Add these states (same names as signup page for consistency)
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

  // Add this validation function (same as signup)
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



  function maskEmail(email) {
  if (!email) return "";
  const [user, domain] = email.split("@");
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

  // STEP 1: Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();

    if (!email) {
      showToast("error", "Please enter your email address");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(
        `${apiUrl}request-otp`,
        { email },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // Response handling
      console.log("OTP request response:", response.data);
      showToast("success", "OTP sent to your email!");
      setStep(2); // Move to OTP verification step
    } catch (error) {
      console.error("Error requesting OTP:", error);
      showToast(
        "error",
        error.response?.data?.message || "Failed to request OTP"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (!otp || otp.length < 6) {
      showToast("error", "Please enter the 6-digit OTP");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(
        `${apiUrl}verify-otp`,
        { email, otp },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("OTP verify response:", response.data);
      showToast("success", "OTP verified! You can reset your password.");
      setStep(3);
    } catch (error) {
      console.error("Error verifying OTP:", error);
      showToast(
        "error",
        error.response?.data?.message || "OTP verification failed"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (!email) {
      showToast("error", "Please enter your email first");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(
        // `${apiUrl}resend-otp`,
        `${apiUrl}request-otp`,
        { email },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("OTP resent:", response.data);
      showToast("success", "OTP resent to your email!");
      setResendTimer(30);
    } catch (error) {
      console.error("Error resending OTP:", error);
      showToast("error", error.response?.data?.message || "Failed to resend OTP");
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      showToast("error", "Please fill out the password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast("error", "Passwords do not match.");
      return;
    }

    if (!otp || otp.length < 6) {
      showToast("error", "OTP is required to reset password.");
      return;
    }

    setIsLoading(true);
    setButtonClicked(true);
    setSpanExpanded(true);

    try {
      const res = await axios.post(
        `${apiUrl}reset-password`,
        {
          email,
          otp,
          newPassword,
          confirmPassword,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Reset password response:", res.data);
      showToast("success", "Password has been reset successfully!");
      // after success, animate then navigate to login (useEffect handles navigate)
    } catch (error) {
      console.error("Error resetting password:", error);
      showToast(
        "error",
        error.response?.data?.message || "Failed to reset password!"
      );
      setIsLoading(false);
      setButtonClicked(false);
      setSpanExpanded(false);
    }
  };

  // OTP input helpers: 6 single inputs UX (copied + adapted from your Signup)
 const renderOtpInputs = () => {
  return (
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
              const nextEl = document.getElementById(`otp-input-${index + 1}`);
              if (nextEl) nextEl.focus();
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace") {
              const newOtp = otp.split("");
              if (newOtp[index]) {
                newOtp[index] = "";
                setOtp(newOtp.join(""));
              } else if (index > 0) {
                const prevEl = document.getElementById(`otp-input-${index - 1}`);
                if (prevEl) prevEl.focus();
              }
            }
          }}
          onPaste={(e) => {
            e.preventDefault();
            const pastedData = e.clipboardData.getData("text").slice(0, 6);
            if (pastedData.match(/^[0-9]+$/)) {
              setOtp(pastedData.padEnd(6, ""));
              const lastIndex = Math.min(pastedData.length, 5);
              const el = document.getElementById(`otp-input-${lastIndex}`);
              if (el) el.focus();
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
  );
};


  // Render step content (parity with Signup renderStepContent)
  const renderStepContent = () => {
    // STEP 1: Request OTP (Email input)
    if (step === 1) {
      return (
        <>
          <h3 className="mt-4">Reset your password</h3>
          <p style={{ color: "#666", marginBottom: "20px" }}>
            Enter your registered email to receive an OTP.
          </p>
          <form onSubmit={handleRequestOtp} autoComplete="off">
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
                Remembered your password?{" "}
                <Link to="/login" style={{ color: "#E94545" }}>
                  Login
                </Link>
              </div>
            </div>
          </form>
        </>
      );
    }

    // STEP 2: Verify OTP
    if (step === 2) {
      return (
        <>
          <h3 className="mt-4">Verify Your Email</h3>
          
          <form onSubmit={handleVerifyOtp} autoComplete="off">
            <div className="row custom_row">
              <div
  style={{
    display: 'flex',
    alignItems: 'center',
    background: '#FFF6EE',
    borderRadius: '16px',
    padding: '18px 20px',
    marginTop: '20px',
    width:"100%"
  }}
>
  <div style={{margin:"0px 10px 0 0"}}>
     <img src={protectionIcon} className="img_responsive" alt="Illustration" />
  </div>
  <div style={{textAlign: "left"}}>
    <span style={{ color: '#FFAB49', fontWeight: 600, fontSize: '18px' }}>Enter the 6-digit code</span><br />
    <span style={{ color: '#494949', fontSize: '15px' }}>
      {/* A reset link has been sent to <b>{maskEmail(email)}</b> */}
      
        sent to your <strong>{maskEmail(email)}</strong>
    </span>
  </div>
</div>

            </div>

            <div className="row custom_row">
              <div className="col-md-12 mt-3" >
                <label
                  className="login_label"
                  style={{ marginBottom: "15px" }}
                >
                  Enter OTP
                </label>

                {renderOtpInputs()}
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
      Resend Code in {resendTimer}s
    </button>
  ) : (
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
  )}
</div>


              <div className="mt-3 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setOtp("");
                  }}
                  style={{
                    color: "#666",
                    background: "none",
                    border: "none",
                    textDecoration: "underline",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  ← Change Email
                </button>
              </div>
            </div>
          </form>
        </>
      );
    }

    // STEP 3: Reset Password
if (step === 3) {
  return (
    <>
      <h3 className="mt-4">Create New Password</h3>
      <form onSubmit={handleResetPassword} autoComplete="off">

        {/* New Password */}
        <div className="row custom_row">
          <div className="col-md-12 mt-3">
            <label className="login_label">New Password</label>
            <div className="text_field">
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                className="form-control form_control"
                onChange={(e) => {
                  const val = e.target.value;
                  setNewPassword(val);
                  validatePassword(val);
                  setPasswordTouched(true);
                }}
                onFocus={() => setPasswordTouched(true)}
                onBlur={() => setPasswordTouched(true)}
                placeholder="Enter your New Password"
                autoComplete="new-password"
                name="new-password"
              />
              <div
                className="icon_field"
                onClick={togglePasswordVisibility}
              >
                {showPassword ? <PasswordShow /> : <PasswordHide />}
              </div>
            </div>

            {/* Password strength feedback - 3 left / 2 right columns */}
            {(passwordTouched || newPassword) && !(
              passwordStrength.length &&
              passwordStrength.uppercase &&
              passwordStrength.lowercase &&
              passwordStrength.number &&
              passwordStrength.special
            ) && (
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
                    justifyContent: "space-between",
                  }}
                >
                  {/* Left column - 3 items */}
                  <div style={{ flex: "1", minWidth: "160px" }}>
                    <div
                      style={{
                        marginBottom: "4px",
                        color: passwordStrength.length ? "#10b981" : "#6b7280",
                        textAlign: "left",
                      }}
                    >
                      {passwordStrength.length ? "✔" : "•"} At least 8 characters
                    </div>
                    <div
                      style={{
                        marginBottom: "4px",
                        color: passwordStrength.uppercase ? "#10b981" : "#6b7280",
                        textAlign: "left",
                      }}
                    >
                      {passwordStrength.uppercase ? "✔" : "•"} At least one uppercase
                    </div>
                    <div
                      style={{
                        color: passwordStrength.lowercase ? "#10b981" : "#6b7280",
                        textAlign: "left",
                      }}
                    >
                      {passwordStrength.lowercase ? "✔" : "•"} At least one lowercase
                    </div>
                  </div>

                  {/* Right column - 2 items */}
                  <div style={{ flex: "1", minWidth: "160px" }}>
                    <div
                      style={{
                        marginBottom: "4px",
                        color: passwordStrength.number ? "#10b981" : "#6b7280",
                        textAlign: "left",
                      }}
                    >
                      {passwordStrength.number ? "✔" : "•"} At least one number
                    </div>
                    <div
                      style={{
                        color: passwordStrength.special ? "#10b981" : "#6b7280",
                        textAlign: "left",
                      }}
                    >
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

                  if (val && val !== newPassword) {
                    setConfirmPasswordError("Passwords do not match");
                  } else {
                    setConfirmPasswordError("");
                  }
                }}
                onFocus={() => setConfirmTouched(true)}
                onBlur={() => setConfirmTouched(true)}
                placeholder="Confirm your New Password"
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

            {confirmTouched && confirmPasswordError && (
              <div className="error-message mt-1" style={{ color: "#ef4444", fontSize: "0.875rem" }}>
                {confirmPasswordError}
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-4">
          <button
            type="submit"
            className={`btn_login ripple_effect ${buttonClicked ? "btn--clicked" : ""}`}
            disabled={
              isLoading ||
              !newPassword.trim() ||
              !confirmPassword.trim() ||
              !passwordStrength.length ||
              !passwordStrength.uppercase ||
              !passwordStrength.lowercase ||
              !passwordStrength.number ||
              !passwordStrength.special ||
              newPassword !== confirmPassword
            }
          >
            {isLoading ? "Resetting..." : "Reset Password"}
          </button>

          <div className="have_acc mt-3">
            Remembered your password?{" "}
            <Link to="/login" style={{ color: "#E94545" }}>
              Login
            </Link>
          </div>
        </div>
      </form>
    </>
  );
}

    // STEP 4: Done (this route triggers navigate to login via animation)
    if (step === 4) {
      return (
        <>
          <h3 className="mt-4">Password Reset</h3>
          <p style={{ color: "#666", marginBottom: "20px" }}>
            Your password has been reset. You can now login with your new password.
          </p>
          <div className="mt-4">
            <button
              className="btn_login ripple_effect"
              onClick={() => navigate("/login")}
            >
              Go to Login
            </button>
          </div>
        </>
      );
    }
  };

  return (
    <>
      <ChakraProvider />
      <div className="form_container">
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
        className={`animate_logo animate_logo_loader ${spanExpanded ? "expanded" : ""
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

export default ForgotPassword;
