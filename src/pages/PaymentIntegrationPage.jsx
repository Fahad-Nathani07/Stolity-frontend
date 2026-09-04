import React, { useEffect, useState } from "react";
import "../css/PaymentIntegrationPage.css";
import SideNav from "../components/SideNav";
import PaymentQRImg from "../images/QRCode Dummy.svg";
import CopyIcon from "../images/CopyIcon.svg";
import PaymentPageIcon1 from "../images/PaymentPageIcon1.svg";
import GreenTick from "../images/GreenTick.svg";
import RedCross from "../images/RedCross.svg";

import { FaCheckCircle } from "react-icons/fa"; //<FaCheckCircle />
import { BsXCircleFill } from "react-icons/bs"; // <BsXCircleFill />
import { IoIosInformationCircle } from "react-icons/io"; // <IoIosInformationCircle />
import { FaExclamationTriangle } from "react-icons/fa"; // <FaExclamationTriangle />
import { IoIosArrowRoundBack } from "react-icons/io";
import { useDispatch, useSelector } from "react-redux";

// import {  useToast, ChakraProvider } from "@chakra-ui/react";


import { fetchUserSubscription } from "../store/subscriptionSlice";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase"; // adjust path if needed

import { useNavigate } from "react-router-dom";



const PaymentIntegrationPage = () => {
  // const [selectedPlan, setSelectedPlan] = useState("free"); // free | monthly | yearly
  // const [screenshots, setScreenshots] = useState([]);
  // const [transactionId, setTransactionId] = useState("");
  // const [email, setEmail] = useState("Sunipa@infomanav.in");
  const apiUrl = process.env.REACT_APP_API_ENDPOINT;
  const [selectedPlan, setSelectedPlan] = useState("free");
  const [toasts, setToasts] = useState([]);
  const navigate = useNavigate();

  const [screenshots, setScreenshots] = useState([]);
  const [transactionId, setTransactionId] = useState("");
  const [email, setEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const subscription = useSelector((state) => state.subscription.subscription);
  const token = sessionStorage.getItem("number");
  const dispatch = useDispatch();


  const [qrImageUrl, setQrImageUrl] = useState(null);
  const [paymentReferenceId, setPaymentReferenceId] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null); // pending / success / failed
  const [loadingQr, setLoadingQr] = useState(false);
   const userId = sessionStorage.getItem("userId");

  
  const isMonthly =
    subscription?.entitlement_ids?.includes("stolity_lite_monthly");

  const isYearly =
    subscription?.entitlement_ids?.includes("stolity_lite_yearly");

  const activePlan = subscription
    ? isMonthly
      ? "monthly"
      : isYearly
      ? "yearly"
      : "free"
    : "free";


  useEffect(() => {
    const storedEmail = sessionStorage.getItem("email") || "";
    const storedName = sessionStorage.getItem("name") || "";
    setEmail(storedEmail);
    setUserName(storedName);
  }, []);

   useEffect(() => {
      if (token) {
        // Already loaded in App; force after plan purchase elsewhere
        dispatch(fetchUserSubscription({ token }));
      }
    }, [token, dispatch]);


const generatePaymentQR = async () => {
  if (selectedPlan === "free") return;

  setLoadingQr(true);

  // ── Get user name from sessionStorage ────────────────────────────────
  let userName = "Stolity Store"; // fallback

  // Option 1: normal login → direct "name" key
  const storedName = sessionStorage.getItem("name");
  if (storedName) {
    userName = storedName;
  } 
  // Option 2: Google login → "userData" object with .name
  else {
    const userDataStr = sessionStorage.getItem("userData");
    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        if (userData?.name) {
          userName = userData.name;
        }
      } catch (e) {
        console.warn("Failed to parse userData from sessionStorage", e);
      }
    }
  }

  try {
    // Use real amounts in production
    const amount = selectedPlan === "monthly" ? 65 : 780;
    // const amount = selectedPlan === "monthly" ? 1 : 2;  // ← testing only

    const res = await fetch(`${apiUrl}create-qr`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        amount: amount,
        name: userName,                    // ← now dynamic!
        upiId: "7030734568@ybl",
        userId: userId     
      })
    }
  );

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error ${res.status}`);
    }

    const data = await res.json();

    if (data?.qrImage || data?.qrCodeUrl || data?.qr || data?.imageUrl) {
      setQrImageUrl(
        data.qrImage || 
        data.qrCodeUrl || 
        data.qr || 
        data.imageUrl
      );

      setPaymentReferenceId(
        data.paymentId || 
        data.referenceId || 
        data.id || 
        data.transactionId ||
        data.orderId
      );

      showToast("success", "QR code generated! Scan & pay now.");
    } else {
      showToast("error", data.message || "Failed to generate QR. No QR data received.");
    }
  } catch (err) {
    showToast("error", err.message || "Failed to create payment QR. Please try again.");
    console.error("QR generation failed:", err);
  } finally {
    setLoadingQr(false);
  }
};

 

// Poll status every 10 seconds after QR is generated
// useEffect(() => {
//   if (!paymentReferenceId) return;

//   const interval = setInterval(async () => {
//     try {
//       const res = await fetch(
//         `https://stolityuatapi.infomanav.in/api/aws/status/${paymentReferenceId}`,
//         {
//           headers: { "Authorization": `Bearer ${token}` }
//         }
//       );
//       const data = await res.json();

