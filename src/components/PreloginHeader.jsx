import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import LogoImg from "../images/prelogin-img/logo-stolity.svg";

const MenuIcon = ({ open }) =>
  open ? (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path
        d="M6 6l12 12M18 6L6 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path
        d="M4 7h16M4 12h16M4 17h16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );

/**
 * Shared marketing header.
 * Desktop: Logo + nav links + Login + Get Started
 * Mobile: Logo + Login + Get Started + hamburger (nav links in panel)
 *
 * @param {{ label: string, to: string }[]} links
 * @param {boolean} [aos]
 */
const PreloginHeader = ({ links = [], aos = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 768) setMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const scrollToHash = (hash) => {
    const id = hash.replace(/^#/, "");
    const el = document.getElementById(id);
    if (!el) return;
    const headerOffset = 112; // fixed header + a little breathing room
    const top = el.getBoundingClientRect().top + window.scrollY - headerOffset;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  };

  const go = (to) => (e) => {
    e.preventDefault();
    setMenuOpen(false);

    if (to.includes("#")) {
      const [pathPart, hashPart] = to.split("#");
      const targetPath = pathPart || "/";
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

  const handleLogin = (e) => {
    e.preventDefault();
    setMenuOpen(false);
    navigate("/Login");
  };

  const handleGetStarted = (e) => {
    e.preventDefault();
    setMenuOpen(false);
    navigate("/Signup");
  };

  return (
    <header
      className={menuOpen ? "is-menu-open" : undefined}
      {...(aos ? { "data-aos": "zoom-out" } : {})}
    >
      <div className="header-content content">
        <a href="/" onClick={go("/")} className="header-logo-link">
          <img src={LogoImg} alt="Stolity" className="img-fluid" />
        </a>

        <div className="header-actions">
          <nav
            id="prelogin-header-nav"
            className={`header-btns${menuOpen ? " is-open" : ""}`}
            aria-label="Primary"
          >
            {links.map((link) => (
              <a
                key={`${link.to}-${link.label}`}
                href={link.to}
                className="industries-nav-btn"
                onClick={go(link.to)}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="header-cta-group">
            <a
              href="/Login"
              className="header-login-btn"
              onClick={handleLogin}
            >
              Login
            </a>
            <a
              href="/Signup"
              className="get-start-btn"
              onClick={handleGetStarted}
            >
              Get Started
            </a>
          </div>

          {links.length > 0 && (
            <button
              type="button"
              className="header-menu-toggle"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="prelogin-header-nav"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <MenuIcon open={menuOpen} />
            </button>
          )}
        </div>
      </div>

      {menuOpen && (
        <button
          type="button"
          className="header-menu-backdrop"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </header>
  );
};

export default PreloginHeader;
