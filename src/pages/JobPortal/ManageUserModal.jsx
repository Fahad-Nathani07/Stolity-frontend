import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
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
import "./ManageUserModal.css";




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

  const tabs = [
    { id: "ASSIGN", label: "Assign Role & Company" },
    { id: "PLAN", label: "Upgrade Plan" },
    { id: "SOFT_BAN", label: "Soft Ban" },
    { id: "SHARED_FOLDERS", label: "Shared Folder" },
  ];

  return createPortal(
    <div className="mum-overlay" onClick={onClose}>
      <div className="mum-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="mum-header">
          <div className="mum-header-main">
            <div className="mum-icon-wrap" aria-hidden="true">
              {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
            </div>
            <div className="mum-header-text">
              <span className="mum-badge">Admin</span>
              <h2 className="mum-title">Manage User</h2>
              <p className="mum-subtitle">{user.email}</p>
            </div>
          </div>
          <button type="button" className="mum-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="mum-tabs" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`mum-tab${activeTab === tab.id ? " is-active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mum-body">
          {activeTab === "ASSIGN" && (
            <div className="mum-section">
              <div className="mum-field">
                <label className="mum-label" htmlFor="mum-role">
                  Role
                </label>
                <select
                  id="mum-role"
                  className="mum-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="">Select role</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="JOB_PORTAL_MANAGER">JOB_PORTAL_MANAGER</option>
                </select>
              </div>

              <div className="mum-field">
                <div className="mum-label">Company Access</div>
                <div className="mum-company-list">
                  {companies.map((c) => (
                    <label key={c.id} className="mum-company-row">
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
                      <span className="mum-company-name">{c.name}</span>
                      {!c.isConfigured && (
                        <span className="mum-badge-warn">Not Configured</span>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              <div className="mum-field">
                <div className="mum-label">Create New Company</div>
                <div className="mum-row">
                  <input
                    className="mum-input"
                    placeholder="Company name"
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                  />
                  <button
                    type="button"
                    className="mum-btn mum-btn--primary"
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
            <div className="mum-section">
              <h3 className="mum-section-title">Manage Subscription</h3>

              <div className="mum-field">
                <div className="mum-label">Current Plan</div>

                {subscription && subscription.expiration_at ? (
                  (() => {
                    const now = Date.now();
                    const expirationTime = Number(subscription.expiration_at);
                    const isExpired = expirationTime <= now;

                    if (isExpired) {
                      return (
                        <div className="mum-card mum-card--danger">
                          Free User (Expired) — 5 GB storage
                          <div className="mum-hint" style={{ marginTop: 8, color: "inherit", opacity: 0.9 }}>
                            Expired on{" "}
                            {new Date(expirationTime).toLocaleDateString("en-IN", {
                              dateStyle: "medium",
                            })}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="mum-card">
                        <div className="mum-meta-row">
                          <span className="mum-meta-key">Plan</span>
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
                        <div className="mum-meta-row">
                          <span className="mum-meta-key">Storage</span>
                          <span>{subscription.storage || "—"}</span>
                        </div>
                        <div className="mum-meta-row">
                          <span className="mum-meta-key">Expires</span>
                          <span>
                            {new Date(expirationTime).toLocaleString("en-IN", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </span>
                        </div>
                        <div className="mum-meta-row">
                          <span className="mum-meta-key">Last Updated</span>
                          <span>{subscription.firebase_updated_time || "—"}</span>
                        </div>

                        {isActivePremium && (
                          <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid #f1f5f9" }}>
                            <button
                              type="button"
                              className="mum-btn mum-btn--danger"
                              onClick={handleEndPremium}
                              disabled={endingPremium}
                            >
                              {endingPremium ? "Ending Premium…" : "End Premium"}
                            </button>
                            <div className="mum-hint" style={{ marginTop: 8, textAlign: "center" }}>
                              Sets expiry to yesterday and resets storage to 5 GB
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()
                ) : (
                  <div className="mum-card mum-card--ok">Free User — 5 GB storage</div>
                )}
              </div>

              <div
                className="mum-section"
                style={{ paddingTop: 4, borderTop: "1px solid #f1f5f9", gap: 16 }}
              >
                <div className="mum-field">
                  <label className="mum-label" htmlFor="mum-plan">
                    Select Plan
                  </label>
                  <select
                    id="mum-plan"
                    className="mum-select"
                    value={entitlementIds.length > 0 ? entitlementIds[0] : ""}
                    onChange={(e) => {
                      const selectedPlan = e.target.value;
                      let newEntitlementIds = selectedPlan ? [selectedPlan] : [];
                      let newStorage = selectedPlan ? "50" : storageValue;

                      setEntitlementIds(newEntitlementIds);
                      setStorageValue(newStorage);

                      if (selectedPlan) {
                        const now = Date.now();
                        let futureMs;
                        if (selectedPlan === "stolity_lite_trial") {
                          futureMs = now + 7 * 24 * 60 * 60 * 1000;
                        } else if (selectedPlan === "stolity_lite_monthly") {
                          futureMs = now + 30.44 * 24 * 60 * 60 * 1000;
                        } else if (selectedPlan === "stolity_lite_yearly") {
                          futureMs = now + 365.25 * 24 * 60 * 60 * 1000;
                        }
                        setExpirationAt(Math.round(futureMs).toString());
                      } else {
                        setExpirationAt("");
                      }
                    }}
                  >
                    <option value="">No Plan (Free)</option>
                    <option value="stolity_lite_trial">Stolity Trial - 1 week</option>
                    <option value="stolity_lite_monthly">Stolity Lite Monthly</option>
                    <option value="stolity_lite_yearly">Stolity Lite Yearly</option>
                  </select>
                </div>

                <div className="mum-field">
                  <label className="mum-label" htmlFor="mum-storage">
                    Storage (GB – number only)
                  </label>
                  <input
                    id="mum-storage"
                    className="mum-input"
                    list="storage-options"
                    placeholder="e.g. 50"
                    value={storageValue}
                    onChange={(e) => setStorageValue(e.target.value)}
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
                  <div className="mum-hint">Selecting a plan auto-sets to 50 GB</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "SOFT_BAN" && (
            <div className="mum-section">
              <h3 className="mum-section-title">Soft Ban Controls</h3>

              <div
                className={`mum-status-row ${isSoftBan ? "mum-card--danger" : "mum-card--ok"}`}
                style={{ border: `1px solid ${isSoftBan ? "#fca5a5" : "#86efac"}` }}
              >
                <div
                  className="mum-status-dot"
                  style={{ background: isSoftBan ? "#dc2626" : "#16a34a" }}
                />
                <strong
                  className="mum-status-label"
                  style={{ color: isSoftBan ? "#991b1b" : "#166534" }}
                >
                  {isSoftBan ? "SOFT-BANNED" : "ACTIVE"}
                </strong>

                <label className="mum-toggle">
                  <input
                    type="checkbox"
                    checked={isSoftBan}
                    onChange={handleToggleSoftBan}
                  />
                  <span className="mum-toggle-track" />
                </label>
              </div>

              <p className="mum-section-desc">
                {isSoftBan
                  ? "User access is restricted. All platform features are paused."
                  : "User account is fully active with no restrictions."}
              </p>
            </div>
          )}

          {activeTab === "SHARED_FOLDERS" && (
            <div className="mum-section">
              <h3 className="mum-section-title">Shared Folder Access</h3>

              <p className="mum-section-desc">
                These names map to folders in the default bucket (e.g.{" "}
                <code>infomanav.in</code>). Users see them on the Files page via{" "}
                <code>GET /shared-folders</code>. On signup, non-public email domains are
                auto-assigned (e.g. <code>user@king.in</code> → <code>king.in</code>).
              </p>

              {emailDomain && (
                <div className="mum-card mum-card--soft" style={{ fontSize: 14, color: "#4b5563" }}>
                  Email domain: <strong>{emailDomain}</strong>
                  {sharedFolders.includes(emailDomain) ? (
                    <span style={{ marginLeft: 8, color: "#166534" }}>— already assigned</span>
                  ) : (
                    <button
                      type="button"
                      className="mum-btn mum-btn--sm"
                      style={{ marginLeft: 12 }}
                      onClick={() => {
                        if (!sharedFolders.includes(emailDomain)) {
                          setSharedFolders((prev) => [...prev, emailDomain]);
                        }
                      }}
                    >
                      Add {emailDomain}
                    </button>
                  )}
                </div>
              )}

              <div className="mum-field">
                <div className="mum-label">Assigned shared folders</div>
                {sharedFolders.length === 0 ? (
                  <div className="mum-empty">
                    No shared folders assigned. User will only see their private storage.
                  </div>
                ) : (
                  <div className="mum-chip-list">
                    {sharedFolders.map((folderName) => (
                      <span key={folderName} className="mum-chip">
                        {folderName}
                        <button
                          type="button"
                          className="mum-chip-remove"
                          onClick={() => handleRemoveSharedFolder(folderName)}
                          aria-label={`Remove ${folderName}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mum-field">
                <div className="mum-label">Add custom shared folder</div>
                <div className="mum-row">
                  <input
                    className="mum-input"
                    placeholder="e.g. partner.com or custom-folder"
                    value={newSharedFolder}
                    onChange={(e) => setNewSharedFolder(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddSharedFolder();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="mum-btn mum-btn--primary"
                    disabled={!newSharedFolder.trim()}
                    onClick={handleAddSharedFolder}
                  >
                    Add
                  </button>
                </div>
                <div className="mum-hint">
                  Lowercase, no spaces. The folder must exist or receive uploads in the default
                  bucket.
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mum-footer">
          <button type="button" className="mum-btn mum-btn--ghost" onClick={onClose}>
            Cancel
          </button>

          {activeTab === "ASSIGN" && (
            <button
              type="button"
              className="mum-btn mum-btn--primary"
              onClick={handleSave}
              disabled={!canSave}
            >
              Save
            </button>
          )}

          {activeTab === "PLAN" && (
            <button
              type="button"
              className="mum-btn mum-btn--primary"
              onClick={handleUpgradePlan}
              disabled={!hasChanges}
            >
              Update Plan
            </button>
          )}

          {activeTab === "SHARED_FOLDERS" && (
            <button
              type="button"
              className="mum-btn mum-btn--primary"
              onClick={handleSaveSharedFolders}
              disabled={!hasSharedFolderChanges || savingSharedFolders}
            >
              {savingSharedFolders ? "Saving…" : "Save Shared Folders"}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ManageUserModal;
