/**
 * Hospitals — detail page data for /Industries/hospitals
 *
 * Images: public/images/industries/hospitals/
 *   hero.png
 *   why-choose-bg.jpg
 *   (why cards are coded — only `label` / `icon` in data)
 *   patient-record-management.jpg
 *   hipaa-compliance.png
 *   department-collaboration.jpg
 *   everything-bg.jpg
 */
const hospitals = {
  slug: "hospitals",
  category: "Healthcare",

  listing: {
    title: "Hospitals",
    description:
      "Protect medical records with enterprise-grade retention workflows and compliance.",
  },

  badgeLabel: "Hospitals",
  badgeIcon: "heart",
  titleBefore: "Secure File Management for ",
  titleHighlight: "Hospitals",
  paragraphs: [
    "Keep patient records, medical reports, scans, and hospital documents safe, organized, and easy to share with the right people.",
    "Built for hospitals managing sensitive healthcare information, with immutable archives, role-based access, and HIPAA-ready workflows.",
  ],
  heroImage: "/images/industries/hospitals/hero.png",
  ctaPrimary: { label: "Get Started", action: "login" },
  ctaSecondary: { label: "Book Demo", action: "demo" },

  whyChoose: {
    title: "Why Hospitals Choose Stolity",
    subtitle: "Built specifically for your industry workflows",
    backgroundImage: "/images/industries/hospitals/why-choose-bg.jpg",
    cards: [
      { label: "Protect Patient Records", icon: "lock" },
      { label: "Control File Access", icon: "search-file" },
      { label: "Share Files Securely", icon: "users" },
      { label: "Work Together Easily", icon: "cloud-upload" },
      { label: "Keep Medical Data Private", icon: "cabinet" },
    ],
  },

  featureSections: [
    {
      id: "patient-record-management",
      title: "Patient Record Management",
      description: "Store all patient documents in one secure place.",
      items: [
        "Electronic health records",
        "Medical imaging storage",
        "Treatment documentation",
        "Patient history tracking",
      ],
      image: "/images/industries/hospitals/patient-record-management.jpg",
      theme: "pink",
      imageStyle: "curve",
    },
    {
      id: "hipaa-compliance",
      title: "HIPAA Compliance & Security",
      description: "Protect sensitive patient information with built-in security.",
      items: [
        "Safe archive for important records",
        "Secure storage",
        "Private file sharing",
        "User access control",
      ],
      image: "/images/industries/hospitals/hipaa-compliance.png",
      theme: "peach",
      imageStyle: "illustration",
    },
    {
      id: "department-collaboration",
      title: "Department Collaboration",
      description: "Share files securely across your hospital.",
      items: [
        "Hospital administration",
        "Role-based access",
        "Doctor to specialist",
        "Nursing staff",
      ],
      image: "/images/industries/hospitals/department-collaboration.jpg",
      theme: "peach",
      imageStyle: "curve",
    },
  ],

  everythingYouNeed: {
    title: "Everything You Need",
    subtitle: "Powerful features designed for your workflow",
    backgroundImage: "/images/industries/hospitals/everything-bg.jpg",
    testimonialImage: "/images/industries/hospitals/everything-testimonial.png",
    ratingImage: "/images/industries/hospitals/everything-rating.png",
    features: [
      { label: "Black Hole Vault", icon: "lock" },
      { label: "Encrypted Storage", icon: "lock" },
      { label: "Access Control", icon: "activity" },
      { label: "File Compression", icon: "archive" },
      { label: "Secure Links", icon: "share" },
      { label: "ZIP & UnZIP Files", icon: "file-check" },
    ],
  },

  bottomCta: {
    titleBefore: "",
    titleHighlight: "Protect",
    titleAfter: " Your Hospital Files",
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

export default hospitals;
