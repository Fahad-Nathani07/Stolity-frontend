import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ScrollReveal from "../components/ScrollReveal";
import PreloginHeader from "../components/PreloginHeader";
import { getIndustryDetail } from "../data/industries";
import "./prelogin.css";
import "./homeTheme.css";
import "./industryDetail.css";

const BadgeHeartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14" />
    <path d="M13 6l6 6-6 6" />
  </svg>
);

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M10 8.5l7 3.5-7 3.5V8.5z" fill="currentColor" stroke="none" />
  </svg>
);

const WHY_CARD_ICONS = {
  lock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  ),
  "search-file": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 3h6l4 4v14H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
      <path d="M14 3v4h4" />
      <circle cx="12" cy="14" r="3" />
      <path d="M14.2 16.2L16.5 18.5" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="8" r="3" />
      <circle cx="16" cy="9" r="2.5" />
      <path d="M3.5 19c.8-3 2.8-4.5 5.5-4.5S14 16 14.8 19" />
      <path d="M14 14.5c1.6-.4 3.2 0 4.5 1.5.7.8 1.2 1.8 1.5 3" />
    </svg>
  ),
  "cloud-upload": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 18a4.5 4.5 0 0 1 .4-9 5.5 5.5 0 0 1 10.6 1.5A3.5 3.5 0 0 1 18 18H7z" />
      <path d="M12 15V9" />
      <path d="M9.5 11.5L12 9l2.5 2.5" />
    </svg>
  ),
  cabinet: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M4 12h16" />
      <path d="M10 7.5h4" />
      <path d="M10 16.5h4" />
    </svg>
  ),
};

const DEFAULT_WHY_ICONS = ["lock", "search-file", "users", "cloud-upload", "cabinet"];

const EVERYTHING_FEATURE_ICONS = {
  lock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  ),
  activity: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 12h4l2.5-6 4 12L16 12h5" />
    </svg>
  ),
  archive: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="4" rx="1" />
      <path d="M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8" />
      <path d="M10 13h4" />
    </svg>
  ),
  share: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 14v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
      <path d="M12 4v12" />
      <path d="M8 8l4-4 4 4" />
    </svg>
  ),
  "file-check": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 3h6l4 4v14H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
      <path d="M14 3v4h4" />
      <path d="M9 15l2 2 4-4" />
    </svg>
  ),
};

const DEFAULT_EVERYTHING_ICONS = ["lock", "lock", "activity", "archive", "share", "file-check"];

const DEFAULT_INDUSTRY_FOOTER = {
  copyright: "© 2026 Stolity. All rights reserved.",
  links: [
    { label: "Terms of Service", href: "/terms-and-conditions" },
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Cookies", href: "/privacy-policy" },
  ],
};

