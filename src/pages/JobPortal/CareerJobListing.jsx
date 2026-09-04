import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import "./CareerJobListing.css";
import { MdKeyboardArrowLeft } from "react-icons/md";
import { MdKeyboardArrowRight } from "react-icons/md";
import { MdKeyboardDoubleArrowLeft } from "react-icons/md";
import { MdKeyboardDoubleArrowRight } from "react-icons/md";
import InfomanavLogo from "../../images/InfomanavLogo.svg";
import briefcaseIcon2 from "../../images/briefcaseIcon2.svg"
import SaveIcon2 from "../../images/SaveIcon2.svg"
import ColorfullCheck from "../../images/ColorfullCheck.svg"
import LocationIconColoured2 from "../../images/LocationIconColoured2.svg"
import locationIcon from "../../images/locationIcon.svg"
import clockIcon from "../../images/clockIcon.svg"
import HourGlassIcon from "../../images/HourGlassIcon.svg"
import TimeIcon3 from "../../images/TimeIcon3.svg"
import SalaryIcon2 from "../../images/SalaryIcon2.svg"
import ApplicationIcon3 from "../../images/ApplicationIcon3.svg" 
import PostedDaysAgo from "../../images/PostedDaysAgo.svg"
import ApplicationsIcon2 from "../../images/ApplicationsIcon.svg" 

import { getCountFromServer, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase"; // adjust path

import { toaster, Notification } from "rsuite";
import "rsuite/dist/rsuite.min.css";

import { FaBriefcase } from "react-icons/fa";
import { IoLocationOutline } from "react-icons/io5";
import { FaRegClock } from "react-icons/fa";
import { MdCurrencyRupee } from "react-icons/md";
import { TfiFiles } from "react-icons/tfi";
import { LuCircleCheckBig } from "react-icons/lu";
import { showToast } from "../../components/ToastProvider";





const CareerJobListing = () => {
    const { companySlug } = useParams();

    // console.log("mnbvc ▶ companySlug from URL:", companySlug);
    // console.log(
    // "mnbvc ▶ companySlug lowercase:",
    // companySlug?.toLowerCase()
    // );

    const [activeTab, setActiveTab] = useState("All");
    const [searchText, setSearchText] = useState("");
    const [expandedJobId, setExpandedJobId] = useState(null);

    const [companyInfo, setCompanyInfo] = useState(null);
  // const [jobs, setJobs] = useState([]);
  // const [loading, setLoading] = useState(false);

    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);


    const [applyForm, setApplyForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        mobile: "",
        location: "",
        resume: null
    });



    const [filters, setFilters] = useState({
        location: "",
        experience: "",
        jobType: "",
        employmentType: "",
        workArrangement: "",
        datePosted: "",
        salaryRange: 0,
    });

    const [currentPage, setCurrentPage] = useState(1);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

    // const [hasApplied, setHasApplied] = useState(false);
    const [appliedJobIds, setAppliedJobIds] = useState([]);

    const departments = ["All", ...new Set(jobs.map(j => j.department))];

    const [viewMode, setViewMode] = useState("grid"); // grid | details | apply
    const [selectedJob, setSelectedJob] = useState(null);

    useEffect(()=>{
      console.log("FILTERS:", filters);
    },[filters])

    useEffect(() => {
      const saved = sessionStorage.getItem("appliedJobs");
      if (saved) {
        try {
          const ids = JSON.parse(saved);
          if (Array.isArray(ids)) {
            setAppliedJobIds(ids);
          } else {
            console.warn("appliedJobs in sessionStorage was not an array — resetting");
          }
        } catch (e) {
          console.warn("Invalid appliedJobs data in sessionStorage");
        }
      }
    }, []); // empty dependency → run once on mount

    // Put this wherever you need to know if current job was applied
    const hasAppliedToThisJob = appliedJobIds.includes(selectedJob?.jobId ?? "");

    const jobsPerPage = 6;

    // Option A: Simple version (inside the component)
    const uniqueLocations = useMemo(() => {
      if (!jobs || jobs.length === 0) return [];

      const locationsSet = new Set(
        jobs
          .map(job => job.location?.trim())          // get location, trim whitespace
          .filter(loc => loc && loc !== "")          // remove empty / falsy
      );

      return Array.from(locationsSet).sort();        // convert to sorted array
    }, [jobs]);   // recompute only when jobs change


    /* =======================
       DERIVED DATA
    ======================== */
    // const departments = ["All", ...new Set(jobs.map(j => j.Job_Department))];
  

    const mapJobToDetails = (job) => ({
        jobId: job.Job_ID,
        companyId: job.companyId,
        title: job.Job_Title,
        status: job.Job_isActive ? "Active" : "Closed",
        location: job.Job_Location,
        type: job.Job_Type,
        salary: job.Job_Salary_Range,
        applicants: job.Job_ApplicationCount, // dummy for now
        experience: job.Job_Experience,
        skills: job.Job_Required_Skills.join(", "),
        description: job.Job_Description,
        responsibilities: job.Job_Responsibility,
        requirements: job.Job_Requirements,
        benefits: job.Job_Benefits,
        postedDate: job.Job_Posting_Date,
        deadline: job.Job_Application_Deadline,
        companyName: job.CompanyName,
        companyEmail: job.CompanyEmail,
        companyMobile: job.CompanyMobile,
        role: job.Job_Title,
        department: job.Job_Department,
        companyAboutUs: job.CompanyAboutUs,
        jobCreatedAt: job.jobCreatedAt,
    });


const normalizedJobs = jobs.map(job => {
  // Helper to format salary type nicely
  const formatSalaryType = (type) => {
    if (!type || typeof type !== 'string') return "";

    const lower = type.toLowerCase().trim();

    if (lower.includes('month') || lower === 'per-month' || lower === 'per month') {
      return "Month";
    }
    if (lower.includes('year') || lower === 'per-year' || lower === 'per year' || lower === 'annually') {
      return "Year";
    }
    if (lower.includes('hour') || lower === 'per-hour' || lower === 'per hour') {
      return "Hour";
    }
    if (lower.includes('day') || lower === 'per-day' || lower === 'per day') {
      return "Day";
    }
    if (lower.includes('week') || lower === 'per-week' || lower === 'per week') {
      return "Week";
    }

    // Fallback: remove "per-" / "per " prefix and capitalize first letter
    let cleaned = type
      .replace(/^per-?/i, '')     // remove "per-" or "per"
      .replace(/^per\s+/i, '')    // remove "per " at start
      .trim();

    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  };

  const salaryTypeFormatted = job.salary?.type ? formatSalaryType(job.salary.type) : "";

  return {
    CompanyName: job.companyName,
    CompanyEmail: job.companyEmail,
    companyId: job.companyId,
    CompanyMobile: job.companyMobile,
    CompanyAboutUs: job.companyAboutUs,
    jobCreatedAt: job.createdAt,

    Job_ID: job.id,
    Job_ApplicationCount: job.applicationCount,
    Job_Title: job.jobTitle,
    Job_Department: job.department,
    Job_Type: job.employmentType,
    Job_Experience: job.experienceLevel,
    Job_Work_arrangement: job.workArrangement,
    Job_Posting_Date: job.jobPostingDate,
    Job_Application_Deadline: job.applicationDeadline,
    Job_Location: job.location,
    Job_Required_Skills: job.requiredSkills || [],
    Job_Requirements: job.responsibilities || [],
    Job_Salary_Range: job.salary?.min != null && job.salary?.max != null
      ? `₹${job.salary.min} – ₹${job.salary.max}${salaryTypeFormatted ? ` / ${salaryTypeFormatted}` : ""}`
      : "N/A",
    Job_Description: job.jobDescription,
    Job_Responsibility: job.responsibilities || [],
    Job_Benefits: job.benefits || [],
    Job_isActive: job.isActive,
  };
});



    // const filteredJobs = normalizedJobs.filter(job => {
    //     const matchTab =
    //         activeTab === "All" || job.Job_Department === activeTab;

    //     const matchSearch =
    //         job.Job_Title.toLowerCase().includes(searchText.toLowerCase()) ||
    //         job.Job_Required_Skills.some(skill =>
    //             skill.toLowerCase().includes(searchText.toLowerCase())
    //         );

    //     const matchLocation =
    //         !filters.location || job.Job_Location === filters.location;

    //     const matchExperience =
    //         !filters.experience || job.Job_Experience === filters.experience;

    //     const matchJobType =
    //         !filters.jobType || job.Job_Type === filters.jobType;

    //     return (
    //         matchTab &&
    //         matchSearch &&
    //         matchLocation &&
    //         matchExperience &&
    //         matchJobType &&
    //         job.Job_isActive
    //     );
    // });

