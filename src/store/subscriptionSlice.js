import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const apiUrl = process.env.REACT_APP_API_ENDPOINT;

function resolveAuthArg(arg) {
  if (typeof arg === "string") {
    return { token: arg, force: false };
  }
  return {
    token: arg?.token,
    force: Boolean(arg?.force),
  };
}

/**
 * Load subscription once per session.
 * Pass { token, force: true } after payment / plan change.
 */
export const fetchUserSubscription = createAsyncThunk(
  "subscription/fetchUserSubscription",
  async (arg) => {
    const { token } = resolveAuthArg(arg);
    const subscriptionUrl = process.env.REACT_APP_SUBSCRIPTION_SLICE;
    if (!subscriptionUrl) {
      throw new Error("REACT_APP_SUBSCRIPTION_SLICE is missing from .env");
    }
    const response = await axios.get(subscriptionUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
  {
    condition: (arg, { getState }) => {
      const { force } = resolveAuthArg(arg);
      if (force) return true;
      const { status } = getState().subscription;
      if (status === "loading" || status === "succeeded") return false;
      return true;
    },
  }
);

/**
 * Load used storage once; refresh with { token, force: true }
 * after upload / copy / delete / restore / etc.
 */
export const fetchUserFolderSize = createAsyncThunk(
  "subscription/fetchUserFolderSize",
  async (arg) => {
    const { token } = resolveAuthArg(arg);
    const response = await axios.get(`${apiUrl}get-folder-size`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
  {
    condition: (arg, { getState }) => {
      const { force } = resolveAuthArg(arg);
      if (force) return true;
      const { folderSizeStatus } = getState().subscription;
      if (folderSizeStatus === "loading" || folderSizeStatus === "succeeded") {
        return false;
      }
      return true;
    },
  }
);

export const loginUser = createAsyncThunk(
  "subscription/loginUser",
  async (loginData) => {
    const response = await axios.post(`${apiUrl}login-user`, loginData);
    return response.data;
  }
);

const getInitialSpecialUserFlag = () => {
  try {
    const email = sessionStorage.getItem("email");
    return email === "triveni@infomanav.in" || email === "fahad@infomanav.in";
  } catch {
    return false;
  }
};

const initialState = {
  subscription: null,
  folderSize: null,
  status: "idle", // subscription status
  folderSizeStatus: "idle",
  error: null,
  bucketName: null,
  specialUserFlag: getInitialSpecialUserFlag(),
  redirectToPaymentAfterLogin: false,
};

const subscriptionSlice = createSlice({
  name: "subscription",
  initialState,
  reducers: {
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
      .addCase(fetchUserFolderSize.pending, (state) => {
        state.folderSizeStatus = "loading";
      })
      .addCase(fetchUserFolderSize.fulfilled, (state, action) => {
        state.folderSize = action.payload;
        state.folderSizeStatus = "succeeded";
      })
      .addCase(fetchUserFolderSize.rejected, (state, action) => {
        state.folderSizeStatus = "failed";
        state.error = action.error.message;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        const email = sessionStorage.getItem("email");
        state.specialUserFlag =
          action.payload.flag === 1 ||
          email === "triveni@infomanav.in" ||
          email === "fahad@infomanav.in";
      });
  },
});

export const { setSpecialUserFlag, setRedirectToPaymentAfterLogin } =
  subscriptionSlice.actions;

export default subscriptionSlice.reducer;
