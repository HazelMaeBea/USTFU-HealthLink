import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage, ref } from "firebase/storage";
import { getFunctions, httpsCallable } from "firebase/functions";

const firebaseConfig = {
    apiKey: "AIzaSyAd9o-IK10EQF28NR7mCjP97ELtz1JTMmI",
    authDomain: "ustfuhealthlink-dev.firebaseapp.com",
    projectId: "ustfuhealthlink-dev",
    storageBucket: "ustfuhealthlink-dev.firebasestorage.app",
    messagingSenderId: "183961992087",
    appId: "1:183961992087:web:4d5cf09aad3a4469fc22d2",
    measurementId: "G-LTZF222N3S",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage();
export const storageRef = ref(storage);
// Specify the region when initializing Functions
export const functions = getFunctions(app, 'asia-southeast1'); // Change to your exact region

// Helper function for calling Cloud Functions
export const callFunction = <T>(name: string, data?: any) => {
  const functionRef = httpsCallable<any, T>(functions, name);
  return functionRef(data);
};