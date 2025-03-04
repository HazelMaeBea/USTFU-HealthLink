import React, { useState, useEffect } from "react";
import type { PendingRequest } from "./types";
import { usePendingRequests } from "./PendingRequestBackend"; // use the hook instead of mock data
import "./PendingRequests.css";
import { RiArrowDownSFill, RiArrowRightSFill } from "react-icons/ri";
import { FiCheck, FiEdit2 } from "react-icons/fi";
import { HiOutlineX } from "react-icons/hi";
import Popout from "../Popout/Popout";
import ViewFiles from "./ViewFiles";
import HistoryPopout from "./HistoryPopout";

const PendingRequestList = () => {
	const pendingRequests = usePendingRequests();
	const [expandedId, setExpandedId] = useState<string | null>(null);
	const [showCommentBox, setShowCommentBox] = useState<string | null>(
		"Additional Comments"
	);
	const [activeDecision, setActiveDecision] = useState<string | null>(
		"approval"
	);
	const [showPopout, setShowPopout] = useState<boolean>(false);
	const [previewFile, setPreviewFile] = useState<any>(null);
	const [showHistoryPopout, setShowHistoryPopout] = useState<boolean>(false);

	const handleAction = (action: "approval" | "rejection" | "for revision") => {
		setActiveDecision(action); // Store the decision type

		if (action === "rejection") {
			setShowCommentBox("Reason for rejection...");
		} else if (action === "for revision") {
			setShowCommentBox("Reason for revision...");
		} else {
			setShowCommentBox("Additional Comments..."); // Hide comment box when approving
			// setShowPopout(true);
		}
	};

	const handleSendClick = () => {
		if (!activeDecision) return; // Prevent sending if no action is selected
		setShowPopout(true); // Open confirmation popout
	};

	const handleConfirm = () => {
		console.log(`Confirmed: ${activeDecision}`);
		setShowPopout(false); // Close the popout after confirmation
		setShowCommentBox(null);
	};

	const handleCancel = () => {
		setShowPopout(false); // Close popout without confirming
	};

	const handleClosePreview = () => {
		setPreviewFile(null);
	};

	const handleCheckHistory = () => {
		setShowHistoryPopout(true); // Open history popout
	};

	const handleCloseHistory = () => {
		setShowHistoryPopout(false); // Close history popout
	};

	// Helper function to convert camelCase to Title Case with spaces
	const formatDocumentType = (camelCaseKey: string): string => {
		// Special case for ID
		if (camelCaseKey === "employeeID") return "Employee ID";

		// Handle other keys by splitting camelCase and capitalizing
		return (
			camelCaseKey
				// Insert a space before all capital letters
				.replace(/([A-Z])/g, " $1")
				// Capitalize first letter
				.replace(/^./, (str) => str.toUpperCase())
		);
	};

	const renderFormFields = (request: PendingRequest) => {
		const { formData } = request;

		const baseFields = (
			<>
				<hr className="yellow"></hr>
				<div className="form-grid">
					<div className="form-group">
						<label>Last Name</label>
						<p className="field-value">{formData.lastname}</p>
					</div>
					<div className="form-group">
						<label>First Name</label>
						<p className="field-value">{formData.firstname}</p>
					</div>
					<div className="form-group">
						<label>Middle Name</label>
						<p className="field-value">{formData.middlename}</p>
					</div>
					<div className="form-group">
						<label>Suffix</label>
						<p className="field-value">
							{formData.suffix ? formData.suffix : "-"}
						</p>
					</div>
				</div>
				<div className="form-second-row-grid">
					<div className="form-group">
						<label>Age</label>
						<p className="field-value">{formData.age}</p>
					</div>
					<div className="form-group pending-request-gender-field">
						<label>Gender</label>
						<p className="field-value">{formData.gender}</p>
					</div>
					<div className="form-group pending-request-college-field">
						<label>College Affiliation</label>
						<p className="field-value">{formData.college}</p>
					</div>
					<div className="form-group pending-request-contact-field">
						<label>Contact No.</label>
						<p className="field-value">{formData.contact}</p>
					</div>
				</div>
			</>
		);

		switch (formData.formType) {
			case "hospital":
				return (
					<>
						{baseFields}
						<hr></hr>
						<div className="form-grid">
							<div className="form-group">
								<label>Hospital</label>
								<p className="field-value">{formData.hospital}</p>
							</div>
							<div className="form-group">
								<label>Nature of Illness</label>
								<p className="field-value">{formData.illness}</p>
							</div>
							<div className="form-group">
								<label>Physician</label>
								<p className="field-value">{formData.physician}</p>
							</div>
							<div className="form-group">
								<label>Procedure</label>
								<p className="field-value">{formData.procedures}</p>
							</div>
						</div>
						<hr></hr>
						<div className="form-grid">
							<div className="form-group">
								<label>Academic Term</label>
								<p className="field-value">{formData.term}</p>
							</div>
							<div className="form-group">
								<label>Academic Year</label>
								<p className="field-value">{formData.year}</p>
							</div>
							<div className="form-group">
								<label>Teaching Load</label>
								<p className="field-value">{formData.load}</p>
							</div>
							<div className="form-group">
								<label>Status</label>
								<p className="field-value">{formData.status || "-"}</p>
							</div>
							<div className="form-group">
								<label>Date Hired:</label>
								<p className="field-value">
									{formData.dateHired
										? new Date(formData.dateHired).toLocaleDateString()
										: "-"}
								</p>
							</div>
							<div className="form-group">
								<label>Date Retired:</label>
								<p className="field-value">
									{formData.dateRetired
										? new Date(formData.dateRetired).toLocaleDateString()
										: "-"}
								</p>
							</div>
							<div className="form-group">
								<label>Health Benefits</label>
								<p className="field-value">{formData.benefits}</p>
							</div>
							<div className="form-group">
								<label>If HMO, please specify:</label>
								<p className="field-value">
									{formData.hmo ? formData.hmo : "-"}
								</p>
							</div>
						</div>
					</>
				);

			case "eyeglasses":
				return (
					<>
						{baseFields}
						<div className="form-eyeglasses-row-grid">
							<div className="form-group">
								<label>OR Number</label>
								<p className="field-value">
									{formData.ORNumber ? formData.ORNumber : "-"}
								</p>
							</div>
							<div className="form-group">
								<label>Issued By</label>
								<p className="field-value">
									{formData.issuedBy ? formData.issuedBy : "-"}
								</p>
							</div>
							<div className="form-group">
								<label>Amount Paid</label>
								<p className="field-value">
									{formData.amountPaid ? formData.amountPaid : "-"}
								</p>
							</div>
						</div>
					</>
				);

			case "admission":
				return (
					<>
						{baseFields}
						<div className="form-admission-row-grid">
							<div className="form-group">
								<label>Load</label>
								<p className="field-value">
									{formData.load ? formData.load : "-"}
								</p>
							</div>
							<div className="form-group">
								<label>Status</label>
								<p className="field-value">
									{formData.status ? formData.status : "-"}
								</p>
							</div>
						</div>
					</>
				);
		}
	};

	const renderAttachments = (request: PendingRequest) => {
		const { formData } = request;

		// Create an array of objects that include both the attachment and its type
		const attachmentsWithLabels = [
			{ type: "employeeID", data: formData.employeeID },
			{ type: "applicantSignature", data: formData.applicantSignature },
			...("docRequest" in formData
				? [{ type: "docRequest", data: formData.docRequest }]
				: []),
			...("hospitalInvoice" in formData
				? [{ type: "hospitalInvoice", data: formData.hospitalInvoice }]
				: []),
			...("labInvoice" in formData
				? [{ type: "labInvoice", data: formData.labInvoice }]
				: []),
		].filter((item) => item.data && item.data.filename);

		// Helper: check file extension and return appropriate content
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
						className="file-thumbnail"
					/>
				);
			} else if (ext === "pdf") {
				return <div className="default-thumbnail" data-label="PDF"></div>;
			} else if (ext === "docx") {
				return <div className="default-thumbnail" data-label="DOCX"></div>;
			} else {
				return <div className="default-thumbnail" data-label="FILE"></div>;
			}
		};

		return (
			<>
				<hr />
				<div className="attachments-section">
					<h4>UPLOADED ATTACHMENTS</h4>
					<div className="attachment-preview-container">
						{attachmentsWithLabels.map((item, index) => (
							<div
								key={index}
								className="attachment-preview"
								onClick={() => setPreviewFile(item.data)}
								title={item.data.filename}
							>
								<div className="thumbnail-container">
									{renderThumbnail(item.data)}
								</div>
								<div className="file-info">
									<p className="document-type">
										{formatDocumentType(item.type)}
									</p>
									<p className="file-name">{item.data.filename}</p>
								</div>
							</div>
						))}
					</div>
				</div>
			</>
		);
	};

	const renderHospitalCertification = (request: PendingRequest) => {
		if (request.formData.formType !== "hospital") return null;

		return (
			<>
				<hr></hr>
				<div className="d-flex flex-column align-items-center">
					<div className="hospital-certification row flex-column flex-md-row">
						{/* Left Section */}
						<div className="col-12 col-md-8">
							<div className="certification-header">To UST HOSPITAL:</div>
							<div className="certification-content">
								<p>
									This certifies that the above named faculty is entitled to the
									following benefit on his/her total charges (procedure,
									supplies, drugs and reader's fee) but not to exceed his/her
									remaining benefit subject to final verification:
								</p>
								<div className="row justify-content-center align-content-center">
									<div className="col-12 col-md-4">
										<div className="benefit-options">
											<label className="radio-option">
												<input type="radio" name="benefit" value="50" />
												<span>50% of net hospital bill</span>
											</label>
											<label className="radio-option">
												<input
													type="radio"
													name="benefit"
													value="100"
													checked
													readOnly
												/>
												<span>100% of net hospital bill</span>
											</label>
										</div>
									</div>
									<div className="amount col-12 col-md-8 d-flex flex-column align-items-center text-center">
										<span className="mb-2">but not to exceed:</span>
										<div className="amount-container p-3 rounded shadow">
											<div className="amount-input-wrapper d-flex align-items-center">
												<span className="currency"></span>
												<input
													aria-label="amount left"
													type="text"
													value="82000.00"
													disabled
													className="amount-input"
												/>
											</div>
											<span className="amount-label">(Remaining benefit)</span>
										</div>
										<button
											className="check-history-btn mt-3"
											onClick={handleCheckHistory}
										>
											CHECK HISTORY
										</button>
									</div>
								</div>
							</div>
						</div>

						{/* Right Section (Signature Upload) */}
						<div className="signature col-12 col-md-4 d-flex flex-column justify-content-center align-items-center">
							<div className="signature-section row text-center">
								<div className="upload-box">
									<p>Please attach signature here.</p>
									<button className="upload-btn">UPLOAD</button>
								</div>
								<div className="signature-details col">
									<input
										type="text"
										className="signature-name-input"
										defaultValue="Emerito C. Gonzales"
										aria-label="USTFU President"
									/>
									<p className="signature-title">USTFU PRESIDENT</p>
									<p className="signature-subtitle">
										OR AUTHORIZED REPRESENTATIVE
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</>
		);
	};

	return (
		<div className="pending-requests">
			{pendingRequests.map((request) => (
				<div key={request.transactionId} className="pending-request">
					<div
						className={`request-header ${
							expandedId === request.transactionId ? "expanded" : ""
						}`}
						onClick={() =>
							setExpandedId(
								expandedId === request.transactionId
									? null
									: request.transactionId
							)
						}
					>
						<div className="header-content">
							<div>
								<span className="header-details">TRANSACTION ID: </span>
								{request.transactionId}
							</div>
							<div>
								<span className="header-details">REQUESTER: </span>
								{request.requester}
							</div>
							<div>
								<span className="header-details">DATE: </span>
								{request.dateSubmitted}
							</div>
							<span className="arrow">
								{expandedId === request.transactionId ? (
									<RiArrowDownSFill size={30} />
								) : (
									<RiArrowRightSFill size={30} />
								)}
							</span>
						</div>
					</div>

					{expandedId === request.transactionId && (
						<div className="request-content">
							<h3>
								{/* Form Type with conditional layout based on origFormType and hospitalStatus */}
								{request.formData.formType === "hospital" &&
								request.formData.origFormType ? (
									<>
										{/* Case 1: origFormType and hospitalStatus both match "inpatient" */}
										{request.formData.origFormType.toLowerCase() ===
											"inpatient" &&
										request.formData.hospitalStatus?.toLowerCase() ===
											"in-patient" ? (
											"INPATIENT"
										) : /* Case 2: origFormType and hospitalStatus both match "outpatient" */
										request.formData.origFormType.toLowerCase() ===
												"outpatient" &&
										  request.formData.hospitalStatus?.toLowerCase() ===
												"out-patient" ? (
											"OUTPATIENT"
										) : (
											/* Case 3: Mixed case - show both with parentheses */
											<>
												{request.formData.origFormType.toUpperCase()}
												{request.formData.hospitalStatus && (
													<>
														{" "}
														(DONE AS{" "}
														{request.formData.hospitalStatus.toUpperCase()})
													</>
												)}
											</>
										)}
									</>
								) : (
									/* Default case: just use formType if origFormType is missing */
									request.formData.formType.toUpperCase()
								)}{" "}
								SUBMITTED FORM DETAILS
							</h3>

							{renderFormFields(request)}
							{renderAttachments(request)}
							{renderHospitalCertification(request)}

							<hr></hr>
							<div className="approval-section">
								<h4 className="text-center text-md-start">APPROVAL STEP</h4>

								{/* Action Buttons - Centered on small screens, inline on larger screens */}
								<div className="approval-actions-container">
									<div className="approval-actions">
										<button
											className="approve-btn d-flex align-items-center justify-content-center"
											onClick={() => handleAction("approval")}
										>
											<FiCheck size={20} />
											<span className="ms-2">Approve</span>
										</button>
										<button
											className="reject-btn d-flex align-items-center justify-content-center"
											onClick={() => handleAction("rejection")}
										>
											<HiOutlineX size={20} />
											<span className="ms-2">Reject</span>
										</button>
										<button
											className="revise-btn d-flex align-items-center justify-content-center"
											onClick={() => handleAction("for revision")}
										>
											<FiEdit2 size={20} />
											<span className="ms-2">To Revise</span>
										</button>
									</div>

									{showCommentBox && (
										<textarea
											className="comment-box"
											placeholder={showCommentBox}
										/>
									)}
								</div>

								{/* Send Button Section - Centered on small screens, bottom-right on large screens */}
								<div className="send-section">
									<p className="send-note">
										** Clicking the send button will finalize the decision and
										notify the requester. This action is irreversible.
									</p>
									<button className="send-btn" onClick={handleSendClick}>
										SEND
									</button>
								</div>
							</div>
						</div>
					)}
				</div>
			))}
			{showPopout && (
				<Popout
					title="Confirm Decision"
					message={`Send out ${activeDecision} notice?`}
					onConfirm={handleConfirm}
					onCancel={handleCancel}
					isOpen={showPopout}
				/>
			)}
			{previewFile && (
				<ViewFiles file={previewFile} onClose={handleClosePreview} />
			)}
			{showHistoryPopout && (
				<HistoryPopout onClose={handleCloseHistory} /> // Render the history popout
			)}
		</div>
	);
};

export default PendingRequestList;
