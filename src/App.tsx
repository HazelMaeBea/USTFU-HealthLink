import 'bootstrap/dist/css/bootstrap.min.css';
import { useState } from "react";
import Header from "./components/Landing_Home Page/Header";
import Sidebar from "./components/Landing_Home Page/Sidebar";
import MainContainer from "./components/Landing_Home Page/MainContainer";
import InpatientForm from "./components/Form Application/InpatientForm";
import AdmissionForm from "./components/Form Application/AdmissionForm";
import OutpatientForm from "./components/Form Application/OutpatientForm";
import EyeglassesForm from "./components/Form Application/EyeglassesForm";
import TestForm from "./components/Form Application/TestForm";
import Form from "./components/Form Application/Form";


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



						<Route path="/testform" element={<TestForm />} />
						<Route path="/form" element={<Form />} />


					</Routes>
				</div>
			</Router>
		</div>
	);
};

export default App;