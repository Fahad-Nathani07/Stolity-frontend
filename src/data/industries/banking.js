const banking = {
    slug: "banking",
    category: "Finance",
  
    listing: {
      title: "Banking",
      description:
        "Secure customer records, loan documents, transaction files, and regulatory compliance documentation.",
    },
  
    badgeLabel: "Banking",
    badgeIcon: "file-check",
    titleBefore: "Secure File Management for ",
    titleHighlight: "Banking",
    paragraphs: [
      "For banks managing customer records, loan documents, transaction files, and regulatory compliance documentation.",
      "Enterprise-grade security for financial data with compliance-ready workflows and immutable archive protection.",
    ],
    heroImage: "/images/industries/banking/hero.png",
    ctaPrimary: { label: "Get Started", action: "login" },
    ctaSecondary: { label: "Book Demo", action: "demo" },
  
    whyChoose: {
      title: "Why Banking Choose Stolity",
      subtitle: "Built specifically for your industry workflows",
      backgroundImage: "/images/industries/banking/why-choose-bg.jpg",
      cards: [
        {
          label: "Secure customer and transaction record storage",
          icon: "lock",
        },
        {
          label: "Loan document and contract management",
          icon: "search-file",
        },
        {
          label: "Long-term regulatory archive retention",
          icon: "users",
        },
        {
          label: "Tamper-proof financial data protection",
          icon: "cloud-upload",
        },
        {
          label: "Regulatory compliance and audit-ready workflows",
          icon: "cabinet",
        },
      ],
    },
  
    featureSections: [
      {
        id: "customer-record-management",
        title: "Customer Record Management",
        description:
          "Organize customer files, account documents, KYC records, and financial information with encrypted storage and access controls.",
        items: [
          "Customer file organization",
          "Account documentation",
          "KYC record management",
          "Encrypted storage",
        ],
        image: "/images/industries/banking/document-management.jpg",
        theme: "pink",
        imageStyle: "curve",
      },
      {
        id: "regulatory-compliance",
        title: "Regulatory Compliance",
        description:
          "Meet banking regulations with immutable archive protection, complete audit trails, and automated retention policies.",
        items: [
          "Immutable archives",
          "Audit trail tracking",
          "Retention policies",
          "Compliance workflows",
        ],
        image: "/images/industries/shared/hipaa-compliance.png",
        theme: "peach",
        imageStyle: "illustration",
      },
      {
        id: "loan-transaction-management",
        title: "Loan & Transaction Management",
        description:
          "Store loan applications, contracts, transaction records, and supporting documentation with secure access.",
        items: [
          "Loan documentation",
          "Contract storage",
          "Transaction records",
          "Secure access control",
        ],
        image: "/images/industries/banking/department-collaboration.jpg",
        theme: "peach",
        imageStyle: "curve",
      },
    ],
  
    everythingYouNeed: {
      title: "Everything You Need",
      subtitle: "Powerful features designed for your workflow",
      backgroundImage: "/images/industries/banking/everything-bg.jpg",
      testimonialImage:
        "/images/industries/banking/everything-testimonial.png",
      ratingImage: "/images/industries/banking/everything-rating.png",
      features: [
        { label: "Large File Support", icon: "lock" },
        { label: "Encrypted Storage", icon: "activity" },
        { label: "Version History", icon: "archive" },
        { label: "Client Sharing", icon: "share" },
        { label: "Folder Management", icon: "file-check" },
        { label: "Team Permissions", icon: "lock" },
      ],
    },
  
    bottomCta: {
      titleBefore: "",
      titleHighlight: "Protect",
      titleAfter: " Your Banking Files",
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
  
  export default banking;