const filteredJobs = normalizedJobs.filter(job => {

    const matchTab =
        activeTab === "All" || job.Job_Department === activeTab;

    const matchSearch =
        job.Job_Title.toLowerCase().includes(searchText.toLowerCase()) ||
        job.Job_Required_Skills.some(skill =>
            skill.toLowerCase().includes(searchText.toLowerCase())
        );

    const matchLocation =
        !filters.location || job.Job_Location === filters.location;

    const matchExperience =
        !filters.experience || job.Job_Experience === filters.experience;

    const matchJobType =
        !filters.jobType || job.Job_Type === filters.jobType;

    // NEW: Employment Type
    const matchEmploymentType =
        !filters.employmentType || job.Job_Type === filters.employmentType;

    // NEW: Work Arrangement
    const matchWorkArrangement =
        !filters.workArrangement || job.Job_Work_arrangement === filters.workArrangement;

    // NEW: Date Posted
    const matchDatePosted = (() => {
        if (!filters.datePosted) return true;

        const postedDate = new Date(job.Job_Posting_Date);
        const now = new Date();
        const diffDays = (now - postedDate) / (1000 * 60 * 60 * 24);

        return diffDays <= Number(filters.datePosted);
    })();

    // NEW: Salary Range
    const matchSalary = (() => {
        if (!filters.salaryRange) return true;

        // Extract salary number from string like "₹70000 – ₹80000 / Month"
        const salaryNumbers = job.Job_Salary_Range.match(/\d+/g);
        const minSalary = salaryNumbers ? Number(salaryNumbers[0]) : 0;

        return minSalary >= filters.salaryRange;
    })();

    return (
        matchTab &&
        matchSearch &&
        matchLocation &&
        matchExperience &&
        matchJobType &&
        matchEmploymentType &&
        matchWorkArrangement &&
        matchDatePosted &&
        matchSalary &&
        job.Job_isActive
    );
});


    const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);

    const paginatedJobs = filteredJobs.slice(
        (currentPage - 1) * jobsPerPage,
        currentPage * jobsPerPage
    );


    const getPostedDaysAgoText = (createdAt) => {
      if (!createdAt) return "Posted recently";

      let createdDate;

      // Firestore Timestamp
      if (createdAt.seconds) {
        createdDate = new Date(createdAt.seconds * 1000);
      } 
      // ISO string
      else {
        createdDate = new Date(createdAt);
      }

      const now = new Date();
      const diffTime = Math.abs(now - createdDate);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return "Posted today";
      if (diffDays === 1) return "Posted 1 day ago";

      return `Posted ${diffDays} days ago`;
    };

    const getApplicationCount = async (jobId) => {
      if (!jobId) return 0;

      try {
        const resumesQuery = query(
          collection(db, "resumeMaster"),
          where("jobId", "==", jobId)
        );

        const snapshot = await getCountFromServer(resumesQuery);
        return snapshot.data().count;
      } catch (err) {
        console.error(`Failed to count applications for job ${jobId}:`, err);
        return 0; // graceful fallback
      }
    };


    // useEffect(() => {
    //   const fetchJobs = async () => {
    //     if (!companySlug) {
    //       console.warn("mnbvc ⚠️ companySlug missing, fetch skipped");
    //       return;
    //     }

    //     try {
    //       setLoading(true);

    //       const jobsRef = collection(db, "jobMaster");
    //       const q = query(
    //         jobsRef,
    //         where("slug", "==", companySlug.toLowerCase()),
    //         where("isActive", "==", true)
    //       );

    //       const snapshot = await getDocs(q);

    //       const jobsWithoutCounts = snapshot.docs.map((doc) => ({
    //         id: doc.id,
    //         ...doc.data(),
    //       }));

    //       console.log("mnbvc ▶ Raw fetched jobs:", jobsWithoutCounts);

    //       // Enrich with application counts (parallel fetches)
    //       const jobsWithCounts = await Promise.all(
    //         jobsWithoutCounts.map(async (job) => {
    //           const count = await getApplicationCount(job.id);
    //           return {
    //             ...job,
    //             applicationCount: count, // ← new field added here
    //           };
    //         })
    //       );

    //       console.log("mnbvc ▶ Jobs with application counts:", jobsWithCounts);

    //       setJobs(jobsWithCounts);
    //     } catch (error) {
    //       console.error("mnbvc ❌ fetchJobs error:", error);
    //     } finally {
    //       setLoading(false);
    //     }
    //   };

    //   fetchJobs();
    // }, [companySlug]);


    useEffect(() => {
  const fetchData = async () => {
    if (!companySlug) {
      console.warn("mnbvc ⚠️ companySlug missing, fetch skipped");
      return;
    }

    try {
      setLoading(true);

      // ── 1. Fetch company info first (usually faster & more important)
      const companyRef = collection(db, "companyMaster");
      const companyQuery = query(
        companyRef,
        where("slug", "==", companySlug.toLowerCase()),
        // limit(1) // we expect only one matching company
      );

      const companySnapshot = await getDocs(companyQuery);

      let companyData = null;
      if (!companySnapshot.empty) {
        const doc = companySnapshot.docs[0];
        companyData = {
          id: doc.id,
          ...doc.data(),
        };
        setCompanyInfo(companyData);
        console.log("mnbvc ▶ Company info loaded:", companyData);
      } else {
        console.warn("mnbvc ⚠️ No company found for slug:", companySlug);
        // Optionally: setCompanyInfo(null) or show "Company not found"
      }

      // ── 2. Fetch jobs (only if we want to proceed)
      const jobsRef = collection(db, "jobMaster");
      const jobsQuery = query(
        jobsRef,
        where("slug", "==", companySlug.toLowerCase()),
        where("isActive", "==", true)
      );

      const jobsSnapshot = await getDocs(jobsQuery);

      const jobsWithoutCounts = jobsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log("mnbvc ▶ Raw fetched jobs:", jobsWithoutCounts);

      // Enrich with application counts
      const jobsWithCounts = await Promise.all(
        jobsWithoutCounts.map(async (job) => {
          const count = await getApplicationCount(job.id);
          return {
            ...job,
            applicationCount: count,
          };
        })
      );

      console.log("mnbvc ▶ Jobs with counts:", jobsWithCounts);
      setJobs(jobsWithCounts);

    } catch (error) {
      console.error("mnbvc ❌ Error fetching company/jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [companySlug]);








// const showSuccessToast = () => {
//   toaster.push(
//     <Notification
//       type="success"
//       header="Application Submitted"
//       closable
//     >
//       Your job application has been successfully submitted.
//     </Notification>,
//     {
//       placement: "bottomEnd", // 👈 bottom right
//       duration: 4000
//     }
//   );
// };

const showSuccessToast = () => {
  showToast(
    "success",
    "Your job application has been successfully submitted.",
    "Application Submitted"
  );
};


// const handleSubmitApplication = async () => {
//   try {
//     // 🔒 Validation
//     if (
//       !applyForm.firstName ||
//       !applyForm.lastName ||
//       !applyForm.email ||
//       !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(applyForm.email) || // basic email check
//       !applyForm.mobile ||
//       applyForm.mobile.length < 10 || // simple mobile length check
//       !applyForm.resume
//     ) {
//       toaster.push(
//         <Notification type="warning" header="Missing Fields">
//           Please fill all required fields and upload resume.
//         </Notification>,
//         { placement: "bottomEnd" }
//       );
//       return;
//     }

//     const experienceYears = Number(applyForm.experienceYears || 0);
//     const experienceMonths = Number(applyForm.experienceMonths || 0);
//     const totalExperienceMonths = experienceYears * 12 + experienceMonths;

//     const formData = new FormData();

//     // 👤 Candidate info
//     formData.append("firstName", applyForm.firstName);
//     formData.append("lastName", applyForm.lastName);
//     formData.append("email", applyForm.email);
//     formData.append("mobileNumber", applyForm.mobile);
//     formData.append("location", applyForm.location || "");

//     // 🧠 Experience (NEW)
//     formData.append("experienceYears", experienceYears);
//     formData.append("experienceMonths", experienceMonths);
//     formData.append("totalExperienceMonths", totalExperienceMonths);

//     // 🏢 Company info
//     formData.append("companyName", selectedJob.companyName);
//     formData.append("companyId", selectedJob.companyId);
//     formData.append("companyEmail", selectedJob.companyEmail);
//     formData.append("companyMobile", selectedJob.companyMobile);

//     // 💼 Job info
//     formData.append("jobTitle", selectedJob.title);
//     formData.append("jobDescription", selectedJob.description);
//     formData.append("jobLocation", selectedJob.location);
//     formData.append("jobType", selectedJob.type);

//     formData.append(
//       "requiredSkills",
//       Array.isArray(selectedJob.skills)
//         ? selectedJob.skills.join(",")
//         : selectedJob.skills
//     );

//     // 📄 Resume
//     formData.append("resumeFile", applyForm.resume);

//     console.log("mnbvc ▶ Application submit started");
//     console.log("mnbvc ▶ Experience:", {
//       experienceYears,
//       experienceMonths,
//       totalExperienceMonths
//     });

//     // 🚀 UX FIRST: success toast after 1 sec
//     setTimeout(() => {
//       showSuccessToast();
//     }, 500);

//     setViewMode("grid")

//     console.log("mnbvc ▶ Payload preview:");
//     for (let [key, value] of formData.entries()) {
//     console.log(`mnbvc1 ▶ ${key}:`, value);
//     }

//     // 🌐 Fire & forget API call
//     fetch("https://rt.infomanav.in/8005/submit-application", {
//       method: "POST",
//       body: formData
//     })
//       .then(res => res.json())
//       .then(data => {
//         console.log("mnbvc ▶ API success:", data);
//       })
//       .catch(err => {
//         console.error("mnbvc ▶ API failed:", err);
//       });

//     // 🔄 Reset form
//     setApplyForm({
//       firstName: "",
//       lastName: "",
//       email: "",
//       mobile: "",
//       location: "",
//       resume: null,
//       experienceYears: "",
//       experienceMonths: ""
//     });

//   } catch (err) {
//     console.error("❌ Unexpected error:", err);
//   }
// };



const handleSubmitApplication = async () => {
  try {
    // NEW: Check if already applied in resumeMaster
    const resumeMasterRef = collection(db, "resumeMaster");
    const q = query(
      resumeMasterRef,
      where("jobId", "==", selectedJob.jobId),
      where("userEmail", "==", applyForm.email)
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      // Already applied → show toast + update session storage / applied state
        showToast(
          "warning",
          "You have already applied for this job.",
          "Already Applied"
        );

      // Update appliedJobIds + sessionStorage (same as success case)
      setAppliedJobIds((prev) => {
        if (prev.includes(selectedJob.jobId)) {
          return prev;
        }
        const updated = [...prev, selectedJob.jobId];
        sessionStorage.setItem("appliedJobs", JSON.stringify(updated));
        return updated;
      });

      return; // Stop here — do not proceed to submission
    }

    // 🔒 Validation
    if (
      !applyForm.firstName ||
      !applyForm.lastName ||
      !applyForm.email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(applyForm.email) ||
      !applyForm.mobile ||
      applyForm.mobile.length < 10 ||
      !applyForm.location ||
      !applyForm.resume
    ) {
      showToast(
        "warning",
        "Please fill all required fields and upload resume.",
        "Missing Fields"
      );
      return;
    }

    // Optimistic update + save to sessionStorage
    setAppliedJobIds((prev) => {
      if (prev.includes(selectedJob.jobId)) {
        return prev;
      }
      const updated = [...prev, selectedJob.jobId];
      sessionStorage.setItem("appliedJobs", JSON.stringify(updated));
      return updated;
    });

    const experienceYears = Number(applyForm.experienceYears || 0);
    const experienceMonths = Number(applyForm.experienceMonths || 0);
    const totalExperienceMonths = experienceYears * 12 + experienceMonths;

    const formData = new FormData();

    // 👤 Candidate info
    formData.append("firstName", applyForm.firstName);
    formData.append("lastName", applyForm.lastName);
    formData.append("email", applyForm.email);
    formData.append("mobileNumber", applyForm.mobile);
    formData.append("location", applyForm.location || "");

    // 🧠 Experience
    formData.append("experienceYears", experienceYears);
    formData.append("experienceMonths", experienceMonths);
    formData.append("totalExperienceMonths", totalExperienceMonths);

    // 🏢 Company info
    formData.append("companyName", selectedJob.companyName);
    formData.append("companyId", selectedJob.companyId);
    formData.append("companyEmail", selectedJob.companyEmail);
    formData.append("companyMobile", selectedJob.companyMobile);

    // 💼 Job info
    formData.append("jobTitle", selectedJob.title);
    formData.append("jobDescription", selectedJob.description);
    formData.append("jobLocation", selectedJob.location);
    formData.append("jobType", selectedJob.type);
    formData.append("jobId", selectedJob.jobId);

    formData.append(
      "requiredSkills",
      Array.isArray(selectedJob.skills)
        ? selectedJob.skills.join(",")
        : selectedJob.skills
    );

    // 📄 Resume
    formData.append("resumeFile", applyForm.resume);

    console.log("mnbvc ▶ Application submit started");
    console.log("mnbvc ▶ Experience:", {
      experienceYears,
      experienceMonths,
      totalExperienceMonths
    });

    // 🚀 UX FIRST: success toast after 1 sec
    setTimeout(() => {
      showSuccessToast();
    }, 500);

    setViewMode("grid");

    console.log("mnbvc ▶ Payload preview:");
    for (let [key, value] of formData.entries()) {
      console.log(`mnbvc1 ▶ ${key}:`, value);
    }

    // 🌐 Fire & forget API call
    fetch("https://rt.infomanav.in/8005/submit-application", {
      method: "POST",
      body: formData
    })
      .then(res => res.json())
      .then(data => {
        console.log("mnbvc ▶ API success:", data);
      })
      .catch(err => {
        console.error("mnbvc ▶ API failed:", err);
      });

    // 🔄 Reset form
    setApplyForm({
      firstName: "",
      lastName: "",
      email: "",
      mobile: "",
      location: "",
      resume: null,
      experienceYears: "",
      experienceMonths: ""
    });

  } catch (err) {
    console.error("❌ Unexpected error:", err);
  }
};









    return (
        <div className="career-page" 
        style={{ 
          background: companyInfo?.primaryColor ?? "#ffffff",
          height: companyInfo?.companySoftBan ? "100vh" : "auto",
          paddingTop: companyInfo?.companySoftBan ? "20vh" : "0"
          
          }}>

       
             {/* HEADER */}

             {companyInfo?.companySoftBan ? (
    // Candidate-facing message when company is restricted
    <div
      style={{
        background: "linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)",
        borderRadius: "16px",
        padding: "32px 24px",
        margin: "20px auto",
        maxWidth: "720px",
        textAlign: "center",
        boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
        border: "1px solid #e5e7eb",
      }}
    >
      <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>

      <h2
        style={{
          fontSize: "24px",
          fontWeight: 700,
          color: "#1f2937",
          margin: "0 0 16px",
        }}
      >
        Applications Temporarily Paused
      </h2>

      <p
        style={{
          fontSize: "16px",
          lineHeight: 1.6,
          color: "#4b5563",
          margin: "0 0 24px",
        }}
      >
        We're sorry — this company is not currently accepting new applications.  
        This is a temporary pause. Please check back later or explore other opportunities on the platform.
      </p>

      <p
        style={{
          fontSize: "14.5px",
          color: "#6b7280",
        }}
      >
        Thank you for your interest!
      </p>
    </div>
  ) : (
           <div>
             <header className="career-header"
            style={{ background: companyInfo?.primaryColor ?? "#ffffff" }}
            >
            <div className="logo">
                <img
                src={companyInfo?.logoUrl || jobs[0]?.companyLogo}
                alt={`${companySlug || "Company"} Logo`}
                onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = InfomanavLogo; // fallback if URL breaks
                }}
                style={{
                    maxHeight: "50px",          // adjust size to match your design
                    width: "auto",
                    objectFit: "contain",
                }}
                />
            </div>
            {/* <button className="upload-btn">Upload Your Resume</button> */}
            </header>

{viewMode === "grid" && (
  <>
    {/* HERO */}
    <section className="career-hero">
      <h1 style={{ color: companyInfo?.secondaryColor ?? "#FFAB49" }}>
        Join Our Team
      </h1>
      <p>
        Check out our current job openings to find thrilling career paths that align with your skills and passions. Every job post includes detailed information about the role, duties, and qualifications. We invite talented individuals, whether seasoned experts or recent graduates, from all backgrounds to become part of our team.
      </p>
    </section>

    {/* TABS */}
    <section className="career-tabs">
      <div
        style={{
          display: "flex",
          gap: "15px",
          background: "#ffffff",           // ← removed primaryColor
          padding: "10px",
          borderRadius: "100px",
          width: "98%",
          border: `1px solid ${(companyInfo?.secondaryColor ?? "#FFAB49")}30`,
        }}
      >
        {departments.map((dep, index) => (
          <button
            key={`${dep}-${index}`}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: activeTab === dep 
                ? (companyInfo?.secondaryColor ?? "#FFAB49") 
                : "#f4f4f4",
              color: activeTab === dep ? "#ffffff" : "#333",
              borderRadius: "80px",
              padding: "10px 0",
              border: "none",
              fontWeight: activeTab === dep ? "600" : "500",
              transition: "all 0.2s",
            }}
            className={activeTab === dep ? "active" : ""}
            onClick={() => {
              setActiveTab(dep);
              setCurrentPage(1);
            }}
          >
            {dep}
          </button>
        ))}
      </div>
    </section>

    {/* FILTERS */}
    <section className="career-filters" style={{ display: "flex", flexDirection: "column" }}>
      {/* LINE 1 */}
      <div
        style={{ width: "100%", display: "flex", gap: "15px", justifyContent: "space-between" }}
        className="filters-row primary-filters"
      >
        <input
          style={{ width: "36%" }}
          type="text"
          className="filter-search"
          placeholder="Search jobs"
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value);
            setCurrentPage(1);
          }}
        />

        <select
          style={{ width: "18%" }}
          className="filter-select"
          onChange={(e) => setFilters({ ...filters, location: e.target.value })}
          value={filters.location || ""}
        >
          <option value="">All Locations</option>
          {uniqueLocations.map((loc) => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </select>

        <select
          style={{ width: "18%" }}
          className="filter-select"
          onChange={(e) => setFilters({ ...filters, experience: e.target.value })}
        >
          <option value="">Experience</option>
          <option value="entry-level">Entry</option>
          <option value="mid-level">Mid</option>
          <option value="Senior">Senior</option>
        </select>

        <button
          style={{ width: "18%" }}
          className={`filter-btn ${showAdvancedFilters ? "active" : ""}`}
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
        >
          Advanced Filters
          <span className="arrow" style={{ color: companyInfo?.secondaryColor ?? "#FFAB49" }}>
            {showAdvancedFilters ? "▲" : "▼"}
          </span>
        </button>

        <button
          style={{ 
            width: "9%",
            background: companyInfo?.secondaryColor ?? "#FFAB49",
            color: "#fff",
          }}
          className="filter-clear"
          onClick={() => {
            setActiveTab("All");
            setSearchText("");
            setFilters({ location: "", experience: "", jobType: "" });
            setCurrentPage(1);
            setShowAdvancedFilters(false);
          }}
        >
          Clear
        </button>
      </div>

      {/* LINE 2 – ADVANCED FILTERS */}
      <div
  style={{ width: "100%" }}
  className={`advanced-filters ${showAdvancedFilters ? "open" : ""}`}
>
  <div style={{ display: "flex", width: "80%", gap: "10px" }}>

    {/* Employment Type */}
    <div style={{ width: "20%", marginTop:"12px" }}>
      <select
        style={{ width: "100%" }}
        className="filter-select"
        value={filters.employmentType || ""}
        onChange={(e) =>
          setFilters({ ...filters, employmentType: e.target.value })
        }
      >
        <option value="">Employment Type</option>
        <option value="full-time">Full-time</option>
        <option value="part-time">Part-time</option>
        <option value="contract">Contract</option>
      </select>
    </div>

    {/* Work Mode */}
    <div style={{ width: "20%", marginTop:"12px" }}>
      <select
        style={{ width: "100%" }}
        className="filter-select"
        value={filters.workArrangement || ""}
        onChange={(e) =>
          setFilters({ ...filters, workArrangement: e.target.value })
        }
      >
        <option value="">Work Mode</option>
        <option value="onsite">Onsite</option>
        <option value="hybrid">Hybrid</option>
        <option value="remote">Remote</option>
      </select>
    </div>

    {/* Date Posted */}
    <div style={{ width: "20%", marginTop:"12px" }}>
      <select
        style={{ width: "100%" }}
        className="filter-select"
        value={filters.datePosted || ""}
        onChange={(e) =>
          setFilters({ ...filters, datePosted: e.target.value })
        }
      >
        <option value="">Date Posted</option>
        <option value="1">Last 24 hours</option>
        <option value="7">Last 7 days</option>
        <option value="30">Last 30 days</option>
      </select>
    </div>

    {/* Salary Range Slider */}
    <div style={{ width: "40%", padding: "0 10px" }}>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "4px",
      fontSize: "13px",
      color: "#6b7280",
    }}
  >
    <span>Salary Range</span>
    <span
      style={{
        fontWeight: "500",
        color: companyInfo?.secondaryColor ?? "#FFAB49",
      }}
    >
      ₹{filters.salaryRange || 0}+
    </span>
  </div>

  <input
    type="range"
    min="0"
    max="200000"
    step="5000"
    value={filters.salaryRange || 0}
    onChange={(e) =>
      setFilters({ ...filters, salaryRange: Number(e.target.value) })
    }
    style={{
      width: "100%",
      height: "6px",
      appearance: "none",
      WebkitAppearance: "none",
      margin: "0",
      padding: "0",
      borderRadius: "6px",
      background: `linear-gradient(to right,
        ${companyInfo?.secondaryColor ?? "#FFAB49"} 0%,
        ${companyInfo?.secondaryColor ?? "#FFAB49"} ${
        ((filters.salaryRange || 0) / 200000) * 100
      }%,
        #E5E7EB ${((filters.salaryRange || 0) / 200000) * 100}%,
        #E5E7EB 100%)`,
      outline: "none",
    }}
  />

  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      fontSize: "11px",
      color: "#9CA3AF",
      marginTop: "2px",
    }}
  >
    <span>₹0</span>
    <span>₹200k+</span>
  </div>
</div>

  </div>

  {/* Showing jobs */}
  <div
    style={{
      display: "flex",
      justifyContent: "end",
      width: "18%",
      alignItems: "center",
    }}
  >
    <span
      style={{
        fontSize: "16px",
        color: companyInfo?.secondaryColor ?? "#FFAB49",
        fontWeight: "500",
      }}
    >
      Showing {filteredJobs.length} job
      {filteredJobs.length !== 1 ? "s" : ""}
    </span>
  </div>
</div>



    </section>

    {/* JOB CARDS */}
    <section className="career-jobs">
{/* Loading State */}
{loading && (
  <div
    style={{
      display: "flex",
      justifyContent:"space-between",
      gap: "20px",
      padding: "20px 0",
      width:"100%"
    }}
  >
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        style={{
          background: "#ffffff",
          borderRadius: "20px",
          border: "1px solid #E5E7EB",
          padding: "24px",
          animation: "pulse 1.5s infinite",
          width:"31%",
          minWidth: "280px",
          maxWidth: "30vw",
          height:"360px"
        }}
      >
        {/* Title */}
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
          <div
          style={{
            height: "50px",
            width: "40%",
            background: "#E5E7EB",
            borderRadius: "26px",
            marginBottom: "45px",
          }}
        />
        <div
          style={{
            height: "40px",
            width: "25%",
            background: "#E5E7EB",
            borderRadius: "26px",
            marginBottom: "45px",
          }}
        />
        </div>

        {/* Meta row */}
        <div
          style={{
            display: "flex",
            gap: "20px",
            marginBottom: "36px",
            justifyContent:"space-between"
          }}
        >
          <div style={{ height: "18px", width: "25%", background: "#E5E7EB", borderRadius: "6px" }} />
          <div style={{ height: "18px", width: "20%", background: "#E5E7EB", borderRadius: "6px" }} />
          <div style={{ height: "18px", width: "20%", background: "#E5E7EB", borderRadius: "6px" }} />
        </div>

        {/* Description */}
        <div
          style={{
            height: "14px",
            width: "98%",
            background: "#E5E7EB",
            borderRadius: "6px",
            marginBottom: "8px",
          }}
        />
        <div
          style={{
            height: "14px",
            width: "98%",
            background: "#E5E7EB",
            borderRadius: "6px",
            marginBottom: "8px",
          }}
        />
        <div
          style={{
            height: "14px",
            width: "80%",
            background: "#E5E7EB",
            borderRadius: "6px",
            marginBottom: "20px",
          }}
        />

        {/* Skills */}
        <div style={{ display: "flex", gap: "10px", marginBottom:"25px" }}>
          <div style={{ height: "22px", width: "70px", background: "#E5E7EB", borderRadius: "999px" }} />
          <div style={{ height: "22px", width: "80px", background: "#E5E7EB", borderRadius: "999px" }} />
          <div style={{ height: "22px", width: "60px", background: "#E5E7EB", borderRadius: "999px" }} />
        </div>

         <div
          style={{
            height: "38px",
            width: "98%",
            background: "#E5E7EB",
            borderRadius: "110px",
            marginBottom: "8px",
          }}
        />
      </div>
    ))}
  </div>
)}





