import React from "react";
import {
	BrowserRouter as Router,
	Routes,
	Route,
	Navigate,
} from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import Layout from "./components/Layout/Layout";
import LoginPage from "./components/Pages/LoginPage/LoginPage";
import RegistrationPage from "./components/Pages/RegistrationPage/RegistrationPage";
import HospitalizationApplication from "./components/Pages/HospitalizationApplication";
import HospitalizationTracking from "./components/Pages/HospitalizationTracking";
import HospitalizationHistory from "./components/Pages/HospitalizationHistory";
import FAQs from "./components/Pages/Faqs";
import Settings from "./components/Pages/SettingsPage/Settings";
import AdminSettings from "./components/Pages/AdminSettings";
import PendingRequests from "./components/Pages/PendingRequestPage/PendingRequests";
import ErrorBoundary from "./components/ErrorBoundary";
import { UserProvider } from "./contexts/userContext";
import { FirebaseProvider } from "./contexts/firebaseContext";
import ProtectedRoute from "./components/protectedRoutes";
//TEMP
import FormGenerator from "./components/Pages/FormGenerator";

const App: React.FC = () => {
	return (
		<FirebaseProvider>
			<UserProvider>
				<Router>
					<div className="App">
						<Routes>
							{/* Public routes */}
							<Route path="/login" element={<LoginPage />} />
							<Route
								path="/register"
								element={<RegistrationPage />}
							/>

							{/* Protected routes */}
							<Route element={<ProtectedRoute />}>
								<Route element={<Layout />}>
									<Route
										path="/home/*"
										element={<HospitalizationApplication />}
									/>
									<Route
										path="/tracking"
										element={<HospitalizationTracking />}
									/>
									<Route
										path="/history"
										element={<HospitalizationHistory />}
									/>
									<Route
										path="/pendingrequests"
										element={
											<ErrorBoundary>
												<PendingRequests />
											</ErrorBoundary>
										}
									/>
									<Route
										path="/generate"
										element={<FormGenerator />}
									/>

									<Route path="/faqs" element={<FAQs />} />
									<Route
										path="/settings"
										element={<Settings />}
									/>
									<Route
										path="/adminsettings"
										element={<AdminSettings />}
									/>
								</Route>
							</Route>

							{/* Default routes */}
							<Route
								path="/"
								element={<Navigate to="/home" replace />}
							/>
							<Route
								path="*"
								element={<Navigate to="/login" replace />}
							/>
						</Routes>
					</div>
				</Router>
			</UserProvider>
		</FirebaseProvider>
	);
};

export default App;
