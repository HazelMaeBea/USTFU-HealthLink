// Make sure to run
// npm firebase install
// And to download the Firebase CLI tools via
// npm install -g firebase-tools

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAd9o-IK10EQF28NR7mCjP97ELtz1JTMmI",
  authDomain: "ustfuhealthlink-dev.firebaseapp.com",
  projectId: "ustfuhealthlink-dev",
  storageBucket: "ustfuhealthlink-dev.firebasestorage.app",
  messagingSenderId: "183961992087",
  appId: "1:183961992087:web:4d5cf09aad3a4469fc22d2",
  measurementId: "G-LTZF222N3S"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Not really needed atm
// const analytics = getAnalytics(app);