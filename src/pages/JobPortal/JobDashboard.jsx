import React, { useEffect, useMemo, useRef, useState } from 'react';
import Select from "react-select";
import { fetchCompaniesByIds } from "../../store/companyMasterSlice";
import { fetchUpcomingInterviews, fetchMeetingsForCompany } from "../../store/interviewMasterSlice";

import { toaster, Notification } from 'rsuite'; // Make sure rsuite is imported

import { 
  TrendingUp, 
  Users, 
  FileText, 
  Briefcase,
  Calendar,
  Building,
  ClipboardList,
  AlertTriangle,
  Clock
} from 'lucide-react';
import dayjs from "dayjs";
import '../../css/JobDashboard.css';
import SideNav from '../../components/SideNav';
import { color } from 'framer-motion';
import { GoPlusCircle } from "react-icons/go";
import OverviewIcon from "../../images/OverviewIcon.svg"
import SecurityIcon_Active from "../../images/SecurityIcon_Active.svg"
import BrandingIcon_Active from "../../images/BrandingIcon_Active.svg"
import ApplicationsIcon_Active from "../../images/ApplicationsIcon_Active.svg"
import OverviewIcon_Unactive from "../../images/OverviewIcon_Unactive.svg"
import JobPostingIcon_Active from "../../images/JobPostingIcon_Active.svg"
import ApplicationsIcon_Unactive from "../../images/ApplicationsIcon_Unactive.svg"
import JobPostingIcon from "../../images/JobPostingIcon.svg"
import ApplicationsIcon2 from "../../images/ApplicationsIcon.svg" 
import ApplicationsIcon from "../../images/ApplicationsIcon2.svg" 
import BrandingIcon from "../../images/BrandingIcon.svg"
import SecurityIcon from "../../images/SecurityIcon.svg"
import ResumeUploaded from "../../images/ResumeUploaded.svg"
import QuickActions from "../../images/QuickActions.svg"
import ReviewApplication from "../../images/ReviewApplication.svg"
import CompanyProfile from "../../images/CompanyProfile.svg"
import ManagePosting from "../../images/ManagePosting.svg"
import PriorityItem from "../../images/PriorityItem.svg"
import PriorityItemRed from "../../images/PriorityItemRed.svg"
import PriorityItemGreen from "../../images/PriorityItemGreen.svg"
import briefcaseIcon from "../../images/briefcaseIcon.svg"
// import BriefcaseIcon from '../../assets/icons/BriefcaseIcon.svg'; // adjust path
import LocationIconColoured from "../../images/LocationIconColoured.svg"
import TimeIcon2 from "../../images/TimeIcon2.svg"
import ApplicationIcon from "../../images/ApplicationIcon.svg"
import ProfileIcon2 from "../../images/ProfileIcon2.svg"
import FileIcon from "../../images/FileIcon.svg"
import ColorfullCheck from "../../images/ColorfullCheck.svg"
import EmailIcon2 from "../../images/EmailIcon2.svg"
import ComposeEmail from "../../images/ComposeEmail.svg"
import NotesIcon from "../../images/NotesIcon.svg"
import ExportIcon from "../../images/ExportIcon.svg"
import PrivacyControlIcon from "../../images/PrivacyControlIcon.svg"
import SaveIcon2 from "../../images/SaveIcon2.svg"
import SaveIcon3 from "../../images/SaveIcon3.svg"
import BlueAlertIcon from "../../images/BlueAlertIcon.svg"
import HighRisk from "../../images/HighRisk.svg"
import MedRisk from "../../images/MedRisk.svg"
import LowRisk from "../../images/LowRisk.svg"
import SalaryIcon from "../../images/SalaryIcon.svg"
import AddNewBrand from "../../images/AddNewBrand.svg"
import redAlertIcon from "../../images/redAlertIcon.svg"
import UploadLogo1 from "../../images/UploadLogo1.svg"
import DemoCompanyLogo1 from "../../images/DemoCompanyLogo1.svg"
import location from "../../images/location.svg"
import CallIcon from "../../images/CallIcon.svg"
import PostedDaysAgo from "../../images/PostedDaysAgo.svg"
import PriorityItemGreenishYellow from "../../images/PriorityItemGreenishYellow.svg"
import { FaArrowRight } from "react-icons/fa";
import RecruitmentCalendarModal from './RecruitmentCalendarModal';
import PostNewJobsModal from "./PostNewJobsModal"; // Adjust path
import EditJobsModal from "./EditJobsModal"; // Adjust path
import { FaArrowTrendUp } from "react-icons/fa6";
import { GiSettingsKnobs } from "react-icons/gi";
import { FaRegCircleXmark } from "react-icons/fa6";
import { HiOutlineEye } from "react-icons/hi2";
import { FaEdit } from "react-icons/fa";
import { HiOutlineDuplicate } from "react-icons/hi";
import { RiDeleteBin5Line } from "react-icons/ri";
import { SlOptionsVertical } from "react-icons/sl";
import { FaChevronDown } from "react-icons/fa";
import { FaArrowRightLong } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import RegisterCompanyForm from './RegisterCompanyForm';
import { addDoc, doc, updateDoc, serverTimestamp, deleteDoc, collection, getDocs, query, where , getCountFromServer } from "firebase/firestore";
import { db } from "../../firebase";
import { IoMdRemoveCircle, IoMdAddCircle } from "react-icons/io";
import { IoStar, IoStarHalf, IoStarOutline } from "react-icons/io5";
import ResumePreviewModal from './ResumePreviewModal';
import AssignJobPortalAccessModal from './AssignJobPortalAccessModal';
import { fetchJobPortalByEmail } from '../../store/jobPortalSlice';
import { MdAssignmentTurnedIn } from "react-icons/md";
import InterviewScheduler from './InterviewScheduler';
import CandidateEmailModal from './CandidateEmailModal';
import CandidateRemarksModal from './CandidateRemarksModal';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable'; // adds .autoTable method
import ExportDropdown from './ExportDropdown';
import EventEditorModal from './EventEditorModal';
import { FaBriefcase } from "react-icons/fa6";
import { BsToggle2On } from "react-icons/bs";
import { BsToggle2Off } from "react-icons/bs";
import MeetingEditorModal from './MeetingEditorModal';
import { showToast } from '../../components/ToastProvider';
import { Globe, Lock } from "lucide-react";
import { HiOutlineDocumentDuplicate } from "react-icons/hi";



// import ExportIcon from './assets/export-icon.svg'; // adjust path


// ***************** **************** *****************






const JobDashboard = () => {
    const [companyJobs, setCompanyJobs] = useState([]);
    const activeJobsCount = companyJobs.filter(job => job.isActive).length;
    const totalJobsCount = companyJobs.length;
    const [showDuplicateJobModal, setShowDuplicateJobModal] = useState(false);
    const [jobToDuplicate, setJobToDuplicate] = useState(null);

    const [candidatesData, setCandidatesData] = useState([]);

    const [showAssignModal, setShowAssignModal] = useState(false);

    // const [selectedStatus, setSelectedStatus] = useState(""); // "" means All

    // 🧮 Resume / applications based
    const totalApplicationsCount = candidatesData.length;


  // Unique names to avoid conflicts
  const [showCandidateContactModal, setShowCandidateContactModal] = useState(false);
  const [selectedRowCandidate, setSelectedRowCandidate] = useState(null);


  const [showRemarksModal, setShowRemarksModal] = useState(false);
  const [remarksCandidate, setRemarksCandidate] = useState(null);



    

    
    // const { role } = useSelector((state) => state.jobPortal); // or wherever role is stored

    // If 1 resume = 1 application (current logic)
    const resumeUploadedCount = candidatesData.length;

    // OPTIONAL (future-proof):
    // const resumeUploadedCount = candidatesData.filter(c => c.resumeUrl).length;

    const respondedApplicationsCount = candidatesData.filter(
      c => c.status && c.status !== "New"
    ).length;

    const responseRate =
      totalApplicationsCount === 0
        ? 0
        : Math.round((respondedApplicationsCount / totalApplicationsCount) * 100);


        const { companies: companyMaster } = useSelector(
            (state) => state.companyMaster
          );

           const { role, companies: assignedCompanyIds } = useSelector(
            (state) => state.jobPortal
          );

            // 🧹 clean invalid company IDs like ""
          const cleanAssignedCompanyIds = useMemo(() => {
            return (assignedCompanyIds || []).filter(
              (id) => typeof id === "string" && id.trim() !== ""
            );
          }, [assignedCompanyIds]);

          
     
          // At the top of your component
          const now = new Date(); // browser time

          // Convert to IST reliably
          const nowIST = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));

          // Or more precise (handles DST etc. better if you add luxon/day.js later)
          const istOffset = 5.5 * 60 * 60 * 1000; // 5h 30m in ms
          const nowInIST = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + istOffset);


          const [salaryRange, setSalaryRange] = useState([0, 200]);
          const [selectedDepartments, setSelectedDepartments] = useState([]);
          const [selectedLocations, setSelectedLocations] = useState([]);
          const [selectedEmploymentTypes, setSelectedEmploymentTypes] = useState([]);
          const [selectedExperienceLevels, setSelectedExperienceLevels] = useState([]);
          const [selectedWorkArrangements, setSelectedWorkArrangements] = useState([]);


          const [searchTermApplications, setSearchTermApplications] = useState("");
          const [selectedStatus, setSelectedStatus] = useState("");
          const [selectedJobTitles, setSelectedJobTitles] = useState([]);
          const [selectedJobLocations, setSelectedJobLocations] = useState([]);
          const [experienceRange, setExperienceRange] = useState([0, 20]);


          

          


          



    
  
    const stats = [
    {
      id: 1,
      icon: FileIcon,
      value: activeJobsCount.toString(),
      label: 'Active Jobs',
      // trend: '+2 this week',
      trend: `${activeJobsCount > 0 ? "+" : ""}${activeJobsCount} live`,
      bgColor: '#FFF4ED',
      iconColor: '#D67A1F'
    },
    {
      id: 2,
      icon: ApplicationsIcon,
      value: totalApplicationsCount.toString(),
      label: 'Total Applications',
      trend: `${totalApplicationsCount > 0 ? "+" : ""}${totalApplicationsCount} received`,
      bgColor: '#FFF4ED',
      iconColor: '#D67A1F'
    },
    {
      id: 3,
      icon: ResumeUploaded,
      value: resumeUploadedCount.toString(),
      label: 'Resume Uploaded',
      trend: `${resumeUploadedCount > 0 ? "+" : ""}${resumeUploadedCount} files`,
      bgColor: '#FFF4ED',
      iconColor: '#D67A1F'
    },
    {
      id: 4,
      icon: OverviewIcon ,
      value: '3',
      label: 'Positions Filled',
      trend: '+1 this month',
      bgColor: '#FFF4ED',
      iconColor: '#D67A1F'
    }
  ];
  
  const stats2 = [
    {
      id: 1,
      icon: FileIcon,
      // value: '6',
      value: totalJobsCount.toString(),
      label: 'Total Jobs',
      // trend: '+12% from last month',
      trend: `${totalJobsCount > 0 ? "+" : ""}${totalJobsCount} jobs`,
      bgColor: '#FFF4ED',
      iconColor: '#D67A1F'
    },
    {
      id: 2,
      icon: ApplicationsIcon,
      // value: '3',
      value: activeJobsCount.toString(),
      label: 'Active Job',
      // trend: '+8% from last month',
      trend: `${activeJobsCount > 0 ? "+" : ""}${activeJobsCount} active`,
      bgColor: '#FFF4ED',
      iconColor: '#D67A1F'
    },
    {
      id: 3,
      icon: ResumeUploaded,
      value: totalApplicationsCount.toString(),
      label: 'Total Applications',
      trend: `${totalApplicationsCount > 0 ? "+" : ""}${totalApplicationsCount} received`,
      bgColor: '#FFF4ED',
      iconColor: '#D67A1F'
    },
    {
      id: 4,
      icon: OverviewIcon ,
      value: `${responseRate}%`,
      label: 'Response Rate',
      trend: `${respondedApplicationsCount}/${totalApplicationsCount} responded`,
      bgColor: '#FFF4ED',
      iconColor: '#D67A1F'
    }
  ];

  const quickActions = [
    {
      id: 1,
      icon: <img src={ReviewApplication} alt="" />,
      // icon: <Users size={20} />,
      title: 'Review Application',
      // subtitle: '168 pending',
      // subtitle: `${totalApplicationsCount}-${respondedApplicationsCount} pending`,
      subtitle: `${totalApplicationsCount - respondedApplicationsCount} pending`,
      bgColor: '#FDF8F4',
      iconColor: '#D67A1F'
    },
    {
      id: 2,
      // icon: <Building size={20} />,
      icon: <img src={CompanyProfile} alt="" />,
      title: 'Company Profile',
      subtitle: 'Update Branding',
      bgColor: '#FDF8F4',
      iconColor: '#D67A1F'
    },
    {
      id: 3,
      // icon: <ClipboardList size={20} />,
      icon: <img src={ManagePosting} alt="" />,
      title: 'Manage Postings',
      subtitle: `${activeJobsCount.toString()} Active Jobs`,
      bgColor: '#FDF8F4',
      iconColor: '#D67A1F'
    }
  ];

  const priorityItems = [
    {
      id: 1,
      title: 'Interview overdue',
      candidate: 'John Smith',
      position: 'Senior Developer position',
      dueDate: 'Due 2 days ago',
      bgColor: '#FFF4F4',
      icon: PriorityItemRed,
      borderColor: '#FDE3E3',
      dueDateColor: '#E94545  '
    },
    {
      id: 2,
      title: 'Interview overdue',
      candidate: 'John Smith',
      position: 'Senior Developer position',
      dueDate: 'Due 2 days ago',
      bgColor: '#F4FFF8',
      icon: PriorityItemGreen,
      borderColor: '#A8F4D1',
      dueDateColor: '#3E894E'
    },
    {
      id: 3,
      title: 'Interview overdue',
      candidate: 'John Smith',
      position: 'Senior Developer position',
      dueDate: 'Due 2 days ago',
      bgColor: '#FFFEF4',
      icon: PriorityItemGreenishYellow,
      borderColor: '#F4E5A8',
      dueDateColor: '#B9A12C'
    }
  ];

  // Inside the Hiring Success card div (before return JSX)
const hiredCount = candidatesData.filter(a => 
  ["Hired", "Offer Accepted"].includes(a.status)
).length;

const scheduledCount = candidatesData.filter(a => 
  a.status === "Interview Scheduled"
).length;

const successPercentage = scheduledCount > 0 
  ? (hiredCount / scheduledCount) * 100 
  : 0;





  
    const [activeCompanyId, setActiveCompanyId] = useState(
    sessionStorage.getItem("activeCompanyId") || ""
  );

   const companyId = activeCompanyId;

  const { upcomingInterviews, loading, error } = useSelector(
      (state) => state.interviewMaster
    );

    const meetings = useSelector((state) => state.interviewMaster.meetings);
  const meetingsLoading = useSelector((state) => state.interviewMaster.meetingsLoading);
  const meetingsError = useSelector((state) => state.interviewMaster.meetingsError);

    // console.log("[-----Dashboard] Redux state - upcomingInterviews:", upcomingInterviews);
    // console.log("[-----Dashboard] Loading status:", loading);
    // console.log("[-----Dashboard] Any error:", error);
    // console.log("[-----Dashboard] Current companyId used for fetch:", companyId);
    
    
    // Now replace dummy scheduleItems with real data
    const scheduleItems = upcomingInterviews.map((interview) => {
      const date = interview.interviewDate;
      const hours = date?.getHours() || 0;
      const minutes = date?.getMinutes() || 0;
      const timeStr = `${hours % 12 || 12}:${minutes.toString().padStart(2, "0")}`;
      const period = hours >= 12 ? "PM" : "AM";
      
      return {
        // Your original fields (kept exactly as-is)
        id: interview.id,
        time: timeStr,
        period,
        candidate: `${interview.first_Name} ${interview.lastName}`,
        position: interview.jobTitle,
        status: "Video call scheduled", // or interview.status if you prefer dynamic
        
        // ← Now includes EVERY field from the interview object
        ...interview,
      };
    });

              // Assuming scheduleItems is already mapped like in your code
          // We'll enhance it with endTime & isToday / isPast / isFuture flags

         const enrichedItems = scheduleItems.map(item => {
  // item.interviewDate is already a Date object
  const start = new Date(item.interviewDate);

  const durationMs = (item.durationMinutes || 45) * 60 * 1000;
  const end = new Date(start.getTime() + durationMs);

  const isToday = start.toDateString() === nowIST.toDateString();
  const hasEnded = end < nowIST;
  const isUpcomingToday = isToday && start >= nowIST;
  const isInProgress = isToday && start <= nowIST && end > nowIST;

  return {
    ...item,
    endTime: end,
    displayTime: `${item.time} ${item.period}`,
    effectiveStatus: item.status || "Video call scheduled",
    group: hasEnded 
      ? "past" 
      : (isToday && (isInProgress || isUpcomingToday)) 
        ? "today" 
        : "upcoming"
  };
});

// Enrich meetings (similar structure so we can merge)
const enrichedMeetings = meetings.map(meeting => {
  // meeting.date is assumed to be Firestore Timestamp → convert to JS Date
  const start = meeting.date?.toDate?.() || new Date(meeting.date);

  const durationMs = (meeting.duration || 30) * 60 * 1000;
  const end = new Date(start.getTime() + durationMs);

  const isToday = start.toDateString() === nowIST.toDateString();
  const hasEnded = end < nowIST;
  const isUpcomingToday = isToday && start >= nowIST;
  const isInProgress = isToday && start <= nowIST && end > nowIST;

  return {
    ...meeting,
    category: "Meetings",                   // ← key differentiator
    id: meeting.id,
    time: dayjs(start).format("h:mm"),
    period: dayjs(start).format("A"),
    candidate: meeting.members?.join(", ") || "Multiple participants",
    position: meeting.title,                // reuse title as "position"
    status: meeting.status || "scheduled",
    effectiveStatus: meeting.status || "Meeting scheduled",
    durationMinutes: meeting.duration || 30,
    endTime: end,
    group: hasEnded 
      ? "past" 
      : (isToday && (isInProgress || isUpcomingToday)) 
        ? "today" 
        : "upcoming"
  };
});

// Combine enriched interviews + enriched meetings
const combinedEnrichedItems = [...enrichedItems, ...enrichedMeetings];

// Filter combined list
// const todayItems = combinedEnrichedItems.filter(i => i.group === "today");
// const upcomingItems = combinedEnrichedItems.filter(i => i.group === "upcoming");


const todayItems = combinedEnrichedItems
  .filter(i => i.group === "today")
  .sort((a, b) => {
    // Helper to convert 12-hour time + period to minutes since midnight
    const getMinutes = (item) => {
      if (!item.time || !item.period) return 0;

      let [hours, minutes] = item.time.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes)) return 0;

      // Convert 12-hour to 24-hour
      if (item.period.toUpperCase() === 'PM' && hours !== 12) {
        hours += 12;
      }
      if (item.period.toUpperCase() === 'AM' && hours === 12) {
        hours = 0;
      }

      return hours * 60 + minutes;
    };

    const minutesA = getMinutes(a);
    const minutesB = getMinutes(b);

    return minutesA - minutesB; // earliest first
  });



const upcomingItems = combinedEnrichedItems
  .filter(i => i.group === "upcoming")
  .sort((a, b) => {
    // Get date from either interviewDate or date field
    const dateA = a.interviewDate ? new Date(a.interviewDate) : a.date ? new Date(a.date) : new Date(0);
    const dateB = b.interviewDate ? new Date(b.interviewDate) : b.date ? new Date(b.date) : new Date(0);

    return dateA - dateB; // ascending (earliest first)
  });

console.log("[-----Dashboard] Enriched schedule items (interviews + meetings):", combinedEnrichedItems);



// Split into groups
const pastItemsRaw = enrichedItems.filter(i => i.group === "past");
// const todayItems = enrichedItems.filter(i => i.group === "today");
// const upcomingItems = enrichedItems.filter(i => i.group === "upcoming");

// Special sort for pastItems: "scheduled-pending" first, then others
const pastItems = [
  // Pending ones at the top (you can sort them further if needed, e.g. by date)
  ...pastItemsRaw.filter(i => i.effectiveStatus === "scheduled-pending"),
  // All other past interviews below
  ...pastItemsRaw.filter(i => i.effectiveStatus !== "scheduled-pending")
    .sort((a, b) => b.endTime - a.endTime) // Optional: newest ended first
];
    
    
    // console.log("[-----Dashboard] Redux state - scheduleItems:", scheduleItems);
  
  useEffect(() => {
    // todayItems
    // console.log("[-----Dashboard] Today's interviews:", todayItems);
  }, [todayItems]);
  
  
  // Add this new color map (statusColors2 for dropdown)
  // const statusColors2 = {
  //   "New": { background: "#E3F4FF", color: "#2285C2" },
  //   "Under Review": { background: "#FFF6EB", color: "#FFAB49" },
  //   "Interview Scheduled": { background: "#EEFEF6", color: "#3E894E" },
  //   "Rejected": { background: "#FEF2F2", color: "#E94545" },
  //   "Hired": { background: "#F0E7FD", color: "#A673F0" },
  // };

  const statusColors2 = {
  "New": { background: "#E3F4FF", color: "#2285C2" },

  "Under Review": { background: "#FFF6EB", color: "#FFAB49" },

  "Interview Scheduled": { background: "#EEFEF6", color: "#3E894E" },

  "Rejected": { background: "#FEF2F2", color: "#E94545" },

  "Hired": { background: "#F0E7FD", color: "#A673F0" },

  "No Show": { background: "#F2F2F2", color: "#666666" },

  "Offer Extended": { background: "#FFF4E5", color: "#FF8C00" },

  "Offer Accepted": { background: "#E6FFF3", color: "#00B894" },

  "Offer Declined": { background: "#FFECEC", color: "#D63031" },
};



const dispatch = useDispatch();


  const [activeTab, setActiveTab] = useState("overview"); // default tab
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [postJobsOpen, setPostJobsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  // const [searchTermApplications, setSearchTermApplications] = useState("");
  const [activeDropdown, setActiveDropdown] = useState(null);
  // 1. ADD THESE STATES at the top with other useState
  const [selectedJob, setSelectedJob] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'details'
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  // const [showEditModal, setShowEditModal] = useState(false);
  const [editJobsOpen, setEditJobsOpen] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [statusDropdownIdx, setStatusDropdownIdx] = useState(null);
  // const [actionsDropdownIdx, setActionsDropdownIdx] = useState(null);
  const [activeDropdownIdx, setActiveDropdownIdx] = useState(null);
  // const [showEmailModal, setShowEmailModal] = useState(false);
  const [activeEmailTab, setActiveEmailTab] = useState("Compose"); // "Compose" | "Template"
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const [designActiveTab, setDesignActiveTab] = useState("Design");
  const [colorSchemeActiveTab, setColorSchemeActiveTab] = useState("Fill");
  const [brandingCompanyName, setBrandingCompanyName] = useState("Infomanav");
  const [brandingCompanyDesc, setBrandingCompanyDesc] = useState("");
  const [brandingCustomDomain, setBrandingCustomDomain] = useState("");
  const [brandingPrimaryColor, setBrandingPrimaryColor] = useState("#232C64");
  const [brandingSecondaryColor, setBrandingSecondaryColor] = useState("");
  const [brandingHeadingFont, setBrandingHeadingFont] = useState("");
  const [brandingBodyFont, setBrandingBodyFont] = useState("");
  const [gradientStyle, setGradientStyle] = useState("linear");
  const [gradientDirection, setGradientDirection] = useState("90deg");
  const [gradientOpacity1, setGradientOpacity1] = useState("100");
  const [gradientOpacity2, setGradientOpacity2] = useState("100");

  const [designStep, setDesignStep] = useState(1); // 1 = part 1 (form), 2 = part 2 (select image)

  const [showDeleteJobModal, setShowDeleteJobModal] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);


  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockReason, setBlockReason] = useState(null); 
  // "ADMIN_UNCONFIGURED" | "MANAGER_UNCONFIGURED"

  const [showRegisterForm, setShowRegisterForm] = useState(false);
 

  const [triggerFetchJobs, setTriggerFetchJobs] = useState(0); // to re-fetch jobs after edit/post
  const [triggerFetchResumes, setTriggerFetchResumes] = useState(0); // to re-fetch resumes after edit/post
  const [triggerFetchUsers, setTriggerFetchUsers] = useState(0); // to re-fetch users assigned companies after edit/post
  const [triggerFetchInterviews, setTriggerFetchInterviews] = useState(0); // to re-fetch interviews after edit/post

  const dropdownRef = useRef(null);


  const [resumePreviewOpen, setResumePreviewOpen] = useState(false);
  const [resumePreviewTab, setResumePreviewTab] = useState("profile");
  const [resumePreviewData, setResumePreviewData] = useState(null); 
  // shape: { candidate, idx }
  
  
  
  const [interviewSelectedCandidate, setInterviewSelectedCandidate] = useState(""); 
  const [showInterviewScheduler, setShowInterviewScheduler] = useState(false); 




  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedCandidateForEmail, setSelectedCandidateForEmail] = useState(null);


  const [editorOpen, setEditorOpen] = useState(false);
  const [activeEvent, setActiveEvent] = useState(null);
  const [editorMeetingOpen, setEditorMeetingOpen] = useState(false);
  const [activeMeeting, setActiveMeeting] = useState(null);


  


useEffect(() => {
  if (companyId) {
    dispatch(fetchMeetingsForCompany(companyId));
  }
}, [companyId, dispatch, triggerFetchInterviews]); // re-fetch meetings when interviews change (e.g. new interview added)


// Close dropdown when clicking outside
useEffect(() => {
  const handleClickOutside = (event) => {
    // If dropdown is open AND click is NOT inside the dropdown → close it
    if (activeDropdownIdx !== null && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setActiveDropdownIdx(null);
    }
  };

  // Add listener to the whole document
  document.addEventListener('mousedown', handleClickOutside);

  // Cleanup when component unmounts or dropdown closes
  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
  };
}, [activeDropdownIdx]);












  const handleSaveEvent = (updatedEvent) => {
    // setAllEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
    setEditorOpen(false);
    setActiveEvent(null);
  };

  const handleDeleteEvent = (eventId) => {
    // setAllEvents(prev => prev.filter(e => e.id !== eventId));
    setEditorOpen(false);
    setActiveEvent(null);
  };

  const handleEditClick = (event) => {
    setActiveEvent(event);
    setEditorOpen(true);
    // setAllEvents is commented → no update for now
  };

  const handleEditMeetingClick = (event) => {
    setActiveMeeting(event);
    setEditorMeetingOpen(true);
  };
  






const handlePostJobClick = () => {
  if (!activeCompany) {
    console.warn("No active company selected");
    return;
  }
  
  // ✅ Company is registered → allow posting
  if (activeCompany.isConfigured) {
    setPostJobsOpen(true);
    return;
  }
  
  // ❌ Company NOT registered → block
  if (role === "ADMIN" || role === "SUPER_ADMIN") {
    setBlockReason("ADMIN_UNCONFIGURED");
    console.warn("ADMIN_UNCONFIGURED");
    setShowBlockModal(true);
    return;
  }
  
  if (role === "JOB_PORTAL_MANAGER") {
    console.warn("MANAGER_UNCONFIGURED");
    setBlockReason("MANAGER_UNCONFIGURED");
    setShowBlockModal(true);
    return;
  }
};


const handleStatusChange = (interviewId, applicationId, newStatus) => {
  console.log(`Updating interview ${interviewId} to status: ${newStatus}`);

  // TODO: Dispatch your real update thunk here
  // dispatch(updateInterviewStatus({ id: interviewId, status: newStatus }));

  handleUpdateCandidateStatus(applicationId, newStatus); // <-- call the function we defined earlier
  handleUpdateInterviewStatus(interviewId, newStatus); // <-- call the function we defined earlier

  // Optional: Show toast
  showToast(
    "success",
    `Interview status changed to "${newStatus}"`,
    "Status Updated"
  );

 
};



const formatSalary = (salary) => {
  if (!salary) return "N/A";
  return `₹${salary.min} - ₹${salary.max} / ${salary.type.replace("per-", "")}`;
};

const getJobStatus = (job) => (job.isActive ? "Active" : "Inactive");


  



  // const [ratings, setRatings] = useState(
  //   candidatesData.map(c => c.rating ?? 4.5)
  // );

  const [ratings, setRatings] = useState([]);

  useEffect(() => {
    if (!candidatesData?.length) return;

    const syncedRatings = candidatesData.map(c =>
      typeof c.ratings === "number" ? c.ratings : 4.5
    );

    console.log("mnbvc2 ▶ Sync ratings from Firebase:", syncedRatings);

    setRatings(syncedRatings);
  }, [candidatesData]);

  useEffect(() => {
  // Clear all filters when activeTab changes
  setSearchTerm("");
  setSearchTermApplications(""); // if you have separate search for candidates tab

  // Job filters
  setSelectedDepartments([]);
  setSelectedLocations([]);
  setSelectedEmploymentTypes([]);
  setSelectedExperienceLevels([]);
  setSalaryRange([0, 200]);
  setSelectedWorkArrangements([]);

  // Candidate filters (add any extra ones you have for candidates tab)
  setSelectedStatus("");
  setSelectedJobTitles([]);
  setSelectedJobLocations([]);
  // setExperienceRange([0, 20]); // if you have this for candidates too

  // Close modal if open
  setShowAdvancedFilters(false);

  console.log("Filters cleared due to tab change →", activeTab);
}, [activeTab]); // ← Runs every time activeTab changes



  const handleRatingChange = async (rowIdx, newValue) => {
  const candidate = candidatesData[rowIdx];

  if (!candidate?.id) {
    console.warn("mnbvc ▶ Missing candidate id");
    return;
  }

  // 1️⃣ Optimistic UI update
  setRatings(prev => {
    const copy = [...prev];
    copy[rowIdx] = newValue;
    return copy;
  });

  console.log("mnbvc ▶ Rating UI updated:", newValue);

  try {
    // 2️⃣ Firestore update
    const resumeRef = doc(db, "resumeMaster", candidate.id);

    await updateDoc(resumeRef, {
      ratings: newValue,
      updatedAt: serverTimestamp()
    });

    console.log("mnbvc ▶ Rating saved to Firebase");

    // 3️⃣ Refetch resumes
    setTriggerFetchResumes(x => x + 1);

  } catch (err) {
    console.error("mnbvc ▶ Failed to save rating:", err);
  }
};


 



const advancedRef = useRef(null);
const thumbRef = useRef(null);

  

 


    const email = sessionStorage.getItem("email");


    

   

useEffect(() => {
  if (companyId) {
    // console.log("[-----Dashboard] Dispatching fetchUpcomingInterviews for company:", companyId);
    dispatch(fetchUpcomingInterviews(companyId));
  } else {
    // console.warn("[-----Dashboard] No companyId found - skipping fetch");
  }
}, [dispatch, companyId, triggerFetchInterviews]);
   
    
    useEffect(() => {
    if (email) {
      // dispatch(fetchJobPortalByEmail(email));
      dispatch(fetchJobPortalByEmail({ email, role }));
    }
  }, [dispatch, role]);

     const assignedCompanies = useMemo(() => {
          if (!companyMaster.length || !cleanAssignedCompanyIds.length) {
            return [];
          }

          return companyMaster
            .filter((c) => cleanAssignedCompanyIds.includes(c.id))
            .sort((a, b) => {
              if (a.isConfigured === b.isConfigured) return 0;
              return a.isConfigured ? -1 : 1;
            });
        }, [companyMaster, cleanAssignedCompanyIds]);




    const currentCompany = assignedCompanies.find(c => c.id === activeCompanyId);
    const isCurrentCompanyConfigured = currentCompany?.isConfigured ?? true; // default to true if not found


  
//   console.log("qwerty JOBPORTAL role:", role);
// console.log("qwerty JOBPORTAL raw assignedCompanyIds:", assignedCompanyIds);




// console.log(
//   "qwerty JOBPORTAL cleanedAssignedCompanyIds:",
//   cleanAssignedCompanyIds
// );



  
  // console.log("qwerty COMPANY_MASTER all companies:", companyMaster);


  const activeCompany = companyMaster.find(
  (c) => c.id === activeCompanyId
);

useEffect(() => {
  if (activeCompany) {  
    console.log("qwerty Active company details:", activeCompany);
  }}, [activeCompany]);

 

const currentUserId = useSelector(
  (state) => state.jobPortal.currentUserId
);

// const handleRegisterCompany = async (data) => {
//   try {
//     console.log("qwerty REGISTER company data:", data);

//     const companyRef = doc(db, "companyMaster", activeCompany.id);

//     await updateDoc(companyRef, {
//   email: data.email,
//   mobile: data.mobile,
//   website: data.website,
//   logoUrl: data.logoUrl || "",
//   description: data.description,
//   location: data.location,

//   socials: {
//     linkedin: data.socials.linkedin || "",
//     twitter: data.socials.twitter || "",
//     facebook: data.socials.facebook || "",
//     instagram: data.socials.instagram || "",
//   },

//   isConfigured: true,
//   updatedAt: serverTimestamp(),
//   updatedBy: currentUserId,
// });


//     console.log("qwerty Company registered successfully");

//     // refresh company data
//     // dispatch(fetchCompaniesByIds([activeCompany.id]));
//     setTimeout(() => {
//       setTriggerFetchUsers( x => x + 1);
//     }, 500); // to refresh jobs

//     setShowRegisterForm(false);
//   } catch (err) {
//     console.error("qwerty ERROR registering company:", err);
//   }
// };

// const handleRegisterCompany = async (data) => {
//   try {
//     console.log("qwerty REGISTER company data:", data);

//     const companyRef = doc(db, "companyMaster", activeCompany.id);

//     await updateDoc(companyRef, {
//       email: data.email,
//       mobile: data.mobile,
//       website: data.website,
//       logoUrl: data.logoUrl || "",
//       description: data.description,
//       location: data.location,

//       // New fields added here
//       officeAddress: data.officeAddress || "",
//       registrationNumber: data.registrationNumber || "",

//       socials: {
//         linkedin: data.socials.linkedin || "",
//         twitter: data.socials.twitter || "",
//         facebook: data.socials.facebook || "",
//         instagram: data.socials.instagram || "",
//       },

//       isConfigured: true,
//       updatedAt: serverTimestamp(),
//       updatedBy: currentUserId,
//     });

//     console.log("qwerty Company registered successfully");

//     // refresh company data
//     // dispatch(fetchCompaniesByIds([activeCompany.id]));
//     setTimeout(() => {
//       setTriggerFetchUsers((x) => x + 1);
//     }, 500); // to refresh jobs

//     setShowRegisterForm(false);
//   } catch (err) {
//     console.error("qwerty ERROR registering company:", err);
//   }
// };



// useEffect(() => {
//   console.log("11111 Company Master from Redux:", companyMaster);
//   console.log("11111 Assigned Company IDs from Redux:", assignedCompanyIds);
//   console.log("11111 Cleaned Assigned Company IDs:", cleanAssignedCompanyIds);
//   console.log("11111 Derived Assigned Companies:", assignedCompanies);
//   console.log("11111 Active company:", activeCompany);  
// }, [companyMaster, assignedCompanyIds, cleanAssignedCompanyIds, assignedCompanies, activeCompany]);



const handleRegisterCompany = async (data) => {
  try {
    // Show loading toast
    showToast(
    "info",
    "Uploading logo and saving company details... Please wait.",
    "Registering Company",
    {
      autoClose: false,   // stays until manually dismissed
      closeOnClick: false,
      draggable: false,
    }
  );

    console.log("qwerty REGISTER company data:", data);

    let logoUrl = data.logoUrl || ""; // fallback if somehow exists (edit mode?)

    // ── 1. Upload logo if a new file was selected ───────────────────────────────
    if (data.logoFile) {
      const formData = new FormData();
      formData.append("company_id", activeCompany.id);
      formData.append("logo", data.logoFile);

      const uploadResponse = await fetch("https://rt.infomanav.in/8006/logo", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Logo upload failed: ${uploadResponse.status} - ${errorText}`);
      }

      const uploadResult = await uploadResponse.json();
      console.log("qwerty Logo upload result:", uploadResult);

      if (uploadResult.logo_url) {
        logoUrl = uploadResult.logo_url;
      } else {
        console.warn("qwerty No logo_url returned from upload");
      }
    }

    // ── 2. Update company in Firestore ──────────────────────────────────────────
    const companyRef = doc(db, "companyMaster", activeCompany.id);

    await updateDoc(companyRef, {
      email: data.email.trim(),
      mobile: data.mobile.trim(),
      website: data.website.trim(),
      logoUrl,
      description: data.description.trim(),
      location: data.location,

      officeAddress: data.officeAddress.trim(),
      registrationNumber: data.registrationNumber?.trim() || "",

      socials: {
        linkedin: data.socials.linkedin?.trim() || "",
        twitter: data.socials.twitter?.trim() || "",
        facebook: data.socials.facebook?.trim() || "",
        instagram: data.socials.instagram?.trim() || "",
      },

      primaryColor: data.primaryColor.trim(),
      secondaryColor: data.secondaryColor.trim(),

      isConfigured: true,
      updatedAt: serverTimestamp(),
      updatedBy: currentUserId,
    });

    console.log("qwerty Company registered / updated successfully");

    // Remove loading toast and show success
    // toaster.remove(); // removes the loading one
   showToast(
    "success",
    "Company registered successfully!",
    "Success"
  );

    // refresh logic
    setTimeout(() => {
      setTriggerFetchUsers((x) => x + 1);
    }, 500);

    setShowRegisterForm(false);

  } catch (err) {
    console.error("qwerty ERROR registering company:", err);

    // Remove loading toast and show error
    // toaster.remove();
    showToast(
  "error",
  `Failed to register company: ${err.message || "Unknown error"}`,
  "Error"
);
  }
};

const formatAppliedDate = (isoString) => {
  if (!isoString) return "—";

  const date = new Date(isoString);

  if (isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};



// const fetchResumesForCompany = async (companyId) => {
//   try {
//     const resumesRef = collection(db, "resumeMaster");

//     const q = query(
//       resumesRef,
//       where("companyId", "==", companyId)
//     );

//     const snapshot = await getDocs(q);

//     const resumes = snapshot.docs.map(doc => ({
//       id: doc.id,
//       ...doc.data(),
//     }));

//     setCandidatesData(resumes);
//     console.log("✅ Resumes fetched for company:", resumes);
//   } catch (err) {
//     console.error("❌ Failed to fetch resumes:", err);
//   }
// };

const fetchResumesForCompany = async (companyId) => {
  try {
    const resumesRef = collection(db, "resumeMaster");

    const q = query(
      resumesRef,
      where("companyId", "==", companyId)
    );

    const snapshot = await getDocs(q);

    const resumes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Sort by appliedDate (latest first) – handles ISO 8601 strings correctly
    const sortedResumes = resumes.sort((a, b) => {
      const dateA = a.appliedDate ? new Date(a.appliedDate) : new Date(0); // old date if missing
      const dateB = b.appliedDate ? new Date(b.appliedDate) : new Date(0);
      return dateB - dateA; // descending = latest first
    });

    setCandidatesData(sortedResumes);
    console.log("✅ Resumes fetched and sorted (latest first) for company:", sortedResumes);
  } catch (err) {
    console.error("❌ Failed to fetch resumes:", err);
  }
};


const handleUpdateCandidateStatus = async (candidateId, newStatus) => {
  try {
    console.log("mnbvc ▶ Updating status:", candidateId, newStatus);

    const resumeRef = doc(db, "resumeMaster", candidateId);

    await updateDoc(resumeRef, {
      status: newStatus,
      updatedAt: serverTimestamp(),
    });

    console.log("mnbvc ▶ Status updated in Firebase");

    // 🔁 Refetch resumes
    setTriggerFetchResumes(prev => prev + 1);

  } catch (err) {
    console.error("mnbvc ▶ Failed to update status:", err);
  }
};


const handleUpdateInterviewStatus = async (interviewId, newStatus) => {
  try {
    console.log("mnbvc ▶ Updating interview status:", interviewId, newStatus);

    const interviewRef = doc(db, "interviewMaster", interviewId);

    await updateDoc(interviewRef, {
      status: newStatus,   // ← Field name from your column
      updatedAt: serverTimestamp(),
    });

    console.log("mnbvc ▶ Interview status updated in Firebase");

    // 🔁 Refetch interviews (adjust variable name if yours is different)
    setTriggerFetchInterviews(prev => prev + 1);

    // Optional: Success toast (same style as your other code)
   showToast(
    "success",
    `Interview status changed to "${newStatus}"`,
    "Updated"
  );

  } catch (err) {
    console.error("mnbvc ▶ Failed to update interview status:", err);

    // Optional: Error toast
   showToast(
  "error",
  "Failed to update interview status",
  "Error"
);
  }
};


const getApplicationCount = async (jobId) => {
  if (!jobId) return 0;

  try {
    const resumesQuery = query(
      collection(db, "resumeMaster"),
      where("jobId", "==", jobId)
    );

    const snapshot = await getCountFromServer(resumesQuery);
    return snapshot.data().count;   // this is a number
  } catch (err) {
    console.error(`Failed to count applications for job ${jobId}:`, err);
    return 0; // fallback – better than breaking UI
  }
};



// const fetchJobsForCompany = async (companyId) => {
//   try {
//     if (!companyId) return;

//     console.log("📦 Fetching jobs for companyId:", companyId);

//     const q = query(
//       collection(db, "jobMaster"), // 👈 your jobs collection
//       where("companyId", "==", companyId)
//     );

//     const snapshot = await getDocs(q);

//     const jobs = snapshot.docs.map((doc) => ({
//       id: doc.id,
//       ...doc.data(),
//     }));

//     setCompanyJobs(jobs);

//     console.log("✅ Jobs fetched for company:", jobs);
//   } catch (err) {
//     console.error("❌ Failed to fetch jobs:", err);
//   }
// };


const fetchJobsForCompany = async (companyId) => {
  try {
    if (!companyId) return;

    console.log("📦 Fetching jobs for companyId:", companyId);

    const q = query(
      collection(db, "jobMaster"),
      where("companyId", "==", companyId)
    );

    const snapshot = await getDocs(q);

    const jobsWithoutCounts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Now enrich each job with count (one by one)
    const jobsWithCounts = await Promise.all(
      jobsWithoutCounts.map(async (job) => {
        const count = await getApplicationCount(job.id);
        return {
          ...job,
          applicationCount: count,
        };
      })
    );

    setCompanyJobs(jobsWithCounts);

    console.log("✅✅✅✅ All jobs in 'companyJobs'",jobsWithCounts)

    console.log("✅ Jobs with application counts:", jobsWithCounts);
  } catch (err) {
    console.error("❌ Failed to fetch jobs:", err);
  }
};



useEffect(() => {
  const handleClickOutside = (event) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target)
    ) {
      setActiveDropdown(null);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);


useEffect(() => {
  if (!cleanAssignedCompanyIds.length) return;
  // if (companyMaster.length) return; // ⛔ already fetched

  console.log(
    "qwerty DISPATCH fetchCompaniesByIds (once):",
    cleanAssignedCompanyIds
  );

  dispatch(fetchCompaniesByIds(cleanAssignedCompanyIds));
}, [dispatch, cleanAssignedCompanyIds, companyMaster.length, triggerFetchUsers]);


useEffect(() => {
  if (!activeCompanyId) return;

  fetchJobsForCompany(activeCompanyId);
}, [activeCompanyId, triggerFetchJobs]);

useEffect(() => {
  if (!activeCompanyId) return;

  fetchResumesForCompany(activeCompanyId);
}, [activeCompanyId, triggerFetchResumes]);



  useEffect(() => {
    console.log("qwerty EFFECT cleanAssignedCompanyIds:", cleanAssignedCompanyIds);
    console.log("qwerty EFFECT companyMaster length:", companyMaster.length);
    console.log(
      "qwerty EFFECT stored activeCompanyId:",
      sessionStorage.getItem("activeCompanyId")
    );

    // if (!assignedCompanyIds?.length || !companyMaster?.length) return;
    if (!cleanAssignedCompanyIds.length || !companyMaster?.length) return;

    // restore from session OR default to first
    const stored = sessionStorage.getItem("activeCompanyId");

    if (stored && cleanAssignedCompanyIds.includes(stored)) {
      setActiveCompanyId(stored);
    } else {
      console.log(
        "qwerty EFFECT setting default activeCompanyId:", 
        cleanAssignedCompanyIds[0]
      );
      setActiveCompanyId(cleanAssignedCompanyIds[0]);
      sessionStorage.setItem("activeCompanyId", cleanAssignedCompanyIds[0]);
    }
  }, [cleanAssignedCompanyIds, companyMaster]);



const activeCompanyName = assignedCompanies.find(c => c.id === activeCompanyId)?.name || activeCompanyId;



useEffect(() => {
  if (!assignedCompanies.length) return;

  const stored = sessionStorage.getItem("activeCompanyId");

  if (stored && assignedCompanies.some((c) => c.id === stored)) {
    setActiveCompanyId(stored);
  } else {
    setActiveCompanyId(assignedCompanies[0].id);
    sessionStorage.setItem("activeCompanyId", assignedCompanies[0].id);
  }
}, [assignedCompanies]);





// close on outside click
useEffect(() => {
  function handleClickOutside(e) {
    if (advancedRef.current && !advancedRef.current.contains(e.target)) {
      setShowAdvancedFilters(false);
    }
  }
  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);

// Indeterminate effect
useEffect(() => {
  const headerCheckbox = document.querySelector('thead input[type="checkbox"]');
  if (headerCheckbox) {
    headerCheckbox.indeterminate = selectAll === "indeterminate";
  }
}, [selectAll]);

const nav = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem("number");
    // console.log("token", token);
    if (!token) {
      alert("Session expired. Please login again.");
      nav("/Login");
    }
  }, [nav]);

  useEffect(() => {
  if (!activeCompany?.id) return;

  fetchJobsForCompany(activeCompany.id);
}, [activeCompany?.id]);



// =======================
// Job Details – Safe Helpers
// =======================

const jobDetailsText = (value, fallback = "N/A") =>
  value !== undefined && value !== null && value !== "" ? value : fallback;

const jobDetailsSalaryText = selectedJob?.salary
  ? `₹${selectedJob.salary.min ?? ""} - ₹${selectedJob.salary.max ?? ""}${
      selectedJob.salary.type
        ? ` / ${selectedJob.salary.type.replace("per-", "")}`
        : ""
    }`
  : "N/A";

const jobDetailsSkillsArray = Array.isArray(selectedJob?.requiredSkills)
  ? selectedJob.requiredSkills
  : typeof selectedJob?.skills === "string"
  ? selectedJob.skills.split(",").map(s => s.trim())
  : [];

const jobDetailsApplicantsCount = selectedJob?.applicationCount ?? 0;

// {job.applicationCount ?? 0}

// =======================
// Job Details – Posted Days Ago Helper
// =======================

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

const handleToggleJobStatus = async (job) => {
  const updatedStatus = !job.isActive;

  await updateDoc(doc(db, "jobMaster", job.id), {
    isActive: updatedStatus,
    updatedAt: new Date(),
  });

  showToast("success",`Job Status updated to ${updatedStatus ? "Active" : "Inactive"}`)

  // 🔥 1️⃣ Update selectedJob (DETAIL VIEW)
  setSelectedJob(prev =>
    prev && prev.id === job.id
      ? { ...prev, isActive: updatedStatus }
      : prev
  );

  // 🔥 2️⃣ Update jobs list (GRID VIEW)
  setCompanyJobs(prev =>
    prev.map(j =>
      j.id === job.id ? { ...j, isActive: updatedStatus } : j
    )
  );
};


const handleDeleteJob = async (jobId) => {
  console.log("DELETE jobId:", jobId, typeof jobId);

  if (!jobId || typeof jobId !== "string") {
    console.error("Invalid jobId:", jobId);
    return;
  }

  await deleteDoc(doc(db, "jobMaster", jobId));

  setCompanyJobs(prev => prev.filter(job => job.id !== jobId));
  setShowDeleteJobModal(false)

  showToast("success","Job Deleted Successfully")

  if (selectedJob?.id === jobId) {
    setSelectedJob(null);
    setViewMode("grid");
    setShowDeleteJobModal(false)
  }
};

const handleDuplicateJob = async (job) => {
  console.log("mnbvc ▶ duplicate clicked, raw job:", job);

  try {
    // ✅ remove id safely
    const { id, createdAt, updatedAt, ...jobWithoutId } = job;

    console.log("mnbvc ▶ jobWithoutId:", jobWithoutId);

    const nowISO = new Date().toISOString();

    const duplicatedJobPayload = {
      ...jobWithoutId,

      // META updates
      isActive: false,
      jobPostingDate: nowISO,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    console.log("mnbvc ▶ final payload:", duplicatedJobPayload);

    const docRef = await addDoc(
      collection(db, "jobMaster"),
      duplicatedJobPayload
    );

    console.log("mnbvc ✅ duplicated job id:", docRef.id);

    // 🔥 update UI instantly
    setCompanyJobs(prev => [
      { ...duplicatedJobPayload, id: docRef.id },
      ...prev,
    ]);

    setShowDuplicateJobModal(false);
    setJobToDuplicate(null);

  } catch (error) {
    console.error("mnbvc ❌ Duplicate job failed:", error);
    alert("Failed to duplicate job");
  }
};



// Put this near your table component file
// const StarRating = ({ value = 0, onChange }) => {
//   const maxStars = 5;

//   const getStarType = (index) => {
//     const starValue = index + 1;

//     if (value >= starValue) return "full";
//     if (value >= starValue - 0.5) return "half";
//     return "empty";
//   };

//   const handleClick = (index, isHalf) => {
//     const newValue = isHalf ? index + 0.5 : index + 1;
//     onChange(newValue);
//   };

//   return (
//     <div
//       style={{
//         display: "flex",
//         flexDirection: "column",
//         alignItems: "center",
//         gap: "6px",
//       }}
//     >
//       {/* Stars */}
//       <div style={{ display: "flex", gap: "4px" }}>
//         {Array.from({ length: maxStars }).map((_, index) => {
//           const type = getStarType(index);

//           return (
//             <div
//               key={index}
//               style={{
//                 position: "relative",
//                 cursor: "pointer",
//                 fontSize: 18,
//                 color: "#FBBF24",
//               }}
//             >
//               {/* LEFT HALF */}
//               <span
//                 onClick={() => handleClick(index, true)}
//                 style={{
//                   position: "absolute",
//                   left: 0,
//                   width: "50%",
//                   height: "100%",
//                   zIndex: 2,
//                 }}
//               />

//               {/* RIGHT HALF */}
//               <span
//                 onClick={() => handleClick(index, false)}
//                 style={{
//                   position: "absolute",
//                   right: 0,
//                   width: "50%",
//                   height: "100%",
//                   zIndex: 2,
//                 }}
//               />

//               {/* ICON */}
//               {type === "full" && <IoStar />}
//               {type === "half" && <IoStarHalf />}
//               {type === "empty" && <IoStarOutline />}
//             </div>
//           );
//         })}
//       </div>

//       {/* Label */}
//       <span style={{ fontSize: 13, fontWeight: 500, color: "#4B5563" }}>
//         {value.toFixed(1)}{" "}
//         <span style={{ color: "#9CA3AF" }}>
//           {value >= 4.5
//             ? "Excellent"
//             : value >= 3.5
//             ? "Good"
//             : value >= 2.5
//             ? "Average"
//             : "Poor"}
//         </span>
//       </span>
//     </div>
//   );
// };

const StarRating = ({ value = 0, onChange }) => {
  const maxStars = 5;

  const handleClick = (starIndex, isHalf) => {
    const newValue = isHalf ? starIndex + 0.5 : starIndex + 1;
    onChange(newValue);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      {/* Stars */}
      <div style={{ display: "flex", gap: 4 }}>
        {Array.from({ length: maxStars }).map((_, i) => {
          const full = value >= i + 1;
          const half = value >= i + 0.5 && value < i + 1;

          return (
            <div key={i} style={{ position: "relative", cursor: "pointer" }}>
              {/* Left (half) */}
              <span
                onClick={() => handleClick(i, true)}
                style={{ position: "absolute", left: 0, width: "50%", height: "100%" }}
              />

              {/* Right (full) */}
              <span
                onClick={() => handleClick(i, false)}
                style={{ position: "absolute", right: 0, width: "50%", height: "100%" }}
              />

              {full ? (
                <IoStar size={18} color="#FBBF24" />
              ) : half ? (
                <IoStarHalf size={18} color="#FBBF24" />
              ) : (
                <IoStarOutline size={18} color="#E5E7EB" />
              )}
            </div>
          );
        })}
      </div>

      {/* Numeric label */}
      <span style={{ fontSize: 13, fontWeight: 500, color: "#4B5563" }}>
        {value.toFixed(1)}{" "}
        <span style={{ color: "#9CA3AF" }}>
          {value >= 4.5
            ? "Excellent"
            : value >= 3.5
            ? "Good"
            : value >= 2.5
            ? "Average"
            : value > 0
            ? "Poor"
            : "Not rated"}
        </span>
      </span>
    </div>
  );
};


// const filteredJobs = jobs.filter(job =>
//   job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
//   job.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
//   job.skills.toLowerCase().includes(searchTerm.toLowerCase())
// );

// const filteredJobs = companyJobs.filter((job) => {
//   const term = searchTerm.toLowerCase();

//   const titleMatch =
//     job.jobTitle?.toLowerCase().includes(term);

//   const departmentMatch =
//     job.department?.toLowerCase().includes(term);

//   const skillsMatch =
//     Array.isArray(job.requiredSkills) &&
//     job.requiredSkills.some((skill) =>
//       skill.toLowerCase().includes(term)
//     );

//   return titleMatch || departmentMatch || skillsMatch;
// });

const filteredJobs = companyJobs.filter(job => {
  const term = searchTerm.toLowerCase();

  const titleMatch = job.jobTitle?.toLowerCase().includes(term);
  const deptMatch = job.department?.toLowerCase().includes(term);
  const skillsMatch = Array.isArray(job.requiredSkills) &&
    job.requiredSkills.some(skill => skill.toLowerCase().includes(term));

  const searchMatch = titleMatch || deptMatch || skillsMatch;

  const deptFilter = selectedDepartments.length === 0 || selectedDepartments.includes(job.department);
  const locFilter = selectedLocations.length === 0 || selectedLocations.includes(job.location);
  const empTypeFilter = selectedEmploymentTypes.length === 0 || selectedEmploymentTypes.includes(job.employmentType);
  const expLevelFilter = selectedExperienceLevels.length === 0 || selectedExperienceLevels.includes(job.experienceLevel);
  const workFilter = selectedWorkArrangements.length === 0 || selectedWorkArrangements.includes(job.workArrangement);

  const salaryFilter =
    (job.salary?.min || 0) >= salaryRange[0] * 1000 &&
    (job.salary?.max || Infinity) <= salaryRange[1] * 1000;

  return searchMatch && deptFilter && locFilter && empTypeFilter && expLevelFilter && workFilter && salaryFilter;
});

// Search + Status filter combined
// const filteredCandidates = candidatesData.filter(candidate => {
//   // 1. Search filter (name or job title)
//   if (searchTermApplications.trim()) {
//     const searchLower = searchTermApplications.toLowerCase().trim();
//     const fullName = `${candidate.first_Name || ""} ${candidate.lastName || ""}`.toLowerCase();
//     const position = (candidate.jobTitle || "").toLowerCase();

//     if (!fullName.includes(searchLower) && !position.includes(searchLower)) {
//       return false;
//     }
//   }

//   // 2. Status filter
//   if (selectedStatus && candidate.status !== selectedStatus) {
//     return false;
//   }

//   // If both pass → keep the candidate
//   return true;
// });

const filteredCandidates = candidatesData.filter(candidate => {
  // 1. Search filter (name or job title) – your existing logic
  if (searchTermApplications.trim()) {
    const searchLower = searchTermApplications.toLowerCase().trim();
    const fullName = `${candidate.first_Name || ""} ${candidate.lastName || ""}`.toLowerCase();
    const position = (candidate.jobTitle || "").toLowerCase();

    if (!fullName.includes(searchLower) && !position.includes(searchLower)) {
      return false;
    }
  }

  // 2. Status filter (from modal)
  if (selectedStatus && candidate.status !== selectedStatus) {
    return false;
  }

  // 3. Job Title filter (multi-select from modal)
  if (selectedJobTitles.length > 0 && !selectedJobTitles.includes(candidate.jobTitle)) {
    return false;
  }

  // 4. Location filter (multi-select from modal)
  if (selectedJobLocations.length > 0 && !selectedJobLocations.includes(candidate.jobLocation)) {
    return false;
  }

  // 5. Experience Range filter (years slider from modal)
  const expYears = candidate.experienceYears || 0;
  if (expYears < experienceRange[0] || expYears > experienceRange[1]) {
    return false;
  }

  // All filters passed → keep this candidate
  
  return true;
});





          // Calculate pagination
          const [currentPage, setCurrentPage] = useState(1);
          const [itemsPerPage, setItemsPerPage] = useState(5);
          const totalItems = filteredCandidates.length;
          const totalPages = Math.ceil(totalItems / itemsPerPage);
          const startIndex = (currentPage - 1) * itemsPerPage;
          const endIndex = startIndex + itemsPerPage;
          const paginatedCandidates = filteredCandidates.slice(startIndex, endIndex);

      

useEffect(() => {
  setCurrentPage(1);
}, [
  searchTermApplications,
  selectedStatus,
  selectedJobTitles,
  selectedJobLocations,
  experienceRange
]);






// Status dropdown function
const toggleStatusDropdown = (idx) => {
  setStatusDropdownIdx(statusDropdownIdx === idx ? null : idx);
};





  return (
      <>
      <SideNav />
    <div className="job-dashboard">
      {/* Header */}

     <div style={{backgroundColor:"#F7F8F8"}}>
         <div className="dashboard-header bgwhite">
        <div className="breadcrumb SFProTextClass font20" >
          <span >Jobs</span>
          <span className="separator fontW500" style={{color:'#E94545'}}>›</span>
          <span className="current fontW500" style={{fontFamily: "'SF Pro', 'SFProText', -apple-system, BlinkMacSystemFont, sans-serif", color:'#E94545'}}>Dashboard</span>
        </div>
      </div>


      {/* Title Section */}
      <div className="title-section SFProTextClass" style={{ alignItems: "center" }}>
  <div style={{ width: "28%" }}>
    <p className="fontW500 font18" style={{ color: "black" }}>
      Recruitment Dashboard
    </p>
    <p
      className="fontW500 subtitle"
      style={{ fontSize: "14px", color: "#575757" }}
    >
      Manage your job postings and applications
    </p>
  </div>

  {/* Company Dropdown */}
  <div style={{ marginRight: "14px", width: "20%" }}>
    <select
      value={activeCompanyId}
      onChange={(e) => {
        setActiveCompanyId(e.target.value);
        sessionStorage.setItem("activeCompanyId", e.target.value);
      }}
      style={companySelectStyle}
    >
      {assignedCompanies.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name} {!c.isConfigured ? "⚠️" : ""}
        </option>
      ))}
    </select>
  </div>


  {/* Company Dropdown + Register Button (only for ADMIN) */}
<div style={{ display: "flex", alignItems: "center", gap: "12px", flexDirection:"column", width:"50%" }}>



    <div style={{display:"flex", gap:"15px", justifyContent:"end", width:"100%" }}>
      {/* New: Register button – visible only for ADMIN + not configured */}
      {["ADMIN", "SUPER_ADMIN"].includes(role) && !isCurrentCompanyConfigured && (
        <button
          onClick={() => {
            setShowBlockModal(false);
            setShowRegisterForm(true); // 👈 switch modal content
          }}
          style={{
            padding: "10px 20px",
            background: "#FFAB49",
            color: "white",
            border: "none",
            borderRadius: "112px",
            fontWeight: 600,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Register Company
        </button>
      )}



      {["ADMIN", "SUPER_ADMIN"].includes(role) && (
          <button
            onClick={() => setShowAssignModal(true)}
            title='Assign Job Portal Access'
            style={{
              padding: "10px 20px",
              background: "#FFAB49",
              color: "white",
              border: "none",
              borderRadius: "112px",
              fontWeight: 600,
              cursor: "pointer",
              // margin: "16px 0",
            }}
          >
            <span style={{display:"flex", alignItems:"center"}}>
              <MdAssignmentTurnedIn />
            <span style={{marginLeft:"5px"}}>
              Assign Access
            </span>
            </span>
          </button>
        )}

      {/* Post Job Button */}
      <button
        className="post-job-btn"
        // onClick={() => setPostJobsOpen(true)}
        onClick={handlePostJobClick}
        style={{
              padding: "10px 20px",
              background: "#FFAB49",
              color: "white",
              border: "none",
              borderRadius: "112px",
              fontWeight: 600,
              cursor: "pointer",
              // margin: "16px 0",
            }}
      >
        <span className="btn-icon" style={{ fontSize: 0 }}>
          <GoPlusCircle style={{ color: "white", fontSize: "18px" }} />
        </span>
        <span>Post Job</span>
      </button>

    </div>

   

  

   


</div>

  
</div>



{/* Complete Tabs and dashboard */}

{/* Normal content - only visible when NOT banned */}
  {!activeCompany?.companySoftBan && (
<div>

  
    
       {/* Tabs */}
     <div className="tabs font16">

  {/* Overview */}
  <button
    className={`tab gray700 font16 fontW500 ${
      activeTab === "overview" ? "active" : ""
    }`}
    onClick={() => setActiveTab("overview")}
  >
    <img
      src={activeTab === "overview" ? OverviewIcon : OverviewIcon_Unactive}
      alt=""
    />
    Overview
  </button>

  {/* Job Postings */}
  <button
    className={`tab gray700 font16 fontW500 ${
      activeTab === "jobPostings" ? "active" : ""
    }`}
    onClick={() => setActiveTab("jobPostings")}
  >
    <img
      src={
        activeTab === "jobPostings"
          ? JobPostingIcon_Active
          : JobPostingIcon
      }
      alt=""
    />
    Job Postings
  </button>

  {/* Applications */}
  <button
    className={`tab gray700 font16 fontW500 ${
      activeTab === "applications" ? "active" : ""
    }`}
    onClick={() => setActiveTab("applications")}
  >
    <img
      src={
        activeTab === "applications"
          ? ApplicationsIcon_Active
          : ApplicationsIcon_Unactive
      }
      alt=""
    />
    Applications
  </button>

  {/* 🔐 SUPER_ADMIN ONLY */}
 
</div>


        
{/* OverView Section */}
   {activeTab === "overview" && (
    <div style={{marginTop:"24px"}}>
      {/* Stats Cards */}

      {/* Premium Stats Cards */}
{/* Compact Premium Stats Cards */}
 <div className="stats-grid" style={{
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "16px",
  marginTop: "20px",
}}>
  {/* 1. Jobs Overview – Tight & Informative */}
  <div style={{
    background: "#ffffff",
    borderRadius: "14px",
    padding: "18px",
    boxShadow: "0 6px 16px rgba(0,0,0,0.05)",
    border: "1px solid #f0f0f0",
    transition: "all 0.2s",
  }}
  onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 10px 24px rgba(0,0,0,0.08)"}
  onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.05)"}
  >
    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
      <div style={{
        width: "40px",
        height: "40px",
        background: "#FFF4ED",
        borderRadius: "10px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}> 
        {/* <img src={briefcaseIcon} alt="Jobs" style={{ width: "20px", height: "20px" }} /> */}
        <FaBriefcase style={{color:"#E94545", fontSize:"18px"}}/>
      </div>
      <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#1a1a1a" }}>
        Jobs Overview
      </h3>
    </div>

    <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ color: "#64748b" }}>Total Jobs</span>
        <strong style={{ color: "#1a1a1a" }}>{companyJobs.length}</strong>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ color: "#64748b" }}>Active</span>
        <strong style={{ color: "#10b981" }}>
          {companyJobs.filter(j => j.isActive).length}
        </strong>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ color: "#64748b" }}>Inactive</span>
        <strong style={{ color: "#ef4444" }}>
          {companyJobs.filter(j => !j.isActive).length}
        </strong>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ color: "#64748b" }}>Deadline 7 days</span>
        <strong style={{ color: "#f59e0b" }}>
          {companyJobs.filter(j => {
            if (!j.applicationDeadline) return false;
            const deadline = new Date(j.applicationDeadline);
            const daysLeft = (deadline - new Date()) / (1000 * 60 * 60 * 24);
            return daysLeft <= 7 && daysLeft > 0;
          }).length}
        </strong>
      </div>
      <div style={{ marginTop: "15px", color: "#64748b", display: "flex", justifyContent: "space-between" }}>
        Applications across jobs: <strong style={{ color: "#1a1a1a" }}>{candidatesData.length}</strong>
      </div>
    </div>
  </div>

  {/* 2. Applications Funnel – Compact Bars */}
 <div
  style={{
    background: "#ffffff",
    borderRadius: "14px",
    padding: "18px",
    boxShadow: "0 6px 16px rgba(0,0,0,0.05)",
    border: "1px solid #f0f0f0",
    transition: "all 0.2s",
  }}
  onMouseEnter={(e) =>
    (e.currentTarget.style.boxShadow = "0 10px 24px rgba(0,0,0,0.08)")
  }
  onMouseLeave={(e) =>
    (e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.05)")
  }
>
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "10px",
      marginBottom: "12px",
    }}
  >
    <div
      style={{
        width: "40px",
        height: "40px",
        background: "#FFF4ED",
        borderRadius: "10px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <img
        src={ApplicationsIcon}
        alt="Applications"
        style={{ width: "20px", height: "20px" }}
      />
    </div>

    <h3
      style={{
        margin: 0,
        fontSize: "16px",
        fontWeight: 700,
        color: "#1a1a1a",
      }}
    >
      Applications
    </h3>
  </div>

  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
    {(() => {
      const mainStatuses = [
        "New",
        "Interview Scheduled",
        "Hired",
        "Rejected",
      ];

      const total = candidatesData.length;

      const counts = mainStatuses.map((status) =>
        candidatesData.filter((a) => a.status === status).length
      );

      const othersCount =
        total - counts.reduce((sum, val) => sum + val, 0);

      const statusesWithOthers = [
        ...mainStatuses,
        ...(othersCount > 0 ? ["Others"] : []),
      ];

      return statusesWithOthers.map((status) => {
        const count =
          status === "Others"
            ? othersCount
            : candidatesData.filter((a) => a.status === status).length;

        const percentage =
          total > 0 ? Math.round((count / total) * 100) : 0;

        return (
          <div
            key={status}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "13px",
              }}
            >
              <span style={{ color: "#64748b" }}>{status}</span>
              <strong style={{ color: "#1a1a1a" }}>{count}</strong>
            </div>

            <div
              style={{
                height: "5px",
                background: "#e2e8f0",
                borderRadius: "3px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${percentage}%`,
                  background:
                    status === "Hired"
                      ? "#10b981"
                      : status === "Rejected"
                      ? "#ef4444"
                      : status === "Others"
                      ? "#64748b"
                      : "#f59e0b",
                  transition: "width 0.4s ease",
                }}
              />
            </div>
          </div>
        );
      });
    })()}

    <div
      style={{
        marginTop: "6px",
        fontSize: "13px",
        color: "#64748b",
        textAlign: "right",
      }}
    >
      Total: <strong style={{ color: "#1a1a1a" }}>{candidatesData.length}</strong>
    </div>
  </div>
