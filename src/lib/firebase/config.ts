
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB6ljcT7IYVOmOcIa7P84iehwUAZdNZ0vA",
  authDomain: "civil-hope-436309-f1.firebaseapp.com",
  projectId: "civil-hope-436309-f1",
  storageBucket: "civil-hope-436309-f1.appspot.com",
  messagingSenderId: "816027166594",
  appId: "1:816027166594:web:d77e3bd65ba1525022119b",
  measurementId: "G-ZD69K4QLHJ"
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);
const googleAuthProvider = new GoogleAuthProvider();


export { app, auth, db, storage, googleAuthProvider };
