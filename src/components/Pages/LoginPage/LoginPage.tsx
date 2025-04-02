import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";
import USTFULogo from "../../../assets/website-header.png";
import GoogleLogo from "../../../assets/signin.png";
import { useFirebase } from "../../../../src/contexts/firebaseContext";
import {
	callFunction,
	isRegistered,
	getUserStatus,
	auth,
} from "../../../config/firebase";
import Popout from "../../Page Elements/Popout/Popout";

const LoginPage: React.FC = () => {
	const { login } = useFirebase();
	const [isLoggingIn, setIsLoggingIn] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [userStatus, setUserStatus] = useState<string | null>(null);
	const [showPopout, setShowPopout] = useState<boolean>(false);
	const [popoutData, setPopoutData] = useState({
		title: "",
		message: "",
		onConfirm: () => {},
		onCancel: () => {},
	});
	const navigate = useNavigate();

	useEffect(() => {
		if (userStatus === "verified") {
			console.log("✅ User is verified! Redirecting to home...");
			setTimeout(() => navigate("/home"), 1000);
		}
	}, [userStatus, navigate]);

	// TEMPORARY: Add keyboard shortcut to sync claims (Alt+Shift+S)
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			// Alt+Shift+S to sync claims
			if (event.altKey && event.shiftKey && event.key === "S") {
				console.log(
					"TEMPORARY: Triggering syncUserClaims cloud function..."
				);
				callFunction("syncAllUserClaimsTrigger")
					.then(() => {
						console.log("✅ Claims sync complete");
					})
					.catch((error) => {
						console.error("❌ Claims sync error:", error);
					});
			} else if (event.altKey && event.shiftKey && event.key === "R") {
				console.log("Opening video in new tab...");
				window.open(
					"https://www.youtube.com/watch?v=dQw4w9WgXcQ",
					"_blank"
				);
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);

	const handleLogin = async () => {
		try {
			setIsLoggingIn(true);
			setError(null);

			const user = await login();
			console.log("User:", user);

			if (!user) {
				setError("Login failed. Please try again.");
				return;
			}

			await user.reload();
			const refreshedUser = auth.currentUser;

			if (!refreshedUser) {
				setError("Failed to refresh user. Please try again.");
				return;
			}

			// Check if the user is registered in Firestore
			const registered = await isRegistered(refreshedUser.uid);
			console.log("User is registered:", registered);

			if (!registered) {
				setPopoutData({
					title: "Not Registered",
					message:
						"You are not yet registered. Proceed to registration?",
					onConfirm: () => {
						setShowPopout(false);
						navigate("/register");
					},
					onCancel: () => setShowPopout(false),
				});
				setShowPopout(true);
				return;
			}

			// Fetch user status
			const status = await getUserStatus(refreshedUser.uid);
			setUserStatus(status);
			console.log("User status:", status);

			if (status !== "verified") {
				setPopoutData({
					title:
						status === "pending"
							? "Verification Pending"
							: "Incomplete Registration",
					message:
						status === "pending"
							? "Your account is pending verification. Please wait for admin approval."
							: "You need to complete your registration before accessing the platform.",
					onConfirm: () => setShowPopout(false),
					onCancel: () => setShowPopout(false),
				});
				setShowPopout(true);
			}
		} catch (error: any) {
			console.error("Login error:", error);
			setError(error.message || "Failed to sign in. Please try again.");
		} finally {
			setIsLoggingIn(false);
		}
	};

	return (
		<div className="login-container">
			<div className="background-overlay"></div>
			<div className="content">
				<img src={USTFULogo} alt="Logo" className="page-logo" />
				<div className="white-box">
					<h1 className="sign-in-title">Sign in</h1>
					{error && <div className="error-message">{error}</div>}
					<p className="sign-in-description">
						To access MyUSTFU HealthLink, please make sure you meet
						the following requirement:
					</p>
					<p className="requirement">
						UST Google Workspace Personal Account
					</p>
					<button
						className="google-signin"
						onClick={handleLogin}
						disabled={isLoggingIn}
					>
						<img
							src={GoogleLogo}
							alt="Google Logo"
							className="google-logo"
						/>
						{isLoggingIn ? "Signing in..." : "Sign in with Google"}
					</button>
				</div>
			</div>
			{showPopout && (
				<Popout
					title={popoutData.title}
					message={popoutData.message}
					onConfirm={popoutData.onConfirm}
					onCancel={popoutData.onCancel}
					isOpen={showPopout}
				/>
			)}
		</div>
	);
};

export default LoginPage;
