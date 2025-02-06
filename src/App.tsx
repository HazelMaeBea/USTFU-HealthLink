import React, { useState } from "react";
import {
	BrowserRouter as Router,
	Routes,
	Route,
	Navigate,
} from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import Layout from "./components/Layout/Layout";
import LoginPage from "./components/Pages/LoginPage";
import HospitalizationApplication from "./components/Pages/HospitalizationApplication";
import HospitalizationTracking from "./components/Pages/HospitalizationTracking";
import FAQs from "./components/Pages/Faqs";
import Settings from "./components/Pages/Settings";
import Logout from "./components/Pages/Logout";
import Popout from "./components/Page Elements/Popout/Popout";

import { auth } from "./config/firebase";
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./config/firebase";

const provider = new GoogleAuthProvider();
provider.setCustomParameters({
	hd: "ust.edu.ph",
});

const App: React.FC = () => {
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [isPopoutOpen, setIsPopoutOpen] = useState(false);

	const handleLogin = async () => {
		try {
			const result = await signInWithPopup(auth, provider);
			const user = result.user;
			// Check if user email ends with ust.edu.ph
			if (
				user.email &&
				user.email.toLowerCase().endsWith("@ust.edu.ph")
			) {
				const userDocRef = doc(db, "users", user.uid);
				const userDocSnap = await getDoc(userDocRef);

				if (!userDocSnap.exists()) {
					// Create new user document with verified set to false if it doesn't exist (registration)
					await setDoc(userDocRef, {
						email: user.email,
						displayName: user.displayName,
						verified: false,
						createdAt: new Date(),
					});
					alert(
						"Your account has been created and is pending admin approval."
					);
				} else {
					const userData = userDocSnap.data();
					// If the user exists but is not verified, don't allow access to the home page.
					if (userData?.verified) {
						setIsAuthenticated(true);
					} else {
						alert("Your account is not yet approved by the admin.");
					}
				}
			} else {
				alert("Please sign in using your ust.edu.ph email.");
			}
		} catch (error) {
			console.error("Login error:", error);
		}
	};

	const handleLogout = async () => {
		try {
			await signOut(auth);
			setIsAuthenticated(false);
			setIsPopoutOpen(true);
		} catch (error) {
			console.error("Logout error:", error);
		}
	};

	const handleConfirmLogout = () => {
		setIsPopoutOpen(false);
		handleLogout();
	};

	const handleCancelLogout = () => {
		setIsPopoutOpen(false);
	};

	return (
		<Router>
			{" "}
			{/* BrowserRouter is wrapping everything */}
			<div className="App">
				{isAuthenticated ? (
					<Layout>
						<Routes>
							<Route
								path="/home/*"
								element={<HospitalizationApplication />}
							/>
							<Route
								path="/tracking"
								element={<HospitalizationTracking />}
							/>
							<Route path="/faqs" element={<FAQs />} />
							<Route path="/settings" element={<Settings />} />
							<Route
								path="/logout"
								element={<Logout onLogout={handleLogout} />}
							/>
							<Route
								path="*"
								element={<Navigate to="/home" replace />}
							/>
						</Routes>
					</Layout>
				) : (
					<Routes>
						<Route
							path="/login"
							element={<LoginPage onLogin={handleLogin} />}
						/>
						<Route
							path="*"
							element={<Navigate to="/login" replace />}
						/>
					</Routes>
				)}
				<Popout
					title="Confirm Logout"
					message="Are you sure you want to logout?"
					onConfirm={handleConfirmLogout}
					onCancel={handleCancelLogout}
					isOpen={isPopoutOpen}
				/>
			</div>
		</Router>
	);
};

export default App;
