import { useNavigate } from "react-router-dom";
import "./ServiceCards.css";
import inpatientIcon from "../../../assets/inpatient.png";
import admissionIcon from "../../../assets/admission.png";
import outpatientIcon from "../../../assets/outpatient.png";
import eyeglassesIcon from "../../../assets/eyeglasses.png";
import { useUser } from "../../../contexts/userContext";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../../contexts/firebase";
import { useState, useEffect } from "react";
import Popout from "../../Page Elements/Popout/Popout";

const ServiceCards = () => {
	const { displayName } = useUser();
	const usersRef = collection(db, "users");
	const userQuery = query(usersRef, where("fullName", "==", displayName));
	const [lastRequestFlag, setRequestFlag] = useState(false);
	const [isPopoutOpen, setPopoutOpen] = useState<boolean>(false);
	const [oldEyeglassesDate, setOldEyeglassesDate] = useState<
		string | undefined
	>();
	const [newEyeglassesDate, setNewEyeGlassesDate] = useState<
		string | undefined
	>();
	const [userStatus, setUserStatus] = useState<string>("");

	const handleConfirm = (): void => {
		setPopoutOpen(false); // Close the Popout after confirmation
	};

	const handleCancel = (): void => {
		setPopoutOpen(false); // Close the Popout
	};

	useEffect(() => {
		const unsubscribe = onSnapshot(
			userQuery,
			(snapshot) => {
				try {
					if (!snapshot.empty) {
						const doc = snapshot.docs[0];
						const userData = doc.data();
						console.log("Snapshot is not empty");

						// Get user status
						setUserStatus(userData.personalInfo?.status || "");

						// Check for eyeglasses benefit claimed date
						if (
							userData?.personalInfo.eyeglassesBenefitClaimedDate !== undefined
						) {
							const eyeglassDate =
								userData.personalInfo.eyeglassesBenefitClaimedDate;
							const eyeglassDateMils = eyeglassDate.toMillis();
							const twoYearsInMillis =
								2 * 365 * 24 * 60 * 60 * 1000; // 2 years in milliseconds
							const updatedEyeglassDateMils =
								eyeglassDateMils + twoYearsInMillis;

							const currentTime = Date.now();
							console.log("test")
							const oldFormattedDate = eyeglassDate
								.toDate()
								.toLocaleDateString("en-US", {
									timeZone: "Asia/Manila",
									month: "long",
									day: "numeric",
									year: "numeric",
								}) as string;
							setOldEyeglassesDate(oldFormattedDate);

							const newFormattedDate = new Date(
								updatedEyeglassDateMils
							).toLocaleDateString("en-US", {
								timeZone: "Asia/Manila",
								month: "long",
								day: "numeric",
								year: "numeric",
							}) as string;
							setNewEyeGlassesDate(newFormattedDate);

							// Check if 2 years have passed and if user is tenured
							const isTenured = userStatus
								.toLowerCase()
								.includes("tenured");
							if (currentTime >= updatedEyeglassDateMils || !isTenured) {
								setRequestFlag(false);
							} else {
								setRequestFlag(true);
							}
						} else {
							// No previous eyeglasses claim, check only tenure status
							console.log("Not defined");
							const isTenured = userStatus
								.toLowerCase()
								.includes("tenured");
							if (!isTenured) {
								setRequestFlag(true);
							} else {
								setRequestFlag(false);
							}
						}
					}
				} catch (error) {
					console.error("Error processing snapshot:", error);
				}
			},
			(error) => {
				console.error("Error with Firestore query:", error);
			}
		);

		return () => unsubscribe();
	}, [displayName, userQuery]);

	const navigate = useNavigate();
	const cards = [
		{
			title: "Inpatient Application Form",
			icon: inpatientIcon,
			path: "/home/inpatient",
		},
		{
			title: "Admission Application Form",
			icon: admissionIcon,
			path: "/home/admission",
		},
		{
			title: "Outpatient Application Form",
			icon: outpatientIcon,
			path: "/home/outpatient",
		},
		{
			title: "Eyeglasses Reimbursement Form",
			icon: eyeglassesIcon,
			path: "/home/eyeglasses",
			disabled: lastRequestFlag,
		},
	];

	const getPopoutMessage = () => {
		if (userStatus.toLowerCase().includes("tenured")) {
			return `You've recently requested for Eyeglasses Benefits on ${oldEyeglassesDate}. 
			These benefits can only be availed once every 2 years. You may next avail on ${newEyeglassesDate}`;
		} else {
			return "Eyeglasses benefits are only available to tenured faculty members.";
		}
	};

	return (
		<div className="HospiAppli">
			<div className="WelcomeSection">
				<h1>
					Welcome to the USTFU HealthLink!
					<br />
					Choose your desired service below.
				</h1>
			</div>
			<div className="service-cards">
				{cards.map((card, index) => (
					<div
						className={`card ${
							card.disabled ? "card-disabled" : ""
						}`}
						key={index}
						onClick={() => {
							if (!card.disabled) {
								navigate(card.path);
							} else {
								setPopoutOpen(true);
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
			<Popout
				title="Eyeglasses Benefits Unavailable"
				message={getPopoutMessage()}
				onConfirm={handleConfirm}
				onCancel={handleCancel}
				isOpen={isPopoutOpen}
				confirmText="Okay"
				showCancelButton={false}
			/>
		</div>
	);
};

export default ServiceCards;
