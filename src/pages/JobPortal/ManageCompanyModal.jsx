import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { serverTimestamp } from "firebase/firestore";
import { useDispatch } from "react-redux";
import { updateCompany } from "../../store/companyMasterSlice"; // Adjust path to your slice
import { toaster, Notification } from 'rsuite';
import AssignedUsersToCompany from "../JobPortal/AssignedUsersToCompany";
import PostedJobsForCompany from "../JobPortal/PostedJobsForCompany";
import BrandingSettings from "../JobPortal/BrandingSettings";
import SoftBanCompanyControls from "./SoftBanCompanyControls";
import { showToast } from "../../components/ToastProvider";

const ManageCompanyModal = ({ company, onClose }) => {
  // Hooks must be at the top — unconditionally
  const [activeSection, setActiveSection] = useState("overview");

  // Early return is safe AFTER hooks
  if (!company) return null;

  const navItems = [
    { id: "overview", label: "Overview", color: "#FFAB49" },
    { id: "edit", label: "Edit Details", color: "#FFAB49" },
    { id: "users", label: "Assigned Users", color: "#4CAF50" },
    { id: "jobs", label: "Posted Jobs", color: "#2196F3" },
    { id: "branding", label: "Branding", color: "#9C27B0" },
    { id: "ban", label: "Soft Ban", color: "#f44336" },
    // { id: "delete", label: "Delete", color: "#757575" },
  ];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.65)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
        backdropFilter: "blur(10px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "24px",
          width: "90vw",
          maxWidth: "1400px",
          height: "92vh",
          maxHeight: "96vh",
          display: "flex",
          overflow: "hidden",
          boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Sidebar – Navigation */}
        <div
          style={{
            width: "260px",
            background: "#ffffff",
            borderRight: "1px solid #f0f0f0",
            padding: "32px 20px",
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
          }}
        >
          {/* Company Logo & Name at top of sidebar */}
          <div style={{
            textAlign: "center",
            marginBottom: "32px",
          }}>
            {company.logoUrl ? (
              <img
                src={company.logoUrl}
                alt={`${company.name} Logo`}
                style={{
                  width: "14vw",
                  // width: "120px",
                  // height: "120px",
                  objectFit: "contain",
                  // borderRadius: "16px",
                  // boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
                  // marginBottom: "12px",
                  // border: "4px solid #fff",
                }}
              />
            ) : (
              <div style={{
                width: "120px",
                height: "120px",
                background: "#f8f9fa",
                borderRadius: "16px",
                margin: "0 auto 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "48px",
                color: "#ddd",
                boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
              }}>
                ?
              </div>
            )}

            <h3 style={{
              margin: "0 0 4px",
              fontSize: "22px",
              fontWeight: 700,
              color: "#1a1a1a",
            }}>
              {company.name}
            </h3>
            <p style={{
              margin: 0,
              color: "#777",
              fontSize: "14px",
              fontWeight: 500,
            }}>
              {company.slug}
            </p>
          </div>

          {/* Quick Stats */}
         {/* Quick Stats – only Configured and isActive */}
<div style={{
  padding: "20px",
  background: "#fffaf5",
  borderRadius: "16px",
  marginBottom: "32px",
  border: "1px solid #ffe8d1",
}}>
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", textAlign: "center" }}>
    <div>
      <div style={{ fontSize: "20px", fontWeight: 700, color: "#FFAB49" }}>
        {company.isConfigured ? "Yes" : "No"}
      </div>
      <div style={{ fontSize: "13px", color: "#666" }}>Configured</div>
    </div>
    <div>
      <div style={{ fontSize: "20px", fontWeight: 700, color: company.companySoftBan ? "#f44336" : "#4CAF50" }}>
        {/* {company.isActive ? "Active" : "Inactive"} */} 
        {company.companySoftBan ? "Inactive" : "Active"}
      </div>
      <div style={{ fontSize: "13px", color: "#666" }}>Status</div>
    </div>
  </div>
