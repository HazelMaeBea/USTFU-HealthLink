// import React from "react";
// import { Navigate, Outlet } from "react-router-dom";
// import { useFirebase } from "../contexts/firebaseContext";

// /**
//  * ProtectedRoute Component
//  *
//  * Renders the child routes if:
//  * - The user's authentication state is loaded (not isLoading)
//  * - The user is authenticated
//  * - The user is verified and active (userStatus === "ACTIVE")
//  * Otherwise, redirects to an appropriate route.
//  */
// const ProtectedRoute: React.FC = () => {
//     const { isAuthenticated, isLoading, isVerified, userStatus } = useFirebase();

//     // Wait for Firebase auth state to load
// if (isLoading) return <div>Loading...</div>;
//   if (!isAuthenticated) return <Navigate to="/login" replace />;
//   if (!isVerified) return <Navigate to="/login" replace />;
//   if (!userStatus || userStatus.toLowerCase() !== "active") return <Navigate to="/login" replace />;

//   return <Outlet />;
// };

// export default ProtectedRoute;

import React, { useEffect, useState } from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { useFirebase } from "../contexts/firebaseContext";

const ProtectedRoute: React.FC = () => {
	const { isLoading, isAuthenticated, isVerified, userStatus, userClaims } =
		useFirebase();
	const [gracePeriod, setGracePeriod] = useState(true);
	const navigate = useNavigate();

	// ✅ Handle initial redirection only once after login
	useEffect(() => {
		if (
			!isLoading &&
			isAuthenticated &&
			isVerified &&
			userStatus?.toLowerCase() === "active"
		) {
			// Check if already redirected
			const alreadyRedirected = localStorage.getItem("redirected");

			if (!alreadyRedirected) {
				if (userClaims?.role === "operations handler") {
					navigate("/pendingrequests", { replace: true });
				} else if (userClaims?.role === "member") {
					navigate("/home", { replace: true });
				}
				// ✅ Store the flag to prevent repeated redirection
				localStorage.setItem("redirected", "true");
			}
		}
	}, [
		isLoading,
		isAuthenticated,
		isVerified,
		userStatus,
		userClaims,
		navigate,
	]);

	// ✅ Clear the redirection flag on logout
	useEffect(() => {
		// Clear the flag when the user logs out
		if (!isAuthenticated) {
			localStorage.removeItem("redirected");
		}
	}, [isAuthenticated]);

	useEffect(() => {
		if (!isLoading) {
			setTimeout(() => setGracePeriod(false), 500); // 2s delay to allow Firebase state updates
		}
	}, [isLoading]);

	console.log("ProtectedRoute Debug:", {
		isLoading,
		isAuthenticated,
		isVerified,
		userStatus,
	});

	if (isLoading || gracePeriod) {
		return (
			<div
				style={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					height: "100vh",
				}}
			>
				<div className="spinner" />
			</div>
		);
	}

	if (
		!isAuthenticated ||
		!isVerified ||
		!userStatus ||
		userStatus.toLowerCase() !== "active"
	) {
		return <Navigate to="/login" replace />;
	}

	return <Outlet />;
};

export default ProtectedRoute;
