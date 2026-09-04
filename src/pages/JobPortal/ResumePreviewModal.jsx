import { useEffect, useState } from "react";  // ← add useState here
import { 
  HiOutlineX, 
  HiOutlineMail, 
  HiOutlinePhone,
  HiOutlineLocationMarker,
  HiOutlineBriefcase, 
  HiOutlineStar, 
  HiOutlineDocumentText,
  HiOutlineAcademicCap,
  HiOutlineLightBulb,
  // HiOutlineTrophy,
  HiOutlineHeart,
  HiOutlineUserGroup,
  HiOutlineGlobeAlt,
  HiOutlineChartBar,
  HiOutlineExternalLink,
  // RiFolderReceivedFill
} from "react-icons/hi";
import { RiFolderReceivedFill } from "react-icons/ri";
import { IoStar, IoStarHalf, IoStarOutline } from "react-icons/io5";

/* Helpers (kept your existing ones + small additions) */

const InfoLine = ({ icon: Icon, label, value, accent = false }) => (
  <div style={{
    display: "flex",
    alignItems: "center",
    gap: 16,
    padding: "12px 0",
    borderBottom: "1px solid rgba(226, 232, 240, 0.7)",
  }}>
    {Icon && <Icon size={18} style={{ color: accent ? "#FFAB49" : "#FFAB49", minWidth: 20 }} />}
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 12.5, color: "#000000", fontWeight: 500, marginBottom: 3 }}>
        {label}
      </div>
      <div style={{
        fontSize: 15,
        fontWeight: 500,
        color: accent ? "#4e4e4e" : "#4e4e4e",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}>
        {value || "—"}
      </div>
    </div>
  </div>
);

const CircularScore = ({ score = 0, label = "Score" }) => {
  const percentage = Math.min(Math.max(score, 0), 100);
  const radius = 42;
  const stroke = 7;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div style={{ position: "relative", width: 110, height: 110 }}>
      <svg width="110" height="110" viewBox="0 0 110 110">
        <circle cx="55" cy="55" r={radius} fill="none" stroke="#ffecd6" strokeWidth={stroke} />
        <circle
          cx="55"
          cy="55"
          r={radius}
          fill="none"
          stroke="url(#grad)"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 55 55)"
        />
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffc98b" />
            <stop offset="100%" stopColor="#FFAB49" />
          </linearGradient>
        </defs>
      </svg>
      <div style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 22,
        fontWeight: 700,
        color: "#FFAB49",
      }}>
        {percentage}
        <span style={{ fontSize: 13, color: "#4e4e4e", marginTop: 2 }}>{label}</span>
      </div>
    </div>
  );
};

const Tag = ({ children, variant = "default" }) => (
  <span style={{
    padding: "6px 16px",
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 500,
    background: variant === "accent" 
      ? "linear-gradient(135deg, #ffcf98, #FFAB49)" 
      : "#f8f9fa",
    color: variant === "accent" ? "#ffffff" : "#4e4e4e",
    border: variant === "accent" ? "1px solid #FFAB49" : "1px solid #e2e8f0",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  }}>
    {children}
  </span>
);

const Section = ({ icon: Icon, title, children, highlight = false }) => (
  <div style={{
    background: "#ffffff",
    borderRadius: 20,
    padding: 24,
    margin: "16px 0",
    border: "1px solid #ffd6a8",
    transition: "all 0.28s ease",
  }}>
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      // marginBottom: 20,
    }}>
      {Icon && <Icon size={20} style={{ color: highlight ? "#FFAB49" : "#FFAB49" }} />}
      <h3 style={{
        margin: 0,
        fontSize: 18,
        fontWeight: 600,
        color: highlight ? "#ff8800" : "#1e293b",
      }}>
        {title}
      </h3>
    </div>
    {children}
  </div>
);

const EmptyPlaceholder = () => (
  <div style={{ color: "#a0aec0", fontSize: 14, fontStyle: "italic", padding: "8px 0" }}>
    Not specified
  </div>
);

/* Main Component */

