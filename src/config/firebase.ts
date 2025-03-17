import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, getDoc, doc, updateDoc } from "firebase/firestore";
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

export const getFormID = async (increment: boolean): Promise<number | null> => {
  try {
    const docSnap = await getDoc(globalDoc);
    if (docSnap.exists()) {
      const data = docSnap.data() as GlobalVariables;
      let formID = data.FormID;

      if (increment) {
        if (formID >= 999999) {
          await updateDoc(globalDoc, {
            FormID: 1,
          });
          return 1;
        } else {
          formID += 1;
          await updateDoc(globalDoc, {
            FormID: formID,
          });
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
    const userRef = doc(db, "users", uid); // Reference to Firestore "users" collection
    const userSnap = await getDoc(userRef);

    return userSnap.exists(); // Returns true if the user document exists
  } catch (error) {
    console.error("Error checking user registration:", error);
    return false; // Assume unregistered in case of an error
  }
};