</div>

  {/* 3. Resumes Activity – Simple & Compact */}
  <div style={{
    background: "#ffffff",
    borderRadius: "14px",
    padding: "18px",
    boxShadow: "0 6px 16px rgba(0,0,0,0.05)",
    border: "1px solid #f0f0f0",
    textAlign: "center",
    transition: "all 0.2s",
    display:"flex",
    flexDirection:"column",
    justifyContent:"space-between",
  }}
  onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 10px 24px rgba(0,0,0,0.08)"}
  onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.05)"}
  >
   
    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
      <div style={{
        width: "40px",
        height: "40px",
        background: "#FFF4ED",
        borderRadius: "10px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <img src={ResumeUploaded} alt="Resumes" style={{ width: "20px", height: "20px" }} />
      </div>
      <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#1a1a1a" }}>
        Resumes
      </h3>
    </div>

  
    <div>
      <p style={{ margin: "0 0 4px", fontSize: "68px", fontWeight: 500, color: "#1a1a1a" }}>
        {resumeUploadedCount}
      </p>
    </div>
   
   
   
   <div>
     <p style={{ color: "#64748b", fontSize: "13px" }}>
      Total uploaded
    </p>
    {/* <p style={{ color: "#10b981", fontSize: "12px", fontWeight: 500, margin: "8px" }}>
      +{Math.floor(resumeUploadedCount )} recent
    </p> */}
    <p style={{ color: "#10b981", fontSize: "12px", fontWeight: 500, margin: "8px" }}>
      +{candidatesData.filter(a => a.status === "New").length} recent
    </p>
   </div>



  </div>

{/* 4. Hiring Success – Fixed & Safe Calculation */}
<div style={{
  background: "#ffffff",
  borderRadius: "14px",
  padding: "18px",
  boxShadow: "0 6px 16px rgba(0,0,0,0.05)",
  border: "1px solid #f0f0f0",
  textAlign: "center",
  transition: "all 0.2s",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
}}
onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 10px 24px rgba(0,0,0,0.08)"}
onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.05)"}
>
  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
    <div style={{
      width: "40px",
      height: "40px",
      background: "#FFF4ED",
      borderRadius: "10px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <img src={OverviewIcon} alt="Hiring" style={{ width: "20px", height: "20px" }} />
    </div>
    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#1a1a1a" }}>
      Hiring Success
    </h3>
  </div>

  {/* Big Number – Hired Count */}
  <div>
    <p style={{ margin: "0 0 4px", fontSize: "68px", fontWeight: 500, color: "#10b981" }}>
      {hiredCount}
    </p>
    <p style={{ color: "#64748b", fontSize: "13px" }}>
      Positions filled
    </p>
  </div>

  {/* Dynamic Progress Bar – Safe Calculation */}
  <div>
    <div style={{
      height: "6px",
      background: "#e2e8f0",
      borderRadius: "3px",
      margin: "12px 0",
      overflow: "hidden",
    }}>
      <div style={{
        height: "100%",
        width: `${candidatesData.length > 0 ? (hiredCount / candidatesData.length) * 100 : 0}%`,
        background: "linear-gradient(to right, #10b981, #34d399)",
        transition: "width 0.5s ease",
      }} />
    </div>

    <p style={{ color: "#64748b", fontSize: "12px", textAlign: "center", marginTop: "8px" }}>
      {candidatesData.length > 0 
        ? `${((hiredCount / candidatesData.length) * 100).toFixed(0)}% success rate` 
        : "0% success rate (no applications yet)"}
      <span style={{ fontWeight: 500, color: "#1a1a1a", marginLeft: "4px" }}>
        ({hiredCount} hired / {candidatesData.length} total applications)
      </span>
    </p>
  </div>
</div>


</div>

      {/* Main Content Grid */}
      <div className="content-grid">
 
        {/* Right Column - Today's Schedule */}
        <div className="right-column">
          <div className="card schedule-card">
           <div style={{display:"flex", alignItems:"center", justifyContent:"space-between"}}>
             <div className="card-header" style={{display: "flex", flexDirection: "column", gap: 0}}>
              <h4 style={{
                fontWeight: "500",
                fontStyle: "Medium",
                fontSize: "18px",
                lineHeight: "20px",
                color: "#101828",
                paddingBottom:"5px",
                marginTop:"15px"

              }}>Today's Schedule</h4>
              <p className="card-subtitle">Upcoming interviews and meetings</p>
            </div>

            <div>
              <button
                className="view-calendar-btn"
                onClick={() => setIsCalendarOpen(true)}
              >
                View Full Calendar <FaArrowRight />
              </button>
            </div>
           </div>


<div className="schedule-items">
  {loading ? (
    <div className="loading-message">Loading interviews...</div>
  ) : error ? (
    <div className="error-message">Error: {error}</div>
  ) : enrichedItems.length === 0 ? (
    <div
  className="empty-message"
  style={{
    textAlign: "center",
    padding: "40px 20px",
    color: "#64748b",
    fontSize: "14px",
    background: "#f8fafc",
    borderRadius: "12px",
    border: "1px dashed #e2e8f0",
  }}
>
  No interviews scheduled yet
</div>
  ) : (
    <div className="schedule-columns-container">
      {/* Column 1 - Past */}
     



      {/* Column 2 - Today */}
      <div className="schedule-column today-column" style={{overflowY:"auto", maxHeight:"385px"}}>
        <h5 className="column-title">Today's Interviews and Meetings</h5>

        {todayItems.length === 0 ? (
          <div className="column-empty">No interviews today</div>
        ) : (
         todayItems.map((item) => (
  <div key={item.id} className="schedule-item today-item">
    <div className="schedule-time">
      <span className="time">{item.time}</span>
      <span className="period">{item.period}</span>
    </div>

    {item.category === "Interviews" ? (
      // ── ORIGINAL INTERVIEW CARD ── (your existing code preserved exactly)
      <div className="schedule-main-content">
        <div className="candidate-line">
           <p style={{padding:"5px 10px", background:"#ffffff", color:"#FFAB49", borderRadius:"10px", width:"fit-content", border:"1px solid #FFAB49", marginBottom:"10px"}}>Interviews</p>
          <strong>{item.candidate}</strong>
        </div>

        <div className="position-line">{item.position}</div>

        {/* Reschedule Count */}
        {item.rescheduleHistory && item.rescheduleHistory.length > 0 && (
          <div
            className="reschedule-count"
            style={{
              fontSize: "12px",
              marginTop: "4px",
              color: "#f59e0b",
              fontWeight: 500,
            }}
          >
            🔁 Rescheduled {item.rescheduleHistory.length}{" "}
            {item.rescheduleHistory.length === 1 ? "time" : "times"}
          </div>
        )}

        <div
          className={`status-line ${
            item.endTime < nowIST ? "status-completed" : "status-upcoming"
          }`}
        >
          {item.effectiveStatus}
        </div>
      </div>
    ) : (
      // ── NEW MEETING CARD ── (similar layout, different fields)
      <div className="schedule-main-content">
        <div className="candidate-line">
          {/* <strong></strong> */}
          <p style={{padding:"5px 10px", background:"#ffffff", color:"#FFAB49", borderRadius:"10px", width:"fit-content", border:"1px solid #FFAB49", marginBottom:"10px"}}>Meeting</p>
        </div>
        <div className="candidate-line">
          <strong>Topic: {item.title}</strong>
        </div>

        <div className="position-line">
          {item.members?.length || 0} participant{item.members?.length !== 1 ? "s" : ""}
        </div>

        <div
          className={`status-line ${
            item.endTime < nowIST ? "status-completed" : "status-upcoming"
          }`}
        >
          {item.effectiveStatus}
        </div>
      </div>
    )}

    <div className="duration-block">
      {item.category === "Interviews" ? (
        <button
          className="add-btn2"
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleEditClick(item);
          }}
        >
          <Calendar size={16} />
          Reschedule
        </button>
      ) : (
        // Optional: Add edit/cancel for meetings later
        // <span style={{ fontSize: "12px", color: "#6b7280" }}>General Meeting</span>
       <button
  className="add-btn2"
  type="button"
  onClick={(e) => {
    e.stopPropagation();
    handleEditMeetingClick(item);
  }}
>
  <Calendar size={16} />
  Reschedule
</button>
      )}
      {item.durationMinutes} min
    </div>
  </div>
))
        )}
      </div>

      {/* Column 3 - Upcoming */}
<div className="schedule-column upcoming-column" style={{ overflowY: "auto", maxHeight: "385px" }}>
  <h5 className="column-title">Upcoming Interviews</h5>

  {upcomingItems.length === 0 ? (
    <div className="column-empty">No upcoming interviews</div>
  ) : (
    upcomingItems.map((item) => (
      <div key={item.id} className="schedule-item upcoming-item">
        <div className="schedule-time">
          {/* NEW: Display date below time */}
          <span className="date">
            {item.interviewDate
              ? new Date(item.interviewDate).toLocaleDateString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : item.date
              ? new Date(item.date).toLocaleDateString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'Date N/A'}
          </span>
          <span className="time">{item.time}</span>
          <span className="period">{item.period}</span>
          
          
        </div>

        {item.category === "Interviews" ? (
          // ── ORIGINAL INTERVIEW CARD (unchanged) ──
          <div className="schedule-main-content">
            <div className="candidate-line">
              <p style={{ padding: "5px 10px", background: "#ffffff", color: "#FFAB49", borderRadius: "10px", width: "fit-content", border: "1px solid #FFAB49", marginBottom: "10px" }}>
                Interviews
              </p>
              <strong>{item.candidate}</strong>
            </div>

            <div className="position-line">{item.position}</div>

            {/* Reschedule Count */}
            {item.rescheduleHistory && item.rescheduleHistory.length > 0 && (
              <div
                className="reschedule-count"
                style={{
                  fontSize: "12px",
                  marginTop: "4px",
                  color: "#f59e0b",
                  fontWeight: 500,
                }}
              >
                🔁 Rescheduled {item.rescheduleHistory.length}{" "}
                {item.rescheduleHistory.length === 1 ? "time" : "times"}
              </div>
            )}

            <div className="status-line status-upcoming">
              {item.effectiveStatus}
            </div>
          </div>
        ) : (
          // ── MEETING CARD (similar style) ──
          <div className="schedule-main-content">
            <div className="candidate-line">
              <p style={{ padding: "5px 10px", background: "#ffffff", color: "#FFAB49", borderRadius: "10px", width: "fit-content", border: "1px solid #FFAB49", marginBottom: "10px" }}>
                Meeting
              </p>
              <strong>{item.title}</strong>
            </div>

            <div className="position-line">
              {item.members?.length || 0} participant{item.members?.length !== 1 ? "s" : ""}
            </div>

            <div className="status-line status-upcoming">
              {item.effectiveStatus}
            </div>
          </div>
        )}

        <div className="duration-block">
          {item.category === "Interviews" ? (
            <button
              className="add-btn2"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleEditClick(item);
              }}
            >
              <Calendar size={16} />
              Reschedule
            </button>
          ) : (
            <button
              className="add-btn2"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleEditMeetingClick(item);
              }}
            >
              <Calendar size={16} />
              Reschedule
            </button>
          )}
          {item.durationMinutes} min
        </div>
      </div>
    ))
  )}
</div>

    </div>
  )}
