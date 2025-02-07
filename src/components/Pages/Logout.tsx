import React, { useEffect } from "react";

const Logout: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
	useEffect(() => {
		onLogout();
	}, [onLogout]); // call onLogout when the component mounts

	return 0; //Redicred to login page --- try to find a way to return to current active URL
};

export default Logout;
