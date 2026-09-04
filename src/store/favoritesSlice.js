import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const apiUrl = process.env.REACT_APP_API_ENDPOINT;

/**
 * Load favorite file names once per session (skipped if already loaded / in flight).
 * Pass { force: true } to refetch (e.g. Favourites page after bulk changes).
 */
export const fetchFavoriteFiles = createAsyncThunk(
  "favorites/fetchFavoriteFiles",
  async ({ token } = {}) => {
    const response = await axios.get(`${apiUrl}get-favorite-files`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    const items = response.data?.result || [];
    return {
      items,
      fileNames: items.map((file) => file.fileName).filter(Boolean),
    };
  },
  {
    condition: (arg, { getState }) => {
      if (arg?.force) return true;
      const { status } = getState().favorites;
      // Skip duplicate calls (Strict Mode / remount / NestedPage + Files)
      if (status === "loading" || status === "succeeded") return false;
      return true;
    },
  }
);

const initialState = {
  items: [],
  fileNames: [],
  status: "idle", // idle | loading | succeeded | failed
  error: null,
};

const favoritesSlice = createSlice({
  name: "favorites",
  initialState,
  reducers: {
    addFavoriteName: (state, action) => {
      const name = action.payload;
      if (!name || state.fileNames.includes(name)) return;
      state.fileNames.push(name);
    },
    removeFavoriteName: (state, action) => {
      const name = action.payload;
      state.fileNames = state.fileNames.filter((n) => n !== name);
      state.items = state.items.filter((item) => item.fileName !== name);
    },
    clearFavorites: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFavoriteFiles.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchFavoriteFiles.fulfilled, (state, action) => {
        state.items = action.payload.items || [];
        state.fileNames = action.payload.fileNames || [];
        state.status = "succeeded";
      })
      .addCase(fetchFavoriteFiles.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      });
  },
});

export const { addFavoriteName, removeFavoriteName, clearFavorites } =
  favoritesSlice.actions;

export default favoritesSlice.reducer;
