import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  collection,
  getDocs,
  query,
  where,
  documentId,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

/* =========================
   Fetch ALL companies
   (SUPER_ADMIN)
========================= */
export const fetchCompanies = createAsyncThunk(
  "companyMaster/fetchCompanies",
  async (_, { rejectWithValue }) => {
    try {
      const snapshot = await getDocs(collection(db, "companyMaster"));

      const companies = snapshot.docs.map((doc) => {
        const data = doc.data();

        return {
          id: doc.id,
          name: data.name || "",
          slug: data.slug || "",
          email: data.email || "",
          mobile: data.mobile || "",
          website: data.website || "",
          description: data.description || "",
          officeAddress: data.officeAddress || "",
          registrationNumber: data.registrationNumber || "",
          logoUrl: data.logoUrl || "",
          primaryColor: data.primaryColor || "#ffffff",
          secondaryColor: data.secondaryColor || "#FFAB49",
          location: Array.isArray(data.location) ? data.location : [],
          socials: data.socials || {
            linkedin: "",
            twitter: "",
            facebook: "",
            instagram: "",
          },
          isConfigured: data.isConfigured ?? false,
          companySoftBan: data.companySoftBan ?? false,
          companySoftBanAt: data.companySoftBanAt || null,
          companySoftBanBy: data.companySoftBanBy || null,
          isActive: data.isActive ?? false,           // Added from your screenshot
          createdBy: data.createdBy || "",
          createdAt: data.createdAt
            ? data.createdAt.seconds * 1000
            : null,
          updatedAt: data.updatedAt
            ? data.updatedAt.seconds * 1000
            : null,
          updatedBy: data.updatedBy ?? null,
        };
      });

      return companies;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/* =========================
   Fetch ONLY assigned companies
   (ADMIN / MANAGER)
========================= */
export const fetchCompaniesByIds = createAsyncThunk(
  "companyMaster/fetchCompaniesByIds",
  async (companyIds, { rejectWithValue }) => {
    try {
      if (!companyIds || companyIds.length === 0) {
        return [];
      }

      const q = query(
        collection(db, "companyMaster"),
        where(documentId(), "in", companyIds)
      );

      const snapshot = await getDocs(q);

      const companies = snapshot.docs.map((doc) => {
        const data = doc.data();

        return {
          id: doc.id,
          name: data.name || "",
          slug: data.slug || "",
          email: data.email || "",
          mobile: data.mobile || "",
          website: data.website || "",
          description: data.description || "",
          officeAddress: data.officeAddress || "",
          registrationNumber: data.registrationNumber || "",
          logoUrl: data.logoUrl || "",
          primaryColor: data.primaryColor || "#ffffff",
          secondaryColor: data.secondaryColor || "#FFAB49",
          location: Array.isArray(data.location) ? data.location : [],
          socials: data.socials || {
            linkedin: "",
            twitter: "",
            facebook: "",
            instagram: "",
          },
          isConfigured: data.isConfigured ?? false,
          isSMTPActivated: data.isSMTPActivated ?? false,

          companySoftBan: data.companySoftBan ?? false,
          companySoftBanAt: data.companySoftBanAt || null,
          companySoftBanBy: data.companySoftBanBy || null,

          
          isActive: data.isActive ?? false,
          createdBy: data.createdBy || "",
          createdAt: data.createdAt
            ? data.createdAt.seconds * 1000
            : null,
          updatedAt: data.updatedAt
            ? data.updatedAt.seconds * 1000
            : null,
          updatedBy: data.updatedBy ?? null,
        };
      });

      return companies;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/* =========================
   Update Company (new)
========================= */
export const updateCompany = createAsyncThunk(
  "companyMaster/updateCompany",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const companyRef = doc(db, "companyMaster", id);

      await updateDoc(companyRef, {
        ...data,
        updatedAt: serverTimestamp(),   // Server-side timestamp
      });

      return { id, ...data }; // Return updated data to update Redux state
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/* =========================
   Slice
========================= */
const companyMasterSlice = createSlice({
  name: "companyMaster",
  initialState: {
    companies: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder

      // fetchCompanies (ALL)
      .addCase(fetchCompanies.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCompanies.fulfilled, (state, action) => {
        state.loading = false;
        state.companies = action.payload;
      })
      .addCase(fetchCompanies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // fetchCompaniesByIds (ASSIGNED ONLY)
      .addCase(fetchCompaniesByIds.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCompaniesByIds.fulfilled, (state, action) => {
        state.loading = false;
        state.companies = action.payload;
      })
      .addCase(fetchCompaniesByIds.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // updateCompany (NEW)
      .addCase(updateCompany.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateCompany.fulfilled, (state, action) => {
        state.loading = false;
        const { id, ...updates } = action.payload;
        const index = state.companies.findIndex((c) => c.id === id);
        if (index !== -1) {
          state.companies[index] = { ...state.companies[index], ...updates };
        }
      })
      .addCase(updateCompany.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default companyMasterSlice.reducer;