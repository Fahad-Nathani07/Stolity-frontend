const clinics = {
    slug: "clinics",
    category: "Healthcare",
  
    listing: {
      title: "Clinics",
      description:
        "Secure patient files and treatment plans with permanent archive protection.",
    },
  
    badgeLabel: "Clinics",
    badgeIcon: "heart",
    titleBefore: "Secure File Management for ",
    titleHighlight: "Clinics",
    paragraphs: [
      "For clinic teams managing patient records, appointment files, treatment plans, and medical documentation.",
      "Streamline your clinic workflows with secure patient file management and HIPAA-compliant storage.",
    ],
    heroImage: "/images/industries/clinics/hero.png",
    ctaPrimary: { label: "Get Started", action: "login" },
    ctaSecondary: { label: "Book Demo", action: "demo" },
  
    whyChoose: {
      title: "Why Clinics Choose Stolity",
      subtitle: "Built specifically for your industry workflows",
      backgroundImage: "/images/industries/clinics/why-choose-bg.jpg",
      cards: [
        { label: "Secure Patient File Management", icon: "lock" },
        { label: "HIPAA-Compliant Storage and Access Control", icon: "search-file" },
        { label: "Long-Term Patient Archive Protection", icon: "users" },
        { label: "Easy Appointment and Medical Record Retrieval", icon: "cloud-upload" },
        { label: "Treatment Plan Documentation and Tracking", icon: "cabinet" },
      ],
    },
  
    featureSections: [
      {
        id: "patient-file-management",
        title: "Patient File Management",
        description:
          "Organize patient records, visit notes, prescriptions, and treatment plans with intuitive folder structures and quick search.",
        items: [
          "Patient record organization",
          "Visit documentation",
          "Prescription tracking",
          "Medical history access",
        ],
        image: "/images/industries/clinics/document-management.jpg",
        theme: "pink",
        imageStyle: "curve",
      },
      {
        id: "compliance-privacy",
        title: "Compliance & Privacy",
        description:
          "Ensure HIPAA compliance with encrypted storage, access controls, and complete audit trails for all patient data.",
        items: [
          "HIPAA compliance workflows",
          "Encrypted patient data",
          "Access control policies",
          "Privacy audit logs",
        ],
        image: "/images/industries/shared/hipaa-compliance.png",
        theme: "peach",
        imageStyle: "illustration",
      },
      {
        id: "team-collaboration",
        title: "Team Collaboration",
        description:
          "Share patient files securely with medical staff, nurses, and specialists while maintaining strict access controls.",
        items: [
          "Staff file sharing",
          "Role-based permissions",
          "Secure collaboration",
          "Activity tracking",
        ],
        image: "/images/industries/clinics/department-collaboration.jpg",
        theme: "peach",
        imageStyle: "curve",
      },
    ],
  
    everythingYouNeed: {
      title: "Everything You Need",
      subtitle: "Powerful features designed for your workflow",
      backgroundImage: "/images/industries/clinics/everything-bg.jpg",
      testimonialImage:
        "/images/industries/clinics/everything-testimonial.png",
      ratingImage: "/images/industries/clinics/everything-rating.png",
      features: [
        { label: "HIPAA Compliance", icon: "lock" },
        { label: "Encrypted Storage", icon: "activity" },
        { label: "Access Control", icon: "archive" },
        { label: "Retention Policies", icon: "share" },
        { label: "Secure Sharing", icon: "file-check" },
        { label: "Team Permissions", icon: "lock" },
      ],
    },
  
    bottomCta: {
      titleBefore: "",
      titleHighlight: "Protect",
      titleAfter: " Your Most Important Files",
      subtitle:
        "Keep patient records safe, organized, and easy to access whenever your team needs them.",
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
  
  export default clinics;