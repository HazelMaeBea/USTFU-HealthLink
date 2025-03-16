import React, { useState } from "react";
import "./StatusTracking.css"; // Import the CSS
import type { PendingRequest } from "../PendingRequests/types";
import { usePendingRequests } from "../PendingRequests/PendingRequestBackend";
import ViewFiles from "../PendingRequests/ViewFiles";
import { IoIosArrowBack } from "react-icons/io"; // Import arrow icon
import "../Hospitalization Application/Forms/BackButton.css"; // Import BackButton styles

interface StatusTrackingProps {
	onBack: () => void;
	transactionID: string;
	status: string;
	dateTime: string;
}

const StatusTracking: React.FC<StatusTrackingProps> = ({
	onBack,
	transactionID,
	status,
	dateTime,
}) => {
	// Update to use the new hook structure
	const { requests: pendingRequests } = usePendingRequests(1, 100); // Request a large number to ensure we get all requests

	const [previewFile, setPreviewFile] = useState<any>(null);
	const handleClosePreview = () => {
		setPreviewFile(null);
	};

	const getStatusUpdates = (status: string, dateTime: string) => {
		const timestamps: Record<
			"submitted" | "reviewed" | "processing" | "approved" | "rejected",
			string
		> = {
			submitted: dateTime,
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
			let bgClass = "statusTracking-pending";
			let textColor = "statusTracking-pending";
			let icon = "";
			let time = timestamps[update.key]; // TypeScript now recognizes this as valid

			if (status === "Approved") {
				bgClass = "statusTracking-approved";
				textColor = "statusTracking-approved";
				icon = "✔";
			} else if (status === "Rejected") {
				bgClass = "statusTracking-rejected";
				textColor = "statusTracking-rejected";
				icon = "✘";
			} else if (status === "Pending") {
				if (index === 0) {
					icon = "✔";
					bgClass = "statusTracking-approved"; // First step is completed
					textColor = "statusTracking-approved";
				} else {
					icon = "";
					bgClass = "statusTracking-pending";
					textColor = "statusTracking-pending";
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

	const fields = (request: PendingRequest) => {
		const { formData } = request;

		const defaultData = (
			<>
				<div className="statusTracking-form-container">
					<div className="statusTracking-form-contents">
						<label>Last Name</label>
						<p className="statusTracking-field-content">
							{formData.lastname}
						</p>
					</div>
					<div className="statusTracking-form-contents">
						<label>First Name</label>
						<p className="statusTracking-field-content">
							{formData.firstname}
						</p>
					</div>
					<div className="statusTracking-form-contents">
						<label>Middle Name</label>
						<p className="statusTracking-field-content">
							{formData.middlename}
						</p>
					</div>
					<div className="statusTracking-form-contents">
						<label>Suffix</label>
						<p className="statusTracking-field-content">
							{formData.suffix ? formData.suffix : "-"}
						</p>
					</div>
				</div>
				<div className="statusTracking-form-container2">
					<div className="statusTracking-form-contents">
						<label>Age</label>
						<p className="statusTracking-field-content st-age">
							{formData.age}
						</p>
					</div>
					<div className="statusTracking-form-contents st-gender">
						<label>Gender</label>
						<p className="statusTracking-field-content">
							{formData.gender}
						</p>
					</div>
					<div className="statusTracking-form-contents st-college">
						<label>College Affiliation</label>
						<p className="statusTracking-field-content">
							{formData.college}
						</p>
					</div>
					<div className="statusTracking-form-contents st-contact">
						<label>Contact No.</label>
						<p className="statusTracking-field-content">
							{formData.contact}
						</p>
					</div>
				</div>
			</>
		);

		switch (formData.formType) {
			case "hospital":
				return (
					<>
						{defaultData}
						<hr></hr>
						<div className="statusTracking-form-container">
							<div className="statusTracking-form-contents">
								<label>Hospital</label>
								<p className="statusTracking-field-content">
									{formData.hospital}
								</p>
							</div>
							<div className="statusTracking-form-contents">
								<label>Nature of Illness</label>
								<p className="statusTracking-field-content">
									{formData.illness}
								</p>
							</div>
							<div className="statusTracking-form-contents">
								<label>Physician</label>
								<p className="statusTracking-field-content">
									{formData.physician}
								</p>
							</div>
							<div className="statusTracking-form-contents">
								<label>Procedure</label>
								<p className="statusTracking-field-content">
									{formData.procedures}
								</p>
							</div>
						</div>
						<hr></hr>
						<div className="statusTracking-form-container">
							<div className="statusTracking-form-contents">
								<label>Academic Term</label>
								<p className="statusTracking-field-content">
									{formData.term}
								</p>
							</div>
							<div className="statusTracking-form-contents">
								<label>Academic Year</label>
								<p className="statusTracking-field-content">
									{formData.year}
								</p>
							</div>
							<div className="statusTracking-form-contents">
								<label>Teaching Load</label>
								<p className="statusTracking-field-content">
									{formData.load}
								</p>
							</div>
							<div className="statusTracking-form-contents">
								<label>Status</label>
								<p className="statusTracking-field-content">
									{formData.status || "-"}
								</p>
							</div>
							<div className="statusTracking-form-contents">
								<label>Date Hired:</label>
								<p className="statusTracking-field-content">
									{formData.dateHired
										? new Date(
												formData.dateHired
										  ).toLocaleDateString()
										: "-"}
								</p>
							</div>
							<div className="statusTracking-form-contents">
								<label>Date Retired:</label>
								<p className="statusTracking-field-content">
									{formData.dateRetired
										? new Date(
												formData.dateRetired
										  ).toLocaleDateString()
										: "-"}
								</p>
							</div>
							<div className="statusTracking-form-contents">
								<label>Health Benefits</label>
								<p className="statusTracking-field-content">
									{formData.benefits}
								</p>
							</div>
							<div className="statusTracking-form-contents">
								<label>If HMO, please specify:</label>
								<p className="statusTracking-field-content">
									{formData.hmo ? formData.hmo : "-"}
								</p>
							</div>
						</div>
					</>
				);
			case "admission":
				return (
					<>
						{defaultData}
						<hr></hr>
						<div className="statusTracking-form-container">
							<div className="statusTracking-form-contents">
								<label>Load</label>
								<p className="statusTracking-field-content">
									{formData.load ? formData.load : "-"}
								</p>
							</div>
							<div className="statusTracking-form-contents">
								<label>Status</label>
								<p className="statusTracking-field-content">
									{formData.status ? formData.status : "-"}
								</p>
							</div>
						</div>
					</>
				);
			case "eyeglasses":
				return (
					<>
						{defaultData}
						<hr></hr>
						<div className="statusTracking-form-container">
							<div className="statusTracking-form-contents">
								<label>OR Number</label>
								<p className="statusTracking-field-content">
									{formData.ORNumber
										? formData.ORNumber
										: "-"}
								</p>
							</div>
							<div className="statusTracking-form-contents">
								<label>Issued By</label>
								<p className="statusTracking-field-content">
									{formData.issuedBy
										? formData.issuedBy
										: "-"}
								</p>
							</div>
							<div className="statusTracking-form-contents">
								<label>Amount Paid</label>
								<p className="statusTracking-field-content">
									{formData.amountPaid
										? formData.amountPaid
										: "-"}
								</p>
							</div>
						</div>
					</>
				);
		}
	};
	// Define different submission details based on typeOfForm

	const getAttachments = (request: PendingRequest) => {
		const { formData } = request;
		const attachments = [
			formData.employeeID,
			formData.applicantSignature,
			...("docRequest" in formData ? [formData.docRequest] : []),
			...("hospitalInvoice" in formData
				? [formData.hospitalInvoice]
				: []),
			...("labInvoice" in formData ? [formData.labInvoice] : []),
		].filter((attachment) => attachment && attachment.filename);

		const renderThumbnail = (attachment: {
			url?: string;
			filename: string;
		}) => {
			const ext = attachment.filename.split(".").pop()?.toLowerCase();
			const imageTypes = ["png", "jpg", "jpeg", "gif", "svg"];
			if (ext && imageTypes.includes(ext) && attachment.url) {
				return (
					<img
						src={attachment.url}
						alt={attachment.filename}
						className="statusTracking-file-thumbnail"
					/>
				);
			} else if (ext === "pdf") {
				return (
					<div
						className="statusTracking-default-thumbnail"
						data-label="PDF"
					></div>
				);
			} else if (ext === "docx") {
				return (
					<div
						className="statusTracking-default-thumbnail"
						data-label="DOCX"
					></div>
				);
			} else {
				return (
					<div
						className="statusTracking-default-thumbnail"
						data-label="FILE"
					></div>
				);
			}
		};

		return (
			<>
				<hr></hr>
				<div className="statusTracking-attachments-section">
					<h4>UPLOADED ATTACHMENTS</h4>
					<div className="statusTracking-attachment-preview-container">
						{attachments.map((attachment, index) => (
							<div
								key={index}
								className="statusTracking-attachment-preview"
								onClick={() => setPreviewFile(attachment)}
								title={attachment.filename}
							>
								{renderThumbnail(attachment)}
								<p className="statusTracking-file-name">
									{attachment.filename}
								</p>
							</div>
						))}
					</div>
				</div>
			</>
		);
	};

	return (
		<>
			{pendingRequests
				.filter((request) => request.transactionId === transactionID)
				.map((request) => (
					<div
						key={request.transactionId}
						className="statusTracking-container"
					>
						<div className="statusTracking-transaction-header">
							<div className="statusTracking-transaction-id">
								TRANSACTION ID: <strong>{transactionID}</strong>
							</div>
							{/* Replace the old button with BackButton styling */}
							<div className="back-button" onClick={onBack}>
								<IoIosArrowBack
									size={20}
									style={{ marginRight: "0.5rem" }}
								/>
								<span>BACK</span>
							</div>
						</div>
						<div className="statusTracking-status-updates">
							<h3 className="statusTracking-status-title">
								STATUS UPDATES
							</h3>
							{getStatusUpdates(status, dateTime).map(
								(update, index) => (
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
											<span className="statusTracking-timestamp">
												{status === "Pending" &&
												(update.key === "reviewed" ||
													update.key === "processing")
													? "..."
													: update.time}
											</span>
										</div>
									</div>
								)
							)}
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
						<div className="statusTracking-submission-info-container">
							<div className="statusTracking-submission-header">
								<div className="statusTracking-submission-title">
									SUBMITTED INFORMATION
								</div>
							</div>
							<div className="statusTracking-submission-contents">
								{fields(request)}
								{getAttachments(request)}
							</div>
						</div>
					</div>
				))}
			{previewFile && (
				<ViewFiles file={previewFile} onClose={handleClosePreview} />
			)}
		</>
	);
};

export default StatusTracking;
