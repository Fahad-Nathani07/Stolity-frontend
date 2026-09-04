import React, { useEffect, useRef, useState } from "react";
import Logo from "../images/logo.png";
import SideNav from "../components/SideNav";
import Footer from "../components/Footer";
import ToggleNav from "../components/ToggleNav";
import ImgProfile from "../images/img-profile.svg";
import fullscreeen from "../images/fullscreen.png";
import zoomin from "../images/zoomin.png";
import zoomout from "../images/zoomout.png";
import iconCalendar from "../images/iconCalendar.svg";
import IconExcel from "../images/IconExcel.svg";
import IconPPT from "../images/IconPPT.svg";
import IconAI from "../images/IconAI.svg";
import IconFigma from "../images/IconFigma.svg";
import IconFolder from "../images/folder.svg";
import VideoPlayer from "../components/VideoPlayer";
import { buildVideoStreamUrl } from "../utils/videoPlayer";
import { buildFileStreamUrl, preloadStreamedImage } from "../utils/fileStream";
import Avatar1 from "../images/Avatar1.svg";
import AvatarDefault from "../images/AvatarDefault.jpg";
import Avatar2 from "../images/Avatar2.svg";
import Avatar3 from "../images/Avatar3.svg";
import Avatar4 from "../images/Avatar4.svg";
import deleteIcon3 from "../images/mediaPlayer/trash1.svg";
import DeletePopup from "../images/deletePopup.svg";
import ImgStolityApp from "../images/img-stolity-app.png";
import { ReactComponent as PasswordShow } from "../images/icon-eye.svg";
import { ReactComponent as PasswordHide } from "../images/icon-eye-hide.svg";
import axios from "axios";
import { Modal as RsuiteModal } from "rsuite";
import { useNavigate } from "react-router-dom";
import loaderGif from "../images/Loaders/Animation4.gif";
import svgDoc from "../images/TypesDoc.svg"
import svgFolder from "../images/TypesFolder.svg"
import svgJpg from "../images/TypesJpg.svg"
import svgMp3 from "../images/TypesMp3.svg"
import svgMp4 from "../images/TypesMp4.svg"
import svgPng from "../images/TypesPng.svg"
import svgTxt from "../images/TypesTxt.svg"
import svgZip from "../images/TypesZip.svg"
import { useDispatch, useSelector } from "react-redux";
import { fetchUserSubscription, fetchUserFolderSize } from "../store/subscriptionSlice";
import { setUserProfile, normalizeAvatarUrl } from "../store/userProfileSlice";
import { usePlayAudio } from "../hooks/usePlayAudio";
import { useSessionEndCleanup } from "../hooks/useSessionEndCleanup";
import { isAudioExtension } from "../utils/audioPlayer";
import { FaCheckCircle } from "react-icons/fa"; //<FaCheckCircle />
import { BsXCircleFill } from "react-icons/bs"; // <BsXCircleFill />
import { IoIosInformationCircle } from "react-icons/io"; // <IoIosInformationCircle />
import { FaExclamationTriangle } from "react-icons/fa"; // <FaExclamationTriangle />


import { Progress, Modal } from "antd";

import { ChakraProvider, Stack, useToast } from "@chakra-ui/react";

import {
  Tooltip,
  Whisper,
  SelectPicker,
  Dropdown,
  Popover,
  Placeholder,
  Button,
} from "rsuite";
import { Modal as Bigmodal } from "rsuite";
import { fetchJobPortalByEmail } from "../store/jobPortalSlice";
import Loader2 from "../components/Loader2";

const getBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

const months = [
  { name: "1 Month", code: "01" },
  { name: "2 Month", code: "02" },
  { name: "3 Month", code: "03" },
  { name: "4 Month", code: "04" },
  { name: "5 Month", code: "05" },
  { name: "6 Month", code: "06" },
  { name: "7 Month", code: "07" },
  { name: "8 Month", code: "08" },
  { name: "9 Month", code: "09" },
  { name: "10 Month", code: "10" },
  { name: "11 Month", code: "11" },
  { name: "12 Month", code: "12" },
];

