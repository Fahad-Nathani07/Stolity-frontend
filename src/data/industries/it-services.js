/**
 * IT Services — detail page data for /Industries/it-services
 *
 * Images: public/images/industries/it-services/
 *   hero.png
 *   why-choose-bg.jpg
 *   patient-record-management.jpg
 *   department-collaboration.jpg
 *   everything-bg.jpg
 *   everything-testimonial.png
 *   everything-rating.png
 *
 * Reuses:
 *   /images/industries/hospitals/hipaa-compliance.png
 */

const itServices = {
    slug: "it-services",
    category: "Business Services",
  
    listing: {
      title: "IT Services",
      description:
        "Manage technical documentation, system backups, and client infrastructure files securely.",
    },
  
    badgeLabel: "IT Services",
    badgeIcon: "file-check",
    titleBefore: "#1 File Workspace ",
    titleHighlight: "IT Services",
    paragraphs: [
      "For IT teams managing technical documentation, system configurations, client backups, and infrastructure files.",
      "Centralize your IT documentation and protect critical system files with enterprise-grade security.",
    ],
    heroImage: "/images/industries/it-services/hero.png",
    ctaPrimary: { label: "Get Started", action: "login" },
    ctaSecondary: { label: "Book Demo", action: "demo" },
  
    whyChoose: {
      title: "Why IT Services Choose Stolity",
      subtitle: "Built specifically for your industry workflows",
      backgroundImage: "/images/industries/it-services/why-choose-bg.jpg",
      cards: [
        { label: "Centralized Technical Documentation", icon: "lock" },
        { label: "System Backup & Configuration Management", icon: "search-file" },
        { label: "Disaster Recovery File Protection", icon: "users" },
        { label: "Secure Client Infrastructure File Storage", icon: "cloud-upload" },
        { label: "Team Knowledge Base and Runbooks", icon: "cabinet" },
      ],
    },
  
    featureSections: [
      {
        id: "technical-documentation",
        title: "Technical Documentation",
        description:
          "Organize system documentation, runbooks, configuration files, and technical guides with powerful search.",
        items: [
          "Documentation library",
          "Knowledge base organization",
          "Configuration file management",
          "Quick search access",
        ],
        // image: "/images/industries/it-services/patient-record-management.jpg",
        image: "/images/industries/it-services/document-management.jpg",
        theme: "pink",
        imageStyle: "curve",
      },
      {
        id: "client-infrastructure-management",
        title: "Client Infrastructure Management",
        description:
          "Securely store client system backups, network diagrams, and infrastructure documentation with access controls.",
        items: [
          "Client file isolation",
          "Backup storage",
          "Network documentation",
          "Access control policies",
        ],
        image: "/images/industries/hospitals/hipaa-compliance.png",
        theme: "peach",
        imageStyle: "illustration",
      },
      {
        id: "team-collaboration",
        title: "Team Collaboration",
        description:
          "Share technical files with your IT team, track changes, and maintain accurate version history.",
        items: [
          "Team file sharing",
          "Change tracking",
          "Version control",
          "Collaboration tools",
        ],
        image: "/images/industries/it-services/department-collaboration.jpg",
        theme: "peach",
        imageStyle: "curve",
      },
    ],
  
    everythingYouNeed: {
      title: "Everything You Need",
      subtitle: "Powerful features designed for your workflow",
      backgroundImage: "/images/industries/it-services/everything-bg.jpg",
      testimonialImage:
        "/images/industries/it-services/everything-testimonial.png",
      ratingImage: "/images/industries/it-services/everything-rating.png",
      features: [
        { label: "Large File Support", icon: "lock" },
        { label: "Version History", icon: "activity" },
        { label: "Secure Sharing", icon: "archive" },
        { label: "Team Permissions", icon: "share" },
        { label: "Admin Controls", icon: "file-check" },
        { label: "Archive Retention", icon: "lock" },
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
  
  export default itServices;