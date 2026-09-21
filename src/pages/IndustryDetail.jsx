import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";
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
    AOS.init({
      duration: 1000,
      offset: 100,
      easing: "ease-in-out",
      once: true,
    });
  }, []);

  useEffect(() => {
    AOS.refresh();
  }, [slug, detail]);

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
          <div className="content industry-detail-fallback" data-aos="zoom-in">
            <h1>Coming soon</h1>
            <p>This industry page is not ready yet.</p>
            <button type="button" className="industry-detail-primary-btn" onClick={() => navigate("/Industries")}>
              Back to Industries
            </button>
          </div>
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
        <section className="industry-detail-hero" data-aos="zoom-out">
          <div className="content industry-detail-hero-inner">
            <span className="industry-detail-badge">
              <BadgeHeartIcon />
              {detail.badgeLabel}
            </span>

            <h1 className="industry-detail-title">
              {detail.titleBefore}
              <span className="industry-detail-title-accent">{detail.titleHighlight}</span>
            </h1>

            <div className="industry-detail-copy">
              {detail.paragraphs.map((text) => (
                <p key={text}>{text}</p>
              ))}
            </div>

            <div className="industry-detail-ctas">
              <button type="button" className="industry-detail-primary-btn" onClick={handleGetStarted}>
                {detail.ctaPrimary.label}
                <ArrowRightIcon />
              </button>
              <button type="button" className="industry-detail-secondary-btn" onClick={handleBookDemo}>
                <PlayIcon />
                {detail.ctaSecondary.label}
              </button>
            </div>

            <div className="industry-detail-visual">
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
            </div>
          </div>
        </section>

        {whyChoose && (
          <section className="industry-why-section" data-aos="zoom-in">
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
          </section>
        )}

        {featureSections.map((section) => {
          const imageFailed = failedFeatureImages[section.id];
          return (
            <section key={section.id} className="industry-doc-section" data-aos="zoom-in">
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
            </section>
          );
        })}

        {everythingYouNeed && (
          <section className="industry-everything-section" data-aos="zoom-in">
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
          </section>
        )}

        {bottomCta && (
          <section className="industry-bottom-cta" data-aos="zoom-in">
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
          </section>
        )}
      </main>

      {footer && (
        <footer className="industry-detail-footer content" data-aos="zoom-in">
          <p>{footer.copyright}</p>
          <ul>
            {footer.links.map((link) => (
              <li key={link.label}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>
        </footer>
      )}
    </div>
  );
};

export default IndustryDetail;
