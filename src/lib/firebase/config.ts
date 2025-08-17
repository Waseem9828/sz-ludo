
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCASdJ84EqDjwCTquRLwdy-0qNJmS9F95g",
  authDomain: "ludo-legacy-61efi.firebaseapp.com",
  projectId: "ludo-legacy-61efi",
  storageBucket: "ludo-legacy-61efi.appspot.com",
  messagingSenderId: "374019795554",
  appId: "1:374019795554:web:ee0c47693a42d20410bf3b"
};


// Initialize Firebase
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);

export { app, auth, db, storage };
