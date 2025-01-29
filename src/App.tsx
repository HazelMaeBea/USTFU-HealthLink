import 'bootstrap/dist/css/bootstrap.min.css';
import { useState } from "react";
import Header from "./components/Landing_Home Page/Header";
import Sidebar from "./components/Landing_Home Page/Sidebar";
import MainContainer from "./components/Landing_Home Page/MainContainer";
import InpatientForm from "./components/Form Application/InpatientForm";
import AdmissionForm from "./components/Form Application/AdmissionForm";
import OutpatientForm from "./components/Form Application/OutpatientForm";
import EyeglassesForm from "./components/Form Application/EyeglassesForm";
import "./App.css";
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

const App = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
		<div className="App">
			<Header />
			
			<Router>
				<div className="Layout">
					<Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
					<MainContainer isSidebarOpen={isSidebarOpen} />
					<Routes>
						<Route path="/inpatient" element={<InpatientForm />} />
						<Route path="/admission" element={<AdmissionForm />} />
						<Route path="/outpatient" element={<OutpatientForm />} />
						<Route path="/eyeglasses" element={<EyeglassesForm />} />
					</Routes>
				</div>
			</Router>
		</div>
	);
};

export default App;