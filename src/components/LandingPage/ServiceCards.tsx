// import React from 'react';
import { useNavigate } from 'react-router-dom';
import eyeglassesIcon from "../../assets/eyeglasses.png";
import inpatientIcon from "../../assets/inpatient.png"; // Assuming you have an icon for inpatient
import admissionIcon from "../../assets/admission.png"; // Assuming you have an icon for admission
import outpatientIcon from "../../assets/outpatient.png"; // Assuming you have an icon for outpatient
// import testIcon from "../../assets/test.png"; // Assuming you have an icon for test
import InpatientForm from "../FormApplication/InpatientForm";
import AdmissionForm from "../FormApplication/AdmissionForm";
import OutpatientForm from "../FormApplication/OutpatientForm";
import EyeglassesForm from "../FormApplication/EyeglassesForm";
import TestForm from "../FormApplication/TestForm";
// import Form from "../FormApplication/Form";
import './ServiceCards.css'; // Assuming you have a CSS file for styling


const ServiceCards = () => {
	const navigate = useNavigate();
	const cards = [
		{
			title: "Inpatient Application Form",
			icon: inpatientIcon,
			path: "/InpatientForm",
		},
		{
			title: "Admission Application Form",
			icon: admissionIcon,
			path: "/admission",
		},
		{
			title: "Outpatient Application Form",
			icon: outpatientIcon,
			path: "/outpatient",
		},
		{
			title: "Eyeglasses Reimbursement Form",
			icon: eyeglassesIcon,
			path: "/EyeglassesForm",
		},
	];

	return (
		<div className="HospiAppli">
			<div className="WelcomeSection">
				<h1> Welcome to the USTFU HealthLink! 
				<br></br> Choose your desired service below. </h1>
			</div>
			<div className="service-cards">
				{cards.map((card, index) => (
					<div
						className="card"
						key={index}
						onClick={() => navigate(card.path)}
					>
						<img
							className="card-icon"
							src={card.icon}
							alt={card.title}
						/>
						<p>{card.title}</p>
					</div>
				))}
			</div>
		</div>
	);
};

export default ServiceCards;
