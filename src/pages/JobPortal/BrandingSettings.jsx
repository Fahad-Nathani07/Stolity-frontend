import { useDispatch, useSelector } from "react-redux";
import { serverTimestamp } from "firebase/firestore";
import { toaster, Notification } from 'rsuite';
import { useState } from "react";
import { updateCompany } from "../../store/companyMasterSlice";
import { showToast } from "../../components/ToastProvider";

const BrandingSettings = ({ company, onClose }) => {
  const dispatch = useDispatch();
  // const currentUserId = useSelector((state) => state.jobPortal.currentUserId) || "unknown_user";
  const currentUserId = useSelector((state) => state?.usersAdmin?.currentUser?.id) || "unknown_user";

  const [form, setForm] = useState({
    logoUrl: company.logoUrl || "",
    primaryColor: company.primaryColor || "#ffffff",
    secondaryColor: company.secondaryColor || "#FFAB49",
  });

  const [saving, setSaving] = useState(false);
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleLogoUpload = async () => {
    if (!selectedFile) {
      // toaster.push(
      //   <Notification type="warning" header="No file selected" duration={3000}>
      //     Please select a logo image first
      //   </Notification>,
      //   { placement: "topCenter" }
      // );
      showToast(
        "warning",
        "Please select a logo image first",
        "No file selected"
      );
      return;
    }

    setUploadingLogo(true);

    const formData = new FormData();
    formData.append("company_id", company.id);
    formData.append("logo", selectedFile);

    try {
      console.log("Uploading logo for company:", company.id);

      const response = await fetch("https://rt.infomanav.in/8006/logo", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("Logo upload success:", result);

      const newLogoUrl = result.logoUrl || result.url || URL.createObjectURL(selectedFile);

      setForm((prev) => ({ ...prev, logoUrl: newLogoUrl }));

      showToast(
        "success",
        "Logo updated successfully!",
        "Success"
      );

      setShowLogoModal(false);
      setSelectedFile(null);

    } catch (error) {
      console.error("Logo upload failed:", error);

      showToast(
        "error",
        `Failed to upload logo: ${error.message}`,
        "Error"
      );
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);

    const updatedData = {
      primaryColor: form.primaryColor,
      secondaryColor: form.secondaryColor,
      updatedBy: currentUserId,
      updatedAt: serverTimestamp(),
    };

    try {
      showToast(
        "info",
        "Updating branding settings...",
        "Saving..."
      );

      await dispatch(updateCompany({ 
        id: company.id, 
        data: updatedData 
      })).unwrap();

      toaster.remove();

      showToast(
        "success",
        "Branding updated successfully!",
        "Success"
      );

      // onClose();

    } catch (error) {
      toaster.remove();

      showToast(
        "error",
        `Failed to update branding: ${error.message || "Unknown error"}`,
        "Error"
      );

      console.error("Branding update failed:", error);
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
        Branding Settings
      </h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px" }}>
        {/* Logo Section */}
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Company Logo</label>
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            {form.logoUrl ? (
              <img
                src={form.logoUrl}
                alt="Company Logo"
                style={{
                  width: "170px",
                  height: "auto ",
                  padding: "15px",
                  objectFit: "contain",
                  // borderRadius: "12px",
                  // border: "1px solid #eee",
                  // boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
                onError={(e) => (e.target.src = "/placeholder-logo.png")}
              />
            ) : (
              <div style={{
                width: "170px",
                height: "170px",
                background: "#f0f0f0",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                color: "#999",
                textAlign: "center",
              }}>
                No Logo
              </div>
            )}

            <button
              onClick={() => setShowLogoModal(true)}
              style={{
                padding: "12px 24px",
                background: "#FFAB49",
                color: "white",
                border: "none",
                borderRadius: "999px",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(255,171,73,0.3)",
              }}
            >
              Update Logo
            </button>
          </div>
        </div>

        {/* Primary & Secondary Colors */}
        <div style={{ gridColumn: "1 / -1" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            {/* Primary Color */}
            <div>
              <label style={labelStyle}>Primary Color</label>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <input
                  type="color"
                  name="primaryColor"
                  value={form.primaryColor}
                  onChange={handleChange}
                  style={{ width: "80px", height: "50px", border: "none", borderRadius: "10px", cursor: "pointer" }}
                />
                <input
                  type="text"
                  name="primaryColor"
                  value={form.primaryColor}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="#ffffff or linear-gradient(...)"
                />
              </div>
            </div>

            {/* Secondary Color */}
            <div>
              <label style={labelStyle}>Secondary Color</label>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <input
                  type="color"
                  name="secondaryColor"
                  value={form.secondaryColor}
                  onChange={handleChange}
                  style={{ width: "80px", height: "50px", border: "none", borderRadius: "10px", cursor: "pointer" }}
                />
                <input
                  type="text"
                  name="secondaryColor"
                  value={form.secondaryColor}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="#FFAB49 or linear-gradient(...)"
                />
              </div>
            </div>
          </div>

{/* One Big Live Miniature Preview (full page-like look) */}
<h6 style={{marginTop: "40px",}}>Live Preview:</h6>
<div style={{
  marginTop: "10px",
  background: form.primaryColor, // light background like real page
  borderRadius: "16px",
  padding: "32px",
  boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
  overflow: "hidden",
  maxWidth: "1000px",
  marginLeft: "auto",
  marginRight: "auto",
}}>
  {/* Header / Intro Section */}
  <div style={{
    // textAlign: "center",
    // 
    marginBottom: "40px",
  }}>
    <img
      src={form.logoUrl || "/placeholder-logo.png"}
      alt="Company Logo"
      style={{
        width: "120px",
        maxHeight: "120px",
        objectFit: "contain",
        // marginBottom: "16px",
        // borderRadius: "16px",
        // boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
        // background: "#fff",
        padding: "12px",
      }}
      onError={(e) => (e.target.src = "/placeholder-logo.png")}
    />
    <p style={{
      fontSize: "18px",
      // color: "#FFAB49",
      color: form.secondaryColor,
      margin: "0 0 8px",
      fontWeight: 600,
      textAlign: "center",
    }}>
      Join Our Team
    </p>
    <p style={{
      fontSize: "10px",
      maxWidth: "800px",
      textAlign: "center",
      margin: "0 auto",
      // fontSize: "16px",
      color: "#555",
      // lineHeight: 1.6,
    }}>
      Check out our current job openings to find thrilling career paths that align with your skills and passions. Every job post includes detailed information about the role, duties, and qualifications. We invite talented individuals, whether seasoned experts or recent graduates, from all backgrounds to become part of our team.
    </p>
  </div>

{/* Fake Filters Bar - Two Rows, Equal Width, Full Width */}
<div style={{
  marginBottom: "32px",
}}>
  {/* Row 1: Categories */}
  <div style={{
    display: "flex",
    gap: "12px",
    marginBottom: "12px",
  }}>
    <button style={{
      flex: 1,
      padding: "12px 16px",
      background: form.secondaryColor,
      color: "#fff",
      border: "none",
      borderRadius: "999px",
      fontWeight: 600,
      fontSize: "12px",
      cursor: "pointer",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      textAlign: "center",
      minWidth: 0, // prevents overflow
    }}>
      All
    </button>

    <button style={{
      flex: 1,
      padding: "12px 16px",
      background: "#fff",
      color: "#444",
      border: "1px solid #ddd",
      borderRadius: "999px",
      fontWeight: 500,
      fontSize: "12px",
      cursor: "pointer",
      textAlign: "center",
      minWidth: 0,
    }}>
      Engineering
    </button>

    <button style={{
      flex: 1,
      padding: "12px 16px",
      background: "#fff",
      color: "#444",
      border: "1px solid #ddd",
      borderRadius: "999px",
      fontWeight: 500,
      fontSize: "12px",
      cursor: "pointer",
      textAlign: "center",
      minWidth: 0,
    }}>
      Cloud Infrastructure
    </button>

    <button style={{
      flex: 1,
      padding: "12px 16px",
      background: "#fff",
      color: "#444",
      border: "1px solid #ddd",
      borderRadius: "999px",
      fontWeight: 500,
      fontSize: "12px",
      cursor: "pointer",
      textAlign: "center",
      minWidth: 0,
    }}>
      Design
    </button>
  </div>

  {/* Row 2: Dropdowns + Clear */}
  <div style={{
    display: "flex",
    gap: "12px",
  }}>
    <div style={{
      flex: 1,
      padding: "12px 16px",
      background: "#fff",
      border: "1px solid #ddd",
      borderRadius: "999px",
      fontSize: "12px",
      color: "#666",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      minWidth: 0,
    }}>
      All Locations ▼
    </div>

    <div style={{
      flex: 1,
      padding: "12px 16px",
      background: "#fff",
      border: "1px solid #ddd",
      borderRadius: "999px",
      fontSize: "12px",
      color: "#666",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      minWidth: 0,
    }}>
      Experience ▼
    </div>

    <div style={{
      flex: 1,
      padding: "12px 16px",
      background: "#fff",
      border: "1px solid #ddd",
      borderRadius: "999px",
      fontSize: "12px",
      color: "#666",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      minWidth: 0,
    }}>
      Advanced Filters ▼
    </div>

    <button style={{
      flex: 1,
      padding: "12px 16px",
      background: form.secondaryColor,
      color: "#fff",
      border: "none",
      borderRadius: "999px",
      fontWeight: 600,
      fontSize: "12px",
      cursor: "pointer",
      minWidth: 0,
    }}>
      Clear
    </button>
  </div>
</div>





  {/* Two Dummy Job Card (exactly like screenshot) */}
  <div style={{display:"flex", gap:"20px"}}>
    <div style={{
    background: "#fff",
    borderRadius: "16px",
    boxShadow: "0 6px 24px rgba(0,0,0,0.08)",
    overflow: "hidden",
    maxWidth: "350px",
    // margin: "0 auto",
  }}>
    {/* Card Header */}
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "16px",
      padding: "20px 24px",
      background: "#FFFFFF",
      color: "#000000",
      justifyContent:"space-between",
    }}>
     {/* <h2>Backend Developer</h2> */}
      {/* <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}> */}
        <h6 style={{ margin: 0, fontSize: "22px" }}>UI/UX Designer</h6>
        <span style={{
          fontSize: "12px",
          opacity: 0.9,
          color: form.secondaryColor,
          background: `${form.secondaryColor}22`,
          padding: "6px 12px",
          borderRadius: "999px",
          fontWeight: 500,
        }}>
          Engineering
        </span>
      {/* </div> */}
    </div>

    {/* Card Body */}
    <div style={{ padding: "24px" }}>
      <p style={{
        margin: "0 0 16px",
        fontSize: "12px",
        lineHeight: 1.6,
        color: "#444",
      }}>
        Design and build scalable backend systems that power high-traffic applications. Ensure data security, performance, and reliability...
      </p>

      <div style={{
        display: "flex",
        gap: "20px",
        marginBottom: "16px",
        color: "#666",
        fontSize: "12px",
      }}>
        <span>📍 Mumbai</span>
        <span>● Full-time</span>
        <span>● Mid-level</span>
      </div>

      <div style={{
        display: "flex",
        gap: "10px",
        flexWrap: "wrap",
        marginBottom: "24px",
      }}>
        <span style={{
          padding: "8px 16px",
          background: `${form.secondaryColor}22`,
          color: form.secondaryColor,
          borderRadius: "999px",
          fontSize: "13px",
          fontWeight: 500,
        }}>
          Node.js
        </span>
        <span style={{
          padding: "8px 16px",
          background: `${form.secondaryColor}22`,
          color: form.secondaryColor,
          borderRadius: "999px",
          fontSize: "13px",
          fontWeight: 500,
        }}>
          Express
        </span>
        {/* <span style={{
          padding: "8px 16px",
          background: `${form.secondaryColor}22`,
          color: form.secondaryColor,
          borderRadius: "999px",
          fontSize: "13px",
          fontWeight: 500,
        }}>
          MongoDB
        </span> */}
        <span style={{
          padding: "8px 16px",
          background: `${form.secondaryColor}22`,
          color: form.secondaryColor,
          borderRadius: "999px",
          fontSize: "13px",
          fontWeight: 500,
        }}>
          +2 more
        </span>
      </div>

      <div style={{
        display: "flex",
        justifyContent: "flex-end",
      }}>
        <button style={{
          padding: "10px 20px",
          background: form.secondaryColor,
          color: "#fff",
          border: "none",
          borderRadius: "999px",
          fontWeight: 600,
          fontSize: "13px",
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(255,171,73,0.3)",
        }}>
          View Details →
        </button>
      </div>
    </div>
  </div>
   
   
   
    <div style={{
    background: "#fff",
    borderRadius: "16px",
    boxShadow: "0 6px 24px rgba(0,0,0,0.08)",
    overflow: "hidden",
    maxWidth: "350px",
    // margin: "0 auto",
  }}>
    {/* Card Header */}
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "16px",
      padding: "20px 24px",
      background: "#FFFFFF",
      color: "#000000",
      justifyContent:"space-between",
    }}>
     {/* <h2>Backend Developer</h2> */}
      {/* <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}> */}
        <h6 style={{ margin: 0, fontSize: "22px" }}>UI/UX Designer</h6>
        <span style={{
          fontSize: "12px",
          opacity: 0.9,
          color: form.secondaryColor,
          background: `${form.secondaryColor}22`,
          padding: "6px 12px",
          borderRadius: "999px",
          fontWeight: 500,
        }}>
          Engineering
        </span>
      {/* </div> */}
    </div>

    {/* Card Body */}
    <div style={{ padding: "24px" }}>
      <p style={{
        margin: "0 0 16px",
        fontSize: "12px",
        lineHeight: 1.6,
        color: "#444",
      }}>
        Design and build scalable backend systems that power high-traffic applications. Ensure data security, performance, and reliability...
      </p>

      <div style={{
        display: "flex",
        gap: "20px",
        marginBottom: "16px",
        color: "#666",
        fontSize: "12px",
      }}>
        <span>📍 Mumbai</span>
        <span>● Full-time</span>
        <span>● Mid-level</span>
      </div>

      <div style={{
        display: "flex",
        gap: "10px",
        flexWrap: "wrap",
        marginBottom: "24px",
      }}>
        <span style={{
          padding: "8px 16px",
          background: `${form.secondaryColor}22`,
          color: form.secondaryColor,
          borderRadius: "999px",
          fontSize: "13px",
          fontWeight: 500,
        }}>
          Node.js
        </span>
        <span style={{
          padding: "8px 16px",
          background: `${form.secondaryColor}22`,
          color: form.secondaryColor,
          borderRadius: "999px",
          fontSize: "13px",
          fontWeight: 500,
        }}>
          Express
        </span>
        {/* <span style={{
          padding: "8px 16px",
          background: `${form.secondaryColor}22`,
          color: form.secondaryColor,
          borderRadius: "999px",
          fontSize: "13px",
          fontWeight: 500,
        }}>
          MongoDB
        </span> */}
        <span style={{
          padding: "8px 16px",
          background: `${form.secondaryColor}22`,
          color: form.secondaryColor,
          borderRadius: "999px",
          fontSize: "13px",
          fontWeight: 500,
        }}>
          +2 more
        </span>
      </div>

      <div style={{
        display: "flex",
        justifyContent: "flex-end",
      }}>
        <button style={{
          padding: "10px 20px",
          background: form.secondaryColor,
          color: "#fff",
          border: "none",
          borderRadius: "999px",
          fontWeight: 600,
          fontSize: "13px",
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(255,171,73,0.3)",
        }}>
          View Details →
        </button>
      </div>
    </div>
  </div>


  </div>
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
          disabled={saving}
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
          {saving ? "Saving..." : "Save Branding"}
        </button>
      </div>

      {/* Logo Upload Modal */}
      {showLogoModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2000,
        }}
        onClick={() => setShowLogoModal(false)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "32px",
              width: "90%",
              maxWidth: "500px",
              boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 24px", fontSize: "22px", fontWeight: 700 }}>
              Update Company Logo
            </h3>

            <div
              style={{
                border: "2px dashed #d1d5db",
                borderRadius: "12px",
                padding: "40px",
                textAlign: "center",
                cursor: "pointer",
                background: selectedFile ? "#fffaf5" : "#f9f9f9",
                transition: "all 0.2s",
              }}
              onClick={() => document.getElementById("logoFileInput").click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.style.background = "#ffe8cc";
              }}
              onDragLeave={(e) => {
                e.currentTarget.style.background = selectedFile ? "#fffaf5" : "#f9f9f9";
              }}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith("image/")) {
                  setSelectedFile(file);
                }
              }}
            >
              {selectedFile ? (
                <div>
                  <p style={{ fontWeight: 600, color: "#FFAB49" }}>
                    Selected: {selectedFile.name}
                  </p>
                  <p style={{ fontSize: "14px", color: "#666" }}>
                    {Math.round(selectedFile.size / 1024)} KB
                  </p>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: "18px", fontWeight: 600, color: "#444" }}>
                    Drop your logo here
                  </p>
                  <p style={{ fontSize: "14px", color: "#888", marginTop: "8px" }}>
                    or click to select file (PNG, JPG, max 2MB)
                  </p>
                </div>
              )}
              <input
                id="logoFileInput"
                type="file"
                accept="image/*"
                onChange={handleLogoFileChange}
                style={{ display: "none" }}
              />
            </div>

            <div style={{
              marginTop: "32px",
              display: "flex",
              justifyContent: "flex-end",
              gap: "16px",
            }}>
              <button
                onClick={() => setShowLogoModal(false)}
                style={{
                  padding: "12px 28px",
                  border: "1px solid #d1d5db",
                  borderRadius: "999px",
                  background: "white",
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>

              <button
                onClick={handleLogoUpload}
                disabled={uploadingLogo || !selectedFile}
                style={{
                  padding: "12px 28px",
                  border: "none",
                  borderRadius: "999px",
                  background: uploadingLogo || !selectedFile ? "#ffd699" : "#FFAB49",
                  color: "white",
                  fontWeight: 600,
                  cursor: uploadingLogo || !selectedFile ? "not-allowed" : "pointer",
                }}
              >
                {uploadingLogo ? "Uploading..." : "Update Logo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrandingSettings;