// src/components/Pages/HospitalizationApplication.tsx
import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import ServiceCards from "../MainPage/ServiceCards";
import InpatientForm from "./InpatientForm";
import AdmissionForm from "./AdmissionForm";
import OutpatientForm from "./OutpatientForm";
import EyeglassesForm from "./EyeglassesForm";

const HospitalizationApplication: React.FC = () => {
	const location = useLocation(); // Access current location (route)
	console.log("Hospitalization Application loaded");

	return (
		<>
			{/* Only show ServiceCards on the /home route */}
			{location.pathname === "/home" && <ServiceCards />}

			<Routes>
				<Route path="/home" element={<ServiceCards />} />
				{/* Show service cards for /home */}
				<Route path="/inpatient" element={<InpatientForm />} />
				<Route path="/admission" element={<AdmissionForm />} />
				<Route path="/outpatient" element={<OutpatientForm />} />
				<Route path="/eyeglasses" element={<EyeglassesForm />} />
				{/* Default route when none of the above match */}
				<Route path="*" element={<Navigate to="/home" replace />} />
			</Routes>
		</>
	);
};

export default HospitalizationApplication;
