import { useNavigate } from "react-router-dom";
import "./ServiceCards.css";
import inpatientIcon from "../../../../assets/inpatient.png";
import admissionIcon from "../../../../assets/admission.png";
import outpatientIcon from "../../../../assets/outpatient.png";
import eyeglassesIcon from "../../../../assets/eyeglasses.png";

const ServiceCards = () => {
  const navigate = useNavigate();
  const cards = [
    {
      title: "Inpatient Application Form",
      icon: inpatientIcon,
      path: "/home/inpatient", // Update paths to be relative to /home
    },
    {
      title: "Admission Application Form",
      icon: admissionIcon,
      path: "/home/admission", // Update paths to be relative to /home
    },
    {
      title: "Outpatient Application Form",
      icon: outpatientIcon,
      path: "/home/outpatient", // Update paths to be relative to /home
    },
    {
      title: "Eyeglasses Reimbursement Form",
      icon: eyeglassesIcon,
      path: "/home/eyeglasses", // Update paths to be relative to /home
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
            onClick={() => {
              console.log("Navigating to:", card.path); // Debug line to check paths
              navigate(card.path); // Use the full path relative to /home
            }}
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
