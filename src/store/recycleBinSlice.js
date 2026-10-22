import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const apiUrl = process.env.REACT_APP_API_ENDPOINT;

/**
 * Load recycle bin once per session (skipped if already loaded / in flight).
 * Pass { force: true } after soft-delete / restore / permanent delete.
 */
export const fetchRecycleBin = createAsyncThunk(
  "recycleBin/fetchRecycleBin",
  async ({ token } = {}) => {
    const response = await axios.get(`${apiUrl}get-recycle-bin`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    const items = response.data?.result || response.data || [];
    return { items: Array.isArray(items) ? items : [] };
  },
  {
    condition: (arg, { getState }) => {
      if (arg?.force) return true;
      const { status } = getState().recycleBin;
      if (status === "loading" || status === "succeeded") return false;
      return true;
    },
  }
);

const initialState = {
  items: [],
  status: "idle", // idle | loading | succeeded | failed
  error: null,
};

const recycleBinSlice = createSlice({
  name: "recycleBin",
  initialState,
  reducers: {
    clearRecycleBin: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRecycleBin.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchRecycleBin.fulfilled, (state, action) => {
        state.items = action.payload.items || [];
        state.status = "succeeded";
      })
      .addCase(fetchRecycleBin.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      });
  },
});

export const { clearRecycleBin } = recycleBinSlice.actions;

export default recycleBinSlice.reducer;
