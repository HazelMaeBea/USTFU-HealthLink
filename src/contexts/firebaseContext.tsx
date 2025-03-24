/**
 * Firebase Authentication Context
 *
 * This file provides a React Context for managing Firebase authentication state throughout the application.
 * It handles:
 * - User authentication state (login/logout)
 * - User custom claims (role, verification status, account status)
 * - User profile information (display name, photo URL, email)
 * - Loading states for asynchronous operations
 *
 * The context acts as a central hub for all Firebase auth-related functionality,
 * making authentication state and user data available globally to any component.
 */
import React, {
	createContext,
	useContext,
	useState,
	useEffect,
	ReactNode,
} from "react";
import {
	auth,
	app,
	db,
	storage,
	storageRef,
	callFunction,
	getFormID,
} from "../config/firebase";
import { User, onAuthStateChanged, getIdTokenResult } from "firebase/auth";
import { login, logout } from "../services/auth";
import { doc, getDoc } from "firebase/firestore";

interface CustomClaims {
	role?: string;
	verified?: boolean;
	status?: string;
}

interface FirebaseContextType {
	app: typeof app;
	auth: typeof auth;
	db: typeof db;
	storage: typeof storage;
	storageRef: typeof storageRef;
	callFunction: typeof callFunction;
	currentUser: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	userClaims: CustomClaims;
	login: () => Promise<User | null>;
	logout: () => Promise<void>;
	isVerified: boolean;
	userStatus: string | null;
	displayName: string | null;
	photoURL: string | null;
	email: string | null;
	uid: string | null;
	fullName: string | null;
	getFormID: (increment: boolean) => Promise<number | null>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(
	undefined
);

interface FirebaseProviderProps {
	children: ReactNode;
}

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
	children,
}) => {
	const [currentUser, setCurrentUser] = useState<User | null>(null);
	const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [userClaims, setUserClaims] = useState<CustomClaims>({});
	const [displayName, setDisplayName] = useState<string | null>(null);
	const [photoURL, setPhotoURL] = useState<string | null>(null);
	const [email, setEmail] = useState<string | null>(null);
	const [uid, setUid] = useState<string | null>(null);
	const [fullName, setFullName] = useState<string | null>(null);

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async (user) => {
			if (user) {
				// Update immediate user info
				setDisplayName(user.displayName);
				setPhotoURL(user.photoURL);
				setEmail(user.email);
				setUid(user.uid);
				setCurrentUser(user);
				setIsAuthenticated(true);
				try {
					const userDocRef = doc(db, "users", user.uid);
					const userDoc = await getDoc(userDocRef);
					if (userDoc.exists()) {
						setFullName(userDoc.data().fullName);
					} else {
						setFullName(null);
					}
				} catch (error) {
					console.error("Error fetching full name:", error);
					setFullName(null);
				}

				// Fetch claims & update isLoading
				setIsLoading(true);
				try {
					const idTokenResult = await getIdTokenResult(user, true);
					setUserClaims(idTokenResult.claims as CustomClaims);
				} catch (error) {
					console.error("Error fetching token claims:", error);
				} finally {
					setIsLoading(false);
				}
			} else {
				// Reset states
				setCurrentUser(null);
				setIsAuthenticated(false);
				setUserClaims({});
				setDisplayName(null);
				setPhotoURL(null);
				setEmail(null);
				setUid(null);
				setIsLoading(false);
			}
		});

		return () => unsubscribe();
	}, []);

	// Derived state for easy access to common user status information.
	const isVerified = Boolean(userClaims.verified);
	const userStatus = userClaims.status || null;

	const value: FirebaseContextType = {
		app,
		auth,
		db,
		storage,
		storageRef,
		callFunction,
		currentUser,
		isAuthenticated,
		isLoading,
		userClaims,
		login,
		logout,
		isVerified,
		userStatus,
		displayName,
		photoURL,
		email,
		uid,
		fullName,
		getFormID,
	};

	return (
		<FirebaseContext.Provider value={value}>
			{children}
		</FirebaseContext.Provider>
	);
};

export function useFirebase(): FirebaseContextType {
	const context = useContext(FirebaseContext);
	if (context === undefined) {
		throw new Error("useFirebase must be used within a FirebaseProvider");
	}
	return context;
}
