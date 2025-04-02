/**
 * Firebase Authentication Context (v2)
 *
 * This file provides a robust React Context for managing Firebase authentication state using a reducer.
 * It handles:
 * - User authentication state (login/logout)
 * - Fetching and storing custom claims (role, verification status, account status)
 * - User profile information (display name, photo URL, email, uid)
 * - Loading and error states during authentication and claims fetching
 *
 * The context consolidates all Firebase authentication logic and state,
 * making it globally accessible to any component in the application.
 */
import React, {
	createContext,
	useContext,
	useEffect,
	ReactNode,
	useReducer,
	useMemo,
} from "react";
import { User, onAuthStateChanged, getIdTokenResult } from "firebase/auth";
import { app, auth, db, storage, storageRef } from "./firebase";
import { login, logout } from "../services/auth";

/**
 * CustomClaims Interface
 * Defines additional user attributes stored in Firebase Auth tokens.
 * These claims help determine user permissions and account status.
 */
interface CustomClaims {
	role?: string; // User role (e.g., 'ADMIN', 'USER', etc.)
	verified?: boolean; // Whether the user's account is verified
	status?: string; // Account status (e.g., 'ACTIVE', 'INACTIVE', 'ON_LEAVE', etc.)
}

/**
 * FirebaseState Interface
 * Represents the state managed by the Firebase reducer.
 * Contains user authentication info, profile data, custom claims, loading and error states.
 */
interface FirebaseState {
	currentUser: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	userClaims: CustomClaims;
	displayName: string | null;
	photoURL: string | null;
	email: string | null;
	uid: string | null;
	error: Error | null;
}

/**
 * Initial state for the Firebase reducer.
 */
const initialState: FirebaseState = {
	currentUser: null,
	isAuthenticated: false,
	isLoading: true,
	userClaims: {},
	displayName: null,
	photoURL: null,
	email: null,
	uid: null,
	error: null,
};

/**
 * Action types for the Firebase reducer.
 */
type Action =
	| { type: "SET_USER"; payload: { user: User } }
	| { type: "RESET_USER" }
	| { type: "SET_LOADING"; payload: boolean }
	| { type: "SET_ERROR"; payload: Error }
	| {
			type: "SET_CLAIMS";
			payload: CustomClaims & {
				displayName: string | null;
				photoURL: string | null;
				email: string | null;
				uid: string | null;
			};
	  };

/**
 * Firebase Reducer
 * Handles state transitions based on authentication actions.
 */
function firebaseReducer(state: FirebaseState, action: Action): FirebaseState {
	switch (action.type) {
		case "SET_USER":
			return {
				...state,
				currentUser: action.payload.user,
				isAuthenticated: true,
			};
		case "RESET_USER":
			return { ...initialState, isLoading: false };
		case "SET_LOADING":
			return { ...state, isLoading: action.payload };
		case "SET_ERROR":
			return { ...state, error: action.payload, isLoading: false };
		case "SET_CLAIMS":
			return {
				...state,
				userClaims: {
					role: action.payload.role,
					verified: action.payload.verified,
					status: action.payload.status,
				},
				displayName: action.payload.displayName,
				photoURL: action.payload.photoURL,
				email: action.payload.email,
				uid: action.payload.uid,
			};
		default:
			return state;
	}
}

/**
 * FirebaseContextType Interface
 * Extends the FirebaseState with Firebase services and authentication methods.
 */
interface FirebaseContextType extends FirebaseState {
	app: typeof app;
	auth: typeof auth;
	db: typeof db;
	storage: typeof storage;
	storageRef: typeof storageRef;
	login: () => Promise<User | null>;
	logout: () => Promise<void>;
	isVerified: boolean;
	userStatus: string | null;
}

// Create the context with an undefined default value.
const FirebaseContext = createContext<FirebaseContextType | undefined>(
	undefined
);

// Provider component props interface.
interface FirebaseProviderProps {
	children: ReactNode;
}

/**
 * FirebaseProvider Component
 *
 * Provides the Firebase authentication context to child components.
 * Uses a reducer to manage authentication state and custom claims.
 */
export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
	children,
}) => {
	const [state, dispatch] = useReducer(firebaseReducer, initialState);

	useEffect(() => {
		/**
		 * fetchClaims
		 *
		 * Fetches the latest custom claims for the given user and updates the state.
		 * Forces a token refresh to ensure the most up-to-date claims are retrieved.
		 */
		const fetchClaims = async (user: User) => {
			try {
				const idTokenResult = await getIdTokenResult(user, true);
				dispatch({
					type: "SET_CLAIMS",
					payload: {
						role: (idTokenResult.claims as CustomClaims).role,
						verified: (idTokenResult.claims as CustomClaims)
							.verified,
						status: (idTokenResult.claims as CustomClaims).status,
						displayName: user.displayName,
						photoURL: user.photoURL,
						email: user.email,
						uid: user.uid,
					},
				});
			} catch (error: any) {
				console.error("Error fetching user claims:", error);
				dispatch({ type: "SET_ERROR", payload: error });
			}
		};

		/**
		 * Auth state observer using onAuthStateChanged.
		 * Listens for changes in the user's authentication state.
		 * When a user is authenticated, fetches the custom claims.
		 */
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			if (user) {
				dispatch({ type: "SET_USER", payload: { user } });
				fetchClaims(user);
			} else {
				dispatch({ type: "RESET_USER" });
			}
			dispatch({ type: "SET_LOADING", payload: false });
		});

		// Clean up the subscription on unmount.
		return () => unsubscribe();
	}, []);

	// NOTE: The local logout implementation has been removed.
	// Now the imported logout function is used in the context value.

	// Derived state values for easy access.
	const isVerified = Boolean(state.userClaims.verified);
	const userStatus = state.userClaims.status || null;

	/**
	 * Memoize context value to prevent unnecessary re-renders.
	 * The contextValue includes Firebase services, auth methods, and state values.
	 */
	const contextValue = useMemo(
		() => ({
			app,
			auth,
			db,
			storage,
			storageRef,
			login,
			logout, // Using the imported logout function
			isVerified,
			userStatus,
			...state,
		}),
		[state, isVerified, userStatus]
	);

	return (
		<FirebaseContext.Provider value={contextValue}>
			{children}
		</FirebaseContext.Provider>
	);
};

/**
 * useFirebase Hook
 *
 * Custom hook that provides access to the Firebase authentication context.
 * Throws an error if used outside of a FirebaseProvider.
 */
export const useFirebase = (): FirebaseContextType => {
	const context = useContext(FirebaseContext);
	if (!context) {
		throw new Error("useFirebase must be used within a FirebaseProvider");
	}
	return context;
};
