
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDRap7IcMdFq2zcaP5mca4cc-O00-3XUkk",
  authDomain: "lightcrew2025.firebaseapp.com",
  databaseURL: "https://lightcrew2025-default-rtdb.firebaseio.com",
  projectId: "lightcrew2025",
  storageBucket: "lightcrew2025.appspot.com",
  messagingSenderId: "1091637736987",
  appId: "1:1091637736987:web:ee9930aa84f4ec4cbbeabe",
  measurementId: "G-1VPQFVGXW2"
};

// Initialize Firebase
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Enable offline persistence
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db)
    .catch((err) => {
      if (err.code == 'failed-precondition') {
        console.warn('Firestore persistence failed: Multiple tabs open?');
      } else if (err.code == 'unimplemented') {
        console.warn('Firestore persistence failed: Browser does not support all of the features required.');
      }
    });
}

export { app, auth, db };
