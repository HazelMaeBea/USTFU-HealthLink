import React, { useState, useEffect, useCallback } from "react";
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

import { auth } from "./config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { login, logout } from "./services/auth";

const App: React.FC = () => {
  // Use null as the initial state to indicate "unknown".
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Auth state changed:", user);
      setIsAuthenticated(!!user);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = useCallback(async () => {
    try {
      const user = await login();
      console.log("Login result:", user);
    } catch (error) {
      console.error("Login error:", error);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, []);

  // While auth state is unknown, don't render anything (or render a loading indicator)
  if (isAuthenticated === null) {
    return null; // or return <div>Loading...</div>
  }

  return (
    <Router>
      <div className="App">
        {isAuthenticated ? (
          <Layout onLogout={handleLogout}>
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
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
          </Layout>
        ) : (
          <Routes>
            <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        )}
      </div>
    </Router>
  );
};

export default App;