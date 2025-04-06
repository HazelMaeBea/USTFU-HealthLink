import React from "react";
import {
	BrowserRouter as Router,
	Routes,
	Route,
	Navigate,
} from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import Layout from "./components/Page Elements/Layout/Layout";
import LoginPage from "./components/Pages/LoginPage/LoginPage";
import RegistrationPage from "./components/Pages/RegistrationPage/RegistrationPage";
import HospitalizationApplication from "./components/Pages/FormPages/HospitalizationApplication";
import TrackingPage from "./components/Pages/MemberHistoryPage/TrackingPage";
import HistoryPage from "./components/Pages/AdminHistoryPage/HistoryPage";
import FAQ from "./components/Pages/FAQPage/FAQ";
import Settings from "./components/Pages/SettingsPage/Settings";
import AdminSettings from "./components/Pages/AdminSettingsPage/AdminSettings";
import PendingRequests from "./components/Pages/PendingRequestPage/PendingRequests";
import ErrorBoundary from "./components/Pages/PendingRequestPage/ErrorBoundary";
import { UserProvider } from "./contexts/userContext";
import { FirebaseProvider } from "./contexts/firebaseContext";
import ProtectedRoute from "./components/Page Elements/Routing/protectedRoutes";
//TEMP
// import FormGenerator from "./components/Pages/FormGenerator";

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
										element={<TrackingPage />}
									/>
									<Route
										path="/history"
										element={<HistoryPage />}
									/>
									<Route
										path="/pendingrequests"
										element={
											<ErrorBoundary>
												<PendingRequests />
											</ErrorBoundary>
										}
									/>
									{/* <Route
										path="/generate"
										element={<FormGenerator />}
									/> */}

									<Route path="/faqs" element={<FAQ />} />
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
