import { useState, useRef, useEffect } from "react";
import type {
	PendingRequest,
	FormData,
	FormAttachment,
	HospitalFormData,
} from "./types";
import {
	BenefitsData,
	getUsersBenefits,
	updateBenefits,
	updateDocument,
	usePendingRequests,
} from "./PendingRequestBackend";
import styles from "./PendingRequestList.module.css";
import { RiArrowDownSFill, RiArrowRightSFill } from "react-icons/ri";
import { FiCheck, FiEdit2 } from "react-icons/fi";
import { HiOutlineX } from "react-icons/hi";
import Popout from "../../Page Elements/Popout/Popout";
import ViewFiles from "../../Page Elements/ViewFiles/ViewFiles";
import HistoryPopout from "./HistoryPopout";
import PageButtons from "../../Page Elements/PageButtons/PageButtons";
import PendingRequestsLoadingSkeleton from "./PendingRequestsLoadingSkeleton";
import unreadPending from "../../Page Elements/NotifBadge/unreadPending";
import { useNotifications } from "../../Page Elements/NotifBadge/NotifTrigger";
import { useFirebase } from "../../../contexts/firebaseContext";

// Import icons for form types
import inpatientIcon from "../../../assets/inpatient.png";
import outpatientIcon from "../../../assets/outpatient.png";
import admissionIcon from "../../../assets/admission.png";
import eyeglassesIcon from "../../../assets/eyeglasses.png";

interface PendingRequestListProps {
	searchQuery?: string;
	selectedType?: string;
	filters?: string[];
	sortOrder?: "newest" | "oldest";
}

// Type guard function to check if formData is HospitalFormData
function isHospitalFormData(
	formData: FormData | undefined
): formData is HospitalFormData {
	return formData?.formType === "hospital";
}

let globalBenefitsData: Record<string, BenefitsData["remainingBenefits"]>;

async function initializeBenefitsData() {
	globalBenefitsData = await getUsersBenefits();
	console.log("Global data initialized:", globalBenefitsData);
}