</div>
            {/* <button className="view-calendar-btn">
              View Full Calendar <FaArrowRight />
            </button> */}
             
          </div>
        </div>
      </div>

    </div>
     )}
 
 
 
 {/* dsifbisdhfdhf  m dijfoidsjhfo  sjdpoiasjdipj */}
  {activeTab === "jobPostings" && (
  <div style={{marginTop:"24px"}}>
    {/* Stats Cards + Search + Grid - Part 1 */}
    {viewMode === 'grid' && (
      <div>
        {/* Stats Cards */}
        {/* <div className="stats-grid">
          {stats2.map(stat => (
            <div key={stat.id} className="stat-card">
              <div className="stat-header" style={{marginBottom:"0"}}>
                <span className="stat-label">{stat.label}</span>
                <div 
                  className="stat-icon" 
                  style={{ backgroundColor: stat.bgColor, color: stat.iconColor }}
                >
                  <img src={stat.icon} alt="" style={{height: "22px", color:"red"}} />
                </div>
              </div>
              <p className="stat-value" style={{fontSize:"36px"}}>{stat.value}</p>
              <p className="stat-trend1"> <FaArrowTrendUp /> {stat.trend}</p>
            </div>
          ))}
        </div> */}
        {/* Premium Job Posting Stats – Modern Dashboard Style */}


 <div className="stats-grid" style={{
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "16px",
  marginTop: "20px",
}}>
  {/* 1. Jobs Overview – Tight & Informative */}
  <div style={{
    background: "#ffffff",
    borderRadius: "14px",
    padding: "18px",
    boxShadow: "0 6px 16px rgba(0,0,0,0.05)",
    border: "1px solid #f0f0f0",
    transition: "all 0.2s",
  }}
  onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 10px 24px rgba(0,0,0,0.08)"}
  onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.05)"}
  >
    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
      <div style={{
        width: "40px",
        height: "40px",
        background: "#FFF4ED",
        borderRadius: "10px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}> 
        {/* <img src={briefcaseIcon} alt="Jobs" style={{ width: "20px", height: "20px" }} /> */}
        <FaBriefcase style={{color:"#E94545", fontSize:"18px"}}/>
      </div>
      <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#1a1a1a" }}>
        All Jobs
      </h3>
    </div>

    <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ color: "#64748b" }}>Total Jobs</span>
        <strong style={{ color: "#1a1a1a" }}>{companyJobs.length}</strong>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ color: "#64748b" }}>Active</span>
        <strong style={{ color: "#10b981" }}>
          {companyJobs.filter(j => j.isActive).length}
        </strong>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ color: "#64748b" }}>Inactive</span>
        <strong style={{ color: "#ef4444" }}>
          {companyJobs.filter(j => !j.isActive).length}
        </strong>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ color: "#64748b" }}>Deadline 7 days</span>
        <strong style={{ color: "#f59e0b" }}>
          {companyJobs.filter(j => {
            if (!j.applicationDeadline) return false;
            const deadline = new Date(j.applicationDeadline);
            const daysLeft = (deadline - new Date()) / (1000 * 60 * 60 * 24);
            return daysLeft <= 7 && daysLeft > 0;
          }).length}
        </strong>
      </div>
      <div style={{ marginTop: "15px", color: "#64748b", display: "flex", justifyContent: "space-between" }}>
        Applications across jobs: <strong style={{ color: "#1a1a1a" }}>{candidatesData.length}</strong>
      </div>
    </div>
  </div>

  

  {/* 2. Resumes Activity – Simple & Compact */}
  <div style={{
    background: "#ffffff",
    borderRadius: "14px",
    padding: "18px",
    boxShadow: "0 6px 16px rgba(0,0,0,0.05)",
    border: "1px solid #f0f0f0",
    textAlign: "center",
    transition: "all 0.2s",
    display:"flex",
    flexDirection:"column",
    justifyContent:"space-between",
  }}
  onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 10px 24px rgba(0,0,0,0.08)"}
  onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.05)"}
  >
   
    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
      <div style={{
        width: "40px",
        height: "40px",
        background: "#FFF4ED",
        borderRadius: "10px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <img src={ResumeUploaded} alt="Resumes" style={{ width: "20px", height: "20px" }} />
      </div>
      <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#1a1a1a" }}>
        Active Jobs
      </h3>
    </div>

  
    <div>
      <p style={{ margin: "0 0 4px", fontSize: "68px", fontWeight: 500, color: "#10B981" }}>
        {/* {resumeUploadedCount} */}
        {activeJobsCount}
      </p>
    </div>
   
   
   
   <div>
     <p style={{ color: "#64748b", fontSize: "13px" }}>
      {/* Total uploaded */}
      Currently live positions
    </p>
    <p style={{  fontSize: "12px", fontWeight: 500, margin: "8px" }}>
      {/* +{Math.floor(resumeUploadedCount * 0.15)} recent */}
      With <strong style={{ color: "#1a1a1a" }}>
          {candidatesData.filter(a => companyJobs.some(j => j.id === a.jobId && j.isActive)).length}
        </strong> applications
    </p>
   </div>



  </div>

  {/* 3. Applications Funnel – Compact Bars */}
  {/* New Card: Job Status Breakdown – Same premium style */}
  {/* Replacement: Jobs by Department */}
<div style={{
  background: "#ffffff",
  borderRadius: "14px",
  padding: "18px",
  boxShadow: "0 6px 16px rgba(0,0,0,0.05)",
  border: "1px solid #f0f0f0",
  transition: "all 0.2s",
}}
onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 10px 24px rgba(0,0,0,0.08)"}
onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.05)"}
>
  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
    <div style={{
      width: "40px",
      height: "40px",
      background: "#FFF4ED",
      borderRadius: "10px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <img src={FileIcon} alt="Departments" style={{ width: "20px", height: "20px" }} />
    </div>
    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#1a1a1a" }}>
      Jobs by Department
    </h3>
  </div>

  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
    {Object.entries(
      companyJobs.reduce((acc, j) => {
        const dept = j.department || "Other";
        acc[dept] = (acc[dept] || 0) + 1;
        return acc;
      }, {})
    ).slice(0, 5).map(([dept, count]) => {
      const percentage = totalJobsCount > 0 ? Math.round((count / totalJobsCount) * 100) : 0;

      return (
        <div key={dept} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
            <span style={{ color: "#64748b" }}>{dept}</span>
            <strong style={{ color: "#1a1a1a" }}>{count}</strong>
          </div>
          <div style={{
            height: "5px",
            background: "#e2e8f0",
            borderRadius: "3px",
            overflow: "hidden",
          }}>
            <div style={{
              height: "100%",
              width: `${percentage}%`,
              background: "#f59e0b",
              transition: "width 0.4s ease",
            }} />
          </div>
        </div>
      );
    })}
    <div style={{ marginTop: "6px", fontSize: "13px", color: "#64748b", textAlign: "right" }}>
      Total: <strong style={{ color: "#1a1a1a" }}>{totalJobsCount}</strong>
    </div>
  </div>
</div>

  {/* 4. Response Efficiency – Fixed & Clean */}
<div style={{
  background: "#ffffff",
  borderRadius: "14px",
  padding: "18px",
  boxShadow: "0 6px 16px rgba(0,0,0,0.05)",
  border: "1px solid #f0f0f0",
  textAlign: "center",
  transition: "all 0.2s",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
}}
onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 10px 24px rgba(0,0,0,0.08)"}
onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.05)"}
>
  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
    <div style={{
      width: "40px",
      height: "40px",
      background: "#FFF4ED",
      borderRadius: "10px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <img src={OverviewIcon} alt="Hiring" style={{ width: "20px", height: "20px" }} />
    </div>
    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#1a1a1a" }}>
      Response Efficiency
    </h3>
  </div>

  <div>
    <p style={{ margin: "0 0 4px", fontSize: "60px", fontWeight: 500, color: "#10b981" }}>
      {responseRate}%
    </p>
    <p style={{ color: "#64748b", fontSize: "13px" }}>
      Response rate
    </p>
  </div>

  {/* Progress Bar – Fixed */}
  <div style={{
    height: "6px",
    background: "#e2e8f0",
    borderRadius: "3px",
    margin: "12px 0",
    overflow: "hidden",
  }}>
    <div style={{
      height: "100%",
      width: `${responseRate}%`,
      background: "linear-gradient(to right, #10b981, #34d399)",
      transition: "width 0.5s ease",
    }} />
  </div>

  {/* Responded Count */}
  <p style={{ color: "#1a1a1a", fontSize: "13px", marginTop: "8px" }}>
    <strong>{respondedApplicationsCount}</strong> / {totalApplicationsCount} responded
  </p>
</div>
</div>

        {/* Search Bar + Filters */}
        <div className="jobs-header" style={{marginBottom: "32px"}}>
          <div className="search-section" style={{display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px",padding: "0 30px"}}>
            <div className="search-bar" style={{flex: 1, maxWidth: "1000px"}}>
              <input
                type="text"
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
                style={{
                  width: "100%",
                  padding: "12px 20px",
                  border: "2px solid #DCDCDC",
                  borderRadius: "12px",
                  fontSize: "16px",
                  background:"#F8F8F8",
                }}
              />
            </div>
         
            <div
  className="filters"
  style={{ display: "flex", gap: "12px", alignItems: "center", position: "relative" }}
  ref={advancedRef}
>
  <button
    className="advanced-filters-btn"
    onClick={() => setShowAdvancedFilters((p) => !p)}
    style={{
      padding: "10px 20px",
      border: "1px solid #e5e7eb",
      background: "#FFC89580",
      borderRadius: "100px",
      fontFamily: '"SF Pro", "SFProText", -apple-system, BlinkMacSystemFont, sans-serif',
      fontWeight: 600,
      fontSize: 16,
      letterSpacing: 0,
      cursor: "pointer",
    }}
  >
    <GiSettingsKnobs /> Advanced filters
  </button>

  {/* Popover panel */}
{showAdvancedFilters && (
  <div
    style={{
      position: "absolute",
      // top: "110%",
      // right: 0,
      bottom: "10px",
      right: "330px",
      width: "520px",
      background: "#ffffff",
      borderRadius: "24px",
      boxShadow: "0 24px 60px rgba(15, 23, 42, 0.18)",
      padding: "24px",
      zIndex: 20,
      fontFamily: '"SF Pro", "SFProText", -apple-system, BlinkMacSystemFont, sans-serif',
      color: "#111827",
      // maxHeight: "80vh",
      maxHeight: "50vh",
      overflowY: "auto",
    }}
  >
    {/* Header */}
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "20px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "12px",
            background: "linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#FB923C",
            fontSize: "20px",
          }}
        >
          <GiSettingsKnobs />
        </div>
        <span style={{ fontWeight: 700, fontSize: 20 }}>Advanced Job Filters</span>
      </div>

      <button
        onClick={() => setShowAdvancedFilters(false)}
        style={{
          border: "none",
          background: "transparent",
          cursor: "pointer",
          fontSize: 24,
          color: "#9CA3AF",
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>

    {/* Live Match Count */}
    <div style={{
      background: "#f8fafc",
      borderRadius: "12px",
      padding: "12px 16px",
      marginBottom: "24px",
      fontSize: "14px",
      color: "#475569",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    }}>
      <span>Matching Jobs</span>
      <strong style={{ color: "#1e293b", fontSize: "16px" }}>
        {filteredJobs.length} / {companyJobs.length}
      </strong>
    </div>

  

    {/* Department Multi-Select */}
    <div style={{ marginBottom: 24 }}>
      <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
        Department
      </label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {[...new Set(companyJobs.map(j => j.department || "Other"))].map(dept => (
          <button
            key={dept}
            style={{
              padding: "8px 16px",
              borderRadius: "999px",
              border: selectedDepartments.includes(dept) ? "1px solid #FB923C" : "1px solid #d1d5db",
              background: selectedDepartments.includes(dept) ? "#FFF7ED" : "#ffffff",
              fontSize: "13px",
              cursor: "pointer",
              transition: "all 0.2s",
              color: selectedDepartments.includes(dept) ? "#FB923C" : "#374151",
            }}
            onClick={() => {
              setSelectedDepartments(prev =>
                prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept]
              );
            }}
          >
            {dept}
          </button>
        ))}
      </div>
    </div>

    {/* Location Multi-Select */}
    <div style={{ marginBottom: 24 }}>
      <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
        Location
      </label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {[...new Set(companyJobs.map(j => j.location || "Unknown"))].map(loc => (
          <button
            key={loc}
            style={{
              padding: "8px 16px",
              borderRadius: "999px",
              border: selectedLocations.includes(loc) ? "1px solid #FB923C" : "1px solid #d1d5db",
              background: selectedLocations.includes(loc) ? "#FFF7ED" : "#ffffff",
              fontSize: "13px",
              cursor: "pointer",
              transition: "all 0.2s",
              color: selectedLocations.includes(loc) ? "#FB923C" : "#374151",
            }}
            onClick={() => {
              setSelectedLocations(prev =>
                prev.includes(loc) ? prev.filter(l => l !== loc) : [...prev, loc]
              );
            }}
          >
            {loc}
          </button>
        ))}
      </div>
    </div>

    {/* Employment Type */}
    <div style={{ marginBottom: 24 }}>
      <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
        Employment Type
      </label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {["full-time", "part-time", "contract", "internship"].map(type => (
          <button
            key={type}
            style={{
              padding: "8px 16px",
              borderRadius: "999px",
              border: selectedEmploymentTypes.includes(type) ? "1px solid #FB923C" : "1px solid #d1d5db",
              background: selectedEmploymentTypes.includes(type) ? "#FFF7ED" : "#ffffff",
              fontSize: "13px",
              cursor: "pointer",
              transition: "all 0.2s",
              color: selectedEmploymentTypes.includes(type) ? "#FB923C" : "#374151",
            }}
            onClick={() => {
              setSelectedEmploymentTypes(prev =>
                prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
              );
            }}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>
    </div>

    {/* Experience Level */}
    <div style={{ marginBottom: 24 }}>
      <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
        Experience Level
      </label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {["entry-level", "mid-level", "senior-level", "executive"].map(level => (
          <button
            key={level}
            style={{
              padding: "8px 16px",
              borderRadius: "999px",
              border: selectedExperienceLevels.includes(level) ? "1px solid #FB923C" : "1px solid #d1d5db",
              background: selectedExperienceLevels.includes(level) ? "#FFF7ED" : "#ffffff",
              fontSize: "13px",
              cursor: "pointer",
              transition: "all 0.2s",
              color: selectedExperienceLevels.includes(level) ? "#FB923C" : "#374151",
            }}
            onClick={() => {
              setSelectedExperienceLevels(prev =>
                prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]
              );
            }}
          >
            {level.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
          </button>
        ))}
      </div>
    </div>

    {/* Work Arrangement */}
    <div style={{ marginBottom: 24 }}>
      <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
        Work Arrangement
      </label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {["onsite", "hybrid", "remote"].map(arr => (
          <button
            key={arr}
            style={{
              padding: "8px 16px",
              borderRadius: "999px",
              border: selectedWorkArrangements.includes(arr) ? "1px solid #FB923C" : "1px solid #d1d5db",
              background: selectedWorkArrangements.includes(arr) ? "#FFF7ED" : "#ffffff",
              fontSize: "13px",
              cursor: "pointer",
              transition: "all 0.2s",
              color: selectedWorkArrangements.includes(arr) ? "#FB923C" : "#374151",
            }}
            onClick={() => {
              setSelectedWorkArrangements(prev =>
                prev.includes(arr) ? prev.filter(a => a !== arr) : [...prev, arr]
              );
            }}
          >
            {arr.charAt(0).toUpperCase() + arr.slice(1)}
          </button>
        ))}
      </div>
    </div>

    {/* Salary Range */}
    <div style={{ marginBottom: 24 }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: 12,
        fontSize: 14,
        fontWeight: 600,
      }}>
        <span>Salary Range (per month)</span>
        <span style={{ color: "#9CA3AF" }}>
          ₹{salaryRange[0]}K – ₹{salaryRange[1]}K
        </span>
      </div>

      <input
        type="range"
        min="0"
        max="200"
        value={salaryRange[1]}
        onChange={(e) => setSalaryRange([salaryRange[0], Number(e.target.value)])}
        style={{
          width: "100%",
          accentColor: "#FFAB49",
          height: "6px",
          borderRadius: "3px",
        }}
      />
    </div>

    {/* Bottom Buttons */}
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      marginTop: "24px",
    }}>
      <button
        style={{
          padding: "12px 24px",
          borderRadius: "999px",
          border: "1px solid #d1d5db",
          background: "#ffffff",
          fontSize: "14px",
          fontWeight: 600,
          color: "#4b5563",
          cursor: "pointer",
        }}
        onClick={() => {
          // Clear all filters
          setSearchTerm("");
          setSelectedDepartments([]);
          setSelectedLocations([]);
          setSelectedEmploymentTypes([]);
          setSelectedExperienceLevels([]);
          setSalaryRange([0, 200]);
          setSelectedWorkArrangements([]);
          setShowAdvancedFilters(false);
        }}
      >
        Clear All
      </button>

      <button
        style={{
          padding: "12px 32px",
          borderRadius: "999px",
          border: "none",
          // background: "linear-gradient(90deg, #FDBA74 0%, #FB923C 50%, #F97316 100%)",
          background: "#FFAB49",
          color: "#ffffff",
          fontSize: "14px",
          fontWeight: 700,
          cursor: "pointer",
          boxShadow: "0 8px 20px rgba(251, 146, 60, 0.3)",
        }}
        onClick={() => {
          setShowAdvancedFilters(false);
          // Filters are already applied live via filteredJobs
        }}
      >
        Apply & Close
      </button>
    </div>
  </div>
)}

  <button
    className="clear-filters-btn"
    style={{
      padding: "10px 20px",
      border: "1px solid #e5e7eb",
      background: "#FEF2F2",
      borderRadius: "12px",
      fontSize: "14px",
      color: "#E94545",
    }}
    onClick={() => {
          // Clear all filters
          setSearchTerm("");
          setSelectedDepartments([]);
          setSelectedLocations([]);
          setSelectedEmploymentTypes([]);
          setSelectedExperienceLevels([]);
          setSalaryRange([0, 200]);
          setSelectedWorkArrangements([]);
          setShowAdvancedFilters(false);
        }}
  >
    <FaRegCircleXmark
      style={{ color: "#E94545", paddingBottom: "4px", height: "17px" }}
    />{" "}
    Clear filter
  </button>
</div>

          </div>
        </div>

        {/* Jobs Grid - Clickable cards */}
        <div className="jobs-grid" style={{ display: "grid", margin: "30px 30px 0 30px", gap: "24px", paddingBottom: "60px" }}>
          {filteredJobs.length === 0 ? (
            <div 
              style={{
                gridColumn: "1 / -1", // span full width
                padding: "80px 20px",
                textAlign: "center",
                color: "#64748b",
                background: "#ffffff",
                borderRadius: "20px",
                border: "1px dashed #e2e8f0",
                minHeight: "300px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "16px",
              }}
            >
              {/* Icon */}
              <div style={{ fontSize: "64px", opacity: 0.4 }}>
                📭
              </div>

              <h3 style={{
                margin: 0,
                fontSize: "22px",
                fontWeight: 600,
                color: "#1e293b",
              }}>
                No jobs found
              </h3>

              <p style={{
                margin: "8px 0 0",
                fontSize: "15px",
                maxWidth: "420px",
                lineHeight: "1.5",
              }}>
                {searchTerm || selectedStatus || activeTab !== "All"
                  ? "Try adjusting your search, filters, or department tab"
                  : "There are no active jobs in this company yet"}
              </p>

              {/* Reset filters button - only if filters are active */}
              {(searchTerm || selectedStatus || activeTab !== "All") && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedStatus("");
                    // Optional: reset other filters if you have them
                  }}
                  style={{
                    marginTop: "20px",
                    padding: "12px 24px",
                    background: "#FFAB49",
                    color: "white",
                    border: "none",
                    borderRadius: "12px",
                    fontWeight: 500,
                    fontSize: "15px",
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(255,171,73,0.2)",
                  }}
                >
                  Clear Filters & Reset
                </button>
              )}

              {/* Optional: Post Job CTA for admins */}
              {["ADMIN", "SUPER_ADMIN"].includes(role) && (
                <button
                  onClick={handlePostJobClick}
                  style={{
                    marginTop: "12px",
                    padding: "12px 24px",
                    background: "transparent",
                    color: "#FFAB49",
                    border: "2px solid #FFAB49",
                    borderRadius: "12px",
                    fontWeight: 500,
                    fontSize: "15px",
                    cursor: "pointer",
                  }}
                >
                  + Post Your First Job
                </button>
              )}
            </div>
          ) : (
            filteredJobs.map(job => {
              const jobStatus = job.isActive ? "Active" : "Inactive";
              const salaryText = job.salary
                ? `₹${job.salary.min} - ₹${job.salary.max}${job.salary.type ? ` / ${job.salary.type.replace("per-", "")}` : ""}`
                : "N/A";

              console.log("rrrrr Rendering Job:", job);

              return (
                <div 
                  key={job.id} 
                  className={`job-card ${jobStatus.toLowerCase()}`} 
                  style={{
                    background: "white",
                    border: "1px solid #f1f5f9",
                    borderRadius: "20px",
                    padding: "28px",
                    position: "relative",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    maxWidth: "100vw"
                  }}
                  onClick={() => {
                    setSelectedJob(job);
                    setViewMode('details');
                    console.log("Selected Job:", job);
                  }}
                >
                  {/* Title + Department + Actions Row */}
                  <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px"}}>
                    <div style={{flex: 1}}>
                      <h3 style={{margin: "0 0 12px 0", fontSize: "22px", fontWeight: "600", color: "#0f172a"}}>
                        {job.jobTitle}
                        <span style={{
                          background: "#FFF6EB",
                          color: "#FFAB49",
                          padding: "6px 14px",
                          borderRadius: "24px",
                          fontSize: "14px",
                          fontWeight: "600",
                          marginLeft:"12px"
                        }}>
                          <FaRegCircleXmark style={{height: "25px", paddingBottom: "3px"}} /> {job.department} 
                        </span> 
                      </h3>
                    </div>

                    <div className="job-actions" style={{ position: "relative", marginLeft: "20px", display: "flex", justifyContent: "center", alignItems: "center", gap: "20px" }}>
                      {/* Status Badge */}
                      <div>
                        <span style={{
                          padding: "10px 20px",
                          borderRadius: "9999px",
                          fontSize: "14px",
                          fontWeight: "600",
                          background: jobStatus === "Active" ? "#ecfdf5" : "#ffe7e7",
                          color: jobStatus === "Active" ? "#166534" : "#d90606",
                        }}>
                          {jobStatus}
                        </span>
                      </div>

                      <button 
                        className="more-actions-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdown(activeDropdown === job.id ? null : job.id);
                        }}
                        style={{
                          padding: "12px",
                          border: "1px solid #e2e8f0", 
                          background: "white", 
                          borderRadius: "12px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          minWidth: "48px",
                          height: "48px"
                        }}
                      >
                        <SlOptionsVertical style={{fontSize: "16px", color: "#64748b"}} />
                      </button>

                      {activeDropdown === job.id && (
  <div
    className="actions-dropdown"
    ref={dropdownRef}
    style={{
      position: "absolute",
      top: "120%",
      right: "0",
      background: "white",
      border: "1px solid #e2e8f0",
      borderRadius: "12px",
      boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
      zIndex: 9999,
      minWidth: "160px",
      marginTop: "8px"
    }}
    onClick={(e) => e.stopPropagation()}
  >

    {/* Preview */}
    <button
      className="dropdown-item"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        width: "100%",
        padding: "12px 16px",
        border: "none",
        background: "none",
        textAlign: "left",
        fontSize: "14px",
        fontWeight: "500",
        color: "#374151",
        cursor: "pointer"
      }}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedJob(job);
        setViewMode("details");
        setActiveDropdown(null);
      }}
    >
      <HiOutlineEye style={{ fontSize: "16px" }} /> Preview
    </button>


    {/* Edit */}
    <button
      className="dropdown-item"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        width: "100%",
        padding: "12px 16px",
        border: "none",
        background: "none",
        textAlign: "left",
        fontSize: "14px",
        fontWeight: "500",
        color: "#374151",
        cursor: "pointer"
      }}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedJob(job);
        setActiveDropdown(null);
        setEditJobsOpen(true);
      }}
    >
      <FaEdit style={{ fontSize: "16px" }} /> Edit
    </button>

    <button
  className="dropdown-item"
  style={{
    display: "flex",
    alignItems: "center",
    gap: "10px",
    width: "100%",
    padding: "12px 16px",
    border: "none",
    background: "none",
    textAlign: "left",
    fontSize: "14px",
    fontWeight: "500",
    color: "#374151",
    cursor: "pointer"
  }}
  onClick={(e) => {
    e.stopPropagation();
    setActiveDropdown(null);
    setJobToDuplicate(job);
    setShowDuplicateJobModal(true);
  }}
>
  <HiOutlineDocumentDuplicate style={{ fontSize: "16px" }} />
  Duplicate
