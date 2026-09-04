import { createSlice } from "@reduxjs/toolkit";

const splitName = (fullName = "") => {
  const trimmed = String(fullName || "").trim();
  if (!trimmed) return { firstName: "", lastName: "" };
  const parts = trimmed.split(/\s+/);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" ") || "",
  };
};

/** Normalize avatar from API / session (URL, data-URI, or raw base64). */
export const normalizeAvatarUrl = (raw) => {
  if (raw == null) return "";
  const value = String(raw).trim();
  if (
    !value ||
    value === "undefined" ||
    value === "null" ||
    value === "false"
  ) {
    return "";
  }
  if (
    value.startsWith("data:image") ||
    /^https?:\/\//i.test(value) ||
    value.startsWith("/") ||
    value.startsWith("blob:")
  ) {
    return value;
  }
  // Legacy: raw base64 without data-URI prefix
  return `data:image/jpeg;base64,${value}`;
};

export const buildUserProfile = ({
  name = "",
  email = "",
  contact = "",
  mobile,
  avatar = "",
  userId = "",
} = {}) => {
  const fullName = String(name || "").trim();
  const { firstName, lastName } = splitName(fullName);

  return {
    name: fullName,
    firstName,
    lastName,
    email: String(email || "").trim(),
    mobile: String(mobile ?? contact ?? "").trim(),
    avatar: normalizeAvatarUrl(avatar),
    userId: userId ? String(userId) : "",
  };
};

/** Keep sessionStorage in sync for older code that still reads it. */
export const syncUserProfileToSession = (profile) => {
  if (!profile) return;
  if (profile.name != null) sessionStorage.setItem("name", profile.name);
  if (profile.email != null) sessionStorage.setItem("email", profile.email);
  if (profile.mobile != null) sessionStorage.setItem("num", profile.mobile);
  if (profile.avatar != null) {
    sessionStorage.setItem("avatar", profile.avatar);
  }
  if (profile.userId) sessionStorage.setItem("userId", profile.userId);

  // Keep nested userData.userAvatar / name / contact in sync for rehydration
  try {
    const raw = sessionStorage.getItem("userData");
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed?.userData && typeof parsed.userData === "object") {
      parsed.userData = {
        ...parsed.userData,
        name: profile.name || parsed.userData.name,
        email: profile.email || parsed.userData.email,
        contact: profile.mobile || parsed.userData.contact,
        userAvatar: profile.avatar || parsed.userData.userAvatar,
      };
      sessionStorage.setItem("userData", JSON.stringify(parsed));
    } else if (parsed && typeof parsed === "object") {
      sessionStorage.setItem(
        "userData",
        JSON.stringify({
          ...parsed,
          name: profile.name || parsed.name,
          email: profile.email || parsed.email,
          contact: profile.mobile || parsed.contact,
          userAvatar: profile.avatar || parsed.userAvatar,
        })
      );
    }
  } catch {
    // ignore parse errors
  }
};

const readUserDataFromSession = () => {
  try {
    const raw = sessionStorage.getItem("userData");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Email login stores full API response; Google stores userData only
    return parsed?.userData || parsed;
  } catch {
    return null;
  }
};

const getInitialFromSession = () => {
  try {
    const ud = readUserDataFromSession();
    const email = sessionStorage.getItem("email") || ud?.email || "";
    const name = sessionStorage.getItem("name") || ud?.name || "";
    const mobile = sessionStorage.getItem("num") || ud?.contact || "";
    const avatar =
      normalizeAvatarUrl(sessionStorage.getItem("avatar")) ||
      normalizeAvatarUrl(ud?.userAvatar) ||
      "";
    const userId = sessionStorage.getItem("userId") || ud?.id || "";

    return buildUserProfile({ name, email, contact: mobile, avatar, userId });
  } catch {
    return buildUserProfile({});
  }
};

const initialState = getInitialFromSession();

const userProfileSlice = createSlice({
  name: "userProfile",
  initialState,
  reducers: {
    /** Pass API `userData` (and optional userId / avatar override). */
    setUserProfileFromUserData: (state, action) => {
      const payload = action.payload || {};
      const userData = payload.userData || payload;
      const next = buildUserProfile({
        name: userData.name,
        email: userData.email,
        contact: userData.contact,
        avatar: payload.avatar ?? userData.userAvatar ?? "",
        userId: payload.userId || userData.id || "",
      });
      Object.assign(state, next);
      syncUserProfileToSession(next);
    },
    setUserProfile: (state, action) => {
      const next = buildUserProfile({
        ...state,
        ...action.payload,
        contact:
          action.payload?.mobile ??
          action.payload?.contact ??
          state.mobile,
      });
      Object.assign(state, next);
      syncUserProfileToSession(next);
    },
    clearUserProfile: () => buildUserProfile({}),
  },
});

export const {
  setUserProfileFromUserData,
  setUserProfile,
  clearUserProfile,
} = userProfileSlice.actions;

export default userProfileSlice.reducer;
