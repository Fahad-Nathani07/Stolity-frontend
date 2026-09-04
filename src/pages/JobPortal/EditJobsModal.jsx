// PostNewJobsModal.jsx - COMPLETE FIXED VERSION
import { useEffect, useMemo, useState } from "react";
import Select from "react-select";  // ✅ ADDED react-select import
import "../../css/PostNewJobsModal.css";
import Calender1 from "../../images/Calender1.svg"
import eyeIcon from "../../images/eyeIcon.svg"
import SaveChanges from "../../images/SaveChanges.svg"
import TimeIcon from "../../images/TimeIcon.svg"
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";


const EditJobsModal = ({ open, onClose, job, setTriggerFetchJobs, companyLocations, companyJobs = [], showToast }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [skillInput, setSkillInput] = useState("");


  const [filteredTitles, setFilteredTitles] = useState([]);
  const [filteredDepartments, setFilteredDepartments] = useState([]);
  const [errors, setErrors] = useState({});

 
  // FIX: Initialize formData when job changes
  const [formData, setFormData] = useState({
    title: "",
    department: "",
    employmentType: "",
    experienceLevel: "",
    workArrangement: "",
    location: "",
    applicationDeadline: "",
    salaryMin: "",
    salaryMax: "",
    salaryType: "",
    jobType: "",
    positions: "",
    experienceYears: "",
    skills: [],
    jobDescription: "",
    responsibilities: [""],
    benefits: [""],
  });

  // Populate form when job prop changes
useEffect(() => {
  if (open && job) {
    setFormData({
      title: job.jobTitle || "",
      department: job.department || "",
      employmentType: job.employmentType || "",
      experienceLevel: job.experienceLevel || "",
      workArrangement: job.workArrangement || "",
      location: job.location || "",
      applicationDeadline: job.applicationDeadline || "",

      salaryMin: job.salary?.min || "",
      salaryMax: job.salary?.max || "",
      salaryType: job.salary?.type || "",

      positions: job.positions || "",
      experienceYears: job.experienceYears || "",

      skills: Array.isArray(job.requiredSkills) ? job.requiredSkills : [],

      jobDescription: job.jobDescription || "",
      responsibilities: job.responsibilities?.length ? job.responsibilities : [""],
      benefits: job.benefits?.length ? job.benefits : [""],
    });
  }
}, [job, open]);


// Update suggestions when user types
const handleTitleChange = (value) => {
  handleInputChange("title", value); // your existing handler

  if (!value.trim()) {
    // Empty input → show ALL suggestions
    setFilteredTitles(jobTitleSuggestions);
  } else {
    // Filter based on what user typed (case-insensitive)
    const lowerValue = value.toLowerCase().trim();
    const matches = jobTitleSuggestions.filter(title =>
      title.toLowerCase().includes(lowerValue)
    );
    setFilteredTitles(matches);
  }
};


const handleDepartmentChange = (value) => {
  handleInputChange("department", value);

  if (!value.trim()) {
    // Empty → show all when focused
    setFilteredDepartments(departmentSuggestions);
  } else {
    const lowerValue = value.toLowerCase().trim();
    const matches = departmentSuggestions.filter(dept =>
      dept.toLowerCase().includes(lowerValue)
    );
    setFilteredDepartments(matches);
  }
};

const departmentSuggestions = useMemo(() => {
  if (!companyJobs?.length) return [];

  const depts = companyJobs
    .map(job => job.department?.trim() || job.dept?.trim() || "")
    .filter(Boolean);

  return [...new Set(depts)].sort((a, b) => a.localeCompare(b));
}, [companyJobs]);

const jobTitleSuggestions = useMemo(() => {
  if (!companyJobs.length) return [];

  // Get unique, non-empty, trimmed titles
  const titles = companyJobs
    .map(job => job.jobTitle?.trim() || job.title?.trim() || "")
    .filter(Boolean);

  // Remove duplicates and sort alphabetically
  return [...new Set(titles)].sort();
}, [companyJobs]);


  if (!open) return null;

  const tabs = [
    { id: 0, title: "Basic information", icon: "ℹ️" },
    { id: 1, title: "Job details", icon: "📋" },
    { id: 2, title: "Description & requirements", icon: "📝" },
    { id: 3, title: "Compensation & benefits", icon: "💰" },
  ];

  // ✅ Basic Information options (for consistency)
  const employmentTypeOptions = [
    { label: "Full-time", value: "full-time" },
    { label: "Part-time", value: "part-time" },
    { label: "Contract", value: "contract" }
  ];

  const experienceLevelOptions = [
    { label: "Entry Level (0-2 yrs)", value: "entry-level" },
    { label: "Mid Level (2-5 yrs)", value: "mid-level" },
    { label: "Senior Level (5+ yrs)", value: "senior-level" }
  ];

  const workArrangementOptions = [
    { label: "Remote", value: "remote" },
    { label: "Hybrid", value: "hybrid" },
    { label: "Onsite", value: "onsite" }
  ];

  // Job Details options
  const salaryTypeOptions = [
    { label: "Per Year", value: "per-year" },
    { label: "Per Month", value: "per-month" },
    { label: "Fixed", value: "fixed" },
    { label: "Negotiable", value: "negotiable" }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };


  const handleUpdateJob = async () => {
  if (!job?.id) return;

  let experienceYears = "";
  if (formData.experienceLevel === "entry-level") experienceYears = "0-1";
  if (formData.experienceLevel === "mid-level") experienceYears = "2-5";
  if (formData.experienceLevel === "senior-level") experienceYears = "5+";

  const payload = {
    jobTitle: formData.title,
    positions: formData.title,
    department: formData.department,

    employmentType: formData.employmentType,
    jobType: formData.employmentType,

    experienceLevel: formData.experienceLevel,
    experienceYears,

    workArrangement: formData.workArrangement,
    location: formData.location,
    applicationDeadline: formData.applicationDeadline,

    salary: {
      min: formData.salaryMin,
      max: formData.salaryMax,
      type: formData.salaryType,
    },

    requiredSkills: formData.skills,
    responsibilities: formData.responsibilities.filter(Boolean),
    benefits: formData.benefits.filter(Boolean),

    jobDescription: formData.jobDescription,

    updatedAt: serverTimestamp(),
  };

  try {
    await updateDoc(doc(db, "jobMaster", job.id), payload);
    console.log("✅ Job updated successfully");
    setTriggerFetchJobs(prev => prev + 1); // trigger refresh

    onClose(); // close modal
    setActiveTab(0)
    showToast("success","Job updated successfully")
  } catch (err) {
    console.error("❌ Update failed:", err);
  }
};


const addSkill = () => {
  const value = skillInput.trim();
  if (!value) return;

  if (!formData.skills.includes(value)) {
    setFormData(prev => ({
      ...prev,
      skills: [...prev.skills, value],
    }));
  }

  setSkillInput("");
};

const removeSkill = (index) => {
  setFormData(prev => ({
    ...prev,
    skills: prev.skills.filter((_, i) => i !== index),
  }));
};



  // const nextTab = () => {
  //   if (activeTab < 3) setActiveTab(activeTab + 1);
  // };
  const nextTab = () => {

  // =========================
  // TAB 0 → TAB 1
  // =========================
  if (activeTab === 0) {
    const newErrors = {};

    if (!formData.title?.trim()) newErrors.title = "Job title is required";
    if (!formData.department?.trim()) newErrors.department = "Department is required";
    if (!formData.location) newErrors.location = "Location is required";
    if (!formData.employmentType) newErrors.employmentType = "Employment type is required";
    if (!formData.experienceLevel) newErrors.experienceLevel = "Experience level is required";
    if (!formData.workArrangement) newErrors.workArrangement = "Work arrangement is required";
    if (!formData.applicationDeadline) newErrors.applicationDeadline = "Application deadline is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast("warning", "Please fill all required fields before continuing.");
      return;
    }

    setErrors({});
  }

  // =========================
  // TAB 1 → TAB 2
  // =========================
 if (activeTab === 1) {
  const newErrors = {};

  if (!formData.skills?.length)
    newErrors.skills = "Please add at least one required skill";

  if (!formData.salaryMin)
    newErrors.salaryMin = "Minimum salary is required";

  if (!formData.salaryMax)
    newErrors.salaryMax = "Maximum salary is required";

  if (!formData.salaryType)
    newErrors.salaryType = "Please select salary type";

  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    showToast("warning", "Please complete salary and skills before continuing.");
    return;
  }

  setErrors({});
}

  // =========================
  // TAB 2 → TAB 3
  // =========================
  if (activeTab === 2) {
    const newErrors = {};

    if (!formData.jobDescription?.trim()) {
      newErrors.jobDescription = "Job description is required";
    }

    const validResponsibilities = formData.responsibilities.filter(r => r.trim() !== "");

    if (validResponsibilities.length === 0) {
      newErrors.responsibilities = "Please add at least one responsibility";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast("warning", "Please complete job description and responsibilities.");
      return;
    }

    setErrors({});
  }

  // =========================
  // MOVE TO NEXT TAB
  // =========================
  if (activeTab < 3) {
    setActiveTab(activeTab + 1);
  }
};

  const prevTab = () => {
    if (activeTab > 0) setActiveTab(activeTab - 1);
  };

  // ✅ Custom styles for react-select (FIXES no-undef error)
  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      minHeight: '48px',
      border: state.isFocused ? '1px solid #FFAB49' : '1px solid #f3f4f6',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(249, 115, 22, 0.08)' : 'none',
      borderRadius: '116px',
      fontSize: '16px',
      backgroundColor: '#fff',
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#FFAB49' : state.isFocused ? 'rgba(249, 115, 22, 0.08)' : '#fff',
      color: state.isSelected ? '#fff' : '#333',
      padding: '12px 16px',
      fontSize: '16px'
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: '#FFAB49',
      borderRadius: '20px',
      padding: '4px 12px'
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: 'white',
      fontSize: '14px'
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#989898'
    }),
    indicatorSeparator: () => ({
      display: 'none'
    }),
    menu: (provided) => ({
      ...provided,
      marginTop: '4px',
      borderRadius: '8px',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
      zIndex: 9999
    })
  };

  return (
    <div className="post-jobs-overlay" onClick={()=>{
      onClose();
      setActiveTab(0);
     }}>
      <div 
      className="post-jobs-container" 
      style={{maxHeight:"90vh", overflow:"auto"}}
      onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="post-jobs-header">
          <div className="header-left">
            <span className="header-icon">
              <img src={Calender1} alt="" />
            </span>
            <h2>Edit Jobs</h2>
          </div>
          <button className="close-btn" onClick={()=>{
      onClose();
      setActiveTab(0);
     }}>×</button>
        </div>

        {/* Top Bar */}
        <div className="post-jobs-topbar">
          <div className="topbar-title">
            <div>
              <p className="topbar-Subtitle1">Edit Job Posting</p>
              <p className="topbar-Subtitle2">Update the details for "{formData?.title}"</p>
            </div>
            {/* <div style={{display:"flex", gap:"10px"}}>
              <button className="preview-btn"  onClick={()=> setActiveTab(3)}>
                <img src={eyeIcon} alt="" /> 
                <span style={{paddingLeft: "5px"}}>Preview</span>
              </button>
              <button className="preview-btn2">
                <img src={SaveChanges} alt="" />
                <span style={{paddingLeft: "5px"}}>Publish Job</span>
              </button>
            </div> */}
          </div>
        </div>

        {/* Progress Bar Tabs */}
        <div className="progress-tabs-container">
          <div className="progress-bar-bg">
            <div 
              className="progress-fill" 
              style={{ width: `${(activeTab + 1) * 25}%` }}
            />
          </div>
          
          <div className="tabs-row">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`progress-tab ${activeTab === tab.id ? 'active' : ''}`}
                // onClick={() => setActiveTab(tab.id)}
                style={{cursor:"default"}}
              >
                <span className="tab-label">{tab.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="dropdown-container" style={{ position: 'relative', zIndex: 10000 }}>
          <div className="tab-content"
          style={{maxHeight: "450px"}}
          >
            {/* Tab 1: Basic Information - Updated with react-select */}
      
      
      
      
{activeTab === 0 && (
  <div className="tab-panel">

    {/* Row 1: Job Title + Department */}
    <div className="input-row">

      {/* Job Title */}
      <div className="input-group" style={{ position: "relative" }}>
        <label className="input-label">
          Job Title <span className="required">*</span>
        </label>

        <input
          type="text"
          value={formData.title}
          onChange={(e) => {
            handleTitleChange(e.target.value);
            setErrors(prev => ({ ...prev, title: "" }));
          }}
          onFocus={() => {
            if (!formData.title.trim()) {
              setFilteredTitles(jobTitleSuggestions);
            }
          }}
          onBlur={() => {
            setTimeout(() => {
              setFilteredTitles([]);
            }, 200);
          }}
          placeholder="e.g. Infomanav Frontend Developer"
          className={errors.title ? "error" : ""}
        />

        {errors.title && (
          <p className="field-error">{errors.title}</p>
        )}

        {filteredTitles.length > 0 && (
          <div className="title-suggestions" style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 10,
            marginTop: "4px",
            maxHeight: "160px",
            overflowY: "auto",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            padding: "6px 0",
            fontSize: "14px",
          }}>
            {filteredTitles.map((title, idx) => (
              <div
                key={idx}
                onClick={() => {
                  handleInputChange("title", title);
                  setFilteredTitles([]);
                  setErrors(prev => ({ ...prev, title: "" }));
                }}
                style={{
                  padding: "8px 12px",
                  cursor: "pointer",
                  background: title === formData.title ? "#e0f2fe" : "transparent",
                }}
              >
                {title}
              </div>
            ))}
          </div>
        )}
      </div>


      {/* Department */}
      <div className="input-group" style={{ position: "relative" }}>
        <label className="input-label">
          Department <span className="required">*</span>
        </label>

        <input
          type="text"
          value={formData.department}
          onChange={(e) => {
            handleDepartmentChange(e.target.value);
            setErrors(prev => ({ ...prev, department: "" }));
          }}
          onFocus={() => {
            if (!formData.department.trim()) {
              setFilteredDepartments(departmentSuggestions);
            }
          }}
          onBlur={() => {
            setTimeout(() => {
              setFilteredDepartments([]);
            }, 200);
          }}
          placeholder="e.g. Engineering, Marketing, HR"
          className={errors.department ? "error" : ""}
        />

        {errors.department && (
          <p className="field-error">{errors.department}</p>
        )}

        {filteredDepartments.length > 0 && (
          <div className="department-suggestions" style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 10,
            marginTop: "4px",
            maxHeight: "160px",
            overflowY: "auto",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            padding: "6px 0",
            fontSize: "14px",
          }}>
            {filteredDepartments.map((dept, idx) => (
              <div
                key={idx}
                onClick={() => {
                  handleInputChange("department", dept);
                  setFilteredDepartments([]);
                  setErrors(prev => ({ ...prev, department: "" }));
                }}
                style={{
                  padding: "8px 12px",
                  cursor: "pointer",
                }}
              >
                {dept}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>


    {/* Location */}
    <div className="input-group full-width">
      <label className="input-label">
        Location <span className="required">*</span>
      </label>

      <Select
        value={
          formData.location
            ? { label: formData.location, value: formData.location }
            : null
        }
        onChange={(selected) => {
          handleInputChange("location", selected ? selected.value : "");
          setErrors(prev => ({ ...prev, location: "" }));
        }}
        options={companyLocations.map((loc) => ({
          label: loc,
          value: loc,
        }))}
        placeholder="Select location"
        styles={customSelectStyles}
        isClearable={false}
        classNamePrefix="react-select"
        className={errors.location ? "react-select-error" : ""}
      />

      {errors.location && (
        <p className="field-error">{errors.location}</p>
      )}
    </div>


    {/* Employment Type + Experience */}
    <div className="input-row">

      <div className="input-group">
        <label className="input-label">
          Employment Type <span className="required">*</span>
        </label>

        <Select
          value={employmentTypeOptions.find(option => option.value === formData.employmentType) || null}
          onChange={(selected) => {
            handleInputChange("employmentType", selected ? selected.value : "");
            setErrors(prev => ({ ...prev, employmentType: "" }));
          }}
          options={employmentTypeOptions}
          placeholder="Select type"
          styles={customSelectStyles}
          isClearable={false}
          classNamePrefix="react-select"
          className={errors.employmentType ? "react-select-error" : ""}
        />

        {errors.employmentType && (
          <p className="field-error">{errors.employmentType}</p>
        )}
      </div>


      <div className="input-group">
        <label className="input-label">
          Experience Level <span className="required">*</span>
        </label>

        <Select
          value={experienceLevelOptions.find(option => option.value === formData.experienceLevel) || null}
          onChange={(selected) => {
            handleInputChange("experienceLevel", selected ? selected.value : "");
            setErrors(prev => ({ ...prev, experienceLevel: "" }));
          }}
          options={experienceLevelOptions}
          placeholder="Select level"
          styles={customSelectStyles}
          isClearable={false}
          classNamePrefix="react-select"
          className={errors.experienceLevel ? "react-select-error" : ""}
        />

        {errors.experienceLevel && (
          <p className="field-error">{errors.experienceLevel}</p>
        )}
      </div>

    </div>


    {/* Work Arrangement + Deadline */}
    <div className="input-row">

      <div className="input-group">
        <label className="input-label">
          Work Arrangement <span className="required">*</span>
        </label>

        <Select
          value={workArrangementOptions.find(option => option.value === formData.workArrangement) || null}
          onChange={(selected) => {
            handleInputChange("workArrangement", selected ? selected.value : "");
            setErrors(prev => ({ ...prev, workArrangement: "" }));
          }}
          options={workArrangementOptions}
          placeholder="Select arrangement"
          styles={customSelectStyles}
          isClearable={false}
          classNamePrefix="react-select"
          className={errors.workArrangement ? "react-select-error" : ""}
        />

        {errors.workArrangement && (
          <p className="field-error">{errors.workArrangement}</p>
        )}
      </div>


      <div className="input-group">
        <label className="input-label">
          Application Deadline <span className="required">*</span>
        </label>

        <input
          type="date"
          value={formData.applicationDeadline}
          onChange={(e) => {
            handleInputChange("applicationDeadline", e.target.value);
            setErrors(prev => ({ ...prev, applicationDeadline: "" }));
          }}
          className={errors.applicationDeadline ? "error" : ""}
        />

        {errors.applicationDeadline && (
          <p className="field-error">{errors.applicationDeadline}</p>
        )}
      </div>

    </div>

  </div>
)}

            {/* Tab 2: Job Details */}
{activeTab === 1 && (
  <div className="tab-panel">

    {/* Required Skills */}
    <div className="input-group full-width">
      <label className="input-label">
        Required skills <span className="required">*</span>
      </label>

      <div style={{ display: "flex", gap: "8px" }}>
        <input
          type="text"
          value={skillInput}
          onChange={(e) => {
            setSkillInput(e.target.value);
            setErrors(prev => ({ ...prev, skills: "" }));
          }}
          placeholder="Type skill and click Add (e.g. React, AWS, Docker)"
          className={errors.skills ? "error" : ""}
        />

        <button
          type="button"
          onClick={() => {
            addSkill();
            setErrors(prev => ({ ...prev, skills: "" }));
          }}
          className="add-btn"
        >
          Add
        </button>
      </div>

      {errors.skills && (
        <p className="field-error">{errors.skills}</p>
      )}

      {/* Skill chips */}
      <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
        {formData.skills.map((skill, idx) => (
          <span key={idx} className="skill-chip">
            {skill}
            <span
              className="chip-close"
              onClick={() => removeSkill(idx)}
            >
              ×
            </span>
          </span>
        ))}
      </div>
    </div>


    {/* Salary Range */}
    <div className="input-row salary-range-row" style={{ paddingBottom: "100px" }}>

      <div className="input-group salary-label">
        <label className="input-label">
          Salary Range <span className="required">*</span>
        </label>
      </div>

      {/* Salary Min */}
      <div className="input-group">
        <label className="input-label-small">Min</label>
        <input
          type="number"
          value={formData.salaryMin || ""}
          onChange={(e) => {
            handleInputChange("salaryMin", e.target.value);
            setErrors(prev => ({ ...prev, salaryMin: "" }));
          }}
          placeholder="₹ 0"
          className={errors.salaryMin ? "error" : ""}
          min="0"
        />

        {errors.salaryMin && (
          <p className="field-error">{errors.salaryMin}</p>
        )}
      </div>

      <div className="salary-to-connector">
        <span>to</span>
      </div>

      {/* Salary Max */}
      <div className="input-group">
        <label className="input-label-small">Max</label>
        <input
          type="number"
          value={formData.salaryMax || ""}
          onChange={(e) => {
            handleInputChange("salaryMax", e.target.value);
            setErrors(prev => ({ ...prev, salaryMax: "" }));
          }}
          placeholder="₹ 0"
          className={errors.salaryMax ? "error" : ""}
          min="0"
        />

        {errors.salaryMax && (
          <p className="field-error">{errors.salaryMax}</p>
        )}
      </div>

      {/* Salary Type */}
      <div className="input-group">
        <label className="input-label-small">Per</label>

        <Select
          value={salaryTypeOptions.find(option => option.value === formData.salaryType) || null}
          onChange={(selected) => {
            handleInputChange("salaryType", selected ? selected.value : "");
            setErrors(prev => ({ ...prev, salaryType: "" }));
          }}
          options={salaryTypeOptions}
          placeholder="Year"
          styles={customSelectStyles}
          isClearable={false}
          classNamePrefix="react-select"
          className={errors.salaryType ? "react-select-error" : ""}
        />

        {errors.salaryType && (
          <p className="field-error">{errors.salaryType}</p>
        )}
      </div>

    </div>
  </div>
)}



            {/* Tab 3 & 4 */}
            
{activeTab === 2 && (
  <div className="tab-panel">

    {/* Job Description */}
    <div className="input-group full-width">
      <label className="input-label">
        Job Description <span className="required">*</span>
      </label>

      <textarea
        value={formData.jobDescription || ""}
        onChange={(e) => {
          handleInputChange("jobDescription", e.target.value);
          setErrors(prev => ({ ...prev, jobDescription: "" }));
        }}
        placeholder="Write a detailed description of the role, company culture, and what makes this opportunity exciting..."
        rows={4}
        className={errors.jobDescription ? "error" : ""}
        style={{ borderRadius: "16px", padding: "16px 20px" }}
      />

      {errors.jobDescription && (
        <p className="field-error">{errors.jobDescription}</p>
      )}
    </div>


    {/* Key Responsibilities */}
    <div className="input-group full-width">
      <label className="input-label">
        Key Responsibilities <span className="required">*</span>
      </label>

      <div className="responsibilities-container">

        {formData.responsibilities.map((resp, index) => (
          <div key={index} className="responsibility-row">

            <div className="responsibility-input-group">
              <span className="responsibility-number">{index + 1}</span>

              <input
                type="text"
                value={resp}
                onChange={(e) => {
                  const updated = [...formData.responsibilities];
                  updated[index] = e.target.value;
                  handleInputChange("responsibilities", updated);

                  setErrors(prev => ({ ...prev, responsibilities: "" }));
                }}
                placeholder={`Responsibility ${index + 1}`}
                className={`responsibility-input ${
                  errors.responsibilities && !resp.trim() ? "error" : ""
                }`}
              />
            </div>

            {formData.responsibilities.length > 1 && (
              <button
                type="button"
                className="remove-btn"
                onClick={() =>
                  handleInputChange(
                    "responsibilities",
                    formData.responsibilities.filter((_, i) => i !== index)
                  )
                }
              >
                ×
              </button>
            )}

          </div>
        ))}


        {/* Error message */}
        {errors.responsibilities && (
          <p className="field-error">{errors.responsibilities}</p>
        )}


        {/* Add Responsibility Button */}
        <button
          type="button"
          className="add-btn"
          style={{ marginTop: "10px" }}
          onClick={() => {
            const lastResponsibility =
              formData.responsibilities[
                formData.responsibilities.length - 1
              ];

            if (!lastResponsibility || lastResponsibility.trim() === "") {
              showToast(
                "warning",
                "Please fill the previous responsibility first."
              );
              return;
            }

            handleInputChange("responsibilities", [
              ...formData.responsibilities,
              "",
            ]);
          }}
        >
          + Add responsibility
        </button>

      </div>
    </div>

  </div>
)}


{activeTab === 3 && (
  <div className="tab-panel2">
    {/* Benefits & Perks Input Section - Editable */}
    <div className="input-group full-width">
      <label className="input-label">Benefits & Perks <span className="required">*</span></label>
      <div className="benefits-section">
        {formData.benefits?.map((benefit, index) => (
          <div key={index} className="benefit-item">
            <span className="benefit-number">{index + 1}</span>
            <input
              type="text"
              value={benefit || ""}
              onChange={(e) => {
                const newBenefits = [...(formData.benefits || [])];
                newBenefits[index] = e.target.value;
                handleInputChange("benefits", newBenefits);
              }}
              placeholder={`Benefit ${index + 1}`}
              className="benefit-input"
            />
            {formData.benefits.length > 1 && (
              <button
                type="button"
                className="remove-benefit"
                onClick={() => {
                  const newBenefits = formData.benefits.filter((_, i) => i !== index);
                  handleInputChange("benefits", newBenefits);
                }}
              >
                ×
              </button>
            )}
          </div>
        )) || (
          <div className="benefit-item">
            <span className="benefit-number">1</span>
            <input
              type="text"
              value=""
              onChange={(e) => handleInputChange("benefits", [e.target.value])}
              placeholder="Benefit 1"
              className="benefit-input"
            />
          </div>
        )}
        <button
          type="button"
          className="add-benefit-btn"
          onClick={() => handleInputChange("benefits", [...(formData.benefits || []), ""])}
        >
          + Add
        </button>
      </div>
    </div>

    {/* Job Preview Card - Read Only */}
  {formData.title && (
    <div style={{ width: "52%" }}>
      <div className="preview-card" style={{ width: "100%" }}>
        {/* Header */}
        <div className="preview-header">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h3>{formData.title}</h3>

            <span
              style={{
                background:
                  "linear-gradient(90deg, rgba(228, 98, 30, 0.89) 0%, #D2364C 25%, #A72669 50%, #6A2C72 75%, #232C64 100%)",
                padding: "8px 16px",
                borderRadius: "100px",
                color: "white",
                fontSize: "13px",
                fontWeight: 500,
              }}
            >
              {formData.department || "N/A"}
            </span>
          </div>

          {/* Skills */}
          <div
            className="preview-tags"
            style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}
          >
            {formData.skills.length > 0 ? (
              formData.skills.map((skill, idx) => (
                <span key={idx} className="preview-tag">
                  {skill}
                </span>
              ))
            ) : (
              <span className="preview-tag">N/A</span>
            )}
          </div>
        </div>

        {/* Meta */}
        <div
          className="preview-meta"
          style={{ display: "flex", justifyContent: "space-between" }}
        >
          <div style={{ display: "flex", gap: "5px" }}>
            <img src={TimeIcon} alt="" />
            <span>{formData.location || "N/A"}</span>
          </div>

          <div style={{ display: "flex", gap: "5px" }}>
            <img src={TimeIcon} alt="" />
            <span>{formData.employmentType?.replace("-", " ") || "N/A"}</span>
          </div>

          <div style={{ display: "flex", gap: "5px" }}>
            <img src={TimeIcon} alt="" />
            <span>{formData.experienceLevel?.replace("-", " ") || "N/A"}</span>
          </div>
        </div>

        {/* Description */}
        <p className="preview-description" style={{ marginBottom: "50px" }}>
          {showFullDescription
            ? formData.jobDescription || "No description"
            : formData.jobDescription?.substring(0, 140) || "No description"}

          {formData.jobDescription &&
            formData.jobDescription.length > 140 && (
              <button
                className="read-more-btn"
                onClick={() => setShowFullDescription(!showFullDescription)}
              >
                {showFullDescription ? "Read Less" : "Read More"}
              </button>
            )}
        </p>
      </div>
    </div>
  )}

  </div>
)}


          </div>
        </div>

        {/* Footer Buttons */}
        <div className="post-jobs-footer">
          <button className="btn-secondary" onClick={prevTab} disabled={activeTab === 0}>
            Previous
          </button>
          {activeTab != 3 && (
          <button className="btn-primary" onClick={nextTab} disabled={activeTab === 3}>
            Next
          </button>
          )}
          {activeTab === 3 && (
            <button className="btn-publish" onClick={handleUpdateJob}>Update Job</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditJobsModal;
