import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import "../css/FAQPage.css";
import SideNav from "../components/SideNav";
import { showToast } from "../components/ToastProvider";
import MinusIcon from "../images/MinusIcon.svg";
import PlusIcon from "../images/PlusIcon2.svg";
import FAQImg1 from "../images/FAQImg1.svg";
import SendArrow from "../images/SendArrow.svg";

const QUESTION_MIN = 20;
const QUESTION_MAX = 500;


const FAQS = [
  {
    question: "What is Stolity?",
    answer: (
      <>
        Stolity is a unified platform for large file management, secure sharing, and recruitment workflows.<br />
        <br />
        You can upload files up to 5GB, generate custom links, manage permissions, compress/convert files, and even collect job applications with portfolios — all in one place.
      </>
    )
  },
  {
    question: "Who is Stolity designed for?",
    answer: (
      <ul className="faq-list-ul">
        <li>Creative professionals (designers, video editors, photographers)</li>
        <li>HR & recruitment teams</li>
        <li>Developers & IT teams</li>
        <li>Healthcare professionals</li>
        <li>Startup agencies</li>
        <li>Students & researchers</li>
        <li>Each user gets tools tailored to their workflow.</li>
      </ul>
    )
  },
  {
    question: "What file size can I upload?",
    answer: (
      <>
        You can upload files up to 5GB per file.<br /><br />
        This includes media files, videos, RAW photos, DICOM medical scans, build files, and more.
      </>
    )
  },
  {
    question: "Is Stolity secure?",
    answer: (
      <>
        Yes — Stolity offers:
        <ul className="faq-list-ul">
          <li>Encrypted file storage</li>
          <li>Custom access permissions</li>
          <li>View-only &amp; no-download modes</li>
          <li>Expiry controls for links</li>
          <li>Privacy-compliant workflows</li>
        </ul>
        Your files stay protected end-to-end.
      </>
    )
  },
  {
    question: "Can I share files with custom access settings?",
    answer: (
      <>
        Absolutely. You can:
        <ul className="faq-list-ul">
          <li>Create private or public links</li>
          <li>Restrict downloads</li>
          <li>Add passwords</li>
          <li>Set expiration dates</li>
          <li>Control who views or collaborates</li>
        </ul>
        Perfect for client work, medical reports, confidential builds, and hiring.
      </>
    )
  },
  {
    question: "Does Stolity support previews for all file types?",
    answer: (
      <>
        Yes — Stolity supports previews for:
        <ul className="faq-list-ul">
          <li>Images</li>
          <li>Videos</li>
          <li>PDFs</li>
          <li>Design exports</li>
          <li>Docs</li>
          <li>Many engineering and IT formats</li>
          <li>Medical reports (PDF-based)</li>
        </ul>
        If a preview isn’t available, users can still download the file.
      </>
    )
  },
  {
    question: "Can I manage multiple projects or clients?",
    answer: (
      <>
        Yes. Create:
        <ul className="faq-list-ul">
          <li>Project-based folders</li>
          <li>Client workspaces</li>
          <li>Role-based access</li>
          <li>Shared team folders</li>
        </ul>
        Ideal for agencies, studios, developers, and organizations.
      </>
    )
  },
  {
    question: "How does the job posting feature work?",
    answer: (
      <>
        You can:
        <ul className="faq-list-ul">
          <li>Create a job post</li>
          <li>Share one link with candidates</li>
          <li>Collect:
            <ul>
              <li>CV</li>
              <li>Portfolio</li>
              <li>Work samples</li>
              <li>Additional files</li>
              <li>Candidate details</li>
            </ul>
          </li>
          <li>All submissions appear automatically in organized folders.</li>
        </ul>
      </>
    )
  },
  {
    question: "Does Stolity work for healthcare workflows?",
    answer: (
      <>
        Yes — Stolity supports:
        <ul className="faq-list-ul">
          <li>Sharing MRI, CT, and DICOM scans</li>
          <li>Secure doctor-to-doctor collaboration</li>
          <li>Safe patient report delivery</li>
          <li>HIPAA-style privacy controls</li>
          <li>Eliminating risky USB/WhatsApp sharing</li>
        </ul>
        Perfect for clinics, radiologists, and labs.
      </>
    )
  },
  {
    question: "How is Stolity better than Google Drive or Dropbox?",
    answer: (
      <>
        Stolity offers:
        <ul className="faq-list-ul">
          <li>5GB max file size</li>
          <li>File compression + conversion</li>
          <li>Portfolio-focused job submissions</li>
          <li>Cleaner access control</li>
          <li>Faster, simpler workflows</li>
          <li>Better customization</li>
          <li>Zero tool-switching</li>
        </ul>
        It’s built for modern creative, medical, IT, and hiring workflows.
      </>
    )
  },
  {
    question: "Can candidates upload large portfolios?",
    answer: (
      <>
        Yes. Stolity allows candidates to upload:
        <ul className="faq-list-ul">
          <li>Videos</li>
          <li>PDFs</li>
          <li>Images</li>
          <li>Source files</li>
          <li>Docs</li>
          <li>ZIP projects</li>
        </ul>
        All directly through one link.
      </>
    )
  },
  {
    question: "What industries benefit the most from Stolity?",
    answer: (
      <>
        Top adopters include:
        <ul className="faq-list-ul">
          <li>Creative &amp; media agencies</li>
          <li>Recruiting teams</li>
          <li>Health/medical institutions</li>
          <li>Tech startups</li>
          <li>Educational institutions</li>
          <li>Content creators</li>
        </ul>
      </>
    )
  },
  {
    question: "Can I collaborate with teammates?",
    answer: (
      <>
        Yes — add team members to:
        <ul className="faq-list-ul">
          <li>Workspaces</li>
          <li>Files</li>
          <li>Jobs</li>
          <li>Client folders</li>
        </ul>
        Control what each member can view, edit, or download.
      </>
    )
  },
  {
    question: "Can I track downloads or file usage?",
    answer: (
      <>
        Yes — Stolity provides:
        <ul className="faq-list-ul">
          <li>Link activity</li>
          <li>Access logs</li>
          <li>Download history</li>
          <li>File-level analytics (optional)</li>
        </ul>
        Perfect for audits, security, and project tracking.
      </>
    )
  },
  {
    question: "How much does Stolity cost?",
    answer: (
      <>
        Pricing depends on:
        <ul className="faq-list-ul">
          <li>Individual vs. team plans</li>
          <li>Storage needs</li>
          <li>Number of users</li>
          <li>Advanced features</li>
        </ul>
        I can create a pricing plan for you if you share your tiers.
      </>
    )
  },
  {
    question: "Can I migrate from other platforms?",
    answer: (
      <>
        Yes — you can import files from:
        <ul className="faq-list-ul">
          <li>Google Drive</li>
          <li>Dropbox</li>
          <li>OneDrive</li>
          <li>Local storage</li>
        </ul>
        Stolity organizes them automatically.
      </>
    )
  },
  {
    question: "Is there a mobile version of Stolity?",
    answer: (
      <>
        You can access Stolity through any mobile browser.<br /><br />
        A dedicated mobile app is planned in the next product update.
      </>
    )
  },
  {
    question: "Can I use Stolity for client deliveries?",
    answer: (
      <>
        Yes, Stolity excels at:
        <ul className="faq-list-ul">
          <li>Sending final files</li>
          <li>Requesting feedback</li>
          <li>Delivering large assets</li>
          <li>Sending secure, branded links</li>
          <li>Tracking downloads</li>
        </ul>
      </>
    )
  },
  {
    question: "Will Stolity compress or reduce quality of my files?",
    answer: (
      <>
        Only if you choose compression.<br /><br />
        Otherwise, Stolity saves your original file 100% intact.
      </>
    )
  },
  {
    question: "What happens if a file link expires?",
    answer: (
      <>
        You can:
        <ul className="faq-list-ul">
          <li>Extend expiry</li>
          <li>Reactivate a link</li>
          <li>Create new secure share links</li>
          <li>Adjust access as needed</li>
        </ul>
      </>
    )
  }
];


