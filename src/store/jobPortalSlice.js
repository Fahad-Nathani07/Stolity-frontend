import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";

function resolveArg(arg) {
  if (typeof arg === "string") {
    return { email: arg, force: false };
  }
  return {
    email: arg?.email,
    force: Boolean(arg?.force),
  };
}

/**
 * Load job-portal role/companies once per session.
 * SUPER_ADMIN company list is resolved inside this same call (no second remount fetch).
 * Pass { email, force: true } to refetch.
 */
export const fetchJobPortalByEmail = createAsyncThunk(
  "jobPortal/fetchByEmail",
  async (arg, { rejectWithValue }) => {
    const { email } = resolveArg(arg);

    try {
      if (!email) {
        return {
          role: null,
          companies: [],
          currentUserId: null,
        };
      }

      const q = query(collection(db, "users"), where("email", "==", email));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return {
          role: null,
          companies: [],
          currentUserId: null,
        };
      }

      const docSnap = snapshot.docs[0];
      const userData = docSnap.data();
      const role = userData.jobPortal?.role || null;
      let companies = userData.jobPortal?.companies || [];

      // SUPER_ADMIN: load all company ids in this same request
      if (role === "SUPER_ADMIN") {
        const companySnapshot = await getDocs(collection(db, "companyMaster"));
        companies = companySnapshot.docs.map((doc) => doc.id);
      }

      return {
        role,
        companies,
        currentUserId: docSnap.id,
      };
    } catch (err) {
      console.error("fetchJobPortalByEmail ERROR:", err);
      return rejectWithValue({
        message: err.message || "Failed to fetch job portal data",
        code: err.code || "UNKNOWN_ERROR",
        email,
      });
    }
  },
  {
    condition: (arg, { getState }) => {
      const { force } = resolveArg(arg);
      if (force) return true;
      const { status, loading } = getState().jobPortal;
      if (loading || status === "loading" || status === "succeeded") {
        return false;
      }
      return true;
    },
  }
);

const initialState = {
  role: null,
  companies: [],
  currentUserId: null,
  loading: false,
  status: "idle", // idle | loading | succeeded | failed
  error: null,
};

const jobPortalSlice = createSlice({
  name: "jobPortal",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchJobPortalByEmail.pending, (state) => {
        state.loading = true;
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchJobPortalByEmail.fulfilled, (state, action) => {
        state.role = action.payload.role;
        state.companies = action.payload.companies;
        state.currentUserId = action.payload.currentUserId;
        state.loading = false;
        state.status = "succeeded";
        state.error = null;
      })
      .addCase(fetchJobPortalByEmail.rejected, (state, action) => {
        state.loading = false;
        state.status = "failed";
        state.error = action.payload;
        state.role = null;
        state.companies = [];
        state.currentUserId = null;
      });
  },
});

export default jobPortalSlice.reducer;
