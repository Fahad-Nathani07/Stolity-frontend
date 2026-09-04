import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase"; // adjust path if needed

// Fetch ALL interviews for a specific company (no date filter → no index needed)
export const fetchUpcomingInterviews = createAsyncThunk(
  "interviewMaster/fetchUpcomingInterviews",
  async (companyId, { rejectWithValue }) => {
    try {
      console.log("[-----INTERVIEW-THUNK] Starting fetch for companyId:", companyId);

      if (!companyId) {
        console.warn("[-----INTERVIEW-THUNK] No companyId provided");
        return rejectWithValue("No company ID provided");
      }

      const q = query(
        collection(db, "interviewMaster"),
        where("companyId", "==", companyId)
      );

      console.log("[-----INTERVIEW-THUNK] Executing Firestore query:", q);

      const snapshot = await getDocs(q);

      console.log(
        "[-----INTERVIEW-THUNK] Query completed. Found documents count:",
        snapshot.docs.length
      );

      if (snapshot.empty) {
        console.log("[-----INTERVIEW-THUNK] No documents found for this companyId");
      } else {
        console.log(
          "[-----INTERVIEW-THUNK] First few raw docs (preview):",
          snapshot.docs.slice(0, 3).map((doc) => ({
            id: doc.id,
            companyId: doc.data().companyId,
            interviewDate: doc.data().interviewDate
              ? doc.data().interviewDate.toDate?.()?.toISOString() || "Invalid TS"
              : "No date",
            status: doc.data().status || "N/A",
          }))
        );
      }

      const interviews = snapshot.docs.map((doc) => {
        const data = doc.data();

        // Safely convert Timestamp to JS Date
        const interviewDateJS = data.interviewDate?.toDate?.() || null;

        return {
          id: doc.id,
          ...data,
          interviewDate: interviewDateJS, // JS Date or null
          interviewDateISO: interviewDateJS ? interviewDateJS.toISOString() : null,
          createdAt: data.createdAt?.toDate?.() || null,
          appliedDate: data.appliedDate || null,
        };
      });

      console.log(
        "[-----INTERVIEW-THUNK] Processed interviews count:",
        interviews.length
      );

      if (interviews.length > 0) {
        console.log(
          "[-----INTERVIEW-THUNK] First few processed interviews:",
          interviews.slice(0, 3).map((i) => ({
            id: i.id,
            candidate: `${i.first_Name || ""} ${i.lastName || ""}`,
            jobTitle: i.jobTitle || "N/A",
            interviewDate: i.interviewDateISO || "N/A",
            status: i.status || "N/A",
          }))
        );
      } else {
        console.log("[-----INTERVIEW-THUNK] No interviews returned after processing");
      }

      return interviews;
    } catch (err) {
      console.error("[-----INTERVIEW-THUNK] Fetch error:", err);
      console.error("[-----INTERVIEW-THUNK] Full error object:", err);
      return rejectWithValue(err.message || "Unknown Firestore error");
    }
  }
);

// NEW: Fetch ALL meetings for a specific company from meetingMaster
export const fetchMeetingsForCompany = createAsyncThunk(
  "interviewMaster/fetchMeetingsForCompany",
  async (companyId, { rejectWithValue }) => {
    try {
      console.log("[-----MEETING-THUNK] Starting fetch for companyId:", companyId);

      if (!companyId) {
        console.warn("[-----MEETING-THUNK] No companyId provided");
        return rejectWithValue("No company ID provided");
      }

      const q = query(
        collection(db, "meetingMaster"),
        where("companyId", "==", companyId)
      );

      console.log("[-----MEETING-THUNK] Executing Firestore query:", q);

      const snapshot = await getDocs(q);

      console.log(
        "[-----MEETING-THUNK] Query completed. Found meetings count:",
        snapshot.docs.length
      );

      if (snapshot.empty) {
        console.log("[-----MEETING-THUNK] No meetings found for this companyId");
      }

      const meetings = snapshot.docs.map((doc) => {
        const data = doc.data();

        // Convert timestamps safely
        return {
          id: doc.id,
          ...data,
          date: data.date?.toDate?.() || null,              // JS Date or null
          createdAt: data.createdAt?.toDate?.() || null,
          softBanAt: data.softBanAt?.toDate?.() || null,    // if you ever add it
        };
      });

      console.log(
        "[-----MEETING-THUNK] Processed meetings count:",
        meetings.length
      );

      return meetings;
    } catch (err) {
      console.error("[-----MEETING-THUNK] Fetch error:", err);
      return rejectWithValue(err.message || "Firestore error");
    }
  }
);

const interviewMasterSlice = createSlice({
  name: "interviewMaster",
  initialState: {
    upcomingInterviews: [],
    meetings: [],               // NEW: array of meetings
    loading: false,
    meetingsLoading: false,     // NEW: separate loading for meetings
    error: null,
    meetingsError: null,        // NEW
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Interviews - existing
      .addCase(fetchUpcomingInterviews.pending, (state) => {
        state.loading = true;
        state.error = null;
        console.log("[INTERVIEW-SLICE] Fetch pending...");
      })
      .addCase(fetchUpcomingInterviews.fulfilled, (state, action) => {
        state.loading = false;
        state.upcomingInterviews = action.payload;
        console.log(
          "[INTERVIEW-SLICE] Fetch fulfilled. Stored interviews count:",
          action.payload.length
        );
      })
      .addCase(fetchUpcomingInterviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        console.error("[INTERVIEW-SLICE] Fetch rejected:", action.payload);
      })

      // NEW: Meetings fetch handlers
      .addCase(fetchMeetingsForCompany.pending, (state) => {
        state.meetingsLoading = true;
        state.meetingsError = null;
        console.log("[MEETING-SLICE] Fetch pending...");
      })
      .addCase(fetchMeetingsForCompany.fulfilled, (state, action) => {
        state.meetingsLoading = false;
        state.meetings = action.payload;
        console.log(
          "[MEETING-SLICE] Fetch fulfilled. Stored meetings count:",
          action.payload.length
        );
      })
      .addCase(fetchMeetingsForCompany.rejected, (state, action) => {
        state.meetingsLoading = false;
        state.meetingsError = action.payload;
        console.error("[MEETING-SLICE] Fetch rejected:", action.payload);
      });
  },
});

export default interviewMasterSlice.reducer;