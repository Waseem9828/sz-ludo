
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, initializeFirestore, persistentLocalCache, memoryLocalCache, Firestore } from "firebase/firestore";
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

// Singleton pattern to ensure Firebase is initialized only once.
function getFirebaseApp() {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  return app;
}

function getDb() {
  if (!db) {
     const app = getFirebaseApp();
     // Use persistent cache for web to enable offline data access and faster loads.
     // Memory cache is a fallback for environments where persistent cache is not supported.
     try {
        db = initializeFirestore(app, {
            localCache: persistentLocalCache({}),
        });
     } catch (e) {
        console.warn("Persistent cache not available, falling back to memory cache.", e);
        db = initializeFirestore(app, {
            localCache: memoryLocalCache({}),
        });
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