</button>


    {/* Activate / Deactivate */}
    <button
      className="dropdown-item delete"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        width: "100%",
        padding: "12px 16px",
        border: "none",
        background: "none",
        textAlign: "left",
        fontSize: "14px",
        fontWeight: "500",
        color: job.isActive ? "#dc2626" : "#4fb424",
        cursor: "pointer",
        transition: "all 0.15s ease"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = job.isActive
          ? "rgba(6, 95, 70, 0.06)"
          : "rgba(146, 64, 14, 0.06)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
      }}
      onClick={(e) => {
        e.stopPropagation();
        setActiveDropdown(null);
        handleToggleJobStatus(job);
      }}
    >
      {job.isActive ? (
        <BsToggle2Off style={{ fontSize: "18px", color: "#dc2626" }} />
      ) : (
        <BsToggle2On style={{ fontSize: "18px", color: "#4fb424" }} />
      )}

      {job.isActive ? "Deactivate Job" : "Activate Job"}
    </button>


    {/* Remove */}
    <button
      className="dropdown-item delete"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        width: "100%",
        padding: "12px 16px",
        border: "none",
        background: "none",
        textAlign: "left",
        fontSize: "14px",
        fontWeight: "500",
        color: "#dc2626",
        cursor: "pointer"
      }}
      onClick={(e) => {
        e.stopPropagation();
        setActiveDropdown(null);
        setJobToDelete(job);
        setShowDeleteJobModal(true);
      }}
    >
      <RiDeleteBin5Line style={{ fontSize: "16px", color: "#dc2626" }} /> Remove
    </button>

  </div>
)}
                    </div>
                  </div>

                  {/* Meta Row */}
                  <div style={{display: "flex", gap: "32px", alignItems: "center", marginBottom: "10px", flexWrap: "wrap", justifyContent: "space-between"}}>
                    <div style={{display: "flex", background: "#FAFAFA", padding: "12px 16px", borderRadius: "16px", gap:"8px", alignItems: "center", minWidth: "275px"}}>
                      <div><img src={location} alt="" /></div>
                      <div> 
                        <div style={{color:"#7C7C7C", fontSize:"10px"}}>location</div>
                        <div style={{fontSize:"16px", fontWeight:"500", color:"#101828"}}>{job.location}</div>
                      </div>
                    </div>

                    <div style={{display: "flex", background: "#FAFAFA", padding: "12px 16px", borderRadius: "16px", gap:"8px", alignItems: "center", minWidth: "275px"}}>
                      <div><img src={location} alt="" /></div>
                      <div> 
                        <div style={{color:"#7C7C7C", fontSize:"10px"}}>Type</div>
                        <div style={{fontSize:"16px", fontWeight:"500", color:"#101828"}}>
                          {job.employmentType}
                        </div>
                      </div>
                    </div>

                    <div style={{display: "flex", background: "#FAFAFA", padding: "12px 16px", borderRadius: "16px", gap:"8px", alignItems: "center", minWidth: "275px"}}>
                      <div><img src={location} alt="" /></div>
                      <div> 
                        <div style={{color:"#7C7C7C", fontSize:"10px"}}>Salary</div>
                        <div style={{fontSize:"16px", fontWeight:"500", color:"#101828"}}>
                          {salaryText}
                        </div>
                      </div>
                    </div>

                    <div style={{display: "flex", background: "#FAFAFA", padding: "12px 16px", borderRadius: "16px", gap:"8px", alignItems: "center", minWidth: "275px"}}>
                      <div><img src={location} alt="" /></div>
                      <div> 
                        <div style={{color:"#7C7C7C", fontSize:"10px"}}>Applications</div>
                        <div style={{fontSize:"16px", fontWeight:"500", color:"#101828"}}>{job.applicationCount ?? 0}</div>
                      </div>
                    </div>
                  </div>

                  {/* Skills Row */}
                  <div style={{display: "flex", flexWrap: "wrap", gap: "12px", marginTop:"20px"}}>
                    {(job.requiredSkills || []).slice(0, 3).map((skill, idx) => (
                      <span key={idx} style={{
                        background: "#FAFAFA",
                        color: "#575757",
                        padding: "8px 16px", 
                        borderRadius: "12px",
                        fontSize: "14px",
                        fontWeight: "500",
                        border: "1px solid #e2e8f0"
                      }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
              </div>
            )}

            {/* Part 2: Job Details View */}
            {viewMode === 'details' && selectedJob && (
              <div style={{padding: "5px 30px",  margin: "0 auto"}}>
                {/* Back Button */}
                <button 
                  onClick={() => {
                    setViewMode('grid');
                    setSelectedJob(null);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "12px 20px",
                    background: "white",
                    border: "1px solid #e2e8f0",
                    borderRadius: "32px",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#374151",
                    cursor: "pointer",
                    marginBottom: "20px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 18L9 12L15 6" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Back
                </button>

                {/* Job Details Content */}
                <div style={{
                  background: "white",
                  borderRadius: "12px",
                  padding: "24px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                  border: "1px solid #f1f5f9"
                }}>
                  <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px"}}>
                    <div style={{display:"flex" , alignItems:"center", gap:"10px"}}>
                      <div>
                        <img src={briefcaseIcon} alt="" /> 
                      </div>
                      <div>
                      <h1 style={{fontSize: "32px", fontWeight: "700", color: "#0f172a"}}>
                        {/* {selectedJob.title} */}
                        {jobDetailsText(selectedJob.jobTitle || selectedJob.title)}
                      </h1>
                    <div style={{display:"flex", alignItems:"center", gap:"5px"}}>
                      {/* <p>Infomanav</p> */}
                      <p>{selectedJob.companyName}</p>
                      <p
                        style={{
                          background: selectedJob.isActive ? "#EEFEF6" : "#FEE2E2",
                          color: selectedJob.isActive ? "#3E894E" : "#B91C1C",
                          border: selectedJob.isActive ? "1px solid #86EFAC" : "1px solid #FCA5A5",
                          padding: "8px 16px",
                          borderRadius: "24px",
                          fontSize: "12px",
                          fontWeight: "600",
                          width: "fit-content",
                          marginTop: "0"
                        }}
                      >
                        {selectedJob.isActive ? "Active" : "Inactive"}
                      </p>

                    </div>
                    </div>
                    </div>

                    {/* <span style={{
                      padding: "12px 24px",
                      borderRadius: "9999px",
                      fontSize: "16px",
                      fontWeight: "600",
                      background: selectedJob.status === "Active" ? "#ecfdf5" : "#fef3c7",
                      color: selectedJob.status === "Active" ? "#166534" : "#d97706"
                    }}>
                      {selectedJob.status}
                    </span> */}

                    {/* Action Buttons */}
                  <div style={{display: "flex", gap: "16px"}}>
                    
                    {/* <button style={{
                      padding: "16px 24px",
                      background: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "12px",
                      fontSize: "16px",
                      fontWeight: "500",
                      color: "#374151",
                      cursor: "pointer"
                    }}>
                      Share Job
                    </button> */}
                    {/* <button style={{background:"transparent"}}>
                      <img src={SaveIcon2} alt="" />
                    </button> */}

                    <div style={{ display: "flex", gap: "12px" }}>
          {/* Toggle Active / Inactive */}
        {/* Publish/Unpublish Button */}
    <button
  onClick={() => handleToggleJobStatus(selectedJob)}
  disabled={false} // ← replace with your isToggling state if you have loading
  style={{
    padding: "12px 24px",
    borderRadius: "112px",
    fontSize: "15px",
    fontWeight: 600,
    fontFamily: '"SF Pro", "SFProText", -apple-system, BlinkMacSystemFont, sans-serif',
    cursor: "pointer",
    transition: "all 0.3s ease",
    border: "none",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    background: selectedJob.isActive 
      ? "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)" 
      : "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
    color: selectedJob.isActive ? "#374151" : "#ffffff",
    letterSpacing: "0.3px",
    display: "flex",
    alignItems: "center",
    gap: "10px", // space between icon and text
  }}
  onMouseEnter={(e) => {
    if (selectedJob.isActive) {
      e.currentTarget.style.background = "linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)";
      e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
      e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.12)";
    } else {
      e.currentTarget.style.background = "linear-gradient(135deg, #15803d 0%, #166534 100%)";
      e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
      e.currentTarget.style.boxShadow = "0 8px 20px rgba(22,163,74,0.35)";
    }
  }}
  onMouseLeave={(e) => {
    if (selectedJob.isActive) {
      e.currentTarget.style.background = "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)";
      e.currentTarget.style.transform = "translateY(0) scale(1)";
      e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
    } else {
      e.currentTarget.style.background = "linear-gradient(135deg, #16a34a 0%, #15803d 100%)";
      e.currentTarget.style.transform = "translateY(0) scale(1)";
      e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
    }
  }}
  onMouseDown={(e) => {
    e.currentTarget.style.transform = "translateY(0) scale(0.98)";
    e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
  }}
  onMouseUp={(e) => {
    e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
    e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.12)";
  }}
>
  {selectedJob.isActive ? (
    <>
      <Lock size={18} strokeWidth={2.5} />
      Unpublish Job
    </>
  ) : (
    <>
      <Globe size={18} strokeWidth={2.5} />
      Publish Job
    </>
  )}
</button>

        {/* Delete Job */}
        <button
          onClick={() => setShowDeleteJobModal(true)}
          style={{
            padding: "11px 18px",
            borderRadius: "112px",
            border: "1px solid #fecaca",
            fontSize: "15px",
            fontWeight: "600",
            cursor: "pointer",
            color: "#dc2626",
            background: "#fff",
            transition: "all 0.2s ease",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.04)";
            e.currentTarget.style.boxShadow = "0 6px 16px rgba(220,38,38,0.2)";
            e.currentTarget.style.background = "#fef2f2";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
            e.currentTarget.style.background = "#fff";
          }}
        >
          Delete Job
        </button>
        </div>

                  </div>
                  </div>

                  {/* Key Info Grid */}
                  <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr)", gap: "24px", paddingBottom: "20px", borderBottom: "2px solid #f1f5f9"}}>
                    <div style={{background: "#FAFAFA", padding: "20px", borderRadius: "16px", display: "flex", alignItems: "center", gap: "10px"}}>
                      {/* LocationIconColoured */}
                      <div> 
                        <img src={LocationIconColoured} alt="" />
                      </div>
                      <div>
                        <div style={{color: "#7C7C7C", fontSize: "12px", }}>Location</div>
                        <div style={{fontSize: "18px", fontWeight: "600", color: "#101828"}}>
                          {/* {selectedJob.location} */}
                          {jobDetailsText(selectedJob.location)}
                          </div>
                      </div>
                    </div>


                    <div style={{background: "#FAFAFA", padding: "20px", borderRadius: "16px", display: "flex", alignItems: "center", gap: "10px"}}>
                      <div>
                        <img src={TimeIcon2} alt="" />
                      </div>
                      <div>
                        <div style={{color: "#7C7C7C", fontSize: "12px", }}>Job Type</div>
                      <div style={{fontSize: "18px", fontWeight: "600", color: "#101828"}}>
                        {/* {selectedJob.type} */}
                        {jobDetailsText(selectedJob.jobType || selectedJob.employmentType)}

                      </div>
                      </div>
                    </div>




                    <div style={{background: "#FAFAFA", padding: "20px", borderRadius: "16px", display: "flex", alignItems: "center", gap: "10px"}}>
                      <div>
                        <img src={SalaryIcon} alt="" />
                      </div>
                      <div>
                        <div style={{color: "#7C7C7C", fontSize: "12px", }}>Salary</div>
                      <div style={{fontSize: "18px", fontWeight: "600", color: "#101828"}}>
                        {/* {selectedJob.salary} */}
                        {jobDetailsSalaryText}
                        </div>
                      </div>
                    </div>



                    <div style={{background: "#FAFAFA", padding: "20px", borderRadius: "16px", display: "flex", alignItems: "center", gap: "10px"}}>
                      <div>
                        <img src={ApplicationIcon} alt="" />
                      </div>
                      <div>
                        <div style={{color: "#7C7C7C", fontSize: "12px", }}>Applicants</div>
                      <div style={{fontSize: "18px", fontWeight: "600", color: "#101828"}}>
                        {/* {selectedJob.applicants} */}
                        {jobDetailsApplicantsCount}

                        </div>
                      </div>
                    </div>
                  </div>

              <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:"10px"}}>
                <div style={{display:"flex", alignItems:"center"}}>
                  <img src={PostedDaysAgo} alt="" /> 
                  {/* <span style={{paddingLeft:"5px"}}>Posted 3 days ago </span> */}
                  <span style={{ paddingLeft: "5px" }}>
                    {getPostedDaysAgoText(selectedJob.createdAt)}
                  </span>

                  <span  style={{paddingLeft:"20px", display:"flex", alignItems:"center", gap:"5px"}}>
                    <img src={ApplicationsIcon2} alt="" style={{height:"14px"}} /> 
                    {/* <span>{selectedJob.applicants} Applications</span> */}
                    <span>{jobDetailsApplicantsCount} Applications</span>
                  </span>
                </div>
                {/* <div>Job ID: {selectedJob.id}</div> */}
              </div>
              
              
                </div>



                <div  style={{
                  background: "white",
                  borderRadius: "12px",
                  padding: "24px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                  border: "1px solid #f1f5f9",
                  marginTop:"10px "
                }}>
                  <div style={{ fontWeight: 700, fontStyle: "Bold", fontSize: 20, lineHeight: "120%", letterSpacing: "0%", color:"#101828"}}>About this role</div>
                  <div style={{color:"#575757", marginTop:"10px"}}>
                    {jobDetailsText(selectedJob.jobDescription)}
                  </div>
                </div>


                <div
          style={{
            background: "white",
            borderRadius: "12px",
            padding: "24px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
            border: "1px solid #f1f5f9",
            marginTop: "10px",
          }}
        >
          <div
            style={{
              fontWeight: 700,
              fontSize: 20,
              lineHeight: "120%",
              color: "#101828",
            }}
          >
            Requirements
          </div>

          {/* Experience */}
          <div
            style={{
              color: "#575757",
              marginTop: "10px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <img src={ColorfullCheck} alt="" />
            <p>Experience: {jobDetailsText(selectedJob.experienceYears)}</p>
          </div>

          {/* Skills */}
          <div
            style={{
              color: "#575757",
              marginTop: "10px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <img src={ColorfullCheck} alt="" />
            <p>
              Skills like:{" "}
              {jobDetailsSkillsArray.length
                ? jobDetailsSkillsArray.join(", ")
                : "N/A"}
            </p>
          </div>

          {/* Responsibilities (mapped) */}
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
                <img src={ColorfullCheck} alt="" />
                <p>{respItem}</p>
              </div>
            ))}
        </div>







                <div  style={{
                  background: "white",
                  borderRadius: "12px",
                  padding: "24px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                  border: "1px solid #f1f5f9",
                  marginTop:"10px "
                }}>
                  {/* Skills */}
                  <div >
                    <h3 style={{fontSize: "20px", fontWeight: "600", color: "#0f172a", margin: "0 0 16px 0"}}>Required Skills</h3>
                    <div style={{display: "flex", flexWrap: "wrap", gap: "12px"}}>
                      {/* {selectedJob.skills.split(', ').map((skill, idx) => (
                        <span key={idx} style={{
                          background: "#FAFAFA",
                          color: "#575757",
                          padding: "10px 20px",
                          borderRadius: "12px",
                          fontSize: "14px",
                          fontWeight: "500",
                          border: "1px solid #e2e8f0"
                        }}>{skill}</span>
                      ))} */}
                      {jobDetailsSkillsArray.map((skill, idx) => (
                        <span
                          key={idx}
                          style={{
                            background: "#FAFAFA",
                            color: "#575757",
                            padding: "10px 20px",
                            borderRadius: "12px",
                            fontSize: "14px",
                            fontWeight: "500",
                            border: "1px solid #e2e8f0"
                          }}
                        >
                          {skill}
                        </span>
                      ))}

                    </div>
                  </div>

                
                </div>






        <div
          style={{
            background: "white",
            borderRadius: "12px",
            padding: "24px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
            border: "1px solid #f1f5f9",
            marginTop: "10px",
          }}
        >
          <div
            style={{
              fontWeight: 700,
              fontSize: 20,
              lineHeight: "120%",
              color: "#101828",
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
                        color: "#575757",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <img src={ColorfullCheck} alt="" />
                      <p>{benefit}</p>
                    </div>

                    {selectedJob.benefits[index + 1] && (
                      <div
                        style={{
                          color: "#575757",
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        <img src={ColorfullCheck} alt="" />
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




        <div  style={{
                  background: "white",
                  borderRadius: "12px",
                  padding: "24px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                  border: "1px solid #f1f5f9",
                  marginTop:"10px ",
                  marginBottom:"50px"
                }}>
                  <div style={{ fontWeight: 700, fontStyle: "Bold", fontSize: 20, lineHeight: "120%", letterSpacing: "0%", color:"#101828"}}>About Us</div>
                  {/* ColorfullCheck */}
                    <div style={{color:"#575757", marginTop:"10px", display:"flex", alignItems:"center", gap:"10px"}}>
                      <p>
                        {jobDetailsText(selectedJob.companyAboutUs)}
                      </p>

                    </div>
                  
                </div>

                {/*  */}
              </div>
            )}
          </div>
        )}


{/* applications */}
{activeTab === "applications" && (
  <div>
   
      <div>
        {/* Stats Cards */}
        {/* <div className="stats-grid">
          {stats2.map(stat => (
            <div key={stat.id} className="stat-card">
              <div className="stat-header" style={{marginBottom:"0"}}>
                <span className="stat-label">{stat.label}</span>
                <div 
                  className="stat-icon" 
                  style={{ backgroundColor: stat.bgColor, color: stat.iconColor }}
                >
                  <img src={stat.icon} alt="" style={{height: "22px", color:"red"}} />
                </div>
              </div>
              <p className="stat-value" style={{fontSize:"36px"}}>{stat.value}</p>
              <p className="stat-trend1"> <FaArrowTrendUp /> {stat.trend}</p>
            </div>
          ))}
        </div> */}

        <div style={{height:"90px", display:"flex", justifyContent:"space-between", alignItems:"center", padding:"0 35px"}}>
          <div style={{ width:"80%", display: "flex", flexDirection: "column", gap: "7px"}}>
            <div style={{fontWeight: 500,
fontStyle: "Medium", fontSize: "18px", lineHeight: "20px", color:"#101828"}}>Applications Management</div>
            <div style={{fontWeight: 500,
fontStyle: "Medium", fontSize: "14px", lineHeight: "20px", color:"#575757"}}>Review and track candidate applications</div>
          </div>
          <div style={{ width:"20%", display:"flex", justifyContent:"end"}}>
            {/* <button style={{width: "132",
              height: "48",
              gap: "8px",
              angle: "0 deg",
              opacity: 1,
              borderRadius: "32px",
              paddingTop: "12px",
              paddingRight: "24px",
              paddingBottom: "12px",
              paddingLeft: "24px",
              borderWidth: "1px",
              border: "1px solid #DCDCDC",
              background:"#FFFFFF",
              color:"#575757",
              fontWeight:600,
              fontSize:"16px"
              }}>
                <div style={{display:"flex", alignItems:"center"}}>
                  <img src={ExportIcon} alt="" />
                            <span style={{paddingLeft:"10px"}}>Export</span>
                </div>
            </button> */}
            {/* <ExportDropdown application={filteredCandidates} /> */}
            <ExportDropdown candidates={filteredCandidates} />
          </div>
        </div>

        {/* Search Bar + Filters */}
        <div className="jobs-header" style={{marginBottom: "32px"}}>
          <div className="search-section" style={{display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px",padding: "0 30px"}}>
            <div className="search-bar" style={{flex: 1, maxWidth: "1000px"}}>
              <input
                type="text"
                placeholder="Search by name or position..."
                value={searchTermApplications}
                onChange={(e) => setSearchTermApplications(e.target.value)}
                className="search-input"
                style={{
                  width: "100%",
                  padding: "12px 20px",
                  border: "2px solid #DCDCDC",
                  borderRadius: "12px",
                  fontSize: "16px",
                  background:"#F8F8F8",
                }}
              />
            </div>
         
            <div
  className="filters"
  style={{ display: "flex", gap: "12px", alignItems: "center", position: "relative" }}
  ref={advancedRef}
>
  
{/* // Button + Dropdown */}
{/* <div style={{ position: "relative" }}>
  <button
    className="advanced-filters-btn"
    onClick={() => setShowStatusDropdown((p) => !p)}
    style={{
      padding: "10px 20px",
      border: "1px solid #e5e7eb",
      background: "#FFFFFF",      // White background
      borderRadius: "100px",
      fontFamily: '"SF Pro", "SFProText", -apple-system, BlinkMacSystemFont, sans-serif',
      fontWeight: 500,
      fontSize: 16,
      letterSpacing: 0,
      cursor: "pointer",
      color: "#7C7C7C",           // Gray text
      width:"220px"
    }}
  >
    <div style={{display:"flex", justifyContent:"space-between"}}>
      <div>
      All Status
    </div>
    <div>
      <FaChevronDown /> 
    </div>
    </div>
  </button>

  {showStatusDropdown && (
    <div
      style={{
        position: "absolute",
        top: "110%",
        right: 0,
        width: "220px",
        background: "#FFFFFF",
        borderRadius: "12px",
        boxShadow: "0 12px 32px rgba(15, 23, 42, 0.12)",
        border: "1px solid #E5E7EB",
        zIndex: 20,
        padding: "8px 0",
      }}
    >
      {["New", "Under Review", "Interview Scheduled", "Rejected", "Hired"].map((status) => (
        <button
          key={status}
          style={{
            width: "100%",
            textAlign: "left",
            padding: "12px 20px",
            border: "none",
            background: "transparent",
            fontSize: "14px",
            fontWeight: 500,
            color: "#111827",  // Black text
            cursor: "pointer",
            transition: "background 0.15s",
          }}
          onClick={() => {
            console.log("Selected status:", status); // Your filter logic
            setShowStatusDropdown(false);
          }}
          onMouseEnter={(e) => (e.target.style.background = "#F9FAFB")}
          onMouseLeave={(e) => (e.target.style.background = "transparent")}
        >
          {status}
        </button>
      ))}
    </div>
  )}
</div> */}
{/* Status Filter Dropdown */}
<div style={{ position: "relative" }}>
  <button
    className="advanced-filters-btn"
    onClick={() => setShowStatusDropdown((p) => !p)}
    style={{
      padding: "10px 20px",
      border: "1px solid #e5e7eb",
      background: "#FFFFFF",
      borderRadius: "100px",
      fontFamily: '"SF Pro", "SFProText", -apple-system, BlinkMacSystemFont, sans-serif',
      fontWeight: 500,
      fontSize: 16,
      letterSpacing: 0,
      cursor: "pointer",
      color: selectedStatus ? "#111827" : "#7C7C7C", // Darker when selected
      width: "220px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    }}
  >
    {selectedStatus || "All Status"}
    <FaChevronDown style={{ fontSize: "12px" }} />
  </button>

  {showStatusDropdown && (
    <div
      style={{
        position: "absolute",
        top: "110%",
        right: 0,
        width: "220px",
        background: "#FFFFFF",
        borderRadius: "12px",
        boxShadow: "0 12px 32px rgba(15, 23, 42, 0.12)",
        border: "1px solid #E5E7EB",
        zIndex: 20,
        padding: "8px 0",
      }}
    >
      {/* All Status option */}
      <button
        key="all"
        style={{
          width: "100%",
          textAlign: "left",
          padding: "12px 20px",
          border: "none",
          background: selectedStatus === "" ? "#F9FAFB" : "transparent",
          fontSize: "14px",
          fontWeight: 500,
          color: selectedStatus === "" ? "#111827" : "#111827",
          cursor: "pointer",
          transition: "background 0.15s",
        }}
        onClick={() => {
          setSelectedStatus("");
          setShowStatusDropdown(false);
          // Optional: reset page
          // setCurrentPage(1);
        }}
        onMouseEnter={(e) => (e.target.style.background = "#F9FAFB")}
        onMouseLeave={(e) => (e.target.style.background = selectedStatus === "" ? "#F9FAFB" : "transparent")}
      >
        All Status
      </button>

      {/* Status options */}
      {["New", "Under Review", "Interview Scheduled", "Rejected", "Hired", "No Show", "Offer Extended", "Offer Accepted", "Offer Declined"].map((status) => (
        <button
          key={status}
          style={{
            width: "100%",
            textAlign: "left",
            padding: "12px 20px",
            border: "none",
            background: selectedStatus === status ? "#F9FAFB" : "transparent",
            fontSize: "14px",
            fontWeight: 500,
            color: "#111827",
            cursor: "pointer",
            transition: "background 0.15s",
          }}
          onClick={() => {
            setSelectedStatus(status);
            setShowStatusDropdown(false);
            // Optional: reset page
            // setCurrentPage(1);
          }}
          onMouseEnter={(e) => (e.target.style.background = "#F9FAFB")}
          onMouseLeave={(e) => (e.target.style.background = selectedStatus === status ? "#F9FAFB" : "transparent")}
        >
          {status}
        </button>
      ))}
    </div>
  )}
</div>



  <button
    className="advanced-filters-btn"
    onClick={() => setShowAdvancedFilters((p) => !p)}
    style={{
      padding: "10px 20px",
      border: "1px solid #e5e7eb",
      background: "#FFC89580",
      borderRadius: "100px",
      fontFamily: '"SF Pro", "SFProText", -apple-system, BlinkMacSystemFont, sans-serif',
      fontWeight: 600,
      fontSize: 16,
      letterSpacing: 0,
      cursor: "pointer",
    }}
  >
    <GiSettingsKnobs /> Advanced filters
  </button>

  {/* Popover panel */}
{showAdvancedFilters && (
  <div
    // style={{
    //   position: "absolute",
    //   top: "110%",
    //   right: 0,
    //   width: "520px",
    //   background: "#ffffff",
    //   borderRadius: "24px",
    //   boxShadow: "0 24px 60px rgba(15, 23, 42, 0.18)",
    //   padding: "24px",
    //   zIndex: 20,
    //   fontFamily: '"SF Pro", "SFProText", -apple-system, BlinkMacSystemFont, sans-serif',
    //   color: "#111827",
    //   maxHeight: "80vh",
    //   overflowY: "auto",
    // }}
     style={{
      position: "absolute",
      top: 0,
      // right: 0,
      // bottom: "10px",
      right: "330px",
      width: "520px",
      background: "#ffffff",
      borderRadius: "24px",
      boxShadow: "0 24px 60px rgba(15, 23, 42, 0.18)",
      padding: "24px",
      zIndex: 20,
      fontFamily: '"SF Pro", "SFProText", -apple-system, BlinkMacSystemFont, sans-serif',
      color: "#111827",
      // maxHeight: "80vh",
      maxHeight: "50vh",
      overflowY: "auto",
    }}
  >
    {/* Header */}
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "20px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "12px",
            background: "linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#FB923C",
            fontSize: "20px",
          }}
        >
          <GiSettingsKnobs />
        </div>
        <span style={{ fontWeight: 700, fontSize: 20 }}>Advanced Candidate Filters</span>
      </div>

      <button
        onClick={() => setShowAdvancedFilters(false)}
        style={{
          border: "none",
          background: "transparent",
          cursor: "pointer",
          fontSize: 24,
          color: "#9CA3AF",
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>

    {/* Live Match Count */}
    <div style={{
      background: "#f8fafc",
      borderRadius: "12px",
      padding: "12px 16px",
      marginBottom: "24px",
      fontSize: "14px",
      color: "#475569",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    }}>
      <span>Matching Candidates:</span>
      <strong style={{ color: "#1e293b", fontSize: "16px" }}>
        {filteredCandidates.length} / {candidatesData.length}
      </strong>
    </div>

    {/* 1. Candidate Name / Job Title Search */}
    <div style={{ marginBottom: 24 }}>
      <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
        Search by Name or Job Title
      </label>
      <input
        type="text"
        placeholder="e.g. Manaswi, Backend Developer"
        value={searchTermApplications}
        onChange={(e) => setSearchTermApplications(e.target.value)}
        style={{
          width: "100%",
          padding: "12px 16px",
          border: "1px solid #d1d5db",
          borderRadius: "12px",
          fontSize: "14px",
          outline: "none",
          transition: "border-color 0.2s",
        }}
        onFocus={(e) => e.target.style.borderColor = "#FB923C"}
        onBlur={(e) => e.target.style.borderColor = "#d1d5db"}
      />
    </div>

    {/* 2. Status Multi-Select */}
    <div style={{ marginBottom: 24 }}>
      <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
        Status
      </label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {["New", "Under Review", "Interview Scheduled", "Rejected", "Hired", "No Show", "Offer Extended", "Offer Accepted", "Offer Declined"].map(status => (
          <button
            key={status}
            style={{
              padding: "8px 16px",
              borderRadius: "999px",
              border: selectedStatus === status ? "1px solid #FB923C" : "1px solid #d1d5db",
              background: selectedStatus === status ? "#FFF7ED" : "#ffffff",
              fontSize: "13px",
              cursor: "pointer",
              transition: "all 0.2s",
              color: selectedStatus === status ? "#FB923C" : "#374151",
            }}
            onClick={() => {
              setSelectedStatus(prev => prev === status ? "" : status);
            }}
          >
            {status}
          </button>
        ))}
      </div>
    </div>

    {/* 3. Job Title Multi-Select */}
    <div style={{ marginBottom: 24 }}>
      <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
        Job Title
      </label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {[...new Set(candidatesData.map(c => c.jobTitle || "Unknown"))].map(title => (
          <button
            key={title}
            style={{
              padding: "8px 16px",
              borderRadius: "999px",
              border: selectedJobTitles.includes(title) ? "1px solid #FB923C" : "1px solid #d1d5db",
              background: selectedJobTitles.includes(title) ? "#FFF7ED" : "#ffffff",
              fontSize: "13px",
              cursor: "pointer",
              transition: "all 0.2s",
              color: selectedJobTitles.includes(title) ? "#FB923C" : "#374151",
            }}
            onClick={() => {
              setSelectedJobTitles(prev =>
                prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
              );
            }}
          >
            {title}
          </button>
        ))}
      </div>
    </div>

    {/* 4. Location Multi-Select */}
    <div style={{ marginBottom: 24 }}>
      <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
        Job Location
      </label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {[...new Set(candidatesData.map(c => c.jobLocation || "Unknown"))].map(loc => (
          <button
            key={loc}
            style={{
              padding: "8px 16px",
              borderRadius: "999px",
              border: selectedJobLocations.includes(loc) ? "1px solid #FB923C" : "1px solid #d1d5db",
              background: selectedJobLocations.includes(loc) ? "#FFF7ED" : "#ffffff",
              fontSize: "13px",
              cursor: "pointer",
              transition: "all 0.2s",
              color: selectedJobLocations.includes(loc) ? "#FB923C" : "#374151",
            }}
            onClick={() => {
              setSelectedJobLocations(prev =>
                prev.includes(loc) ? prev.filter(l => l !== loc) : [...prev, loc]
              );
            }}
          >
            {loc}
          </button>
        ))}
      </div>
    </div>

    {/* 5. Experience Range (Years) */}
    <div style={{ marginBottom: 24 }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: 12,
        fontSize: 14,
        fontWeight: 600,
      }}>
        <span>Experience (Years)</span>
        <span style={{ color: "#9CA3AF" }}>
          {experienceRange[0]} – {experienceRange[1]} years
        </span>
      </div>

      <input
        type="range"
        min="0"
        max="20"
        value={experienceRange[1]}
        onChange={(e) => setExperienceRange([experienceRange[0], Number(e.target.value)])}
        style={{
          width: "100%",
          accentColor: "#FB923C",
          height: "6px",
          borderRadius: "3px",
        }}
      />
    </div>

    {/* Bottom Buttons */}
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      marginTop: "24px",
    }}>
      <button
        style={{
          padding: "12px 24px",
          borderRadius: "999px",
          border: "1px solid #d1d5db",
          background: "#ffffff",
          fontSize: "14px",
          fontWeight: 600,
          color: "#4b5563",
          cursor: "pointer",
        }}
        onClick={() => {
          // Clear all filters
          setSearchTermApplications("");
          setSelectedStatus("");
          setSelectedJobTitles([]);
          setSelectedJobLocations([]);
          setExperienceRange([0, 20]);
          setShowAdvancedFilters(false);
        }}
      >
        Clear All
      </button>

      <button
        style={{
          padding: "12px 32px",
          borderRadius: "999px",
          border: "none",
          background: "linear-gradient(90deg, #FDBA74 0%, #FB923C 50%, #F97316 100%)",
          color: "#ffffff",
          fontSize: "14px",
          fontWeight: 700,
          cursor: "pointer",
          boxShadow: "0 8px 20px rgba(251, 146, 60, 0.3)",
        }}
        onClick={() => {
          setShowAdvancedFilters(false);
          // Filters are already applied live via filteredCandidates
        }}
      >
        Apply & Close
      </button>
    </div>
  </div>
)}

  <button
    className="clear-filters-btn"
    style={{
      padding: "10px 20px",
      border: "1px solid #e5e7eb",
      background: "#FEF2F2",
      borderRadius: "12px",
      fontSize: "14px",
      color: "#E94545",
    }}
    // onClick={()=> setSearchTermApplications("")}
    // onClick={() => {
    //             setSearchTermApplications("");
    //             setSelectedStatus("");
    //             // Optional: reset page
    //             // setCurrentPage(1);
    //           }}
    onClick={() => {
          // Clear all filters
          setSearchTermApplications("");
          setSelectedStatus("");
          setSelectedJobTitles([]);
          setSelectedJobLocations([]);
          setExperienceRange([0, 20]);
          setShowAdvancedFilters(false);
        }}
  >
    <FaRegCircleXmark
      style={{ color: "#E94545", paddingBottom: "4px", height: "17px" }}
    />{" "}
    Clear filter
  </button>
</div>

          </div>
        </div>

        {/* Jobs Applications Table aaaaaaaa */}
       <div style={{display:"flex", justifyContent:"center",  minHeight:"60vh"}}>
        <div className="candidates-table" style={{ 
          width: "95%", 
          // overflowX: "auto"
           }}>
  <table
    style={{
      width: "100%",
      borderCollapse: "collapse",
      background: "#FFFFFF",
      // borderRadius: "16px",
      boxShadow: "0 4px 20px rgba(15, 23, 42, 0.08)",
      // overflow: "hidden",
    }}
  >
    {/* Header */}
  <thead>
  <tr style={{ background: "#F8FAFC" }}>
    {/* Checkbox Column */}
    <th
      style={{
        padding: "20px 20px 20px 24px",
        width: "64px",
        textAlign: "left",
        borderBottom: "1px solid #E5E7EB",
      }}
    >
      <input
        type="checkbox"
        checked={selectAll === true}
        onChange={(e) => {
          setSelectAll(e.target.checked);
          if (e.target.checked) {
            setSelectedRows(new Set(candidatesData.map((_, i) => i)));
          } else {
            setSelectedRows(new Set());
          }
        }}
        style={{
          width: 20,
          height: 20,
          borderRadius: 4,
          border: "2px solid #D1D5DB",
          background: selectAll === true ? "#3B82F6" : "#FFFFFF",
          cursor: "pointer",
          accentColor: "#3B82F6",
        }}
      />
    </th>

    {/* Headers */}
    {[
      "Candidate & Position",
      "Experience",
      "Application Date",
      "Status",
      "Ratings",
      "Actions",
    ].map((header) => (
      <th
        key={header}
        style={{
          padding: "20px",
          // textAlign: "left",
          // textAlign: header === "Ratings" ? "center" : "left",
          textAlign: ["Ratings", "Actions"].includes(header) ? "center" : "left",  // Center both
          fontSize: "14px",
          fontWeight: 600,
          color: "#374151",
          borderBottom: "1px solid #E5E7EB",
        }}
      >
        {header}
      </th>
    ))}
  </tr>
</thead>

<tbody>
  {paginatedCandidates.length === 0 ? (
    <tr>
      <td colSpan={7} style={{ padding: "80px 20px", textAlign: "center" }}>
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
          color: "#64748b",
        }}>
          <div style={{ fontSize: "64px", opacity: 0.4 }}>
            📭
          </div>

          <h3 style={{
            margin: 0,
            fontSize: "20px",
            fontWeight: 600,
            color: "#1e293b",
          }}>
            No candidates found
          </h3>

          <p style={{
            margin: "8px 0 0",
            fontSize: "15px",
            maxWidth: "400px",
          }}>
            {searchTermApplications || selectedStatus
              ? "Try adjusting your search or filters"
              : "There are no candidates matching your criteria at the moment"}
          </p>

          {(searchTermApplications || selectedStatus) && (
            <button
              onClick={() => {
                setSearchTermApplications("");
                setSelectedStatus("");
              }}
              style={{
                marginTop: "16px",
                padding: "10px 20px",
                background: "#FFAB49",
                color: "white",
                border: "none",
                borderRadius: "12px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      </td>
    </tr>
  ) : (
    paginatedCandidates.map((candidate, idx) => {

      const globalIdx = startIndex + idx;
      const isRowSelected = selectedRows.has(globalIdx);

      return (
        <tr
          key={globalIdx}
          style={{
            borderBottom: "1px solid #F1F5F9",
            backgroundColor: isRowSelected ? "#FDF8F4" : "transparent",
            transition: "background-color 0.15s",
          }}
          onMouseEnter={(e) =>
            !isRowSelected && (e.currentTarget.style.backgroundColor = "#FEFEFE")
          }
          onMouseLeave={(e) =>
            !isRowSelected && (e.currentTarget.style.backgroundColor = "transparent")
          }
        >
          {/* Checkbox Column */}
          <td style={{ padding: "20px 20px 20px 24px", width: "64px" }}>
            <input
              type="checkbox"
              checked={isRowSelected}
              onChange={(e) => {
                const newSelected = new Set(selectedRows);
                if (e.target.checked) {
                  newSelected.add(globalIdx);
                } else {
                  newSelected.delete(globalIdx);
                }
                setSelectedRows(newSelected);

                const total = filteredCandidates.length;
                const checkedCount = newSelected.size;
                setSelectAll(
                  checkedCount === total
                    ? true
                    : checkedCount === 0
                    ? false
                    : "indeterminate"
                );
              }}
              style={{
                width: 20,
                height: 20,
                borderRadius: 4,
                border: "2px solid #D1D5DB",
                background: isRowSelected ? "#3B82F6" : "#FFFFFF",
                cursor: "pointer",
                accentColor: "#3B82F6",
              }}
            />
          </td>

          {/* Candidate */}
          <td style={{ padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div>
                <div style={{ fontSize: "15px", fontWeight: 600, color: "#1F2937", marginBottom: 2 }}>
                  {candidate.first_Name} {candidate.lastName}
                </div>
                <div style={{ fontSize: "14px", color: "#6B7280" }}>
                  {candidate.jobTitle}
                </div>
              </div>
            </div>
          </td>

          {/* Experience */}
          <td style={{ padding: "20px", color: "#374151", fontWeight: 500 }}>
            {candidate.experienceYears} years {candidate.experienceMonths} months
          </td>

          {/* Application Date */}
          <td style={{ padding: "20px", color: "#6B7280" }}>
            {formatAppliedDate(candidate.appliedDate)}
          </td>

          {/* Status */}
          <td style={{ padding: "20px 20px 20px 0", position: "relative", minWidth: "180px" }}>
            <button
              onClick={() => toggleStatusDropdown(globalIdx)}
              style={{
                borderRadius: "8px",
                border: "1px solid #F2F4F7",
                background: "#FFFFFF",
                width: "100%",
                padding: "8px",
              }}
            >
              <div style={{
                width: "100%",
                padding: "6px 12px",
                borderRadius: "4px",
                backgroundColor: statusColors2[candidate.status]?.background,
                color: statusColors2[candidate.status]?.color || "#1F2937",
                fontSize: "13px",
                fontWeight: 500,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
                {candidate.status}
                <FaChevronDown style={{ fontSize: "12px", opacity: 0.8 }} />
              </div>
            </button>

            {statusDropdownIdx === globalIdx && (
              <div
                style={{
                  position: "absolute",
                  top: "75%",
                  right: "10px",
                  minWidth: "180px",
                  background: "#FFFFFF",
                  borderRadius: "12px",
                  boxShadow: "0 12px 32px rgba(15, 23, 42, 0.12)",
                  border: "1px solid #E5E7EB",
                  zIndex: 30,
                  padding: "6px 0",
                }}
              >
                {["New", "Under Review", "Interview Scheduled", "Rejected", "Hired", "No Show", "Offer Extended", "Offer Accepted", "Offer Declined"].map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      handleUpdateCandidateStatus(candidate.id, status);
                      setStatusDropdownIdx(null);
                    }}
                    style={{
                      width: "100%",
                      padding: "10px 16px",
                      border: "none",
                      background: "#FFFFFF",
                      color: "#111827",
                      textAlign: "left",
                      fontSize: "13px",
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    {status}
                  </button>
                ))}
              </div>
            )}
          </td>

          {/* Rating */}
          <td style={{ padding: "20px" }}>
            <StarRating
              value={ratings[globalIdx]}
              onChange={(val) => handleRatingChange(globalIdx, val)}
            />
          </td>

          {/* Actions */}
        <td style={{ padding: "20px", position: "relative" }}>
          <div 
            style={{ 
              position: "relative", 
              display: "flex", 
              justifyContent: "center", 
              alignItems: "center", 
              gap: "20px" 
            }}
          >
            {/* Actions Button */}
            <button 
              className="more-actions-btn"
              onClick={(e) => {
                e.stopPropagation();
                setActiveDropdownIdx(activeDropdownIdx === idx ? null : idx);
              }}
              style={{
                padding: "12px",
                border: "1px solid #e2e8f0", 
                background: "white", 
                borderRadius: "12px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: "48px",
                height: "48px"
              }}
            >
              <SlOptionsVertical style={{fontSize: "16px", color: "#64748b"}} />
            </button>
            
            {/* Actions Dropdown */}
            {activeDropdownIdx === idx && (
              <div 
              ref={dropdownRef}
                className="actions-dropdown" 
                style={{
                  position: "absolute",
                  // top: "120%",
                  bottom:"10%",
                  right: "85%",
                  background: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
                  zIndex: 9999,
                  minWidth: "160px",
                  marginTop: "8px"
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <button className="dropdown-item" style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  width: "100%",
                  padding: "12px 16px",
                  border: "none",
                  background: "none",
                  textAlign: "left",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#374151",
                  cursor: "pointer"
                }}
                // onClick={() => setActiveDropdownIdx(null)}
                 onClick={() => {
                    setResumePreviewData({ candidate, idx });
                    setResumePreviewTab("profile");
                    setResumePreviewOpen(true);
                    setActiveDropdownIdx(null);
                  }}
                >
                  <HiOutlineEye style={{fontSize: "16px"}} /> Preview
                </button>
              
                <button 
                  className="dropdown-item" 
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    width: "100%",
                    padding: "12px 16px",
                    border: "none",
                    background: "none",
                    textAlign: "left",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#374151",
                    cursor: "pointer"
                  }}
                  onClick={() => {
                    setActiveDropdownIdx(null);
                    setSelectedRowCandidate(candidate);           // ← pass the row's candidate object
                    setShowCandidateContactModal(true);          // ← open modal
                  }}
                >
                  <img src={CallIcon} alt="" style={{height:"17px"}} />
                  Candidate's Contact
                </button>
                
                <button className="dropdown-item" style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  width: "100%",
                  padding: "12px 16px",
                  border: "none",
                  background: "none",
                  textAlign: "left",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#374151",
                  cursor: "pointer"
                }}
                onClick={() => {
                  setActiveDropdownIdx(null);
                  setSelectedCandidateForEmail(candidate);
                  setShowEmailModal(true);
                }}
                >
                  <img src={EmailIcon2} alt="" style={{height:"17px"}} />
                  E-Mail
                </button>
                
                <button
                  className="dropdown-item"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    width: "100%",
                    padding: "12px 16px",
                    border: "none",
                    background: "none",
                    textAlign: "left",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#374151",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    setActiveDropdownIdx(null);
                    setRemarksCandidate(candidate);
                    setShowRemarksModal(true);
                  }}
                >
                  <img src={NotesIcon} alt="" style={{ height: "17px" }} />
                  Notes
                </button>
                
                <button className="dropdown-item delete" style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  width: "100%",
                  padding: "12px 16px",
                  border: "none",
                  background: "none",
                  textAlign: "left",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#FFAB49",
                  cursor: "pointer"
                }}
                onClick={() => {
                  console.log("Canditate", candidate); 
                  setInterviewSelectedCandidate(candidate)
                  setShowInterviewScheduler(true)
                  setActiveDropdownIdx(null)}}
                >
                  {/* <RiDeleteBin5Line style={{fontSize: "16px", color: "#dc2626"}} /> Remove */}
                  Schedule Interview <FaArrowRightLong />
                </button>
              </div>
            )}
          </div>
        </td>
        </tr>
      );
    })
  )}
</tbody>

  </table>


  {/* Real Pagination Footer */}
<div
  style={{
    padding: "16px 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#F8FAFC",
    borderBottomLeftRadius: "16px",
    borderBottomRightRadius: "16px",
    borderTop: "1px solid #e5e7eb",
    marginBottom:"50px"
  }}
>
  {/* Results count */}
  <span style={{ color: "#6B7280", fontSize: "14px", fontWeight: 500 }}>
    Results: {totalItems === 0 ? "0" : `${startIndex + 1}–${Math.min(endIndex, totalItems)} of ${totalItems}`}
  </span>

  {/* Pagination Controls */}
  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>

    {/* Rows Per Page Dropdown */}
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <span style={{ fontSize: "14px", color: "#6B7280", fontWeight: 500 }}>
        Rows:
      </span>

      <select
        value={itemsPerPage}
        onChange={(e) => {
          setItemsPerPage(Number(e.target.value));
          setCurrentPage(1); // reset to first page
        }}
        style={{
          padding: "6px 10px",
          borderRadius: "8px",
          border: "1px solid #E5E7EB",
          background: "#FFFFFF",
          fontSize: "14px",
          fontWeight: 500,
          color: "#374151",
          cursor: "pointer",
        }}
      >
        {[5, 10, 20, 50, 100].map((num) => (
          <option key={num} value={num}>
            {num}
          </option>
        ))}
      </select>
    </div>

    {/* Previous Button */}
    <button
      disabled={currentPage === 1}
      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
      style={{
        padding: "8px 16px",
        border: "1px solid #E5E7EB",
        background: currentPage === 1 ? "#F3F4F6" : "#FFFFFF",
        borderRadius: "8px",
        fontSize: "14px",
        fontWeight: 500,
        color: currentPage === 1 ? "#9CA3AF" : "#374151",
        cursor: currentPage === 1 ? "not-allowed" : "pointer",
        transition: "all 0.2s",
      }}
    >
      Previous
    </button>

    {/* Page Indicator */}
    <span
      style={{
        fontWeight: 600,
        color: "#374151",
        padding: "8px 12px",
        background: "#F3F4F6",
        borderRadius: "8px",
        minWidth: "60px",
        textAlign: "center",
      }}
    >
      {currentPage} of {totalPages || 1}
    </span>

    {/* Next Button */}
    <button
      disabled={currentPage === totalPages || totalPages === 0}
      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
      style={{
        padding: "8px 16px",
        border: "1px solid #E5E7EB",
        background: currentPage === totalPages ? "#F3F4F6" : "#FFFFFF",
        borderRadius: "8px",
        fontSize: "14px",
        fontWeight: 500,
        color: currentPage === totalPages ? "#9CA3AF" : "#374151",
        cursor: currentPage === totalPages ? "not-allowed" : "pointer",
        transition: "all 0.2s",
      }}
    >
      Next
    </button>
  </div>
</div>



</div>
       </div>


      </div>
    

  </div>
)}







