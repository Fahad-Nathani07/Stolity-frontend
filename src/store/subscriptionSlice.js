import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Thunks to fetch subscription and folder size
const apiUrl = process.env.REACT_APP_API_ENDPOINT;

export const fetchUserSubscription = createAsyncThunk(
  "subscription/fetchUserSubscription",
  async (token) => {
    const subscriptionUrl = process.env.REACT_APP_SUBSCRIPTION_SLICE;
    if (!subscriptionUrl) {
      throw new Error(
        "REACT_APP_SUBSCRIPTION_SLICE is missing from .env"
      );
    }
    const response = await axios.get(subscriptionUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }
);

export const fetchUserFolderSize = createAsyncThunk(
  "subscription/fetchUserFolderSize",
  async (token) => {
    const response = await axios.get(
      // "https://filesapi.infomanav.in/prod/api/aws/get-folder-size",
      `${apiUrl}get-folder-size`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  }
);

export const loginUser = createAsyncThunk(
  "subscription/loginUser",
  async (loginData) => {
    const response = await axios.post(
      // "https://filesapi.infomanav.in/prod/api/aws/login-user",
      `${apiUrl}login-user`,
      loginData
    );
    return response.data;
  }
);

// ✅ Check sessionStorage on initial load
const getInitialSpecialUserFlag = () => {
  try {
    const email = sessionStorage.getItem('email');
    return email === 'triveni@infomanav.in' || email === 'fahad@infomanav.in';
  } catch {
    return false;
  }
};

const initialState = {
  subscription: null,
  folderSize: null, 
  status: "idle",
  error: null,
  bucketName: null,
  specialUserFlag: getInitialSpecialUserFlag(), // ✅ Sets flag on app load from sessionStorage
  redirectToPaymentAfterLogin: false,
};

const subscriptionSlice = createSlice({
  name: "subscription",
  initialState,
  reducers: {
    // ✅ Manual flag update (use after login/email changes)
    setSpecialUserFlag: (state, action) => {
      state.specialUserFlag = action.payload;
    },
    setRedirectToPaymentAfterLogin: (state, action) => {
      state.redirectToPaymentAfterLogin = Boolean(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserSubscription.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchUserSubscription.fulfilled, (state, action) => {
        state.subscription = action.payload.subscription;
        state.bucketName = action.payload.userData?.bucketName || null;
        state.status = "succeeded";
      })
      .addCase(fetchUserSubscription.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      .addCase(fetchUserFolderSize.fulfilled, (state, action) => {
        state.folderSize = action.payload;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        // ✅ Both API flag + email check as fallback
        const email = sessionStorage.getItem('email');
        state.specialUserFlag = (action.payload.flag === 1) || (email === 'triveni@infomanav.in') || (email === 'fahad@infomanav.in');
      });
  },
});

// ✅ Export the action creator
export const { setSpecialUserFlag, setRedirectToPaymentAfterLogin } = subscriptionSlice.actions;

export default subscriptionSlice.reducer;
