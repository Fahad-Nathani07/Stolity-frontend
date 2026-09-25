/**
 * Industry registry — add new industries here.
 *
 * Steps for a new industry:
 * 1. Create src/data/industries/{slug}.js  (copy law-firms.js, edit texts)
 * 2. Put images in public/images/industries/{slug}/
 * 3. Import + register below
 *
 * Route: /Industries/:slug  → IndustryDetail.jsx
 */
import lawFirms from "./law-firms";
import hospitals from "./hospitals";

export const industryDetails = {
  [lawFirms.slug]: lawFirms,
  [hospitals.slug]: hospitals,
};

export const getIndustryDetail = (slug) => industryDetails[slug] || null;

export const getAllIndustryDetails = () => Object.values(industryDetails);

export const hasIndustryDetail = (slug) => Boolean(industryDetails[slug]);
