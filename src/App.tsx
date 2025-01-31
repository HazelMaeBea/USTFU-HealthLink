import "bootstrap/dist/css/bootstrap.min.css";
import { useState } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import Header from "./components/Landing_Home Page/Header";
import Sidebar from "./components/Landing_Home Page/Sidebar";
import MainContainer from "./components/Landing_Home Page/MainContainer";
import InpatientForm from "./components/Form Application/InpatientForm";
import AdmissionForm from "./components/Form Application/AdmissionForm";
import OutpatientForm from "./components/Form Application/OutpatientForm";
import EyeglassesForm from "./components/Form Application/EyeglassesForm";

import TestAdmissionForm from "./components/Form Application/TestAdmissionForm";
import TestEyeglassesForm from "./components/Form Application/TestEyeglassesForm";

import Form from "./components/Form Application/Form";

import LoginPage from "./components/Login Page/LoginPage";
import "./App.css";

const App = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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
                <Route
                  path="/home"
                  element={<MainContainer isSidebarOpen={isSidebarOpen} />}
                />
                <Route path="/inpatient" element={<InpatientForm />} />
                <Route path="/admission" element={<AdmissionForm />} />
                <Route path="/outpatient" element={<OutpatientForm />} />
                <Route path="/eyeglasses" element={<EyeglassesForm />} />
                <Route path="*" element={<Navigate to="/home" />} /> {}
                <Route path="/form" element={<Form />} />
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
