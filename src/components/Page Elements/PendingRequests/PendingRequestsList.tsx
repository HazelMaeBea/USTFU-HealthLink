import { useState } from "react";
import type { PendingRequest } from "./types";
import { mockPendingRequests } from "./mock-data";
import "./PendingRequests.css";

import { RiArrowDownSFill } from "react-icons/ri";
import { RiArrowRightSFill } from "react-icons/ri";
import { FiCheck } from "react-icons/fi";
import { HiOutlineX } from "react-icons/hi";
import { FiEdit2 } from "react-icons/fi";

const PendingRequestList = () => {
	const [expandedId, setExpandedId] = useState<string | null>(null);
	const [requests] = useState<PendingRequest[]>(mockPendingRequests);

	const renderFormFields = (request: PendingRequest) => {
		const { formData } = request;

		const baseFields = (
			<div className="form-grid">
				<div className="form-group">
					<label>Last Name</label>
					<input
						className="field-value"
						type="text"
						value={formData.lastname}
						readOnly
						aria-label="last name"
					/>
				</div>
				<div className="form-group">
					<label>First Name</label>
					<input
						className="field-value"
						type="text"
						value={formData.firstname}
						readOnly
						aria-label="first name"
					/>
				</div>
				<div className="form-group">
					<label>Middle Name</label>
					<input
						className="field-value"
						type="text"
						value={formData.middlename}
						readOnly
						aria-label="middle name"
					/>
				</div>
				<div className="form-group">
					<label>Suffix</label>
					<select
						className="field-value"
						disabled
						aria-label="suffix"
					>
						<option>None</option>
					</select>
				</div>
				<div className="form-group">
					<label>Age</label>
					<input
						className="field-value"
						type="text"
						value={formData.age}
						readOnly
						aria-label="age"
					/>
				</div>
				<div className="form-group">
					<label>Gender</label>
					<input
						className="field-value"
						type="text"
						value={formData.gender}
						readOnly
						aria-label="gender"
					/>
				</div>
				<div className="form-group">
					<label>College Affiliation</label>
					<input
						className="field-value"
						type="text"
						value={formData.college}
						readOnly
						aria-label="college"
					/>
				</div>
				<div className="form-group">
					<label>Contact No.</label>
					<input
						className="field-value"
						type="text"
						value={formData.contact}
						readOnly
						aria-label="contact"
					/>
				</div>
			</div>
		);

		switch (formData.formType) {
			case "hospital":
				return (
					<>
						{baseFields}
						<div className="form-grid">
							<div className="form-group">
								<label>Hospital</label>
								<input
									className="field-value"
									type="text"
									value={formData.hospital}
									readOnly
									aria-label="hospital"
								/>
							</div>
							<div className="form-group">
								<label>Nature of Illness</label>
								<input
									className="field-value"
									type="text"
									value={formData.illness}
									readOnly
									aria-label="illness"
								/>
							</div>
							<div className="form-group">
								<label>Physician</label>
								<input
									className="field-value"
									type="text"
									value={formData.physician}
									readOnly
									aria-label="physician"
								/>
							</div>
						</div>
					</>
				);

			case "eyeglasses":
				return (
					<>
						{baseFields}
						<div className="d-flex flex-wrap gap-3 mb-4">
							<div className="form-group">
								<label>OR Number</label>
								<input
									type="text"
									value={formData.ORNumber}
									readOnly
								/>
							</div>
							<div className="form-group">
								<label>Issued By</label>
								<input
									type="text"
									value={formData.issuedBy}
									readOnly
								/>
							</div>
							<div className="form-group">
								<label>Amount Paid</label>
								<input
									type="text"
									value={formData.amountPaid}
									readOnly
								/>
							</div>
						</div>
					</>
				);

			case "admission":
				return (
					<>
						{baseFields}
						<div className="d-flex flex-wrap gap-3 mb-4">
							<div className="form-group">
								<label>Load</label>
								<input
									type="text"
									value={formData.load}
									readOnly
								/>
							</div>
							<div className="form-group">
								<label>Status</label>
								<input
									type="text"
									value={formData.status}
									readOnly
								/>
							</div>
						</div>
					</>
				);
		}
	};

	const renderHospitalCertification = (request: PendingRequest) => {
		if (request.formData.formType !== "hospital") return null;

		return (
			<div className="hospital-certification">
				<div className="certification-header">To UST HOSPITAL:</div>
				<div className="certification-content">
					<p>
						This certifies that the above named faculty is entitled
						to the following benefit on his/her total charges
						(procedure, supplies, drugs and reader's fee) but not to
						exceed his/her remaining benefit subject to final
						verification:
					</p>
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
					<div className="benefit-amount">
						<span>but not to exceed:</span>
						<div className="amount-input">
							<span>₱</span>
							<input
								aria-label="amount left"
								type="text"
								value="82000.00"
								readOnly
							/>
						</div>
						<span className="amount-label">
							(Remaining benefit)
						</span>
					</div>
					<button className="check-history-btn">CHECK HISTORY</button>
				</div>
				<div className="signature-section">
					<div className="upload-box">
						<p>Please attach signature here.</p>
						<button className="upload-btn">UPLOAD</button>
					</div>
					<div className="signature-details">
						<p className="signature-name">Sylus Xavier</p>
						<p className="signature-title">USTFPU PRESIDENT</p>
						<p className="signature-subtitle">
							OR AUTHORIZED REPRESENTATIVE
						</p>
					</div>
				</div>
			</div>
		);
	};

	const renderAttachments = (request: PendingRequest) => {
		const { formData } = request;
		const attachments = [
			formData.employeeID,
			formData.applicantSignature,
			...("docRequest" in formData ? [formData.docRequest] : []),
			...("hospitalInvoice" in formData
				? [formData.hospitalInvoice]
				: []),
			...("labInvoice" in formData ? [formData.labInvoice] : []),
		];

		return (
			<div className="attachments-section">
				<h4>UPLOADED ATTACHMENTS</h4>
				<div className="attachment-list">
					{attachments.map((attachment, index) => (
						<div key={index} className="attachment-item">
							<span>{attachment.filename}</span>
							<button className="view-btn">View</button>
						</div>
					))}
				</div>
			</div>
		);
	};

	return (
		<div className="pending-requests">
			{requests.map((request) => (
				<div key={request.transactionId} className="pending-request">
					<div
						className={`request-header ${
							expandedId === request.transactionId
								? "expanded"
								: ""
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
							<div>TRANSACTION ID : {request.transactionId}</div>
							<div>REQUESTER : {request.requester}</div>
							<div>DATE : {request.dateSubmitted}</div>
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
								{request.formData.formType === "hospital"
									? request.formData.hospitalStatus.toUpperCase()
									: request.formData.formType.toUpperCase()}{" "}
								SUBMITTED FORM DETAILS
							</h3>
							{renderFormFields(request)}
							{renderAttachments(request)}
							{renderHospitalCertification(request)}

							<div className="approval-section">
								<h4>APPROVAL STEP</h4>
								<div className="approval-actions">
									<div className="action-buttons">
										<button className="approve-btn">
											<span className="icon">
												<FiCheck size={20} />
											</span>
											Approve
										</button>
										<button className="reject-btn">
											<span className="icon">
												<HiOutlineX size={20} />
											</span>
											Reject
										</button>
										<button className="revise-btn">
											<span className="icon">
												<FiEdit2 />
											</span>
											To Revise
										</button>
									</div>
									<div className="send-section">
										<p className="send-note">
											** Clicking the send button will
											finalize the decision and notify the
											requester. This action is
											irreversible.
										</p>
										<button className="send-btn">
											SEND
										</button>
									</div>
								</div>
							</div>
						</div>
					)}
				</div>
			))}
		</div>
	);
};

export default PendingRequestList;
