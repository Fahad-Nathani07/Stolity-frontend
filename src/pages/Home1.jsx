import React, { useEffect, useRef, useState } from "react";
import heroVideo from "../images/prelogin-img/hero-video.mp4";
import aboutGift from "../images/prelogin-img/about-gift.gif";
import upload from "../images/prelogin-img/upload-icon.svg";
import share from "../images/prelogin-img/share-icon.svg";
import privacy from "../images/prelogin-img/privacy-icon.svg";
import work from "../images/prelogin-img/work-icon.svg";
import card1 from "../images/prelogin-img/card-1.jpg";
import card2 from "../images/prelogin-img/card-2.jpg";
import card3 from "../images/prelogin-img/card-3.jpg";
import bannerImg from "../images/prelogin-img/banner-img.png";
import scanOne from "../images/prelogin-img/scanner-1.jpg";
import scanTwo from "../images/prelogin-img/scanner-2.jpg";
import LogoImg from "../images/prelogin-img/logo-stolity.svg";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setRedirectToPaymentAfterLogin } from "../store/subscriptionSlice";
import ScrollReveal from "../components/ScrollReveal";
import "./home1.css";

const MenuIcon = ({ open }) => (
  <span className={`h1-burger${open ? " is-open" : ""}`} aria-hidden="true">
    <span />
    <span />
    <span />
  </span>
);