const IndustryDetail = () => {
  const navigate = useNavigate();
  const { slug } = useParams();
  const detail = getIndustryDetail(slug);
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [heroFailed, setHeroFailed] = useState(false);
  const [whyBgFailed, setWhyBgFailed] = useState(false);
  const [failedFeatureImages, setFailedFeatureImages] = useState({});
  const [everythingBgFailed, setEverythingBgFailed] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("prelogin-active");
    document.body.classList.add("prelogin-active");
    return () => {
      document.documentElement.classList.remove("prelogin-active");
      document.body.classList.remove("prelogin-active");
    };
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [slug]);

  const markFeatureImageFailed = (id) => {
    setFailedFeatureImages((prev) => ({ ...prev, [id]: true }));
  };

  const handleGetStarted = (e) => {
    e.preventDefault();
    navigate("/Login");
  };

  const handleBookDemo = (e) => {
    e.preventDefault();
  };

  if (!detail) {
    const prettySlug = (slug || "")
      .split("-")
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    return (
      <div className="prelogin-page industry-detail-page">
        <PreloginHeader
          aos
          links={[
            { label: "Home", to: "/" },
            { label: "Industries", to: "/Industries" },
            { label: "Pricing", to: "/#pricing" },
          ]}
        />
        <main className="industry-detail-main industry-coming-soon-main">
          <section className="industry-coming-soon">
            <div className="industry-coming-soon-glow" aria-hidden="true" />
            <div className="content industry-coming-soon-inner">
              <ScrollReveal variant="fadeSoft" delay={0.05}>
                <span className="industry-coming-soon-badge">
                  <span className="industry-coming-soon-pulse" aria-hidden="true" />
                  In progress
                </span>
              </ScrollReveal>

              <ScrollReveal variant="rise" delay={0.12} duration={0.95}>
                <div className="industry-coming-soon-visual" aria-hidden="true">
                  <div className="industry-coming-soon-orbit">
                    <span />
                    <span />
                    <span />
                  </div>
                  <div className="industry-coming-soon-icon">
                    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
                      <path
                        d="M24 6l3.2 9.8H37l-8 5.8 3.1 9.7L24 25.5 15.9 31.3l3.1-9.7-8-5.8h9.8L24 6z"
                        fill="#FFAB49"
                      />
                    </svg>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal as="h1" className="industry-coming-soon-title" variant="fadeUp" delay={0.2}>
                Coming Soon
              </ScrollReveal>

              {prettySlug ? (
                <ScrollReveal as="p" className="industry-coming-soon-industry" variant="fadeSoft" delay={0.28}>
                  {prettySlug}
                </ScrollReveal>
              ) : null}

              <ScrollReveal as="p" className="industry-coming-soon-copy" variant="fadeUp" delay={0.34}>
                We&apos;re crafting a tailored Stolity experience for this industry — secure workflows, smarter sharing, and beautiful file management.
              </ScrollReveal>

              <ScrollReveal className="industry-coming-soon-actions" variant="fadeSoft" delay={0.42}>
                <button
                  type="button"
                  className="industry-coming-soon-primary"
                  onClick={() => navigate("/Industries")}
                >
                  Explore Industries
                  <ArrowRightIcon />
                </button>
                <button
                  type="button"
                  className="industry-coming-soon-secondary"
                  onClick={() => navigate("/")}
                >
                  Back to Home
                </button>
              </ScrollReveal>
            </div>
          </section>
        </main>
      </div>
    );
  }

  const whyChoose = detail.whyChoose;
  const featureSections = detail.featureSections || [];
  const everythingYouNeed = detail.everythingYouNeed;
  const bottomCta = detail.bottomCta;
  const footer = detail.footer || DEFAULT_INDUSTRY_FOOTER;

  return (
    <div className="prelogin-page industry-detail-page">
      <PreloginHeader
        aos
        links={[
          { label: "Home", to: "/" },
          { label: "Industries", to: "/Industries" },
          { label: "Pricing", to: "/#pricing" },
        ]}
      />

      <main className="industry-detail-main">
        <section className="industry-detail-hero">
          <div className="content industry-detail-hero-inner">
            <ScrollReveal as="span" className="industry-detail-badge" variant="fadeSoft" delay={0.05}>
              <BadgeHeartIcon />
              {detail.badgeLabel}
            </ScrollReveal>

            <ScrollReveal as="h1" className="industry-detail-title" variant="rise" delay={0.14}>
              {detail.titleBefore}
              <span className="industry-detail-title-accent">{detail.titleHighlight}</span>
            </ScrollReveal>

            <ScrollReveal className="industry-detail-copy" variant="fadeUp" delay={0.24}>
              {detail.paragraphs.map((text) => (
                <p key={text}>{text}</p>
              ))}
            </ScrollReveal>

            <ScrollReveal className="industry-detail-ctas" variant="fadeSoft" delay={0.32}>
              <button type="button" className="industry-detail-primary-btn" onClick={handleGetStarted}>
                {detail.ctaPrimary.label}
                <ArrowRightIcon />
              </button>
              <button type="button" className="industry-detail-secondary-btn" onClick={handleBookDemo}>
                <PlayIcon />
                {detail.ctaSecondary.label}
              </button>
            </ScrollReveal>

            <ScrollReveal className="industry-detail-visual" variant="scaleIn" delay={0.4} duration={1.05}>
              {!heroFailed ? (
                <img
                  src={detail.heroImage}
                  alt={`${detail.badgeLabel} file management`}
                  className={`industry-detail-hero-img${heroLoaded ? " is-loaded" : ""}`}
                  onLoad={() => setHeroLoaded(true)}
                  onError={() => setHeroFailed(true)}
                />
              ) : (
                <div className="industry-detail-hero-placeholder">
                  <p>
                    Add hero image at
                    <br />
                    <code>public/images/industries/{detail.slug}/hero.png</code>
                  </p>
                </div>
              )}
            </ScrollReveal>
          </div>
        </section>

        {whyChoose && (
          <ScrollReveal as="section" className="industry-why-section" variant="rise" duration={0.95}>
            <div className="content">
              <div
                className={`industry-why-panel${!whyBgFailed ? " has-bg" : ""}`}
                style={
                  !whyBgFailed
                    ? { backgroundImage: `url(${whyChoose.backgroundImage})` }
                    : undefined
                }
              >
                {!whyBgFailed && (
                  <img
                    src={whyChoose.backgroundImage}
                    alt=""
                    className="industry-why-bg-probe"
                    onError={() => setWhyBgFailed(true)}
                  />
                )}
                <div className="industry-why-overlay" />
                <div className="industry-why-content">
                  <h2 className="industry-why-title">{whyChoose.title}</h2>
                  <p className="industry-why-subtitle">{whyChoose.subtitle}</p>
                  <div className="industry-why-cards">
                    {whyChoose.cards.map((card, index) => {
                      const iconKey = card.icon || DEFAULT_WHY_ICONS[index] || "lock";
                      const cardNum = index + 1;
                      return (
                        <article
                          key={card.label}
                          className={`industry-why-card industry-why-card--${cardNum}`}
                        >
                          <div
                            className="industry-why-card-decor"
                            aria-hidden="true"
                            style={{
                              backgroundImage: `url(/images/industries/why-cards/decor-${cardNum}.png)`,
                            }}
                          />
                          <div className="industry-why-card-body">
                            <span className="industry-why-card-icon">
                              {WHY_CARD_ICONS[iconKey] || WHY_CARD_ICONS.lock}
                            </span>
                            <p className="industry-why-card-label">{card.label}</p>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        )}

        {featureSections.map((section) => {
          const imageFailed = failedFeatureImages[section.id];
          return (
            <ScrollReveal
              as="section"
              key={section.id}
              className="industry-doc-section"
              variant="fadeUp"
              duration={0.9}
            >
              <div className="content">
                <h2 className="industry-doc-heading">{section.title}</h2>
                <div
                  className={`industry-doc-panel theme-${section.theme || "peach"} style-${section.imageStyle || "curve"}`}
                >
                  <div className="industry-doc-left">
                    <p className="industry-doc-desc">{section.description}</p>
                    <ul className="industry-doc-list">
                      {section.items.map((item) => (
                        <li key={item}>
                          <span className="industry-doc-bullet" aria-hidden="true" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="industry-doc-right">
                    {!imageFailed ? (
                      <img
                        src={section.image}
                        alt={section.title}
                        onError={() => markFeatureImageFailed(section.id)}
                      />
                    ) : (
                      <div className="industry-doc-img-placeholder">
                        <code>
                          public/images/industries/{detail.slug}/
                          {section.image.split("/").pop()}
                        </code>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </ScrollReveal>
          );
        })}

        {everythingYouNeed && (
          <ScrollReveal as="section" className="industry-everything-section" variant="rise">
            <div className="content">
              <div
                className={`industry-everything-panel${!everythingBgFailed ? " has-bg" : ""}`}
                style={
                  !everythingBgFailed
                    ? { backgroundImage: `url(${everythingYouNeed.backgroundImage})` }
                    : undefined
                }
              >
                {!everythingBgFailed && (
                  <img
                    src={everythingYouNeed.backgroundImage}
                    alt=""
                    className="industry-why-bg-probe"
                    onError={() => setEverythingBgFailed(true)}
                  />
                )}
                <div className="industry-everything-overlay" />
                <div className="industry-everything-top">
                  <div className="industry-everything-copy">
                    <h2>{everythingYouNeed.title}</h2>
                    <p>{everythingYouNeed.subtitle}</p>
                  </div>
                  <div className="industry-everything-aside">
                    {everythingYouNeed.testimonialImage && (
                      <img
                        src={everythingYouNeed.testimonialImage}
                        alt="Customer testimonial"
                        className="industry-testimonial-img"
                      />
                    )}
                    {everythingYouNeed.ratingImage && (
                      <img
                        src={everythingYouNeed.ratingImage}
                        alt="Customer rating"
                        className="industry-rating-img"
                      />
                    )}
                  </div>
                </div>
                <div className="industry-everything-features">
                  {everythingYouNeed.features.map((item, index) => {
                    const iconKey = item.icon || DEFAULT_EVERYTHING_ICONS[index] || "lock";
                    return (
                      <div key={item.label} className="industry-everything-feature">
                        <span className="industry-everything-feature-icon">
                          {EVERYTHING_FEATURE_ICONS[iconKey] || EVERYTHING_FEATURE_ICONS.lock}
                        </span>
                        <span className="industry-everything-feature-label">{item.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </ScrollReveal>
        )}

        {bottomCta && (
          <ScrollReveal as="section" className="industry-bottom-cta" variant="fadeSoft">
            <div className="content industry-bottom-cta-inner">
              <h2>
                <span className="industry-detail-title-accent">{bottomCta.titleHighlight}</span>
                {bottomCta.titleAfter}
              </h2>
              <p>{bottomCta.subtitle}</p>
              <div className="industry-detail-ctas">
                <button type="button" className="industry-detail-primary-btn" onClick={handleGetStarted}>
                  {bottomCta.primaryLabel}
                  <ArrowRightIcon />
                </button>
                <button type="button" className="industry-detail-secondary-btn" onClick={handleBookDemo}>
                  {bottomCta.secondaryLabel}
                </button>
              </div>
            </div>
          </ScrollReveal>
        )}
      </main>

      <footer className="industry-detail-footer">
        <div className="content industry-detail-footer-inner">
          <p>{footer.copyright}</p>
          <ul>
            {footer.links.map((link) => (
              <li key={link.label}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>
        </div>
      </footer>
    </div>
  );
};

export default IndustryDetail;
