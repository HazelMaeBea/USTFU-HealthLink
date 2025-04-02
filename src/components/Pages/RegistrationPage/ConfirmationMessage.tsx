import React from "react";
import { LuBadgeCheck } from "react-icons/lu";
import "./ConfirmationMessage.css";

const ConfirmationMessage: React.FC = () => {
  return (
    <div className="confirmation-message">
      <LuBadgeCheck size={50} color="green" />
      <h1>Registration Request Received!</h1>
      <p>Thank you for registering!
        Your request is currently under review for verification. Once approved,
        you’ll receive an email confirmation and gain access to USTFU HealthLink.
       We appreciate your patience and look forward to welcoming you soon!</p>
      <button className="btn btn-primary" onClick={() => window.location.href = "/signin"}>Go back to sign in page</button>
    </div>
  );
};

export default ConfirmationMessage;
