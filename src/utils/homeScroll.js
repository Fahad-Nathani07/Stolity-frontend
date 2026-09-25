/**
 * Map legacy AOS zoom animations → Home1 ScrollReveal variants.
 * Use for after-login pages migrating off AOS.
 */
export const HOME_SCROLL = {
  /** Page chrome / headers (was data-aos="zoom-out") */
  header: { variant: "fadeSoft", delay: 0.05, duration: 0.75 },
  /** Primary content blocks (was data-aos="zoom-in") */
  block: { variant: "fadeUp", delay: 0.1, duration: 0.85 },
  /** Emphasized sections / cards */
  rise: { variant: "rise", delay: 0.12, duration: 0.9 },
  /** Soft secondary panels */
  soft: { variant: "fadeSoft", delay: 0.08, duration: 0.8 },
};

export default HOME_SCROLL;
