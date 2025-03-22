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
import { Navigate, Outlet } from "react-router-dom";
import { useFirebase } from "../contexts/firebaseContext";

const ProtectedRoute: React.FC = () => {
	const { isLoading, isAuthenticated, isVerified, userStatus } =
		useFirebase();
	const [gracePeriod, setGracePeriod] = useState(true);

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

	if (!isAuthenticated) {
		return <Navigate to="/login" replace />;
	}

	if (!isVerified) {
		return <Navigate to="/login" replace />;
	}

	if (!userStatus || userStatus.toLowerCase() !== "active") {
		return <Navigate to="/login" replace />;
	}

	return <Outlet />;
};

export default ProtectedRoute;