const FAQPage = () => {
  const [openIndex, setOpenIndex] = useState(null);
  const [userQuestion, setUserQuestion] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [checkingActive, setCheckingActive] = useState(true);

  const apiUrl = process.env.REACT_APP_API_ENDPOINT;
  const token = sessionStorage.getItem("number");

  const fetchActiveQuestion = useCallback(async () => {
    if (!token) {
      setActiveQuestion(null);
      setCheckingActive(false);
      return;
    }
    setCheckingActive(true);
    try {
      const res = await axios.get(`${apiUrl}my-support-question`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.hasActiveQuestion && res.data?.result) {
        setActiveQuestion(res.data.result);
      } else {
        setActiveQuestion(null);
      }
    } catch {
      setActiveQuestion(null);
    } finally {
      setCheckingActive(false);
    }
  }, [apiUrl, token]);

  useEffect(() => {
    fetchActiveQuestion();
  }, [fetchActiveQuestion]);

  const handleAccordionClick = (idx) => {
    setOpenIndex((prev) => (prev === idx ? null : idx));
  };

  const handleInputChange = (e) => {
    const next = e.target.value.slice(0, QUESTION_MAX);
    setUserQuestion(next);
  };

  const handleSendQuestion = async (e) => {
    e.preventDefault();
    if (submitting || activeQuestion) return;

    const trimmed = userQuestion.trim();
    if (trimmed.length < QUESTION_MIN) {
      showToast(
        "warning",
        `Please write at least ${QUESTION_MIN} characters.`,
        "Question too short"
      );
      return;
    }

    if (!token) {
      showToast("error", "Please log in to ask a question.", "Login required");
      return;
    }

    setSubmitting(true);
    try {
      const res = await axios.post(
        `${apiUrl}support/questions`,
        { question: trimmed },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setActiveQuestion(res.data?.result || { question: trimmed, status: "pending" });
      setUserQuestion("");
      showToast(
        "success",
        "We'll get back to you soon.",
        "Question submitted"
      );
    } catch (err) {
      const status = err.response?.status;
      const msg =
        err.response?.data?.message ||
        "Could not submit your question. Please try again.";
      if (status === 409 && err.response?.data?.result) {
        setActiveQuestion(err.response.data.result);
      }
      showToast(
        status === 429 ? "warning" : "error",
        msg,
        status === 409 ? "Already open" : "Submit failed"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const charCount = userQuestion.length;
  const formDisabled = Boolean(activeQuestion) || checkingActive || submitting;

  return (
   <div className="faq-main-wrapper2">
      <SideNav />
      <div className="settings-breadcrumb" style={{marginBottom:"0"}}>
          <span style={{fontFamily:800}}>Settings</span>
          <span className="breadcrumb-separator">›</span>
          <span className="breadcrumb-current">FAQs</span>
      </div>
     <div className="faq-main-wrapper" >
      <div className="faqBody">
        <h1 className="faq-title">Frequently Asked Questions</h1>
      <div className="faq-content-wrapper">
        {/* Left: FAQ Accordion */}
        <div className="faq-left-col">
  {FAQS.map((faq, idx) => {
    const isOpen = openIndex === idx;
    return (
  <div
    className={`faq-accordion-item${isOpen ? " open" : ""}`}
    key={idx}
  >
    <button
      type="button"
      className="faq-accordion-header"
      aria-expanded={isOpen}
      onClick={() => handleAccordionClick(idx)}
    >
      <span>{faq.question}</span>
      <img
        src={isOpen ? MinusIcon : PlusIcon}
        alt=""
        aria-hidden="true"
        className={`faq-toggle-icon ${isOpen ? "minus" : "plus"}`}
        width={28}
        height={28}
      />
    </button>
    <div
      className={`faq-accordion-body${isOpen ? " open" : ""}`}
    >
      {isOpen ? faq.answer : null}
    </div>
  </div>
    );
  })}

</div>

        {/* Right: Ask Question Card */}
        <div className="faq-right-col">
          <img
            src={FAQImg1}
            alt=""
            className="faq-illustration-img"
            width={260}
          />
          <div className="faq-question-card">
            <div className="faq-question-title">Any Question?</div>
            <div className="faq-question-desc">
              You can ask anything you want to know about Stolity
            </div>

            {activeQuestion ? (
              <div className="faq-active-notice">
                <strong>You already have an open question</strong>
                <p>{activeQuestion.question}</p>
                <span>
                  Status:{" "}
                  {String(activeQuestion.status || "pending")
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (c) => c.toUpperCase())}
                </span>
              </div>
            ) : (
              <form className="faq-question-form" onSubmit={handleSendQuestion}>
                <label className="faq-input-label" htmlFor="faq-question-input">
                  Let us know
                </label>
                <textarea
                  className="faq-question-input faq-question-textarea"
                  id="faq-question-input"
                  placeholder="Type your question (20–500 characters)"
                  value={userQuestion}
                  onChange={handleInputChange}
                  rows={4}
                  maxLength={QUESTION_MAX}
                  required
                  disabled={formDisabled}
                />
                <div className="faq-char-count">
                  {charCount}/{QUESTION_MAX}
                  {charCount > 0 && charCount < QUESTION_MIN ? (
                    <span className="faq-char-hint">
                      {" "}
                      · {QUESTION_MIN - charCount} more needed
                    </span>
                  ) : null}
                </div>
                <button
                  className="faq-send-btn"
                  type="submit"
                  disabled={
                    formDisabled ||
                    userQuestion.trim().length < QUESTION_MIN
                  }
                >
                  <img src={SendArrow} alt="" width={18} style={{ marginRight: 8 }} />
                  {submitting ? "Sending…" : "Send"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
   </div>
  );
};

export default FAQPage;