//       setPaymentStatus(data.status);

//       if (data.status === "success" || data.status === "paid") {
//         showToast("success", "Payment successful! Upgrading plan...");
//         // TODO: refresh subscription / redirect
//         dispatch(fetchUserSubscription(token));
//         clearInterval(interval);
//       } else if (data.status === "failed" || data.status === "expired") {
//         showToast("error", "Payment failed or expired.");
//         clearInterval(interval);
//       }
//     } catch (err) {
//       console.error("Status poll failed", err);
//     }
//   }, 10000); // every 10 seconds

//   return () => clearInterval(interval);
// }, [paymentReferenceId, token, dispatch]);

// Right before the useEffect
console.log("Current selectedPlan:", selectedPlan);   // add this

useEffect(() => {
  console.log("useEffect for QR ran — selectedPlan is:", selectedPlan);  // ← critical log
  if (selectedPlan !== "free") {
    console.log("Calling generatePaymentQR now");
    generatePaymentQR();
  } else {
    console.log("Resetting QR states (free plan)");
    setQrImageUrl(null);
    setPaymentReferenceId(null);
    setPaymentStatus(null);
  }
}, [selectedPlan]);   // ← make sure token is NOT here unless it changes often


  const handleScreenshotChange = (e) => {
    const files = Array.from(e.target.files || []);
    setScreenshots((prev) => [...prev, ...files]);
  };

  const handleRemoveScreenshot = (index) => {
    setScreenshots((prev) => prev.filter((_, i) => i !== index));
  };

 
  //  const toast = useToast();
 
 
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
 
 
 
//  const showToast = (status, message) => {
//    const IconComponent = iconMap[status];
//    const colors = getStatusColors(status);
   
//   //  toast({
//   //    // position: 'bottom-center',
//   //    position: 'bottom-right',
//   //    duration: 4000,
//   //    isClosable: true,
//   //    render: () => (
//   //      <div className="premium-toast" style={{
//   //        background: `linear-gradient(135deg, ${colors.bg}, rgba(255,255,255,0.9))`,
//   //        backdropFilter: 'blur(20px)',
//   //        border: `2px solid ${colors.border}`,
//   //        borderRadius: '16px',
//   //        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.05)',
//   //        padding: '20px',
//   //        maxWidth: '720px',
//   //        fontFamily: "'SF Pro', 'SFProText', -apple-system, BlinkMacSystemFont, sans-serif",
//   //        animation: 'toastSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
//   //      }}>
//   //        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
//   //          <IconComponent 
//   //            style={{ 
//   //              width: '24px', 
//   //              height: '24px', 
//   //              color: colors.icon,
//   //              flexShrink: 0,
//   //              marginTop: '2px'
//   //            }} 
//   //          />
//   //          <div style={{ flex: 1, minWidth: 0 }}>
//   //            <div style={{
//   //              fontSize: '14px',
//   //              fontWeight: '600',
//   //              color: '#1f2937',
//   //              marginBottom: '4px',
//   //              lineHeight: '1.3'
//   //            }}>
//   //              {status.charAt(0).toUpperCase() + status.slice(1)}
//   //            </div>
//   //            <div style={{
//   //              fontSize: '14px',
//   //              color: '#6b7280',
//   //              lineHeight: '1.4'
//   //            }}>
//   //              {message}
//   //            </div>
//   //          </div>
//   //          <button 
//   //            style={{
//   //              background: 'none',
//   //              border: 'none',
//   //              padding: '4px',
//   //              cursor: 'pointer',
//   //              color: '#9ca3af',
//   //              borderRadius: '4px',
//   //              opacity: 0.7,
//   //              transition: 'all 0.2s'
//   //            }}
//   //            onClick={() => toast.closeAll()}
//   //            onMouseEnter={(e) => e.target.style.opacity = 1}
//   //            onMouseLeave={(e) => e.target.style.opacity = 0.7}
//   //          >
//   //            ✕
//   //          </button>
//   //        </div>
//   //      </div>
//   //    ),
//   //  });
//  };


//   const handleConfirmPayment = () => {
//   if (!transactionId.trim()) {
//     showToast(
//       "error",
//       "Please enter your Transaction ID to validate the payment."
//     );
//     return;
//   }

//   const payload = {
//     plan: selectedPlan === "monthly" ? "premium_monthly" : "premium_yearly",
//     amount: selectedPlan === "monthly" ? 65 : 780,
//     transaction_id: transactionId.trim(),
//     email,
//     status: "validation_pending",
//     screenshot: screenshots,
//   };

//   console.log("Payment payload:", payload);
//   showToast(
//       "success",
//       "Payment submitted successfully. You now have the access to Premium version, our team will verify the payment shortly."
//     );
//   // TODO: API call here
// };



