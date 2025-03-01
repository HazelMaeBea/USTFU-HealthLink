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
		<>
			<div className="status-tracking-container">
				<div className="transaction-header">
					<div className="transaction-id">
						TRANSACTION ID: <strong>{transactionID}</strong>
					</div>
					<button className="back-button" onClick={onBack}>
						BACK
					</button>
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
					<div className="action-buttons">
						<button className="print-button" onClick={() => window.print()}>
							🖨 PRINT
						</button>
					</div>
				</div>
			</div>
			<div className="submission-info-container">
				<div className="submission-header">
					<div className="submission-title">SUBMITTED INFORMATION</div>
				</div>
				<div className="submission-contents"></div>
			</div>
		</>
	);
};

export default StatusTracking;
