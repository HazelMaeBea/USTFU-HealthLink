import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../../Page Elements/BackButton/BackButton.css";
import "./RemainingBenefit.css";
import { useFirebase } from "../../../../contexts/firebaseContext";
import { collection, query, where, getDocs } from "firebase/firestore"; // Import necessary functions
import { db } from "../../../../contexts/firebase";


const RemainingBenefit = () => {
	const { email } = useFirebase();
	const [remainingBenefits, setRemainingBenefits] = useState(0);
	const [showPopup, setShowPopup] = useState(false);
	const navigate = useNavigate();
	
	const readRemainingBenefits = async () => {
		try {
		  // Query the users collection for a document where email matches
		  const q = query(collection(db, "users"), where("email", "==", email)); // Create a query
		  const querySnapshot = await getDocs(q); // Execute the query
	  
		  if (!querySnapshot.empty) {
			const doc = querySnapshot.docs[0]; // Assuming there's only one document
			const data = doc.data(); // Get the document data
	  
			// Access the remainingBenefits field
			console.log("Inside readRemainingBenefits: ", data.personalInfo.remainingBenefits);
			return data.personalInfo.remainingBenefits as number;
		  } else {
			console.log("No matching document found!");
			return 0;
		  }
		} catch (error) {
		  console.error("Error fetching document:", error);
		  return 0; // Explicitly return something
		}
	};

	useEffect(() => {
		const fetchRemainingBenefits = async () => {
		  const benefits = await readRemainingBenefits();
		  setRemainingBenefits(benefits); // Update state with the resolved value
		};
	
		fetchRemainingBenefits();
	  }, []);


	const handlePopup = () => {
		setShowPopup(!showPopup);
	};

	const handleHistoryClick = () => {
		navigate("/history");
		setShowPopup(false);
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
						<div className="amount-container p-3 rounded shadow">
							<div className="amount-input-wrapper d-flex align-items-center">
								<span className="currency"></span>
								<input
									aria-label="amount left"
									type="text"
									value={remainingBenefits}
									disabled
									className="amount-input"
								/>
							</div>
							<span className="amount-label">
								(Remaining benefit)
							</span>
						</div>
						<button
							onClick={handleHistoryClick}
							className="check-history-btn"
						>
							Check History
						</button>
					</div>
				</div>
			)}
		</>
	);
};

export default RemainingBenefit;
