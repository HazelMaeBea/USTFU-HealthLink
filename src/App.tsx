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

const App: React.FC = () => {
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [isPopoutOpen, setIsPopoutOpen] = useState(false);

	const handleLogin = () => {
		setIsAuthenticated(true); // Simulate login process
	};

	const handleLogout = () => {
		setIsAuthenticated(false);
	};

	const confirmLogout = () => {
		setIsPopoutOpen(true);
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
								element={<Logout onLogout={confirmLogout} />}
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
