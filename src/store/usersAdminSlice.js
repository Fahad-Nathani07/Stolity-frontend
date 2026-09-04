import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";

const toMillis = (value) => {
  if (!value) return null;
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value?.seconds === "number") return value.seconds * 1000;
  if (value instanceof Date) return value.getTime();
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
};

/* =========================
   Fetch ALL users
   (for admin list)
========================= */
export const fetchAllUsers = createAsyncThunk(
  "usersAdmin/fetchAllUsers",
  async (_, { rejectWithValue }) => {
    try {
      const snapshot = await getDocs(collection(db, "users"));

      const users = snapshot.docs.map((doc) => {
        const data = doc.data();

        return {
          id: doc.id,
          ...data,

          lastLoginAt: toMillis(data.lastLoginAt),
          createdAt: toMillis(data.createdAt),
          subscriptionUpdatedAt: toMillis(data.subscriptionUpdatedAt),
        };
      });

      return users;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/* =========================
   Fetch CURRENT USER by email
   (for profile / current user details)
========================= */
export const fetchCurrentUserByEmail = createAsyncThunk(
  "usersAdmin/fetchCurrentUserByEmail",
  async (email, { rejectWithValue }) => {
    try {
      if (!email) {
        return rejectWithValue("Email is required");
      }

      console.log("mmmmm Fetching current user by email:", email);

      const q = query(
        collection(db, "users"),
        where("email", "==", email)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        console.log("mmmmm No user found for email:", email);
        return rejectWithValue("User not found");
      }

      // Take the first (and only) matching user
      const docSnap = snapshot.docs[0];
      const data = docSnap.data();

      // console.log("mmmmm Current user fetched --> User document data:", snapshot.docs[0]);
      console.log("mmmmm Current user fetched --> User document data:", data);

      const user = {
        id: docSnap.id,
        name: data.name || "",
        email: data.email || "",
        contact: data.contact || "",
        isSoftBan: data.isSoftBan || false, // Default to false if missing
        subscription: data.subscription || null, // null if missing
        jobPortal: data.jobPortal
          ? {
              companies: Array.isArray(data.jobPortal.companies)
                ? data.jobPortal.companies
                : [],
              role: data.jobPortal.role || null,
            }
          : null, // null if no jobPortal field
      };

      console.log("mmmmm Current user fetched:", user);

      return user;
    } catch (err) {
      console.error("mmmmm Error fetching current user:", err);
      return rejectWithValue(err.message);
    }
  }
);

/* =========================
   Slice
========================= */
const usersAdminSlice = createSlice({
  name: "usersAdmin",
  initialState: {
    users: [],               // for all users (admin list)
    currentUser: null,       // for logged-in user's details
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetchAllUsers
      .addCase(fetchAllUsers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // fetchCurrentUserByEmail
      .addCase(fetchCurrentUserByEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentUserByEmail.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload;
      })
      .addCase(fetchCurrentUserByEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.currentUser = null;
      });
  },
});

export default usersAdminSlice.reducer;