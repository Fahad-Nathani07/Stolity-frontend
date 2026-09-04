import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  getCountFromServer,
} from "firebase/firestore";
import { db } from "../../firebase"; // Adjust path if needed

const PostedJobsForCompany = ({ company }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);


  // Pagination
  
useEffect(() => {
  const fetchJobs = async () => {
    console.log("aaaaa Starting job fetch for company ID:", company.id);

    setLoading(true);
    console.log("aaaaa Set loading to true");

    try {
      console.log("aaaaa Building Firestore query for jobMaster where companyId == ", company.id);

      const jobsQuery = query(
        collection(db, "jobMaster"),
        where("companyId", "==", company.id)
      );

      console.log("aaaaa Executing getDocs for jobs...");

      const jobsSnapshot = await getDocs(jobsQuery);

      console.log("aaaaa Jobs query completed. Found jobs:", jobsSnapshot.docs.length);

      const jobsWithoutCounts = jobsSnapshot.docs.map((doc) => {
        const data = doc.data();
        console.log("aaaaa Processing job doc ID:", doc.id);
        console.log("aaaaa Processing job doc ID2:", doc.id, "data:", data);

        return {
          id: doc.id,
          title: data.jobTitle || "Untitled Job",
          status: data.isActive ? "Active" : "Inactive",
          createdAt: data.createdAt
            ? new Date(data.createdAt.seconds * 1000).toLocaleDateString()
            : (<span style={{ 
              color: '#999', 
              fontStyle: 'italic', 
              opacity: 0.7,
              fontWeight: 400 
            }}>
              N/A
            </span>),
          location: data.location || (<span style={{ 
              color: '#999', 
              fontStyle: 'italic', 
              opacity: 0.7,
              fontWeight: 400 
            }}>
              N/A
            </span>),
        };
      });

      console.log("aaaaa All jobs processed without counts. Total:", jobsWithoutCounts.length);

      // Now fetch counts for each job
      console.log("aaaaa Starting application count fetches for", jobsWithoutCounts.length, "jobs");

      const jobsWithCounts = await Promise.all(
        jobsWithoutCounts.map(async (job) => {
          const count = await getApplicationCount(job.id);
          console.log("aaaaa Count fetched for job", job.id, ":", count);

          return {
            ...job,
            applications: count,  // ← This is the real count from resumeMaster
          };
        })
      );

      console.log("aaaaa All counts completed. Final jobs with counts:", jobsWithCounts.length);

      // Sort by createdAt descending (newest first)
      jobsWithCounts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      console.log("aaaaa Jobs sorted by newest first");

      setJobs(jobsWithCounts);
      console.log("aaaaa setJobs called with", jobsWithCounts.length, "jobs");
      console.log("aaaaa Full jobs data with counts:", jobsWithCounts);

    } catch (err) {
      console.error("aaaaa ERROR fetching jobs or counts:", err);
    } finally {
      setLoading(false);
      console.log("aaaaa Set loading to false");
    }
  };

  console.log("aaaaa useEffect triggered - starting fetchJobs");
  fetchJobs();

  return () => {
    console.log("aaaaa useEffect cleanup - component unmounting or companyId changed");
  };
}, [company.id]);


const getApplicationCount = async (jobId) => {
  if (!jobId) {
    console.log("aaaaa No jobId - returning 0 count");
    return 0;
  }

  try {
    console.log("aaaaa Counting applications for jobId:", jobId);

    const resumesQuery = query(
      collection(db, "resumeMaster"),
      where("jobId", "==", jobId)
    );

    const snapshot = await getCountFromServer(resumesQuery);
    const count = snapshot.data().count;

    console.log("aaaaa Count from getCountFromServer:", count);
    return count;
  } catch (err) {
    console.error(`aaaaa Failed to count applications for job ${jobId}:`, err);
    return 0; // fallback
  }
};
  
  
  
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const PAGE_SIZES = [5, 10, 20, 50, 100];

  const totalPages = Math.ceil(jobs.length / pageSize) || 1;
  const paginatedJobs = jobs.slice((page - 1) * pageSize, page * pageSize);

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>
        Loading posted jobs...
      </div>
    );
  }

  return (
    <div style={{
      background: "#ffffff",
      borderRadius: "16px",
      padding: "24px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "24px",
      }}>
        <h3 style={{
          margin: 0,
          fontSize: "22px",
          fontWeight: 700,
          color: "#1a1a1a",
        }}>
          Posted Jobs
          <span style={{
            fontSize: "16px",
            fontWeight: 500,
            color: "#666",
            marginLeft: "12px",
          }}>
            ({jobs.length})
          </span>
        </h3>

        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(+e.target.value);
            setPage(1);
          }}
          style={{
            padding: "10px 16px",
            borderRadius: "12px",
            border: "1px solid #d1d5db",
            background: "#fff",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          {PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size} per page
            </option>
          ))}
        </select>
      </div>

      <div style={{
        borderRadius: "12px",
        overflow: "hidden",
        border: "1px solid #eee",
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f9f9f9" }}>
              <th style={thStyle}>Title</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Created At</th>
              <th style={thStyle}>Location</th>
              <th style={{...thStyle, ...textAlignCenter}}>Applications</th>
            </tr>
          </thead>
          <tbody>
            {paginatedJobs.length === 0 ? (
              <tr>
                <td colSpan={5} style={{
                  padding: "40px",
                  textAlign: "center",
                  color: "#999",
                  fontSize: "16px",
                }}>
                  No jobs posted by this company
                </td>
              </tr>
            ) : (
              paginatedJobs.map((job) => (
                <tr key={job.id} style={{
                  borderBottom: "1px solid #f0f0f0",
                  transition: "background 0.2s",
                }}>
                  <td style={tdStyle}>{job.title}</td>
                  <td style={tdStyle}>
                    <span style={{
                      padding: "6px 14px",
                      borderRadius: "999px",
                      fontSize: "13px",
                      background: job.status === "Active" ? "#e6f4ea" : "#fee2e2",
                      color: job.status === "Active" ? "#166534" : "#991b1b",
                      border: job.status === "Active" ? "1px solid #86efac" : "1px solid #fca5a5",
                    }}>
                      {job.status}
                    </span>
                  </td>
                  <td style={tdStyle}>{job.createdAt}</td>
                  <td style={tdStyle}>{job.location}</td>
                  <td style={{...tdStyle, ...textAlignCenter}}>{job.applications}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {jobs.length > 0 && (
        <div style={{
          marginTop: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <span style={{ color: "#666" }}>
            Page <strong>{page}</strong> of {totalPages}
          </span>

          <div style={{ display: "flex", gap: "12px" }}>
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              style={{
                padding: "10px 20px",
                border: "1px solid #FFAB49",
                borderRadius: "999px",
                background: "white",
                color: "#FFAB49",
                cursor: page === 1 ? "not-allowed" : "pointer",
                opacity: page === 1 ? 0.5 : 1,
              }}
            >
              Prev
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              style={{
                padding: "10px 20px",
                border: "none",
                borderRadius: "999px",
                background: page === totalPages ? "#ffd699" : "#FFAB49",
                color: "white",
                cursor: page === totalPages ? "not-allowed" : "pointer",
                opacity: page === totalPages ? 0.6 : 1,
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const thStyle = {
  padding: "16px 20px",
  textAlign: "left",
  fontSize: "13px",
  fontWeight: 600,
  color: "#666",
  background: "#f9f9f9",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const tdStyle = {
  padding: "16px 20px",
  fontSize: "14px",
  color: "#333",
};

const textAlignCenter = {
  textAlign: "center",
};

export default PostedJobsForCompany;