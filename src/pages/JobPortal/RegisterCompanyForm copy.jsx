import { useMemo, useState } from "react";

const RegisterCompanyForm = ({ company, onCancel, onSubmit }) => {
  const [form, setForm] = useState({
    email: company.email || "",
    mobile: company.mobile || "",
    website: company.website || "",
    logoUrl: company.logoUrl || "",
    description: company.description || "",
    location: company.location || [],
    locationInput: "",

    // New fields
    officeAddress: company.officeAddress || "",           // Required
    registrationNumber: company.registrationNumber || "", // Optional

    socials: {
      linkedin: company.socials?.linkedin || "",
      twitter: company.socials?.twitter || "",
      facebook: company.socials?.facebook || "",
      instagram: company.socials?.instagram || "",
    },
  });

  const isValid = useMemo(() => {
    return (
      form.email.trim() &&
      form.mobile.trim() &&
      form.website.trim() &&
      form.officeAddress.trim() &&           // ← New: required
      form.description.trim() &&
      form.location.length > 0
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

  return (
    <div style={container}>
      {/* Name (disabled) */}
      <Input label="Company Name" value={company.name} disabled required={true} />

      {/* Slug (disabled) */}
      <Input label="Slug" value={company.slug} disabled required={true} />

      <Input
        label="Email"
        value={form.email}
        onChange={(v) => setForm({ ...form, email: v })}
         required={true}
      />

      <Input
        label="Mobile"
        value={form.mobile}
        onChange={(v) => setForm({ ...form, mobile: v })}
         required={true}
      />

      <Input
        label="Website"
        value={form.website}
        onChange={(v) => setForm({ ...form, website: v })}
         required={true}
      />

      {/* New: Company Office Address (required) */}
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Company Office Address <span className="redStar">*</span></label>

        <textarea
          rows={3}
          value={form.officeAddress}
          onChange={(e) => setForm({ ...form, officeAddress: e.target.value })}
          
          placeholder="Full office address (e.g., 123 Tech Park, Andheri East, Mumbai...)"
          style={{
            ...input,
            resize: "vertical",
            minHeight: "80px",
          }}
        />
      </div>

      {/* New: Company Registration Number (optional) */}
      <Input
        label="Company Registration Number"
        value={form.registrationNumber}
        onChange={(v) => setForm({ ...form, registrationNumber: v })}
        placeholder="CIN / Registration No."
        required={false}
      />

      {/* Location (existing multi-chip) */}
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Locations <span className="redStar">*</span></label>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={form.locationInput}
            onChange={(e) =>
              setForm({ ...form, locationInput: e.target.value })
            }
            placeholder="Add location (e.g., Mumbai)"
            style={input}
          />
          <button onClick={addLocation} style={chipBtn}>
            Add
          </button>
        </div>

        <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
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

      <TextArea
        label="Description"
        value={form.description}
        required={true}
        onChange={(v) => setForm({ ...form, description: v })}
      />

      <Input
        label="Company Logo URL"
        value={form.logoUrl}
        onChange={(v) => setForm({ ...form, logoUrl: v })}
         required={false}
      />

      <Input
        label="LinkedIn"
        value={form.socials.linkedin}
         required={false}
        onChange={(v) =>
          setForm({
            ...form,
            socials: { ...form.socials, linkedin: v },
          })
        }
      />

      <Input
        label="Twitter"
        value={form.socials.twitter}
         required={false}
        onChange={(v) =>
          setForm({
            ...form,
            socials: { ...form.socials, twitter: v },
          })
        }
      />

      <Input
        label="Facebook"
        value={form.socials.facebook}
         required={false}
        onChange={(v) =>
          setForm({
            ...form,
            socials: { ...form.socials, facebook: v },
          })
        }
      />

      <Input
        label="Instagram"
        value={form.socials.instagram}
         required={false}
        onChange={(v) =>
          setForm({
            ...form,
            socials: { ...form.socials, instagram: v },
          })
        }
      />

      {/* Footer */}
      <div style={footer}>
        <button onClick={onCancel} style={cancelBtn}>
          Cancel
        </button>
        <button
          disabled={!isValid}
          onClick={() => onSubmit(form)}
          style={primaryBtn(!isValid)}
        >
          Register Company
        </button>
      </div>
    </div>
  );
};

export default RegisterCompanyForm;

// ─────────────────────────────────────
// Reusable components (unchanged)
// ─────────────────────────────────────
const Input = ({ label, value, onChange, disabled, required = false }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={labelStyle}>
      {label}
      {required ? (
        <span className="redStar">
          *
        </span>
      ) : (
        <span style={{ color: "#94a3b8", fontSize: "12px", marginLeft: "6px" }}>
          (optional)
        </span>
      )}
    </label>
    <input
      value={value}
      disabled={disabled}
      onChange={(e) => onChange?.(e.target.value)}
      style={{
        ...input,
        background: disabled ? "#F3F3F3" : "#fff",
        cursor: disabled ? "not-allowed" : "text",
      }}
    />
  </div>
);

const TextArea = ({ label, value, onChange, required }) => (
  <div style={{ marginBottom: 14 }}>
    {/* <label style={labelStyle}>{label} {required? `<span className="redStar">*</span>`:"(optional)"} </label> */}
     <label style={labelStyle}>
      {label}
      {required ? (
        <span className="redStar">
          *
        </span>
      ) : (
        <span style={{ color: "#94a3b8", fontSize: "12px", marginLeft: "6px" }}>
          (optional)
        </span>
      )}
    </label>
    <textarea
      rows={4}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ ...input, resize: "vertical", minHeight: "80px" }}
    />
  </div>
);

// Styles (unchanged)
const container = { padding: 20 };
const labelStyle = { fontSize: 12, color: "#777", marginBottom: 6, display: "block" };
const input = { width: "100%", padding: "10px 14px", borderRadius: 12, border: "1px solid #ddd", outline: "none" };
const footer = { display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 };
const cancelBtn = { padding: "8px 16px", borderRadius: 999, background: "#fff", border: "1px solid #ddd", cursor: "pointer" };
const primaryBtn = (disabled) => ({
  padding: "8px 18px",
  borderRadius: 999,
  background: disabled ? "#FFD7A8" : "#FFAB49",
  color: "#fff",
  border: "none",
  cursor: disabled ? "not-allowed" : "pointer",
});
const chip = { background: "#FFE3CA", borderRadius: 999, padding: "4px 10px", fontSize: 13 };
const chipClose = { marginLeft: 6, cursor: "pointer", fontWeight: 600 };
const chipBtn = {
  borderRadius: 999,
  padding: "8px 14px",
  border: "1px solid #FFAB49",
  background: "#fff",
  cursor: "pointer",
};