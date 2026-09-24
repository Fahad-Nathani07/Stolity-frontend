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
import accountingFirms from "./accounting-firms";
import marketingAgencies from "./marketing-agencies";
import itServices from "./it-services";
import consultingFirms from "./consulting-firms";
import hrAgencies from "./hr-agencies";
import clinics from "./clinics";
import diagnosticCenters from "./diagnostic-centers";
import medicalLabs from "./medical-labs";
import wellnessCenters from "./wellness-centers";
import constructionCompanies from "./construction-companies";

export const industryDetails = {
  [lawFirms.slug]: lawFirms,
  [hospitals.slug]: hospitals,
  [accountingFirms.slug]: accountingFirms,
  [marketingAgencies.slug]: marketingAgencies,
  [itServices.slug]: itServices,
  [consultingFirms.slug]: consultingFirms,
  [hrAgencies.slug]: hrAgencies,
  [clinics.slug]: clinics,
  [diagnosticCenters.slug]: diagnosticCenters,
  [medicalLabs.slug]: medicalLabs,
  [wellnessCenters.slug]: wellnessCenters,
  [constructionCompanies.slug]: constructionCompanies,
};

export const getIndustryDetail = (slug) => industryDetails[slug] || null;

export const getAllIndustryDetails = () => Object.values(industryDetails);

export const hasIndustryDetail = (slug) => Boolean(industryDetails[slug]);