</div>

)}


{activeCompany?.companySoftBan && (
  <div
  style={{
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "80vh",           // ← reduced from 80vh – feels less overwhelming
    padding: "20px",
  }}
>
  <div
    style={{
      background: "linear-gradient(135deg, #fef2f2 0%, #fff5f5 100%)",
      border: "1px solid rgba(252, 165, 165, 0.5)",
      borderRadius: "20px",
      padding: "32px 36px",       // ← reduced padding
      maxWidth: "580px",
      width: "90%",
      boxShadow: "0 12px 40px rgba(220, 38, 38, 0.10)",
      textAlign: "center",
    }}
  >
    {/* Accent bar – smaller */}
    {/* <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "4px",
        background: "linear-gradient(90deg, #ef4444, #f87171)",
      }}
    /> */}

    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Icon + Title – smaller */}
      <div style={{ fontSize: "48px", lineHeight: 1, marginBottom: "4px" }}>🔒</div>

      <h2
        style={{
          margin: 0,
          fontSize: "24px",           // ← smaller than 28px
          fontWeight: 700,
          color: "#991b1b",
          letterSpacing: "-0.3px",
        }}
      >
        Account Temporarily Restricted
      </h2>

      {/* Main message – shorter */}
      <p
        style={{
          fontSize: "15px",
          lineHeight: 1.55,
          color: "#374151",
          margin: "8px 0 16px",       // tighter margins
        }}
      >
        Your company account is currently under temporary restriction.  
        Most dashboard features and actions are paused.
      </p>

      {/* Explanation – concise */}
      <p
        style={{
          fontSize: "14.5px",
          color: "#4b5563",
          lineHeight: 1.5,
          margin: "0 0 24px",
        }}
      >
        This is usually precautionary. To resolve or understand the reason,  
        please contact the platform administrator.
      </p>

      {/* Contact box – more compact */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "14px",
          padding: "20px 24px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.06)"}
        onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.03)"}
      >
        <p
          style={{
            fontSize: "16px",
            fontWeight: 600,
            color: "#1e293b",
            margin: "0 0 12px",
          }}
        >
          Contact Support
        </p>
        <div style={{ fontSize: "14.5px", color: "#374151", lineHeight: 1.6 }}>
          <strong>Email:</strong> support@infomanav.com<br />
        </div>
      </div>

      
    </div>
  </div>
