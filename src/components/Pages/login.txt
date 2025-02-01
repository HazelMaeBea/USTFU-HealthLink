import 'bootstrap/dist/css/bootstrap.min.css';
import { useState } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Header from "./components/Landing_Home Page/Header";
import Sidebar from "./components/Landing_Home Page/Sidebar";
import MainContainer from "./components/Landing_Home Page/MainContainer";
import EyeglassesForm from "./components/Form Application/EyeglassesForm";
import LoginPage from "./components/Login Page/LoginPage"; // Import the Login Page
import "./App.css";

const App = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Track authentication

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  return (
    <Router>
      <div className="App">
        {isAuthenticated ? (
          <>
            <Header />
            <div className="Layout">
              <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
              <Routes>
                <Route path="/home" element={<MainContainer isSidebarOpen={isSidebarOpen} />} />
                <Route path="/eyeglasses" element={<EyeglassesForm />} />
                <Route path="*" element={<Navigate to="/home" />} /> {/* Redirect after login */}
              </Routes>
            </div>
          </>
        ) : (
          <LoginPage onLogin={handleLogin} />
        )}
      </div>
    </Router>
  );
};

export default App;
