import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PreloginHeader from "../components/PreloginHeader";
import ScrollReveal from "../components/ScrollReveal";
import "./prelogin.css";
import "./industries-classic_backup.css";

const businessServices = [
  {
    title: "Law Firms",
    description:
      "Securely manage contracts, legal evidence, and client documents with Blackhole Vault protection.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3v18" />
        <path d="M5 8h14" />
        <path d="M5 8l-2 7h4l-2-7z" />
        <path d="M19 8l-2 7h4l-2-7z" />
        <path d="M8 21h8" />
        <path d="M10 18h4" />
      </svg>
    ),
  },
  {
    title: "Accounting Firms",
    description:
      "Organize financial records and tax documents with permanent archive capabilities.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M8 7h8" />
        <path d="M8 11h8" />
        <path d="M8 15h3" />
        <path d="M14 15h2" />
        <path d="M8 18h3" />
        <path d="M14 18h2" />
      </svg>
    ),
  },
  {
    title: "Marketing Agencies",
    description:
      "Store and share creative assets, campaigns, and client deliverables seamlessly.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="M7 15l4-5 3 3 5-7" />
      </svg>
    ),
  },
  {
    title: "IT Services",
    description:
      "Manage technical documentation, system backups, and client infrastructure files.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="6" rx="1.5" />
        <rect x="3" y="14" width="18" height="6" rx="1.5" />
        <path d="M7 7h.01" />
        <path d="M7 17h.01" />
      </svg>
    ),
  },
  {
    title: "Consulting",
    description:
      "Collaborate on client projects with secure file sharing and version control.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="9" cy="8" r="3" />
        <circle cx="16" cy="9" r="2.5" />
        <path d="M3.5 19c.8-3 2.8-4.5 5.5-4.5s4.7 1.5 5.5 4.5" />
        <path d="M13.5 19c.4-1.8 1.5-3 3.2-3 1.4 0 2.4.7 3.3 2" />
      </svg>
    ),
  },
  {
    title: "HR Agencies",
    description:
      "Protect sensitive employee data and recruitment documents with enterprise-grade security.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5.5 19c1-3.2 3.2-5 6.5-5s5.5 1.8 6.5 5" />
        <path d="M19 4v4" />
        <path d="M17 6h4" />
      </svg>
    ),
  },
];

const healthcare = [
  {
    title: "Hospitals",
    description:
      "Protect medical records with enterprise-grade retention workflows and compliance.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" />
      </svg>
    ),
  },
  {
    title: "Clinics",
    description:
      "Secure patient files and treatment plans with permanent archive protection.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 4v6a6 6 0 0 0 12 0V4" />
        <path d="M6 10h12" />
        <path d="M9 4v2" />
        <path d="M15 4v2" />
        <path d="M12 16v4" />
        <path d="M9 20h6" />
      </svg>
    ),
  },
  {
    title: "Diagnostic Centers",
    description:
      "Store lab results and imaging files with tamper-proof security.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 3h6" />
        <path d="M10 3v7l-4.5 8a2.5 2.5 0 0 0 2.2 3.7h8.6a2.5 2.5 0 0 0 2.2-3.7L14 10V3" />
        <path d="M8.5 14h7" />
      </svg>
    ),
  },
  {
    title: "Medical Labs",
    description:
      "Manage research data and test results with audit-trail capabilities.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 14h3l2.5-4 3 8 2.5-6H21" />
        <path d="M3 18h18" />
      </svg>
    ),
  },
  {
    title: "Wellness Centers",
    description:
      "Organize client health records and program documentation securely.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
        <path d="M18 14l.8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8L18 14z" />
      </svg>
    ),
  },
];

const constructionRealEstate = [
  {
    title: "Construction Companies",
    description:
      "Manage blueprints, permits, and project documentation in one secure place.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 14h16v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3z" />
        <path d="M8 14V9.5L12 7l4 2.5V14" />
        <path d="M7 9l5-3 5 3" />
      </svg>
    ),
  },
  {
    title: "Architects",
    description:
      "Store design files, CAD drawings, and client presentations with version control.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 20h16" />
        <path d="M5 20L14 4l5 16" />
        <path d="M8.5 14h7.5" />
      </svg>
    ),
  },
  {
    title: "Interior Designers",
    description:
      "Organize mood boards, 3D renders, and client proposals effortlessly.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 11l9-7 9 7" />
        <path d="M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9" />
        <path d="M10 20v-5h4v5" />
      </svg>
    ),
  },
  {
    title: "Real Estate Agencies",
    description:
      "Secure property documents, contracts, and transaction records permanently.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 20V8l6-4 6 4v12" />
        <path d="M16 20V11l4-2.5V20" />
        <path d="M8 20v-4h4v4" />
        <path d="M8 10h2" />
        <path d="M8 13h2" />
      </svg>
    ),
  },
];