</div>
)}




     </div>
    </div>  


     <RecruitmentCalendarModal
        open={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        setTriggerFetchInterviews={setTriggerFetchInterviews}
        setTriggerFetchResumes={setTriggerFetchResumes}
        companyId={activeCompany}
      />


       {/* Modal - controlled by postJobsOpen state */}
      <PostNewJobsModal
        open={postJobsOpen}
        companyLocations={activeCompany?.location || []}
        selectedCompany={activeCompany || []}
        setTriggerFetchJobs={setTriggerFetchJobs}
        companyJobs={companyJobs}
        onClose={() => {
          setPostJobsOpen(false)
        }}
        
        showToast={showToast}
      />

      {/* // Modal render (same pattern as PostNewJobsModal) */}
      <EditJobsModal
        open={editJobsOpen}
        onClose={() => setEditJobsOpen(false)}
        job={selectedJob}
        setTriggerFetchJobs={setTriggerFetchJobs}
        companyLocations={activeCompany?.location || []}
        companyJobs={companyJobs}
        showToast={showToast}
      />









      {/* Email Composer Modal */}
      <CandidateEmailModal
        open={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        candidate={selectedCandidateForEmail}
      />





 {showBlockModal && (
      <div style={overlayStyle}>
        <div style={modalStyle}>
          {/* Header */}
          <div style={modalHeader}>
            <h3 style={{ margin: 0 }}>
              {blockReason === "ADMIN_UNCONFIGURED"
                ? "Company registration required"
                : "Company not registered"}
            </h3>
            <button onClick={() => setShowBlockModal(false)} style={closeBtn}>
              ✕
            </button>
          </div>

          {/* Body */}
          <div style={modalBody}>
            {blockReason === "ADMIN_UNCONFIGURED" && (
              <p>
                This company is not fully registered yet.
                <br />
                Please complete the company registration before posting jobs.
              </p>
            )}

            {blockReason === "MANAGER_UNCONFIGURED" && (
              <p>
                This company is not registered yet.
                <br />
                Please contact your Admin to complete the company registration
                before posting jobs.
              </p>
            )}
          </div>

          {/* Footer */}
          <div style={modalFooter}>
            {blockReason === "ADMIN_UNCONFIGURED" ? (
              <>
                <button
                  onClick={() => setShowBlockModal(false)}
                  style={secondaryBtn}
                >
                  Do it later
                </button>
                <button
                  onClick={() => {
                    setShowBlockModal(false);
                    setShowRegisterForm(true); // 👈 switch modal content
                  }}
                  style={primaryBtn}
                >
                  Register company now
                </button>

              </>
            ) : (
              <button
                onClick={() => setShowBlockModal(false)}
                style={primaryBtn}
              >
                Okay
              </button>
            )}
          </div>
        </div>
      </div>
    )}

    {showRegisterForm && activeCompany && (
  <div style={overlayStyle}>
    <div style={{ ...modalStyle, width: "90vw", maxHeight:"90vh", overflowY:"auto" }}>
      
      {/* Header */}
      <div style={modalHeader}>
        <h3 style={{ margin: 0 }}>Register Company</h3>
        <button
          onClick={() => setShowRegisterForm(false)}
          style={closeBtn}
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div style={modalBody}>
        <RegisterCompanyForm
          company={activeCompany}
          onCancel={() => setShowRegisterForm(false)}
          onSubmit={handleRegisterCompany}
        />
      </div>
    </div>
  </div>
)}

{/* For Part2 */}
{showDeleteJobModal && selectedJob && (
  <div style={overlayStyle}>
    <div style={modalStyle} >
      
      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "16px"
      }}>
        <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 600 }}>
          Delete Job Posting
        </h3>

        <button
          onClick={() => setShowDeleteJobModal(false)}
          style={{
            background: "transparent",
            border: "none",
            fontSize: "18px",
            cursor: "pointer",
            color: "#64748b"
          }}
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <p style={{ color: "#475569", fontSize: "14px", lineHeight: "1.6" }}>
        Are you sure you want to permanently delete this job posting?
        <br />
        <strong>This action cannot be undone.</strong>
      </p>

      {/* Footer */}
      <div style={{
        display: "flex",
        justifyContent: "flex-end",
        gap: "12px",
        marginTop: "24px"
      }}>
        <button
          onClick={() => setShowDeleteJobModal(false)}
          style={secondaryBtn}
        >
          Cancel
        </button>

        <button
          onClick={() => handleDeleteJob(selectedJob.id)}
          style={{
            ...dangerBtn,
            opacity: selectedJob?.id ? 1 : 0.6,
            cursor: selectedJob?.id ? "pointer" : "not-allowed"
          }}
          disabled={!selectedJob?.id}
        >
          Delete Job
        </button>
      </div>

    </div>
  </div>
)}

{/* For Part1 */}
{showDeleteJobModal && jobToDelete && (
  <div style={overlayStyle}>
    <div style={modalStyle}>

      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "16px"
      }}>
        <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 600 }}>
          Delete Job Posting
        </h3>

        <button
          onClick={() => {
            setShowDeleteJobModal(false);
            setJobToDelete(null);
          }}
          style={{
            background: "transparent",
            border: "none",
            fontSize: "18px",
            cursor: "pointer",
            color: "#64748b"
          }}
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <p style={{ color: "#475569", fontSize: "14px", lineHeight: "1.6" }}>
        Are you sure you want to permanently delete this job posting?
        <br />
        <strong>This action cannot be undone.</strong>
      </p>

      {/* Footer */}
      <div style={{
        display: "flex",
        justifyContent: "flex-end",
        gap: "12px",
        marginTop: "24px"
      }}>
        <button
          onClick={() => {
            setShowDeleteJobModal(false);
            setJobToDelete(null);
          }}
          style={secondaryBtn}
        >
          Cancel
        </button>

        <button
          onClick={() => handleDeleteJob(jobToDelete.id)}
          style={dangerBtn}
        >
          Delete Job
        </button>
      </div>

    </div>
  </div>
)}

{showDuplicateJobModal && jobToDuplicate && (
  <div style={overlayStyle}>
    <div style={{ ...modalStyle, maxWidth: "420px" }}>

      {/* Header */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        marginBottom: "12px"
      }}>
        <h3 style={{ margin: 0 }}>Duplicate Job Posting</h3>

        <button
          onClick={() => setShowDuplicateJobModal(false)}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontSize: "18px",
            color: "#6b7280"
          }}
        >
          ✕
        </button>
      </div>

      {/* Job Title Highlight */}
      <div
        style={{
          background: "#f9fafb",
          border: "1px solid #e5e7eb",
          padding: "10px 12px",
          borderRadius: "10px",
          fontWeight: 600,
          color: "#374151",
          marginBottom: "14px"
        }}
      >
        {jobToDuplicate.jobTitle}
      </div>

      {/* Body */}
     <p style={{ margin: "0 0 14px 0", color: "#4b5563", lineHeight: "1.6" }}>
        This action will create a <strong>duplicate copy</strong> of the job posting with the same details.
      </p>

      {/* Warning Box */}
      <div
        style={{
          background: "#fff7ed",
          border: "1px solid #fed7aa",
          borderRadius: "10px",
          padding: "10px 12px",
          fontSize: "13px",
          color: "#9a3412",
          marginBottom: "20px"
        }}
      >
        ⚠️ The duplicated job will be saved as <strong>Inactive</strong>.
        You can review and publish it later.
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "12px",
          marginTop: "8px"
        }}
      >
        <button
          style={secondaryBtn}
          onClick={() => setShowDuplicateJobModal(false)}
        >
          Cancel
        </button>

        <button
          style={primaryBtn}
          onClick={() => handleDuplicateJob(jobToDuplicate)}
        >
          Duplicate Job
        </button>
      </div>

    </div>
  </div>
)}

<ResumePreviewModal
  open={resumePreviewOpen}
  onClose={() => setResumePreviewOpen(false)}
  candidate={resumePreviewData}
  activeTab={resumePreviewTab}
  setActiveTab={setResumePreviewTab}
/>

{showAssignModal && (
  <AssignJobPortalAccessModal
    activeCompanyId={activeCompanyId} // your prop/state
    activeCompanyName={activeCompanyName}  // ← new prop
    onClose={() => setShowAssignModal(false)}
  />
)}

{showInterviewScheduler && 
<InterviewScheduler 
  candidate={interviewSelectedCandidate}
  setShowInterviewScheduler = {setShowInterviewScheduler} 
  handleUpdateCandidateStatus = {handleUpdateCandidateStatus} 
  setTriggerFetchInterviews = {setTriggerFetchInterviews} 
/>
}




{showCandidateContactModal && selectedRowCandidate && (
  <div
    onClick={() => setShowCandidateContactModal(false)}
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.75)",
      zIndex: 2000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
        borderRadius: "20px",
        width: "90%",
        maxWidth: "520px",
        padding: "40px 32px",
        boxShadow: "0 25px 70px rgba(0,0,0,0.35)",
        border: "1px solid rgba(255,171,73,0.15)",
        position: "relative",
      }}
    >
      {/* Close button */}
      <button
        onClick={() => setShowCandidateContactModal(false)}
        style={{
          position: "absolute",
          top: "20px",
          right: "24px",
          background: "rgba(255,171,73,0.1)",
          border: "none",
          borderRadius: "50%",
          width: "40px",
          height: "40px",
          fontSize: "28px",
          color: "#FFAB49",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(255,171,73,0.25)";
          e.currentTarget.style.transform = "scale(1.1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(255,171,73,0.1)";
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        ×
      </button>

      {/* Updated Premium Header */}
      <div style={{ textAlign: "center", marginBottom: "36px" }}>
        <div style={{
          height: "4px",
          width: "80px",
          background: "linear-gradient(90deg, #FFAB49, #f97316)",
          margin: "0 auto 16px auto",
          borderRadius: "4px",
        }} />

        <h2 style={{
          margin: 0,
          fontSize: "28px",
          fontWeight: 700,
          color: "#1e293b",
          letterSpacing: "-0.5px",
        }}>
          Candidate Contact
        </h2>

        <p style={{
          margin: "8px 0 0",
          color: "#64748b",
          fontSize: "15px",
        }}>
          Quick access to reach out
        </p>
      </div>

      {/* Rest of your content (name, mobile, email) remains the same */}
      <div style={{ display: "grid", gap: "24px", fontSize: "17px" }}>
        {/* Name */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "28px", fontWeight: 700, color: "#1e293b" }}>
            {selectedRowCandidate.first_Name} {selectedRowCandidate.lastName}
          </div>
        </div>

        {/* Mobile */}
        <div style={{
          background: "#fffaf0",
          padding: "16px",
          borderRadius: "12px",
          border: "1px solid rgba(255,171,73,0.2)",
          textAlign: "center",
        }}>
          <div style={{ color: "#64748b", fontSize: "14px", marginBottom: "8px" }}>
            Mobile Number
          </div>
          {selectedRowCandidate.mobile ? (
            <a
              href={`tel:${selectedRowCandidate.mobile}`}
              style={{
                color: "#FFAB49",
                fontSize: "20px",
                fontWeight: 600,
                textDecoration: "none",
                display: "inline-block",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
            >
              {selectedRowCandidate.mobile}
            </a>
          ) : (
            <span style={{ color: "#9ca3af", fontStyle: "italic" }}>
              Not available
            </span>
          )}
        </div>

        {/* Email - same as before */}
        <div style={{
          background: "#fffaf0",
          padding: "16px",
          borderRadius: "12px",
          border: "1px solid rgba(255,171,73,0.2)",
          textAlign: "center",
        }}>
          <div style={{ color: "#64748b", fontSize: "14px", marginBottom: "8px" }}>
            Email Address
          </div>
          {selectedRowCandidate.userEmail ? (
            <a
              href={`mailto:${selectedRowCandidate.userEmail}`}
              style={{
                color: "#FFAB49",
                fontSize: "18px",
                fontWeight: 500,
                textDecoration: "none",
                wordBreak: "break-all",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
            >
              {selectedRowCandidate.userEmail}
            </a>
          ) : (
            <span style={{ color: "#9ca3af", fontStyle: "italic" }}>
              Not available
            </span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: "32px", textAlign: "center" }}>
        <button
          onClick={() => setShowCandidateContactModal(false)}
          style={{
            padding: "14px 48px",
            background: "linear-gradient(135deg, #f3f4f6, #e5e7eb)",
            border: "none",
            borderRadius: "12px",
            fontSize: "16px",
            fontWeight: 600,
            cursor: "pointer",
            color: "#374151",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.15)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
          }}
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}




<CandidateRemarksModal  
  open={showRemarksModal}
  onClose={() => setShowRemarksModal(false)}
  candidate={remarksCandidate}
  triggerFetchResumes={() => setTriggerFetchResumes((x) => x + 1)} // pass the setter function
/>


<EventEditorModal
  open={editorOpen}
  event={activeEvent}
  onClose={() => {
    setEditorOpen(false);
    setActiveEvent(null);
  }}
  onSave={handleSaveEvent}
  onDelete={handleDeleteEvent}
  setTriggerFetchInterviews={setTriggerFetchInterviews}
/>



<MeetingEditorModal
  open={editorMeetingOpen}
  event={activeMeeting}
  onClose={() => {
    // showToast("success", "Changes saved and history updated.", "Meeting Rescheduled");
    setEditorMeetingOpen(false);
    setActiveMeeting(null);
  }}
  onSave={() => {
    // TODO: Refresh meetings list
  }}
  setTriggerFetchInterviews={setTriggerFetchInterviews}
/>















      
      </>
  );
};

export default JobDashboard;



const companySelectStyle = {
  padding: "10px 42px 10px 16px",
  borderRadius: "999px",
  border: "1px solid #E8DCCB",
  background: "#FFFFFF",
  cursor: "pointer",
  fontSize: "14px",
  appearance: "none",
  backgroundImage:
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8'><path fill='%23999999' d='M6 8L0 0h12z'/></svg>\")",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 16px center",
  width: "16vw",
};


const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const modalStyle = {
  width: "520px",
  background: "#fff",
  borderRadius: "16px",
  boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
  display: "flex",
  flexDirection: "column",
  padding:"20px",
};

const modalHeader = {
  padding: "20px 24px",
  borderBottom: "1px solid #F0E6D8",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const modalBody = {
  padding: "24px",
  fontSize: "14px",
  color: "#444",
  lineHeight: 1.6,
};

const modalFooter = {
  padding: "16px 24px",
  borderTop: "1px solid #F0E6D8",
  display: "flex",
  justifyContent: "flex-end",
  gap: "12px",
};

const closeBtn = {
  border: "none",
  background: "transparent",
  fontSize: "18px",
  cursor: "pointer",
};

const primaryBtn = {
  padding: "10px 18px",
  borderRadius: "999px",
  border: "none",
  background: "#FFAB49",
  color: "#fff",
  cursor: "pointer",
};

const secondaryBtn = {
  padding: "10px 18px",
  borderRadius: "999px",
  border: "1px solid #FFAB49",
  background: "#fff",
  color: "#494949",
  cursor: "pointer",
};

const dangerBtn = {
  padding: "10px 18px",
  borderRadius: "999px",
  background: "#dc2626",
  color: "white",
  border: "none",
  fontSize: "14px",
  fontWeight: "600",
  cursor: "pointer",
};
