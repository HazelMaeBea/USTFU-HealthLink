import { auth } from "../config/firebase";
import {
    setPersistence,
    browserLocalPersistence,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
} from "firebase/auth";

// Configure Google authentication provider with UST domain restriction
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ hd: "ust.edu.ph", prompt: "select_account" });

/**
 * Handles user login with Google authentication.
 * The user's authentication state is persisted locally.
 *
 * @returns {Promise<User|null>} The authenticated user or null
 */
export const login = async () => {
    try {
        // Set persistence to local storage
        await setPersistence(auth, browserLocalPersistence);

        // Perform Google sign-in
        const result = await signInWithPopup(auth, provider);
        return result.user;
    } catch (error: any) {
        // Handle specific auth errors
        if (error.code === "auth/popup-closed-by-user") {
            console.log("Sign-in popup closed by user");
            return null;
        }
        console.error("Login error:", error);
        throw error;
    }
};

/**
 * Handles user logout.
 *
 * @returns {Promise<void>} Resolves when logout is complete.
 */
export const logout = async (): Promise<void> => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Logout error:", error);
        throw error;
    }
};