const mediaCreative = [
  {
    title: "Photography Studios",
    description:
      "Store and share large creative assets with clients seamlessly.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
        <circle cx="12" cy="13.5" r="3.5" />
      </svg>
    ),
  },
  {
    title: "Video Production",
    description:
      "Manage raw footage, final cuts, and project files with unlimited storage.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="6" width="13" height="12" rx="2" />
        <path d="M16 10l5-3v10l-5-3v-4z" />
      </svg>
    ),
  },
  {
    title: "Design Agencies",
    description:
      "Collaborate on creative projects with secure file sharing and feedback.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="3" />
        <path d="M12 3v6" />
        <path d="M12 15v6" />
        <path d="M3 12h6" />
        <path d="M15 12h6" />
      </svg>
    ),
  },
  {
    title: "Advertising Agencies",
    description:
      "Organize campaign assets, client briefs, and deliverables efficiently.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 10v4h3l6 4V6L6 10H3z" />
        <path d="M16 9a4 4 0 0 1 0 6" />
        <path d="M18.5 7a7 7 0 0 1 0 10" />
      </svg>
    ),
  },
];

const education = [
  {
    title: "Schools",
    description:
      "Manage student records, curriculum files, and administrative documents securely.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 20V10l8-5 8 5v10" />
        <path d="M9 20v-5h6v5" />
        <path d="M12 5v3" />
      </svg>
    ),
  },
  {
    title: "Universities",
    description:
      "Store research papers, academic records, and institutional data permanently.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 9l9-5 9 5-9 5-9-5z" />
        <path d="M7 11.5v4.5c0 1.5 2.2 3 5 3s5-1.5 5-3v-4.5" />
        <path d="M21 9v7" />
      </svg>
    ),
  },
  {
    title: "Coaching Institutes",
    description:
      "Organize course materials, student progress, and teaching resources.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 5h11a2 2 0 0 1 2 2v12H6a2 2 0 0 1-2-2V5z" />
        <path d="M17 7h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1h-3" />
        <path d="M8 9h6" />
        <path d="M8 13h6" />
      </svg>
    ),
  },
  {
    title: "Online Learning Platforms",
    description:
      "Deliver video content, assignments, and certificates with secure access.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M10 10l5 3-5 3V10z" />
      </svg>
    ),
  },
];

const financeCompliance = [
  {
    title: "Banking",
    description:
      "Secure financial transactions, loan documents, and customer records.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3v18" />
        <path d="M16 7.5c0-1.7-1.8-3-4-3s-4 1.3-4 3 1.8 3 4 3 4 1.3 4 3-1.8 3-4 3-4-1.3-4-3" />
      </svg>
    ),
  },
  {
    title: "Insurance",
    description:
      "Manage policy documents, claims, and underwriting files with audit trails.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3l7 3v5c0 5-3 8.5-7 10-4-1.5-7-5-7-10V6l7-3z" />
      </svg>
    ),
  },
  {
    title: "Compliance Teams",
    description:
      "Store regulatory documents and audit reports with tamper-proof security.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M8 3h7l3 3v15a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
        <path d="M15 3v3h3" />
        <path d="M9 13l2 2 4-4" />
      </svg>
    ),
  },
  {
    title: "Auditing Firms",
    description:
      "Organize client audits, financial statements, and compliance records.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <rect x="4" y="7" width="16" height="14" rx="2" />
        <path d="M4 12h16" />
      </svg>
    ),
  },
];

const enterpriseTeams = [
  {
    title: "Startups",
    description:
      "Scale your file management as you grow with flexible enterprise features.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 19c2-1 4-4 5-8 1-4 3-6 7-7-1 4-3 6-7 7-4 1-7 3-8 8z" />
        <path d="M9 15l-3 4" />
        <path d="M12 12l2 2" />
      </svg>
    ),
  },
  {
    title: "SaaS Companies",
    description:
      "Manage product documentation, customer data, and technical resources.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M7 18h10a4 4 0 0 0 .5-8 5.5 5.5 0 0 0-10.7-1.5A3.5 3.5 0 0 0 7 18z" />
      </svg>
    ),
  },
  {
    title: "Remote Teams",
    description:
      "Collaborate across time zones with secure, accessible cloud storage.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18" />
        <path d="M12 3a14 14 0 0 1 0 18" />
        <path d="M12 3a14 14 0 0 0 0 18" />
      </svg>
    ),
  },
  {
    title: "Corporate Enterprises",
    description:
      "Enterprise-grade security and compliance for large-scale operations.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 20V7l6-3 6 3v13" />
        <path d="M16 20V10l4-2v12" />
        <path d="M9 20v-4h2v4" />
        <path d="M8 10h2" />
        <path d="M8 13h2" />
      </svg>
    ),
  },
];