{/* No Jobs Found */}
{!loading && paginatedJobs && paginatedJobs.length === 0 && (
  <div
    style={{
      textAlign: "center",
      padding: "70px 30px",
      background: "#ffffff",
      borderRadius: "20px",
      border: "1px solid #E5E7EB",
      maxWidth: "520px",
      margin: "auto",
      boxShadow: "0 12px 28px rgba(0,0,0,0.06)",
    }}
  >
    {/* Icon Container */}
    <div
      style={{
        width: "64px",
        height: "64px",
        margin: "0 auto 20px",
        borderRadius: "50%",
        background: "#ededed",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "26px",
          height: "26px",
          borderRadius: "6px",
          background: companyInfo?.secondaryColor,
          // background: "#FFAB49",
          opacity: 0.9,
        }}
      />
    </div>

    <h3
      style={{
        marginBottom: "10px",
        color: "#111",
        fontSize: "20px",
        fontWeight: "600",
      }}
    >
      No jobs found
    </h3>

    <p
      style={{
        color: "#6b7280",
        fontSize: "14px",
        lineHeight: "1.6",
        maxWidth: "360px",
        margin: "0 auto",
      }}
    >
      We couldn't find any opportunities at the moment.  
      Please try again later or adjust your filters.
    </p>
  </div>
)}




  {/* Jobs List */}
  {paginatedJobs && paginatedJobs.length > 0 &&
    paginatedJobs.map(job => (
      <div
        style={{ background: "#ffffff" }}
        className="job-card"
        key={job.Job_ID}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            minHeight: "83px",
            borderTopLeftRadius: "20px",
            borderTopRightRadius: "20px",
            borderBottom: "1px solid #E5E7EB",
            padding: "24px",
            background: "#ffffff",
          }}
        >
          <h3
            className="job-title"
            title={job.Job_Title}
            style={{ color: "#111" }}
          >
            {job.Job_Title}
          </h3>

          <span
            className="badge"
            style={{
              background: `${companyInfo?.secondaryColor ?? "#FFAB49"}22`,
              color: companyInfo?.secondaryColor ?? "#FFAB49",
            }}
          >
            {job.Job_Department}
          </span>
        </div>

        {/* Job meta */}
        <div className="job-meta">
          <div style={{ width: "33%" }}>
            <span style={{ paddingRight: "5px" }}>
              <img src={locationIcon} alt="" />
            </span>
            {job.Job_Location}
          </div>

          <div style={{ width: "30%", textAlign: "center" }}>
            <span style={{ paddingRight: "5px" }}>
              <img src={clockIcon} alt="" />
            </span>
            {job.Job_Type}
          </div>

          <div style={{ width: "30%", textAlign: "center" }}>
            <span style={{ paddingRight: "5px" }}>
              <img src={HourGlassIcon} alt="" />
            </span>
            {job.Job_Experience}
          </div>
        </div>

        {/* Description */}
        <div
          style={{
            padding: "12px 24px 5px 24px",
            marginBottom: "5px",
            maxHeight: "100px",
            minHeight: "100px",
            overflowY: "auto",
            background: "#ffffff",
          }}
        >
          <p
            className={`job-desc ${
              expandedJobId === job.Job_ID ? "job-desc-expanded" : ""
            }`}
          >
            {job.Job_Description}
          </p>

          {job.Job_Description.length > 120 && (
            <span
              className="read-more"
              onClick={() =>
                setExpandedJobId(
                  expandedJobId === job.Job_ID ? null : job.Job_ID
                )
              }
              style={{
                color: companyInfo?.secondaryColor ?? "#FFAB49",
              }}
            >
              {expandedJobId === job.Job_ID ? "Read Less" : "... Read More"}
            </span>
          )}
        </div>

        {/* Skills */}
        <div
          className="skills"
          style={{
            padding: "0px 24px 12px 24px",
            display: "flex",
            flexWrap: "wrap",
          }}
        >
          {job.Job_Required_Skills.slice(0, 3).map(skill => (
            <span
              key={skill}
              style={{
                background: `${companyInfo?.secondaryColor ?? "#FFAB49"}15`,
                color: companyInfo?.secondaryColor ?? "#FFAB49",
                padding: "4px 10px",
                borderRadius: "9999px",
                fontSize: "13px",
                marginRight: "8px",
                marginBottom: "8px",
              }}
            >
              {skill}
            </span>
          ))}

          {job.Job_Required_Skills.length > 3 && (
            <span
              style={{
                background: "#f1f5f9",
                color: "#64748b",
                padding: "4px 8px",
                borderRadius: "9999px",
                fontSize: "13px",
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
              }}
            >
              +{job.Job_Required_Skills.length - 3} more
            </span>
          )}
        </div>

        {/* View Details Button */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "12px 24px",
          }}
        >
          <button
            className="view-details-btn"
            onClick={() => {
              setSelectedJob(mapJobToDetails(job));
              setViewMode("details");
              console.log("Selected Job:", mapJobToDetails(job));
              console.log("Job:", job);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            style={{
              background: companyInfo?.secondaryColor ?? "#FFAB49",
              color: "#ffffff",
              border: "none",
            }}
          >
            View Details →
          </button>
        </div>
      </div>
    ))}
