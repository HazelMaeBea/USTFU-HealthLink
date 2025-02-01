// src/components/Pages/HospitalizationApplication.tsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "../Layout/Layout"; // use the existing layout component
import InpatientForm from "../Form Application/InpatientForm";
import AdmissionForm from "../Form Application/AdmissionForm";
import OutpatientForm from "../Form Application/OutpatientForm";
import EyeglassesForm from "../Form Application/EyeglassesForm";
import TestForm from "../Form Application/TestForm";
import Form from "../Form Application/Form";

const HospitalizationApplication: React.FC = () => {
  console.log("Hospitalization Application loaded");
  return (
    <Layout>
      <Routes>
        <Route path="/inpatient" element={<InpatientForm />} />
        <Route path="/admission" element={<AdmissionForm />} />
        <Route path="/outpatient" element={<OutpatientForm />} />
        <Route path="/eyeglasses" element={<EyeglassesForm />} />
        <Route path="/testform" element={<TestForm />} />
        <Route path="/form" element={<Form />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </Layout>
  );
};

export default HospitalizationApplication;