const PendingRequestList: React.FC<PendingRequestListProps> = ({
	searchQuery = "",
	selectedType = "All",
	filters = [],
	sortOrder = "newest",
}) => {
	useEffect(() => {
		const fetchData = async () => {
			await initializeBenefitsData();
		};

		fetchData(); // Call the async function
	}, []);

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
	const [previewFile, setPreviewFile] = useState<FormAttachment | null>(null);
	const [showHistoryPopout, setShowHistoryPopout] = useState<boolean>(false);
	const [currentRequester, setCurrentRequester] = useState<string | null>(
		null
	);
	const [signatureImage, setSignatureImage] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Additional state for different signature images
	// const [getBenefits, setBenefits] = useState<number>(0);
	const [getEditBenefits, setEditBenefits] = useState<number>(1);
	const [getText, setText] = useState<string | null>(null);
	const [getTransID, setTransID] = useState<string | null>(null);
	const [getStatus, setStatus] = useState<string | null>(null);
	const [getCurrentUser, setCurrentUser] = useState<string | null>(null);
	const [validUntil, setValidUntil] = useState<string>("");
	const [reimbursementAmount, setReimbursementAmount] = useState<number>(0);

	// New state variables for hospital certification
	const [benefitPercentage, setBenefitPercentage] = useState<string>("100");
	const [officialRep, setOfficialRep] = useState<string>(
		"Emerito C. Gonzales"
	);
	const [originalBenefit, setOriginalBenefit] = useState<number>(0);

	// Validation state
	const [validationErrors, setValidationErrors] = useState<{
		validUntil?: string;
		editBenefits?: string;
		officialRep?: string;
		signature?: string;
	}>({});

	// for notifs
	const { uid } = useFirebase();
	const currentUid = uid ?? "";
	const { unreadTransactionIds, isReadByList, setUnreadTransactionIds } =
		unreadPending();
	const { clearPendingNotifications } = useNotifications({
		uid: uid,
		selectedRole: "operations handler",
	});

	// Apply all filters to the requests
	const applyFilters = (requests: PendingRequest[]) => {
		return requests.filter((request) => {
			if (!request || !request.formData) return false;

			// Type filter (form type)
			const formType = request.formData.formType?.toLowerCase() || "";
			const hospitalStatus = isHospitalFormData(request.formData)
				? request.formData.hospitalStatus?.toLowerCase() || ""
				: "";

			const matchesType =
				selectedType === "All" ||
				formType === selectedType ||
				(selectedType === "hospital" && formType === "hospital") ||
				(formType === "hospital" &&
					((selectedType === "inpatient" &&
						hospitalStatus.includes("in-patient")) ||
						(selectedType === "outpatient" &&
							hospitalStatus.includes("out-patient"))));

			// Search query with proper null checks
			const matchesSearch =
				!searchQuery.trim() ||
				request.name
					?.toLowerCase()
					.includes(searchQuery.toLowerCase()) ||
				request.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				request.status
					?.toLowerCase()
					.includes(searchQuery.toLowerCase()) ||
				request.studentId
					?.toLowerCase()
					.includes(searchQuery.toLowerCase()) ||
				request.requester
					?.toLowerCase()
					.includes(searchQuery.toLowerCase()) ||
				request.transactionId
					?.toLowerCase()
					.includes(searchQuery.toLowerCase()) ||
				request.formData.firstname
					?.toLowerCase()
					.includes(searchQuery.toLowerCase()) ||
				request.formData.lastname
					?.toLowerCase()
					.includes(searchQuery.toLowerCase()) ||
				request.formData.middlename
					?.toLowerCase()
					.includes(searchQuery.toLowerCase());

			// Other filters with proper null checks
			const matchesFilters = filters.every((filter) => {
				const [filterType, filterValue] = filter.split(": ");

				if (filterType === "College") {
					const college = request.formData?.college || "";
					return filterValue
						.split(", ")
						.some((value) =>
							college.toLowerCase().includes(value.toLowerCase())
						);
				} else if (filterType === "Status") {
					const status = request.formData?.status || "";
					return filterValue
						.split(", ")
						.some((value) =>
							status.toLowerCase().includes(value.toLowerCase())
						);
				} else if (filterType === "Date") {
					const [startDateStr, endDateStr] = filterValue.split(" - ");
					const [startMonth, startDay, startYear] =
						startDateStr.split("/");
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

	const filteredRequests = applyFilters(pendingRequests);
	const sortedRequests = [...filteredRequests].sort((a, b) => {
		const dateA = a.dateSubmitted ? new Date(a.dateSubmitted).getTime() : 0;
		const dateB = b.dateSubmitted ? new Date(b.dateSubmitted).getTime() : 0;

		// Fix the sort order logic:
		// For "newest", show newest first (descending, so dateB - dateA)
		// For "oldest", show oldest first (ascending, so dateA - dateB)
		return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
	});

	// Calculate pagination for sorted results
	const totalFilteredPages = Math.max(
		1,
		Math.ceil(sortedRequests.length / recordsPerPage)
	);

	// Get current page's records for display
	const indexOfLastRecord = clientCurrentPage * recordsPerPage;
	const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
	const currentFilteredRecords = sortedRequests.slice(
		indexOfFirstRecord,
		indexOfLastRecord
	);

	// Handle change on textArea
	const handleTextArea = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
		setText(event.target.value);
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
		setClientCurrentPage(1);
		// Only reset if we're not already on page 1
		if (pagination.currentPage !== 1) {
			setCurrentPage(1);
		}
	}, [
		searchQuery,
		selectedType,
		filters,
		setCurrentPage,
		pagination.currentPage,
	]);

	useEffect(() => {
		// After filtering, if the current page is beyond the available pages, reset to page 1
		const maxPages =
			Math.ceil(filteredRequests.length / recordsPerPage) || 1;
		if (clientCurrentPage > maxPages) {
			setClientCurrentPage(1);
		}
	}, [filteredRequests, recordsPerPage, clientCurrentPage]);

	const handleAction = (
		action: "approval" | "rejection" | "for revision"
	) => {
		setActiveDecision(action);

		if (action === "rejection") {
			setShowCommentBox("Reason for rejection...");
			setStatus("rejected");
		} else if (action === "for revision") {
			setShowCommentBox("Reason for revision...");
			setStatus("for revision");
		} else {
			setShowCommentBox("Additional Comments..."); // Hide comment box when approving
			setStatus("approved");
		}
	};

	const validateForm = () => {
		const errors: {
			validUntil?: string;
			editBenefits?: string;
			officialRep?: string;
			signature?: string;
		} = {};

		// Only validate these fields if the active decision is "approval"
		if (activeDecision === "approval") {
			// Validate date
			if (!validUntil) {
				errors.validUntil = "select a valid date";
			}

			// Validate remaining benefits
			if (getEditBenefits <= 0) {
				errors.editBenefits = "Enter a valid amount";
			}

			// Validate official representative
			if (!officialRep.trim()) {
				errors.officialRep = "Representative name is required";
			}

			// Validate signature
			if (!signatureImage) {
				errors.signature = "Signature is required";
			}
		}

		setValidationErrors(errors);
		return Object.keys(errors).length === 0;
	};

	const handleSendClick = (transactionID: string) => {
		if (!activeDecision) return; // Prevent sending if no action is selected

		if (activeDecision === "approval" && !validateForm()) {
			// Don't proceed if validation fails for approval
			return;
		}

		// For rejection or revision, we don't need the same validation
		if (activeDecision !== "approval") {
			setValidationErrors({});
		}

		setTransID(transactionID);
		setShowPopout(true); // Open confirmation popout
	};

	const handleConfirm = async () => {
		console.log(`Confirmed: ${activeDecision}`);
		console.log("Current status:", getStatus);
		try {
			const transID = getTransID || "empty";
			const textArea = getText || "empty";
			const updateStatus = getStatus || "pending";

			// Create an object with all the data we need to pass to updateDocument
			const formData = {
				validUntil,
				reimbursementAmount,
				benefitPercentage,
				officialRep,
				signatureImage,
				benefitUsed: originalBenefit - getEditBenefits,
				originalBenefit,
				remainingBenefit: getEditBenefits,
			};

			// Include validUntil when updating the document
			await updateDocument(
				getCurrentUser,
				transID,
				textArea,
				updateStatus,
				formData
			);

			// Update user's remaining benefit if changed
			if (
				globalBenefitsData[getCurrentUser || "null"] !== getEditBenefits
			) {
				await updateBenefits(getEditBenefits, getCurrentUser);
			}

			// 🚩 Manually re-fetch the list after confirmation
			await fetchData();
			initializeBenefitsData();
		} catch (error) {
			console.error(error);
		}

		setShowPopout(false);
		setShowCommentBox(null);
		setText(null);
	};

	const handleCancel = () => {
		setShowPopout(false);
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

	const handleRequestClick = async (request: PendingRequest) => {
		const isExpanding = expandedId !== request.transactionId;

		setExpandedId(isExpanding ? request.transactionId : null);

		if (isExpanding) {
			const currentBenefit = globalBenefitsData[request.requester] || 0;
			setEditBenefits(currentBenefit);
			setOriginalBenefit(currentBenefit);
			setCurrentUser(request.requester);
		}

		await clearPendingNotifications(request.transactionId);
		// ✅ Locally remove highlight
		setUnreadTransactionIds((prev) =>
			prev.filter((id) => id !== request.transactionId)
		);
		setText(null);
	};

	// Helper function to convert camelCase to Title Case with spaces
	const formatDocumentType = (camelCaseKey: string): string => {
		if (camelCaseKey === "employeeID") return "Employee ID";
		return (
			camelCaseKey
				// Insert a space before all capital letters
				.replace(/([A-Z])/g, " $1")
				// Capitalize first letter
				.replace(/^./, (str) => str.toUpperCase())
		);
	};

	// Helper function to get form icon based on type
	const getFormIcon = (
		formType: string,
		hospitalStatus?: string
	): string | undefined => {
		// Convert to lowercase for case-insensitive comparison
		const type = formType?.toLowerCase() || "";
		const status = hospitalStatus?.toLowerCase() || "";

		// Hospital type logic
		if (type === "hospital") {
			if (status.includes("in-patient")) return inpatientIcon;
			if (status.includes("out-patient")) return outpatientIcon;
			return inpatientIcon; // Default
		}

		// Direct type matching
		switch (type) {
			case "admission":
				return admissionIcon;
			case "eyeglasses":
				return eyeglassesIcon;
			case "inpatient":
				return inpatientIcon;
			case "outpatient":
				return outpatientIcon;
			default:
				return undefined;
		}
	};

	// Helper function to render thumbnails
	const renderThumbnail = (attachment: FormAttachment) => {
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
				<div
					className={styles["default-thumbnail"]}
					data-label="PDF"
				></div>
			);
		} else if (ext === "docx") {
			return (
				<div
					className={styles["default-thumbnail"]}
					data-label="DOCX"
				></div>
			);
		} else {
			return (
				<div
					className={styles["default-thumbnail"]}
					data-label="FILE"
				></div>
			);
		}
	};

	// Modify the renderFormFields function to ensure fields display properly
	const renderFormFields = (request: PendingRequest) => {
		const { formData } = request;

		if (!formData) return null;

		const baseFields = (
			<>
				<div className={styles["form-grid"]}>
					<div className={styles["form-group"]}>
						<label>Last Name</label>
						<p className={styles["field-value"]}>
							{formData?.lastname}
						</p>
					</div>
					<div className={styles["form-group"]}>
						<label>First Name</label>
						<p className={styles["field-value"]}>
							{formData?.firstname}
						</p>
					</div>
					<div className={styles["form-group"]}>
						<label>Middle Name</label>
						<p className={styles["field-value"]}>
							{formData?.middlename}
						</p>
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
						<p className={styles["field-value"]}>
							{formData?.gender}
						</p>
					</div>
					<div
						className={`${styles["form-group"]} ${styles["pending-request-college-field"]}`}
					>
						<label>College Affiliation</label>
						<p className={styles["field-value"]}>
							{formData?.college || "-"}
						</p>
					</div>
					<div
						className={`${styles["form-group"]} ${styles["pending-request-contact-field"]}`}
					>
						<label>Contact No.</label>
						<p className={styles["field-value"]}>
							{formData?.contact || "-"}
						</p>
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
								<p className={styles["field-value"]}>
									{formData?.hospital}
								</p>
							</div>
							<div className={styles["form-group"]}>
								<label>Nature of Illness</label>
								<p className={styles["field-value"]}>
									{formData?.illness}
								</p>
							</div>
							<div className={styles["form-group"]}>
								<label>Physician</label>
								<p className={styles["field-value"]}>
									{formData?.physician}
								</p>
							</div>
							<div className={styles["form-group"]}>
								<label>Procedure</label>
								<p className={styles["field-value"]}>
									{formData?.procedures}
								</p>
							</div>
						</div>
						<hr></hr>
						<div className={styles["form-grid"]}>
							<div className={styles["form-group"]}>
								<label>Academic Term</label>
								<p className={styles["field-value"]}>
									{formData?.term}
								</p>
							</div>
							<div className={styles["form-group"]}>
								<label>Academic Year</label>
								<p className={styles["field-value"]}>
									{formData?.year}
								</p>
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
										? new Date(
												formData?.dateHired
										  ).toLocaleDateString()
										: "-"}
								</p>
							</div>
							<div className={styles["form-group"]}>
								<label>Date Retired:</label>
								<p
									className={`${styles["field-value"]} ${styles["field-date"]}`}
								>
									{formData?.dateRetired
										? new Date(
												formData?.dateRetired
										  ).toLocaleDateString()
										: "-"}
								</p>
							</div>
							<div className={styles["form-group"]}>
								<label>Health Benefits</label>
								<p className={styles["field-value"]}>
									{formData?.benefits}
								</p>
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
						<hr />
						<div className={styles["form-eyeglasses-row-grid"]}>
							<div className={styles["form-group"]}>
								<label>OR Number</label>
								<p className={styles["field-value"]}>
									{formData?.ORNumber
										? formData?.ORNumber
										: "-"}
								</p>
							</div>
							<div className={styles["form-group"]}>
								<label>Issued By</label>
								<p className={styles["field-value"]}>
									{formData?.issuedBy
										? formData?.issuedBy
										: "-"}
								</p>
							</div>
							<div className={styles["form-group"]}>
								<label>Amount Paid</label>
								<p
									className={`${styles["field-value"]} ${styles["field-currency"]}`}
								>
									{formData?.amountPaid
										? formData?.amountPaid
										: "-"}
								</p>
							</div>
						</div>
						<hr></hr>
					</>
				);

			case "admission":
				return (
					<>
						{baseFields}
						<hr></hr>
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
						<hr></hr>
					</>
				);

			default:
				return baseFields;
		}
	};

	// Update renderAttachments function to remove USTFU section
	const renderAttachments = (request: PendingRequest) => {
		const { formData } = request;

		if (!formData) return null;

		// Create an array of objects that include both the attachment and its type
		const attachmentsWithLabels = [
			...(formData.employeeID
				? [{ type: "employeeID", data: formData.employeeID }]
				: []),
			...(formData.applicantSignature
				? [
						{
							type: "applicantSignature",
							data: formData.applicantSignature,
						},
				  ]
				: []),
			...(formData.docRequest
				? [{ type: "docRequest", data: formData.docRequest }]
				: []),
			...(formData.hospitalInvoice
				? [{ type: "hospitalInvoice", data: formData.hospitalInvoice }]
				: []),
			...(formData.labInvoice
				? [{ type: "labInvoice", data: formData.labInvoice }]
				: []),
		].filter((item) => item.data && item.data.filename);

		// Function to render attachments section
		const renderAttachmentsSection = () => (
			<div className={styles["attachments-section"]}>
				<h4>UPLOADED ATTACHMENTS</h4>
				<div className={styles["attachment-container-row"]}>
					<div className={styles["attachment-preview-container"]}>
						{attachmentsWithLabels.length > 0 ? (
							attachmentsWithLabels.map((item, index) => (
								<div
									key={index}
									className={styles["attachment-preview"]}
									onClick={() => setPreviewFile(item.data)}
									title={item.data?.filename}
								>
									<div
										className={
											styles["thumbnail-container"]
										}
									>
										{renderThumbnail(item.data)}
									</div>
									<div className={styles["file-info"]}>
										<p className={styles["document-type"]}>
											{formatDocumentType(item.type)}
										</p>
										<p className={styles["file-name"]}>
											{item.data?.filename}
										</p>
									</div>
								</div>
							))
						) : (
							<div className={styles["no-attachments"]}>
								<p>No attachments uploaded</p>
							</div>
						)}
					</div>
				</div>
			</div>
		);

		// Just return attachments section for all form types
		return (
			<div className={styles["attachments-ustfu-container"]}>
				<div className={styles["attachments-column"]}>
					{renderAttachmentsSection()}
				</div>
			</div>
		);
	};

	// Update renderHospitalCertification function to also handle admission forms
	const renderHospitalCertification = (request: PendingRequest) => {
		// Only render for hospital and admission type requests
		if (
			!request.formData ||
			(request.formData.formType !== "hospital" &&
				request.formData.formType !== "admission")
		) {
			return null;
		}

		return (
			<>
				<hr></hr>
				<div className={styles["hospital-certification"]}>
					<h4 className={styles["section-header"]}>
						To UST Hospital
					</h4>
					<div className={styles["certification-content"]}>
						<p className="text-center">
							This certifies that the above named faculty is
							entitled to the following benefit on his/her total
							charges (procedure, supplies, drugs and reader's
							fee) but not to exceed his/her remaining benefit
							subject to final verification:
						</p>

						<div className={styles["hospital-certification-grid"]}>
							{/* Benefits section */}
							<div
								className={styles["benefit-options-container"]}
							>
								<div className={styles["benefit-options"]}>
									<>
										<label
											className={styles["radio-option"]}
										>
											<input
												type="radio"
												name="benefit"
												value="50"
												checked={
													benefitPercentage === "50"
												}
												onChange={() =>
													setBenefitPercentage("50")
												}
											/>
											<span>
												50% of net hospital bill
											</span>
										</label>
										<label
											className={styles["radio-option"]}
										>
											<input
												type="radio"
												name="benefit"
												value="100"
												checked={
													benefitPercentage === "100"
												}
												onChange={() =>
													setBenefitPercentage("100")
												}
											/>
											<span>
												100% of net hospital bill
											</span>
										</label>
									</>
								</div>
								{/* Valid Until Date Field */}
								<div
									className={styles["valid-until-container"]}
								>
									<label htmlFor="valid-until">
										Valid Until:
									</label>
									<input
										type="date"
										id="valid-until"
										className={`${
											styles["valid-until-input"]
										} ${
											validationErrors.validUntil
												? styles["invalid-field"]
												: ""
										}`}
										value={validUntil}
										onChange={(e) =>
											setValidUntil(e.target.value)
										}
									/>
									{validationErrors.validUntil && (
										<div
											className={
												styles["validation-error"]
											}
										>
											{validationErrors.validUntil}
										</div>
									)}
								</div>
							</div>

							{/* Amount section */}
							<div className={styles["amount-section"]}>
								<div className={styles["benefit-history"]}>
									<span className="mb-2">
										Original benefit: ₱{" "}
										{originalBenefit.toLocaleString()}
									</span>
								</div>
								<span className="mb-2">but not to exceed:</span>
								<div
									className={`${
										styles["amount-container"]
									} p-3 rounded shadow ${
										validationErrors.editBenefits
											? styles["invalid-field"]
											: ""
									}`}
								>
									<div
										className={`${styles["amount-input-wrapper"]} d-flex align-items-center`}
									>
										<span
											className={styles.currency}
										></span>
										<input
											aria-label="amount left"
											type="text"
											defaultValue={
												globalBenefitsData[
													request.requester
												]
											}
											className={styles["amount-input"]}
											onChange={(e) => {
												setEditBenefits(
													parseInt(e.target.value) ||
														0
												);
											}}
										/>
									</div>
									<span className={styles["amount-label"]}>
										(Remaining benefit)
									</span>
									{validationErrors.editBenefits && (
										<div
											className={
												styles["validation-error"]
											}
										>
											{validationErrors.editBenefits}
										</div>
									)}
								</div>
								<button
									className={`${styles["check-history-btn"]} mt-3`}
									onClick={() =>
										handleCheckHistory(request.requester)
									}
								>
									CHECK HISTORY
								</button>
							</div>

							{/* Signature Upload */}
							<div className={styles["signature-container"]}>
								<div className={styles["signature-section"]}>
									<div
										className={`${styles["upload-box"]} ${
											validationErrors.signature
												? styles["invalid-field"]
												: ""
										}`}
									>
										{signatureImage ? (
											<div
												className={
													styles["signature-preview"]
												}
											>
												<img
													src={signatureImage}
													alt="Signature"
													className={
														styles[
															"uploaded-signature"
														]
													}
												/>
												<button
													className={
														styles[
															"remove-signature-btn"
														]
													}
													onClick={
														handleRemoveSignature
													}
													title="Remove signature"
												>
													x
												</button>
											</div>
										) : (
											<>
												<p>
													Please attach signature
													here.
												</p>
												<button
													className={
														styles["upload-btn"]
													}
													onClick={handleUploadClick}
												>
													UPLOAD
												</button>
												<input
													type="file"
													ref={fileInputRef}
													className={
														styles[
															"hidden-file-input"
														]
													}
													accept="image/*"
													onChange={handleFileChange}
												/>
												{validationErrors.signature && (
													<div
														className={
															styles[
																"validation-error"
															]
														}
													>
														{
															validationErrors.signature
														}
													</div>
												)}
											</>
										)}
									</div>
									<div
										className={styles["signature-details"]}
									>
										<input
											type="text"
											className={`${
												styles["signature-name-input"]
											} ${
												validationErrors.officialRep
													? styles["invalid-field"]
													: ""
											}`}
											value={officialRep}
											onChange={(e) =>
												setOfficialRep(e.target.value)
											}
											aria-label="USTFU President"
										/>
										{validationErrors.officialRep && (
											<div
												className={
													styles["validation-error"]
												}
											>
												{validationErrors.officialRep}
											</div>
										)}
										<p
											className={
												styles["signature-title"]
											}
										>
											USTFU PRESIDENT
										</p>
										<p
											className={
												styles["signature-subtitle"]
											}
										>
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

	const renderApprovalSection = (request: PendingRequest) => {
		return (
			<div className={styles["approval-section"]}>
				<h4 className={styles["section-header"]}>APPROVAL STEP</h4>

				<div className={styles["approval-actions-container"]}>
					<div className={styles["approval-actions"]}>
						<button
							className={`${
								styles["approve-btn"]
							} d-flex align-items-center justify-content-center ${
								activeDecision === "approval"
									? styles.selected
									: ""
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
								activeDecision === "rejection"
									? styles.selected
									: ""
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

					{/* Always show the comment box regardless of action */}
					<textarea
						className={styles["comment-box"]}
						placeholder={showCommentBox || "Additional Comments..."}
						onChange={handleTextArea}
					/>

					<div className={styles["send-section"]}>
						<div className={styles["send-box"]}>
							<p className={styles["send-note"]}>
								** Clicking the send button will finalize the
								decision and notify the requester. This action
								is irreversible.
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
		);
	};

	// For debugging - let's see what data we're getting
	console.log("Original requests count:", pendingRequests.length);
	console.log("Filtered requests count:", filteredRequests.length);
	console.log("Sorted by:", sortOrder);
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
					<p>
						There are no requests waiting for your approval at this
						time.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className={styles["pending-requests"]}>
			{sortedRequests.length > 0 ? (
				// Map through the current page of sorted records
				currentFilteredRecords.map((request) => (
					<div
						key={request.transactionId}
						className={styles["pending-request"]}
					>
						<div
							className={`${styles["request-header"]} ${
								expandedId === request.transactionId
									? styles.expanded
									: ""
							} ${
								unreadTransactionIds.includes(
									request.transactionId
								) &&
								isReadByList[request.transactionId] &&
								!isReadByList[request.transactionId].includes(
									currentUid
								)
									? styles.highlight
									: ""
							}`}
							onClick={async () => handleRequestClick(request)}
						>
							<div className={styles["header-content"]}>
								<div className={styles["header-item"]}>
									<span className={styles["header-label"]}>
										Form Type
									</span>
									<span className={styles["request-type"]}>
										{/* Add icon before the text */}
										{request.formData?.formType && (
											<img
												src={getFormIcon(
													request.formData.formType,
													isHospitalFormData(
														request.formData
													)
														? request.formData
																.hospitalStatus
														: undefined
												)}
												alt=""
												className={
													styles["form-type-icon"]
												}
											/>
										)}
										{request.formData?.formType ===
										"hospital"
											? isHospitalFormData(
													request.formData
											  ) &&
											  request.formData.hospitalStatus
												? request.formData.hospitalStatus
														.toLowerCase()
														.includes("in-patient")
													? "Inpatient"
													: "Outpatient"
												: "Hospital"
											: request.formData?.formType ||
											  "Unknown"}
									</span>
								</div>

								{/* Date */}
								<div className={styles["header-item"]}>
									<span className={styles["header-label"]}>
										Date
									</span>
									<span className={styles["header-value"]}>
										{request.dateSubmitted}
									</span>
								</div>

								{/* Requester */}
								<div className={styles["header-item"]}>
									<span className={styles["header-label"]}>
										Requester
									</span>
									<span className={styles["header-value"]}>
										{request.requester}
									</span>
								</div>

								{/* Transaction ID */}
								<div className={styles["header-item"]}>
									<span className={styles["header-label"]}>
										Transaction ID
									</span>
									<span className={styles["header-value"]}>
										{request.transactionId}
									</span>
								</div>

								{/* Arrow moved to the end */}
								<div className={styles["header-item"]}>
									<span className={styles.arrow}>
										{expandedId === request.transactionId ? (
											<RiArrowDownSFill size={24} />
										) : (
											<RiArrowRightSFill size={24} />
										)}
									</span>
								</div>
							</div>
						</div>

						{expandedId === request.transactionId && (
							<div className={styles["request-content"]}>
								{/* Move "done as" to appear under the main title */}
								<h3>
									{request.formData?.formType ===
									"hospital" ? (
										<>
											{isHospitalFormData(
												request.formData
											) && (
												<>
													{request.formData.hospitalStatus?.toLowerCase() ===
													"in-patient"
														? "INPATIENT"
														: request.formData.hospitalStatus?.toLowerCase() ===
														  "out-patient"
														? "OUTPATIENT"
														: "HOSPITAL"}{" "}
													SUBMITTED FORM DETAILS
													{request.formData
														.hospitalStatus && (
														<span
															className={
																styles[
																	"done-as-subtitle"
																]
															}
														>
															(done as{" "}
															{
																request.formData
																	.hospitalStatus
															}
															)
														</span>
													)}
												</>
											)}
										</>
									) : (
										request.formData?.formType?.toUpperCase() ||
										"UNKNOWN"
									)}
								</h3>

								{renderFormFields(request)}
								{renderAttachments(request)}
								{renderHospitalCertification(request)}

								<hr></hr>
								{renderApprovalSection(request)}
							</div>
						)}
					</div>
				))
			) : (
				<div className="no-results">No matching requests found</div>
			)}

			{/* Updated pagination layout */}
			{sortedRequests.length > 0 && (
				<div className={styles.paginationContainer}>
					<div className={styles.recordInfo}>
						Showing {indexOfFirstRecord + 1} to{" "}
						{Math.min(indexOfLastRecord, sortedRequests.length)} of{" "}
						{sortedRequests.length} results
					</div>

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