</div>

          {/* Navigation Buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                style={{
                  padding: "14px 20px",
                  fontSize: "15px",
                  fontWeight: activeSection === item.id ? 600 : 500,
                  color: activeSection === item.id ? "#1a1a1a" : "#555",
                  background: activeSection === item.id ? "#fffaf5" : "transparent",
                  borderLeft: activeSection === item.id 
                    ? `4px solid ${item.color}` 
                    : "4px solid transparent",
                  borderRadius: "0 12px 12px 0",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  textAlign: "left",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  if (activeSection !== item.id) {
                    e.currentTarget.style.background = "#f9f9f9";
                    e.currentTarget.style.color = "#333";
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeSection !== item.id) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "#555";
                  }
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "40px 48px",
          background: "#ffffff",
        }}>
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "32px",
            }}
          >
            <h2 style={{
              margin: 0,
              fontSize: "32px",
              fontWeight: 700,
              color: "#1a1a1a",
            }}>
              {company.name}
              <span style={{
                fontSize: "18px",
                fontWeight: 500,
                color: "#666",
                marginLeft: "16px",
              }}>
                {company.slug}
              </span>
            </h2>

            <button
              onClick={onClose}
              style={{
                padding: "12px 28px",
                border: "1px solid #e0e0e0",
                borderRadius: "999px",
                background: "#ffffff",
                fontWeight: 600,
                fontSize: "15px",
                color: "#333",
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>

          {/* Dynamic Content */}
          {activeSection === "overview" && <OverviewSection company={company} />}
          {activeSection === "edit" && <EditSection company={company} onClose={onClose} />}
          {activeSection === "users" && <AssignedUsersToCompany companyId={company.id} />}
          {activeSection === "jobs" && <PostedJobsForCompany company={company} />}
          {activeSection === "branding" && <BrandingSettings company={company} onClose={onClose} />}
          {/* {activeSection === "ban" && <PlaceholderSection title="Soft Ban Controls" color="#f44336" />} */}
          {activeSection === "ban" && <SoftBanCompanyControls company={company} onToggleSuccess={onClose} />}
          {activeSection === "delete" && <PlaceholderSection title="Permanent Delete" color="#757575" />}
        </div>
      </div> 
    </div>
  );
};


// Overview Section
const OverviewSection = ({ company }) => (
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px" }}>
    {/* Left: Logo + Overview */}
    <div style={{ display: "flex", flexDirection: "column", gap: "36px" }}>
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "16px",
        // padding: "32px 24px",
        padding: "15px",
        // background: "#fffaf5",
        borderRadius: "20px",
        border: "1px solid #eee",
      }}>
        {company.logoUrl ? (
          <img
            src={company.logoUrl}
            alt={`${company.name} Logo`}
            style={{
              width: "20vw",
              // height: "180px",
              objectFit: "contain",
              // borderRadius: "20px",
              // boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
              // border: "6px solid #ffffff",
            }}
          />
        ) : (
          <div style={{
            width: "180px",
            height: "180px",
            background: "#f0f0f0",
            borderRadius: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "72px",
            color: "#ddd",
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
            border: "6px solid #ffffff",
          }}>
            ?
          </div>
        )}
      </div>

      <div style={{
        padding: "28px",
        background: "#fffaf5",
        borderRadius: "20px",
        border: "1px solid #ffe8d1",
      }}>
        <h3 style={{ margin: "0 0 20px", fontSize: "22px", fontWeight: 600, color: "#1a1a1a" }}>
          Company Overview
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          <InfoItem label="Name" value={company.name} />
          <InfoItem label="Slug" value={company.slug} />
          <InfoItem label="Email" value={company.email} />
          <InfoItem label="Mobile" value={company.mobile} />
          <InfoItem label="Website" value={company.website} link={company.website} />
          <InfoItem label="Office Address" value={company.officeAddress} />
        </div>
      </div>
    </div>

    {/* Right: Description + Metadata */}
    <div style={{ display: "flex", flexDirection: "column", gap: "36px" }}>
      <div style={{
        padding: "28px",
        background: "#fff",
        borderRadius: "20px",
        border: "1px solid #eee",
      }}>
        <h3 style={{ margin: "0 0 16px", fontSize: "22px", fontWeight: 600, color: "#1a1a1a" }}>
          Description
        </h3>
        <p style={{
          margin: 0,
          color: "#444",
          lineHeight: 1.7,
          fontSize: "15px",
          whiteSpace: "pre-wrap",
        }}>
          {company.description || "No description provided."}
        </p>
      </div>

      <div style={{
        padding: "28px",
        background: "#f9f9f9",
        borderRadius: "20px",
        border: "1px solid #eee",
      }}>
        <h3 style={{ margin: "0 0 16px", fontSize: "22px", fontWeight: 600, color: "#1a1a1a" }}>
          Metadata
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <InfoItem label="Registration No." value={company.registrationNumber || (<span style={{ 
              color: '#999', 
              fontStyle: 'italic', 
              opacity: 0.7,
              fontWeight: 400 
            }}>
              N/A
            </span>)} />
          <InfoItem label="Created By" value={company.createdBy} />
          <InfoItem label="Created At" value={new Date(company.createdAt).toLocaleString()} />
          <InfoItem label="Updated At" value={new Date(company.updatedAt).toLocaleString()} />
          <InfoItem label="Updated By" value={company.updatedBy || (<span style={{ 
              color: '#999', 
              fontStyle: 'italic', 
              opacity: 0.7,
              fontWeight: 400 
            }}>
              N/A
            </span>)} />
          <InfoItem label="Status" value={company.isConfigured ? "Configured" : "Pending"} />
        </div>
      </div>
    </div>
  </div>
);