const UserProfile = () => {
  const dispatch = useDispatch();
  const { playAudioFile } = usePlayAudio();
  const apiUrl = process.env.REACT_APP_API_ENDPOINT;
  const userProfile = useSelector((state) => state.userProfile);
  const email = userProfile.email || sessionStorage.getItem("email");
  const [name, setName] = useState("");
  const token = sessionStorage.getItem("number");
  const namee = userProfile.name || sessionStorage.getItem("name");
  const namee2 = sessionStorage.getItem("userData");
  const name2 = namee2 ? JSON.parse(namee2)?.name || ""
    : "";
  const finalName = namee ?? name2?.name ?? "";
  const numnum = userProfile.mobile || sessionStorage.getItem("num");
  const avatar = userProfile.avatar || sessionStorage.getItem("avatar");
  // console.log("avatar", avatar);

  const subscription = useSelector((state) => state.subscription.subscription);
  const folderSize = useSelector((state) => state.subscription.folderSize);
  const [triggerDataSize, setTriggerDataSize] = useState(0);

  const [otpFlowStep, setOtpFlowStep] = useState(0); // 0: button only, 1: request OTP, 2: verify OTP, 3: reset password
  const [otpEmail, setOtpEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [otpBusy, setOtpBusy] = useState(false);

  useEffect(() => {
    if (resendTimer <= 0) return undefined;
    const id = setInterval(() => {
      setResendTimer((t) => (t <= 1 ? 0 : t - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [resendTimer]);

  const maskEmail = (value) => {
    if (!value || !value.includes("@")) return value || "";
    const [user, domain] = value.split("@");
    const visible = user.slice(0, Math.min(2, user.length));
    return `${visible}${"•".repeat(Math.max(user.length - visible.length, 1))}@${domain}`;
  };

  // Password validation states (same as Signup & Forgot Password)
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

  // Validation function (same as other pages)
  const validatePassword = (pwd) => {
    setPasswordStrength({
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd),
    });
  };

  const [passwordErrors, setPasswordErrors] = useState({
    oldPass: '',
    newPass: '',
    confirmPass: '',
    general: '', // optional: for cross-field issues like old==new
  });
  const [formErrors, setFormErrors] = useState({
    firstName: '',
    lastName: '',
    number: '',
    eemail: '',
    general: '',
  });

  useEffect(() => {
    const finalName = namee ?? name2 ?? "";
    setName(finalName);

    console.log("aaaa namee: ", namee)
    console.log("aaaa name2 ", name2)
    console.log("aaaa finalName", finalName)

  }, [namee, namee2])
  useEffect(() => {

    console.log("aaaa final name: ", name)

  }, [name])


  const userSubscription = useSelector((state) => state.subscription?.subscription?.entitlement_ids[0]);

  // Option A – simple & readable (most teams prefer this)
  const displayedPlan = (() => {
    if (!userSubscription) return "Free";

    const planId = userSubscription.trim().toLowerCase();

    if (planId === "stolity_lite_monthly") return "Premium (Monthly)";
    if (planId === "stolity_lite_yearly") return "Premium (Yearly)";
    if (planId === "stolity_lite_trial") return "Premium (Trial - 1 week)";

    // unknown / invalid / future plan → fallback
    return "Free";
  })();


  const validatePasswordChange = () => {
    const errors = {
      oldPass: '',
      newPass: '',
      confirmPass: '',
      general: '',
    };

    let isValid = true;

    // Only validate if user entered something (partial fill is still invalid)
    if (oldPass || newPass || confirmPass) {
      if (!oldPass.trim()) {
        errors.oldPass = 'Current password is required';
        isValid = false;
      }

      if (!newPass.trim()) {
        errors.newPass = 'New password is required';
        isValid = false;
      } else if (newPass.length < 8) { // ← you can adjust min length
        errors.newPass = 'New password must be at least 8 characters';
        isValid = false;
      }

      if (!confirmPass.trim()) {
        errors.confirmPass = 'Please confirm the new password';
        isValid = false;
      }

      // Cross-field checks
      if (oldPass && newPass && oldPass === newPass) {
        errors.general = 'New password cannot be the same as current password';
        isValid = false;
      }

      if (newPass && confirmPass && newPass !== confirmPass) {
        errors.confirmPass = 'Passwords do not match';
        isValid = false;
      }
    }

    setPasswordErrors(errors);
    return isValid;
  };



  const validatePersonalInfo = () => {
    const errors = {
      firstName: '',
      lastName: '',
      number: '',
      eemail: '',
      general: '',
    };

    let isValid = true;

    if (!firstName?.trim()) {
      errors.firstName = 'First name is required';
      isValid = false;
    }

    if (!lastName?.trim()) {
      errors.lastName = 'Last name is required';
      isValid = false;
    }

    const cleanedMobile = String(number || '').trim().replace(/\D/g, '');
    if (!String(number || '').trim()) {
      errors.number = 'Mobile number is required';
      isValid = false;
    } else if (cleanedMobile.length !== 10) {
      errors.number = 'Mobile number should be 10 digits';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };



  useEffect(() => {
    if (token) {
      dispatch(fetchUserSubscription(token));
      console.log("fetchUserSubscription executed")
    }
  }, [token, dispatch]);


  useEffect(() => {
    if (token) {
      dispatch(fetchUserFolderSize(token));
      console.log("fetchUserFolderSize executed")
    }
  }, [token, dispatch, triggerDataSize]);

  useEffect(() => {
    console.log("✅subscription", subscription)
    console.log("✅subscription storage", subscription?.storage)
  }, [subscription])
  useEffect(() => {
    console.log("✅folderSize", folderSize)
  }, [folderSize])


  // function parseStorageToBytes(storageStr) {
  //     if (!storageStr) return 0;
  //     const [value, unit] = storageStr.split(" ");
  //     const units = { KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3, TB: 1024 ** 4 };
  //     console.log("✅ TotalBytes ",parseFloat(value) * (units[unit] || 1))
  //     return parseFloat(value) * (units[unit] || 1);
  //   }

  // const totalBytes = subscription && subscription.storage ? parseStorageToBytes(subscription.storage) : 5 * 1024 ** 3; // Default 5 GB for free users
  // const usedBytes = folderSize ? folderSize.sizeInBytes : 0;
  // const usedGB = usedBytes / 1024 ** 3;
  // const remainingGB = (totalBytes - usedBytes) / 1024 ** 3;


  //       function parseStorageToBytes(storageStr) {
  //   if (!storageStr) return 0;
  //   const [value, unit] = storageStr.split(" ");
  //   const units = { KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3, TB: 1024 ** 4 };
  //   // console.log("✅ TotalBytes ", parseFloat(value) * (units[unit] || 1));   1,07,37,41,824  
  //   return parseFloat(value) * (units[unit] || 1);
  // }

  function parseStorageToBytes(storageStr) {
    if (!storageStr) return 0;

    const [valueStr, unit] = storageStr.trim().split(/\s+/);
    const value = parseFloat(valueStr);
    if (isNaN(value)) return 0;

    const units = {
      KB: 1000,
      MB: 1000 ** 2,          // 1,000,000
      GB: 1000 ** 3,          // 1,000,000,000
      TB: 1000 ** 4,          // 1,000,000,000,000
      PB: 1000 ** 5,          // optional
    };

    const multiplier = units[unit?.toUpperCase()] || 1;
    return Math.round(value * multiplier);   // round to avoid floating-point issues
  }


  const specialUserFlag = useSelector((state) => state.subscription.specialUserFlag);

  // Define total storage in bytes using DECIMAL units (matches API / user expectation)
  const totalBytes = specialUserFlag
    ? 500 * 1_000_000_000           // 500 GB = 500,000,000,000 bytes
    : (subscription && subscription.storage
      ? parseStorageToBytes(subscription.storage)
      : 5 * 1_000_000_000);       // 5 GB = 5,000,000,000 bytes

  const usedBytes = folderSize ? folderSize.sizeInBytes : 0;
  // const usedBytes = 0;

  // Calculate in decimal GB to stay consistent with the API's "8.23 GB"
  const usedGB = usedBytes / 1_000_000_000;
  const remainingGB = (totalBytes - usedBytes) / 1_000_000_000;

  // Optional: nicer display values (rounded)
  const usedDisplay = usedGB.toFixed(2) + " GB";
  const remainingDisplay = Math.max(0, remainingGB).toFixed(2) + " GB"; // prevent negative display
  const totalDisplay = (totalBytes / 1_000_000_000).toFixed(0) + " GB";



  useEffect(() => {
    console.log("Storage check - usedBytes:", usedBytes);
    console.log("Storage check - usedGB:", usedGB);
    console.log("Storage check - remainingGB:", remainingGB);

  }, [usedBytes, usedGB, remainingGB])



  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [triggerReset, setTriggerReset] = useState(0);
  // const [name, setName] = useState("");
  const [eemail, setEemail] = useState(userProfile.email || "");
  const [number, setNumber] = useState(userProfile.mobile || "");
  const isGoogleAuth = useSelector((state) => state.getdata.isGoogleAuth);
  // console.log("profile section google auth", isGoogleAuth);
  const [firstPopup, setFirstPopup] = useState(false);
  const [secondPopup, setSecondPopup] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const isDeletingAccountRef = useRef(false);

  const navigate = useNavigate();

  const closeDeleteModals = () => {
    if (isDeletingAccountRef.current) return;
    setFirstPopup(false);
    setSecondPopup(false);
  };

  const handleFinalDelete = async () => {
    if (isDeletingAccountRef.current) return;

    isDeletingAccountRef.current = true;
    setIsDeletingAccount(true);

    try {
      await axios.get(`${apiUrl}delete-account`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "arraybuffer",
      });

      showToast("success", "Account deleted successfully.");
      setFirstPopup(false);
      setSecondPopup(false);

      setTimeout(() => {
        navigate("/Login");
      }, 1000);
    } catch (err) {
      isDeletingAccountRef.current = false;
      setIsDeletingAccount(false);
      showToast("error", "Failed to delete account.");
    }
  };

  useEffect(() => {
    setEemail(userProfile.email || email || "");
    setNumber(userProfile.mobile || numnum || "");
    handleReset();
  }, [triggerReset, userProfile.email, userProfile.mobile]);

  const handleConfirmPassChange = (e) => {
    setConfirmPass(e.target.value);
  };

  const handleNewPassChange = (e) => {
    setNewPass(e.target.value);
  };

  const handleOldPassChange = (e) => {
    setOldPass(e.target.value);
  };

  const [uploadedAvatar, setUploadedAvatar] = useState(null); // For preview

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = () => {
      setUploadedAvatar(reader.result); // Show preview
      setSelectedAvatar(reader.result); // Set for upload
      setActiveIndex(null); // Deselect default
    };

    reader.readAsDataURL(file);
  };

  const handleDeleteUploadedAvatar = () => {
    setUploadedAvatar(null); // Remove preview
    setSelectedAvatar(""); // Clear avatar
  };

  const [firstName, setFirstName] = useState(userProfile.firstName || "");
  const [lastName, setLastName] = useState(userProfile.lastName || "");

  // Prefill first & last name from Redux
  useEffect(() => {
    setFirstName(userProfile.firstName || "");
    setLastName(userProfile.lastName || "");
  }, [triggerReset, userProfile.firstName, userProfile.lastName, userProfile.name]);


  const { role, companies: assignedCompanyIds } = useSelector(
    (state) => state.jobPortal
  );

  useEffect(() => {
    if (email) {
      // dispatch(fetchJobPortalByEmail(email));
      dispatch(fetchJobPortalByEmail({ email, role }));
    }
  }, [dispatch, role]);


  const handleChangeFirstName = (e) => {
    setFirstName(e.target.value);
    if (formErrors.firstName) {
      setFormErrors((prev) => ({ ...prev, firstName: "" }));
    }
  };

  const handleChangeLastName = (e) => {
    setLastName(e.target.value);
    if (formErrors.lastName) {
      setFormErrors((prev) => ({ ...prev, lastName: "" }));
    }
  };

  const handleChangeEmail = (e) => {
    setEemail(e.target.value);
  };

  const handleChangeNumber = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 10);
    setNumber(digitsOnly);
    if (formErrors.number) {
      setFormErrors((prev) => ({ ...prev, number: "" }));
    }
  };

  // const handleChangeInfo = async () => {
  //   try {
  //     const fullName = `${firstName} ${lastName}`.trim();
  //     const avatarToPass = selectedAvatar ? selectedAvatar : avatar;

  //     const res = await axios.post(
  //       `${apiUrl}edit-user`,
  //       {
  //         email: eemail,
  //         name: fullName,
  //         contact: number,
  //         userAvatar: avatarToPass,
  //       },
  //       {
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //           "Content-Type": "application/json",
  //         },
  //       }
  //     );

  //     showToast("success", "Data is updated!");

  //     // 👇 Update state and sessionStorage
  //     setName(fullName);
  //     setSelectedAvatar(avatarToPass);
  //     sessionStorage.setItem("email", eemail);
  //     sessionStorage.setItem("name", fullName);
  //     sessionStorage.setItem("num", number);
  //     sessionStorage.setItem("avatar", avatarToPass);

  //     handleCancel();
  //   } catch (error) {
  //     console.error("API Error:", error.response.data.message); // <-- Debug output in console
  //     showToast("error", error.response.data.message);
  //   }
  // };


  // Request OTP


  const handleChangeInfo = async () => {
    if (!validatePersonalInfo()) {
      return false;
    }

    try {
      const fullName = `${firstName} ${lastName}`.trim();
      const avatarToPass = normalizeAvatarUrl(selectedAvatar || avatar);
      const cleanedMobile = String(number || "").trim().replace(/\D/g, "");

      await axios.post(
        `${apiUrl}edit-user`,
        {
          email: eemail,
          name: fullName,
          contact: cleanedMobile,
          userAvatar: avatarToPass,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      showToast("success", "Profile updated successfully!");

      // Update state & storage
      setName(fullName);
      setSelectedAvatar(avatarToPass);
      setNumber(cleanedMobile);

      sessionStorage.setItem("email", eemail);
      sessionStorage.setItem("name", fullName);
      sessionStorage.setItem("num", cleanedMobile);
      sessionStorage.setItem("avatar", avatarToPass);

      dispatch(
        setUserProfile({
          name: fullName,
          email: eemail,
          mobile: cleanedMobile,
          avatar: normalizeAvatarUrl(avatarToPass),
        })
      );

      return true;

    } catch (error) {
      console.error("Failed to update profile:", error);

      let errorMessage = "Failed to update profile. Please try again.";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 401) {
        errorMessage = "Session expired. Please log in again.";
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data.message || "Invalid input. Check your details.";
      }

      showToast("error", errorMessage);
      return false;
    }
  };





  const handleRequestOtp = async (e) => {
    e?.preventDefault?.();
    if (!email) {
      showToast("error", "Please enter your email address");
      return;
    }
    setOtpBusy(true);
    try {
      await axios.post(`${apiUrl}request-otp`, { email: email }, {
        headers: { "Content-Type": "application/json" },
      });
      showToast("success", "OTP sent to your email!");
      setOtp("");
      setResendTimer(30);
      setOtpFlowStep(2);
    } catch (error) {
      showToast("error", error.response?.data?.message || "Failed to request OTP");
    } finally {
      setOtpBusy(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async (e) => {
    e?.preventDefault?.();
    if (!otp || otp.length < 6) {
      showToast("error", "Please enter the 6-digit OTP");
      return;
    }
    setOtpBusy(true);
    try {
      await axios.post(`${apiUrl}verify-otp`, { email: email, otp }, {
        headers: { "Content-Type": "application/json" },
      });
      showToast("success", "OTP verified! You can now reset your password.");
      setOtpFlowStep(3);
    } catch (error) {
      showToast("error", error.response?.data?.message || "OTP verification failed");
    } finally {
      setOtpBusy(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (!email) {
      showToast("error", "Please enter your email first");
      return;
    }
    setOtpBusy(true);
    try {
      await axios.post(`${apiUrl}resend-otp`, { email: email }, {
        headers: { "Content-Type": "application/json" },
      });
      showToast("success", "OTP resent to your email!");
      setOtp("");
      setResendTimer(30);
    } catch (error) {
      showToast("error", error.response?.data?.message || "Failed to resend OTP");
    } finally {
      setOtpBusy(false);
    }
  };

  // Reset Password
  const handleResetPassword = async (e) => {
    e?.preventDefault?.();
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
    setOtpBusy(true);
    try {
      await axios.post(`${apiUrl}reset-password`, {
        email: email,
        otp,
        newPassword,
        confirmPassword,
      }, {
        headers: { "Content-Type": "application/json" },
      });
      showToast("success", "Password has been reset successfully!");
      setOtpFlowStep(0);
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
      setResendTimer(0);
    } catch (error) {
      showToast("error", error.response?.data?.message || "Failed to reset password!");
    } finally {
      setOtpBusy(false);
    }
  };




  // const handlePassWordChange = async () => {
  //   const res = await axios.post(
  //     `${apiUrl}change-password`,
  //     {
  //       email: email,
  //       oldPassword: oldPass,
  //       newPassword: newPass,
  //       confirmNewPassword: confirmPass,
  //     },
  //     {
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //         "Content-Type": "application/json",
  //       },
  //     }
  //   );
  //   showToast("success", "Password is changed!");
  //   console.log("res", res);
  //   handleCancel();
  // };

  const handlePassWordChange = async () => {
    // Reset previous errors
    setPasswordErrors({
      oldPass: '',
      newPass: '',
      confirmPass: '',
      general: '',
    });

    const errors = {
      oldPass: '',
      newPass: '',
      confirmPass: '',
      general: '',
    };

    let isValid = true;

    if (oldPass || newPass || confirmPass) {
      if (!oldPass?.trim()) {
        errors.oldPass = 'Current password is required';
        isValid = false;
      }

      if (!newPass?.trim()) {
        errors.newPass = 'New password is required';
        isValid = false;
      } else if (newPass.length < 8) {
        errors.newPass = 'New password must be at least 8 characters';
        isValid = false;
      }

      if (!confirmPass?.trim()) {
        errors.confirmPass = 'Please confirm the new password';
        isValid = false;
      }

      if (oldPass && newPass && oldPass === newPass) {
        errors.general = 'New password cannot be the same as current password';
        isValid = false;
      }

      if (newPass && confirmPass && newPass !== confirmPass) {
        errors.confirmPass = 'Passwords do not match';
        isValid = false;
      }
    }

    setPasswordErrors(errors);

    if (!isValid) {
      // showToast("error", "Please fix the password errors above");
      showToast("error", "Please correct the errors in the password fields.");
      return false;
    }

    // ── Only reach here if client validation passed ──
    try {
      await axios.post(
        `${apiUrl}change-password`,
        {
          email: email,
          oldPassword: oldPass,
          newPassword: newPass,
          confirmNewPassword: confirmPass,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      showToast("success", "Password changed successfully!");

      // Clear fields — but do NOT call handleCancel() here
      setOldPass('');
      setNewPass('');
      setConfirmPass('');

      return true;

    } catch (error) {
      console.error("Password change failed:", error);

      let errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to change password. Please try again.";

      showToast("error", errorMessage);

      if (error.response?.status === 400 || error.response?.status === 401) {
        setPasswordErrors((prev) => ({
          ...prev,
          general: errorMessage,
        }));
      }

      return false;
    }
  };




  const handleReset = () => {
    setConfirmPass("");
    setNewPass("");
    setOldPass("");
  };

  const toast = useToast();

  // const showToast = (status, message) => {
  //   toast({
  //     title: `${status.charAt(0).toUpperCase() + status.slice(1)}`,
  //     description: message,
  //     status: status, // Set this to 'error' for a red-colored pop-up
  //     duration: 3000,
  //     isClosable: true,
  //   });
  // };


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



  const [rootSize, setRootSize] = useState("");

  const [selectedMonth, setSelectedMonth] = useState("06");

  // MODAL
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editProfileTab, setEditProfileTab] = useState("personal"); // personal | password

  const showModal = () => {
    setEditProfileTab("personal");
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setTriggerReset(x => x + 1);
    setOtp("");
    setOtpEmail("");
    setNewPassword("");
    setConfirmPassword("");
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setOtpFlowStep(0);
    setResendTimer(0);
    setOtpBusy(false);
    setEditProfileTab("personal");
    setIsModalOpen(false); // This will close the modal
  };
  // END MODAL

  // PASSWORD SHOW HIDE

  const [showPassword1, setShowPassword1] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [showPassword3, setShowPassword3] = useState(false);

  const togglePasswordVisibility1 = () => setShowPassword1(!showPassword1);
  const togglePasswordVisibility2 = () => setShowPassword2(!showPassword2);
  const togglePasswordVisibility3 = () => setShowPassword3(!showPassword3);

  // AVATAR ACTIVE
  const [activeIndex, setActiveIndex] = useState(null);

  const handleButtonClick = (index) => {
    setActiveIndex(index); // Click par active button ka index update hota hai
  };
  const [avatarBox, setavatarBox] = useState([]);
  const localAvatarOptions = [Avatar2, Avatar4, Avatar3, Avatar1];
  const AVATAR_SLOT_COUNT = 4;
  const [avatarsFetching, setAvatarsFetching] = useState(true);
  const [avatarsLoadedCount, setAvatarsLoadedCount] = useState(0);
  const avatarsReady =
    !avatarsFetching && avatarsLoadedCount >= AVATAR_SLOT_COUNT;

  const getAllAvatars = async () => {
    setAvatarsFetching(true);
    setAvatarsLoadedCount(0);
    try {
      const response = await axios.get(`${apiUrl}get-avatar-list`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const list = (response.data.avatarList || []).filter(
        (item) => item && item.url
      );
      console.log("avatarList", list);
      setavatarBox(list);
    } catch (error) {
      console.error(error);
      setavatarBox([]);
    } finally {
      setAvatarsFetching(false);
    }
  };

  // Prefetch all 4 avatar images (API URL or local fallback) before showing them
  useEffect(() => {
    if (avatarsFetching) return;

    let cancelled = false;
    setAvatarsLoadedCount(0);

    const urls = Array.from({ length: AVATAR_SLOT_COUNT }, (_, index) => {
      const apiAvatar = Array.isArray(avatarBox) ? avatarBox[index] : null;
      return apiAvatar?.url || localAvatarOptions[index];
    });

    let settled = 0;
    urls.forEach((url) => {
      const img = new Image();
      const markDone = () => {
        if (cancelled) return;
        settled += 1;
        setAvatarsLoadedCount(settled);
      };
      img.onload = markDone;
      img.onerror = markDone;
      img.src = url;
    });

    return () => {
      cancelled = true;
    };
  }, [avatarsFetching, avatarBox]);

  useEffect(() => {
    console.log("avatar box is", avatarBox);
  }, [avatarBox]); // This effect runs whenever avatarBox changes.

  const [remainingStorage, setRemainingStorage] = useState("");
  const parseSizeToBytes = (sizeStr) => {
    if (!sizeStr || typeof sizeStr !== "string") return 0;

    const units = {
      Bytes: 1,
      KB: 1024,
      MB: 1024 ** 2,
      GB: 1024 ** 3,
      TB: 1024 ** 4,
    };

    const match = sizeStr.match(/([\d.]+)\s*(Bytes|KB|MB|GB|TB)/i);
    if (!match) return 0;

    const value = parseFloat(match[1]);
    const unit = match[2];

    return value * (units[unit] || 1);
  };

  // const getRootFolderSize = async () => {
  //   try {
  //     const res = await axios.get(`${apiUrl}get-folder-size`, {
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //         "Content-Type": "application/json",
  //       },
  //     });

  //     const sizeInBytes = parseSizeToBytes(res.data.totalSize);
  //     setRootSize(sizeInBytes);

  //     // const totalBytes = 20 * 1024 * 1024 * 1024; // 20 GB
  //     const totalBytes = 50 * 1024 * 1024 * 1024; // 50 GB
  //     const usedGB = sizeInBytes / 1024 ** 3;
  //     const remainingGB = (totalBytes - sizeInBytes) / 1024 ** 3;

  //     setRemainingStorage(remainingGB);
  //     // setUsedStorage(usedGB);

  //     console.log("Used:", usedGB.toFixed(2), "GB");
  //     console.log("Remaining:", remainingGB.toFixed(2), "GB");
  //   } catch (error) {
  //     console.error(`There's error at ${error}`);
  //   }
  // };

  useEffect(() => {
    // getRootFolderSize();
    getAllAvatars();
  }, []);


  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // ← loading state

  const getRecentFiles = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(`${apiUrl}get-recent-files`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      setFiles(res.data);
      console.log("Recent files are", res.data);
    } catch (error) {
      console.error(`There's error at ${error}`);
    } finally {
      setIsLoading(false); // ← done loading
    }
  };

  useEffect(() => {
    getRecentFiles();
  }, []);

  const [errorMessage2, setErrorMessage2] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImage, setShowImage] = useState(false);
  const [videoSrc, setVideoSrc] = useState("");
  const [imageSrc, setImageSrc] = useState("");
  const [pdfSrc, setPdfSrc] = useState("");
  const [audioSrc, setAudioSrc] = useState("");
  const [isProgressVisible, setIsProgressVisible] = useState(false);
  const [modalFile, setModalFile] = useState("");

  useSessionEndCleanup(() => {
    setShowImage(false);
    setIsFullscreen(false);
    setIsProgressVisible(false);
  });

  //Image getting function
  const getImageInfo = async (filename) => {
    setIsProgressVisible(true);
    setImageSrc("");
    try {
      const url = buildFileStreamUrl(apiUrl, token, filename);
      await preloadStreamedImage(url);
      setImageSrc(url);
    } catch (error) {
      console.error(error);
    } finally {
      setIsProgressVisible(false);
    }
  };
  //Audio getting function
  const getAudioInfo = async (filename) => {
    try {
      const res = await axios.get(`${apiUrl}getFile`, {
        params: {
          filePath: filename,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "arraybuffer",
      });
      setIsProgressVisible(false);
      const fileType = res.headers["content-type"];
      const blob = new Blob([res.data], { type: fileType });
      const url = window.URL.createObjectURL(blob);
      setAudioSrc(url);
    } catch (error) {
      console.error(error);
    }
  };

  //Pdf getting function
  const getPdfInfo = async (filename) => {
    try {
      const res = await axios.get(`${apiUrl}getFile`, {
        params: {
          filePath: filename,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "arraybuffer",
      });
      setIsProgressVisible(false);
      const fileType = res.headers["content-type"];
      const blob = new Blob([res.data], { type: fileType });
      const url = window.URL.createObjectURL(blob);
      setPdfSrc(url);
    } catch (error) {
      console.error(error);
    }
  };
  function arrayBufferToBase64(buffer) {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
  const fileTypeExtractor = (file) => {
    const partBeforeSlash = file.split("/")[0];
    return partBeforeSlash;
  };

  useEffect(() => {
    return () => {
      if (audioSrc) {
        URL.revokeObjectURL(audioSrc);
      }
    };
  }, [audioSrc]);

  const zoomIn = () => setZoomLevel((prevZoom) => Math.min(prevZoom + 0.2, 3));
  const zoomOut = () => setZoomLevel((prevZoom) => Math.max(prevZoom - 0.2, 1));
  const toggleFullscreen = () => {
    const modalElement = document.getElementById("modal-container");

    if (!isFullscreen) {
      if (modalElement.requestFullscreen) {
        modalElement.requestFullscreen();
      } else if (modalElement.mozRequestFullScreen) {
        // Firefox
        modalElement.mozRequestFullScreen();
      } else if (modalElement.webkitRequestFullscreen) {
        // Chrome, Safari, and Opera
        modalElement.webkitRequestFullscreen();
      } else if (modalElement.msRequestFullscreen) {
        // IE/Edge
        modalElement.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.mozCancelFullScreen) {
        // Firefox
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) {
        // Chrome, Safari, and Opera
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        // IE/Edge
        document.msExitFullscreen();
      }
    }

    setIsFullscreen((prev) => !prev);
  };

  const handleImageShow = () => setShowImage(true);
  const handleImageClose = () => {
    // console.log("Close button clicked!");

    // Exit fullscreen if currently in fullscreen mode
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }

    setIsFullscreen(false); // Reset fullscreen state
    setZoomLevel(1); // Reset zoom level to default
    setShowImage(false);
    setCurrentImageIndex(0);
    setImageSrc("");
    setVideoSrc("");
    setAudioSrc("");
    setPdfSrc("");
  };



  // Add this helper function at the top of your component file, outside the component
  const getFileIcon = (file) => {
    // First check: if shared, always return sharedIcon
    // if (file.isShared) {
    //   // return sharedIcon;
    // }

    // Second check: if it's a folder, return folder icon
    if (file.isFolder) {
      return file.icon || svgFolder;
    }

    // If it's a file, check file type
    if (!file.fileType) {
      return file.icon || svgDoc;
    }

    const fileType = file.fileType.toLowerCase();

    // Image formats
    if (['jpg', 'jpeg'].includes(fileType)) {
      return file.icon || svgJpg;
    }
    if (fileType === 'png') {
      return file.icon || svgPng;
    }
    if (['webp', 'gif', 'svg', 'hevc', 'heif'].includes(fileType)) {
      return file.icon || svgJpg; // or create separate icons for these
    }

    // Document formats
    if (['pdf', 'doc', 'docx'].includes(fileType)) {
      return file.icon || svgDoc;
    }
    if (fileType === 'txt') {
      return file.icon || svgTxt;
    }

    // Audio formats
    if (['mp3', 'wav', 'ogg', 'aac'].includes(fileType)) {
      return file.icon || svgMp3;
    }

    // Video formats
    if (['mp4', 'mov', 'mkv', 'mpeg', 'webm'].includes(fileType)) {
      return file.icon || svgMp4;
    }

    // Archive formats
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(fileType)) {
      return file.icon || svgZip;
    }

    // Default fallback
    return file.icon || svgDoc;
  };






  const handleNext = () => {
    setErrorMessage2("");
    setIsProgressVisible(true);
    setCurrentImageIndex((prevIndex) => {
      let newIndex = (prevIndex + 1) % files.length;
      let fileType = files[newIndex].fileType;

      // Skip folders and audio (audio uses floating player, not preview modal)
      while (
        (!fileType || isAudioExtension(fileType)) &&
        files.length > 0
      ) {
        newIndex = (newIndex + 1) % files.length;
        fileType = files[newIndex].fileType;

        if (newIndex === prevIndex) {
          setErrorMessage2("No previewable files available");
          setIsProgressVisible(false);
          return prevIndex;
        }
      }

      if (
        fileType === "jpeg" ||
        fileType === "jpg" ||
        fileType === "png" ||
        fileType === "gif" ||
        fileType === "hevc" ||
        fileType === "heif" ||
        fileType === "JPEG" ||
        fileType === "JPG" ||
        fileType === "PNG" ||
        fileType === "GIF" ||
        fileType === "HEVC" ||
        fileType === "HEIF" ||
        fileType === "svg" ||
        fileType === "SVG" ||
        fileType === "webp" ||
        fileType === "WEBP"
      ) {
        setVideoSrc("");
        setAudioSrc("");
        setPdfSrc("");
        getImageInfo(files[newIndex].fileName);
        console.log("mantra", files[newIndex].fileName);
        setModalFile(files[newIndex].fileName);
      } else if (
        fileType === "pdf" ||
        fileType === "PDF" ||
        fileType === "txt" ||
        fileType === "TXT"
      ) {
        setImageSrc("");
        setVideoSrc("");
        setAudioSrc("");
        getPdfInfo(files[newIndex].fileName);
        setModalFile(files[newIndex].fileName);
      } else if (
        fileType === "mkv" ||
        fileType === "mp4" ||
        fileType === "mov" ||
        fileType === "mpeg" ||
        fileType === "webm" ||
        fileType === "MOV"
      ) {
        setImageSrc("");
        setAudioSrc("");
        setPdfSrc("");
        setIsProgressVisible(false);
        setVideoSrc(files[newIndex].fileName);
        setModalFile(files[newIndex].fileName);
      } else {
        setImageSrc("");
        setAudioSrc("");
        setPdfSrc("");
        setVideoSrc("");
        setIsProgressVisible(false);
        setErrorMessage2("Unsupported file format");
        setModalFile(files[newIndex].fileName);
      }

      setZoomLevel(1);
      return newIndex;
    });
  };

  const handlePrev = () => {
    setErrorMessage2("");
    setIsProgressVisible(true);
    setCurrentImageIndex((prevIndex) => {
      let newIndex = (prevIndex - 1 + files.length) % files.length;
      let fileType = files[newIndex].fileType;

      // Skip folders and audio (audio uses floating player, not preview modal)
      while (
        (!fileType || isAudioExtension(fileType)) &&
        files.length > 0
      ) {
        newIndex = (newIndex - 1 + files.length) % files.length;
        fileType = files[newIndex].fileType;

        if (newIndex === prevIndex) {
          setErrorMessage2("No previewable files available");
          setIsProgressVisible(false);
          return prevIndex;
        }
      }

      if (
        fileType === "jpeg" ||
        fileType === "jpg" ||
        fileType === "png" ||
        fileType === "gif" ||
        fileType === "hevc" ||
        fileType === "heif" ||
        fileType === "JPEG" ||
        fileType === "JPG" ||
        fileType === "PNG" ||
        fileType === "GIF" ||
        fileType === "HEVC" ||
        fileType === "HEIF" ||
        fileType === "svg" ||
        fileType === "SVG" ||
        fileType === "webp" ||
        fileType === "WEBP"
      ) {
        setVideoSrc("");
        setAudioSrc("");
        setPdfSrc("");
        getImageInfo(files[newIndex].fileName);
        setModalFile(files[newIndex].fileName);
      } else if (
        fileType === "pdf" ||
        fileType === "PDF" ||
        fileType === "txt" ||
        fileType === "TXT"
      ) {
        setImageSrc("");
        setVideoSrc("");
        setAudioSrc("");
        getPdfInfo(files[newIndex].fileName);
        setModalFile(files[newIndex].fileName);
      } else if (
        fileType === "mkv" ||
        fileType === "mp4" ||
        fileType === "mov" ||
        fileType === "mpeg" ||
        fileType === "webm" ||
        fileType === "MOV"
      ) {
        setImageSrc("");
        setAudioSrc("");
        setPdfSrc("");
        setIsProgressVisible(false);
        setVideoSrc(files[newIndex].fileName);
        setModalFile(files[newIndex].fileName);
      } else {
        setImageSrc("");
        setAudioSrc("");
        setPdfSrc("");
        setVideoSrc("");
        setIsProgressVisible(false);
        setErrorMessage2("Unsupported file format");
        setModalFile(files[newIndex].fileName);
      }
      setZoomLevel(1);
      return newIndex;
    });
  };

  //Handle prev by arrow
  useEffect(() => {
    // Function to handle keydown events
    const handleKeyDown = (event) => {
      if (showImage && event.key === "ArrowLeft") {
        handlePrev(); // Trigger the function when the left arrow key is pressed and the modal is open
      }
    };

    // Add the event listener when the component mounts
    window.addEventListener("keydown", handleKeyDown);

    // Clean up the event listener when the component unmounts
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showImage]);

  useEffect(() => {
    // Function to handle keydown events
    const handleKeyDown = (event) => {
      if (showImage) {
        if (event.key === "ArrowLeft") {
          handlePrev(); // Trigger handlePrev when the left arrow key is pressed
        } else if (event.key === "ArrowRight") {
          handleNext(); // Trigger handleNext when the right arrow key is pressed
        }
      }
    };

    // Add the event listener when the component mounts
    window.addEventListener("keydown", handleKeyDown);

    // Clean up the event listener when the component unmounts
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showImage]);

  function getTextAfterLastSlash(text) {
    if (text.includes("/")) {
      return text.substring(text.lastIndexOf("/") + 1);
    } else {
      return text;
    }
  }

  // Assuming rootsize is in MB
  // const rootSizeInMB = parseFloat(rootsize);
  // const rootSizeInGB = rootSizeInMB / 1024;
  // const totalGB = 20;
  // const remainingGB = totalGB - rootSizeInGB;

  return (
    <>
      <ChakraProvider></ChakraProvider>
      <SideNav />
      <div className="container-fluid page-body-wrapper">
        <nav className="navbar p-0 fixed-top d-flex flex-row">
          <div className="navbar-brand-wrapper d-flex d-lg-none align-items-center justify-content-center">
            <a className="navbar-brand brand-logo-mini" href="#">
              <img src={Logo} alt="logo" />
            </a>
          </div>
          <div className="navbar-menu-wrapper flex-grow d-flex align-items-stretch">
            <ToggleNav />
            <div className="navbar-nav page_title">
              <h1>User Profile</h1>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="main-panel">
          <div className="content-wrapper" style={{ padding: "15px" }}>
            <div className="row">
              <div className="col-lg-6 mt-2">
                <div className="profile_box">
                  <div className="profile_row">
                    <div className="img_profile">
                      {/* <img src={avatar} alt={AvatarDefault}/> */}
                      <img
                        src={avatar || AvatarDefault}
                        alt="Avatar"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = AvatarDefault;
                        }}
                      />


                    </div>

                    <div className="profile_text">
                      <h5> {name}</h5>
                      <h6>
                        {/* User Permission: <span>View Only</span> */}
                        User Plan: <span>{displayedPlan} </span>
                      </h6>
                      <p>
                        <span>Email:</span> {eemail}
                      </p>
                      {/* <p>
                        <span>Mobile:</span> {number}
                      </p> */}
                      {number && (
                        <p>
                          <span>Mobile:</span> {number}
                        </p>
                      )}

                      <div className="delete_edit_div">
                        <button
                          className="btn__edit__profile"
                          onClick={showModal}
                        >
                          Edit Profile
                        </button>
                        <button
                          onClick={() => setFirstPopup(true)}
                          className="btn__delete__profile"
                          disabled={isDeletingAccount}
                        >
                          Delete Account
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-lg-6 mt-2">
                <div className="profile_box">
                  <div className="profile_row">
                    <div
                      className="CircularProgress_bar"
                      style={{ textAlign: "center", paddingLeft: 30 }}
                    >
                      {/* <Progress
                        type="circle"
                        // percent={(rootSize / (20 * 1024 * 1024 * 1024)) * 100}
                        // percent={(rootSize / (50 * 1024 * 1024 * 1024)) * 100}
                        percent={(usedBytes / totalBytes) * 100}

                        strokeWidth={25}
                        strokeColor="#F68D2B"
                        trailColor="#FFE7C6"
                        strokeLinecap="butt"
                        format={() => {
                          const percentUsed =
                            // (rootSize / (20 * 1024 * 1024 * 1024)) * 100;
                            (rootSize / (50 * 1024 * 1024 * 1024)) * 100;
                          return (
                            <div>
                              <div className="percent_text">
                                {Math.round(percentUsed)}%
                              </div>
                              <div
                                style={{
                                  fontSize: "13px",
                                  color: "#BDBDBD",
                                  fontWeight: 600,
                                }}
                              >
                                Used
                              </div>
                            </div>
                          );
                        }}
                        size={180}
                      /> */}
                      <Progress
                        type="circle"
                        percent={(usedBytes / totalBytes) * 100}
                        strokeWidth={25}
                        strokeColor="#F68D2B"
                        trailColor="#FFE7C6"
                        strokeLinecap="butt"
                        format={() => {
                          const percentUsed = (usedBytes / totalBytes) * 100;
                          return (
                            <div>
                              <div className="percent_text">{Math.round(percentUsed)}%</div>
                              <div
                                style={{
                                  fontSize: "13px",
                                  color: "#BDBDBD",
                                  fontWeight: 600,
                                }}
                              >
                                Used
                              </div>
                            </div>
                          );
                        }}
                        size={180}
                      />

                    </div>

                    <div className="storage_text">

                      <div className="storage_used">
                        <h5>Storage Used</h5>
                        <h4>
                          {/* {usedGB.toFixed(2)} GB / {(totalBytes / 1024 ** 3).toFixed(2)} GB */}
                          {usedDisplay}  / {totalDisplay}
                        </h4>
                      </div>

                      <div className="storage_remaining">
                        <h5>Storage Remaining</h5>
                        <h4>
                          {/* {remainingGB.toFixed(2)} GB / {(totalBytes / 1024 ** 3).toFixed(2)} GB */}
                          {remainingDisplay}  / {totalDisplay}
                        </h4>
                      </div>

                    </div>

                  </div>
                </div>
              </div>
            </div>

            <div className="profile_row">
              <div className="profile_table_box">
                <div className="profile_table_title_row">
                  <h5>Recent Uploads</h5>
                </div>

                <div className="recent_table_box">
                  <div className="table-responsive">
                    <table className="table table-striped">
                      <thead>
                        <tr>
                          <th>File Name</th>
                          <th className="text-center">Date Uploaded</th>
                          <th className="text_right">File Size</th>
                          <th className="text-center">Type</th>
                        </tr>
                      </thead>

                      <tbody>
                        {isLoading ? (
                          [...Array(5)].map((_, index) => (
                            <tr key={index}>
                              <td>
                                <div className="skeleton skeleton-filename" />
                              </td>
                              <td className="text-center">
                                <div className="skeleton skeleton-text" />
                              </td>
                              <td className="text_right">
                                <div className="skeleton skeleton-text" />
                              </td>
                              <td className="text-center">
                                <div className="skeleton skeleton-pill" />
                              </td>
                            </tr>
                          ))
                        ) : files.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="text-center">
                              No Recent files available.
                            </td>
                          </tr>
                        ) : (
                          files.map((file, index) => (
                            <tr key={index}>
                              <td>
                                <div className="filename_row">
                                  <span>
                                    <img
                                      src={getFileIcon(file)}
                                      height={32}
                                      alt="file icon"
                                      onError={(e) => {
                                        e.currentTarget.onerror = null; // Prevent infinite loop
                                        e.currentTarget.src = file.isFolder ? svgFolder : svgDoc;
                                      }}
                                    />
                                  </span>
                                  <span
                                    onClick={() => {
                                      setErrorMessage2("");

                                      const fname = file.fileName;
                                      const index = files.findIndex(
                                        (file) => file.fileName === fname
                                      );
                                      if (index !== -1) {
                                        setCurrentImageIndex(index);
                                      }

                                      const openPreview = () => {
                                        setModalFile(file.fileName);
                                        handleImageShow();
                                      };

                                      const isVideo = [
                                        "mkv",
                                        "mp4",
                                        "mov",
                                        "mpeg",
                                        "webm",
                                        "MOV",
                                      ];
                                      const isImage = [
                                        "jpeg",
                                        "jpg",
                                        "png",
                                        "gif",
                                        "hevc",
                                        "heif",
                                        "svg",
                                        "webp",
                                        "JPEG",
                                        "JPG",
                                        "PNG",
                                        "GIF",
                                        "HEVC",
                                        "HEIF",
                                        "SVG",
                                        "WEBP",
                                      ];
                                      const isAudio = [
                                        "mp3",
                                        "wav",
                                        "ogg",
                                        "aac",
                                        "MP3",
                                        "WAV",
                                        "OGG",
                                        "AAC",
                                      ];
                                      const isDoc = [
                                        "pdf",
                                        "PDF",
                                        "txt",
                                        "TXT",
                                      ];

                                      if (isVideo.includes(file.fileType)) {
                                        openPreview();
                                        setVideoSrc(file.fileName);
                                      } else if (
                                        isImage.includes(file.fileType)
                                      ) {
                                        openPreview();
                                        getImageInfo(file.fileName);
                                      } else if (
                                        isAudio.includes(file.fileType)
                                      ) {
                                        playAudioFile(files, file.fileName);
                                      } else if (
                                        isDoc.includes(file.fileType)
                                      ) {
                                        openPreview();
                                        getPdfInfo(file.fileName);
                                      } else {
                                        if (file.isFolder === true) {
                                          console.log("It's a folder.");
                                        } else {
                                          openPreview();
                                          setErrorMessage2(
                                            "File format not supported!"
                                          );
                                        }
                                      }
                                    }}
                                    className="filename_link"
                                  >
                                    {getTextAfterLastSlash(file.fileName)}
                                  </span>
                                </div>
                              </td>
                              <td className="text-center">
                                {file.uploadDateTime}
                              </td>
                              <td className="text_right">{file.fileSize}</td>
                              <td className="text-center">
                                <div className="type_pp">{file.ACL}</div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="profile_stolity_app">
                <h5>
                  Get the Stolity <br />
                  App today!
                </h5>
                <br />
                Available on both the App <br />
                Store & Play Store
                <div className="profile_stolity_app_bottom">
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <a
                      href="https://play.google.com/store/apps/details?id=com.stolity.infomanav.com&pcampaignid=web_share"
                      className="btn_app_download"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Play Store
                    </a>
                    <a
                      href="https://apps.apple.com/in/app/stolity/id6737306442"
                      className="btn_app_download"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      App Store
                    </a>
                  </div>

                  <img src={ImgStolityApp} className="img_responsive" alt="Stolity app" />
                </div>
              </div>
            </div>
          </div>
          <Footer />
        </div>
        {/* main-panel ends */}
      </div>

      {/* First Confirmation Modal */}
      {/* Delete Account Button */}

      {/* First Confirmation Modal */}
      {firstPopup && (
        <div className="rename_popup_wrapper">
          <div className="rename_modal">
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: "15px",
              }}
            >
              <img src={DeletePopup} alt="Delete Icon" />
            </div>
            <h2 className="rename_title2">
              Are you sure you want to delete your account?
            </h2>
            <p className="rename_subtext">This action cannot be undone.</p>
            <div className="rename_buttons">
              <button
                type="button"
                className="rename_btn cancel"
                onClick={closeDeleteModals}
                disabled={isDeletingAccount}
              >
                No
              </button>
              <button
                type="button"
                className="rename_btn ok"
                style={{ backgroundColor: "#FF0000" }}
                disabled={isDeletingAccount}
                onClick={() => {
                  setFirstPopup(false);
                  setSecondPopup(true);
                }}
              >
                Yes, Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Second (Final) Confirmation Modal */}
      {secondPopup && (
        <div className="rename_popup_wrapper">
          <div
            className="rename_modal"
            style={{ width: "420px", padding: "32px 20px" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: "15px",
              }}
            >
              <img src={DeletePopup} alt="Delete Icon" />
            </div>
            <h2 className="rename_title2">Your data will be lost forever.</h2>
            <p className="rename_subtext">This action cannot be reversed.</p>
            <div className="rename_buttons">
              <button
                type="button"
                className="rename_btn cancel"
                onClick={closeDeleteModals}
                disabled={isDeletingAccount}
              >
                No
              </button>
              <button
                type="button"
                className="rename_btn ok"
                style={{ backgroundColor: "#FF0000" }}
                onClick={handleFinalDelete}
                disabled={isDeletingAccount}
                aria-busy={isDeletingAccount}
              >
                {isDeletingAccount ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isDeletingAccount && <Loader2 />}

      <Modal
        title=""
        open={isModalOpen}
        footer={null}
        onCancel={handleCancel}
        width={760}
        centered
        destroyOnClose
        wrapClassName="edit-profile-modal-wrap"
      >
        <div className="edit-profile-modal">
          <div className="edit-profile-header">
            <h4>Edit Profile</h4>
            <p>Manage your personal details and account security</p>
          </div>

          <div className="edit-profile-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={editProfileTab === "personal"}
              className={`edit-profile-tab ${editProfileTab === "personal" ? "active" : ""}`}
              onClick={() => setEditProfileTab("personal")}
            >
              Personal
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={editProfileTab === "password"}
              className={`edit-profile-tab ${editProfileTab === "password" ? "active" : ""}`}
              onClick={() => setEditProfileTab("password")}
            >
              Password
            </button>
          </div>

          {editProfileTab === "personal" && (
            <div className="edit-profile-panel">
          {/* AVATAR SELECTION */}
          <div className="avatar-section">
            <h6 className="text-center">Choose an avatar</h6>
            <div className="avatar-list">
              {!avatarsReady ? (
                <div className="avatar-list-loader" aria-busy="true" aria-live="polite">
                  <img src={loaderGif} alt="Loading avatars" />
                  <span>Loading avatars…</span>
                </div>
              ) : (
                localAvatarOptions.map((localSrc, index) => {
                  const apiAvatar = Array.isArray(avatarBox)
                    ? avatarBox[index]
                    : null;
                  const avatarSrc = apiAvatar?.url || localSrc;

                  return (
                    <button
                      key={apiAvatar?.key || `local-avatar-${index}`}
                      type="button"
                      className={`avatar-btn ${activeIndex === index ? "active" : ""}`}
                      onClick={() => {
                        setSelectedAvatar(avatarSrc);
                        setActiveIndex(index);
                        setUploadedAvatar(null);
                      }}
                    >
                      <img
                        src={avatarSrc}
                        alt={`Avatar ${index + 1}`}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = localSrc;
                        }}
                      />
                    </button>
                  );
                })
              )}

              {/* Show uploaded avatar preview */}
              {/* {uploadedAvatar ? (
                <div className="avatar-btn custom-avatar-preview active">
                  <img src={uploadedAvatar} alt="Uploaded Avatar" />
                  <span
                    className="btn-delete-avatar"
                    onClick={handleDeleteUploadedAvatar}
                  >
                    <i className="icon-delete2" />
                  </span>
                </div>
              ) : (
                <>
                  <input
                    type="file"
                    id="avatarUploadInput"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => handleAvatarUpload(e)}
                  />
                  <button
                    className="avatar-btn add-avatar"
                    onClick={() =>
                      document.getElementById("avatarUploadInput").click()
                    }
                  >
                    <span>+</span>
                  </button>
                </>
              )} */}
            </div>
          </div>

          {/* PERSONAL INFORMATION */}
          <div className="profile-section">
            <h5>Personal details</h5>

            {/* Optional: show general form error if any */}
            {formErrors?.general && (
              <div
                style={{
                  marginBottom: '1rem',
                  padding: '0.75rem 1.25rem',
                  color: '#856404',
                  backgroundColor: '#fff3cd',
                  border: '1px solid #ffeeba',
                  borderRadius: '0.25rem',
                }}
              >
                {formErrors.general}
              </div>
            )}

            <div className="row">
              {/* First Name */}
              <div className="col-6">
                <div className="form-group">
                  <label className="form-label">
                    First Name <span style={{ color: "#dc3545" }}>*</span>
                  </label>
                  <input
                    value={firstName}
                    onChange={handleChangeFirstName}
                    type="text"
                    placeholder="Enter First Name"
                    style={{
                      width: '100%',
                      padding: '0.375rem 0.75rem',
                      border: formErrors?.firstName
                        ? '1px solid #dc3545'
                        : '1px solid #ced4da',
                      borderRadius: '0.25rem',
                      outline: 'none',
                    }}
                  />
                  {formErrors?.firstName && (
                    <div
                      style={{
                        color: '#dc3545',
                        fontSize: '0.875rem',
                        marginTop: '0.25rem',
                        display: 'block',
                      }}
                    >
                      {formErrors.firstName}
                    </div>
                  )}
                </div>
              </div>

              {/* Last Name */}
              <div className="col-6">
                <div className="form-group">
                  <label className="form-label">
                    Last Name <span style={{ color: "#dc3545" }}>*</span>
                  </label>
                  <input
                    value={lastName}
                    onChange={handleChangeLastName}
                    type="text"
                    placeholder="Enter Last Name"
                    style={{
                      width: '100%',
                      padding: '0.375rem 0.75rem',
                      border: formErrors?.lastName
                        ? '1px solid #dc3545'
                        : '1px solid #ced4da',
                      borderRadius: '0.25rem',
                      outline: 'none',
                    }}
                  />
                  {formErrors?.lastName && (
                    <div
                      style={{
                        color: '#dc3545',
                        fontSize: '0.875rem',
                        marginTop: '0.25rem',
                        display: 'block',
                      }}
                    >
                      {formErrors.lastName}
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile */}
              <div className="col-6">
                <div className="form-group">
                  <label className="form-label">
                    Mobile <span style={{ color: "#dc3545" }}>*</span>
                  </label>
                  <input
                    value={number}
                    onChange={handleChangeNumber}
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="Enter 10-digit Mobile No."
                    style={{
                      width: '100%',
                      padding: '0.375rem 0.75rem',
                      border: formErrors?.number
                        ? '1px solid #dc3545'
                        : '1px solid #ced4da',
                      borderRadius: '0.25rem',
                      outline: 'none',
                    }}
                  />
                  {formErrors?.number && (
                    <div
                      style={{
                        color: '#dc3545',
                        fontSize: '0.875rem',
                        marginTop: '0.25rem',
                        display: 'block',
                      }}
                    >
                      {formErrors.number}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="button-group edit-profile-actions">
            <button
              className="btn-save"
              onClick={async () => {
                const personalValid = validatePersonalInfo();
                if (!personalValid) {
                  showToast("error", "Please correct the errors in personal information.");
                  return;
                }
                const profileOk = await handleChangeInfo();
                if (profileOk) {
                  handleCancel();
                }
              }}
            >
              Update Profile
            </button>
            <button className="btn-cancel" onClick={handleCancel}>
              Cancel
            </button>
          </div>
            </div>
          )}

          {editProfileTab === "password" && (
            <div className="edit-profile-panel">
          {!isGoogleAuth && (
            <>
              {/* PASSWORD SECTION */}
              <div className="profile-section">
                <h5>Account security</h5>
                <p className="edit-profile-section-copy">
                  Update your password to keep your Stolity account secure.
                </p>

                {passwordErrors.general && (
                  <div
                    style={{
                      marginBottom: '1rem',
                      padding: '0.75rem 1.25rem',
                      color: '#856404',
                      backgroundColor: '#fff3cd',
                      border: '1px solid #ffeeba',
                      borderRadius: '0.25rem',
                    }}
                  >
                    {passwordErrors.general}
                  </div>
                )}

                <div className="row">
                  {/* Current Password */}
                  <div className="col-4">
                    <div className="form-group">
                      <label className="form-label">Current Password</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showPassword1 ? "text" : "password"}
                          value={oldPass}
                          onChange={handleOldPassChange}
                          placeholder="Current Password"
                          style={{
                            width: '100%',
                            padding: '0.375rem 0.75rem',
                            paddingRight: '2.5rem',
                            border: passwordErrors.oldPass
                              ? '1px solid #dc3545'
                              : '1px solid #ced4da',
                            borderRadius: '0.25rem',
                            backgroundImage: 'none',
                            outline: 'none',
                          }}
                        />
                        <button
                          type="button"
                          onClick={togglePasswordVisibility1}
                          style={{
                            position: 'absolute',
                            top: '50%',
                            right: '0.5rem',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0',
                            fontSize: '1.1rem',
                            color: '#6c757d',
                          }}
                        >
                          {showPassword1 ? <PasswordShow /> : <PasswordHide />}
                        </button>
                      </div>
                      {passwordErrors.oldPass && (
                        <div
                          style={{
                            display: 'block',
                            color: '#dc3545',
                            fontSize: '0.875rem',
                            marginTop: '0.25rem',
                          }}
                        >
                          {passwordErrors.oldPass}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="col-4">
                    <div className="form-group">
                      <label className="form-label">New Password</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showPassword2 ? "text" : "password"}
                          value={newPass}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNewPass(val);
                            validatePassword(val);           // ← reuse same function
                            setPasswordTouched(true);
                          }}
                          onFocus={() => setPasswordTouched(true)}
                          onBlur={() => setPasswordTouched(true)}
                          placeholder="New Password"
                          style={{
                            width: '100%',
                            padding: '0.375rem 0.75rem',
                            paddingRight: '2.5rem',
                            border: passwordErrors.newPass
                              ? '1px solid #dc3545'
                              : '1px solid #ced4da',
                            borderRadius: '0.25rem',
                            backgroundImage: 'none',
                            outline: 'none',
                          }}
                        />
                        <button
                          type="button"
                          onClick={togglePasswordVisibility2}
                          style={{
                            position: 'absolute',
                            top: '50%',
                            right: '0.5rem',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0',
                            fontSize: '1.1rem',
                            color: '#6c757d',
                          }}
                        >
                          {showPassword2 ? <PasswordShow /> : <PasswordHide />}
                        </button>
                      </div>

                      {/* Password strength feedback - 3 left / 2 right columns */}
                      {/* Password strength feedback - shows only when needed, hides when all are perfect */}
                      {(passwordTouched || newPass) && !(
                        passwordStrength.length &&
                        passwordStrength.uppercase &&
                        passwordStrength.lowercase &&
                        passwordStrength.number &&
                        passwordStrength.special
                      ) && (
                          <div
                            className="password-requirements mt-2"
                            style={{
                              fontSize: "0.84rem",
                              color: "#4b5563",
                              padding: "6px 10px",
                              background: "rgba(243, 244, 246, 0.5)",
                              borderRadius: "6px",
                              marginTop: "6px",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "12px 24px",
                              }}
                            >
                              {/* Left column - 3 items */}
                              <div style={{ flex: "1 1 45%", minWidth: "100px" }}>
                                <div style={{ marginBottom: "3px", color: passwordStrength.length ? "#10b981" : "#6b7280" }}>
                                  {passwordStrength.length ? "✔" : "•"} 8+ chars
                                </div>
                                <div style={{ marginBottom: "3px", color: passwordStrength.uppercase ? "#10b981" : "#6b7280" }}>
                                  {passwordStrength.uppercase ? "✔" : "•"} Uppercase
                                </div>
                                <div style={{ color: passwordStrength.lowercase ? "#10b981" : "#6b7280" }}>
                                  {passwordStrength.lowercase ? "✔" : "•"} Lowercase
                                </div>
                              </div>

                              {/* Right column - 2 items */}
                              <div style={{ flex: "1 1 45%", minWidth: "100px" }}>
                                <div style={{ marginBottom: "3px", color: passwordStrength.number ? "#10b981" : "#6b7280" }}>
                                  {passwordStrength.number ? "✔" : "•"} Number
                                </div>
                                <div style={{ color: passwordStrength.special ? "#10b981" : "#6b7280" }}>
                                  {passwordStrength.special ? "✔" : "•"} Special char
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                      {passwordErrors.newPass && (
                        <div
                          style={{
                            display: 'block',
                            color: '#dc3545',
                            fontSize: '0.875rem',
                            marginTop: '0.25rem',
                          }}
                        >
                          {passwordErrors.newPass}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="col-4">
                    <div className="form-group">
                      <label className="form-label">Confirm Password</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showPassword3 ? "text" : "password"}
                          value={confirmPass}
                          onChange={(e) => {
                            const val = e.target.value;
                            setConfirmPass(val);
                            setConfirmTouched(true);

                            if (val && val !== newPass) {
                              setConfirmPasswordError("Passwords do not match");
                            } else {
                              setConfirmPasswordError("");
                            }
                          }}
                          onFocus={() => setConfirmTouched(true)}
                          onBlur={() => setConfirmTouched(true)}
                          placeholder="Confirm Password"
                          style={{
                            width: '100%',
                            padding: '0.375rem 0.75rem',
                            paddingRight: '2.5rem',
                            border: passwordErrors.confirmPass
                              ? '1px solid #dc3545'
                              : '1px solid #ced4da',
                            borderRadius: '0.25rem',
                            backgroundImage: 'none',
                            outline: 'none',
                          }}
                        />
                        <button
                          type="button"
                          onClick={togglePasswordVisibility3}
                          style={{
                            position: 'absolute',
                            top: '50%',
                            right: '0.5rem',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0',
                            fontSize: '1.1rem',
                            color: '#6c757d',
                          }}
                        >
                          {showPassword3 ? <PasswordShow /> : <PasswordHide />}
                        </button>
                      </div>

                      {confirmTouched && confirmPasswordError && (
                        <div
                          style={{
                            display: 'block',
                            color: '#dc3545',
                            fontSize: '0.875rem',
                            marginTop: '0.25rem',
                          }}
                        >
                          {confirmPasswordError}
                        </div>
                      )}

                      {passwordErrors.confirmPass && (
                        <div
                          style={{
                            display: 'block',
                            color: '#dc3545',
                            fontSize: '0.875rem',
                            marginTop: '0.25rem',
                          }}
                        >
                          {passwordErrors.confirmPass}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}




          {isGoogleAuth && (
            <div className="profile-section google-otp-section">
              <h5>Google account security</h5>
              <p className="edit-profile-section-copy">
                Signed in with Google — verify your email once, then set a password for Stolity login.
              </p>

              <div className="google-otp-steps" aria-label="Password reset steps">
                <div className={`google-otp-step ${otpFlowStep >= 0 && otpFlowStep < 3 ? "active" : ""} ${otpFlowStep === 3 ? "done" : ""}`}>
                  <span className="google-otp-step-index">1</span>
                  <span className="google-otp-step-label">Verify email</span>
                </div>
                <div className={`google-otp-step-line ${otpFlowStep === 3 ? "done" : ""}`} />
                <div className={`google-otp-step ${otpFlowStep === 3 ? "active" : ""}`}>
                  <span className="google-otp-step-index">2</span>
                  <span className="google-otp-step-label">Set password</span>
                </div>
              </div>

              {otpFlowStep === 0 && (
                <div className="google-otp-card">
                  <div className="google-otp-card-icon" aria-hidden="true">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                      <path d="M12 3l7 3v5c0 5-3.2 9.4-7 10.7C8.2 20.4 5 16 5 11V6l7-3z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
                      <path d="M9.5 12.2l1.8 1.8 3.4-3.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="google-otp-card-body">
                    <h6>Send a one-time code</h6>
                    <p>
                      We’ll email a 6-digit code to{" "}
                      <strong>{maskEmail(email)}</strong> so you can create a Stolity password.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="google-otp-primary"
                    onClick={() => {
                      if (email) {
                        setOtpEmail(email);
                        handleRequestOtp();
                      } else {
                        showToast("error", "Email not found in session storage");
                      }
                    }}
                    disabled={otpBusy}
                  >
                    {otpBusy ? "Sending…" : "Request OTP"}
                  </button>
                </div>
              )}

              {otpFlowStep === 2 && (
                <div className="google-otp-card google-otp-verify">
                  <div className="google-otp-card-body">
                    <h6>Enter verification code</h6>
                    <p>
                      Code sent to <strong>{maskEmail(email)}</strong>. Paste or type the 6 digits below.
                    </p>
                  </div>

                  <div
                    className="google-otp-inputs"
                    onPaste={(e) => {
                      const pasted = e.clipboardData
                        .getData("text")
                        .replace(/\D/g, "")
                        .slice(0, 6);
                      if (!pasted) return;
                      e.preventDefault();
                      setOtp(pasted);
                      const focusIndex = Math.min(pasted.length, 5);
                      const el = document.getElementById(`otp-input-${focusIndex}`);
                      if (el) el.focus();
                    }}
                  >
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <input
                        key={index}
                        id={`otp-input-${index}`}
                        type="text"
                        inputMode="numeric"
                        autoComplete={index === 0 ? "one-time-code" : "off"}
                        maxLength={1}
                        value={otp[index] || ""}
                        aria-label={`Digit ${index + 1}`}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "" || value.match(/^[0-9]$/)) {
                            const newOtp = otp.split("");
                            newOtp[index] = value;
                            setOtp(newOtp.join(""));
                            if (value && index < 5) {
                              document.getElementById(`otp-input-${index + 1}`)?.focus();
                            }
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Backspace" && !otp[index] && index > 0) {
                            document.getElementById(`otp-input-${index - 1}`)?.focus();
                          }
                          if (e.key === "Enter" && otp.length === 6) {
                            handleVerifyOtp();
                          }
                        }}
                        className="google-otp-digit"
                      />
                    ))}
                  </div>

                  <div className="google-otp-actions">
                    <button
                      type="button"
                      className="google-otp-primary"
                      onClick={handleVerifyOtp}
                      disabled={otpBusy || otp.length < 6}
                    >
                      {otpBusy ? "Verifying…" : "Verify OTP"}
                    </button>
                    <button
                      type="button"
                      className="google-otp-ghost"
                      onClick={handleResendOtp}
                      disabled={otpBusy || resendTimer > 0}
                    >
                      {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend code"}
                    </button>
                  </div>
                </div>
              )}

              {otpFlowStep === 3 && (
                <div className="google-otp-card google-otp-password">
                  <div className="google-otp-card-body">
                    <h6>Create your password</h6>
                    <p>Email verified. Choose a strong password for future Stolity sign-ins.</p>
                  </div>

                  <div className="google-otp-fields">
                    <div className="form-group">
                      <label className="form-label">New Password</label>
                      <div className="password-field">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="form-control"
                          placeholder="Enter new password"
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          className="password-toggle"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          aria-label={showNewPassword ? "Hide password" : "Show password"}
                        >
                          {showNewPassword ? <PasswordShow /> : <PasswordHide />}
                        </button>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Confirm Password</label>
                      <div className="password-field">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="form-control"
                          placeholder="Confirm new password"
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          className="password-toggle"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                        >
                          {showConfirmPassword ? <PasswordShow /> : <PasswordHide />}
                        </button>
                      </div>
                      {confirmPassword && newPassword !== confirmPassword && (
                        <div className="google-otp-field-error">Passwords do not match</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}










          {/* Password tab actions */}
          <div className="button-group edit-profile-actions">
              {!isGoogleAuth && (
                <button
                  className="btn-save"
                  onClick={async () => {
                    const passwordOk = await handlePassWordChange();
                    if (passwordOk) {
                      handleCancel();
                    }
                  }}
                  disabled={
                    isLoading ||
                    !oldPass.trim() ||
                    !newPass.trim() ||
                    !confirmPass.trim() ||
                    !passwordStrength.length ||
                    !passwordStrength.uppercase ||
                    !passwordStrength.lowercase ||
                    !passwordStrength.number ||
                    !passwordStrength.special ||
                    newPass !== confirmPass
                  }
                >
                  Change Password
                </button>
              )}
              {isGoogleAuth && otpFlowStep === 3 && (
                <button
                  className="btn-save"
                  onClick={async () => {
                    await handleResetPassword();
                  }}
                  disabled={
                    otpBusy ||
                    !newPassword.trim() ||
                    !confirmPassword.trim() ||
                    newPassword !== confirmPassword
                  }
                >
                  {otpBusy ? "Updating…" : "Update Password"}
                </button>
              )}
              <button className="btn-cancel" onClick={handleCancel}>
                Cancel
              </button>
            </div>
            </div>
          )}
        </div>
      </Modal>

      {/*All files Shower */}
      {showImage && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1300,
            padding: "16px",
            overflow: "auto",
          }}
          onClick={handleImageClose}           // click outside → close
        >
          {/* Inner container - stops click propagation */}
          <div
            style={{
              width: isFullscreen ? "100vw" : "100vw",
              // maxWidth: isFullscreen ? "none" : "800px",
              height: isFullscreen ? "100vh" : "90vh",
              // backgroundColor: "white",
              borderRadius: isFullscreen ? "0" : "12px",
              overflow: "hidden",
              // boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
              display: "flex",
              flexDirection: "column",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}   // prevent close when clicking inside
          >
            {/* Close button */}
            <button
              onClick={handleImageClose}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "rgba(0,0,0,0.5)",
                color: "white",
                border: "none",
                borderRadius: "50%",
                width: "40px",
                height: "40px",
                fontSize: "28px",
                lineHeight: "40px",
                textAlign: "center",
                cursor: "pointer",
                zIndex: 10,
              }}
            >
              ×
            </button>

            {/* Loader overlay when loading */}
            {isProgressVisible && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(255, 255, 255, 0)",
                  // background: "rgba(255,255,255,0.7)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 20,
                }}
              >
                {/* <img src={loaderGif} alt="Loading..." style={{ width: "80px" }} /> */}
                <Loader2 />
              </div>
            )}

            {/* Main content area */}
            <div
              style={{
                flex: 1,
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "auto",
                padding: isFullscreen ? "0" : "20px",
                background: isFullscreen ? "#000" : "#ffffff00",
              }}
            >
              {/* Prev button */}
              <button
                onClick={handlePrev}
                style={{
                  position: "absolute",
                  left: "20px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "rgba(0, 0, 0, 0.28)",
                  border: "none",
                  borderRadius: "50%",
                  width: "50px",
                  height: "50px",
                  fontSize: "28px",
                  cursor: "pointer",
                  color: "white",
                  zIndex: 5,
                  // boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
                }}
              >
                ❮
              </button>

              {/* Content */}
              <div
                style={{
                  width: "90%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: `scale(${zoomLevel})`,
                  transition: "transform 0.25s ease",
                }}
              >
                {videoSrc ? (
                  <VideoPlayer
                    url={buildVideoStreamUrl(apiUrl, token, videoSrc)}
                    fileName={videoSrc}
                  />
                ) : pdfSrc ? (
                  <iframe
                    src={pdfSrc}
                    title="PDF Preview"
                    style={{
                      width: "100%",
                      height: "100%",
                      border: "none",
                      background: "white",
                    }}
                  />
                ) : imageSrc ? (
                  <img
                    src={imageSrc}
                    alt="Preview"
                    decoding="async"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",
                      borderRadius: "8px",
                    }}
                  />
                ) : audioSrc ? (
                  <audio
                    controls
                    autoPlay
                    style={{ width: "80%", maxWidth: "600px" }}
                  >
                    <source src={audioSrc} type="audio/mpeg" />
                    <source src={audioSrc} type="audio/ogg" />
                    <source src={audioSrc} type="audio/wav" />
                    Your browser does not support the audio element.
                  </audio>
                ) : errorMessage2 ? (
                  <div style={{
                    textAlign: "center", color: "#d32f2f", fontSize: "18px", background: "white",
                    padding: " 5px 15px", borderRadius: "7px"
                  }}>
                    {errorMessage2}
                  </div>
                ) : (
                  <div style={{ color: "#666", fontSize: "18px" }}>
                    No preview available
                  </div>
                )}
              </div>

              {/* Next button */}
              <button
                onClick={handleNext}
                style={{
                  position: "absolute",
                  right: "20px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "rgba(0, 0, 0, 0.27)",
                  color: "white",
                  border: "none",
                  borderRadius: "50%",
                  width: "50px",
                  height: "50px",
                  fontSize: "28px",
                  cursor: "pointer",
                  zIndex: 5,
                  // boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
                }}
              >
                ❯
              </button>
            </div>




            {/* Footer controls */}
            <div
              style={{
                padding: "12px 20px",
                // borderTop: "1px solid #000000",
                // background: "white",
                display: "flex",
                justifyContent: "center",
                gap: "16px",
                flexWrap: "wrap",
              }}
            >
              {/* <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "#f5f5f5",
            padding: "8px 16px",
            borderRadius: "6px",
            border: "1px solid #ddd",
          }}
        >
          <button
            onClick={zoomIn}
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            <img src={zoomin} alt="Zoom In" style={{ width: "20px" }} />
          </button>
          <span style={{ fontWeight: 500 }}>Zoom</span>
          <button
            onClick={zoomOut}
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            <img src={zoomout} alt="Zoom Out" style={{ width: "20px" }} />
          </button>
        </div> */}

              {/* <button
          onClick={toggleFullscreen}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            background: "#f5f5f5",
            border: "1px solid #ddd",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          <img
            src={fullscreeen}
            alt="Fullscreen"
            style={{ width: "18px", height: "18px" }}
          />
          {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        </button> */}
            </div>
          </div>
        </div>
      )}


    </>
  );
};

export default UserProfile;
