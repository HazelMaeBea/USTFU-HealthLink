import { useState, useRef, useEffect } from "react";
import type { PendingRequest } from "./types";
import {
	getRemainingBenefits,
	updateBenefits,
	updateDocument,
	usePendingRequests,
} from "./PendingRequestBackend"; // use the hook instead of mock data
import styles from "./PendingRequestList.module.css"; // Change CSS import to use module
import { RiArrowDownSFill, RiArrowRightSFill } from "react-icons/ri";
import { FiCheck, FiEdit2 } from "react-icons/fi";
import { HiOutlineX } from "react-icons/hi";
import Popout from "../Popout/Popout";
import ViewFiles from "./ViewFiles";
import HistoryPopout from "./HistoryPopout";
import PageButtons from "../PageButtons/PageButtons"; // Import the PageButtons component
import PendingRequestsLoadingSkeleton from "./PendingRequestsLoadingSkeleton";
import unreadPending from "../NotifBadge/unreadPending";
import useNotifications from "../NotifBadge/NotifTrigger";
import { useFirebase } from "../../../contexts/firebaseContext";

interface PendingRequestListProps {
	searchQuery?: string;
	selectedType?: string;
	filters?: string[];
}

const PendingRequestList: React.FC<PendingRequestListProps> = ({
	searchQuery = "",
	selectedType = "All",
	filters = [],
}) => {
	// Increase the page size to fetch ALL items at once
	const {
		requests: pendingRequests,
		pagination,
		setCurrentPage,
		isLoading,
		error,
		fetchData,
	} = usePendingRequests(1, 1000); // Fetch up to 1000 items to ensure we get all

	// Add state for client-side pagination
	const [clientCurrentPage, setClientCurrentPage] = useState(1);
	const recordsPerPage = 7; // Number of records to display per page

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
	const [currentRequester, setCurrentRequester] = useState<string | null>(null);
	const [signatureImage, setSignatureImage] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Hooks to access benefits
	const [getBenefits, setBenefits] = useState<number>(0);
	const [getEditBenefits, setEditBenefits] = useState<number>(1);
	// Hooks to access submit fields
	const [getText, setText] = useState<string | null>(null);
	// Hooks to access transactionID
	const [getTransID, setTransID] = useState<string | null>(null);
	// Hooks to access document status
	const [getStatus, setStatus] = useState<string | null>(null);
	const [getCurrentUser, setCurrentUser] = useState<string | null>(null);
	// Add validUntil state
	const [validUntil, setValidUntil] = useState<string>("");

	const { uid } = useFirebase();
	const { unreadTransactionIds } = unreadPending();
	const { clearPendingNotifications } = useNotifications({
		uid: uid,
		selectedRole: "operations handler",
	});

	// Handle change on textArea
	const handleTextArea = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
		setText(event.target.value); // Update state with textarea value
	};

	// Handle page change from the PageButtons component
	const handlePageChange = (page: number) => {
		setClientCurrentPage(page);
		// Reset expanded state when changing pages
		setExpandedId(null);

		// DO NOT call backend pagination as we're handling it client-side
		// We want to keep all the records loaded and just show different pages
	};

	// Reset expanded state when loading new data
	useEffect(() => {
		if (isLoading) {
			setExpandedId(null);
		}
	}, [isLoading]);

	// Reset to page 1 when search query or filters change
	useEffect(() => {
		// Only reset if we're not already on page 1
		if (pagination.currentPage !== 1) {
			setCurrentPage(1);
		}
	}, [searchQuery, selectedType, filters]);

	const handleAction = (action: "approval" | "rejection" | "for revision") => {
		setActiveDecision(action); // Store the decision type

		if (action === "rejection") {
			setShowCommentBox("Reason for rejection...");
			setStatus("rejected");
		} else if (action === "for revision") {
			setShowCommentBox("Reason for revision...");
			setStatus("for revision");
		} else {
			setShowCommentBox("Additional Comments..."); // Hide comment box when approving
			setStatus("approved");
			// setShowPopout(true);
		}
	};

	const handleSendClick = (transactionID: string) => {
		if (!activeDecision) return; // Prevent sending if no action is selected
		setTransID(transactionID);
		// Include validUntil in the data to be sent
		setShowPopout(true); // Open confirmation popout
	};

	const handleConfirm = async () => {
		console.log(`Confirmed: ${activeDecision}`);
		console.log("Current status:", getStatus);
		try {
			const transID = getTransID || "empty";
			const textArea = getText || "empty";
			const updateStatus = getStatus || "pending";
			// Include validUntil when updating the document
			updateDocument(transID, textArea, updateStatus, validUntil);
			if (getBenefits !== getEditBenefits) {
				await updateBenefits(getEditBenefits, getCurrentUser);
			}

			// 🚩 Manually re-fetch the list after confirmation
			await fetchData();
		} catch (error) {
			console.error(error);
		}

		// console.log(getText);
		setShowPopout(false); // Close the popout after confirmation
		setShowCommentBox(null);
	};

	const handleCancel = () => {
		setShowPopout(false); // Close popout without confirming
	};

	const handleClosePreview = () => {
		setPreviewFile(null);
	};

	const handleCheckHistory = (requester: string) => {
		setCurrentRequester(requester);
		setShowHistoryPopout(true); // Open history popout
	};

	const handleCloseHistory = () => {
		setShowHistoryPopout(false); // Close history popout
	};

	const handleUploadClick = () => {
		// Trigger the hidden file input click
		if (fileInputRef.current) {
			fileInputRef.current.click();
		}
	};

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = (e) => {
				setSignatureImage(e.target?.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

	const handleRemoveSignature = () => {
		setSignatureImage(null);
		// Clear the file input
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
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
				<hr className={styles.yellow}></hr>
				<div className={styles["form-grid"]}>
					<div className={styles["form-group"]}>
						<label>Last Name</label>
						<p className={styles["field-value"]}>{formData?.lastname}</p>
					</div>
					<div className={styles["form-group"]}>
						<label>First Name</label>
						<p className={styles["field-value"]}>{formData?.firstname}</p>
					</div>
					<div className={styles["form-group"]}>
						<label>Middle Name</label>
						<p className={styles["field-value"]}>{formData?.middlename}</p>
					</div>
					<div className={styles["form-group"]}>
						<label>Suffix</label>
						<p className={styles["field-value"]}>
							{formData?.suffix ? formData?.suffix : "-"}
						</p>
					</div>
				</div>
				<div className={styles["form-second-row-grid"]}>
					<div className={styles["form-group"]}>
						<label>Age</label>
						<p
							className={`${styles["field-value"]} ${styles["field-numeric"]}`}
						>
							{formData?.age}
						</p>
					</div>
					<div
						className={`${styles["form-group"]} ${styles["pending-request-gender-field"]}`}
					>
						<label>Gender</label>
						<p className={styles["field-value"]}>{formData?.gender}</p>
					</div>
					<div
						className={`${styles["form-group"]} ${styles["pending-request-college-field"]}`}
					>
						<label>College Affiliation</label>
						<p className={styles["field-value"]}>{formData?.college}</p>
					</div>
					<div
						className={`${styles["form-group"]} ${styles["pending-request-contact-field"]}`}
					>
						<label>Contact No.</label>
						<p className={styles["field-value"]}>{formData?.contact}</p>
					</div>
				</div>
			</>
		);

		switch (formData?.formType) {
			case "hospital":
				return (
					<>
						{baseFields}
						<hr></hr>
						<div className={styles["form-grid"]}>
							<div className={styles["form-group"]}>
								<label>Hospital</label>
								<p className={styles["field-value"]}>{formData?.hospital}</p>
							</div>
							<div className={styles["form-group"]}>
								<label>Nature of Illness</label>
								<p className={styles["field-value"]}>{formData?.illness}</p>
							</div>
							<div className={styles["form-group"]}>
								<label>Physician</label>
								<p className={styles["field-value"]}>{formData?.physician}</p>
							</div>
							<div className={styles["form-group"]}>
								<label>Procedure</label>
								<p className={styles["field-value"]}>{formData?.procedures}</p>
							</div>
						</div>
						<hr></hr>
						<div className={styles["form-grid"]}>
							<div className={styles["form-group"]}>
								<label>Academic Term</label>
								<p className={styles["field-value"]}>{formData?.term}</p>
							</div>
							<div className={styles["form-group"]}>
								<label>Academic Year</label>
								<p className={styles["field-value"]}>{formData?.year}</p>
							</div>
							<div className={styles["form-group"]}>
								<label>Teaching Load</label>
								<p
									className={`${styles["field-value"]} ${styles["field-numeric"]}`}
								>
									{formData?.load}
								</p>
							</div>
							<div className={styles["form-group"]}>
								<label>Status</label>
								<p className={styles["field-value"]}>
									{formData?.status || "-"}
								</p>
							</div>
							<div className={styles["form-group"]}>
								<label>Date Hired:</label>
								<p
									className={`${styles["field-value"]} ${styles["field-date"]}`}
								>
									{formData?.dateHired
										? new Date(formData?.dateHired).toLocaleDateString()
										: "-"}
								</p>
							</div>
							<div className={styles["form-group"]}>
								<label>Date Retired:</label>
								<p
									className={`${styles["field-value"]} ${styles["field-date"]}`}
								>
									{formData?.dateRetired
										? new Date(formData?.dateRetired).toLocaleDateString()
										: "-"}
								</p>
							</div>
							<div className={styles["form-group"]}>
								<label>Health Benefits</label>
								<p className={styles["field-value"]}>{formData?.benefits}</p>
							</div>
							<div className={styles["form-group"]}>
								<label>If HMO, please specify:</label>
								<p className={styles["field-value"]}>
									{formData?.hmo ? formData?.hmo : "-"}
								</p>
							</div>
						</div>
					</>
				);

			case "eyeglasses":
				return (
					<>
						{baseFields}
						<div className={styles["form-eyeglasses-row-grid"]}>
							<div className={styles["form-group"]}>
								<label>OR Number</label>
								<p className={styles["field-value"]}>
									{formData?.ORNumber ? formData?.ORNumber : "-"}
								</p>
							</div>
							<div className={styles["form-group"]}>
								<label>Issued By</label>
								<p className={styles["field-value"]}>
									{formData?.issuedBy ? formData?.issuedBy : "-"}
								</p>
							</div>
							<div className={styles["form-group"]}>
								<label>Amount Paid</label>
								<p
									className={`${styles["field-value"]} ${styles["field-currency"]}`}
								>
									{formData?.amountPaid ? formData?.amountPaid : "-"}
								</p>
							</div>
						</div>
					</>
				);

			case "admission":
				return (
					<>
						{baseFields}
						<div className={styles["form-admission-row-grid"]}>
							<div className={styles["form-group"]}>
								<label>Load</label>
								<p
									className={`${styles["field-value"]} ${styles["field-numeric"]}`}
								>
									{formData?.load ? formData?.load : "-"}
								</p>
							</div>
							<div className={styles["form-group"]}>
								<label>Status</label>
								<p className={styles["field-value"]}>
									{formData?.status ? formData?.status : "-"}
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
			{ type: "employeeID", data: formData?.employeeID },
			{ type: "applicantSignature", data: formData?.applicantSignature },
			...("docRequest" in [formData]
				? [{ type: "docRequest", data: formData?.docRequest }]
				: []),
			...("hospitalInvoice" in [formData]
				? [{ type: "hospitalInvoice", data: formData?.hospitalInvoice }]
				: []),
			...("labInvoice" in [formData]
				? [{ type: "labInvoice", data: formData?.labInvoice }]
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
						className={styles["file-thumbnail"]}
					/>
				);
			} else if (ext === "pdf") {
				return (
					<div className={styles["default-thumbnail"]} data-label="PDF"></div>
				);
			} else if (ext === "docx") {
				return (
					<div className={styles["default-thumbnail"]} data-label="DOCX"></div>
				);
			} else {
				return (
					<div className={styles["default-thumbnail"]} data-label="FILE"></div>
				);
			}
		};

		return (
			<>
				<hr />
				<div className={styles["attachments-section"]}>
					<h4>UPLOADED ATTACHMENTS</h4>
					<div className={styles["attachment-preview-container"]}>
						{attachmentsWithLabels.map((item, index) => (
							<div
								key={index}
								className={styles["attachment-preview"]}
								onClick={() => setPreviewFile(item.data)}
								title={item.data?.filename}
							>
								<div className={styles["thumbnail-container"]}>
									{renderThumbnail(item.data)}
								</div>
								<div className={styles["file-info"]}>
									<p className={styles["document-type"]}>
										{formatDocumentType(item.type)}
									</p>
									<p className={styles["file-name"]}>{item.data?.filename}</p>
								</div>
							</div>
						))}
					</div>
				</div>
			</>
		);
	};

	const renderHospitalCertification = (request: PendingRequest) => {
		if (request.formData?.formType !== "hospital") return null;
		getRemainingBenefits(request.requester)
			.then((result) => {
				setBenefits(result);
			})
			.catch((error) => {
				console.error("Error fetching remainingBenefits:", error);
			});

		return (
			<>
				<hr></hr>
				<div className={styles["hospital-certification"]}>
					<h4 className={styles["section-header"]}>To UST HOSPITAL</h4>
					<div className={styles["certification-content"]}>
						<p className="text-center">
							This certifies that the above named faculty is entitled to the
							following benefit on his/her total charges (procedure, supplies,
							drugs and reader's fee) but not to exceed his/her remaining
							benefit subject to final verification:
						</p>

						{/* Valid Until Date Field */}
						<div className={styles["valid-until-container"]}>
							<label htmlFor="valid-until">Valid Until:</label>
							<input
								type="date"
								id="valid-until"
								className={styles["valid-until-input"]}
								value={validUntil}
								onChange={(e) => setValidUntil(e.target.value)}
							/>
						</div>

						<div className={styles["hospital-certification-grid"]}>
							{/* Benefit Options */}
							<div className={styles["benefit-options-container"]}>
								<div className={styles["benefit-options"]}>
									<label className={styles["radio-option"]}>
										<input type="radio" name="benefit" value="50" />
										<span>50% of net hospital bill</span>
									</label>
									<label className={styles["radio-option"]}>
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

							{/* Amount section */}
							<div className={styles["amount-section"]}>
								<span className="mb-2">but not to exceed:</span>
								<div
									className={`${styles["amount-container"]} p-3 rounded shadow`}
								>
									<div
										className={`${styles["amount-input-wrapper"]} d-flex align-items-center`}
									>
										<span className={styles.currency}></span>
										<input
											aria-label="amount left"
											type="text"
											defaultValue={getBenefits}
											className={styles["amount-input"]}
											onChange={(e) => {
												setEditBenefits(parseInt(e.target.value));
											}}
										/>
									</div>
									<span className={styles["amount-label"]}>
										(Remaining benefit)
									</span>
								</div>
								<button
									className={`${styles["check-history-btn"]} mt-3`}
									onClick={() => handleCheckHistory(request.requester)}
								>
									CHECK HISTORY
								</button>
							</div>

							{/* Signature Upload */}
							<div className={styles["signature-container"]}>
								<div className={styles["signature-section"]}>
									<div className={styles["upload-box"]}>
										{signatureImage ? (
											<div className={styles["signature-preview"]}>
												<img
													src={signatureImage}
													alt="Signature"
													className={styles["uploaded-signature"]}
												/>
												<button
													className={styles["remove-signature-btn"]}
													onClick={handleRemoveSignature}
													title="Remove signature"
												>
													x
												</button>
											</div>
										) : (
											<>
												<p>Please attach signature here.</p>
												<button
													className={styles["upload-btn"]}
													onClick={handleUploadClick}
												>
													UPLOAD
												</button>
												<input
													type="file"
													ref={fileInputRef}
													className={styles["hidden-file-input"]}
													accept="image/*"
													onChange={handleFileChange}
												/>
											</>
										)}
									</div>
									<div className={styles["signature-details"]}>
										<input
											type="text"
											className={styles["signature-name-input"]}
											defaultValue="Emerito C. Gonzales"
											aria-label="USTFU President"
										/>
										<p className={styles["signature-title"]}>USTFU PRESIDENT</p>
										<p className={styles["signature-subtitle"]}>
											OR AUTHORIZED REPRESENTATIVE
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</>
		);
	};

	// Apply all filters to the requests
	const applyFilters = (requests: PendingRequest[]) => {
		return requests.filter((request) => {
			if (!request) return false;

			// Type filter (form type)
			// Fix: Check formType instead of origFormType and handle hospital forms correctly
			const matchesType =
				selectedType === "All" ||
				request.formData?.formType?.toLowerCase() === selectedType ||
				// For hospital forms, check if it's inpatient or outpatient
				(selectedType === "hospital" &&
					request.formData?.formType === "hospital") ||
				// For specific hospital types
				(request.formData?.formType === "hospital" &&
					((selectedType === "inpatient" &&
						request.formData?.hospitalStatus
							?.toLowerCase()
							?.includes("in-patient")) ||
						(selectedType === "outpatient" &&
							request.formData?.hospitalStatus
								?.toLowerCase()
								?.includes("out-patient"))));

			// Search query (unchanged)
			const matchesSearch =
				!searchQuery.trim() ||
				request.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				request.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				request.status?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				request.studentId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				request.requester?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				request.transactionId
					?.toLowerCase()
					.includes(searchQuery.toLowerCase()) ||
				request.formData?.firstname
					?.toLowerCase()
					.includes(searchQuery.toLowerCase()) ||
				request.formData?.lastname
					?.toLowerCase()
					.includes(searchQuery.toLowerCase()) ||
				request.formData?.middlename
					?.toLowerCase()
					.includes(searchQuery.toLowerCase());

			// Other filters (unchanged)
			const matchesFilters = filters.every((filter) => {
				const [filterType, filterValue] = filter.split(": ");

				if (filterType === "College") {
					return filterValue.split(", ").includes(request.formData?.college);
				} else if (filterType === "Status") {
					return filterValue.split(", ").includes(request.formData?.status);
				} else if (filterType === "Date") {
					// Handle date filter
					const [startDateStr, endDateStr] = filterValue.split(" - ");
					const [startMonth, startDay, startYear] = startDateStr.split("/");
					const [endMonth, endDay, endYear] = endDateStr.split("/");

					const startDate = new Date(
						parseInt(startYear),
						parseInt(startMonth) - 1,
						parseInt(startDay)
					);

					const endDate = new Date(
						parseInt(endYear),
						parseInt(endMonth) - 1,
						parseInt(endDay),
						23,
						59,
						59
					);

					const requestDate = request.dateSubmitted
						? new Date(request.dateSubmitted)
						: null;
					return requestDate
						? requestDate >= startDate && requestDate <= endDate
						: false;
				}
				return true;
			});

			return matchesType && matchesSearch && matchesFilters;
		});
	};

	// Apply filters to get filtered requests
	const filteredRequests = applyFilters(pendingRequests);

	// Calculate pagination for filtered results
	const totalFilteredPages = Math.max(
		1,
		Math.ceil(filteredRequests.length / recordsPerPage)
	);

	// Get current page's records for display
	const indexOfLastRecord = clientCurrentPage * recordsPerPage;
	const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
	const currentFilteredRecords = filteredRequests.slice(
		indexOfFirstRecord,
		indexOfLastRecord
	);

	// For debugging - let's see what data we're getting
	console.log("Original requests count:", pendingRequests.length);
	console.log("Filtered requests count:", filteredRequests.length);
	console.log("Records per page:", recordsPerPage);
	console.log("Total filtered pages:", totalFilteredPages);
	console.log("Current page:", clientCurrentPage);
	console.log("Current records:", currentFilteredRecords.length);

	// Show loading skeleton when data is loading
	if (isLoading) {
		return <PendingRequestsLoadingSkeleton />;
	}

	// Show error message if there was a problem loading the data
	if (error) {
		return (
			<div className={styles["pending-requests"]}>
				<div className={styles["error-message"]}>
					<p>{error}</p>
					<button onClick={() => setCurrentPage(1)}>Retry</button>
				</div>
			</div>
		);
	}

	// Check if there are no pending requests
	if (!filteredRequests || filteredRequests.length === 0) {
		return (
			<div className={styles["pending-requests"]}>
				<div className={styles["empty-state"]}>
					<h3>No pending requests</h3>
					<p>There are no requests waiting for your approval at this time.</p>
				</div>
			</div>
		);
	}

	return (
		<div className={styles["pending-requests"]}>
			{filteredRequests.length > 0 ? (
				// Map through the current page of filtered records
				currentFilteredRecords.map((request) => (
					<div
						key={request.transactionId}
						className={styles["pending-request"]}
					>
						<div
							className={`${styles["request-header"]} ${
								expandedId === request.transactionId ? styles.expanded : ""
							} ${
								unreadTransactionIds?.includes(request.transactionId)
									? styles.highlight
									: ""
							}`}
							onClick={async () => {
								setExpandedId(
									expandedId === request.transactionId
										? null
										: request.transactionId
								);
								setEditBenefits(getBenefits);
								setCurrentUser(request.requester);
								await clearPendingNotifications();
							}}
						>
							<div className={styles["header-content"]}>
								<div className={styles["header-item"]}>
									<span className={styles["request-type"]}>
										{request.formData?.formType === "hospital"
											? "Hospital"
											: request.formData?.formType}
									</span>
								</div>

								{/* Date */}
								<div className={styles["header-item"]}>
									<span className={styles["header-label"]}>Date</span>
									<span className={styles["header-value"]}>
										{request.dateSubmitted}
									</span>
								</div>

								{/* Requester */}
								<div className={styles["header-item"]}>
									<span className={styles["header-label"]}>Requester</span>
									<span className={styles["header-value"]}>
										{request.requester}
									</span>
								</div>

								{/* Transaction ID */}
								<div className={styles["header-item"]}>
									<span className={styles["header-label"]}>Transaction ID</span>
									<span className={styles["header-value"]}>
										{request.transactionId}
									</span>
								</div>

								{/* Arrow moved to the end */}
								<span className={styles.arrow}>
									{expandedId === request.transactionId ? (
										<RiArrowDownSFill size={24} />
									) : (
										<RiArrowRightSFill size={24} />
									)}
								</span>
							</div>
						</div>

						{expandedId === request.transactionId && (
							<div className={styles["request-content"]}>
								{/* Move "done as" to appear under the main title */}
								<h3>
									{request.formData?.formType === "hospital" ? (
										<>
											{request.formData?.hospitalStatus?.toLowerCase() ===
											"in-patient"
												? "INPATIENT"
												: request.formData?.hospitalStatus?.toLowerCase() ===
												  "out-patient"
												? "OUTPATIENT"
												: "HOSPITAL"}{" "}
											SUBMITTED FORM DETAILS
											{request.formData?.hospitalStatus && (
												<span className={styles["done-as-subtitle"]}>
													(done as {request.formData?.hospitalStatus})
												</span>
											)}
										</>
									) : (
										request.formData?.formType?.toUpperCase()
									)}
								</h3>

								{renderFormFields(request)}
								{renderAttachments(request)}
								{renderHospitalCertification(request)}

								<hr></hr>
								<div className={styles["approval-section"]}>
									<h4 className={styles["section-header"]}>APPROVAL STEP</h4>

									<div className={styles["approval-actions-container"]}>
										<div className={styles["approval-actions"]}>
											<button
												className={`${
													styles["approve-btn"]
												} d-flex align-items-center justify-content-center ${
													activeDecision === "approval" ? styles.selected : ""
												}`}
												onClick={() => handleAction("approval")}
											>
												<FiCheck size={25} />
												<span className="ms-2">Approve</span>
											</button>
											<button
												className={`${
													styles["reject-btn"]
												} d-flex align-items-center justify-content-center ${
													activeDecision === "rejection" ? styles.selected : ""
												}`}
												onClick={() => handleAction("rejection")}
											>
												<HiOutlineX size={25} />
												<span className="ms-2">Reject</span>
											</button>
											<button
												className={`${
													styles["revise-btn"]
												} d-flex align-items-center justify-content-center ${
													activeDecision === "for revision"
														? styles.selected
														: ""
												}`}
												onClick={() => handleAction("for revision")}
											>
												<FiEdit2 size={23} />
												<span className="ms-2">To Revise</span>
											</button>
										</div>

										{showCommentBox && (
											<textarea
												className={styles["comment-box"]}
												placeholder={showCommentBox}
												onChange={handleTextArea}
											/>
										)}

										<div className={styles["send-section"]}>
											<div className={styles["send-box"]}>
												<p className={styles["send-note"]}>
													** Clicking the send button will finalize the decision
													and notify the requester. This action is irreversible.
												</p>
												<button
													className={styles["send-btn"]}
													onClick={() => {
														handleSendClick(request.transactionId);
													}}
												>
													SEND
												</button>
											</div>
										</div>
									</div>
								</div>
							</div>
						)}
					</div>
				))
			) : (
				<div className="no-results">No matching requests found</div>
			)}

			{/* Updated pagination layout */}
			{filteredRequests.length > 0 && (
				<div className={styles.paginationContainer}>
					{/* Record info moved to the side */}
					<div className={styles.recordInfo}>
						Showing {indexOfFirstRecord + 1} to{" "}
						{Math.min(indexOfLastRecord, filteredRequests.length)} of{" "}
						{filteredRequests.length} results
					</div>

					{/* Page buttons centered in their own container */}
					<div className={styles.pageButtonsContainer}>
						<PageButtons
							currentPage={clientCurrentPage}
							totalPages={totalFilteredPages}
							onPageChange={handlePageChange}
						/>
					</div>
				</div>
			)}

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
				<HistoryPopout
					onClose={handleCloseHistory}
					requester={currentRequester || ""}
				/>
			)}
		</div>
	);
};

export default PendingRequestList;
