import { useMemo, useState } from "react";

const RegisterCompanyForm = ({ company, onCancel, onSubmit }) => {
  const [form, setForm] = useState({
    email: company.email || "",
    mobile: company.mobile || "",
    website: company.website || "",
    description: company.description || "",
    location: company.location || [],
    locationInput: "",

    officeAddress: company.officeAddress || "",
    registrationNumber: company.registrationNumber || "",

    socials: {
      linkedin: company.socials?.linkedin || "",
      twitter: company.socials?.twitter || "",
      facebook: company.socials?.facebook || "",
      instagram: company.socials?.instagram || "",
    },

    // Branding
    logoFile: null,                    // new upload – required
    logoUrl: company.logoUrl || "",    // only for display if editing existing company
    primaryColor: company.primaryColor || "#ffffff",
    secondaryColor: company.secondaryColor || "#FFAB49",
  });

  const [step, setStep] = useState(1);

  const logoPreview = useMemo(() => {
    if (form.logoFile) {
      return URL.createObjectURL(form.logoFile);
    }
    return form.logoUrl || "";
  }, [form.logoFile, form.logoUrl]);

  const isStep1Valid = useMemo(() => {
    return !!form.logoFile; // must have new file (logoUrl alone is not enough anymore)
  }, [form.logoFile]);

  const isOverallValid = useMemo(() => {
    return (
      form.email.trim() &&
      form.mobile.trim() &&
      form.website.trim() &&
      form.officeAddress.trim() &&
      form.description.trim() &&
      form.location.length > 0 &&
      form.primaryColor.trim() &&
      form.secondaryColor.trim()
    );
  }, [form]);

  const addLocation = () => {
    if (!form.locationInput.trim()) return;
    setForm({
      ...form,
      location: [...form.location, form.locationInput.trim()],
      locationInput: "",
    });
  };

  const removeLocation = (idx) => {
    setForm({
      ...form,
      location: form.location.filter((_, i) => i !== idx),
    });
  };

  const isStep2Valid =
  form.email?.trim() &&
  form.mobile?.trim() &&
  form.website?.trim() &&
  form.officeAddress?.trim() &&
  form.location?.length > 0 &&
  form.description?.trim();

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm({ ...form, logoFile: file });
    }
  };

  return (
    <div style={container}>
      {/* ── STEP 1 ── Branding + Logo + Colors + Preview */}
      {step === 1 && (
  <>
    <div style={{ marginBottom: 32 }}>
      <label style={labelStyle}>
        Company Logo <span className="redStar">*</span>
      </label>
      <input
        type="file"
        accept="image/*"
        onChange={handleLogoChange}
        style={input}
        required
      />
      {logoPreview ? (
        <div style={{ marginTop: 12 }}>
          <img
            src={logoPreview}
            alt="Logo Preview"
            style={{
              maxWidth: 180,
              maxHeight: 180,
              objectFit: "contain",
              borderRadius: 12,
              boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
            }}
          />
        </div>
      ) : (
        <p style={{ color: "#e11d48", fontSize: 13, marginTop: 8 }}>
          A company logo is required to continue
        </p>
      )}
    </div>

   <div style={{display:"flex", justifyContent:"space-evenly", gap: "20px"}}>
     {/* Premium Primary Color Input */}
    <div style={{ marginBottom: 28, width:"40%" }}>
      <label style={{
        ...labelStyle,
        fontWeight: 500,
        color: "#374151",
        marginBottom: 8,
        display: "block",
      }}>
        Primary Color <span className="redStar">*</span>
      </label>

      <div style={{
        display: "flex",
        alignItems: "center",
        border: "1px solid #d1d5db",
        borderRadius: 12,
        overflow: "hidden",
        background: "#ffffff",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        transition: "all 0.2s ease",
        "&:hover": { borderColor: "#9ca3af", boxShadow: "0 0 0 3px rgba(249,115,22,0.1)" },
        "&:focus-within": { borderColor: "#f97316", boxShadow: "0 0 0 3px rgba(249,115,22,0.2)" },
      }}>
        {/* Live color swatch */}
        <div style={{
          width: 56,
          height: 56,
          backgroundColor: form.primaryColor || "#ffffff",
          borderRight: "1px solid #e5e7eb",
          flexShrink: 0,
        }} />

        <input
          type="color"
          value={form.primaryColor}
          onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
          style={{
            flex: 1,
            height: 56,
            padding: "0 16px",
            border: "none",
            outline: "none",
            background: "transparent",
            cursor: "pointer",
            fontSize: 16,
            appearance: "none", // hide default picker arrow on some browsers
          }}
          required
        />
      </div>
    </div>

    {/* Premium Secondary Color Input */}
    <div style={{ marginBottom: 32, width:"40%" }}>
      <label style={{
        ...labelStyle,
        fontWeight: 500,
        color: "#374151",
        marginBottom: 8,
        display: "block",
      }}>
        Secondary Color <span className="redStar">*</span>
      </label>

      <div style={{
        display: "flex",
        alignItems: "center",
        border: "1px solid #d1d5db",
        borderRadius: 12,
        overflow: "hidden",
        background: "#ffffff",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        transition: "all 0.2s ease",
        "&:hover": { borderColor: "#9ca3af", boxShadow: "0 0 0 3px rgba(249,115,22,0.1)" },
        "&:focus-within": { borderColor: "#f97316", boxShadow: "0 0 0 3px rgba(249,115,22,0.2)" },
      }}>
        {/* Live color swatch */}
        <div style={{
          width: 56,
          height: 56,
          backgroundColor: form.secondaryColor || "#FFAB49",
          borderRight: "1px solid #e5e7eb",
          flexShrink: 0,
        }} />

        <input
          type="color"
          value={form.secondaryColor}
          onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })}
          style={{
            flex: 1,
            height: 56,
            padding: "0 16px",
            border: "none",
            outline: "none",
            background: "transparent",
            cursor: "pointer",
            fontSize: 16,
            appearance: "none",
          }}
          required
        />
      </div>
    </div>
   </div>

    {/* Live Preview – unchanged */}
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
    {/* <img
      src={form.logoUrl || "/placeholder-logo.png"}
      alt="Company Logo"
      style={{
        width: "120px",
        height: "120px",
        objectFit: "contain",
        // marginBottom: "16px",
        // borderRadius: "16px",
        // boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
        // background: "#fff",
        padding: "12px",
      }}
      onError={(e) => (e.target.src = "/placeholder-logo.png")}
    /> */}
    	{logoPreview && (
            <img
              src={logoPreview}
              alt="Company Logo"
              style={{
                height: 48,
                objectFit: "contain",
                marginBottom: 12,
              }}
            />
          )}
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
  </>
)}

      {/* ── STEP 2 ── Required company information */}
{step === 2 && (
  <>
    <div style={{display:"flex", justifyContent:"space-between", gap:"20px"}}>
      <Input label="Company Name" value={company.name} disabled required={true} />
      <Input label="Slug" value={company.slug} disabled required={true} />
    </div>

    <div style={{display:"flex", justifyContent:"space-between", gap:"20px"}}>
      <div style={{flex:1}}>
        <Input
          label="Email"
          value={form.email}
          onChange={(v) => setForm({ ...form, email: v })}
          required={true}
        />
        {!form.email?.trim() && (
          <p style={{color:"#dc2626", fontSize:"13px", margin:"4px 0 10px 2px"}}>
            Email is required.
          </p>
        )}
      </div>

      <div style={{flex:1}}>
        <Input
          label="Mobile"
          type="number"
          value={form.mobile}
          onChange={(v) => setForm({ ...form, mobile: v })}
          required={true}
        />
        {!form.mobile?.trim() && (
          <p style={{color:"#dc2626", fontSize:"13px", margin:"4px 0 10px 2px"}}>
            Mobile number is required.
          </p>
        )}
      </div>

      <div style={{flex:1}}>
        <Input
          label="Website"
          value={form.website}
          onChange={(v) => setForm({ ...form, website: v })}
          required={true}
        />
        {!form.website?.trim() && (
          <p style={{color:"#dc2626", fontSize:"13px", margin:"4px 0 10px 2px"}}>
            Website is required.
          </p>
        )}
      </div>
    </div>

    {/* Office Address */}
    <div style={{ marginBottom: 20 }}>
      <label style={labelStyle}>
        Company Office Address <span className="redStar">*</span>
      </label>

      <textarea
        rows={3}
        value={form.officeAddress}
        onChange={(e) => setForm({ ...form, officeAddress: e.target.value })}
        placeholder="Full office address (e.g., 123 Tech Park, Andheri East, Mumbai...)"
        style={{
          ...input,
          resize: "vertical",
          minHeight: "88px",
          border: !form.officeAddress?.trim() ? "1px solid #dc2626" : input.border
        }}
      />

      {!form.officeAddress?.trim() && (
        <p style={{color:"#dc2626", fontSize:"13px", margin:"4px 0 0 2px"}}>
          Office address is required.
        </p>
      )}
    </div>

    {/* Locations */}
    <div style={{ marginBottom: 20 }}>
      <label style={labelStyle}>
        Locations <span className="redStar">*</span>
      </label>

      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
        <input
          value={form.locationInput}
          onChange={(e) => setForm({ ...form, locationInput: e.target.value })}
          placeholder="Add location (e.g., Mumbai, Bangalore)"
          style={input}
        />
        <button onClick={addLocation} style={chipBtn}>
          Add
        </button>
      </div>

      {form.location?.length === 0 && (
        <p style={{color:"#dc2626", fontSize:"13px", margin:"4px 0 8px 2px"}}>
          Please add at least one company location.
        </p>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {form.location.map((loc, i) => (
          <span key={i} style={chip}>
            {loc}
            <span onClick={() => removeLocation(i)} style={chipClose}>
              ×
            </span>
          </span>
        ))}
      </div>
    </div>

    {/* Description */}
    <div>
      <TextArea
        label="Description"
        value={form.description}
        required={true}
        onChange={(v) => setForm({ ...form, description: v })}
      />

      {!form.description?.trim() && (
        <p style={{color:"#dc2626", fontSize:"13px", margin:"4px 0 0 2px"}}>
          Company description is required.
        </p>
      )}
    </div>
  </>
)}

      {/* ── STEP 3 ── Optional fields */}
      {step === 3 && (
        <>
           <Input
            label="Company Registration Number"
            value={form.registrationNumber}
            onChange={(v) => setForm({ ...form, registrationNumber: v })}
            placeholder="CIN / Registration No. (optional)"
            required={false}
          />

         <div  style={{display:"flex", justifyContent:"space-between", gap:"20px"}}>
          <Input
            label="LinkedIn"
            value={form.socials.linkedin}
            required={false}
            onChange={(v) =>
              setForm({ ...form, socials: { ...form.socials, linkedin: v } })
            }
          />

            <Input
              label="Twitter"
              value={form.socials.twitter}
              required={false}
              onChange={(v) =>
                setForm({ ...form, socials: { ...form.socials, twitter: v } })
              }
              />
              </div>

         <div  style={{display:"flex", justifyContent:"space-between", gap:"20px"}}>
            <Input
              label="Facebook"
              value={form.socials.facebook}
              required={false}
              onChange={(v) =>
                setForm({ ...form, socials: { ...form.socials, facebook: v } })
              }
              />

          <Input
            label="Instagram"
            value={form.socials.instagram}
            required={false}
            onChange={(v) =>
              setForm({ ...form, socials: { ...form.socials, instagram: v } })
            }
            />
            </div>
        </>
      )}

      {/* ── Navigation footer ── */}
      <div style={footer}>
        <button onClick={onCancel} style={cancelBtn}>
          Cancel
        </button>

        {step > 1 && (
          <button
            onClick={() => setStep(step - 1)}
            style={secondaryBtn}
          >
            Back
          </button>
        )}

{step < 3 ? (
  <button
    onClick={() => {
      if (step === 1) {
        if (isStep1Valid) setStep(2);
      } 
      else if (step === 2) {
        if (isStep2Valid) setStep(3);
      } 
      else {
        setStep(step + 1);
      }
    }}
    disabled={
      (step === 1 && !isStep1Valid) ||
      (step === 2 && !isStep2Valid)
    }
    style={primaryBtn(
      (step === 1 && !isStep1Valid) ||
      (step === 2 && !isStep2Valid)
    )}
  >
    Next
  </button>
) : (
  <button
    disabled={!isOverallValid}
    onClick={() => onSubmit(form)}
    style={primaryBtn(!isOverallValid)}
  >
    Register Company
  </button>
)}
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────
// Reusable field components
// ────────────────────────────────────────────────

const Input = ({ label, value, onChange, disabled, required = false, type = "text" }) => (
  <div style={{ marginBottom: 20, width: "100%" }}>
    <label style={labelStyle}>
      {label}
      {required ? (
        <span className="redStar"> *</span>
      ) : (
        <span style={{ color: "#94a3b8", fontSize: "12px", marginLeft: 6 }}>
          (optional)
        </span>
      )}
    </label>
    <input
      type={type}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange?.(e.target.value)}
      style={{
        ...input,
        background: disabled ? "#f8f9fa" : "#fff",
        cursor: disabled ? "not-allowed" : "text",
      }}
    />
  </div>
);

const TextArea = ({ label, value, onChange, required }) => (
  <div style={{ marginBottom: 20 }}>
    <label style={labelStyle}>
      {label}
      {required ? (
        <span className="redStar"> *</span>
      ) : (
        <span style={{ color: "#94a3b8", fontSize: "12px", marginLeft: 6 }}>
          (optional)
        </span>
      )}
    </label>
    <textarea
      rows={4}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ ...input, resize: "vertical", minHeight: "100px" }}
    />
  </div>
);

