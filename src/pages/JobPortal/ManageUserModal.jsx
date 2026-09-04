import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { useDispatch } from "react-redux";
import { fetchAllUsers } from "../../store/usersAdminSlice";
import { collection, addDoc, serverTimestamp, where, getDocs, query } from "firebase/firestore";
import slugify from "slugify";
import { fetchCompanies } from "../../store/companyMasterSlice";
import { toaster, Notification } from "rsuite";
import { showToast } from "../../components/ToastProvider";




const ManageUserModal = ({ user, onClose }) => {
  const [activeTab, setActiveTab] = useState("ASSIGN"); // ASSIGN | PLAN | SOFT_BAN | SHARED_FOLDERS
  const [role, setRole] = useState(user.jobPortal?.role || "");
const [selectedCompanies, setSelectedCompanies] = useState(
user.jobPortal?.companies || []
);
const [newCompanyName, setNewCompanyName] = useState("");
const { companies } = useSelector((state) => state.companyMaster);
const dispatch = useDispatch();

const [isSoftBan, setIsSoftBan] = useState(user?.isSoftBan || false);
const adminEmail = sessionStorage.getItem("email");
const userEmail = user?.email || "";
const currentAdmin = useSelector((state) => state.usersAdmin?.currentUser);



// 🧹 remove invalid company IDs like ""
const cleanedCompanies = selectedCompanies.filter(
  (id) => typeof id === "string" && id.trim() !== ""
);

const isRoleValid = Boolean(role);

const needsCompany =
  role === "ADMIN" || role === "JOB_PORTAL_MANAGER";

const isCompanyValid =
  !needsCompany || cleanedCompanies.length > 0;

const canSave = isRoleValid && isCompanyValid;



// Add these new states near the top (after existing states)

const [subscription, setSubscription] = useState(user?.subscription || null);
const [entitlementIds, setEntitlementIds] = useState(user?.subscription?.entitlement_ids || []);
const [expirationAt, setExpirationAt] = useState(user?.subscription?.expiration_at || '');
const [firebaseUpdatedTime, setFirebaseUpdatedTime] = useState(user?.subscription?.firebase_updated_time || '');
const [storageValue, setStorageValue] = useState(
  user?.subscription?.storage 
    ? user.subscription.storage.replace(' GB', '') 
    : '5'
);
const [typeValue, setTypeValue] = useState(user?.subscription?.type || '');
const [endingPremium, setEndingPremium] = useState(false);

const normalizeSharedFolders = (folders) => {
  if (!folders) return [];
  if (!Array.isArray(folders)) return [];
  return [...new Set(
    folders
      .map((f) => String(f || "").trim().toLowerCase())
      .filter(Boolean)
  )];
};

const [sharedFolders, setSharedFolders] = useState(() =>
  normalizeSharedFolders(user?.folders)
);
const [newSharedFolder, setNewSharedFolder] = useState("");
const [savingSharedFolders, setSavingSharedFolders] = useState(false);

const emailDomain = (userEmail.split("@")[1] || "").trim().toLowerCase();

const originalSharedFolders = normalizeSharedFolders(user?.folders);
const hasSharedFolderChanges =
  JSON.stringify([...originalSharedFolders].sort()) !==
  JSON.stringify([...sharedFolders].sort());

const isActivePremium = Boolean(
  subscription?.expiration_at &&
  Number(subscription.expiration_at) > Date.now()
);

// Dirty check: has the user made any changes?
const [hasChanges, setHasChanges] = useState(false);

useEffect(() => {
  const original = {
    entitlementIds: user?.subscription?.entitlement_ids || [],
    expirationAt: user?.subscription?.expiration_at || '',
    firebaseUpdatedTime: user?.subscription?.firebase_updated_time || '',
    storage: user?.subscription?.storage 
      ? user.subscription.storage.replace(' GB', '') 
      : '5',
    type: user?.subscription?.type || '',
  };

  const current = {
    entitlementIds,
    expirationAt,
    firebaseUpdatedTime,
    storage: storageValue,
    type: typeValue,
  };

  const changed = JSON.stringify(original) !== JSON.stringify(current);
  setHasChanges(changed);
}, [entitlementIds, expirationAt, firebaseUpdatedTime, storageValue, typeValue, user]);

// New save handler for PLAN tab
// const handleUpgradePlan = async () => {
//   if (!hasChanges) return;

//   try {
//     const userRef = doc(db, "users", user.id);

//     const newSubscription = {
//       entitlement_ids: entitlementIds.length > 0 ? entitlementIds : [],
//       expiration_at: expirationAt ? Number(expirationAt) : null,
//       firebase_updated_time: new Date().toLocaleString("en-IN", { 
//         day: "2-digit", month: "2-digit", year: "numeric", 
//         hour: "2-digit", minute: "2-digit", second: "2-digit", 
//         hour12: false 
//       }), // auto-set human-readable time
//       storage: storageValue.trim() ? `${storageValue.trim()} GB` : "5 GB",
//       storageUpdatedAt: serverTimestamp(),
//       subscriptionUpdatedAt: serverTimestamp(),
//       // type removed as per your request
//     };

//     await updateDoc(userRef, {
//       subscription: newSubscription
//     });

//     showToast("success", "Subscription updated", "Success");
//     dispatch(fetchAllUsers());
//     onClose();
//   } catch (err) {
//     console.error(err);
//     showToast("error", "Update failed", "Error");
//   }
// };

const handleUpgradePlan = async () => {
  if (!hasChanges) return;

  const revenueCatKey = process.env.REACT_APP_REVENUECAT_SECRET_KEY;

  if (!userEmail) {
    showToast("error", "Email not found. Cannot update plan.", "Error");
    return;
  }

  // Map UI plan → RevenueCat grant + Firebase entitlement id
  const resolvePlanGrant = () => {
    if (entitlementIds.includes("stolity_lite_trial")) {
      // Grant existing Lite Monthly entitlement for 1 week in RevenueCat
      return {
        revenueCatEntitlementId: "stolity_lite_monthly",
        duration: "weekly",
        firebaseEntitlementId: "stolity_lite_trial",
      };
    }
    if (entitlementIds.includes("stolity_lite_monthly")) {
      return {
        revenueCatEntitlementId: "stolity_lite_monthly",
        duration: "monthly",
        firebaseEntitlementId: "stolity_lite_monthly",
      };
    }
    if (entitlementIds.includes("stolity_lite_yearly")) {
      return {
        revenueCatEntitlementId: "stolity_lite_yearly",
        duration: "yearly",
        firebaseEntitlementId: "stolity_lite_yearly",
      };
    }
    return null; // Free / no plan
  };

  const planGrant = resolvePlanGrant();

  const firebaseUpdatedTimeStr = new Date().toLocaleString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  try {
    if (planGrant && revenueCatKey) {
      // Step 1: GET subscriber from RevenueCat
      await fetch(
        `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userEmail)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${revenueCatKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Step 2: Grant promotional entitlement in RevenueCat
      const grantResponse = await fetch(
        `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userEmail)}/entitlements/${planGrant.revenueCatEntitlementId}/promotional`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${revenueCatKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            duration: planGrant.duration,
          }),
        }
      );

      if (!grantResponse.ok) {
        console.warn("RevenueCat grant failed, but continuing...");
      }

      showToast(
        "info",
        "Processing... Updating plan in Firebase",
        "Please wait"
      );
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    // Step 3: Update Firebase subscription (plan + storage + expiry)
    const userRef = doc(db, "users", user.id);
    const storageLabel = storageValue.trim()
      ? `${storageValue.trim()} GB`
      : planGrant
        ? "50 GB"
        : "5 GB";

    await updateDoc(userRef, {
      "subscription.entitlement_ids": planGrant
        ? [planGrant.firebaseEntitlementId]
        : [],
      "subscription.expiration_at": planGrant
        ? expirationAt
          ? Number(expirationAt)
          : null
        : null,
      "subscription.storage": storageLabel,
      "subscription.firebase_updated_time": firebaseUpdatedTimeStr,
      "subscription.storageUpdatedAt": serverTimestamp(),
      "subscription.subscriptionUpdatedAt": serverTimestamp(),
    });

    showToast("success", "Plan updated successfully", "Success");
    dispatch(fetchAllUsers());
    onClose();
  } catch (err) {
    console.error("Upgrade plan error:", err);
    showToast("error", err.message || "Failed to upgrade plan", "Error");
  }
};

/** End premium by setting expiration_at to yesterday (only for active premium). */
const handleEndPremium = async () => {
  if (!isActivePremium || endingPremium) return;

  const confirmed = window.confirm(
    `End premium for ${userEmail || "this user"}?\n\nExpiration will be set to yesterday and storage will reset to 5 GB.`
  );
  if (!confirmed) return;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(23, 59, 59, 999);
  const yesterdayMs = yesterday.getTime();

  const firebaseUpdatedTimeStr = new Date().toLocaleString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  setEndingPremium(true);
  try {
    const userRef = doc(db, "users", user.id);
    await updateDoc(userRef, {
      "subscription.entitlement_ids": [],
      "subscription.expiration_at": yesterdayMs,
      "subscription.storage": "5 GB",
      "subscription.firebase_updated_time": firebaseUpdatedTimeStr,
      "subscription.storageUpdatedAt": serverTimestamp(),
      "subscription.subscriptionUpdatedAt": serverTimestamp(),
    });

    setSubscription((prev) => ({
      ...(prev || {}),
      entitlement_ids: [],
      expiration_at: yesterdayMs,
      storage: "5 GB",
      firebase_updated_time: firebaseUpdatedTimeStr,
    }));
    setEntitlementIds([]);
    setExpirationAt(String(yesterdayMs));
    setStorageValue("5");

    showToast("success", "Premium ended (expiry set to yesterday)", "Success");
    dispatch(fetchAllUsers());
    onClose();
  } catch (err) {
    console.error("End premium error:", err);
    showToast("error", err.message || "Failed to end premium", "Error");
  } finally {
    setEndingPremium(false);
  }
};

useEffect(() => {
  console.log("Selected User:", user);
}, [user]);

useEffect(() => {
  setSharedFolders(normalizeSharedFolders(user?.folders));
  setNewSharedFolder("");
}, [user]);

const sanitizeSharedFolderInput = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\\/g, "/")
    .replace(/^\/+|\/+$/g, "")
    .replace(/\s+/g, "");

const isValidSharedFolderName = (name) => {
  if (!name) return false;
  if (name.includes("/")) return false;
  if (!/^[a-z0-9][a-z0-9.-]*[a-z0-9]$/.test(name) && !/^[a-z0-9]$/.test(name)) {
    return false;
  }
  return true;
};

const handleAddSharedFolder = () => {
  const next = sanitizeSharedFolderInput(newSharedFolder);
  if (!isValidSharedFolderName(next)) {
    showToast(
      "error",
      "Use a valid folder name (e.g. infomanav.in, king.in). No spaces or slashes.",
      "Invalid folder"
    );
    return;
  }
  if (sharedFolders.includes(next)) {
    showToast("warning", "That shared folder is already assigned.", "Duplicate");
    return;
  }
  setSharedFolders((prev) => [...prev, next]);
  setNewSharedFolder("");
};

const handleRemoveSharedFolder = (folderName) => {
  setSharedFolders((prev) => prev.filter((f) => f !== folderName));
};

const handleSaveSharedFolders = async () => {
  if (!hasSharedFolderChanges || savingSharedFolders) return;

  setSavingSharedFolders(true);
  try {
    const userRef = doc(db, "users", user.id);
    const payload = sharedFolders.length > 0 ? sharedFolders : null;

    await updateDoc(userRef, { folders: payload });

    showToast("success", "Shared folders updated", "Success");
    dispatch(fetchAllUsers());
    onClose();
  } catch (err) {
    console.error("Failed to update shared folders:", err);
    showToast("error", err.message || "Failed to update shared folders", "Error");
  } finally {
    setSavingSharedFolders(false);
  }
};


const handleSave = async () => {
  // 🧹 CLEAN invalid company IDs ('' / null / undefined)
  const cleanedCompanies = selectedCompanies.filter(
    (id) => typeof id === "string" && id.trim() !== ""
  );

  const needsCompany =
    role === "ADMIN" || role === "JOB_PORTAL_MANAGER";

  if (!role) {
    console.warn("Save blocked: role is required");
    return;
  }

  if (needsCompany && cleanedCompanies.length === 0) {
    console.warn(
      `Save blocked: ${role} must have at least one valid company`
    );
    return;
  }

  try {
    console.log("Saving jobPortal update");
    console.log("User ID:", user.id);
    console.log("Old jobPortal:", user.jobPortal);
    console.log("New jobPortal:", {
      role,
      companies: cleanedCompanies,
    });

    const userRef = doc(db, "users", user.id);

    await updateDoc(userRef, {
      jobPortal: {
        role,
        companies: cleanedCompanies, // ✅ cleaned
      },
    });

    dispatch(fetchAllUsers());
    onClose();
  } catch (err) {
    console.error("Failed to update jobPortal:", err);
  }
};


const handleToggleSoftBan = async () => {
  if (!userEmail) { // replace userEmail with your actual variable if different
    showToast(
    "error",
    "User email not available",
    "Error"
  );
    return;
  }

  try {
    // Find user by email
    const q = query(collection(db, "users"), where("email", "==", userEmail));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        showToast(
          "error",
          "User not found",
          "Error"
        );
      return;
    }

    const userDoc = snapshot.docs[0];
    const userId = userDoc.id;
    const newBanStatus = !isSoftBan;

    await updateDoc(doc(db, "users", userId), {
      isSoftBan: newBanStatus,
      softBanAt: serverTimestamp(),
      softBanBy: currentAdmin?.email || adminEmail || "unknown-admin", // currentAdmin from your selector
    });

    setIsSoftBan(newBanStatus);
    onClose();

    showToast(
      "success",
      newBanStatus ? "User has been soft-banned" : "Soft ban lifted",
      "Success"
    );

    // TODO: Refresh user data here if needed
    // dispatch(fetchCurrentUserByEmail(userEmail));
    dispatch(fetchAllUsers());

  } catch (err) {
    console.error("Soft ban toggle failed:", err);
    showToast(
      "error",
      "Failed to update ban status",
      "Error"
    );
  }
};


const handleCreateCompany = async () => {
  if (!newCompanyName.trim()) return;

  try {
    const slug = slugify(newCompanyName, { lower: true, strict: true });

    const docRef = await addDoc(collection(db, "companyMaster"), {
      name: newCompanyName.trim(),
      slug,
      email: "",
      mobile: "",
      description: "",
      location: [],
      logoUrl: "",
      isConfigured: false,
      isSMTPActivated: false,
      isActive: true,
      createdBy: user.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // auto-assign new company to user
    setSelectedCompanies((prev) => [...prev, docRef.id]);
    setNewCompanyName("");

    // refresh companies list
    dispatch(fetchCompanies());

    console.log("Company created:", docRef.id, slug);
  } catch (err) {
    console.error("Create company failed:", err);
  }
};







  if (!user) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>Manage User</div>
            <div style={{ fontSize: 13, color: "#777" }}>{user.email}</div>
          </div>
          <button onClick={onClose} style={closeBtnStyle}>✕</button>
        </div>

        {/* Tabs */}
        <div style={tabBarStyle}>
          <button
            onClick={() => setActiveTab("ASSIGN")}
            style={tabBtnStyle(activeTab === "ASSIGN")}
          >
            Assign Role & Company
          </button>

          <button
            onClick={() => setActiveTab("PLAN")}
            style={tabBtnStyle(activeTab === "PLAN")}
          >
            Upgrade Plan
          </button>

          <button
            onClick={() => setActiveTab("SOFT_BAN")}
            style={tabBtnStyle(activeTab === "SOFT_BAN")}
          >
            Soft Ban
          </button>

          <button
            onClick={() => setActiveTab("SHARED_FOLDERS")}
            style={tabBtnStyle(activeTab === "SHARED_FOLDERS")}
          >
            Shared Folder
          </button>
        </div>

        {/* Content */}
        <div style={contentStyle}>
        {activeTab === "ASSIGN" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            
            {/* Role */}
            <div>
            <div style={labelStyle}>Role</div>
            <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={selectStyle}
            >
                <option value="">Select role</option>
                <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                <option value="ADMIN">ADMIN</option>
                <option value="JOB_PORTAL_MANAGER">JOB_PORTAL_MANAGER</option>
            </select>
            </div>

            {/* Companies */}
            <div>
            <div style={labelStyle}>Company Access</div>

            <div style={companyListStyle}>
                {companies.map((c) => (
                <label key={c.id} style={companyRowStyle}>
                    <input
                    type="checkbox"
                    checked={selectedCompanies.includes(c.id)}
                    onChange={(e) => {
                        if (e.target.checked) {
                        setSelectedCompanies([...selectedCompanies, c.id]);
                        } else {
                        setSelectedCompanies(
                            selectedCompanies.filter((id) => id !== c.id)
                        );
                        }
                    }}
                    />
                    <span>{c.name}</span>
                    {!c.isConfigured && (
                    <span style={notConfiguredBadge}>Not Configured</span>
                    )}
                </label>
                ))}
            </div>
            </div>

            {/* Create Company */}
            <div>
            <div style={labelStyle}>Create New Company</div>
            <div style={{ display: "flex", gap: 10 }}>
                <input
                placeholder="Company name"
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                style={inputStyle}
                />
                <button
                style={{
                    ...primaryBtnStyle,
                    cursor: newCompanyName.trim() ? "pointer" : "not-allowed",
                    opacity: newCompanyName.trim() ? 1 : 0.6,
                }}
                disabled={!newCompanyName.trim()}
                onClick={handleCreateCompany}
                >
                Create
                </button>

            </div>
            </div>

        </div>
        )}
 

{activeTab === "PLAN" && (
  <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
    <h3 style={{ 
      margin: 0, 
      fontSize: "20px", 
      fontWeight: 600, 
      color: "#1e293b" 
    }}>
      Manage Subscription
    </h3>

    {/* CURRENT STATUS */}
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      gap: 12 
    }}>
      <div style={labelStyle}>Current Plan</div>
      
      {subscription && subscription.expiration_at ? (
        (() => {
          const now = Date.now();
          const expirationTime = Number(subscription.expiration_at);
          const isExpired = expirationTime <= now;

          if (isExpired) {
            return (
              <div style={{
                padding: "20px",
                background: "#fef2f2",
                borderRadius: "12px",
                border: "1px solid #fecaca",
                color: "#991b1b",
                fontSize: "15px",
                fontWeight: 500,
              }}>
                Free User (Expired) — 5 GB storage
                <div style={{ marginTop: 8, fontSize: "13px", opacity: 0.9 }}>
                  Expired on {new Date(expirationTime).toLocaleDateString("en-IN", {
                    dateStyle: "medium"
                  })}
                </div>
              </div>
            );
          }

          // Active Premium Subscription
          return (
            <div style={{
              padding: "20px",
              background: "#ffffff",
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              fontSize: "14px",
            }}>
              <div style={currentItemStyle}>
                <span style={currentLabelStyle}>Plan</span>
                <span>
                  {(() => {
                    const id = subscription.entitlement_ids?.[0];
                    if (id === "stolity_lite_trial") return "Stolity Trial - 1 week";
                    if (id === "stolity_lite_monthly") return "Stolity Lite Monthly";
                    if (id === "stolity_lite_yearly") return "Stolity Lite Yearly";
                    return subscription.entitlement_ids?.join(", ") || "None";
                  })()}
                </span>
              </div>
              <div style={currentItemStyle}>
                <span style={currentLabelStyle}>Storage</span>
                <span>{subscription.storage || "—"}</span>
              </div>
              <div style={currentItemStyle}>
                <span style={currentLabelStyle}>Expires</span>
                <span>
                  {new Date(expirationTime).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </div>
              <div style={{
                ...currentItemStyle,
                borderBottom: "none",
                marginBottom: 0,
                paddingBottom: 0,
              }}>
                <span style={currentLabelStyle}>Last Updated</span>
                <span>{subscription.firebase_updated_time || "—"}</span>
              </div>

              {isActivePremium && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #f1f5f9" }}>
                  <button
                    type="button"
                    onClick={handleEndPremium}
                    disabled={endingPremium}
                    style={{
                      width: "100%",
                      padding: "10px 16px",
                      borderRadius: "999px",
                      border: "1px solid #fecaca",
                      background: endingPremium ? "#fee2e2" : "#fef2f2",
                      color: "#991b1b",
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: endingPremium ? "not-allowed" : "pointer",
                      opacity: endingPremium ? 0.7 : 1,
                    }}
                  >
                    {endingPremium ? "Ending Premium…" : "End Premium"}
                  </button>
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 8, textAlign: "center" }}>
                    Sets expiry to yesterday and resets storage to 5 GB
                  </div>
                </div>
              )}
            </div>
          );
        })()
      ) : (
        /* No subscription at all - Free User */
        <div style={{
          padding: "20px",
          background: "#f0fdf4",
          borderRadius: "12px",
          border: "1px solid #86efac",
          color: "#166534",
          fontSize: "15px",
          fontWeight: 500,
        }}>
          Free User — 5 GB storage
        </div>
      )}
    </div>

    {/* EDIT / UPGRADE FORM */}
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      gap: 24,
      paddingTop: 12,
      borderTop: "1px solid #f0e6d8",
    }}>
      <div>
        <div style={labelStyle}>Select Plan</div>
        <select
          value={entitlementIds.length > 0 ? entitlementIds[0] : ""}
          onChange={(e) => {
            const selectedPlan = e.target.value;
            let newEntitlementIds = selectedPlan ? [selectedPlan] : [];
            let newStorage = selectedPlan ? "50" : storageValue;

            setEntitlementIds(newEntitlementIds);
            setStorageValue(newStorage);

            // Auto-set expiration_at (hidden field)
            if (selectedPlan) {
              const now = Date.now();
              let futureMs;
              if (selectedPlan === "stolity_lite_trial") {
                futureMs = now + (7 * 24 * 60 * 60 * 1000); // 1 week
              } else if (selectedPlan === "stolity_lite_monthly") {
                futureMs = now + (30.44 * 24 * 60 * 60 * 1000);   // ~1 month
              } else if (selectedPlan === "stolity_lite_yearly") {
                futureMs = now + (365.25 * 24 * 60 * 60 * 1000);  // ~1 year
              }
              setExpirationAt(Math.round(futureMs).toString());
            } else {
              setExpirationAt("");
            }
          }}
          style={{
            ...selectStyle,
            padding: "12px 44px 12px 16px",
          }}
        >
          <option value="">No Plan (Free)</option>
          <option value="stolity_lite_trial">Stolity Trial - 1 week</option>
          <option value="stolity_lite_monthly">Stolity Lite Monthly</option>
          <option value="stolity_lite_yearly">Stolity Lite Yearly</option>
        </select>
      </div>

      <div>
        <div style={labelStyle}>Storage (GB – number only)</div>
        <input
          list="storage-options"
          placeholder="e.g. 50"
          value={storageValue}
          onChange={(e) => setStorageValue(e.target.value)}
          style={inputStyle}
        />
        <datalist id="storage-options">
          <option value="50" />
          <option value="75" />
          <option value="100" />
          <option value="200" />
          <option value="500" />
          <option value="1000" />
          <option value="2000" />
        </datalist>
        <div style={{ fontSize: "12px", color: "#6b7280", marginTop: 6 }}>
          Selecting a plan auto-sets to 50 GB
        </div>
      </div>
    </div>
  </div>
)}


          {activeTab === "SOFT_BAN" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 600, color: "#1e293b" }}>
                Soft Ban Controls
              </h3>

              {/* Status + Toggle */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  padding: "16px 24px",
                  background: isSoftBan ? "#fee2e2" : "#f0fdf4",
                  borderRadius: "12px",
                  border: `1px solid ${isSoftBan ? "#fca5a5" : "#86efac"}`,
                }}
              >
                <div
                  style={{
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    background: isSoftBan ? "#dc2626" : "#16a34a",
                  }}
                />
                <strong style={{ fontSize: "16px", color: isSoftBan ? "#991b1b" : "#166534" }}>
                  {isSoftBan ? "SOFT-BANNED" : "ACTIVE"}
                </strong>

                {/* Beautiful toggle switch */}
                <label
                  style={{
                    position: "relative",
                    display: "inline-block",
                    width: "60px",
                    height: "34px",
                    marginLeft: "auto",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSoftBan}
                    onChange={handleToggleSoftBan}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      cursor: "pointer",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: isSoftBan ? "#dc2626" : "#ccc",
                      transition: ".4s",
                      borderRadius: "34px",
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        content: "",
                        height: "26px",
                        width: "26px",
                        left: isSoftBan ? "30px" : "4px",
                        bottom: "4px",
                        backgroundColor: "white",
                        transition: ".4s",
                        borderRadius: "50%",
                      }}
                    />
                  </span>
                </label>
              </div>

              {/* Note */}
              <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>
                {isSoftBan
                  ? "User access is restricted. All platform features are paused."
                  : "User account is fully active with no restrictions."}
              </p>
            </div>
          )}

          {activeTab === "SHARED_FOLDERS" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 600, color: "#1e293b" }}>
                Shared Folder Access
              </h3>

              <p style={{ margin: 0, fontSize: 14, color: "#6b7280", lineHeight: 1.5 }}>
                These names map to folders in the default bucket (e.g.{" "}
                <code style={{ fontSize: 13 }}>infomanav.in</code>). Users see them on
                the Files page via <code style={{ fontSize: 13 }}>GET /shared-folders</code>.
                On signup, non-public email domains are auto-assigned (e.g.{" "}
                <code style={{ fontSize: 13 }}>user@king.in</code> →{" "}
                <code style={{ fontSize: 13 }}>king.in</code>).
              </p>

              {emailDomain && (
                <div
                  style={{
                    padding: "14px 16px",
                    borderRadius: 12,
                    border: "1px solid #e8dccb",
                    background: "#fffaf3",
                    fontSize: 14,
                    color: "#4b5563",
                  }}
                >
                  Email domain: <strong>{emailDomain}</strong>
                  {sharedFolders.includes(emailDomain) ? (
                    <span style={{ marginLeft: 8, color: "#166534" }}>
                      — already assigned
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (!sharedFolders.includes(emailDomain)) {
                          setSharedFolders((prev) => [...prev, emailDomain]);
                        }
                      }}
                      style={{
                        marginLeft: 12,
                        padding: "4px 12px",
                        borderRadius: 999,
                        border: "1px solid #ffab49",
                        background: "#ffe7c6",
                        cursor: "pointer",
                        fontSize: 13,
                        fontWeight: 500,
                      }}
                    >
                      Add {emailDomain}
                    </button>
                  )}
                </div>
              )}

              <div>
                <div style={labelStyle}>Assigned shared folders</div>
                {sharedFolders.length === 0 ? (
                  <div
                    style={{
                      padding: "16px",
                      borderRadius: 12,
                      border: "1px dashed #e8dccb",
                      color: "#6b7280",
                      fontSize: 14,
                    }}
                  >
                    No shared folders assigned. User will only see their private storage.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {sharedFolders.map((folderName) => (
                      <span
                        key={folderName}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "8px 12px",
                          borderRadius: 999,
                          border: "1px solid #e8dccb",
                          background: "#ffffff",
                          fontSize: 14,
                        }}
                      >
                        {folderName}
                        <button
                          type="button"
                          onClick={() => handleRemoveSharedFolder(folderName)}
                          style={{
                            border: "none",
                            background: "transparent",
                            cursor: "pointer",
                            color: "#9ca3af",
                            fontSize: 16,
                            lineHeight: 1,
                            padding: 0,
                          }}
                          aria-label={`Remove ${folderName}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div style={labelStyle}>Add custom shared folder</div>
                <div style={{ display: "flex", gap: 10 }}>
                  <input
                    placeholder="e.g. partner.com or custom-folder"
                    value={newSharedFolder}
                    onChange={(e) => setNewSharedFolder(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddSharedFolder();
                      }
                    }}
                    style={inputStyle}
                  />
                  <button
                    type="button"
                    style={{
                      ...primaryBtnStyle,
                      cursor: newSharedFolder.trim() ? "pointer" : "not-allowed",
                      opacity: newSharedFolder.trim() ? 1 : 0.6,
                    }}
                    disabled={!newSharedFolder.trim()}
                    onClick={handleAddSharedFolder}
                  >
                    Add
                  </button>
                </div>
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>
                  Lowercase, no spaces. The folder must exist or receive uploads in the default bucket.
                </div>
              </div>
            </div>
          )}



        </div>

        {/* Footer */}
        {/* <div style={footerStyle}>
          <button onClick={onClose} style={cancelBtnStyle}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
                ...saveBtnStyle,
                cursor: canSave ? "pointer" : "not-allowed",
                opacity: canSave ? 1 : 0.6,
            }}
            disabled={!canSave}
            >
            Save
            </button>


        </div> */}
        {/* Footer */}
