// src/services/emailService.js

const API_BASE_URL = process.env.REACT_APP_JOB_PORTAL_API_BASE_URL || 'http://localhost:3001'; // fallback

/**
 * Sends an email notification via backend API
 * @param {Object} payload - Email details
 * @param {string} payload.companyId - Required - Company document ID
 * @param {string} payload.title - Required - Email subject / meeting title
 * @param {string} payload.message - Required - Email body (supports \n for line breaks)
 * @param {string[]} payload.members - Required - Array of recipient emails
 * @param {string} [payload.meetingLink] - Optional - Google Meet / call link
 * @param {string} [payload.date] - Optional - Full date string
 * @param {string} [payload.time] - Optional - Time string
 * @param {number} [payload.duration] - Optional - Duration in minutes
 * @param {string} [payload.category] - Optional - e.g. "Meetings", "Interview"
 * @param {string} [payload.createdBy] - Optional - Email of sender/initiator
 * @returns {Promise<Object>} Response from backend
 */
export const sendEmail = async (payload) => {
  // Basic client-side validation for mandatory fields
  if (!payload.companyId) throw new Error('companyId is required');
  if (!payload.title) throw new Error('title is required');
  if (!payload.message) throw new Error('message is required');
  if (!Array.isArray(payload.members) || payload.members.length === 0) {
    throw new Error('members must be a non-empty array of emails');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/email/sendEmail`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server responded with status ${response.status}`);
    }

    const data = await response.json();
    console.log('Email queued successfully:', data);
    return data; // { success: true, message: "Email queued for sending" }

  } catch (error) {
    console.error('Failed to send email:', error);
    throw error; // Caller can catch and show toast/alert
  }
};

// Optional helper for common use cases (e.g. team meeting)
export const notifyTeamMeeting = async ({
  companyId,
  title,
  message,
  members,
  meetingLink,
  date,
  time,
  duration = 30,
  category = 'Meetings',
  createdBy,
}) => {
  return sendEmail({
    companyId,
    title,
    message,
    members,
    meetingLink,
    date,
    time,
    duration,
    category,
    createdBy,
  });
};