const EditSection = ({ company, onClose }) => {
  const dispatch = useDispatch();

  // Get the LATEST company data from Redux (this updates after save)
  const latestCompany = useSelector((state) =>
    state.companyMaster.companies.find((c) => c.id === company.id) || company
  );

  const currentUserId = useSelector((state) => state.jobPortal.currentUserId) || "unknown_user";

  // Form state starts with initial company, but syncs with latest from Redux
  const [form, setForm] = useState({
    name: latestCompany.name || "",
    slug: latestCompany.slug || "",
    email: latestCompany.email || "",
    mobile: latestCompany.mobile || "",
    website: latestCompany.website || "",
    description: latestCompany.description || "",
    officeAddress: latestCompany.officeAddress || "",
    registrationNumber: latestCompany.registrationNumber || "",
    logoUrl: latestCompany.logoUrl || "",
    primaryColor: latestCompany.primaryColor || "#ffffff",
    secondaryColor: latestCompany.secondaryColor || "#FFAB49",
    socials: {
      facebook: latestCompany.socials?.facebook || "",
      instagram: latestCompany.socials?.instagram || "",
      twitter: latestCompany.socials?.twitter || "",
      linkedin: latestCompany.socials?.linkedin || "",
    },
  });

  // Auto-sync form with latest Redux data after save or any change
  useEffect(() => {
    setForm({
      name: latestCompany.name || "",
      slug: latestCompany.slug || "",
      email: latestCompany.email || "",
      mobile: latestCompany.mobile || "",
      website: latestCompany.website || "",
      description: latestCompany.description || "",
      officeAddress: latestCompany.officeAddress || "",
      registrationNumber: latestCompany.registrationNumber || "",
      logoUrl: latestCompany.logoUrl || "",
      primaryColor: latestCompany.primaryColor || "#ffffff",
      secondaryColor: latestCompany.secondaryColor || "#FFAB49",
      socials: {
        facebook: latestCompany.socials?.facebook || "",
        instagram: latestCompany.socials?.instagram || "",
        twitter: latestCompany.socials?.twitter || "",
        linkedin: latestCompany.socials?.linkedin || "",
      },
    });
  }, [latestCompany]); // Re-run whenever the company in Redux updates

  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSocialChange = (platform, value) => {
    setForm((prev) => ({
      ...prev,
      socials: { ...prev.socials, [platform]: value },
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
     showToast(
      "error",
      "Company name is required",
      "Validation Error"
    );
      return;
    }

    setSaving(true);

    const updatedData = {
      ...form,
      socials: form.socials,
      updatedBy: currentUserId,
      updatedAt: serverTimestamp(),
    };

    try {
      showToast("info", "Updating company details...", "Saving...");



      await dispatch(updateCompany({ 
        id: company.id, 
        data: updatedData 
      })).unwrap();

      toaster.remove();

      showToast("success", `Company "${form.name}" updated successfully!`, "Success");

      // Modal stays open — form auto-updates via useEffect
      // If you want auto-close: onClose();

    } catch (error) {
      toaster.remove();

      showToast(
        "error",
        `Failed to update company: ${error.message || "Unknown error"}`,
        "Error"
      );

      console.error("Update failed:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      padding: "32px",
      background: "#ffffff",
      borderRadius: "20px",
      border: "1px solid #eee",
      boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
    }}>
      <h3 style={{
        margin: "0 0 32px",
        fontSize: "26px",
        fontWeight: 700,
        color: "#1a1a1a",
        letterSpacing: "-0.3px",
      }}>
        Edit Company Details
      </h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px" }}>
        <div>
          <label style={labelStyle}>Company Name</label>
          <input type="text" name="name" value={form.name} onChange={handleChange} style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Slug</label>
          <input type="text" name="slug" value={form.slug} onChange={handleChange} style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Email</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Mobile</label>
          <input type="tel" name="mobile" value={form.mobile} onChange={handleChange} style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Website</label>
          <input type="url" name="website" value={form.website} onChange={handleChange} style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Registration Number</label>
          <input type="text" name="registrationNumber" value={form.registrationNumber} onChange={handleChange} style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Primary Color</label>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <input
              type="color"
              name="primaryColor"
              value={form.primaryColor}
              onChange={handleChange}
              style={{ width: "60px", height: "40px", border: "none", borderRadius: "8px", cursor: "pointer" }}
            />
            <input type="text" name="primaryColor" value={form.primaryColor} onChange={handleChange} style={inputStyle} />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Secondary Color</label>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <input
              type="color"
              name="secondaryColor"
              value={form.secondaryColor}
              onChange={handleChange}
              style={{ width: "60px", height: "40px", border: "none", borderRadius: "8px", cursor: "pointer" }}
            />
            <input type="text" name="secondaryColor" value={form.secondaryColor} onChange={handleChange} style={inputStyle} />
          </div>
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Logo URL</label>
          <input type="url" name="logoUrl" value={form.logoUrl} onChange={handleChange} style={inputStyle} placeholder="https://..." />
          {form.logoUrl && (
            <div style={{ marginTop: "16px", textAlign: "center" }}>
              <img
                src={form.logoUrl}
                alt="Preview"
                style={{
                  maxWidth: "300px",
                  // maxHeight: "220px",
                  objectFit: "contain",
                  // borderRadius: "16px",
                  // border: "1px solid #eee",
                  // boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
                }}
                onError={(e) => (e.target.style.display = "none")}
              />
            </div>
          )}
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={5}
            style={{
              ...inputStyle,
              width: "100%",
              resize: "vertical",
              fontFamily: "inherit",
              lineHeight: 1.6,
            }}
            placeholder="Enter company description..."
          />
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Office Address</label>
          <textarea
            name="officeAddress"
            value={form.officeAddress}
            onChange={handleChange}
            rows={3}
            style={{
              ...inputStyle,
              width: "100%",
              resize: "vertical",
            }}
            placeholder="e.g., 31, 3rd floor, Businessbay JITO, Nashik"
          />
        </div>

        <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
          <div>
            <label style={labelStyle}>Facebook</label>
            <input
              type="url"
              value={form.socials.facebook}
              onChange={(e) => handleSocialChange("facebook", e.target.value)}
              style={inputStyle}
              placeholder="https://facebook.com/..."
            />
          </div>
          <div>
            <label style={labelStyle}>Instagram</label>
            <input
              type="url"
              value={form.socials.instagram}
              onChange={(e) => handleSocialChange("instagram", e.target.value)}
              style={inputStyle}
              placeholder="https://instagram.com/..."
            />
          </div>
          <div>
            <label style={labelStyle}>Twitter</label>
            <input
              type="url"
              value={form.socials.twitter}
              onChange={(e) => handleSocialChange("twitter", e.target.value)}
              style={inputStyle}
              placeholder="https://twitter.com/..."
            />
          </div>
          <div>
            <label style={labelStyle}>LinkedIn</label>
            <input
              type="url"
              value={form.socials.linkedin}
              onChange={(e) => handleSocialChange("linkedin", e.target.value)}
              style={inputStyle}
              placeholder="https://linkedin.com/..."
            />
          </div>
        </div>
      </div>

      {/* Save / Cancel */}
      <div style={{
        marginTop: "48px",
        display: "flex",
        justifyContent: "flex-end",
        gap: "20px",
      }}>
        <button
          onClick={onClose}
          // disabled={saving}
          style={{
            padding: "14px 36px",
            border: "1px solid #d1d5db",
            borderRadius: "999px",
            background: "white",
            fontWeight: 600,
            fontSize: "15px",
            color: "#333",
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.6 : 1,
          }}
        >
          Cancel
        </button>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: "14px 36px",
            border: "none",
            borderRadius: "999px",
            background: saving ? "#ffd699" : "#FFAB49",
            color: "white",
            fontWeight: 600,
            fontSize: "15px",
            cursor: saving ? "not-allowed" : "pointer",
            boxShadow: "0 4px 16px rgba(255,171,73,0.3)",
            transition: "all 0.2s",
          }}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
};

// Reusable styles (add at bottom if not already present)
const inputStyle = {
  width: "100%",
  padding: "14px 18px",
  border: "1px solid #d1d5db",
  borderRadius: "12px",
  fontSize: "15px",
  outline: "none",
  transition: "all 0.2s",
  background: "#ffffff",
  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
  "&:focus": {
    borderColor: "#FFAB49",
    boxShadow: "0 0 0 3px rgba(255,171,73,0.15)",
  },
};

const labelStyle = {
  display: "block",
  marginBottom: "8px",
  fontSize: "14px",
  fontWeight: 500,
  color: "#444",
};

const ReadOnlyItem = ({ label, value }) => (
  <div>
    <div style={{ fontSize: "13px", color: "#666", marginBottom: "6px" }}>{label}</div>
    <div style={{
      fontSize: "15px",
      fontWeight: 500,
      color: "#1a1a1a",
      padding: "12px 16px",
      background: "#f9f9f9",
      borderRadius: "10px",
      border: "1px solid #eee",
    }}>
      {value || (<span style={{ 
              color: '#999', 
              fontStyle: 'italic', 
              opacity: 0.7,
              fontWeight: 400 
            }}>
              N/A
            </span>)}
    </div>
  </div>
);

// Placeholder for other sections
const PlaceholderSection = ({ title, color }) => (
  <div style={{
    padding: "40px",
    background: "#f9f9f9",
    borderRadius: "20px",
    border: "1px solid #eee",
    textAlign: "center",
  }}>
    <h3 style={{ color, fontSize: "24px", marginBottom: "16px" }}>
      {title}
    </h3>
    <p style={{ fontSize: "16px", color: "#666" }}>
      This section is coming soon.
    </p>
  </div>
);

// Reusable Info Item
const InfoItem = ({ label, value, link }) => (
  <div>
    <div style={{ fontSize: "13px", color: "#666", marginBottom: "4px" }}>
      {label}
    </div>
    <div style={{ fontSize: "15px", fontWeight: 500, color: "#1a1a1a" }}>
      {link ? (
        <a href={link} target="_blank" rel="noopener noreferrer" style={{ color: "#FFAB49", textDecoration: "none" }}>
          {value || (<span style={{ 
              color: '#999', 
              fontStyle: 'italic', 
              opacity: 0.7,
              fontWeight: 400 
            }}>
              N/A
            </span>)}
        </a>
      ) : (
        value || (<span style={{ 
              color: '#999', 
              fontStyle: 'italic', 
              opacity: 0.7,
              fontWeight: 400 
            }}>
              N/A
            </span>)
      )}
    </div>
  </div>
);

export default ManageCompanyModal;