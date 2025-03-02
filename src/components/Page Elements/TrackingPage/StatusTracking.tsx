import React from "react";
import "./StatusTracking.css"; // Import the CSS

interface StatusTrackingProps {
	onBack: () => void;
	transactionID: string;
	typeOfForm: string;
	status: string;
}

const StatusTracking: React.FC<StatusTrackingProps> = ({
	onBack,
	transactionID,
	typeOfForm,
	status,
}) => {
	const getStatusUpdates = (status: string) => {
		const timestamps: Record<
			"submitted" | "reviewed" | "processing" | "approved" | "rejected",
			string
		> = {
			submitted: "10:00 AM",
			reviewed: "10:30 AM",
			processing: "11:00 AM",
			approved: "11:30 AM",
			rejected: "11:30 AM",
		};

		type StatusKey =
			| "submitted"
			| "reviewed"
			| "processing"
			| "approved"
			| "rejected";

		const baseUpdates: { label: string; key: StatusKey }[] = [
			{ label: "FORM REQUEST SUBMITTED", key: "submitted" },
			{ label: "REQUEST REVIEWED", key: "reviewed" },
			{ label: "REQUEST PROCESSING", key: "processing" },
		];

		if (status === "Approved") {
			baseUpdates.push({ label: "REQUEST APPROVED", key: "approved" });
		}

		if (status === "Rejected") {
			baseUpdates.push({ label: "REQUEST REJECTED", key: "rejected" });
		}

		return baseUpdates.map((update, index) => {
			let bgClass = "pending";
			let textColor = "pending";
			let icon = "";
			let time = timestamps[update.key]; // TypeScript now recognizes this as valid

			if (status === "Approved") {
				bgClass = "approved";
				textColor = "approved";
				icon = "✔";
			} else if (status === "Rejected") {
				bgClass = "rejected";
				textColor = "rejected";
				icon = "✘";
			} else if (status === "Pending") {
				if (index === 0) {
					icon = "✔";
					bgClass = "approved"; // First step is completed
					textColor = "approved";
				} else {
					icon = "";
					bgClass = "pending";
					textColor = "pending";
				}
			}

			return {
				...update,
				bgClass,
				textColor,
				icon,
				time,
			};
		});
	};

	const defaultFields = () => {
		return (
			<div className="statusTracking-form-container">
				<div className="statusTracking-form-contents">
					<label>Last Name</label>
					<p className="statusTracking-field-content">Batumbakal</p>
				</div>
				<div className="statusTracking-form-contents">
					<label>First Name</label>
					<p className="statusTracking-field-content">Yza</p>
				</div>
				<div className="statusTracking-form-contents">
					<label>Middle Name</label>
					<p className="statusTracking-field-content">Hambatukam</p>
				</div>
				<div className="statusTracking-form-contents">
					<label>Suffix</label>
					<p className="statusTracking-field-content">-</p>
				</div>
				<div className="statusTracking-form-contents">
					<label>Age</label>
					<p className="statusTracking-field-content">69</p>
				</div>
				<div className="statusTracking-form-contents">
					<label>Gender</label>
					<p className="statusTracking-field-content">Non-binary</p>
				</div>
				<div className="statusTracking-form-contents">
					<label>College Affiliation</label>
					<p className="statusTracking-field-content">
						College of Rose Buds
					</p>
				</div>
				<div className="statusTracking-form-contents">
					<label>Contact No.</label>
					<p className="statusTracking-field-content">09223334444</p>
				</div>
			</div>
		);
	};
	// Define different submission details based on typeOfForm
	const getSubmissionDetails = () => {
		switch (typeOfForm) {
			case "In-Patient Form":
			case "Out-Patient Form":
				return (
					<>
						<hr></hr>
						<div className="statusTracking-form-container">
							<div className="statusTracking-form-contents">
								<label>Hospital</label>
								<p className="statusTracking-field-content">
									Sa Gedli Hospital
								</p>
							</div>
							<div className="statusTracking-form-contents">
								<label>Nature of Illness</label>
								<p className="statusTracking-field-content">
									Xavier Syndrome
								</p>
							</div>
							<div className="statusTracking-form-contents">
								<label>Physician</label>
								<p className="statusTracking-field-content">
									Dr. Manhattan
								</p>
							</div>
							<div className="statusTracking-form-contents">
								<label>Procedure</label>
								<p className="statusTracking-field-content">
									Surgery
								</p>
							</div>
						</div>
						<hr></hr>
						<div className="statusTracking-form-container">
							<div className="statusTracking-form-contents">
								<label>Academic Term</label>
								<p className="statusTracking-field-content">
									2nd
								</p>
							</div>
							<div className="statusTracking-form-contents">
								<label>Academic Year</label>
								<p className="statusTracking-field-content">
									2025
								</p>
							</div>
							<div className="statusTracking-form-contents">
								<label>Teaching Load</label>
								<p className="statusTracking-field-content">
									200
								</p>
							</div>
							<div className="statusTracking-form-contents">
								<label>Status</label>
								<p className="statusTracking-field-content">
									-
								</p>
							</div>
							<div className="statusTracking-form-contents">
								<label>Date Hired:</label>
								<p className="statusTracking-field-content">
									01/01/1612
								</p>
							</div>
							<div className="statusTracking-form-contents">
								<label>Date Retired:</label>
								<p className="statusTracking-field-content">
									-
								</p>
							</div>
							<div className="statusTracking-form-contents">
								<label>Health Benefits</label>
								<p className="statusTracking-field-content">
									idk what this supposed to have
								</p>
							</div>
							<div className="statusTracking-form-contents">
								<label>If HMO, please specify:</label>
								<p className="statusTracking-field-content">
									-
								</p>
							</div>
						</div>
					</>
				);
			case "Admission":
				return (
					<>
						<div className="statusTracking-form-container">
							<div className="statusTracking-form-contents">
								<label>Load</label>
								<p className="statusTracking-field-content">
									Loadicakes
								</p>
							</div>
							<div className="statusTracking-form-contents">
								<label>Status</label>
								<p className="statusTracking-field-content">
									-
								</p>
							</div>
						</div>
					</>
				);
			case "Eyeglasses":
				return (
					<>
						<div className="statusTracking-form-container">
							<div className="statusTracking-form-contents">
								<label>OR Number</label>
								<p className="statusTracking-field-content">
									-
								</p>
							</div>
							<div className="statusTracking-form-contents">
								<label>Issued By</label>
								<p className="statusTracking-field-content">
									-
								</p>
							</div>
							<div className="statusTracking-form-contents">
								<label>Amount Paid</label>
								<p className="statusTracking-field-content">
									-
								</p>
							</div>
						</div>
					</>
				);
			default:
				return <p>No additional details available.</p>;
		}
	};

	const getAttachments = () => {
		const attachments = [
			{ filename: "id.pdf" },
			{ filename: "chuchu.docx" },
			{ filename: "whatever-needs-to-be-passed.txt" },
		];

		return (
			<>
				<hr></hr>
				<div className="statusTracking-attachments-section">
					<h4>UPLOADED ATTACHMENTS</h4>
					<div className="statusTracking-attachment-list">
						{attachments.map((attachment, index) => (
							<div
								key={index}
								className="statusTracking-attachment-item"
							>
								<span
									className="statusTracking-attachment-filename"
									title={attachment.filename}
								>
									{attachment.filename}
								</span>
								<button className="view-btn">View</button>
							</div>
						))}
					</div>
				</div>
			</>
		);
	};

	return (
		<>
			<div className="statusTracking-container">
				<div className="statusTracking-transaction-header">
					<div className="statusTracking-transaction-id">
						TRANSACTION ID: <strong>{transactionID}</strong>
					</div>
					<button
						className="statusTracking-back-button"
						onClick={onBack}
					>
						BACK
					</button>
				</div>
				<div className="statusTracking-status-updates">
					<h3 className="statusTracking-status-title">
						STATUS UPDATES
					</h3>
					{getStatusUpdates(status).map((update, index) => (
						<div
							key={index}
							className={`statusTracking-status-item ${update.bgClass}`}
						>
							{update.icon && (
								<span className="statusTracking-checkmark">
									{update.icon}
								</span>
							)}
							<div className="statusTracking-status-text">
								<span>{update.label}</span>
								<span>-</span>
								<span className="timestamp">
									{status === "Pending" &&
									(update.key === "reviewed" ||
										update.key === "processing")
										? "..."
										: update.time}
								</span>
							</div>
						</div>
					))}
				</div>
				<div className="statusTracking-action-buttons">
					<button
						className="statusTracking-print-button"
						onClick={() => window.print()}
						disabled={status === "Pending"}
					>
						🖨 PRINT
					</button>
				</div>
			</div>

			{/* Submission Details Section */}
			<div className="statusTracking-submission-info-container">
				<div className="statusTracking-submission-header">
					<div className="statusTracking-submission-title">
						SUBMITTED INFORMATION
					</div>
				</div>
				<div className="statusTracking-submission-contents">
					<>
						{defaultFields()}
						{getSubmissionDetails()}
						{getAttachments()}
					</>
				</div>
			</div>
		</>
	);
};

export default StatusTracking;