</section>

    {/* PAGINATION */}
   {!loading && paginatedJobs && paginatedJobs.length > 0 && (
  <section className="career-pagination">
    <button
      className="nav-btn"
      disabled={currentPage === 1}
      onClick={() => setCurrentPage(1)}
    >
      <MdKeyboardDoubleArrowLeft style={{ fontSize: "21px" }} />
    </button>

    <button
      className="nav-btn"
      disabled={currentPage === 1}
      onClick={() => setCurrentPage(currentPage - 1)}
    >
      <MdKeyboardArrowLeft style={{ fontSize: "21px" }} />
    </button>

    {Array.from({ length: totalPages }).map((_, i) => (
      <button
        key={i}
        className={`page-btn ${currentPage === i + 1 ? "active" : ""}`}
        onClick={() => setCurrentPage(i + 1)}
        style={{
          background:
            currentPage === i + 1
              ? companyInfo?.secondaryColor ?? "#FFAB49"
              : "transparent",
          color: currentPage === i + 1 ? "#fff" : "#333",
          border: currentPage === i + 1 ? "none" : "1px solid #ddd",
        }}
      >
        {i + 1}
      </button>
    ))}

    <button
      className="nav-btn"
      disabled={currentPage === totalPages}
      onClick={() => setCurrentPage(currentPage + 1)}
    >
      <MdKeyboardArrowRight style={{ fontSize: "21px" }} />
    </button>

    <button
      className="nav-btn"
      disabled={currentPage === totalPages}
      onClick={() => setCurrentPage(totalPages)}
    >
      <MdKeyboardDoubleArrowRight style={{ fontSize: "21px" }} />
    </button>
  </section>
)}

    {/* CTA footer */}
    <section className="career-cta"
    style={{ background: companyInfo?.primaryColor ?? "#ffffff" }}
    >
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}>
        <h2 style={{ color: companyInfo?.secondaryColor ?? "#FFAB49", paddingBottom: "10px" }}>
          Ready to Get Started?
        </h2>
        <p style={{ maxWidth: "65%" }}>
          Connect with us and discover how we can help you achieve your goals. We’re always looking for talented individuals to join our mission.
        </p>
      </div>

      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "15px",
      }}>
        <p style={{ color: "#575757", fontSize: "20px", fontWeight: "700" }}>
          Contact Info
        </p>
        <p>{companyInfo?.email}</p>
        <p>{companyInfo?.mobile}</p>
      </div>
    </section>
  </>
)}


