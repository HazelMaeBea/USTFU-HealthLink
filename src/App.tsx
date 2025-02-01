import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout/Layout";
import LoginPage from "./components/Pages/LoginPage";
import HospitalizationApplication from "./components/Pages/HospitalizationApplication";
import HospitalizationTracking from "./components/Pages/HospitalizationTracking";
import FAQs from "./components/Pages/Faqs";
import Settings from "./components/Pages/Settings";
import Logout from "./components/Pages/Logout";
import "bootstrap/dist/css/bootstrap.min.css";
import { useState, useEffect } from "react";
import {
	BrowserRouter as Router,
	Route,
	Routes,
	Navigate,
} from "react-router-dom";
import { Container } from "react-bootstrap";
import Header from "./components/LandingPage/Header";
import Footer from "./components/LandingPage/Footer";
import Sidebar from "./components/LandingPage/Sidebar";
import ServiceCards from "./components/LandingPage/ServiceCards";
import StickySidebar from "./components/LandingPage/StickySidebar";
import Settings from "./components/Settings Page/Settings";

import LoginPage from "./components/Login Page/LoginPage";
import "./App.css";

const App: React.FC = () => {
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

	useEffect(() => {
		const handleResize = () => {
			setIsMobile(window.innerWidth <= 768);
		};

		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);
const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = () => {
    setIsAuthenticated(true); // Simulate login process
  };

  return (
    <Router>
      <div className="App">
        {isAuthenticated ? (
          <Layout>
            <Routes>
              {/* Hospitalization Application Routes */}
              <Route path="/home/*" element={<HospitalizationApplication />} />

              {/* Other Pages */}
              <Route path="/tracking" element={<HospitalizationTracking />} />
              <Route path="/faqs" element={<FAQs />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/logout" element={<Logout />} />

              {/* Redirect any unknown routes to /home */}
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
          </Layout>
        ) : (
          <LoginPage onLogin={handleLogin} />
        )}
      </div>
    </Router>
  );
};

export default App;