const ResumePreviewModal = ({
  open,
  onClose,
  candidate,
  activeTab,
  setActiveTab,
}) => {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = "auto"; };
  }, [open]);

  
  useEffect(() => {
    console.log("ResumePreviewModal opened with candidate:", candidate);
  }, []);

  const [showPdfPreview, setShowPdfPreview] = useState(false);













  if (!open || !candidate?.candidate) return null;
  
  const data = candidate.candidate;
  const parsed = data.parsedResume || {};
  const matchScore = Math.round((data.ratings || 0) * 20);
  const resumeUrl = data.resumeUrl || parsed.resumeUrl || "";
  


  const hasData = (value) => {
    if (!value) return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "object") return Object.keys(value).length > 0;
    return !!value;
  };

  const handleViewResume = () => {
    if (!resumeUrl) {
      console.warn("No resume URL available");
      return;
    }
    setShowPdfPreview(true);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(30, 41, 59, 0.78)",
        backdropFilter: "blur(14px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 1180,
          height: "92vh",
          background: "rgba(250, 250, 250, 0.94)",
          borderRadius: 32,
          boxShadow: "0 60px 140px -40px rgba(0,0,0,0.42)",
          border: "1px solid rgba(241, 245, 249, 0.6)",
          backdropFilter: "blur(18px)",
          overflow: "hidden",
          display: "flex",
        }}
      >
        {/* Sidebar - Candidate Snapshot (compact, no avatar, merged rating, no scrollbar) */}
        <div style={{
          // width: 340,
          width: 385,
          background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
          borderRight: "1px solid #e2e8f0",
          display: "flex",
          flexDirection: "column",
        }}>
          <div style={{ padding: "24px 20px", overflow:"auto" }}> {/* Tight top/bottom padding */}

            {/* Name + Job Title (no avatar) */}
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <h2 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 700, color: "#1e293b" }}>
                {data.first_Name} {data.lastName}
              </h2>
              <div style={{ fontSize: 14, color: "#64748b" }}>
                {data.jobTitle || "—"}
              </div>
            </div>

            {/* Improved AI ATS Score + Rating */}
            <div style={{
              marginBottom: 20,
              textAlign: "center",
              // background: "linear-gradient(135deg, #fffaf0, #fffdf9)",
              borderRadius: 16,
              padding: "16px 20px",
              background: "#ffffff",
              border: "1px solid #ffd6a8",
              boxShadow: "0 6px 16px rgba(255,171,73,0.08)",
            }}>
              <div style={{
                display: "flex",
                justifyContent: "space-around",
                alignItems: "center",
                gap: 32,
              }}>
                {/* AI ATS Score - Prominent */}
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  transition: "transform 0.2s",
                }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                  onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                >
                  <CircularScore
                    score={parsed.resume_score?.overall_score || 0}
                    label="ATS"
                    // Optional: make score ring slightly larger
                    // You can pass custom props to CircularScore if you want bigger radius
                  />
                  <div style={{
                    marginTop: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#FFAB49",
                  }}>
                    AI ATS Score
                  </div>
                </div>

                {/* Star Rating - Aligned vertically */}
                {/* Star Rating with half support + "Not rated" */}
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  transition: "transform 0.2s",
                }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                  onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                >
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4, // tighter gap for compactness
                    fontSize: 26,
                    color: "#fbbf24",
                  }}>
                    {(() => {
                      const rating = data.ratings || 0;
                      if (rating === 0) {
                        return (
                          <span style={{ fontSize: 16, color: "#94a3b8", fontStyle: "italic" }}>
                            Not rated
                          </span>
                        );
                      }

                      const fullStars = Math.floor(rating);
                      const hasHalf = rating % 1 >= 0.5;

                      return (
                        <>
                          {Array(fullStars).fill(0).map((_, i) => (
                            <IoStar key={`full-${i}`} size={26} color="#FBBF24" />
                          ))}
                          {hasHalf && <IoStarHalf size={26} color="#FBBF24" />}
                          {Array(5 - fullStars - (hasHalf ? 1 : 0)).fill(0).map((_, i) => (
                            <IoStarOutline key={`empty-${i}`} size={26} color="#E5E7EB" />
                          ))}
                        </>
                      );
                    })()}
                  </div>

                  <div style={{
                    marginTop: 6,
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#1e293b",
                  }}>
                    {data.ratings ? data.ratings.toFixed(1) : "—"} / 5
                  </div>
                </div>
              </div>
            </div>

            {/* Contact - very tight */}
            <Section title="Contact" highlight style={{ padding: "16px 0", padding:"10px 20px", marginBottom:"0px" }}>
              <InfoLine icon={HiOutlineMail} label="Email" value={data.userEmail} accent />
              <InfoLine icon={HiOutlinePhone} label="Phone" value={data.mobile} accent />
              <InfoLine icon={HiOutlineLocationMarker} label="Location" value={data.jobLocation} />
              <InfoLine icon={HiOutlineBriefcase} label="Total" value={`${data.experienceYears || 0} yrs ${data.experienceMonths || 0} mos`} />
              <InfoLine icon={RiFolderReceivedFill} label="Applied" value={data.appliedDate ? new Date(data.appliedDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"} />
            </Section>
        
            

          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{
            padding: "24px 40px",
            borderBottom: "1px solid #e2e8f0",
            background: "#ffffff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <div style={{ display: "flex", gap: 40 }}>
              {["profile", "parsed"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    background: "none",
                    border: "none",
                    padding: "8px 0",
                    fontSize: 15,
                    fontWeight: 600,
                    color: activeTab === tab ? "#ff8800" : "#475569",
                    borderBottom: activeTab === tab ? "3px solid #ff8800" : "3px solid transparent",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {tab === "profile" ? "Profile Overview" : "Parsed Resume"}
                </button>
              ))}
            </div>

            <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", borderRadius: 12, padding: 10, cursor: "pointer" }}>
              <HiOutlineX size={24} color="#475569" />
            </button>
          </div>

          <div style={{
            flex: 1,
            padding: "32px 40px",
            overflowY: "auto",
            background: "linear-gradient(180deg, #fafafa 0%, #f8fafc 100%)",
          }}>
            {activeTab === "profile" ? (
              // ... your existing profile content remains unchanged ...
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <Section icon={HiOutlineDocumentText} title="Position & Status" highlight>
                  <InfoLine label="Role" value={data.jobTitle} />
                  <InfoLine label="Type" value={data.jobType} />
                  <InfoLine label="Location" value={data.jobLocation} />
                  <InfoLine label="Current Status" value={data.status} accent />
                </Section>

                <Section title="Required Skills & Keywords">
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 8 }}>
                    {data.requiredSkills?.length > 0 ? (
                      data.requiredSkills.map((skill, i) => (
                        <Tag key={i} variant={i % 3 === 0 ? "accent" : "default"}>{skill.trim()}</Tag>
                      ))
                    ) : (
                      <span style={{ color: "#94a3b8" }}>No skills specified</span>
                    )}
                  </div>
                </Section>

                <Section title="Job Description">
                  <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.8, color: "#334155", whiteSpace: "pre-wrap" }}>
                    {data.job_Description || "No description available."}
                  </p>
                </Section>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column",  }}>
                {/* View Resume Button */}
                {resumeUrl && (
                  <div style={{ textAlign: "right", marginBottom: 16 }}>
                    <button
                      onClick={handleViewResume}
                      style={{
                        background: "linear-gradient(135deg, #FFAB49, #ff8800)",
                        color: "white",
                        border: "none",
                        borderRadius: 12,
                        padding: "12px 24px",
                        fontSize: 15,
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        boxShadow: "0 4px 12px rgba(255, 171, 73, 0.3)",
                      }}
                    >
                      <HiOutlineExternalLink size={18} />
                      View Full Resume
                    </button>
                  </div>
                )}

                {/* Parsed Resume Sections */}
                {hasData(parsed.name) && (
                  <h2 style={{ margin: "0 0 24px", fontSize: 28, fontWeight: 700, color: "#1e293b" }}>
                    {parsed.name}
                  </h2>
                )}

                {hasData(parsed.objective || parsed.summary) && (
                  <div
                    style={{
                      background: "linear-gradient(135deg, #fffdf9, #fffaf5)",
                      borderRadius: 24,
                      padding: "32px 36px",
                      margin: "0 0 36px 0",
                      // borderLeft: "5px solid #FFAB49",
                      border: "1px solid #FFAB49",
                      boxShadow: "0 12px 32px rgba(255, 171, 73, 0.12)",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {/* Decorative top-right glow */}
                    <div
                      style={{
                        position: "absolute",
                        top: -40,
                        right: -40,
                        width: 120,
                        height: 120,
                        background: "radial-gradient(circle, rgba(255,171,73,0.18) 0%, transparent 70%)",
                        borderRadius: "50%",
                        pointerEvents: "none",
                      }}
                    />

                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      marginBottom: 20,
                      position: "relative",
                    }}>
                      <div style={{
                        background: "#FFAB49",
                        borderRadius: "50%",
                        width: 48,
                        height: 48,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 4px 12px rgba(255,171,73,0.3)",
                      }}>
                        <HiOutlineLightBulb size={26} color="white" />
                      </div>

                      <h3 style={{
                        margin: 0,
                        fontSize: 22,
                        fontWeight: 700,
                        color: "#1e293b",
                        letterSpacing: "-0.02em",
                      }}>
                        Professional Summary
                      </h3>
                    </div>

                    <p style={{
                      margin: 0,
                      fontSize: 16,
                      lineHeight: 1.9,
                      color: "#1f2937",
                      whiteSpace: "pre-wrap",
                      fontWeight: 400,
                      letterSpacing: "-0.01em",
                    }}>
                      { parsed.summary || parsed.objective}
                    </p>
                  </div>
                )}

                {hasData(parsed.contact) && (
                  <Section icon={HiOutlineMail} title="Contact Information" highlight>
                    {/* Email */}
                    {parsed.contact?.email && (
                      <InfoLine 
                        icon={HiOutlineMail} 
                        label="Email" 
                        value={
                          <a 
                            href={`mailto:${parsed.contact.email}`} 
                            style={{ color: "#FFAB49", textDecoration: "none" }}
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            {parsed.contact.email}
                          </a>
                        } 
                        accent 
                      />
                    )}

                    {/* Phone */}
                    {parsed.contact?.phone && (
                      <InfoLine 
                        icon={HiOutlinePhone} 
                        label="Phone" 
                        value={
                          <a 
                            href={`tel:${parsed.contact.phone.replace(/\s+/g, '')}`} 
                            style={{ color: "#FFAB49", textDecoration: "none" }}
                          >
                            {parsed.contact.phone}
                          </a>
                        } 
                        accent 
                      />
                    )}

                    {/* LinkedIn */}
                    {parsed.contact?.linkedin && (
                      <InfoLine 
                        icon={HiOutlineGlobeAlt}  // or use a LinkedIn icon if you have one
                        label="LinkedIn" 
                        value={
                          <a 
                            href={parsed.contact.linkedin.startsWith('http') 
                              ? parsed.contact.linkedin 
                              : `https://${parsed.contact.linkedin}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ color: "#FFAB49", textDecoration: "none" }}
                          >
                            {parsed.contact.linkedin}
                          </a>
                        } 
                        accent 
                      />
                    )}

                    {/* GitHub */}
                    {parsed.contact?.github && (
                      <InfoLine 
                        icon={HiOutlineGlobeAlt}  // or GitHub icon
                        label="GitHub" 
                        value={
                          <a 
                            href={parsed.contact.github.startsWith('http') 
                              ? parsed.contact.github 
                              : `https://${parsed.contact.github}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ color: "#FFAB49", textDecoration: "none" }}
                          >
                            {parsed.contact.github}
                          </a>
                        } 
                        accent 
                      />
                    )}

                    {/* Portfolio */}
                    {parsed.contact?.portfolio && (
                      <InfoLine 
                        icon={HiOutlineGlobeAlt}
                        label="Portfolio" 
                        value={
                          <a 
                            href={parsed.contact.portfolio.startsWith('http') 
                              ? parsed.contact.portfolio 
                              : `https://${parsed.contact.portfolio}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ color: "#FFAB49", textDecoration: "none" }}
                          >
                            {parsed.contact.portfolio}
                          </a>
                        } 
                        accent 
                      />
                    )}

                    {/* Address */}
                    {parsed.contact?.address && (
                      <InfoLine 
                        icon={HiOutlineLocationMarker} 
                        label="Address" 
                        value={parsed.contact.address} 
                        accent 
                      />
                    )}

                    {/* Fallback if nothing useful */}
                    {!parsed.contact?.email && 
                    !parsed.contact?.phone && 
                    !parsed.contact?.linkedin && 
                    !parsed.contact?.github && 
                    !parsed.contact?.portfolio && 
                    !parsed.contact?.address && (
                      <div style={{ 
                        color: "#94a3b8", 
                        fontSize: 14.5, 
                        fontStyle: "italic", 
                        padding: "8px 0" 
                      }}>
                        No contact information available
                      </div>
                    )}
                  </Section>
                )}

                {hasData(parsed.skills) && (
                  <Section icon={HiOutlineStar} title="Skills" highlight>
                    {/* Technical Skills */}
                    {parsed.skills?.technical?.length > 0 && (
                      <div style={{ marginBottom: 24 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: "#FFAB49", marginBottom: 10 }}>
                          Technical Skills
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                          {parsed.skills.technical.map((skill, i) => (
                            <Tag key={i} variant="accent">
                              {skill}
                            </Tag>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Databases */}
                    {parsed.skills?.databases?.length > 0 && (
                      <div style={{ marginBottom: 24 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: "#FFAB49", marginBottom: 10 }}>
                          Databases
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                          {parsed.skills.databases.map((db, i) => (
                            <Tag key={i}>{db}</Tag>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Frameworks */}
                    {parsed.skills?.frameworks?.length > 0 && (
                      <div style={{ marginBottom: 24 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: "#FFAB49", marginBottom: 10 }}>
                          Frameworks
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                          {parsed.skills.frameworks.map((fw, i) => (
                            <Tag key={i} variant="accent">
                              {fw}
                            </Tag>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Languages */}
                    {parsed.skills?.languages?.length > 0 && (
                      <div style={{ marginBottom: 24 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: "#FFAB49", marginBottom: 10 }}>
                          Programming Languages
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                          {parsed.skills.languages.map((lang, i) => (
                            <Tag key={i}>{lang}</Tag>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tools */}
                    {parsed.skills?.tools?.length > 0 && (
                      <div style={{ marginBottom: 24 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: "#FFAB49", marginBottom: 10 }}>
                          Tools & Technologies
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                          {parsed.skills.tools.map((tool, i) => (
                            <Tag key={i}>{tool}</Tag>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Soft Skills */}
                    {parsed.skills?.soft?.length > 0 && (
                      <div style={{ marginBottom: 24 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: "#FFAB49", marginBottom: 10 }}>
                          Soft Skills
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                          {parsed.skills.soft.map((s, i) => (
                            <Tag key={i}>{s}</Tag>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Fallback - only if literally nothing */}
                    {!parsed.skills?.technical?.length &&
                    !parsed.skills?.databases?.length &&
                    !parsed.skills?.frameworks?.length &&
                    !parsed.skills?.languages?.length &&
                    !parsed.skills?.tools?.length &&
                    !parsed.skills?.soft?.length && (
                      <div style={{ 
                        color: "#94a3b8", 
                        fontSize: 14, 
                        fontStyle: "italic", 
                        padding: "12px 0",
                        textAlign: "center"
                      }}>
                        No skills listed
                      </div>
                    )}
                  </Section>
                )}

                {hasData(parsed.experience) && (
                  <Section icon={HiOutlineBriefcase} title="Professional Experience" highlight>
                    {parsed.experience.map((exp, i) => {
                      const title = exp?.title || exp?.role || exp?.position || "—";
                      const company = exp?.company || exp?.organization || exp?.employer || "";
                      const location = exp?.location || "";

                      // ─────────────────────────────────────
                      // DATES LOGIC – now supports your new format
                      // ─────────────────────────────────────
                      const startDate = exp?.start_date || exp?.startDate || "";
                      const endDate = exp?.end_date || exp?.endDate || "";
                      const directDates = exp?.dates || exp?.date || exp?.period || "";

                      let dates = "—";

                      if (directDates && typeof directDates === "string" && directDates.trim()) {
                        dates = directDates.trim();
                      } else if (startDate || endDate) {
                        dates = [startDate, endDate === "Present" ? "Present" : endDate]
                          .filter(Boolean)
                          .join(" – ");
                      }

                      // ─────────────────────────────────────
                      // DESCRIPTION – safe for null/string
                      // ─────────────────────────────────────
                      const descriptionItems = (() => {
                        const raw = exp?.description;

                        if (!raw) return [];

                        if (typeof raw === "string" && raw.trim()) {
                          return [raw.trim()];
                        }

                        if (Array.isArray(raw)) {
                          return raw
                            .filter(item => typeof item === "string" && item.trim())
                            .map(item => item.trim());
                        }

                        return [];
                      })();

                      return (
                        <div
                          key={i}
                          style={{
                            marginBottom: i < parsed.experience.length - 1 ? 32 : 0,
                            paddingBottom: 20,
                            borderBottom: i < parsed.experience.length - 1 ? "1px solid #ffe8cc" : "none",
                          }}
                        >
                          {/* Title + Company */}
                          <div style={{ fontSize: 17, fontWeight: 600, color: "#1e293b", marginBottom: 6 }}>
                            {title}
                            {company && <span style={{ color: "#FFAB49", fontWeight: 500 }}> at {company}</span>}
                          </div>

                          {/* Location + Dates */}
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 12, fontSize: 14, color: "#64748b" }}>
                            {location && (
                              <div>
                                <span style={{ fontWeight: 500 }}>Location:</span> {location}
                              </div>
                            )}
                            {dates !== "—" && (
                              <div>
                                <span style={{ fontWeight: 500 }}>Period:</span> {dates}
                              </div>
                            )}
                          </div>

                          {/* Description bullets */}
                          {descriptionItems.length > 0 && (
                            <ul
                              style={{
                                margin: "12px 0 0 0",
                                paddingLeft: 20,
                                listStyleType: "disc",
                                color: "#4e4e4e",
                                fontSize: 14.5,
                                lineHeight: 1.7,
                              }}
                            >
                              {descriptionItems.map((item, idx) => (
                                <li key={idx} style={{ marginBottom: 8 }}>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          )}

                          {/* Fallback if minimal data */}
                          {title === "—" && !company && !location && dates === "—" && descriptionItems.length === 0 && (
                            <div style={{ fontSize: 14, color: "#94a3b8", fontStyle: "italic" }}>
                              Experience details not fully specified
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </Section>
                )}

               {hasData(parsed.education) && (
                <Section icon={HiOutlineAcademicCap} title="Education" highlight>
                  {parsed.education.map((edu, i) => {
                    const degree       = edu?.degree || edu?.qualification || "";
                    const institution  = edu?.institution || edu?.university || edu?.school || "";
                    const major        = edu?.major || edu?.specialization || edu?.field || "";
                    const cgpi         = edu?.cgpi || edu?.cgpa || "";
                    const percentage   = edu?.percentage || "";
                    const startDate    = edu?.start_date || edu?.startDate || "";
                    const endDate      = edu?.end_date   || edu?.endDate   || "";
                    const graduationDate = edu?.graduation_date || edu?.graduationDate || "";

                    // ─────────────────────────────────────
                    // IMPROVED SMART DATES LOGIC
                    // ─────────────────────────────────────
                    let dates = "—";

                    if (startDate || endDate) {
                      const start = startDate?.trim() || "";
                      const end   = endDate?.trim()   || "Pursuing";
                      dates = [start, end].filter(Boolean).join(" – ");
                    } else if (graduationDate && typeof graduationDate === "string" && graduationDate.trim()) {
                      dates = graduationDate.trim();
                    }

                    // ─────────────────────────────────────
                    // CGPI / Percentage (unchanged)
                    // ─────────────────────────────────────
                    const scoreItems = [];
                    if (cgpi && typeof cgpi === "string" && cgpi.trim()) {
                      scoreItems.push({ label: "CGPI", value: cgpi.trim() });
                    }
                    if (percentage && typeof percentage === "string" && percentage.trim()) {
                      scoreItems.push({ label: "Percentage", value: percentage.trim() });
                    }

                    return (
                      <div
                        key={i}
                        style={{
                          marginBottom: i < parsed.education.length - 1 ? 28 : 0,
                          paddingBottom: 16,
                          borderBottom: i < parsed.education.length - 1 ? "1px solid #ffe8cc" : "none",
                        }}
                      >
                        {/* Degree + Major */}
                        <div style={{ marginBottom: 6 }}>
                          {degree && (
                            <div style={{ fontSize: 17, fontWeight: 600, color: "#1e293b" }}>
                              {degree}
                            </div>
                          )}
                          {major && (
                            <div style={{ fontSize: 15, color: "#334155", fontWeight: 500, marginTop: 2 }}>
                              {major}
                            </div>
                          )}
                        </div>

                        {/* Institution */}
                        {institution && (
                          <div style={{ fontSize: 15, color: "#334155", fontWeight: 500, marginBottom: 8 }}>
                            {institution}
                          </div>
                        )}

                        {/* Dates – now shows range when available */}
                        {dates !== "—" && (
                          <div style={{ fontSize: 14, color: "#64748b", marginBottom: 8 }}>
                            <span style={{ fontWeight: 500 }}>Period: </span>
                            {dates}
                          </div>
                        )}

                        {/* CGPI / Percentage */}
                        {scoreItems.length > 0 && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 24, fontSize: 14, color: "#64748b" }}>
                            {scoreItems.map((item, idx) => (
                              <div key={idx}>
                                <span style={{ fontWeight: 500 }}>{item.label}: </span>
                                {item.value}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Fallback if almost empty */}
                        {!degree && !institution && !major && dates === "—" && scoreItems.length === 0 && (
                          <div style={{ fontSize: 14, color: "#94a3b8", fontStyle: "italic" }}>
                            Education details not specified
                          </div>
                        )}
                      </div>
                    );
                  })}
                </Section>
              )}

                {hasData(parsed.projects) && (
                  <Section icon={HiOutlineDocumentText} title="Projects" highlight>
                    {parsed.projects.map((proj, i) => {
                      // Title priority
                      const title = proj?.name || proj?.title || proj?.project?.name || proj?.project?.title || "Untitled Project";

                      // Dates (fallback – your data has none, but kept for robustness)
                      let dates = "—";
                      const directDates = proj?.dates || proj?.date || proj?.period || "";
                      if (directDates && typeof directDates === "string" && directDates.trim()) {
                        dates = directDates.trim();
                      }

                      // Description – safe for string / null / missing
                      const description = typeof proj?.description === "string" && proj.description.trim()
                        ? proj.description.trim()
                        : "";

                      // Extra fields (technologies + type)
                      const technologies = Array.isArray(proj?.technologies) && proj.technologies.length > 0
                        ? proj.technologies.filter(t => typeof t === "string" && t.trim())
                        : [];
                      const projectType = proj?.type || proj?.project_type || "";

                      return (
                        <div
                          key={i}
                          style={{
                            marginBottom: i < parsed.projects.length - 1 ? 10 : 0,
                            paddingBottom: 10,
                            borderBottom: i < parsed.projects.length - 1 ? "1px solid #ffe8cc" : "none",
                          }}
                        >
                          {/* Project Title */}
                          <div style={{
                            fontSize: 17,
                            fontWeight: 600,
                            color: "#1e293b",
                            marginBottom: 6,
                          }}>
                            {title}
                          </div>

                          {/* Type (if present) */}
                          {projectType && (
                            <div style={{
                              fontSize: 14,
                              color: "#64748b",
                              fontWeight: 500,
                              marginBottom: 6,
                            }}>
                              {projectType}
                            </div>
                          )}

                          {/* Dates (if present) */}
                          {dates !== "—" && (
                            <div style={{
                              fontSize: 14,
                              color: "#64748b",
                              marginBottom: description || technologies.length ? 12 : 0,
                            }}>
                              {dates}
                            </div>
                          )}

                          {/* Description */}
                          {description && (
                            <p style={{
                              margin: "0 0 12px 0",
                              fontSize: 14.5,
                              lineHeight: 1.75,
                              color: "#334155",
                              whiteSpace: "pre-wrap",
                              wordBreak: "break-word",
                            }}>
                              {description}
                            </p>
                          )}

                          {/* Technologies (tags) */}
                          {technologies.length > 0 && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
                              {technologies.map((tech, idx) => (
                                <Tag key={idx} variant="accent">
                                  {tech.trim()}
                                </Tag>
                              ))}
                            </div>
                          )}

                          {/* Fallback if minimal data */}
                          {title === "Untitled Project" && !description && dates === "—" && technologies.length === 0 && !projectType && (
                            <div style={{ fontSize: 14, color: "#94a3b8", fontStyle: "italic" }}>
                              Project details not fully specified
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </Section>
                )}



                {hasData(parsed.resume_score) && (
                  <Section icon={HiOutlineChartBar} title="AI Resume Score" highlight>
                    {/* 559 */}
                    <div style={{ display: "flex", justifyContent: "center", margin: "20px 0" }}>
                      <CircularScore score={parsed.resume_score.overall_score || 0} label="Overall" />
                    </div>
                    {parsed.resume_score.score_breakdown && (
                      <div style={{ marginTop: 24 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: "#FFAB49", marginBottom: 12 }}>Breakdown</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                          {Object.entries(parsed.resume_score.score_breakdown).map(([key, val]) => (
                            <div key={key} style={{ background: "#fffaf0", padding: 12, borderRadius: 12, border: "1px solid #ffe8cc" }}>
                              <div style={{ fontSize: 13, color: "#64748b" }}>{key.replace(/_/g, " ")}</div>
                              <div style={{ fontSize: 18, fontWeight: 700, color: "#FFAB49" }}>{val}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Section>
                )}

                {hasData(parsed.classification) && (
                  <Section icon={HiOutlineUserGroup} title="Classification" highlight>
                    {parsed.classification.primary_role && <InfoLine label="Primary Role" value={parsed.classification.primary_role} />}
                    {parsed.classification.experience_level && <InfoLine label="Experience Level" value={parsed.classification.experience_level} />}
                    {parsed.classification.industry && <InfoLine label="Industry" value={parsed.classification.industry} />}
                    {hasData(parsed.classification.job_categories) && (
                      <div style={{ marginTop: 12 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, color: "#64748b", marginBottom: 6 }}>Job Categories</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                          {parsed.classification.job_categories.map((cat, i) => <Tag key={i}>{cat}</Tag>)}
                        </div>
                      </div>
                    )}
                  </Section>
                )}

                {hasData(parsed.achievements) && (
                  <Section icon={HiOutlineStar} title="Achievements">
                    <ul style={{ margin: 0, paddingLeft: 20, listStyleType: "disc", color: "#4e4e4e", fontSize: 14.5 }}>
                      {parsed.achievements.map((ach, i) => <li key={i} style={{ marginBottom: 8 }}>{ach}</li>)}
                    </ul>
                  </Section>
                )}

                {hasData(parsed.extra_curriculars) && (
                  <Section icon={HiOutlineHeart} title="Extracurricular Activities">
                    <ul style={{ margin: 0, paddingLeft: 20, listStyleType: "disc", color: "#4e4e4e", fontSize: 14.5 }}>
                      {parsed.extra_curriculars.map((act, i) => <li key={i} style={{ marginBottom: 8 }}>{act}</li>)}
                    </ul>
                  </Section>
                )}

                
                {/* {hasData(parsed.interests) && (
                  <Section icon={HiOutlineStar} title="Interests">
                    <ul
                      style={{
                        margin: 0,
                        paddingLeft: 20,
                        listStyleType: "disc",
                        color: "#4e4e4e",
                        fontSize: 14.5
                      }}
                    >
                      {parsed.interests.map((int, i) => (
                        <li key={i} style={{ marginBottom: 8 }}>
                          <strong>{int.name}</strong>
                          {int.date && ` (${int.date})`}
                          {int.description && ` – ${int.description}`}
                        </li>
                      ))}
                    </ul>
                  </Section>
                )} */}
                {hasData(parsed.interests) && (
                  <Section icon={HiOutlineStar} title="Interests">
                    <ul
                      style={{
                        margin: 0,
                        paddingLeft: 20,
                        listStyleType: "disc",
                        color: "#4e4e4e",
                        fontSize: 14.5
                      }}
                    >
                      {parsed.interests.map((int, i) => {
                        const interest = typeof int === "string" ? { name: int } : int;

                        return (
                          <li key={i} style={{ marginBottom: 8 }}>
                            <strong>{interest.name}</strong>
                            {interest.date && ` (${interest.date})`}
                            {interest.description && ` – ${interest.description}`}
                          </li>
                        );
                      })}
                    </ul>
                  </Section>
                )}



                {hasData(parsed.languages) && (
                  <Section icon={HiOutlineGlobeAlt} title="Languages">
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 8 }}>
                      {parsed.languages.map((lang, i) => <Tag key={i}>{lang}</Tag>)}
                    </div>
                  </Section>
                )}

                {/* Fallback if nothing parsed */}
                {!Object.keys(parsed).length && (
                  <div style={{ textAlign: "center", color: "#94a3b8", padding: "60px 0" }}>
                    No parsed resume data available
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showPdfPreview && resumeUrl && (
        <div
          onClick={() => setShowPdfPreview(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "90vw",
              maxWidth: "1200px",
              height: "90vh",
              background: "#ffffff",
              borderRadius: 24,
              boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
              overflow: "hidden",
              position: "relative",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header with close button */}
            <div
              style={{
                padding: "16px 24px",
                background: "linear-gradient(135deg, #f8fafc, #f1f5f9)",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "#1e293b" }}>
                Resume Preview
              </h3>
              <button
                onClick={() => setShowPdfPreview(false)}
                style={{
                  background: "rgba(241,245,249,0.8)",
                  border: "none",
                  borderRadius: 12,
                  padding: 10,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <HiOutlineX size={24} color="#475569" />
              </button>
            </div>

            {/* PDF Viewer */}
            <div style={{ flex: 1, overflow: "hidden" }}>
              <iframe
                src={resumeUrl}
                title="Resume PDF Preview"
                width="100%"
                height="100%"
                style={{
                  border: "none",
                  background: "#f8fafc",
                }}
              />
            </div>
          </div>
        </div>
      )}



    </div>
  );
};

export default ResumePreviewModal;