
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence, CACHE_SIZE_UNLIMITED } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// IMPORTANT: Replace the placeholder values below with your actual Firebase project settings.
// You can find these in your Firebase project console:
// Project settings > General > Your apps > Firebase SDK snippet > Config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

// Initialize Firebase
// This check prevents re-initializing the app on every hot reload.
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const db = getFirestore(app);

// Enable offline persistence
if (typeof window !== 'undefined') {
  try {
    enableIndexedDbPersistence(db, {
      cacheSizeBytes: CACHE_SIZE_UNLIMITED
    }).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('Firestore persistence failed: Multiple tabs open?');
      } else if (err.code === 'unimplemented') {
        console.warn('Firestore persistence not available in this browser.');
      }
    });
  } catch (error) {
    console.error("Error enabling Firestore persistence:", error);
  }
}

const auth = getAuth(app);
const storage = getStorage(app);
const googleAuthProvider = new GoogleAuthProvider();


export { app, auth, db, storage, googleAuthProvider };
