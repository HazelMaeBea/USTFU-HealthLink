import { auth } from "../config/firebase";
import {
  setPersistence,
  browserLocalPersistence,
  signInWithPopup,
  GoogleAuthProvider,
  signOut
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../config/firebase";

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ hd: "ust.edu.ph" });

export const login = async () => {
  try {
    // Set persistence to session so the user is logged out when the browser is closed.
    await setPersistence(auth, browserLocalPersistence);

    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    if (user.email && user.email.toLowerCase().endsWith("@ust.edu.ph")) {
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        await setDoc(userDocRef, {
          email: user.email,
          fullName: user.displayName,
          verified: false,
          createdAt: new Date(),
        });
        alert("Your account has been created and is pending admin approval.");
        await signOut(auth);
        return null;
      } else {
        const userData = userDocSnap.data();
        if (!userData.verified) {
          alert("Your account is not yet approved by the admin.");
          await signOut(auth);
          return null;
        }
      }
      return user;
    } else {
      alert("Please sign in using your ust.edu.ph email.");
      return null;
    }
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
    return true;
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
};