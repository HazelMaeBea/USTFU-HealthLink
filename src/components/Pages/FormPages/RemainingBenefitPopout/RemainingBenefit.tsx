import { useEffect, useState } from "react";
import "../../../Page Elements/BackButton/BackButton.css";
import "./RemainingBenefit.css";
import { useFirebase } from "../../../../contexts/firebaseContext";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../../../contexts/firebase";

const RemainingBenefit = () => {
	const { email } = useFirebase();
	const [remainingBenefits, setRemainingBenefits] = useState(0);
	const [lastUpdated, setLastUpdated] = useState("");
	const [fullName, setFullName] = useState("");
	const [showPopup, setShowPopup] = useState(false);

	const fetchUserData = async () => {
		try {
			const q = query(
				collection(db, "users"),
				where("email", "==", email)
			);
			const querySnapshot = await getDocs(q);

			if (!querySnapshot.empty) {
				const doc = querySnapshot.docs[0];
				const data = doc.data();

				// Get the remaining benefits
				const benefits = data.personalInfo.remainingBenefits || 0;

				// Get the last updated timestamp
				const timestamp = data.personalInfo.lastUpdated
					? new Date(
							data.personalInfo.lastUpdated.toDate()
					  ).toLocaleDateString("en-US", {
							year: "numeric",
							month: "long",
							day: "numeric",
					  })
					: "Not available";

				// Get the user's name
				const name = `${data.personalInfo.firstName || ""} ${
					data.personalInfo.lastName || ""
				}`;

				return { benefits, timestamp, name };
			} else {
				console.log("No matching document found!");
				return { benefits: 0, timestamp: "Not available", name: "" };
			}
		} catch (error) {
			console.error("Error fetching document:", error);
			return { benefits: 0, timestamp: "Not available", name: "" };
		}
	};

	useEffect(() => {
		const fetchData = async () => {
			const { benefits, timestamp, name } = await fetchUserData();
			setRemainingBenefits(benefits);
			setLastUpdated(timestamp);
			setFullName(name);
		};

		fetchData();
	}, []);

	const handlePopup = () => {
		setShowPopup(!showPopup);
	};

	return (
		<>
			<div className="back-button" onClick={handlePopup}>
				<span>{"View Remaining Benefits"}</span>
			</div>
			{showPopup && (
				<div className="popup-overlay" onClick={handlePopup}>
					<div
						className="popup-content"
						onClick={(e) => e.stopPropagation()}
					>
						<button className="close-button" onClick={handlePopup}>
							&times;
						</button>
						<div className="benefit-header">
							<h2>Remaining Benefits</h2>
							<p className="member-name">For: {fullName}</p>
						</div>
						<div className="amount-container">
							<div className="amount-icon">₱</div>
							<div className="amount-input-wrapper">
								<input
									aria-label="amount left"
									type="text"
									value={remainingBenefits.toLocaleString()}
									disabled
									className="amount-input"
								/>
							</div>
						</div>

						<div className="update-info">
							<span className="update-label">Last updated:</span>
							<span className="update-date">{lastUpdated}</span>
						</div>
					</div>
				</div>
			)}
		</>
	);
};

export default RemainingBenefit;
