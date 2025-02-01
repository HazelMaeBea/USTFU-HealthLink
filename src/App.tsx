import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import Layout from "./components/Layout/Layout";
import LoginPage from "./components/Pages/LoginPage";
import HospitalizationApplication from "./components/Pages/HospitalizationApplication";
import HospitalizationTracking from "./components/Pages/HospitalizationTracking";
import FAQs from "./components/Pages/Faqs";
import Settings from "./components/Pages/Settings";
import Logout from "./components/Pages/Logout";

const App: React.FC = () => {
	const [isAuthenticated, setIsAuthenticated] = useState(false);
 
  const handleLogin = () => {
    setIsAuthenticated(true); // Simulate login process
  };

	
  return (
    <Router> {/* BrowserRouter is wrapping everything */}
      <div className="App">
        {isAuthenticated ? (
          <Layout>
            <Routes>
              <Route path="/home/*" element={<HospitalizationApplication />} />
              <Route path="/tracking" element={<HospitalizationTracking />} />
              <Route path="/faqs" element={<FAQs />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/logout" element={<Logout />} />
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
