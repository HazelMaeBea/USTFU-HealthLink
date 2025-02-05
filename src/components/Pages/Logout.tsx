import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";

const Logout: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
	useEffect(() => {
		onLogout();
	}, [onLogout]); // call onLogout when the component mounts

	return <Navigate to="/login" replace />; //Redicred to login page
};

export default Logout;
