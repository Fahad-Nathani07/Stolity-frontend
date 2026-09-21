/**
 * Law Firms — detail page data for /Industries/law-firms
 *
 * Images: public/images/industries/law-firms/
 *   hero.png
 *   why-choose-bg.jpg
 *   why-card-1.png … why-card-5.png
 *   document-management.jpg
 *   vault-protection.png
 *   team-collaboration.jpg
 *   everything-bg.jpg
 */
const lawFirms = {
  slug: "law-firms",
  category: "Business Services",

  // Listing card (Industries page)
  listing: {
    title: "Law Firms",
    description:
      "Securely manage contracts, legal evidence, and client documents with Blackhole Vault protection.",
  },

  // Detail page
  badgeLabel: "Law Firms",
  badgeIcon: "heart",
  titleBefore: "Secure File Management for ",
  titleHighlight: "Law Firms",
  paragraphs: [
    "Keep case files, client documents, contracts, and legal evidence safe, organized, and easy to access.",
    "Protect confidential legal documents, control who can access them, and securely share files with your team and clients.",
  ],
  heroImage: "/images/industries/law-firms/hero.png",
  ctaPrimary: { label: "Get Started", action: "login" },
  ctaSecondary: { label: "Book Demo", action: "demo" },

  whyChoose: {
    title: "Why Law Firms Choose Stolity",
    subtitle: "Built specifically for your industry workflows",
    backgroundImage: "/images/industries/law-firms/why-choose-bg.jpg",
    cards: [
      {
        label: "Protect Important Case Files",
        image: "/images/industries/law-firms/why-card-1.png",
      },
      {
        label: "Control File Access",
        image: "/images/industries/law-firms/why-card-2.png",
      },
      {
        label: "Share Files Securely",
        image: "/images/industries/law-firms/why-card-3.png",
      },
      {
        label: "Work Together Easily",
        image: "/images/industries/law-firms/why-card-4.png",
      },
      {
        label: "Keep Client Information Private",
        image: "/images/industries/law-firms/why-card-5.png",
      },
    ],
  },

  featureSections: [
    {
      id: "document-management",
      title: "Secure Document Management",
      description: "Keep all legal documents organized in one secure workspace.",
      items: [
        "Case files",
        "Client documents",
        "Court documents",
        "Legal evidence",
      ],
      image: "/images/industries/law-firms/document-management.jpg",
      theme: "pink",
      imageStyle: "curve",
    },
    {
      id: "vault-protection",
      title: "Blackhole Vault Protection",
      description: "Protect your most important legal documents.",
      items: [
        "Files cannot be deleted accidentally",
        "Only authorized admins can manage archived files",
        "Keep evidence safe for years",
        "View complete activity history",
      ],
      image: "/images/industries/law-firms/vault-protection.png",
      theme: "peach",
      imageStyle: "illustration",
    },
    {
      id: "team-collaboration",
      title: "Team Collaboration",
      description: "Work securely with your legal team.",
      items: [
        "Secure file sharing",
        "Time-limited sharing",
        "Team permissions",
        "Real-time activity tracking",
      ],
      image: "/images/industries/law-firms/team-collaboration.jpg",
      theme: "peach",
      imageStyle: "curve",
    },
  ],

  everythingYouNeed: {
    title: "Everything You Need",
    subtitle: "Powerful features designed for your workflow",
    backgroundImage: "/images/industries/law-firms/everything-bg.jpg",
    testimonialImage: "/images/industries/law-firms/everything-testimonial.png",
    ratingImage: "/images/industries/law-firms/everything-rating.png",
    features: [
      {
        label: "Black Hole Vault",
        image: "/images/industries/law-firms/everything-feature-1.png",
      },
      {
        label: "Access Control",
        image: "/images/industries/law-firms/everything-feature-2.png",
      },
      {
        label: "Time-Limited Sharing",
        image: "/images/industries/law-firms/everything-feature-3.png",
      },
      {
        label: "File Compression",
        image: "/images/industries/law-firms/everything-feature-4.png",
      },
      {
        label: "Secure Links",
        image: "/images/industries/law-firms/everything-feature-5.png",
      },
      {
        label: "ZIP & UnZIP Files",
        image: "/images/industries/law-firms/everything-feature-6.png",
      },
    ],
  },

  bottomCta: {
    titleBefore: "",
    titleHighlight: "Protect",
    titleAfter: " Your Legal Documents",
    subtitle:
      "Keep case files secure, organized, and accessible whenever your team needs them.",
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

export default lawFirms;
