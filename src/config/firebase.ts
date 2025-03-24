import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, getDoc, doc, updateDoc, onSnapshot, increment } from "firebase/firestore";
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

interface GlobalVariables {
  FormID: number;
  // Add other fields if needed
}

const globalDoc = doc(db, 'globals', 'globalVariables');

export const getFormID = async (
  incrementValue: boolean,
  incrementAmount: number = 1 // Default increment value
): Promise<number | null> => {
  try {
    const docSnap = await getDoc(globalDoc); // Ensure globalDoc is properly initialized

    if (docSnap.exists()) {
      const data = docSnap.data() as GlobalVariables;
      let formID = data.FormID;

      if (incrementValue) {
        if (formID >= 999999) {
          await updateDoc(globalDoc, { FormID: 1 }); // Reset to 1
          return 1;
        } else {
          // Use the atomic `increment` function with the specified increment amount
          await updateDoc(globalDoc, { FormID: increment(incrementAmount) });
          formID += incrementAmount; // Locally reflect the increment for the return
        }
      }

      return formID;
    } else {
      console.error("No such document!");
      return null;
    }
  } catch (error) {
    console.error("Error reading or updating document:", error);
    return null;
  }
};

export const isRegistered = async (uid: string): Promise<boolean> => {  
  try {  
    const userRef = doc(db, "users", uid);  
    const userSnap = await getDoc(userRef);  

    if (!userSnap.exists()) return false;

    const userData = userSnap.data();  
    return !!userData?.personalInfo; 
  } catch (error) {  
    console.error("Error checking user registration:", error);  
    return false; 
  }  
};

export const getUserStatus = async (uid: string): Promise<"unregistered" | "pending" | "verified"> => {
  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return "unregistered"; // User not found

    const userData = userSnap.data();
    return userData?.verified ? "verified" : "pending"; // If 'verified' is true → "verified", otherwise "pending"
  } catch (error) {
    console.error("Error fetching user status:", error);
    return "unregistered"; // Fail-safe to prevent blocking login flow
  }
};