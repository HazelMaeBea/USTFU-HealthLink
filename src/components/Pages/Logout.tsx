import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Popout from "../Page Elements/Popout/Popout";

interface LogoutProps {
  onLogout: () => Promise<void>;
}

const Logout: React.FC<LogoutProps> = ({ onLogout }) => {
  const [isPopoutOpen, setIsPopoutOpen] = useState(true);
  const navigate = useNavigate();

  const handleConfirm = async () => {
    try {
      await onLogout();
      navigate("/login"); 
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleCancel = () => {
    setIsPopoutOpen(false);
    navigate(-1); // Return to previous URL
  };

  return (
    <>
      {isPopoutOpen && (
        <Popout
          title="Confirm Logout"
          message="Are you sure you want to logout?"
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          isOpen={isPopoutOpen}
        />
      )}
    </>
  );
};

export default Logout;