const Home1 = () => {
  const videoRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNavigation = (e) => {
    e?.preventDefault?.();
    dispatch(setRedirectToPaymentAfterLogin(false));
    navigate("/Login");
  };

  const handlePlanGetStarted = (plan) => {
    dispatch(setRedirectToPaymentAfterLogin(Boolean(plan.isPremium)));
    navigate("/Login");
  };

  useEffect(() => {
    document.documentElement.classList.add("home1-active");
    document.body.classList.add("home1-active");
    return () => {
      document.documentElement.classList.remove("home1-active");
      document.body.classList.remove("home1-active");
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.replace("#", "");
    const timer = window.setTimeout(() => {
      const el = document.getElementById(id);
      if (!el) return;
      const headerOffset = 100;
      const top = el.getBoundingClientRect().top + window.scrollY - headerOffset;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    }, 100);
    return () => window.clearTimeout(timer);
  }, [location.hash]);

  const scrollToHash = (hash) => {
    const id = hash.replace(/^#/, "");
    const el = document.getElementById(id);
    if (!el) return;
    const headerOffset = 100;
    const top = el.getBoundingClientRect().top + window.scrollY - headerOffset;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  };

  const go = (to) => (e) => {
    e.preventDefault();
    setMenuOpen(false);
    if (to.includes("#")) {
      const [pathPart, hashPart] = to.split("#");
      const targetPath = pathPart || "/Home1";
      const hash = hashPart || "";
      if (location.pathname === targetPath) {
        scrollToHash(hash);
      } else {
        navigate({ pathname: targetPath, hash });
      }
      return;
    }
    navigate(to);
  };

  const handleFullScreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    } else if (videoRef.current.webkitRequestFullscreen) {
      videoRef.current.webkitRequestFullscreen();
    } else if (videoRef.current.msRequestFullscreen) {
      videoRef.current.msRequestFullscreen();
    }
  };

  const plans = [
    {
      name: "Free Plan",
      idealFor: "Casual users",
      price: "0.00",
      cycle: "/year",
      storage: "5 GB Storage",
      isPremium: false,
      boldPhrases: ["5 GB", "Upload/download", "File preview", "App Lock"],
      features: [
        "Upload/download & file management",
        "File preview & background upload",
        "Rename, create folders, move/copy files",
        "App Lock (Face ID/biometric)",
        "Up to 5 GB free storage",
        "Profile, avatar, theme & settings",
      ],
    },
    {
      name: "Lite Plan Monthly",
      idealFor: "Freelancers & individuals",
      price: "65.00",
      cycle: "/month",
      storage: "50 GB Storage",
      isPremium: true,
      boldPhrases: ["50 GB", "Pause/resume", "Permanent Link", "Unlimited"],
      features: [
        "Everything in Free, plus:",
        "Pause/resume uploads & auto-resume",
        "50 GB storage",
        "Add to Favorites",
        "Image conversion & compression",
        "Advanced search & filters",
        "Permanent link sharing",
        "ZIP/Unzip & link downloader (Unlimited)",
      ],
    },
    {
      name: "Lite Plan Yearly",
      idealFor: "Teams & small businesses",
      price: "780.00",
      cycle: "/year",
      storage: "50 GB Storage",
      discount: "Best value",
      isPremium: true,
      popular: true,
      boldPhrases: ["50 GB", "Pause/resume", "Permanent Link", "Unlimited"],
      features: [
        "Everything in Free, plus:",
        "Pause/resume uploads & auto-resume",
        "50 GB storage",
        "Add to Favorites",
        "Image conversion & compression",
        "Advanced search & filters",
        "Permanent link sharing",
        "ZIP/Unzip & link downloader (Unlimited)",
      ],
    },
  ];

  const navLinks = [
    { label: "Industries", to: "/Industries" },
    { label: "Pricing", to: "/Home1#pricing" },
  ];

  return (
    <div className="home1-page">
      <header className={menuOpen ? "h1-header is-menu-open" : "h1-header"}>
        <div className="h1-header-inner">
          <a href="/Home1" onClick={go("/Home1")} className="h1-logo-link">
            <img src={LogoImg} alt="Stolity" className="h1-logo" />
          </a>

          <div className="h1-header-actions">
            <nav
              id="home1-header-nav"
              className={`h1-nav${menuOpen ? " is-open" : ""}`}
              aria-label="Primary"
            >
              {navLinks.map((link) => (
                <a
                  key={`${link.to}-${link.label}`}
                  href={link.to}
                  className="h1-nav-link"
                  onClick={go(link.to)}
                >
                  {link.label}
                </a>
              ))}
              <div className="h1-nav-mobile-cta">
                <a
                  href="/Signup"
                  className="h1-btn-primary"
                  onClick={go("/Signup")}
                >
                  Get Started For Free
                </a>
              </div>
            </nav>

            <div className="h1-header-cta">
              <a href="/Login" className="h1-btn-login" onClick={go("/Login")}>
                Login
              </a>
              <a
                href="/Signup"
                className="h1-btn-primary"
                onClick={go("/Signup")}
              >
                Get Started For Free
              </a>
            </div>

            <button
              type="button"
              className={`h1-menu-toggle${menuOpen ? " is-open" : ""}`}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="home1-header-nav"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <MenuIcon open={menuOpen} />
            </button>
          </div>
        </div>
        <button
          type="button"
          className={`h1-menu-backdrop${menuOpen ? " is-visible" : ""}`}
          aria-label="Close menu"
          tabIndex={menuOpen ? 0 : -1}
          onClick={() => setMenuOpen(false)}
        />
      </header>

      <main>
        {/* Hero */}
        <section className="h1-hero">
          <div className="h1-hero-glow h1-hero-glow--tl" aria-hidden="true" />
          <div className="h1-hero-glow h1-hero-glow--br" aria-hidden="true" />
          <div className="h1-container">
            <div className="h1-hero-copy">
              <ScrollReveal as="p" className="h1-eyebrow" variant="fadeSoft" delay={0.05}>
                Upload. Organize. Share. Anytime, Anywhere.
              </ScrollReveal>
              <ScrollReveal as="h1" className="h1-hero-title" variant="rise" delay={0.12}>
                Effortless File Storage &{" "}
                <span>Secure Sharing</span> with Stolity
              </ScrollReveal>
              <ScrollReveal as="p" className="h1-lead" variant="fadeUp" delay={0.22}>
                Stolity is a powerful cloud-based file management platform that
                allows you to upload, organize, and share files seamlessly. With
                high-speed uploads up to 5 GB, advanced security features, and
                intuitive sharing options, managing files has never been this
                easy.
              </ScrollReveal>
              {/* <ScrollReveal className="h1-hero-actions" variant="fadeUp" delay={0.3}>
                <a
                  href="/Signup"
                  className="h1-btn-primary h1-btn-lg"
                  onClick={go("/Signup")}
                >
                  Start Up For Free Now
                  <i className="fa-solid fa-arrow-right" aria-hidden="true" />
                </a>
                <button
                  type="button"
                  className="h1-btn-ghost"
                  onClick={handleFullScreen}
                >
                  <span className="h1-play-icon" aria-hidden="true">
                    <i className="fa-solid fa-play" />
                  </span>
                  Watch Product Trial
                </button>
              </ScrollReveal> */}
              <ScrollReveal className="h1-feature-strip" variant="fadeSoft" delay={0.38}>
                <span>5 GB Free Storage</span>
                <span>Secure Sharing</span>
                <span>No Ads</span>
                <span>Web & Mobile</span>
              </ScrollReveal>
            </div>

            <ScrollReveal className="h1-hero-media" variant="fadeSoft" delay={0.4}>
              <div className="h1-browser">
                <div className="h1-browser-chrome" aria-hidden="true">
                  <span className="h1-dot h1-dot--red" />
                  <span className="h1-dot h1-dot--amber" />
                  <span className="h1-dot h1-dot--green" />
                  <span className="h1-browser-label">Stolity Preview</span>
                </div>
                <div className="h1-browser-frame">
                  <video
                    ref={videoRef}
                    src={heroVideo}
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                </div>
                <button
                  type="button"
                  className="h1-fullscreen-btn"
                  onClick={handleFullScreen}
                  aria-label="Enter full screen"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M8 3H5a2 2 0 0 0-2 2v3" />
                    <path d="M16 3h3a2 2 0 0 1 2 2v3" />
                    <path d="M8 21H5a2 2 0 0 1-2-2v-3" />
                    <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
                  </svg>
                  Full Screen
                </button>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Intro */}
        <section className="h1-section h1-intro">
          <div className="h1-container">
            <div className="h1-intro-grid">
              <ScrollReveal className="h1-intro-left" variant="fadeUp" duration={0.9}>
                <p className="h1-eyebrow">Effortless File Management</p>
                <h2 className="h1-section-title">
                  Your{" "}
                  <span>
                    Smartest File
                    <br />
                    Management
                  </span>{" "}
                  Companion
                </h2>
              </ScrollReveal>
              <ScrollReveal className="h1-intro-right" variant="fadeUp" delay={0.1} duration={0.9}>
                <p className="h1-body">
                  <b>Imagine this</b>: You’re working on an important project,
                  juggling multiple files across different devices. You need a
                  secure, seamless, and intuitive way to manage, share, and
                  access your files. That’s where Stolity comes in.
                </p>
                <p className="h1-body">
                  With Stolity, <b>your files move as fast as your ideas—</b>
                  effortlessly uploaded, neatly organized, and instantly
                  accessible from anywhere.
                </p>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* About / features */}
        <section className="h1-section h1-about">
          <div className="h1-container">
            <div className="h1-about-grid">
              <div className="h1-about-visual">
                <div className="h1-about-visual-card">
                  <img src={aboutGift} alt="About Gift" />
                </div>
              </div>
              <div className="h1-about-cards">
                {[
                  {
                    icon: upload,
                    alt: "upload",
                    title: "Upload Without Limits",
                    text: "No more waiting. Stolity lets you upload files up to 5 GB in seconds, even while multitasking.",
                  },
                  {
                    icon: share,
                    alt: "share",
                    title: "Share with Confidence",
                    text: "Generate short links, QR codes, or email invitations—all with custom access settings.",
                  },
                  {
                    icon: privacy,
                    alt: "privacy",
                    title: "Your Privacy, Our Priority",
                    text: "Password-protect sensitive files, set expiration dates, and track access logs—all in one secure dashboard.",
                  },
                  {
                    icon: work,
                    alt: "work anywhere",
                    title: "Work from Anywhere",
                    text: "Whether on your desktop, tablet, or phone, Stolity keeps your workflow uninterrupted.",
                  },
                ].map((item) => (
                  <div key={item.title} className="h1-feature-card">
                    <div className="h1-feature-icon">
                      <img src={item.icon} alt={item.alt} />
                    </div>
                    <h4>{item.title}</h4>
                    <p>{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* UX cards */}
        <section className="h1-section h1-ux">
          <div className="h1-container">
            <ScrollReveal className="h1-section-head" variant="fadeUp">
              <p className="h1-eyebrow">An Experience Built for Everyone</p>
              <h2 className="h1-section-title">
                Designed for{" "}
                <span>
                  Accessibility &amp;
                  <br />
                  User Experience
                </span>
              </h2>
            </ScrollReveal>

            <div className="h1-ux-grid">
              {[
                {
                  img: card1,
                  alt: "Light and dark mode",
                  title: "Light & Dark Mode",
                  text: "Customize your experience for optimal comfort. Because your workspace should adjust to you, not the other way around.",
                },
                {
                  img: card2,
                  alt: "Microinteractions",
                  title: "Microinteractions that Make a Difference",
                  text: "Thoughtfully designed animations enhance usability. Every click, hover, and transition is designed to be smooth and intuitive.",
                },
                {
                  img: card3,
                  alt: "Web and mobile access",
                  title: "Available on Both Web & Mobile",
                  text: "Seamless experience across all devices. So you can manage your files anywhere, anytime.",
                },
              ].map((item, index) => (
                <ScrollReveal
                  key={item.title}
                  className="h1-ux-card"
                  variant="rise"
                  delay={0.08 + index * 0.1}
                >
                  <div className="h1-ux-media">
                    <img src={item.img} alt={item.alt} />
                  </div>
                  <div className="h1-ux-body">
                    <h5>{item.title}</h5>
                    <p>{item.text}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="h1-section h1-pricing">
          <div className="h1-container">
            <ScrollReveal className="h1-section-head" variant="fadeUp">
              <p className="h1-eyebrow">Our Portable Pricing System</p>
              <h2 className="h1-section-title">
                Here is our <span>Pricing Plan</span>
              </h2>
            </ScrollReveal>

            <div className="h1-pricing-grid">
              {plans.map((plan, index) => (
                <ScrollReveal
                  key={plan.name}
                  className="h1-price-card-reveal"
                  variant="rise"
                  delay={0.1 + index * 0.1}
                >
                  <article
                    className={`h1-price-card${plan.popular ? " is-popular" : ""}`}
                  >
                    <div className="h1-price-head">
                      <span className="h1-price-plan-tag">{plan.name}</span>
                      {plan.discount && (
                        <span className="h1-price-badge">{plan.discount}</span>
                      )}
                    </div>
                    <p className="h1-price-ideal">
                      Ideal For: <strong>{plan.idealFor}</strong>
                    </p>
                    <div className="h1-price-amount">
                      <strong>₹{plan.price}</strong>
                      <span>{plan.cycle}</span>
                    </div>
                    <p className="h1-price-storage">
                      <i className="fa-solid fa-database" aria-hidden="true" />
                      {plan.storage}
                    </p>
                    <ul className="h1-price-features">
                      {plan.features.map((feature, i) => {
                        let highlighted = feature;
                        (plan.boldPhrases || []).forEach((phrase) => {
                          const regex = new RegExp(`(${phrase})`, "gi");
                          highlighted = highlighted.replace(
                            regex,
                            `<span>$1</span>`
                          );
                        });
                        return (
                          <li
                            key={i}
                            dangerouslySetInnerHTML={{ __html: highlighted }}
                          />
                        );
                      })}
                    </ul>
                    <button
                      type="button"
                      className="h1-price-cta"
                      onClick={() => handlePlanGetStarted(plan)}
                    >
                      Get Started For Free
                    </button>
                  </article>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Banner */}
        <section className="h1-section h1-banner">
          <div className="h1-container">
            <div className="h1-banner-panel">
              <ScrollReveal className="h1-banner-left" variant="fadeUp">
                <h2 className="h1-section-title">
                  <span>Seamless Productivity</span>
                  <br />
                  with Stolity
                </h2>
                <p className="h1-body">
                  No more clutter. No more chaos. <br />Just pure efficiency at your
                  fingertips.
                </p>
                <p className="h1-body">
                  We are available on both the App Store and Play Store.
                </p>
                <a
                  href="#"
                  className="h1-btn-primary h1-btn-lg"
                  onClick={handleNavigation}
                >
                  Start Organizing Smarter
                  <i className="fa-solid fa-arrow-right" aria-hidden="true" />
                </a>

                <div className="h1-stores">
                  <div className="h1-store">
                    <div className="h1-qr">
                      <img src={scanOne} alt="Google Play QR code" />
                      <p>
                        Scan to Download
                        <br />
                        from Google Play
                      </p>
                    </div>
                    <a
                      href="https://play.google.com/store/apps/details?id=com.stolity.infomanav.com&pcampaignid=web_share"
                      className="h1-store-btn"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <i className="fa-brands fa-google-play" />
                      Get App on Play Store
                    </a>
                  </div>
                  <div className="h1-store">
                    <div className="h1-qr">
                      <img src={scanTwo} alt="App Store QR code" />
                      <p>
                        Scan to Download
                        <br />
                        from App Store
                      </p>
                    </div>
                    <a
                      href="https://apps.apple.com/in/app/stolity/id6737306442"
                      className="h1-store-btn"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <i className="fa-brands fa-apple" />
                      Get App on App Store
                    </a>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal
                className="h1-banner-right"
                variant="fadeUp"
                delay={0.12}
              >
                <img
                  src={bannerImg}
                  alt="Stolity mobile app preview"
                  className="h1-banner-phones"
                />
              </ScrollReveal>
            </div>
          </div>
        </section>
      </main>

      <footer className="h1-footer">
        <div className="h1-container h1-footer-inner">
          <p>© 2026 Stolity. All rights reserved.</p>
          <ul>
            <li>
              <a href="/terms-and-conditions">Terms of Service</a>
            </li>
            <li>
              <a href="/privacy-policy">Privacy Policy</a>
            </li>
            <li>
              <a href="/privacy-policy">Cookies</a>
            </li>
          </ul>
        </div>
      </footer>
    </div>
  );
};

export default Home1;
