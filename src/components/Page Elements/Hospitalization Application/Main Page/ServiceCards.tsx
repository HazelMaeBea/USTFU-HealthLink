import { useNavigate } from "react-router-dom";
import "./ServiceCards.css";
import inpatientIcon from "../../../../assets/inpatient.png";
import admissionIcon from "../../../../assets/admission.png";
import outpatientIcon from "../../../../assets/outpatient.png";
import eyeglassesIcon from "../../../../assets/eyeglasses.png";
import { useUser } from "../../../../contexts/userContext";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../../../config/firebase";
import { differenceInYears } from "date-fns";
import { useState } from "react";

const ServiceCards = () => {
  const { displayName } = useUser();
  const usersRef = collection(db,'users');
  const userQuery = query(usersRef, where("fullName", "==", displayName));
  const [lastRequestFlag, setRequestFlag] = useState(false);
  
  onSnapshot(
    userQuery,
    (snapshot) => {
      try {
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          const lastEyeglasses = doc.data().eyeglassesFlag.toMillis();
          // const currentTime = Date.now() + 65995820897; //plus around 2 years to test if eyeglasses are requestable
          const currentTime = Date.now();
          const timeDifference = currentTime - lastEyeglasses;
          const differenceInYears = timeDifference / (1000 * 60 * 60 * 24 * 365);
          console.log(`Time difference in years: ${differenceInYears.toFixed(2)} years`);
          if(differenceInYears >= 2)
            setRequestFlag(true);
          else
            setRequestFlag(false);
        } else {
          console.log("No matching document found.");
        }

      } catch (error) {
        console.error("An error occurred while processing the snapshot:", error);
      }
    },
    (error) => {
      console.error("An error occurred with the Firestore query:", error);
    }
  );
  
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
      disabled: lastRequestFlag,
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
              if (!card.disabled) {
                console.log("Navigating to:", card.path);
                navigate(card.path);
              } else {
                console.log(`${card.title} is disabled.`);
              }
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
