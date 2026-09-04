// import { configureStore } from '@reduxjs/toolkit'
// import subscriptionReducer from "./subscriptionSlice";
// import jobPortalReducer from "./jobPortalSlice";
// import fileSlicer from './fileSlicer'
// import usersAdminReducer from "./usersAdminSlice";
// import companyMasterReducer from "./companyMasterSlice";


// const store = configureStore({
//   reducer: {
//     getdata: fileSlicer,
//     subscription: subscriptionReducer,
//     jobPortal: jobPortalReducer, 
//     usersAdmin: usersAdminReducer, 
//     companyMaster: companyMasterReducer,
//   },
// })

// window.store = store;

// // Log every store update
// store.subscribe(() => {
//   console.log('mmmmm Current Redux store state:', store.getState());
// });

// export default store;


// store.js  (or index.js in store folder)

// store.js

import { configureStore, combineReducers } from '@reduxjs/toolkit';  // ← Add combineReducers import
import subscriptionReducer from "./subscriptionSlice";
import jobPortalReducer from "./jobPortalSlice";
import fileSlicer from './fileSlicer';
import usersAdminReducer from "./usersAdminSlice";
import companyMasterReducer from "./companyMasterSlice";
import interviewMasterReducer from "./interviewMasterSlice";
import userProfileReducer from "./userProfileSlice";

// 1. Create the combined reducer function using combineReducers
const appReducer = combineReducers({
  getdata: fileSlicer,
  subscription: subscriptionReducer,
  jobPortal: jobPortalReducer,
  usersAdmin: usersAdminReducer,
  companyMaster: companyMasterReducer,
  interviewMaster: interviewMasterReducer,
  userProfile: userProfileReducer,
});

// 2. Root reducer wrapper – now appReducer is a function
const rootReducer = (state, action) => {
  if (action.type === 'RESET') {
    // Pass undefined → each slice returns its own initialState
    return appReducer(undefined, action);
  }

  return appReducer(state, action);
};

const store = configureStore({
  reducer: rootReducer,  // ← pass the wrapper function
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // ← This disables the check for non-serializable values
    }),
  // middleware: ...,    // add if needed later
  // devTools: process.env.NODE_ENV !== 'production',
});

window.store = store;

store.subscribe(() => {
  console.log('mmmmm Current Redux store state:', store.getState());
});

export default store;