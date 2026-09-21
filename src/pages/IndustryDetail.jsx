import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ScrollReveal from "../components/ScrollReveal";
import PreloginHeader from "../components/PreloginHeader";
import { getIndustryDetail } from "../data/industries";
import "./prelogin.css";
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
  const footer = detail.footer;

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
                    {whyChoose.cards.map((card, index) => (
                      <article
                        key={card.label}
                        className={`industry-why-card industry-why-card--${index + 1}`}
                      >
                        <img
                          src={card.image}
                          alt={card.label}
                          className="industry-why-card-img"
                        />
                      </article>
                    ))}
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
                  {everythingYouNeed.features.map((item) => (
                    <div key={item.label} className="industry-everything-feature">
                      <img
                        src={item.image}
                        alt={item.label}
                        className="industry-everything-feature-img"
                      />
                    </div>
                  ))}
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

      {footer && (
        <ScrollReveal as="footer" className="industry-detail-footer content" variant="fadeSoft">
          <p>{footer.copyright}</p>
          <ul>
            {footer.links.map((link) => (
              <li key={link.label}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>
        </ScrollReveal>
      )}
    </div>
  );
};

export default IndustryDetail;
