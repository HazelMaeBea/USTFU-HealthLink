import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAd9o-IK10EQF28NR7mCjP97ELtz1JTMmI",
  authDomain: "ustfuhealthlink-dev.firebaseapp.com",
  projectId: "ustfuhealthlink-dev",
  storageBucket: "ustfuhealthlink-dev.firebasestorage.app",
  messagingSenderId: "183961992087",
  appId: "1:183961992087:web:4d5cf09aad3a4469fc22d2",
  measurementId: "G-LTZF222N3S"
};

const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

export const db = getFirestore(app);