{viewMode === "details" && selectedJob && (
  <>
    <div style={{ padding: "40px 60px", margin: "0 auto" }}>
      {/* Back Button */}
      <button
        onClick={() => {
          setViewMode("grid");
          setSelectedJob(null);
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "12px 20px",
          background: "#ffffff",                           // ← removed primaryColor
          border: `1px solid ${(companyInfo?.secondaryColor ?? "#FFAB49")}40`,
          borderRadius: "32px",
          fontSize: "14px",
          fontWeight: "500",
          color: "#374151",
          cursor: "pointer",
          marginBottom: "20px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M15 18L9 12L15 6"
            stroke={companyInfo?.secondaryColor ?? "#FFAB49"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Back
      </button>

      <div>
        <p style={{ color: "#575757", fontSize: "16px", padding: "10px" }}>
          Jobs
          <span style={{ padding: "0 15px" }}>\</span>
          <span style={{ color: companyInfo?.secondaryColor ?? "#FFAB49" }}>
            {selectedJob.title}
          </span>
        </p>
      </div>

      {/* Job Details Content – Main Card */}
      <div
        style={{
          background: "#ffffff",                           // ← removed primaryColor
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          border: `1px solid ${(companyInfo?.secondaryColor ?? "#FFAB49")}20`,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div>
              <div style={{ padding: "18px", borderRadius: "10px", color: companyInfo?.secondaryColor ?? "#FFAB49" }}>
                <FaBriefcase style={{ fontSize: "28px" }} />
              </div>
            </div>
            
            <div>
              <h1
                style={{
                  fontSize: "32px",
                  fontWeight: "700",
                  color: companyInfo?.secondaryColor ?? "#FFAB49",
                }}
              >
                {selectedJob.title}
              </h1>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <p>{companySlug}</p>
                <p
                  style={{
                    background: `${companyInfo?.secondaryColor ?? "#FFAB49"}15`,
                    color: companyInfo?.secondaryColor ?? "#FFAB49",
                    padding: "8px 16px",
                    borderRadius: "24px",
                    fontSize: "12px",
                    fontWeight: "600",
                    width: "fit-content",
                    marginTop: "0",
                  }}
                >
                  {selectedJob.status}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "16px" }}>
            <button
              style={{
                flex: 1,
                padding: "11px 18px",
                background: hasAppliedToThisJob
                  ? "#dcfce7"
                  : companyInfo?.secondaryColor ?? "#FFAB49",
                boxShadow: "0px 1.1px 2.2px 0px #1018280D",
                border: hasAppliedToThisJob
                  ? "1px solid #86efac"
                  : `1px solid ${companyInfo?.secondaryColor ?? "#FFAB49"}`,
                borderRadius: "112px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: hasAppliedToThisJob ? "not-allowed" : "pointer",
                color: hasAppliedToThisJob ? "#166534" : "#ffffff",
              }}
              disabled={hasAppliedToThisJob}
              onClick={() => {
                setViewMode("apply");
              }}
            >
              {hasAppliedToThisJob ? "✓ Applied" : "Apply Now"}
            </button>
          </div>
        </div>

        {/* Key Info Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "24px",
            paddingBottom: "20px",
            borderBottom: `2px solid ${(companyInfo?.secondaryColor ?? "#FFAB49")}20`,
          }}
        >
          <div
            style={{
              background: "#FAFAFA",                           // ← removed primaryColor
              padding: "20px",
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              border: `1px solid ${(companyInfo?.secondaryColor ?? "#FFAB49")}15`,
            }}
          >
            <div>
              <div style={{ padding: "18px 10px", borderRadius: "10px", color: companyInfo?.secondaryColor ?? "#FFAB49" }}>
                <IoLocationOutline style={{ fontSize: "24px" }} />
              </div>
            </div>
            <div>
              <div style={{ color: "#7C7C7C", fontSize: "12px" }}>Location</div>
              <div style={{ fontSize: "18px", fontWeight: "600", color: "#101828" }}>
                {selectedJob.location}
              </div>
            </div>
          </div>

          <div
            style={{
              background: "#FAFAFA",                           // ← removed primaryColor
              padding: "20px",
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              border: `1px solid ${(companyInfo?.secondaryColor ?? "#FFAB49")}15`,
            }}
          >
            <div>
              <div style={{ padding: "18px 10px", borderRadius: "10px", color: companyInfo?.secondaryColor ?? "#FFAB49" }}>
                <FaRegClock style={{ fontSize: "22px" }} />
              </div>
            </div>
            <div>
              <div style={{ color: "#7C7C7C", fontSize: "12px" }}>Job Type</div>
              <div style={{ fontSize: "18px", fontWeight: "600", color: "#101828" }}>
                {selectedJob.type}
              </div>
            </div>
          </div>

          <div
            style={{
              background: "#FAFAFA",                           // ← removed primaryColor
              padding: "20px",
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              border: `1px solid ${(companyInfo?.secondaryColor ?? "#FFAB49")}15`,
            }}
          >
            <div>
              <div style={{ padding: "18px 2px", borderRadius: "10px", color: companyInfo?.secondaryColor ?? "#FFAB49" }}>
                <MdCurrencyRupee style={{ fontSize: "22px" }} />
              </div>
            </div>
            <div>
              <div style={{ color: "#7C7C7C", fontSize: "12px" }}>Salary</div>
              <div style={{ fontSize: "18px", fontWeight: "600", color: "#101828" }}>
                {selectedJob.salary}
              </div>
            </div>
          </div>

          <div
            style={{
              background: "#FAFAFA",                           // ← removed primaryColor
              padding: "20px",
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              border: `1px solid ${(companyInfo?.secondaryColor ?? "#FFAB49")}15`,
            }}
          >
            <div>
              <div style={{ padding: "18px 10px", borderRadius: "10px", color: companyInfo?.secondaryColor ?? "#FFAB49" }}>
                <TfiFiles style={{ fontSize: "22px" }} />
              </div>
            </div>
            <div>
              <div style={{ color: "#7C7C7C", fontSize: "12px" }}>Applicants</div>
              <div style={{ fontSize: "18px", fontWeight: "600", color: "#101828" }}>
                {selectedJob.applicants}
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <img src={PostedDaysAgo} alt="" />
            <span style={{ paddingLeft: "5px" }}>
              {getPostedDaysAgoText(selectedJob.jobCreatedAt)}
            </span>
            <span
              style={{
                paddingLeft: "20px",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <img src={ApplicationsIcon2} alt="" style={{ height: "14px" }} />
              <span>{selectedJob.applicants} Applications</span>
            </span>
          </div>
        </div>
      </div>

      {/* About this role */}
      <div
        style={{
          background: "#ffffff",                           // ← removed primaryColor
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          border: `1px solid ${(companyInfo?.secondaryColor ?? "#FFAB49")}20`,
          marginTop: "10px",
        }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: 20,
            lineHeight: "120%",
            letterSpacing: "0%",
            color: companyInfo?.secondaryColor ?? "#FFAB49",
          }}
        >
          About this role
        </div>
        <div style={{ color: "#575757", marginTop: "10px" }}>
          {selectedJob.description}
        </div>
      </div>

      {/* Requirements */}
      <div
        style={{
          background: "#ffffff",                           // ← removed primaryColor
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          border: `1px solid ${(companyInfo?.secondaryColor ?? "#FFAB49")}20`,
          marginTop: "10px",
        }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: 20,
            lineHeight: "120%",
            letterSpacing: "0%",
            color: companyInfo?.secondaryColor ?? "#FFAB49",
          }}
        >
          Requirements
        </div>
        <div style={{ color: "#575757", marginTop: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ borderRadius: "10px", color: companyInfo?.secondaryColor ?? "#FFAB49" }}>
              <LuCircleCheckBig style={{ fontSize: "22px" }} />
            </div>
            <p>{selectedJob.experience}</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "10px" }}>
            <div style={{ borderRadius: "10px", color: companyInfo?.secondaryColor ?? "#FFAB49" }}>
              <LuCircleCheckBig style={{ fontSize: "22px" }} />
            </div>
            <p>Skills like: {selectedJob.skills}</p>
          </div>
          {Array.isArray(selectedJob.responsibilities) &&
            selectedJob.responsibilities.map((respItem, respIndex) => (
              <div
                key={`req-resp-${respIndex}`}
                style={{
                  color: "#575757",
                  marginTop: "10px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <div style={{ borderRadius: "10px", color: companyInfo?.secondaryColor ?? "#FFAB49" }}>
                  <LuCircleCheckBig style={{ fontSize: "22px" }} />
                </div>
                <p>{respItem}</p>
              </div>
            ))}
        </div>
      </div>

      {/* Required Skills */}
      <div
        style={{
          background: "#ffffff",                           // ← removed primaryColor
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          border: `1px solid ${(companyInfo?.secondaryColor ?? "#FFAB49")}20`,
          marginTop: "10px",
        }}
      >
        <h3
          style={{
            fontSize: "20px",
            fontWeight: "600",
            color: companyInfo?.secondaryColor ?? "#FFAB49",
            margin: "0 0 16px 0",
          }}
        >
          Required Skills
        </h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
          {selectedJob.skills.split(", ").map((skill, idx) => (
            <span
              key={idx}
              style={{
                background: `${companyInfo?.secondaryColor ?? "#FFAB49"}15`,
                color: companyInfo?.secondaryColor ?? "#FFAB49",
                padding: "10px 20px",
                borderRadius: "12px",
                fontSize: "14px",
                fontWeight: "500",
                border: `1px solid ${(companyInfo?.secondaryColor ?? "#FFAB49")}30`,
              }}
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Benefits & Perks */}
      <div
        style={{
          background: "#ffffff",                           // ← removed primaryColor
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          border: `1px solid ${(companyInfo?.secondaryColor ?? "#FFAB49")}20`,
          marginTop: "10px",
        }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: 20,
            lineHeight: "120%",
            color: companyInfo?.secondaryColor ?? "#FFAB49",
          }}
        >
          Benefits & Perks
        </div>

        {Array.isArray(selectedJob.benefits) && selectedJob.benefits.length > 0 ? (
          selectedJob.benefits.reduce((rows, benefit, index) => {
            if (index % 2 === 0) {
              rows.push(
                <div
                  key={index}
                  style={{
                    color: "#575757",
                    marginTop: "10px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <div
                    style={{
                      width: "50%",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <div style={{ borderRadius: "10px", color: companyInfo?.secondaryColor ?? "#FFAB49" }}>
                      <LuCircleCheckBig style={{ fontSize: "22px" }} />
                    </div>
                    <p>{benefit}</p>
                  </div>

                  {selectedJob.benefits[index + 1] && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <div style={{ borderRadius: "10px", color: companyInfo?.secondaryColor ?? "#FFAB49" }}>
                        <LuCircleCheckBig style={{ fontSize: "22px" }} />
                      </div>
                      <p>{selectedJob.benefits[index + 1]}</p>
                    </div>
                  )}
                </div>
              );
            }
            return rows;
          }, [])
        ) : (
          <div style={{ color: "#575757", marginTop: "10px" }}>
            No benefits listed
          </div>
        )}
      </div>

      {/* About Us */}
      <div
        style={{
          background: "#ffffff",                           // ← removed primaryColor
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          border: `1px solid ${(companyInfo?.secondaryColor ?? "#FFAB49")}20`,
          marginTop: "10px",
          marginBottom: "50px",
        }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: 20,
            lineHeight: "120%",
            letterSpacing: "0%",
            color: companyInfo?.secondaryColor ?? "#FFAB49",
          }}
        >
          About Us
        </div>
        <div style={{ color: "#575757", marginTop: "10px", display: "flex", alignItems: "center", gap: "10px" }}>
          <p>{selectedJob.companyAboutUs}</p>
        </div>
      </div>
    </div>
  </>
)}

{viewMode === "apply" && selectedJob && (
  <>
    <div style={{ padding: "40px 60px", margin: "0 auto" }}>
      {/* Back Button */}
      <button
        onClick={() => {
          setViewMode("details");
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "12px 20px",
          background: "#ffffff",
          border: `1px solid ${(companyInfo?.secondaryColor ?? "#FFAB49")}40`,
          borderRadius: "32px",
          fontSize: "14px",
          fontWeight: "500",
          color: "#374151",
          cursor: "pointer",
          marginBottom: "20px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M15 18L9 12L15 6"
            stroke={companyInfo?.secondaryColor ?? "#FFAB49"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Back
      </button>

      <div>
        <p style={{ color: "#575757", fontSize: "16px", padding: "10px" }}>
          Jobs <span style={{ padding: "0 15px" }}>\</span>
          <span style={{ color: companyInfo?.secondaryColor ?? "#FFAB49" }}>
            {selectedJob.title}
          </span>
          <span style={{ padding: "0 15px" }}>\</span>
          <span style={{ color: companyInfo?.secondaryColor ?? "#FFAB49" }}>
            Apply Now
          </span>
        </p>
      </div>

      <div className="apply-header">
        <div 
          className="apply-header-heading"
          style={{ color: companyInfo?.secondaryColor ?? "#FFAB49" }}
        >
          Apply for {selectedJob.title}
        </div>
        <div className="apply-header-subheading">
          <div>
            <span style={{ paddingRight: "5px" }}>
              <img src={locationIcon} alt="" />
            </span>
            {selectedJob.location}
          </div>
          <div 
            className="badge" 
            style={{ 
              color: companyInfo?.secondaryColor ?? "#FFAB49", 
              background: `${companyInfo?.secondaryColor ?? "#FFAB49"}15`, 
              borderRadius: "100px" 
            }}
          >
            {selectedJob.department}
          </div>
        </div>
      </div>

      {/* Job Form */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "12px",
          padding: "24px",
          border: `1px solid ${(companyInfo?.secondaryColor ?? "#FFAB49")}20`,
        }}
      >
        {/* Row 1 */}
        <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
          <div style={{ width: "33%" }}>
            <label>
              First name <span className="redStar">*</span>
            </label>
            <input
              className="apply-input"
              placeholder="Enter your first Name"
              value={applyForm.firstName}
              onChange={(e) => setApplyForm({ ...applyForm, firstName: e.target.value })}
              onFocus={(e) => {
                e.target.style.borderColor = companyInfo?.secondaryColor ?? "#FFAB49";
                e.target.style.boxShadow = `0 0 0 3px ${(companyInfo?.secondaryColor ?? "#FFAB49")}33`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#d1d5db";
                e.target.style.boxShadow = "none";
              }}
            />
            {!applyForm.firstName && (
              <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px", display: "block" }}>
                First name is required
              </span>
            )}
          </div>

          <div style={{ width: "33%" }}>
            <label>
              Last Name <span className="redStar">*</span>
            </label>
            <input
              className="apply-input"
              placeholder="Enter your last Name"
              value={applyForm.lastName}
              onChange={(e) => setApplyForm({ ...applyForm, lastName: e.target.value })}
              onFocus={(e) => {
                e.target.style.borderColor = companyInfo?.secondaryColor ?? "#FFAB49";
                e.target.style.boxShadow = `0 0 0 3px ${(companyInfo?.secondaryColor ?? "#FFAB49")}33`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#d1d5db";
                e.target.style.boxShadow = "none";
              }}
            />
            {!applyForm.lastName && (
              <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px", display: "block" }}>
                Last name is required
              </span>
            )}
          </div>

          <div style={{ width: "33%" }}>
            <label>
              Email Address <span className="redStar">*</span>
            </label>
            <input
              className="apply-input"
              placeholder="Enter your email address"
              value={applyForm.email}
              onChange={(e) => setApplyForm({ ...applyForm, email: e.target.value })}
              onFocus={(e) => {
                e.target.style.borderColor = companyInfo?.secondaryColor ?? "#FFAB49";
                e.target.style.boxShadow = `0 0 0 3px ${(companyInfo?.secondaryColor ?? "#FFAB49")}33`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#d1d5db";
                e.target.style.boxShadow = "none";
              }}
            />
            {!applyForm.email && (
              <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px", display: "block" }}>
                Email is required
              </span>
            )}
            {applyForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(applyForm.email) && (
              <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px", display: "block" }}>
                Please enter a valid email address
              </span>
            )}
          </div>
        </div>

        {/* Row 2 */}
        <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
          <div style={{ width: "50%" }}>
            <label>
              Location <span className="redStar">*</span>
            </label>
            <input
              className="apply-input"
              placeholder="Location"
              value={applyForm.location}
              onChange={(e) => setApplyForm({ ...applyForm, location: e.target.value })}
              onFocus={(e) => {
                e.target.style.borderColor = companyInfo?.secondaryColor ?? "#FFAB49";
                e.target.style.boxShadow = `0 0 0 3px ${(companyInfo?.secondaryColor ?? "#FFAB49")}33`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#d1d5db";
                e.target.style.boxShadow = "none";
              }}
            />
            {!applyForm.location && (
              <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px", display: "block" }}>
                Location is required
              </span>
            )}
          </div>

          <div style={{ width: "50%" }}>
            <label>
              Mobile Number <span className="redStar">*</span>
            </label>
            <input
              className="apply-input"
              placeholder="Enter your mobile number"
              value={applyForm.mobile}
              onChange={(e) => setApplyForm({ ...applyForm, mobile: e.target.value })}
              onFocus={(e) => {
                e.target.style.borderColor = companyInfo?.secondaryColor ?? "#FFAB49";
                e.target.style.boxShadow = `0 0 0 3px ${(companyInfo?.secondaryColor ?? "#FFAB49")}33`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#d1d5db";
                e.target.style.boxShadow = "none";
              }}
              type="tel"
              maxLength={15}
            />
            {!applyForm.mobile && (
              <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px", display: "block" }}>
                Mobile number is required
              </span>
            )}
            {applyForm.mobile && applyForm.mobile.length < 10 && (
              <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px", display: "block" }}>
                Mobile number must be at least 10 digits
              </span>
            )}
          </div>
        </div>

        {/* Experience */}
        <div style={{ marginBottom: "24px" }}>
          <label>
            Experience <span className="redStar">*</span>
          </label>
          <span style={{ fontSize: "12px", color: "#64748b", display: "block", marginBottom: "8px" }}>
            (Total professional experience — 0+0 allowed for freshers)
          </span>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 120px" }}>
              <label style={{ fontSize: "12px", fontWeight: 500, color: "#475569", marginBottom: "4px", display: "block" }}>
                Years
              </label>
              <input
                className="apply-input"
                type="number"
                min="0"
                placeholder="0"
                value={applyForm.experienceYears}
                onFocus={(e) => {
                  e.target.style.borderColor = companyInfo?.secondaryColor ?? "#FFAB49";
                  e.target.style.boxShadow = `0 0 0 3px ${(companyInfo?.secondaryColor ?? "#FFAB49")}33`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#d1d5db";
                  e.target.style.boxShadow = "none";
                }}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || (!isNaN(val) && Number(val) >= 0)) {
                    setApplyForm({
                      ...applyForm,
                      experienceYears: val === "" ? "" : Number(val),
                    });
                  }
                }}
                style={{
                  width: "100%",
                  height: "44px",
                  padding: "14px 18px",
                  borderRadius: "102px",
                  border: "1px solid #d1d5db",
                  fontSize: "14px",
                  background: "#ffffff",
                }}
              />
            </div>

            <div style={{ flex: "1 1 120px" }}>
              <label style={{ fontSize: "12px", fontWeight: 500, color: "#475569", marginBottom: "4px", display: "block" }}>
                Months
              </label>
              <input
                className="apply-input"
                type="number"
                min="0"
                max="11"
                placeholder="0"
                value={applyForm.experienceMonths}
                onFocus={(e) => {
                  e.target.style.borderColor = companyInfo?.secondaryColor ?? "#FFAB49";
                  e.target.style.boxShadow = `0 0 0 3px ${(companyInfo?.secondaryColor ?? "#FFAB49")}33`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#d1d5db";
                  e.target.style.boxShadow = "none";
                }}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || (!isNaN(val) && Number(val) >= 0 && Number(val) <= 11)) {
                    setApplyForm({
                      ...applyForm,
                      experienceMonths: val === "" ? "" : Number(val),
                    });
                  }
                }}
                style={{
                  width: "100%",
                  height: "44px",
                  padding: "14px 18px",
                  borderRadius: "102px",
                  border: "1px solid #d1d5db",
                  fontSize: "14px",
                  background: "#ffffff",
                }}
              />
            </div>
          </div>

          {/* Fresher helper text */}
          {applyForm.experienceYears === "0" && applyForm.experienceMonths === "0" && (
            <div style={{
              color: companyInfo?.secondaryColor ?? "#FFAB49",
              fontSize: "13px",
              marginTop: "8px",
              textAlign: "center",
              fontStyle: "italic",
            }}>
              Fresher / 0 experience — eligible for entry-level roles
            </div>
          )}

          {/* Error if both completely empty */}
          {applyForm.experienceYears === "" && applyForm.experienceMonths === "" && (
            <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px", display: "block" }}>
              Experience (years/months) is required
            </span>
          )}
        </div>

        {/* Upload Box */}
        <div className="upload-box">
          <input
            type="file"
            id="resumeUpload"
            accept=".pdf,.doc,.docx"
            style={{ display: "none" }}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setApplyForm({ ...applyForm, resume: e.target.files[0] });
              }
            }}
          />

          <label htmlFor="resumeUpload" style={{ cursor: "pointer", display: "block" }}>
            <div style={{ fontSize: "24px", color: companyInfo?.secondaryColor ?? "#FFAB49" }}>⬇</div>
            <p>or drag and drop your file here</p>
            <p className="muted">PDF • DOC • DOCX • Max file size: 5MB</p>

            <button
              type="button"
              className="resume-btn-outline"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                document.getElementById("resumeUpload")?.click();
              }}
              style={{
                border: `1px solid ${companyInfo?.secondaryColor ?? "#FFAB49"}`,
                color: companyInfo?.secondaryColor ?? "#FFAB49",
              }}
            >
              Upload Resume
            </button>
          </label>

          {applyForm.resume && (
            <p style={{ marginTop: "10px", color: "#575757" }}>
              Selected file: <strong>{applyForm.resume.name}</strong>
            </p>
          )}

          {!applyForm.resume && (
            <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px", display: "block" }}>
              Resume upload is required
            </span>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <div style={{ display: "flex", justifyContent: "end", alignItems: "center", marginTop: "30px", paddingRight: "10px" }}>
        <button
          className="apply-btn-submit-application"
          onClick={handleSubmitApplication}
          disabled={
            hasAppliedToThisJob ||
            !applyForm.firstName ||
            !applyForm.lastName ||
            !applyForm.email ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(applyForm.email) ||
            !applyForm.mobile ||
            applyForm.mobile.length < 10 ||
            !applyForm.location ||
            !applyForm.resume ||
            (applyForm.experienceYears === "" && applyForm.experienceMonths === "")
          }
          style={{
            opacity:
              hasAppliedToThisJob ||
              (!applyForm.firstName ||
              !applyForm.lastName ||
              !applyForm.email ||
              !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(applyForm.email) ||
              !applyForm.mobile ||
              applyForm.mobile.length < 10 ||
              !applyForm.location ||
              !applyForm.resume ||
              (applyForm.experienceYears === "" && applyForm.experienceMonths === ""))
                ? 0.6
                : 1,

            cursor:
              hasAppliedToThisJob ||
              (!applyForm.firstName ||
              !applyForm.lastName ||
              !applyForm.email ||
              !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(applyForm.email) ||
              !applyForm.mobile ||
              applyForm.mobile.length < 10 ||
              !applyForm.location ||
              !applyForm.resume ||
              (applyForm.experienceYears === "" && applyForm.experienceMonths === ""))
                ? "not-allowed"
                : "pointer",

            background: hasAppliedToThisJob 
              ? "#dcfce7" 
              : companyInfo?.secondaryColor ?? "#FFAB49",
            color: hasAppliedToThisJob ? "#166534" : "#ffffff",
            border: hasAppliedToThisJob 
              ? "1px solid #86efac" 
              : `1px solid ${companyInfo?.secondaryColor ?? "#FFAB49"}`,
            fontWeight: hasAppliedToThisJob ? "600" : "600",
          }}
        >
          {hasAppliedToThisJob ? "✓ Applied" : "Submit Application"}
        </button>
      </div>
    </div>
  </>
)}





            {/* MAIN FOOTER */}
            <footer className="career-footer">
                <p>© 2025 Stolity. All rights reserved.</p>
                <div style={{display:"flex", justifyContent:"center", alignItems:"center", gap:"25px"}}>
                    <a href="/terms-and-conditions">Terms of Service</a>
                    <a href="/privacy-policy">Privacy Policy</a>
                </div>
            </footer>
           </div>

            )}
       </div>

       
    );
};

export default CareerJobListing;
