/**
 * Accounting Firms — detail page data for /Industries/accounting-firms
 *
 * Images: public/images/industries/accounting-firms/
 *   hero.png
 *   why-choose-bg.jpg
 *   patient-record-management.jpg
 *   department-collaboration.jpg
 *   everything-bg.jpg
 *   everything-testimonial.png
 *   everything-rating.png
 *
 * Reuses:
 *   /images/industries/shared/hipaa-compliance.png
 */

const accountingFirms = {
    slug: "accounting-firms",
    category: "Finance",
  
    listing: {
      title: "Accounting Firms",
      description:
        "Secure financial documents, client files, tax records, and audit trails with enterprise-grade file management.",
    },
  
    badgeLabel: "Accounting Firms",
    badgeIcon: "file-check",
    titleBefore: "#1 File Workspace ",
    titleHighlight: "Accounting Firms",
    paragraphs: [
      "For accounting teams managing financial records, tax documents, client files, and audit trails.",
      "Secure client data with enterprise-grade protection and meet compliance requirements effortlessly.",
    ],
    heroImage: "/images/industries/accounting-firms/hero.png",
    ctaPrimary: { label: "Get Started", action: "login" },
    ctaSecondary: { label: "Book Demo", action: "demo" },
  
    whyChoose: {
      title: "Why Accounting Firms Choose Stolity",
      subtitle: "Built specifically for your industry workflows",
      backgroundImage:
        "/images/industries/accounting-firms/why-choose-bg.jpg",
      cards: [
        { label: "Secure Financial Document Storage", icon: "lock" },
        { label: "Client File Organization and Access Control", icon: "search-file" },
        { label: "Tax Document Retention and Compliance", icon: "users" },
        { label: "Audit-Ready File Management", icon: "cloud-upload" },
        { label: "Long-Term Archive Protection", icon: "cabinet" },
      ],
    },
  
    featureSections: [
      {
        id: "financial-document-management",
        title: "Financial Document Management",
        description:
          "Organize tax returns, financial statements, and client records with secure folder structures and easy retrieval.",
        items: [
          "Client folder organization",
          "Tax year categorization",
          "Document search & filters",
          "Secure client access",
        ],
        image:
          "/images/industries/accounting-firms/patient-record-management.jpg",
        theme: "pink",
        imageStyle: "curve",
      },
      {
        id: "compliance-retention",
        title: "Compliance & Retention",
        description:
          "Meet regulatory requirements with automated retention policies and tamper-proof archive protection.",
        items: [
          "Automated retention policies",
          "Compliance workflows",
          "Immutable archives",
          "Audit trail tracking",
        ],
        image: "/images/industries/shared/hipaa-compliance.png",
        theme: "peach",
        imageStyle: "illustration",
      },
      {
        id: "team-collaboration",
        title: "Team Collaboration",
        description:
          "Share files securely with your accounting team, track changes, and maintain version control.",
        items: [
          "Team file sharing",
          "Version history",
          "Role-based permissions",
          "Activity tracking",
        ],
        image:
          "/images/industries/accounting-firms/department-collaboration.jpg",
        theme: "peach",
        imageStyle: "curve",
      },
    ],
  
    everythingYouNeed: {
      title: "Everything You Need",
      subtitle: "Powerful features designed for your workflow",
      backgroundImage:
        "/images/industries/accounting-firms/everything-bg.jpg",
      testimonialImage:
        "/images/industries/accounting-firms/everything-testimonial.png",
      ratingImage:
        "/images/industries/accounting-firms/everything-rating.png",
      features: [
        { label: "File Versioning", icon: "lock" },
        { label: "Secure Sharing", icon: "lock" },
        { label: "Access Logs", icon: "activity" },
        { label: "Team Permissions", icon: "archive" },
        { label: "Archive Retention", icon: "share" },
        { label: "Admin Controls", icon: "file-check" },
      ],
    },
  
    bottomCta: {
      titleBefore: "",
      titleHighlight: "Protect",
      titleAfter: " Your Most Important Files",
      subtitle:
        "Built for secure modern workflows. Never lose critical documents again.",
      primaryLabel: "Get Started Free",
      secondaryLabel: "Talk To Sales",
    },
  
    footer: {
      copyright: "© 2026 Stolity. All rights reserved.",
      links: [
        { label: "Terms of Service", href: "/terms-and-conditions" },
        { label: "Privacy Policy", href: "/privacy-policy" },
        { label: "Cookies", href: "/privacy-policy" },
      ],
    },
  };
  
  export default accountingFirms;