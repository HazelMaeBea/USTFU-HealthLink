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
import { auth } from "./config/firebase";
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./config/firebase";

const provider = new GoogleAuthProvider();
provider.setCustomParameters({
	hd: "ust.edu.ph",
});
import Popout from "./components/Page Elements/Popout/Popout";

const App: React.FC = () => {
	const [isAuthenticated, setIsAuthenticated] = useState(false);

	const handleLogin = () => {
		setIsAuthenticated(true); // Simulate login process
	};

	const handleLogout = () => {
		setIsAuthenticated(false);
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
			</div>
		</Router>
	);
};

export default App;