// const handleConfirmPayment = async () => {
//   if (!transactionId.trim()) {
//     showToast("error", "Please enter your Transaction ID to validate the payment.");
//     return;
//   }

 
//   if (!userId) {
//     showToast("error", "User not found. Please log in again.");
//     return;
//   }

//   const isMonthly = selectedPlan === "monthly";
//   const amount = isMonthly ? 65 : 780;

//   try {
//     const formData = new FormData();
//     formData.append("transactionId", transactionId.trim());
//     formData.append("amount", amount.toString());
//     formData.append("userId", userId);

//     // ── Only add screenshot(s) if user uploaded any ───────────────────────
//     if (screenshots.length > 0) {
//       // Option A: Send only the first one (recommended if backend expects single file)
//       formData.append("paymentScreenshot", screenshots[0]);

//       // Option B: Send all of them (if backend supports multiple files with same key)
//       // screenshots.forEach(file => formData.append("paymentScreenshot", file));
//     }

//     const response = await fetch(
//       `${apiUrl}submit-payment`,
//       {
//         method: "POST",
//         body: formData,
//         // No Content-Type header — browser sets multipart/form-data automatically
//       }
//     );

//     if (!response.ok) {
//       let errorMsg = "";
//       try {
//         const errData = await response.json();
//         errorMsg = errData.message || errData.error || `HTTP ${response.status}`;
//       } catch {
//         errorMsg = await response.text().catch(() => `HTTP ${response.status}`);
//       }
//       throw new Error(errorMsg);
//     }

//     const data = await response.json().catch(() => ({}));

//     // Defensive success check — adjust once you see real response
//     if (data?.error || data?.success === false) {
//       throw new Error(data.message || "Proof submission failed");
//     }

//     // ── Firebase update ──────────────────────────────────────────────────
//     const now = Date.now();
//     const expirationDays = isMonthly ? 30 : 365;
//     const expirationMs = now + expirationDays * 24 * 60 * 60 * 1000;

//     const userRef = doc(db, "users", userId);

//     await setDoc(
//       userRef,
//       {
//         subscription: {
//           entitlement_ids: [isMonthly ? "premium_monthly" : "premium_yearly"],
//           expiration_at: expirationMs,
//           price: amount,
//           storage: "50 GB",
//           subscriptionUpdatedAt: now,
//           type: "EXPIRATION",
//         },
//       },
//       { merge: true }
//     );

//     showToast(
//       "success",
//       "Payment submitted successfully! Your premium access will be activated soon.",
//       "Submitted"
//     );

//     // Optional: reset form fields after success
//     // setTransactionId("");
//     // setScreenshots([]);

//   } catch (err) {
//     console.error("Payment submission error:", err);
//     showToast(
//       "error",
//       err.message || "Failed to submit payment details. Please try again.",
//       "Error"
//     );
//   }
// };

