import React from "react";
import "./StatusTracking.css"; // Import the CSS

interface StatusTrackingProps {
	transactionID: string;
	onBack: () => void; // Function to return to the record table
}

const StatusTracking: React.FC<StatusTrackingProps> = ({
	transactionID,
	onBack,
}) => {
	const statusUpdates = [
		{ status: "FORM REQUEST SUBMITTED", dateTime: "10/18/2024 - 5:17 PM" },
		{ status: "REQUEST REVIEWED", dateTime: "10/18/2024 - 5:18 PM" },
		{ status: "PROCESSING REQUEST", dateTime: "10/18/2024 - 7:11 PM" },
		{ status: "FORM APPROVED!", dateTime: "10/18/2024 - 8:03 PM" },
	];

	return (
		<div className="status-tracking-container">
			<div className="transaction-id">
				TRANSACTION ID: <span>{transactionID}</span>
			</div>

			<div className="status-updates">
				<h3 className="status-title">STATUS UPDATES</h3>
				{statusUpdates.map((update, index) => (
					<div key={index} className="status-item">
						✔{" "}
						<span>
							{update.status} - {update.dateTime}
						</span>
					</div>
				))}
			</div>

			<div className="submit-info">
				<h3>SUBMITTED INFORMATION</h3>
				<p>[Your submitted information content here]</p>
			</div>

			<div className="action-buttons">
				<button className="print-button" onClick={() => window.print()}>
					PRINT
				</button>
				<button className="back-button" onClick={onBack}>
					BACK
				</button>
			</div>
		</div>
	);
};

export default StatusTracking;
