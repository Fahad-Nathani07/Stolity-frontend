import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Prod
const firebaseConfig = {
  apiKey: "AIzaSyDgZrU2Qr2BKfrxnkpCfm5cXmeR1Br4v4U",
  authDomain: "stolity-prod.firebaseapp.com",
  projectId: "stolity-prod",
  storageBucket: "stolity-prod.firebasestorage.app",
  messagingSenderId: "795594784207",
  appId: "1:795594784207:web:5cd08975f731e1438026ba",
  measurementId: "G-46B3Y5HN5R"
};


// UAT 
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
