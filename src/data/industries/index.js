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
import architects from "./architects";
import interiorDesigners from "./interior-designers";
import realEstateAgencies from "./real-estate-agencies";
import photographyStudios from "./photography-studios";
import videoProduction from "./video-production";
import designAgencies from "./design-agencies";
import advertisingAgencies from "./advertising-agencies";
import schools from "./schools";
import universities from "./universities";
import coachingInstitutes from "./coaching-institutes";
import onlineLearningPlatforms from "./online-learning-platforms";
import banking from "./banking";
import insurance from "./insurance";
import complianceTeams from "./compliance-teams";
import auditingFirms from "./auditing-firms";
import startups from "./startups";
import saasCompanies from "./saas-companies";
import remoteTeams from "./remote-teams";
import corporateEnterprises from "./corporate-enterprises";



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
  [architects.slug]: architects,
  [interiorDesigners.slug]: interiorDesigners,
  [realEstateAgencies.slug]: realEstateAgencies,
  [photographyStudios.slug]: photographyStudios,
  [videoProduction.slug]: videoProduction,
  [designAgencies.slug]: designAgencies,
  [advertisingAgencies.slug]: advertisingAgencies,
  [schools.slug]: schools,
  [universities.slug]: universities,
  [coachingInstitutes.slug]: coachingInstitutes,
  [onlineLearningPlatforms.slug]: onlineLearningPlatforms,
  [banking.slug]: banking,
  [insurance.slug]: insurance,
  [complianceTeams.slug]: complianceTeams,
  [auditingFirms.slug]: auditingFirms,
  [startups.slug]: startups,  
  [saasCompanies.slug]: saasCompanies,
  [remoteTeams.slug]: remoteTeams,
  [corporateEnterprises.slug]: corporateEnterprises,
};

export const getIndustryDetail = (slug) => industryDetails[slug] || null;

export const getAllIndustryDetails = () => Object.values(industryDetails);

export const hasIndustryDetail = (slug) => Boolean(industryDetails[slug]);
