import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

const STORAGE_WARNING_THRESHOLD = 0.9; // 90%
const CHECK_INTERVAL_MS = 10 * 1000;

const StorageWarningModal = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const subscription = useSelector((state) => state.subscription?.subscription);
  const specialUserFlag = useSelector((state) => state.subscription?.specialUserFlag);
  const folderSize = useSelector((state) => state.subscription?.folderSize || {});

  const [showModal, setShowModal] = useState(false);


  const latestDataRef = useRef({
    subscription,
    specialUserFlag,
    folderSize,
  });

  useEffect(() => {
    latestDataRef.current = {
      subscription,
      specialUserFlag,
      folderSize,
    };

   
  }, [subscription, specialUserFlag, folderSize]);

  const publicPaths = [
    "/login",
    "/Login",
    "/Signup",
    "/signup",
    "/forgot-password",
    "/ForgotPassword",
    "/careers",
    "/reset-password",
    "/",
  ];

  const isPublicRoute =
    publicPaths.includes(location.pathname) ||
    location.pathname.endsWith("/careers") ||
    location.pathname.endsWith("/careers/");

  

  const parseStorageToBytes = (storageStr) => {
    if (!storageStr) return 0;

    const parts = storageStr.trim().split(/\s+/);
    if (parts.length < 2) return 0;

    const value = parseFloat(parts[0]);
    if (isNaN(value)) return 0;

    const unit = parts[1].toUpperCase();

    const units = {
      KB: 1000,
      MB: 1000 ** 2,
      GB: 1000 ** 3,
      TB: 1000 ** 4,
      PB: 1000 ** 5,
    };

    return Math.round(value * (units[unit] || 1));
  };

  const calculateUsagePercent = () => {
    const { subscription, specialUserFlag, folderSize } = latestDataRef.current;

    const totalBytes = specialUserFlag
      ? 500 * 1_000_000_000
      : subscription?.storage
      ? parseStorageToBytes(subscription.storage)
      : 5 * 1_000_000_000;

    const usedBytes = folderSize?.sizeInBytes || 0;

    if (totalBytes <= 0) return 0;

    const percent = usedBytes / totalBytes;

    

    return percent;
  };

  const checkStorage = () => {
    if (isPublicRoute) return;

    const percentUsed = calculateUsagePercent();
    const alreadyShown = sessionStorage.getItem("storageWarningShown");

    if (percentUsed >= STORAGE_WARNING_THRESHOLD && !alreadyShown) {
      

      setShowModal(true);
      sessionStorage.setItem("storageWarningShown", "true");
    }

    else if (percentUsed >= STORAGE_WARNING_THRESHOLD && alreadyShown) {
      
    }

    if (percentUsed < STORAGE_WARNING_THRESHOLD) {
      if (showModal) {
        setShowModal(false);
      }
      sessionStorage.removeItem("storageWarningShown");
    }
  };

  useEffect(() => {
   checkStorage();
  }, [subscription, specialUserFlag, folderSize]);

  useEffect(() => {
   
    const interval = setInterval(() => {
      checkStorage();
    }, CHECK_INTERVAL_MS);

    return () => {
      clearInterval(interval);
    };
  }, []);

  if (isPublicRoute || !showModal) return null;


  return (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.45)",
      backdropFilter: "blur(4px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
      padding: "20px"
    }}
  >
    <div
      style={{
        background: "#ffffff",
        borderRadius: "20px",
        padding: "2.5rem 2.2rem",
        maxWidth: "440px",
        width: "100%",
        boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
        textAlign: "center",
        border: "1px solid #FFE3CA",
        animation: "modalFadeIn 0.35s ease"
      }}
    >
      
      {/* Icon */}
      <div
        style={{
          width: "70px",
          height: "70px",
          borderRadius: "50%",
          background: "#FFE7C6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 18px auto",
          fontSize: "30px"
        }}
      >
        ⚠️
      </div>

      <h3
        style={{
          marginBottom: "10px",
          fontSize: "1.45rem",
          fontWeight: 600,
          color: "#222"
        }}
      >
        Storage Almost Full
      </h3>

      <p
        style={{
          marginBottom: "28px",
          color: "#555",
          lineHeight: "1.5",
          fontSize: "0.98rem"
        }}
      >
        You’ve used more than <b>90% of your storage</b>.  
        Upgrade your plan to continue uploading files without interruption.
      </p>

      <div
        style={{
          display: "flex",
          gap: "12px",
          justifyContent: "center",
          flexWrap: "wrap"
        }}
      >
        {/* Upgrade Button */}
        <button
          onClick={() => {
            setShowModal(false);
            navigate("/Payment");
          }}
          style={{
            background: "#FFAB49",
            color: "#ffffff",
            padding: "10px 24px",
            borderRadius: "999px",
            border: "none",
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.25s ease",
            boxShadow: "0 6px 18px rgba(255,171,73,0.35)"
          }}
          onMouseOver={(e) => {
            e.target.style.transform = "translateY(-2px)";
            e.target.style.boxShadow = "0 8px 22px rgba(255,171,73,0.45)";
          }}
          onMouseOut={(e) => {
            e.target.style.transform = "translateY(0px)";
            e.target.style.boxShadow = "0 6px 18px rgba(255,171,73,0.35)";
          }}
        >
          Upgrade Storage
        </button>

        {/* Close Button */}
        <button
          onClick={() => setShowModal(false)}
          style={{
            background: "#FFE3CA",
            color: "#494949",
            padding: "10px 24px",
            borderRadius: "999px",
            border: "1px solid #FFAB49",
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.25s ease"
          }}
          onMouseOver={(e) => {
            e.target.style.background = "#FDF8F4";
          }}
          onMouseOut={(e) => {
            e.target.style.background = "#FFE3CA";
          }}
        >
          Close
        </button>
      </div>
    </div>
  </div>
);
};

export default StorageWarningModal;