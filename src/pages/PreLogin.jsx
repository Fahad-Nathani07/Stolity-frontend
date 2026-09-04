import React, { useEffect, useRef } from "react";
import LogoImg from "../images/prelogin-img/logo-stolity.svg";
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
import full from "../images/prelogin-img/full.svg";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import AOS from "aos";
import "aos/dist/aos.css";
import '../pages/prelogin.css'
import { setRedirectToPaymentAfterLogin } from "../store/subscriptionSlice";

const PreLogin = () => {
  const videoRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Login Navigation
  const handleNavigation = (e) => {
    e?.preventDefault?.();
    dispatch(setRedirectToPaymentAfterLogin(false));
    navigate("/Login");
  };

  const handlePlanGetStarted = (plan) => {
    dispatch(setRedirectToPaymentAfterLogin(Boolean(plan.isPremium)));
    navigate("/Login");
  };

  // Animatiom
  useEffect(() => {
    AOS.init({
      duration: 1000,
      offset: 100,
      easing: "ease-in-out",
      once: true,
    });
  }, []);

  // Card Scrolling
  const cardContainerRef = useRef(null);

  useEffect(() => {
    const debounceScroll = (func, delay) => {
      let timeout;
      return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), delay);
      };
    };
  
    const handleScroll = debounceScroll(() => {
      const container = cardContainerRef.current;
      if (!container) return;
  
      const sectionTop = container.offsetTop;
      const sectionHeight = container.offsetHeight;
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
  
      const progress =
        (scrollPosition - sectionTop + windowHeight * 0.5) / sectionHeight;
  
      if (progress >= 0 && progress <= 1) {
        const maxScroll = container.scrollHeight - container.clientHeight;
        const easedProgress = Math.pow(progress, 1.3);
        container.scrollTop = easedProgress * maxScroll * 2.5; // Reduced multiplier
        
      }
    }, 50); // 50ms delay
  
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Full Screen Video
  const handleFullScreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      } else if (videoRef.current.webkitRequestFullscreen) {
        // Safari
        videoRef.current.webkitRequestFullscreen();
      } else if (videoRef.current.msRequestFullscreen) {
        // IE/Edge
        videoRef.current.msRequestFullscreen();
      }
    }
  };

  // Matches /Payment plans (Free, Lite Monthly, Lite Yearly)
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

  return (
    <div className="prelogin-page">
      <header data-aos="zoom-out">
        <div className="header-content content">
          <a href="/" onClick={(e) => e.preventDefault()}>
            <img src={LogoImg} alt="Stolity" className="img-fluid" />
          </a>

          <div className="header-btns">
            <a href="#" className="get-start-btn" onClick={handleNavigation}>
              Get Started
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="hero-img" data-aos="zoom-out" style={{paddingBottom:"100px"}}>
          <div className="content">
            <div className="hero-content">
              <h5>Upload. Organize. Share. Anytime, Anywhere.</h5>
              <h1>
                Effortless File Storage & Secure <br />
                Sharing with Stolity
              </h1>
              <p className="pre-para">
                Stolity is a powerful cloud-based file management platform that
                allows you to upload, organize, and share files seamlessly. With
                high-speed uploads up to 5 GB, advanced security features, and
                intuitive sharing options, managing files has never been this
                easy.
              </p>
            </div>

            {/* -- video -- */}
            <div className="hero-video">
              <video
                ref={videoRef}
                src={heroVideo}
                autoPlay
                loop
                muted
                playsInline
              ></video>
              <div className="full-screen-content">
                <h6>
                  <b>Full Screen Mode</b>
                </h6>
                <img
                  src={full}
                  alt="Enter full screen"
                  className="fullscreen-btn"
                  role="button"
                  tabIndex={0}
                  onClick={handleFullScreen}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleFullScreen();
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* --- Intro Section --- */}
        <section data-aos="zoom-in"  style={{paddingBottom:"100px"}}>
          <div className="content">
            <div className="row">
              <div className="left-intro col-12 col-lg-6">
                <p className="pre-para semibold">Effortless File Management</p>
                <h2>
                  Your{" "}
                  <span>
                    Smartest File <br />
                    Management
                  </span>
                  <br />
                  Companion
                </h2>
              </div>

              <div className="right-intro col-12 col-lg-6">
                <p className="pre-para">
                  <b>Imagine this</b>: You’re working on an important project,
                  juggling multiple files across different devices. You need a
                  secure, seamless, and intuitive way to manage, share, and
                  access your files. That’s where Stolity comes in.
                  <br />
                  <br />
                  With Stolity, <b>your files move as fast as your ideas—</b>
                  effortlessly uploaded, neatly organized, and instantly
                  accessible from anywhere.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* --- About Section --- */}
        <section style={{paddingBottom:"100px"}}>
          <div className="content">
            <div className="row">
              <div className="about-left col-12 col-lg-6">
                <img src={aboutGift} alt="About Gift" />
              </div>

              <div
                className="about-right col-12 col-lg-6"
                ref={cardContainerRef}
              >
                <div className="about-card-container">
                  <div className="about-card">
                    <img src={upload} alt="upload" className="img-fluid" />
                    <h4>Upload Without Limits</h4>
                    <p>
                      No more waiting. Stolity lets you upload files up to 5 GB
                      in seconds, even while multitasking.
                    </p>
                  </div>

                  <div className="about-card mt-4">
                    <img src={share} alt="share" className="img-fluid" />
                    <h4>Share with Confidence</h4>
                    <p>
                      Generate short links, QR codes, or email invitations—all
                      with custom access settings.
                    </p>
                  </div>

                  <div className="about-card mt-4">
                    <img src={privacy} alt="privacy" className="img-fluid" />
                    <h4>Your Privacy, Our Priority</h4>
                    <p>
                      Password-protect sensitive files, set expiration dates,
                      and track access logs—all in one secure dashboard.
                    </p>
                  </div>

                  <div className="about-card mt-4">
                    <img src={work} alt="work anywhere" className="img-fluid" />
                    <h4>Work from Anywhere</h4>
                    <p>
                      Whether on your desktop, tablet, or phone, Stolity keeps
                      your workflow uninterrupted.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- Services Card Section --- */}
        <section data-aos="zoom-in" style={{paddingBottom:"100px"}}>
          <div className="content">
            <div className="card-heading">
              <p className="pre-para semibold">
                An Experience Built for Everyone
              </p>
              <h2>
                Designed for{" "}
                <span>
                  Accessibility & <br />
                  User Experience
                </span>
              </h2>
            </div>

            <div className="row">
              <div className="services-card col-12 col-lg-4">
                <div className="card">
                  <img src={card1} className="card-img-top" alt="Light and dark mode" />
                  <div className="card-body">
                    <h5 className="card-title">Light & Dark Mode</h5>
                    <p className="card-text">
                      Customize your experience for optimal comfort. Because
                      your workspace should adjust to you, not the other way
                      around.
                    </p>
                  </div>
                </div>
              </div>

              <div className="services-card col-12 col-lg-4">
                <div className="card">
                  <img src={card2} className="card-img-top" alt="Microinteractions" />
                  <div className="card-body">
                    <h5 className="card-title">
                      Microinteractions that Make a Difference
                    </h5>
                    <p className="card-text">
                      Thoughtfully designed animations enhance usability. Every
                      click, hover, and transition is designed to be smooth and
                      intuitive.
                    </p>
                  </div>
                </div>
              </div>

              <div className="services-card col-12 col-lg-4">
                <div className="card">
                  <img src={card3} className="card-img-top" alt="Web and mobile access" />
                  <div className="card-body">
                    <h5 className="card-title">Available on Both Web & Mobile</h5>
                    <p className="card-text">
                      Seamless experience across all devices. So you can manage
                      your files anywhere, anytime.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- Offers Card Section --- */}
        <section data-aos="zoom-in" style={{paddingBottom:"100px"}}>
          <div className="content">
            <div className="card-heading">
              <p className="pre-para semibold">Our Portable Pricing System</p>
              <h2>
                Here is our <span>Pricing Plan</span>
              </h2>
            </div>

            <div className="row g-4" data-aos="zoom-in">
              {plans.map((plan, index) => (
                <div key={index} className="offer-card-container col-lg-4">
                  <div className="offer-card">
                    <div className="offer-card-head">
                      <h4 className="offer-plan-name">{plan.name}</h4>
                      <div className="checkmark">
                        <i className="fa-solid fa-check"></i>
                      </div>
                    </div>

                    <div className="offer-badge-wrapp mt-2">
                      <span className="offer-badge">
                        Ideal For:{" "}
                        <span className="highlight">{plan.idealFor}</span>
                      </span>
                    </div>
                    <div className="offer-price-wrap">
                      <h4 className="offer-price">
                        ₹{plan.price}
                        <span>{` ${plan.cycle}`}</span>
                      </h4>
                      {plan.discount && (
                        <span className="offer-discount">{plan.discount}</span>
                      )}
                    </div>
                    <p
                      className="pre-para"
                      style={{
                        textAlign: "left",
                        marginTop: "8px",
                        marginBottom: 0,
                        color: "#556987",
                        fontWeight: 600,
                      }}
                    >
                      {plan.storage}
                    </p>

                    <hr />
                    <ul className="offer-features">
                      {plan.features.map((feature, i) => {
                        let highlighted = feature;
                        (plan.boldPhrases || []).forEach((phrase) => {
                          const regex = new RegExp(`(${phrase})`, "gi");
                          highlighted = highlighted.replace(
                            regex,
                            `<span style="color: #3E3D3D;">$1</span>`
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
                      className="offer-get-started"
                      onClick={() => handlePlanGetStarted(plan)}
                    >
                      Get Started
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- Banner Section --- */}
        <section data-aos="zoom-in" className="prelogin-banner-section">
          <div className="content">
            <div className="row main-banner">
              <div className="banner-left col-12 col-lg-6">
                <div className="banner-left-top">
                  <h2>
                    <span>Seamless Productivity</span>
                    <br />
                    with Stolity
                  </h2>
                  <p className="pre-para">
                    No more clutter. No more chaos. Just pure efficiency at your
                    fingertips.
                    <br />
                    <br />
                    We are available on both the App Store and Play Store.
                  </p>
                  <a href="#" className="organize-btn" onClick={handleNavigation}>
                    Start Organizing Smarter
                    <i className="fa-solid fa-arrow-right"></i>
                  </a>
                </div>

                <div className="banner-stores">
                  <div className="banner-store">
                    <div className="scanner-one">
                      <img src={scanOne} alt="Google Play QR code" />
                      <p>
                        Scan to Download
                        <br />
                        from Google Play
                      </p>
                    </div>
                    <a
                      href="https://play.google.com/store/apps/details?id=com.stolity.infomanav.com&pcampaignid=web_share"
                      className="play-btn"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <i className="fa-brands fa-google-play"></i>
                      Get App on Play Store
                    </a>
                  </div>

                  <div className="banner-store">
                    <div className="scanner-two">
                      <img src={scanTwo} alt="App Store QR code" />
                      <p>
                        Scan to Download
                        <br />
                        from App Store
                      </p>
                    </div>
                    <a
                      href="https://apps.apple.com/in/app/stolity/id6737306442"
                      className="apple-btn"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <i className="fa-brands fa-apple"></i>
                      Get App on App Store
                    </a>
                  </div>
                </div>
              </div>

              <div className="banner-right col-12 col-lg-6">
                <img src={bannerImg} alt="banner" className="img-fluid" />
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="content" data-aos="zoom-in">
        <p>© 2026 Stolity. All rights reserved.</p>

        <ul className="footer-right">
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
      </footer>
    </div>
  );
};

export default PreLogin;
