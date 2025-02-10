import React from "react";
import "./LoginPage.css"; // Ensure this file exists
import USTFULogo from "../../assets/2.png"; // USTF Logo
import GoogleLogo from "../../assets/signin.png"; // Adjust path as needed

interface LoginPageProps {
	onLogin: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
	return (
		<div className="login-container">
			<div className="background-overlay"></div>
			<div className="content">
				<img src={USTFULogo} alt="Logo" className="page-logo"></img>
				<div className="white-box">
					<h1 className="sign-in-title">Sign in</h1>
					<p className="sign-in-description">
						To access MyUSTFU HealthLink, please make sure you meet
						the following requirement:
					</p>
					<p className="requirement">
						UST Google Workspace Personal Account
					</p>
					<button className="google-signin" onClick={onLogin}>
						<img
							src={GoogleLogo}
							alt="Google Logo"
							className="google-logo"
						/>
						Sign in with Google
					</button>
				</div>
			</div>
		</div>
	);
};

export default LoginPage;
