import { createSlice } from "@reduxjs/toolkit";

// Get initial value from localStorage or default to false
const storedGoogleAuth = localStorage.getItem("isGoogleAuth") === "true";

const initialState = {
  userdata: [],
  folderList: [],
  rootFolderList: [], // Separate array for root folders
  sharedFolderList: [], // Separate array for shared folders
  folderCounter: 0,
  counter: 0, 
  folderName: "",
  isSharedValue: false, // New boolean variable
  setParentFolderName: "",
  isGoogleAuth: storedGoogleAuth,
  showAudioPlayer: false,
  currentAudioFile: null,
  audioQueue: [],
  originalAudioQueue: [],
  currentTrackIndex: 0,
  isShuffleEnabled: false,
  repeatMode: "off", // off | once | on
  loading: false, 


};

const fileSlicer = createSlice({
  name: "getdata",
  initialState,
  reducers: {

    setGoogleAuth: (state, action) => {
      state.isGoogleAuth = action.payload;
      localStorage.setItem("isGoogleAuth", action.payload); // sync with localStorage
    },

    addToken: (state, action) => {
      const idx = state.userdata.findIndex(
        (user) => user.id === action.payload.id
      );
      const next = {
        id: action.payload.id,
        Files: action.payload.Files,
        isShared: action.payload.isShared,
      };
      if (idx >= 0) {
        state.userdata[idx] = next;
      } else {
        state.userdata.push(next);
      }
    },
    setIsSharedFalse: (state) => {
      state.folderName = '';
      // console.log("Folder path cleared", state.folderName);
        state.isSharedValue = false;
        // console.log("state.isSharedValue SADvSD",state.isSharedValue)
      },
    setIsSharedValue: (state, action) => {
      state.isSharedValue = action.payload; // Update isSharedValue
      console.log("zxcvb state.isSharedValue :" ,state.isSharedValue)
    },

    setParentFolderName: (state, action) => {
      state.fileName = action.payload; // Update fileName
      // console.log("Updated fileName:", state.fileName); // Log the updated fileName
    },

    addFolder: (state, action) => {
        if (Array.isArray(action.payload)) {
            const folderData = { [state.folderCounter]: action.payload };
    
            // Determine whether to update root or shared folders based on isSharedValue
            if (state.isSharedValue) {
                state.sharedFolderList.push(folderData);
                // console.log("Shared Folder List Updated:", state.sharedFolderList);
            } else {
                state.rootFolderList.push(folderData);
                // console.log("Root Folder List Updated:", state.rootFolderList);
            }
        } else {
            // console.error("Invalid payload in addFolder", action.payload);
        }
    },
    

    addNewFolder: (state, action) => {
      // Set folderCounter to 1
      state.folderCounter = 1;

      // Check if the payload is an array
      if (Array.isArray(action.payload)) {
        // Replace folderList with only the 0th index from the payload
        state.folderList = [action.payload[0]];
      } else {
        // console.error("Payload is not in the expected format");
      }
    },

    setLoader: (state, action) => {
      state.loading = action.payload;
    },

    removeLastFolder: (state) => {
      // Check if folderList is not empty
      if (state.rootFolderList.length > 0) {
        // Remove the last record
        state.rootFolderList.pop();
      } else {
        // console.error("No records to remove");
      }
    },
    removeLastFolder2: (state) => {
      // Check if folderList is not empty
      if (state.sharedFolderList.length > 0) {
        // Remove the last record
        state.sharedFolderList.pop();
        // console.log("state.sharedFolderList",state.sharedFolderList)
      } else {
        // console.error("No records to remove");
      }
    },
    
    incrementCounter: (state) => {
      state.counter += 1;
      // console.log("incrementCounter counter state", state.counter)
    },
    incrementFCounter: (state) => {
      state.folderCounter += 1;
      // console.log("incrementFCounter folderCounter", state.folderCounter)

    },
    removeLastToken: (state) => {
      if (state.userdata.length > 0) {
        state.userdata.pop();
      }
    },
    decrementCounter: (state) => {
      state.counter -= 1;
      // console.log("decrementCounter counter",state.counter)

    },
    decrementFCounter: (state) => {
      state.folderCounter -= 1;
      // console.log("decrementFCounter folderCounter",state.folderCounter)
    },
    resetUserData: (state) => {
      state.userdata = [];
    },
    resetCounter: (state) => {
      state.counter = 0;
      // console.log("Counter reset to", state.counter);
    },
    resetFCounter: (state) => {
      state.folderCounter = 0;
      // console.log("Counter reset to", state.folderCounter);
    },
    resetFolderList: (state) => {
        // Reset folderCounter to 1
        state.folderCounter = 1;
      
        // Keep only the first item in folderList, rootFolderList, and sharedFolderList
        state.folderList = state.folderList.length > 0 ? [state.folderList[0]] : [];
        state.rootFolderList = state.rootFolderList.length > 0 ? [state.rootFolderList[0]] : [];
        state.sharedFolderList = state.sharedFolderList.length > 0 ? [state.sharedFolderList[0]] : [];
      },
      
      setFolderPath: (state, action) => { 
      
        state.folderName = action.payload.folderPath;
        console.log("yyyyy STATE in STORE UPDATED as: state.folderName",state.folderName)
        state.isShared = action.payload.isShared; // Store isShared value
      },
    
    
    
    

    replacelasttoken: (state, action) => {
      if (state.userdata.length > 0) {
        state.userdata.pop();
        state.userdata.push(action.payload);
      }
    },
    breadCrum: (state, action) => {
      const validNumber = Number(action.payload.number);
      // console.log("validNumber", validNumber);

      // console.log("userdata breadCrum", state.userdata);
      if (state.userdata.length > 0) {
        // console.log("another", state.userdata.length, validNumber);
        const ans = state.userdata.length - 1 - validNumber;

        // console.log("beyblade", validNumber, ans);

        if (ans >= 0 && ans <= state.userdata.length) {
          for (var i = 1; i < ans; i++) {
            state.userdata.pop();
            state.counter--;
          }
        }
      } else {
        // console.log("Userdata is empty!");
      }
    },

        playAudio: (state, action) => {
      state.currentAudioFile = action.payload;
      state.showAudioPlayer = true;
    },
    closeAudioPlayer: (state) => {
      state.showAudioPlayer = false;
      state.currentAudioFile = null;
      state.audioQueue = [];
      state.originalAudioQueue = [];
      state.currentTrackIndex = 0;
    },
    playNextTrack: (state) => {
      const total = state.audioQueue.length;
      if (total === 0) return;

      const atLast = state.currentTrackIndex >= total - 1;
      if (atLast && state.repeatMode === "off") return;

      state.currentTrackIndex = (state.currentTrackIndex + 1) % total;
      state.currentAudioFile = state.audioQueue[state.currentTrackIndex];
    },
    playPrevTrack: (state) => {
      const total = state.audioQueue.length;
      if (total === 0) return;

      const atFirst = state.currentTrackIndex <= 0;
      if (atFirst && state.repeatMode === "off") return;

      state.currentTrackIndex = (state.currentTrackIndex - 1 + total) % total;
      state.currentAudioFile = state.audioQueue[state.currentTrackIndex];
    },
    shuffleTrack: (state) => {
      const total = state.audioQueue.length;
      if (total <= 1) return;
      const currentFile = state.currentAudioFile;

      // Toggle OFF: restore original queue order while keeping current song.
      if (state.isShuffleEnabled) {
        const restoredQueue =
          state.originalAudioQueue.length > 0
            ? [...state.originalAudioQueue]
            : [...state.audioQueue];

        state.audioQueue = restoredQueue;
        const restoredIndex = restoredQueue.indexOf(currentFile);
        state.currentTrackIndex = restoredIndex >= 0 ? restoredIndex : 0;
        state.currentAudioFile = restoredQueue[state.currentTrackIndex] || currentFile;
        state.isShuffleEnabled = false;
        return;
      }

      // Toggle ON: shuffle queue order but keep current song playing.
      const sourceQueue = [...state.audioQueue];
      state.originalAudioQueue = [...sourceQueue];

      for (let i = sourceQueue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [sourceQueue[i], sourceQueue[j]] = [sourceQueue[j], sourceQueue[i]];
      }

      state.audioQueue = sourceQueue;
      const shuffledIndex = sourceQueue.indexOf(currentFile);
      state.currentTrackIndex = shuffledIndex >= 0 ? shuffledIndex : 0;
      state.currentAudioFile = sourceQueue[state.currentTrackIndex] || currentFile;
      state.isShuffleEnabled = true;
    },
    cycleRepeatMode: (state) => {
      if (state.repeatMode === "off") {
        state.repeatMode = "once";
      } else if (state.repeatMode === "once") {
        state.repeatMode = "on";
      } else {
        state.repeatMode = "off";
      }
    },
    setRepeatMode: (state, action) => {
      const allowed = ["off", "once", "on"];
      if (allowed.includes(action.payload)) {
        state.repeatMode = action.payload;
      }
    },
    setAudioQueue: (state, action) => {
      const baseQueue = action.payload.queue || [];
      const startIndex = action.payload.index || 0;
      const startFile = baseQueue[startIndex];

      state.originalAudioQueue = [...baseQueue];

      if (state.isShuffleEnabled && baseQueue.length > 1) {
        const shuffledQueue = [...baseQueue];
        for (let i = shuffledQueue.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffledQueue[i], shuffledQueue[j]] = [shuffledQueue[j], shuffledQueue[i]];
        }

        state.audioQueue = shuffledQueue;
        const shuffledIndex = shuffledQueue.indexOf(startFile);
        state.currentTrackIndex = shuffledIndex >= 0 ? shuffledIndex : 0;
        state.currentAudioFile = shuffledQueue[state.currentTrackIndex] || null;
      } else {
        state.audioQueue = baseQueue;
        state.currentTrackIndex = startIndex;
        state.currentAudioFile = startFile || null;
      }

      state.showAudioPlayer = true;
    },


  },
});

export const {
  setGoogleAuth,
  addToken,
  setIsSharedValue,
  setParentFolderName,
  addFolder,
  addNewFolder,
  resetFCounter,
  incrementCounter,
  removeLastToken,
  decrementCounter,
  resetUserData,
  resetCounter,
  setFolderPath,
  incrementFCounter,
  setIsSharedFalse,
  removeLastFolder,
  decrementFCounter,
  replacelasttoken,
  breadCrum,
  resetFolderList,
  removeLastFolder2,
  playAudio,
  closeAudioPlayer,
  playNextTrack,
  playPrevTrack,
  shuffleTrack,
  cycleRepeatMode,
  setRepeatMode,
  setAudioQueue,
  setLoader, 


} = fileSlicer.actions;
export default fileSlicer.reducer;
