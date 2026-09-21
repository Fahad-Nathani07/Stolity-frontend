/**
 * Hospitals — detail page data for /Industries/hospitals
 *
 * Images: public/images/industries/hospitals/
 *   hero.png
 *   why-choose-bg.jpg
 *   why-card-1.png … why-card-5.png
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
      {
        label: "Why card 1",
        image: "/images/industries/hospitals/why-card-1.png",
      },
      {
        label: "Why card 2",
        image: "/images/industries/hospitals/why-card-2.png",
      },
      {
        label: "Why card 3",
        image: "/images/industries/hospitals/why-card-3.png",
      },
      {
        label: "Why card 4",
        image: "/images/industries/hospitals/why-card-4.png",
      },
      {
        label: "Why card 5",
        image: "/images/industries/hospitals/why-card-5.png",
      },
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
      {
        label: "Black Hole Vault",
        image: "/images/industries/hospitals/everything-feature-1.png",
      },
      {
        label: "Access Control",
        image: "/images/industries/hospitals/everything-feature-2.png",
      },
      {
        label: "Time-Limited Sharing",
        image: "/images/industries/hospitals/everything-feature-3.png",
      },
      {
        label: "File Compression",
        image: "/images/industries/hospitals/everything-feature-4.png",
      },
      {
        label: "Secure Links",
        image: "/images/industries/hospitals/everything-feature-5.png",
      },
      {
        label: "ZIP & UnZIP Files",
        image: "/images/industries/hospitals/everything-feature-6.png",
      },
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
