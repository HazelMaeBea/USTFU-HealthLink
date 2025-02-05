// src/components/Pages/HospitalizationApplication.tsx
import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import ServiceCards from "../Page Elements/Hospitalization Application/Main Page/ServiceCards"; // import ServiceCards component
import InpatientForm from "../Page Elements/Hospitalization Application/Forms/InpatientForm";
import AdmissionForm from "../Page Elements/Hospitalization Application/Forms/AdmissionForm";
import OutpatientForm from "../Page Elements/Hospitalization Application/Forms/OutpatientForm";
import EyeglassesForm from "../Page Elements/Hospitalization Application/Forms/EyeglassesForm";

const HospitalizationApplication: React.FC = () => {
  const location = useLocation(); // Access current location (route)
  console.log("Hospitalization Application loaded");

  return (
    <>
      {/* Only show ServiceCards on the /home route */}
      {location.pathname === "/home" && <ServiceCards />}

      <Routes>
        <Route path="/home" element={<ServiceCards />} /> {/* Show service cards for /home */}
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
