// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDeErqkvvBfy_u13_a3CLeaMSFcEa9eAq8",
  authDomain: "safe-trip-share.firebaseapp.com",
  projectId: "safe-trip-share",
  storageBucket: "safe-trip-share.appspot.com",
  messagingSenderId: "753357786741",
  appId: "1:753357786741:web:11438217c9b75d22f1b23c",
  measurementId: "G-NHN6K78HK8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