<div style={footerStyle}>
  <button onClick={onClose} style={cancelBtnStyle}>
    Cancel
  </button>

  {activeTab === "ASSIGN" && (
    <button
      onClick={handleSave}
      style={{
        ...saveBtnStyle,
        cursor: canSave ? "pointer" : "not-allowed",
        opacity: canSave ? 1 : 0.6,
      }}
      disabled={!canSave}
    >
      Save
    </button>
  )}

  {activeTab === "PLAN" && (
    <button
      onClick={handleUpgradePlan}
      style={{
        ...saveBtnStyle,
        cursor: hasChanges ? "pointer" : "not-allowed",
        opacity: hasChanges ? 1 : 0.6,
      }}
      disabled={!hasChanges}
    >
      Update Plan
    </button>
  )}

  {activeTab === "SHARED_FOLDERS" && (
    <button
      onClick={handleSaveSharedFolders}
      style={{
        ...saveBtnStyle,
        cursor:
          hasSharedFolderChanges && !savingSharedFolders
            ? "pointer"
            : "not-allowed",
        opacity: hasSharedFolderChanges && !savingSharedFolders ? 1 : 0.6,
      }}
      disabled={!hasSharedFolderChanges || savingSharedFolders}
    >
      {savingSharedFolders ? "Saving…" : "Save Shared Folders"}
    </button>
  )}