const matchesSearch = (item, query, categoryLabel) => {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    item.title.toLowerCase().includes(q) ||
    item.description.toLowerCase().includes(q) ||
    categoryLabel.toLowerCase().includes(q)
  );
};

const toIndustrySlug = (title) =>
  title
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const IndustryCard = ({ item, index, onOpen }) => (
  <ScrollReveal
    className="industries-card-reveal"
    variant="fadeUp"
    delay={Math.min(index * 0.07, 0.42)}
    duration={0.75}
  >
    <article
      className="industries-card"
      role="button"
      tabIndex={0}
      onClick={() => onOpen(item.title)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(item.title);
        }
      }}
    >
      <div className="industries-card-icon">{item.icon}</div>
      <h3 className="industries-card-title">{item.title}</h3>
      <p className="industries-card-desc">{item.description}</p>
    </article>
  </ScrollReveal>
);

const IndustriesClassic = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    document.documentElement.classList.add("prelogin-active");
    document.body.classList.add("prelogin-active");
    return () => {
      document.documentElement.classList.remove("prelogin-active");
      document.body.classList.remove("prelogin-active");
    };
  }, []);

  const openIndustry = (title) => {
    navigate(`/Industries/${toIndustrySlug(title)}`);
  };

  const filteredBusinessServices = businessServices.filter((item) =>
    matchesSearch(item, searchQuery, "Business Services")
  );
  const filteredHealthcare = healthcare.filter((item) =>
    matchesSearch(item, searchQuery, "Healthcare")
  );
  const filteredConstruction = constructionRealEstate.filter((item) =>
    matchesSearch(item, searchQuery, "Construction & Real Estate")
  );
  const filteredMediaCreative = mediaCreative.filter((item) =>
    matchesSearch(item, searchQuery, "Media & Creative")
  );
  const filteredEducation = education.filter((item) =>
    matchesSearch(item, searchQuery, "Education")
  );
  const filteredFinanceCompliance = financeCompliance.filter((item) =>
    matchesSearch(item, searchQuery, "Finance & Compliance")
  );
  const filteredEnterpriseTeams = enterpriseTeams.filter((item) =>
    matchesSearch(item, searchQuery, "Enterprise & Teams")
  );

  return (
    <div className="prelogin-page industries-page industries-page--classic">
      <PreloginHeader
        aos
        links={[
          { label: "Home", to: "/" },
          { label: "Pricing", to: "/#pricing" },
        ]}
      />

      <main className="industries-main">
        <section className="industries-hero">
          <div className="content industries-hero-inner">
            <ScrollReveal variant="fadeSoft" delay={0.05}>
              <span className="industries-badge">
                Cloud Storage Made Simple &amp; Secure
              </span>
            </ScrollReveal>
            <ScrollReveal variant="fadeUp" delay={0.14} duration={0.9}>
              <h1 className="industries-hero-title">Choose Your Industry</h1>
            </ScrollReveal>
            <ScrollReveal variant="fadeUp" delay={0.24}>
              <p className="industries-hero-subtitle">
                Securely manage, protect, organize, and share files tailored to
                your industry workflows.
              </p>
            </ScrollReveal>
            <ScrollReveal className="industries-search-wrap" variant="fadeSoft" delay={0.34}>
              <input
                type="search"
                className="industries-search"
                placeholder="Search for an industry"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search for an industry"
              />
            </ScrollReveal>
            <Link to="/Industries" className="industries-layout-toggle">
              View new layout
            </Link>
          </div>
        </section>

        <section className="industries-category">
          <div className="content">

            {/* Business Services */}
          <div className="industries-search-wrap-content">
          <ScrollReveal variant="fadeUp" duration={0.8}>
            <h2 className="industries-category-title">
              <span className="industries-category-accent">Business</span>{" "}
              Services
            </h2>
          </ScrollReveal>

            <div className="industries-card-grid">
              {filteredBusinessServices.map((item, index) => (
                <IndustryCard
                  key={item.title}
                  item={item}
                  index={index}
                  onOpen={openIndustry}
                />
              ))}
            </div>

            {filteredBusinessServices.length === 0 && (
              <p className="industries-empty">No industries match your search.</p>
            )}
          </div>

            {/* Healthcare */}
            <div className="industries-search-wrap-content">
              <ScrollReveal variant="fadeUp" duration={0.8}>
                <h2 className="industries-category-title">
                  <span className="industries-category-accent">Healthcare</span>
                </h2>
              </ScrollReveal>

              <div className="industries-card-grid">
                {filteredHealthcare.map((item, index) => (
                  <IndustryCard
                    key={item.title}
                    item={item}
                    index={index}
                    onOpen={openIndustry}
                  />
                ))}
              </div>

              {filteredHealthcare.length === 0 && (
                <p className="industries-empty">No industries match your search.</p>
              )}
            </div>

            {/* Construction & Real Estate */}
            <div className="industries-search-wrap-content">
              <ScrollReveal variant="fadeUp" duration={0.8}>
                <h2 className="industries-category-title">
                  <span className="industries-category-accent">Construction</span>{" "}
                  &amp; Real Estate
                </h2>
              </ScrollReveal>

              <div className="industries-card-grid">
                {filteredConstruction.map((item, index) => (
                  <IndustryCard
                    key={item.title}
                    item={item}
                    index={index}
                    onOpen={openIndustry}
                  />
                ))}
              </div>

              {filteredConstruction.length === 0 && (
                <p className="industries-empty">No industries match your search.</p>
              )}
            </div>

            {/* Media & Creative */}
            <div className="industries-search-wrap-content">
              <ScrollReveal variant="fadeUp" duration={0.8}>
                <h2 className="industries-category-title">
                  <span className="industries-category-accent">Media</span>{" "}
                  &amp; Creative
                </h2>
              </ScrollReveal>

              <div className="industries-card-grid">
                {filteredMediaCreative.map((item, index) => (
                  <IndustryCard
                    key={item.title}
                    item={item}
                    index={index}
                    onOpen={openIndustry}
                  />
                ))}
              </div>

              {filteredMediaCreative.length === 0 && (
                <p className="industries-empty">No industries match your search.</p>
              )}
            </div>

            {/* Education */}
            <div className="industries-search-wrap-content">
              <ScrollReveal variant="fadeUp" duration={0.8}>
                <h2 className="industries-category-title">
                  <span className="industries-category-accent">Education</span>
                </h2>
              </ScrollReveal>

              <div className="industries-card-grid">
                {filteredEducation.map((item, index) => (
                  <IndustryCard
                    key={item.title}
                    item={item}
                    index={index}
                    onOpen={openIndustry}
                  />
                ))}
              </div>

              {filteredEducation.length === 0 && (
                <p className="industries-empty">No industries match your search.</p>
              )}
            </div>

            {/* Finance & Compliance */}
            <div className="industries-search-wrap-content">
              <ScrollReveal variant="fadeUp" duration={0.8}>
                <h2 className="industries-category-title">
                  <span className="industries-category-accent">Finance</span>{" "}
                  &amp; Compliance
                </h2>
              </ScrollReveal>

              <div className="industries-card-grid">
                {filteredFinanceCompliance.map((item, index) => (
                  <IndustryCard
                    key={item.title}
                    item={item}
                    index={index}
                    onOpen={openIndustry}
                  />
                ))}
              </div>

              {filteredFinanceCompliance.length === 0 && (
                <p className="industries-empty">No industries match your search.</p>
              )}
            </div>

            {/* Enterprise & Teams */}
            <div className="industries-search-wrap-content">
              <ScrollReveal variant="fadeUp" duration={0.8}>
                <h2 className="industries-category-title">
                  <span className="industries-category-accent">Enterprise</span>{" "}
                  &amp; Teams
                </h2>
              </ScrollReveal>

              <div className="industries-card-grid">
                {filteredEnterpriseTeams.map((item, index) => (
                  <IndustryCard
                    key={item.title}
                    item={item}
                    index={index}
                    onOpen={openIndustry}
                  />
                ))}
              </div>

              {filteredEnterpriseTeams.length === 0 && (
                <p className="industries-empty">No industries match your search.</p>
              )}
            </div>

          </div>
        </section>
      </main>
    </div>
  );
};

export default IndustriesClassic;