// ────────────────────────────────────────────────
// Styles
// ────────────────────────────────────────────────

const container = { padding: "24px",  margin: "0 auto" };
const labelStyle = { fontSize: 13, color: "#555", marginBottom: 8, display: "block", fontWeight: 500 };
const input = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #d1d5db",
  outline: "none",
  fontSize: 15,
};
const footer = { display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 32, flexWrap: "wrap" };
const cancelBtn = {
  padding: "10px 20px",
  borderRadius: 999,
  background: "#fff",
  border: "1px solid #d1d5db",
  cursor: "pointer",
};
const secondaryBtn = {
  padding: "10px 20px",
  borderRadius: 999,
  background: "#f3f4f6",
  border: "1px solid #d1d5db",
  cursor: "pointer",
};
const primaryBtn = (disabled) => ({
  padding: "10px 24px",
  borderRadius: 999,
  background: disabled ? "#fed7aa" : "#f97316",
  color: "#fff",
  border: "none",
  cursor: disabled ? "not-allowed" : "pointer",
  fontWeight: 600,
});
const chip = {
  background: "#fef3e8",
  borderRadius: 999,
  padding: "6px 14px",
  fontSize: 13,
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
};
const chipClose = { cursor: "pointer", fontWeight: 700, color: "#c2410c" };
const chipBtn = {
  padding: "10px 18px",
  borderRadius: 999,
  border: "1px solid #f97316",
  background: "#fff",
  color: "#c2410c",
  cursor: "pointer",
  fontWeight: 500,
};

export default RegisterCompanyForm;