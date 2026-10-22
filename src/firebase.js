import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported, logEvent } from "firebase/analytics";

// OLD Prod [Before 15th October 2026]
// const firebaseConfig = {
//   apiKey: "AIzaSyDb7QLDTYQ3fj9wnl90uf5wpxRgWe4pNUM",
//   authDomain: "stolity-prod.firebaseapp.com",
//   projectId: "stolity-prod",
//   storageBucket: "stolity-prod.firebasestorage.app",
//   messagingSenderId: "795594784207",
//   appId: "1:795594784207:web:9346219318908f178026ba",
//   measurementId: "G-SWYERDX8RB",
// };

// NEW Prod [After 15th October 2026] — Dont use this... always keep commented... for now
// const firebaseConfig = {
//   apiKey: "AIzaSyA8tgXfK4zD6XnXvPR69wr8y3UgoeIOHqE",
//   authDomain: "stolity-production-2026.firebaseapp.com",
//   projectId: "stolity-production-2026",
//   storageBucket: "stolity-production-2026.firebasestorage.app",
//   messagingSenderId: "871312686248",
//   appId: "1:871312686248:web:053c0b7553aa45d3fa169d",
// };

// # ************************* Production Bucket Keys [15th October 2026] *******************************
// NEW Prod [After 15th October 2026] — Analytics on (no measurementId)
const firebaseConfig = {
  apiKey: "AIzaSyDxO6oK1rrthzW9KLote8A3Bo-gIjYMCNc",
  authDomain: "stolity-prod-new.firebaseapp.com",
  projectId: "stolity-prod-new",
  storageBucket: "stolity-prod-new.firebasestorage.app",
  messagingSenderId: "453345243416",
  appId: "1:453345243416:web:aafa8d70f9d372d80eee6d",
  measurementId: "G-XP6F7DW65Y"
};


// # ************************* UAT Bucket Keys [15th October 2026] *******************************
// UAT [After 15th October 2026]
// const firebaseConfig = {
//   apiKey: "AIzaSyD_Y0SBJdHUt5-biumKxmlJMdmh-0mWx6E",
//   authDomain: "nodeserver-filestorage.firebaseapp.com",
//   projectId: "nodeserver-filestorage",
//   storageBucket: "nodeserver-filestorage.firebasestorage.app",
//   messagingSenderId: "487279488890",
//   appId: "1:487279488890:web:88089c19d540f155f730c3",
//   measurementId: "G-W7PTS8B4MY"
// };



const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

/** Firebase Analytics instance (null until supported / ready). */
export let analytics = null;

const analyticsReady =
  typeof window !== "undefined"
    ? isSupported()
        .then((supported) => {
          if (supported) {
            analytics = getAnalytics(app);
          }
          return analytics;
        })
        .catch(() => null)
    : Promise.resolve(null);

/**
 * Safe wrapper — waits until analytics is ready, then logs.
 * No-ops if Analytics is unsupported / blocked.
 */
export function logAnalyticsEvent(eventName, eventParams) {
  analyticsReady.then((instance) => {
    if (instance) {
      logEvent(instance, eventName, eventParams);
    }
  });
}

export default app;
