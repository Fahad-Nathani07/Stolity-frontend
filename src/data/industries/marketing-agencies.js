/**
 * Marketing Agencies — detail page data for /Industries/marketing-agencies
 *
 * Images: public/images/industries/marketing-agencies/
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

const marketingAgencies = {
    slug: "marketing-agencies",
    category: "Business Services",
  
    listing: {
      title: "Marketing Agencies",
      description:
        "Store and share creative assets, campaigns, and client deliverables seamlessly.",
    },
  
    badgeLabel: "Marketing Agencies",
    badgeIcon: "file-check",
    titleBefore: "#1 File Workspace ",
    titleHighlight: "Marketing Agencies",
    paragraphs: [
      "For marketing teams managing creative assets, campaigns, client files, and deliverables.",
      "Collaborate on campaigns, organize assets, and deliver work faster with your team.",
    ],
    heroImage: "/images/industries/marketing-agencies/hero.png",
    ctaPrimary: { label: "Get Started", action: "login" },
    ctaSecondary: { label: "Book Demo", action: "demo" },
  
    whyChoose: {
      title: "Why Marketing Agencies Choose Stolity",
      subtitle: "Built specifically for your industry workflows",
      backgroundImage:
        "/images/industries/marketing-agencies/why-choose-bg.jpg",
      cards: [
        { label: "Centralized Creative Asset Management", icon: "lock" },
        { label: "Fast File Sharing with Clients", icon: "search-file" },
        { label: "Campaign Organization and Tracking", icon: "users" },
        { label: "Version Control for Creative Work", icon: "cloud-upload" },
        { label: "Team Collaboration Tools", icon: "cabinet" },
      ],
    },
  
    featureSections: [
      {
        id: "creative-asset-management",
        title: "Creative Asset Management",
        description:
          "Organize logos, graphics, videos, and creative files with smart tagging and powerful search.",
        items: [
          "Asset library management",
          "Personnel record management",
          "Visual file preview",
          "Brand asset organization",
        ],
        image:
          "/images/industries/marketing-agencies/patient-record-management.jpg",
        theme: "pink",
        imageStyle: "curve",
      },
      {
        id: "client-collaboration",
        title: "Client Collaboration",
        description:
          "Share campaign files with clients, collect feedback, and manage approvals in one place.",
        items: [
          "Client file sharing",
          "Feedback collection",
          "Approval workflows",
          "Client portals",
        ],
        image: "/images/industries/hospitals/hipaa-compliance.png",
        theme: "peach",
        imageStyle: "illustration",
      },
      {
        id: "campaign-management",
        title: "Campaign Management",
        description:
          "Keep all campaign assets, briefs, and deliverables organized by project and client.",
        items: [
          "Campaign folders",
          "Project workspaces",
          "Deliverable tracking",
          "Team collaboration",
        ],
        image:
          "/images/industries/marketing-agencies/department-collaboration.jpg",
        theme: "peach",
        imageStyle: "curve",
      },
    ],
  
    everythingYouNeed: {
      title: "Everything You Need",
      subtitle: "Powerful features designed for your workflow",
      backgroundImage:
        "/images/industries/marketing-agencies/everything-bg.jpg",
      testimonialImage:
        "/images/industries/marketing-agencies/everything-testimonial.png",
      ratingImage:
        "/images/industries/marketing-agencies/everything-rating.png",
      features: [
        { label: "Large File Support", icon: "lock" },
        { label: "Visual Preview", icon: "activity" },
        { label: "Version Control", icon: "archive" },
        { label: "Client Sharing", icon: "share" },
        { label: "Team Workspaces", icon: "file-check" },
        { label: "Smart Search", icon: "lock" },
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
  
  export default marketingAgencies;