
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence, Firestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCASdJ84EqDjwCTquRLwdy-0qNJmS9F95g",
  authDomain: "ludo-legacy-61efi.firebaseapp.com",
  projectId: "ludo-legacy-61efi",
  storageBucket: "ludo-legacy-61efi.appspot.com",
  messagingSenderId: "374019795554",
  appId: "1:374019795554:web:ee0c47693a42d20410bf3b"
};


let app: FirebaseApp;
let db: Firestore;
let persistenceEnabled = false;

// Singleton pattern to ensure Firebase is initialized only once.
function getFirebaseApp() {
  if (!app) {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  }
  return app;
}

function getDb() {
  if (!db) {
    db = getFirestore(getFirebaseApp());
    // Enable offline persistence only once
    if (typeof window !== 'undefined' && !persistenceEnabled) {
      try {
        enableIndexedDbPersistence(db)
          .then(() => {
            persistenceEnabled = true;
            console.log("Firestore persistence enabled.");
          })
          .catch((err) => {
            if (err.code == 'failed-precondition') {
              console.warn("Firestore persistence failed: multiple tabs open?");
            } else if (err.code == 'unimplemented') {
              console.warn("Firestore persistence not available in this browser.");
            }
          });
      } catch (error) {
        console.error("Error enabling Firestore persistence:", error);
      }
    }
  }
  return db;
}


// Initialize and export Firebase services
const auth = getAuth(getFirebaseApp());
const storage = getStorage(getFirebaseApp());
const googleAuthProvider = new GoogleAuthProvider();
const firestoreDb = getDb();


export { app, auth, firestoreDb as db, storage, googleAuthProvider };
