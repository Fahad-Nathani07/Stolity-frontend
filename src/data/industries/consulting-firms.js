const consultingFirms = {
    slug: "consulting",
    category: "Business Services",
  
    listing: {
      title: "Consulting",
      description:
        "Collaborate on client projects with secure file sharing and version control.",
    },
  
    badgeLabel: "Consulting Firms",
    badgeIcon: "file-check",
    titleBefore: "#1 File Workspace ",
    titleHighlight: "Consulting Firms",
    paragraphs: [
      "For consulting teams managing client projects, deliverables, research, and presentations.",
      "Collaborate seamlessly on client engagements with secure file sharing and project organization.",
    ],
    heroImage: "/images/industries/consulting-firms/hero.png",
    ctaPrimary: { label: "Get Started", action: "login" },
    ctaSecondary: { label: "Book Demo", action: "demo" },
  
    whyChoose: {
      title: "Why Consulting Choose Stolity",
      subtitle: "Built specifically for your industry workflows",
      backgroundImage:
        "/images/industries/consulting-firms/why-choose-bg.jpg",
      cards: [
        { label: "Client Project Organization and Tracking", icon: "lock" },
        { label: "Secure Deliverable Sharing and Collaboration", icon: "search-file" },
        { label: "Research and Presentation Management", icon: "users" },
        { label: "Team Knowledge Sharing", icon: "cloud-upload" },
        { label: "Engagement Archive Protection", icon: "cabinet" },
      ],
    },
  
    featureSections: [
      {
        id: "project-management",
        title: "Project Management",
        description:
          "Organize client engagements, proposals, deliverables, and presentations with project-based folder structures.",
        items: [
          "Project workspace organization",
          "Client engagement tracking",
          "Deliverable management",
          "Proposal storage",
        ],
        image: "/images/industries/consulting-firms/document-management.jpg",
        theme: "pink",
        imageStyle: "curve",
      },
      {
        id: "client-collaboration",
        title: "Client Collaboration",
        description:
          "Share files with clients, collect feedback, and manage approvals throughout the engagement lifecycle.",
        items: [
          "Client file sharing",
          "Feedback collection",
          "Approval workflows",
          "Secure client portals",
        ],
        image: "/images/industries/shared/hipaa-compliance.png",
        theme: "peach",
        imageStyle: "illustration",
      },
      {
        id: "team-knowledge-base",
        title: "Team Knowledge Base",
        description:
          "Build a shared repository of research, frameworks, and best practices accessible to your entire team.",
        items: [
          "Knowledge repository",
          "Framework library",
          "Research archive",
          "Team collaboration",
        ],
        image:
          "/images/industries/consulting-firms/department-collaboration.jpg",
        theme: "peach",
        imageStyle: "curve",
      },
    ],
  
    everythingYouNeed: {
      title: "Everything You Need",
      subtitle: "Powerful features designed for your workflow",
      backgroundImage:
        "/images/industries/consulting-firms/everything-bg.jpg",
      testimonialImage:
        "/images/industries/consulting-firms/everything-testimonial.png",
      ratingImage:
        "/images/industries/consulting-firms/everything-rating.png",
      features: [
        { label: "File Versioning", icon: "lock" },
        { label: "Client Sharing", icon: "activity" },
        { label: "Team Workspaces", icon: "archive" },
        { label: "Access Logs", icon: "share" },
        { label: "Folder Management", icon: "file-check" },
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
  
  export default consultingFirms;