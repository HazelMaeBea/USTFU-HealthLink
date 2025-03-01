import React from "react";
import "./StatusTracking.css"; // Import the CSS

interface StatusTrackingProps {
	transactionID: string;
	onBack: () => void; // Function to return to the record table
	typeOfForm: string; // Type of form submitted
}

const StatusTracking: React.FC<StatusTrackingProps> = ({
	transactionID,
	onBack,
	typeOfForm,
}) => {
	const statusUpdates = [
		{ status: "FORM REQUEST SUBMITTED", dateTime: "10/18/2024 - 5:17 PM" },
		{ status: "REQUEST REVIEWED", dateTime: "10/18/2024 - 5:18 PM" },
		{ status: "PROCESSING REQUEST", dateTime: "10/18/2024 - 7:11 PM" },
		{ status: "FORM APPROVED!", dateTime: "10/18/2024 - 8:03 PM" },
	];

	// Define different submission details based on typeOfForm
	const getSubmissionDetails = () => {
		switch (typeOfForm) {
			case "Leave Request":
				return (
					<>
						<p>
							<strong>Reason:</strong> Sick Leave
						</p>
						<p>
							<strong>Start Date:</strong> 10/20/2024
						</p>
						<p>
							<strong>End Date:</strong> 10/22/2024
						</p>
					</>
				);
			case "Reimbursement":
				return (
					<>
						<p>
							<strong>Amount:</strong> $150
						</p>
						<p>
							<strong>Description:</strong> Travel expenses
						</p>
						<p>
							<strong>Approval Status:</strong> Pending
						</p>
					</>
				);
			case "IT Support Request":
				return (
					<>
						<p>
							<strong>Issue:</strong> Laptop not booting
						</p>
						<p>
							<strong>Requested On:</strong> 10/18/2024
						</p>
						<p>
							<strong>Technician Assigned:</strong> John Doe
						</p>
					</>
				);
			default:
				return <p>No additional details available.</p>;
		}
	};

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

			{/* Submission Details Section */}
			<div className="submission-info-container">
				<div className="submission-header">SUBMITTED INFORMATION</div>
				<div className="submission-contents">{getSubmissionDetails()}</div>
			</div>
		</>
	);
};

export default StatusTracking;