</div>
      </div>
    </div>
  );
};

export default ManageUserModal;


const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.35)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const selectStyle = {
  width: "100%",
  padding: "12px 44px 12px 16px",
  borderRadius: "999px",
  border: "1px solid #E8DCCB",
  backgroundColor: "#FFFFFF",
  color: "#2F2F2F",
  cursor: "pointer",
  appearance: "none",
  WebkitAppearance: "none",
  MozAppearance: "none",
  backgroundImage:
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'><path fill='%23999999' d='M6 8L0 0h12z'/></svg>\")",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 16px center",
};

const inputStyle = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: "999px",
  border: "1px solid #E8DCCB",
  outline: "none",
  fontSize: "14px",
  color: "#2F2F2F",
  background: "#FFFFFF",
};


const modalStyle = {
  width: "800px",
  background: "#FFFFFF",
  borderRadius: "18px",
  boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
  display: "flex",
  flexDirection: "column",
  maxHeight: "85vh",  
  overflow:"auto"
};

const headerStyle = {
  padding: "20px 24px",
  borderBottom: "1px solid #F0E6D8",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const closeBtnStyle = {
  border: "none",
  background: "transparent",
  fontSize: 18,
  cursor: "pointer",
};

const tabBarStyle = {
  display: "flex",
  gap: 8,
  padding: "16px 24px",
  borderBottom: "1px solid #F0E6D8",
};

const tabBtnStyle = (active) => ({
  padding: "10px 18px",
  borderRadius: "999px",
  border: active ? "1px solid #FFAB49" : "1px solid #E8DCCB",
  background: active ? "#FFE7C6" : "#FFFFFF",
  color: "#2F2F2F",
  cursor: "pointer",
  fontWeight: 500,
});

const contentStyle = {
  padding: "24px",
  flex: 1,
  overflowY: "auto",
};

const footerStyle = {
  padding: "16px 24px",
  borderTop: "1px solid #F0E6D8",
  display: "flex",
  justifyContent: "flex-end",
  gap: 12,
};

const cancelBtnStyle = {
  padding: "8px 18px",
  borderRadius: "999px",
  border: "1px solid #E8DCCB",
  background: "#FFFFFF",
  cursor: "pointer",
};

const saveBtnStyle = {
  padding: "8px 20px",
  borderRadius: "999px",
  border: "none",
  background: "#FFAB49",
  color: "#FFFFFF",
  cursor: "not-allowed",
};

const labelStyle = {
  fontSize: 13,
  fontWeight: 600,
  marginBottom: 6,
  color: "#555",
};

const companyListStyle = {
  border: "1px solid #F0E6D8",
  borderRadius: 12,
  padding: 12,
  maxHeight: 220,
  overflowY: "auto",
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const companyRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  fontSize: 14,
};

const notConfiguredBadge = {
  marginLeft: "auto",
  fontSize: 11,
  padding: "2px 8px",
  borderRadius: 999,
  background: "#FFF1DF",
  border: "1px solid #E8DCCB",
};

const primaryBtnStyle = {
  padding: "10px 18px",
  borderRadius: 999,
  border: "none",
  background: "#FFAB49",
  color: "#fff",
  cursor: "not-allowed",
};

const currentItemStyle = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: 10,
  paddingBottom: 10,
  borderBottom: "1px solid #f1f5f9",
};

const currentLabelStyle = {
  fontWeight: 500,
  color: "#4b5563",
  minWidth: "120px",
};