const handleConfirmPayment = async () => {
  if (!transactionId.trim()) {
    showToast("error", "Please enter your Transaction ID to validate the payment.");
    return;
  }

  if (!userId || !email) {   // ← added email check
    showToast("error", "User information missing. Please log in again.");
    return;
  }

  const isMonthly = selectedPlan === "monthly";
  const amount = isMonthly ? 65 : 780;
  const duration = isMonthly ? "monthly" : "yearly";           // for RevenueCat
  const entitlementId = isMonthly ? "stolity_lite_monthly" : "stolity_lite_yearly";

  try {
    // ── 1. Submit payment proof to your backend ─────────────────────
    const formData = new FormData();
    formData.append("transactionId", transactionId.trim());
    formData.append("amount", amount.toString());
    formData.append("userId", userId);

    if (screenshots.length > 0) {
      formData.append("paymentScreenshot", screenshots[0]);
    }

    const submitResponse = await fetch(`${apiUrl}submit-payment`, {
      method: "POST",
      body: formData,
    });

    if (!submitResponse.ok) {
      const errData = await submitResponse.json().catch(() => ({}));
      throw new Error(errData.message || `HTTP ${submitResponse.status}`);
    }

    // ── 2. Temporary: Update Firebase (you will comment this later) ──
    // const now = Date.now();
    // const expirationDays = isMonthly ? 30 : 365;
    // const expirationMs = now + expirationDays * 24 * 60 * 60 * 1000;

    // const userRef = doc(db, "users", userId);

    // await setDoc(
    //   userRef,
    //   {
    //     subscription: {
    //       entitlement_ids: [entitlementId],
    //       expiration_at: expirationMs,
    //       price: amount,
    //       storage: "50 GB",
    //       subscriptionUpdatedAt: now,
    //       type: "EXPIRATION",
    //       paymentStatus: "approved",
    //       transactionId: transactionId.trim(),
    //       submittedAt: now,
    //     },
    //   },
    //   { merge: true }
    // );

    // ── 3. Get Subscriber from RevenueCat (just to ensure user exists) ──
    const revenueCatKey = process.env.REACT_APP_REVENUECAT_SECRET_KEY; // put in .env

    await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(email)}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${revenueCatKey}`,
        "Content-Type": "application/json",
      },
    });
    // We don't need to check the response strictly — if it fails, we'll still grant below

    // ── 4. Grant Promotional Entitlement in RevenueCat ───────────────
    const grantResponse = await fetch(
      `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(email)}/entitlements/${entitlementId}/promotional`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${revenueCatKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          duration: duration,        // "monthly" or "yearly"
        }),
      }
    );

    if (!grantResponse.ok) {
      const rcError = await grantResponse.json().catch(() => ({}));
      console.error("RevenueCat grant error:", rcError);
      // We still show success because Firebase is updated, but log the error
    }

    // ── Success Message ─────────────────────────────────────────────
    showToast(
      "success",
      "Payment submitted successfully! Premium access activated.",
      "Success"
    );

    setTimeout(() => {
      navigate("/Files");
    }, 2000);

    // Optional: reset form
    // setTransactionId("");
    // setScreenshots([]);

  } catch (err) {
    console.error("Payment submission error:", err);
    showToast(
      "error",
      err.message || "Failed to process payment. Please try again.",
      "Error"
    );
  }
};
 

const showToast = (status, message) => {
  const id = Date.now();
  setToasts((prev) => [...prev, { id, status, message }]);

  // auto remove after 4s
  setTimeout(() => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, 4000);
};


  return (
   <>

   {/* <ChakraProvider> </ChakraProvider> */}
    <div className="faq-main-wrapper2">
      <SideNav />
      <div className="settings-breadcrumb" style={{ marginBottom: "0" }}>
        <span style={{ fontFamily: 800 }}>Settings</span>
        <span className="breadcrumb-separator">›</span>
        <span className="breadcrumb-current">Payment</span>
      </div>

      <div className="faq-main-wrapper">
        <div className="faqBody">
         <div>
          {selectedPlan === "free" && (
            <>
            <h1 className="faq-title" style={{ marginBottom: "0px" }}>
              Compare our plans and find yours
            </h1>
            <p className="faq-paragraph">
              {/* Secure and fast payment using UPI QR code. */}
              Simple, transparent pricing that grows with you. Try any plan free for 30 days.
            </p>
            </>
          )}
          {(selectedPlan === "monthly" || selectedPlan === "yearly")  && (
            <>
            <h1 className="faq-title" style={{ marginBottom: "0px" }}>
              Complete Your Payment
            </h1>
            <p className="faq-paragraph">
              Secure and fast payment using UPI QR code.
            </p>
            </>
          )}
         </div>

          <div className="faq-content-wrapper">
            {/* SCREEN 1: Plan cards + comparison */}
{selectedPlan === "free" && (
  <div className="plans-screen">
    {/* Top: 3 plan cards (no features inside) */}
    <div className="plans-wrapper">



      {/* Free Plan (default, no button) */}
      <div style={{
fontWeight: 600,
fontStyle: "Semibold",
fontSize: "36px",
leadingTrim: "NONE",
lineHeight: "120%",
letterSpacing: "0%",
    maxWidth: "195px",
    marginRight:"150px"
      }}>
        Pick your Plan
      </div>







      {/* Free Plan (default, no button)/....... "plan-card-active" will be given only to current active plan */}
      {/* <div className="plan-card plan-card-active"> */}
        <div
  className={`plan-card ${
    activePlan === "free" ? "plan-card-active" : ""
  }`}
>
  <div className="plan-card-header">
    <div className="plan-card-title-row">
      <span className="plan-card-title">Free Plan</span>
    </div>

    <div className="plan-card-tag">Ideal For: Casual users</div>

    <div className="plan-card-price-row">
      <span className="plan-card-price">₹0.00</span>
      <span className="plan-card-price-cycle">/year</span>
    </div>

    <div className="plan-card-subline">5 GB Storage</div>

    {activePlan === "free" && (
      <div className="plan-card-footer plan-card-footer-muted">
        <span className="plan-current-label">Current Plan</span>
      </div>
    )}
  </div>
</div>


      {/* Monthly Plan */}
<div
  className={`plan-card ${
    activePlan === "monthly" ? "plan-card-active" : ""
  }`}
>
  <div className="plan-card-header">
    <div className="plan-card-title-row">
      <span className="plan-card-title">Lite Plan Monthly</span>
    </div>

    <div className="plan-card-tag">
      Ideal For: Freelancers &amp; individuals
    </div>

    <div className="plan-card-price-row">
      <span className="plan-card-price">₹65.00</span>
      <span className="plan-card-price-cycle">/month</span>
    </div>

    <div className="plan-card-subline">50 GB Storage</div>

    <div className="plan-card-footer">
      {activePlan === "monthly" ? (
        <span className="plan-current-label">Current Plan</span>
      ) : (
        <button
          type="button"
          className="plan-cta-btn"
          onClick={() => {
            // console.log("Users subscription:", subscription);
            console.log("Button clicked → setting plan to monthly");
            setSelectedPlan("monthly");
          }}
        >
          Get Started
        </button>
      )}
    </div>
  </div>
</div>


      {/* Yearly Plan */}
<div
  className={`plan-card ${
    activePlan === "yearly" ? "plan-card-active" : ""
  }`}
>
  <div className="plan-card-header">
    <div className="plan-card-title-row">
      <span className="plan-card-title">Lite Plan Yearly</span>
    </div>

    <div className="plan-card-tag">
      Ideal For: Teams &amp; small businesses
    </div>

    <div className="plan-card-price-row">
      <span className="plan-card-price">₹780.00</span>
      <span className="plan-card-price-cycle">/year</span>
    </div>

    <div className="plan-card-subline">50 GB Storage</div>

    <div className="plan-card-footer">
      {activePlan === "yearly" ? (
        <span className="plan-current-label">Current Plan</span>
      ) : (
        <button
          type="button"
          className="plan-cta-btn"
          onClick={() => {
            // console.log("Users subscription:", subscription);
            console.log("Button clicked → setting plan to yearly");
            setSelectedPlan("yearly");
          }}
        >
          Get Started
        </button>
      )}
    </div>
  </div>
</div>

    </div>

    {/* Bottom: comparison table */}
    <div className="plans-compare-wrapper">
      {/* Column headers */}
      <div className="plans-compare-row plans-compare-header">
        <div className="plans-compare-feature-col" />
        <div className="plans-compare-plan-col" style={{color:"black", fontSize:"18px "}}>Free</div>
        <div className="plans-compare-plan-col" style={{color:"black", fontSize:"18px "}}>Lite Monthly</div>
        <div className="plans-compare-plan-col" style={{color:"black", fontSize:"18px "}}>Lite Yearly</div>
      </div>






      {/* Core Features section title */}
      <div className="plans-compare-section-title">CORE FEATURES</div>

      {/* Example feature rows – adjust as needed */}
     <div className="plans-compare-group">
       <div className="plans-compare-row">
        <div className="plans-compare-feature-col">Upload &amp; Download</div>
        <div className="plans-compare-plan-col"><img src={GreenTick} alt="" /></div>
        <div className="plans-compare-plan-col"><img src={GreenTick} alt="" /></div>
        <div className="plans-compare-plan-col"><img src={GreenTick} alt="" /></div>
      </div>

      <div className="plans-compare-row">
        <div className="plans-compare-feature-col">File Management</div>
        <div className="plans-compare-plan-col"><img src={GreenTick} alt="" /></div>
        <div className="plans-compare-plan-col"><img src={GreenTick} alt="" /></div>
        <div className="plans-compare-plan-col"><img src={GreenTick} alt="" /></div>
      </div>
 
      <div className="plans-compare-row">
        <div className="plans-compare-feature-col">File Preview (PDF, Images, Videos, Audio)</div>
        <div className="plans-compare-plan-col"><img src={GreenTick} alt="" /></div>
        <div className="plans-compare-plan-col"><img src={GreenTick} alt="" /></div>
        <div className="plans-compare-plan-col"><img src={GreenTick} alt="" /></div>
      </div>
 
      <div className="plans-compare-row">
        <div className="plans-compare-feature-col">Background Upload</div>
        <div className="plans-compare-plan-col"><img src={GreenTick} alt="" /></div>
        <div className="plans-compare-plan-col"><img src={GreenTick} alt="" /></div>
        <div className="plans-compare-plan-col"><img src={GreenTick} alt="" /></div>
      </div>
     </div>









      <div className="plans-compare-section-title">FILE OPERATIONS</div>
      <div className="plans-compare-group">
        <div className="plans-compare-row">
          <div className="plans-compare-feature-col">Rename Files/Folders</div>
          <div className="plans-compare-plan-col"><img src={GreenTick} alt="" /></div>
          <div className="plans-compare-plan-col"><img src={GreenTick} alt="" /></div>
          <div className="plans-compare-plan-col"><img src={GreenTick} alt="" /></div>
        </div>
  
        <div className="plans-compare-row">
          <div className="plans-compare-feature-col">Create Folders</div>
          <div className="plans-compare-plan-col"><img src={GreenTick} alt="" /></div>
          <div className="plans-compare-plan-col"><img src={GreenTick} alt="" /></div>
          <div className="plans-compare-plan-col"><img src={GreenTick} alt="" /></div>
        </div>
  
        <div className="plans-compare-row">
          <div className="plans-compare-feature-col">Move / Copy Files & Folders</div>
          <div className="plans-compare-plan-col"><img src={GreenTick} alt="" /></div>
          <div className="plans-compare-plan-col"><img src={GreenTick} alt="" /></div>
          <div className="plans-compare-plan-col"><img src={GreenTick} alt="" /></div>
        </div>
  
        <div className="plans-compare-row">
          <div className="plans-compare-feature-col">Files Info</div>
          <div className="plans-compare-plan-col"><img src={GreenTick} alt="" /></div>
          <div className="plans-compare-plan-col"><img src={GreenTick} alt="" /></div>
          <div className="plans-compare-plan-col"><img src={GreenTick} alt="" /></div>
        </div>
    
        <div className="plans-compare-row">
          <div className="plans-compare-feature-col">Add to Favorites</div>
          <div className="plans-compare-plan-col"><img src={RedCross} alt="" /></div>
          <div className="plans-compare-plan-col"><img src={GreenTick} alt="" /></div>
          <div className="plans-compare-plan-col"><img src={GreenTick} alt="" /></div>
        </div>
      </div>



      <div className="plans-compare-section-title">STORAGE</div>
      <div className="plans-compare-group">


        <div className="plans-compare-row">
          <div className="plans-compare-feature-col">Free Storage</div>
          <div className="plans-compare-plan-col">Up to 5GB</div>
          <div className="plans-compare-plan-col"> - </div>
          <div className="plans-compare-plan-col"> - </div>
        </div>
  
        <div className="plans-compare-row">
          <div className="plans-compare-feature-col">Total Storage</div>
          <div className="plans-compare-plan-col">5 GB</div>
          <div className="plans-compare-plan-col">50 GB</div>
          <div className="plans-compare-plan-col">50 GB</div>
        </div>
  
        
      </div>


      <div className="plans-compare-section-title">ENHANCED UPLOAD</div>
      <div className="plans-compare-group">
        <div className="plans-compare-row">
          <div className="plans-compare-feature-col">Pause/Resume Uploads</div>
          <div className="plans-compare-plan-col"><img src={RedCross} alt="" /></div>
          <div className="plans-compare-plan-col"><img src={GreenTick} alt="" /></div>
          <div className="plans-compare-plan-col"><img src={GreenTick} alt="" /></div>
        </div>
  
        
      </div>


       <div className="plans-compare-section-title">FILE CONVERSION</div>
        <div className="plans-compare-group">
          <div className="plans-compare-row">
            <div className="plans-compare-feature-col">Image Conversion & Format Change</div>
            <div className="plans-compare-plan-col"><img src={RedCross} alt="" /></div>
            <div className="plans-compare-plan-col"><img src={GreenTick} alt="" /></div>
            <div className="plans-compare-plan-col"><img src={GreenTick} alt="" /></div>
          </div>
          <div className="plans-compare-row">
            <div className="plans-compare-feature-col">Compression Before Upload</div>
            <div className="plans-compare-plan-col"><img src={RedCross} alt="" /></div>
            <div className="plans-compare-plan-col"><img src={GreenTick} alt="" /></div>
            <div className="plans-compare-plan-col"><img src={GreenTick} alt="" /></div>
          </div>
          <div className="plans-compare-row">
            <div className="plans-compare-feature-col">Custom Dimensions & Quality</div>
            <div className="plans-compare-plan-col"><img src={RedCross} alt="" /></div>
            <div className="plans-compare-plan-col"><img src={GreenTick} alt="" /></div>
            <div className="plans-compare-plan-col"><img src={GreenTick} alt="" /></div>
          </div>
    
          
        </div>


       <div className="plans-compare-section-title">SEARCH & FILTER</div>
        <div className="plans-compare-group">
          <div className="plans-compare-row">
            <div className="plans-compare-feature-col">Advanced Search</div>
            <div className="plans-compare-plan-col"><img src={RedCross} alt="" /></div>
            <div className="plans-compare-plan-col"><img src={GreenTick} alt="" /></div>
            <div className="plans-compare-plan-col"><img src={GreenTick} alt="" /></div>
          </div>
          <div className="plans-compare-row">
            <div className="plans-compare-feature-col">Filter by Date & Size</div>
            <div className="plans-compare-plan-col"><img src={RedCross} alt="" /></div>
            <div className="plans-compare-plan-col"><img src={GreenTick} alt="" /></div>
            <div className="plans-compare-plan-col"><img src={GreenTick} alt="" /></div>
          </div>

    
          
        </div>


       <div className="plans-compare-section-title">FILE SHARING</div>
        <div className="plans-compare-group">
          <div className="plans-compare-row">
            <div className="plans-compare-feature-col">Permanent Link Sharing</div>
            <div className="plans-compare-plan-col"><img src={RedCross} alt="" /></div>
            <div className="plans-compare-plan-col"><img src={GreenTick} alt="" /></div>
            <div className="plans-compare-plan-col"><img src={GreenTick} alt="" /></div>
          </div>
        </div>


       <div className="plans-compare-section-title">COMPRESSION & TOOLS</div>
        <div className="plans-compare-group">
          <div className="plans-compare-row">
            <div className="plans-compare-feature-col">ZIP / Unzip Files (Unlimited)</div>
            <div className="plans-compare-plan-col"><img src={RedCross} alt="" /></div>
            <div className="plans-compare-plan-col"><img src={GreenTick} alt="" /></div>
            <div className="plans-compare-plan-col"><img src={GreenTick} alt="" /></div>
          </div>
          <div className="plans-compare-row">
            <div className="plans-compare-feature-col">Link Downloader (Unlimited Links)</div>
            <div className="plans-compare-plan-col"><img src={RedCross} alt="" /></div>
            <div className="plans-compare-plan-col"><img src={GreenTick} alt="" /></div>
            <div className="plans-compare-plan-col"><img src={GreenTick} alt="" /></div>
          </div>
        </div>

      {/* Add more feature rows here to match your design */}
    </div>
  </div>
)}


            {/* SCREEN 2: QR + payment info */}
            {(selectedPlan === "monthly" || selectedPlan === "yearly") && (
              <>
                {/* Left: QRCode */}
                <div className="faq-left-col payment-scan-wrapper">
                  <div className="payment-card">
                    {/* <div className="payment-qr-box">
                      <img
                        src={PaymentQRImg}
                        alt="Stolity UPI QR"
                        className="payment-qr-img"
                      />
                    </div> */}
                    <div className="payment-qr-box">
                      {loadingQr ? (
                        <p>Generating QR code...</p>
                      ) : qrImageUrl ? (
                        <img
                          src={qrImageUrl}
                          alt="Dynamic UPI QR for payment"
                          className="payment-qr-img"
                        />
                      ) : (
                        <img
                          src={PaymentQRImg}
                          alt="Stolity UPI QR"
                          className="payment-qr-img"
                        />
                      )}

                      {paymentStatus && (
                        <div style={{ marginTop: 12, textAlign: "center", fontWeight: "bold" }}>
                          Status: {paymentStatus.toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="payment-title">Scan &amp; Pay</div>
                    <p className="payment-helper-text">
                      Use any UPI app to scan the QR code and complete your
                      payment.
                    </p>

                    <div className="payment-upi-section">
                      <label className="payment-upi-label">UPI ID</label>
                      <div className="payment-upi-input-row">
                        <div
                          style={{
                            width: "100%",
                            display: "flex",
                            border: "1px solid #E0E0E0",
                            padding: "10px",
                            borderRadius: "50px",
                          }}
                        >
                          <img
                            style={{ padding: "15px" }}
                            src={CopyIcon}
                            alt=""
                          />
                          <input
                            type="text"
                            className="payment-upi-input"
                            value="payments@stolity"
                            readOnly
                          />
                        </div>
                      </div>
                      <p className="payment-upi-hint">
                        Use this if you’re unable to scan the QR code.
                      </p>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          marginTop: "25px",
                        }}
                      >
                        <button
                          type="button"
                          className="payment-copy-btn"
                          style={{ padding: "11px 24px" }}
                          onClick={() => {
                            navigator.clipboard.writeText("payments@stolity");
                          }}
                        >
                          Copy UPI ID
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Payment Information */}
                <div className="faq-right-col payment-info-wrapper">
                  <div className="payment-info-card">
                    {/* Transaction ID */}
                    <div className="payment-field-group">
                      <label className="payment-field-label">
                        Enter Transaction ID{" "}
                        <span className="required-star">*</span>
                      </label>
                      <input
                        type="text"
                        className="payment-text-input"
                        placeholder="Enter transaction ID manually"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                      />
                    </div>

                    {/* Files upload row */}
                    <div className="payment-field-group">
                      <label className="payment-field-label">
                        Payment Screenshot  
                        {/* <span className="required-star">*</span> */}
                        (Optional)
                      </label>

                      <div className="payment-files-row">
                        {screenshots.map((file, idx) => (
                          <span
                            key={idx}
                            className="payment-file-chip"
                            style={{ cursor: "pointer" }}
                            onClick={() => handleRemoveScreenshot(idx)}
                          >
                            {file.name} ✕
                          </span>
                        ))}

                        <button
                          type="button"
                          className="payment-upload-btn"
                          onClick={() =>
                            document
                              .getElementById("screenshot-input")
                              ?.click()
                          }
                        >
                          + Screenshot
                        </button>

                        <input
                          id="screenshot-input"
                          type="file"
                          accept="image/*"
                          multiple
                          style={{ display: "none" }}
                          onChange={handleScreenshotChange}
                        />
                      </div>
                    </div>

                    {/* Details */}
                    {userName && (
                      <div className="payment-info-row">
                      <span className="payment-info-label">User Name:</span>
                      <span className="payment-info-value">{userName}</span>
                    </div>)}
                    <div className="payment-info-row">
                      <span className="payment-info-label">Email ID:</span>
                      <span className="payment-info-value">{email}</span>
                    </div>
                    <div className="payment-info-row">
                      <span className="payment-info-label">Plan Name:</span>
                      <span className="payment-info-value">Lite Plan {selectedPlan === "monthly" ? "Monthly" : "Yearly"}</span>
                    </div>
                    <div className="payment-info-row">
                      <span className="payment-info-label">
                        Billing Cycle:
                      </span>
                      <span className="payment-info-value">
                        {selectedPlan === "monthly" ? "Monthly" : "Yearly"}
                      </span>
                    </div>

                    <div className="payment-info-row">
                      <span className="payment-info-label">Order ID:</span>
                      <span className="payment-info-value">
                        STL-ORD-782394
                      </span>
                    </div>

                    <div className="payment-info-row">
                      <span className="payment-info-label">UPI ID:</span>
                      <span className="payment-info-value">
                        payments@stolity
                      </span>
                    </div>

                    <div className="payment-info-separator" />

                    {/* Amount + copy summary */}
                    <div className="payment-amount-row">
                      <div className="payment-amount-text">
                        <span className="payment-amount-label">
                          You have to pay
                        </span>
                        <div className="payment-amount-value">
                          <span className="payment-amount-number">
                            {selectedPlan === "monthly" ? "65" : "780"}
                          </span>
                          <span className="payment-amount-decimal">.00</span>
                          <span className="payment-amount-currency">
                            INR
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="payment-copy-summary-btn"
                        onClick={() => {
                          const summary = `
User Name: Sunipa Bera
Plan Name: Pro
Billing Cycle: ${
                            selectedPlan === "monthly" ? "Monthly" : "Yearly"
                          }
Order ID: STL-ORD-782394
UPI ID: payments@stolity
Amount: ${
                            selectedPlan === "monthly" ? "65.00" : "780.00"
                          } INR
                          `.trim();
                          navigator.clipboard.writeText(summary);
                        }}
                      >
                        <span className="payment-copy-summary-icon">
                          <img src={PaymentPageIcon1} alt="" />
                        </span>
                      </button>
                    </div>
                  </div>

                  <p className="payment-note">
                    <b>Note:</b> Your plan upgrades immediately after you submit
                    payment and tap Confirm Payment with the correct Transaction
                    ID and screenshot. Payment verification may take a few
                    hours, and providing false or suspicious details can lead to
                    account suspension.
                  </p>

                 <div style={{    width: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "10px"}}     
                 >
                  

                  <button
                    type="button"
                    className="payment-back-btn"
                    onClick={() => {
                      setSelectedPlan("free");
                      setTransactionId("");
                      setScreenshots([]);
                    }}
                  >
                    <IoIosArrowRoundBack /> Back to Plans
                  </button>


                   <button
                    type="button"
                    className="payment-confirm-btn"
                    disabled={!transactionId.trim()}
                    onClick={() => {
                      if (!transactionId.trim()) return;
                      setShowConfirmModal(true);
                    }}
                  >
                    Confirm Payment
                  </button>

                 </div>


                </div>

                
              </>
            )}
          </div>
        </div>
      </div>


     





    </div>

{showConfirmModal && (
  <div className="confirm-overlay">
    <div className="confirm-modal">
      <div className="confirm-modal-header">
        <span className="confirm-modal-title">Confirm UPI Payment</span>
        <span className="confirm-badge">Important</span>
        </div>
        <div className="confirm-modal-body">
          <p className="confirm-warning">
            <strong>Warning:</strong> Please double‑check your Transaction ID. Sharing
            incorrect or fraudulent details can lead to account suspension.
          </p>
          <div className="confirm-transaction-box">
            <span className="confirm-transaction-label">
              <span className="confirm-transaction-dot" />
              Entered Transaction ID
            </span>
            <span className="confirm-transaction-value">{transactionId.trim()}</span>
          </div>
        </div>


      <div className="confirm-modal-footer">
        <button
          type="button"
          className="confirm-btn cancel"
          onClick={() => setShowConfirmModal(false)}
        >
          Go Back
        </button>
        <button
          type="button"
          className="confirm-btn confirm"
          onClick={() => {
            setShowConfirmModal(false);
            handleConfirmPayment();
          }}
        >
          Yes, Submit Payment
        </button>
      </div>
    </div>
  </div>
)}



{/* PREMIUM TOAST CONTAINER */}
<div
  style={{
    position: "fixed",
    bottom: "24px",
    right: "24px",
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  }}
>
  {toasts.map(({ id, status, message }) => {
    const IconComponent = iconMap[status];
    const colors = getStatusColors(status);

    return (
      <div
        key={id}
        className="premium-toast"
        style={{
          background: `linear-gradient(135deg, ${colors.bg}, rgba(255,255,255,0.9))`,
          backdropFilter: "blur(20px)",
          border: `2px solid ${colors.border}`,
          borderRadius: "16px",
          boxShadow:
            "0 25px 50px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.05)",
          padding: "20px",
          maxWidth: "420px",
          display: "flex",
          gap: "12px",
          animation: "toastSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <IconComponent
          style={{
            width: "24px",
            height: "24px",
            color: colors.icon,
            flexShrink: 0,
            marginTop: "2px",
          }}
        />

        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: "14px",
              fontWeight: "600",
              color: "#1f2937",
              marginBottom: "4px",
            }}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </div>
          <div
            style={{
              fontSize: "14px",
              color: "#6b7280",
              lineHeight: "1.4",
            }}
          >
            {message}
          </div>
        </div>

        <button
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#9ca3af",
            fontSize: "16px",
          }}
          onClick={() =>
            setToasts((prev) => prev.filter((t) => t.id !== id))
          }
        >
          ✕
        </button>
      </div>
    );
  })}
</div>



   </>
    
  );
};

export default PaymentIntegrationPage;
