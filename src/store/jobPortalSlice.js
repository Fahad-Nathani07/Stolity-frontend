import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";

export const fetchJobPortalByEmail = createAsyncThunk(
  "jobPortal/fetchByEmail",
  async ({ email, role }, { rejectWithValue }) => {
    try {
      console.log("ooooo 🔍 fetchJobPortalByEmail START:", { email, role });

      /* ============================
         ✅ SUPER ADMIN FLOW
      ============================ */
      if (role === "SUPER_ADMIN") {
        console.log("ooooo 👑 SUPER_ADMIN detected - fetching ALL companies");

        const snapshot = await getDocs(collection(db, "companyMaster"));

        if (!snapshot) {
          throw new Error("Failed to fetch companyMaster collection");
        }

        const companyIds = snapshot.docs.map(doc => doc.id);
        console.log("ooooo ✅ SUPER_ADMIN companies fetched:", companyIds.length, "companies");

        return {
          role: "SUPER_ADMIN",
          companies: companyIds,
          currentUserId: null,
        };
      }

      /* ============================
         👤 NORMAL USER FLOW
      ============================ */
      console.log("ooooo 👤 Normal user flow - querying users by email:", email);
      
      const q = query(
        collection(db, "users"),
        where("email", "==", email)
      );

      const snapshot = await getDocs(q);

      if (!snapshot) {
        throw new Error("Failed to query users collection");
      }

      if (snapshot.empty) {
        console.log("ooooo ❌ No user found for email:", email);
        return {
          role: null,
          companies: [],
          currentUserId: null,
        };
      }

      const docSnap = snapshot.docs[0];
      const userData = docSnap.data();

      console.log("ooooo ✅ User found:", {
        id: docSnap.id,
        email: userData.email,
        jobPortal: userData.jobPortal
      });

      return {
        role: userData.jobPortal?.role || null,
        companies: userData.jobPortal?.companies || [],
        currentUserId: docSnap.id,
      };

    } catch (err) {
      console.error("ooooo 💥 fetchJobPortalByEmail ERROR:", {
        message: err.message,
        code: err.code,
        stack: err.stack?.substring(0, 200) + "...",
        email: email,
        role: role
      });
      
      console.error("ooooo Full error details:", err);
      
      return rejectWithValue({
        message: err.message || "Failed to fetch job portal data",
        code: err.code || "UNKNOWN_ERROR",
        email: email,
        role: role
      });
    }
  }
);

const initialState = {
  role: null,
  companies: [],
  currentUserId: null,
  loading: false,
  error: null,
};

const jobPortalSlice = createSlice({
  name: "jobPortal",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchJobPortalByEmail.pending, (state) => {
        console.log("ooooo ⏳ REDUX: fetchJobPortalByEmail pending");
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchJobPortalByEmail.fulfilled, (state, action) => {
        console.log("ooooo ✅ REDUX: fetchJobPortalByEmail fulfilled:", {
          role: action.payload.role,
          companiesCount: action.payload.companies?.length || 0,
          currentUserId: action.payload.currentUserId
        });
        state.role = action.payload.role;
        state.companies = action.payload.companies;
        state.currentUserId = action.payload.currentUserId;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchJobPortalByEmail.rejected, (state, action) => {
        console.error("ooooo ❌ REDUX: fetchJobPortalByEmail rejected:", {
          error: action.payload,
          errorMessage: action.payload?.message,
          errorCode: action.payload?.code
        });
        state.loading = false;
        state.error = action.payload;
        state.role = null;
        state.companies = [];
        state.currentUserId = null;
      });
  },
});

export default jobPortalSlice.reducer;
