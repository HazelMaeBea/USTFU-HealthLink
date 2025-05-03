import { useState, useEffect } from "react";
import { FieldValues, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import "react-datepicker/dist/react-datepicker.css";
import "./FormComponents/FormBody.css";
import FormHeader from "./FormComponents/FormHeader.tsx";
import FormPersonalInfo from "./FormComponents/FormPersonalInfo.tsx";
import FormInvoice from "./FormComponents/FormInvoice.tsx";
import FormUploadDisclaimer from "./FormComponents/FormUploadDisclaimer.tsx";
import FormCertify from "./FormComponents/FormCertify.tsx";
import ValidationErrorDropdown from "./FormComponents/ValidationErrorDropdown.tsx";
import { addDoc, collection } from "firebase/firestore";
import { auth, db } from "../../../contexts/firebase.ts";
import BackButton from "../../Page Elements/BackButton/BackButton.tsx";
import RemainingBenefit from "./RemainingBenefitPopout/RemainingBenefit.tsx";
import { useNavigate } from "react-router-dom";
import Popout from "../../Page Elements/Popout/Popout.tsx";
import { FiCheck, FiArrowRight, FiX } from "react-icons/fi";
import { useAutofill, applyAutofill } from "./FormUtil/Autofill.ts";
import {
	uploadFilesAndGetURLs,
	validateFileListSize,
	deleteFileFromURL,
} from "../../../utils/fileUpload.ts";
import { baseFormSchema, UnifiedFormData } from "./FormUtil/formTypes.ts";
import { pushPendingNotification } from "../../Page Elements/NotifBadge/NotifTrigger.ts";
import { useRevisionStore } from "../../Page Elements/RevisionFuncs/revisionStore.ts";
import { useRemoveRequest } from "../../Page Elements/RevisionFuncs/removeRequest.ts";
import ViewFiles from "../../Page Elements/ViewFiles/ViewFiles.tsx";
import {
	saveFormData,
	loadFormData,
	clearFormData,
} from "./FormUtil/formPresistence.ts";

type FileState = {
	[key: string]: { url: string | null; fileName: string | null };
};

const fileFields = [
	"employeeID",
	"applicantSignature",
	"eyeglassesReceipt",
] as const;

type FileField = (typeof fileFields)[number];

// Maximum amount allowed for eyeglasses reimbursement - can be changed by admin
const MAX_EYEGLASSES_AMOUNT = 5000;

// Extend the base schema with eyeglasses-specific fields
const schema = baseFormSchema
	.extend({
		ORNumber: z.string().nonempty("Please enter a valid OR Number"),
		issuedBy: z.string().nonempty("Please enter a valid Issue By"),
		amountPaid: z.coerce
			.number({
				invalid_type_error: "Please enter a valid amount",
				required_error: "Amount Paid is required",
			})
			.min(1, "Amount must be more than 0")
			.max(
				MAX_EYEGLASSES_AMOUNT,
				`Amount cannot exceed ₱${MAX_EYEGLASSES_AMOUNT.toLocaleString()}`
			),
		load: z.coerce
			.number({
				required_error: "Please enter your teaching load",
				invalid_type_error: "Teaching load must be a number",
			})
			.min(0, "Teaching load cannot be negative")
			.max(30, "Teaching load cannot exceed 30 units"),
		term: z.string().nonempty("Please select a term"),
		year: z.string().nonempty("Please select an academic year"),
		dateHired: z
			.string({
				invalid_type_error: "Please select a valid date",
				required_error: "Please enter the date you were hired",
			})
			.refine((val) => val && val.trim() !== "", {
				message: "Please enter your date hired",
			})
			.refine(
				(val) =>
					val !== "mm/dd/yyyy" &&
					!/^\d{2}\/\d{2}\/\d{4}$/.test(val) &&
					val !== "",
				{
					message: "Please select a valid date",
				}
			)
			.transform((val) =>
				val && val.trim() !== "" ? new Date(val) : null
			)
			.refine(
				(date) => {
					if (!date) return false;
					return (
						date instanceof Date &&
						!isNaN(date.getTime()) &&
						date <= new Date()
					);
				},
				{
					message:
						"Please enter a valid date that is not in the future",
				}
			),
		employeeID: z.any().nullable().optional(),
		eyeglassesReceipt: z
			.any()
			.refine((files) => files && files.length > 0, {
				message: "Eyeglasses receipt is required",
			}),
		applicantSignature: z
			.any()
			.refine((files) => files && files.length > 0, {
				message: "Applicant's signature is required",
			}),
	})
	.omit({ claimRequestCount: true }); // Remove claimRequestCount requirement

const EyeglassesForm = () => {
	const [showSuccessNotification, setShowSuccessNotification] =
		useState(false);
	const [isNotificationHiding, setIsNotificationHiding] = useState(false);
	const [showClearConfirmation, setShowClearConfirmation] =
		useState<boolean>(false);
	const [formIdString, setFormIdString] = useState<string>("");
	const [submissionStatus, setSubmissionStatus] = useState<
		"processing" | "success" | "error"
	>("processing");
	const [errorMessage, setErrorMessage] = useState<string>("");
	const [dateHired, setDateHired] = useState<Date | null>(null);
	const [phoneInputValue, setPhoneInputValue] = useState<string>("+63");
	const [fileErrors, setFileErrors] = useState<Record<FileField, string>>({});
	const [uploadedUrls, setUploadedUrls] = useState<
		Record<FileField, { url: string | null; fileName: string | null }>
	>({
		employeeID: { url: null, fileName: null },
		applicantSignature: { url: null, fileName: null },
		eyeglassesReceipt: { url: null, fileName: null },
	});
	const [uploadingField, setUploadingField] = useState<FileField | null>(
		null
	);
	const [formSubmitted, setFormSubmitted] = useState(false);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [previewFile, setPreviewFile] = useState<any>(null);
	const [shouldReapplyAutofill, setShouldReapplyAutofill] = useState(false); // <-- ADD THIS LINE
	const { formData, isRevisionMode, transactionId } = useRevisionStore();
	const resetRevision = useRevisionStore((state) => state.resetRevision);
	const navigate = useNavigate();

	const {
		register,
		handleSubmit,
		reset,
		setValue,
		watch,
		setError,
		formState: { errors, isSubmitted },
	} = useForm<UnifiedFormData>({
		resolver: zodResolver(schema),
		mode: "onChange",
		defaultValues: {
			gender: undefined,
			college: "",
			term: "",
			year: "",
		},
	});

	// Load persisted form data on mount
	useEffect(() => {
		const savedData = loadFormData("eyeglasses");
		if (savedData) {
			reset(savedData);
		}
	}, [reset]);

	//Auto-save form data on changes
	useEffect(() => {
		const subscription = watch((value) => {
			saveFormData("eyeglasses", value);
		});
		return () => subscription.unsubscribe();
	}, [watch]);

	// Clean up uploaded files if form not submitted
	useEffect(() => {
		return () => {
			if (!formSubmitted) {
				Object.values(uploadedUrls).forEach((file) => {
					if (file.url) deleteFileFromURL(file.url);
				});
			}
		};
	}, [transactionId, formSubmitted, uploadedUrls]);

	// Apply autofill when component loads
	useAutofill(setValue, setDateHired, undefined, setPhoneInputValue);

	// Re-apply autofill after form is cleared
	useEffect(() => {
		if (shouldReapplyAutofill) {
			applyAutofill(
				setValue,
				setDateHired,
				undefined,
				setPhoneInputValue
			);
			setShouldReapplyAutofill(false);
		}
	}, [shouldReapplyAutofill, setValue, setDateHired, setPhoneInputValue]);

	const closeNotification = () => {
		setIsNotificationHiding(true);

		setTimeout(() => {
			setShowSuccessNotification(false);
			setIsNotificationHiding(false);
		}, 300);
	};

	const handleTrackingClick = (e: React.MouseEvent) => {
		e.preventDefault();
		navigate("/tracking");
	};

	const handleClearConfirm = () => {
		// Reset form with empty select values
		reset({
			gender: undefined,
			college: "",
			term: "",
			year: "",
		});

		// Set flag to reapply autofill
		setShouldReapplyAutofill(true);

		// Clear file errors
		setFileErrors({});
		setShowClearConfirmation(false);
	};

	const handleClearCancel = () => {
		setShowClearConfirmation(false);
	};

	// Handler for file input changes (upload immediately)
	const handleFileChange =
		(fieldName: FileField) =>
		async (e: React.ChangeEvent<HTMLInputElement>) => {
			const files = e.target.files;
			const result = validateFileListSize(files);

			if (!result.valid) {
				setFileErrors((prev) => ({
					...prev,
					[fieldName]: result.errorMessage,
				}));
				e.target.value = "";
				setError(fieldName as any, {
					type: "manual",
					message: result.errorMessage,
				});
			} else {
				if (files && files.length > 0) {
					const file = files[0];
					setUploadingField(fieldName);
					setFileErrors((prev) => ({
						...prev,
						[fieldName]: "",
					}));
					try {
						// Delete previous file if it exists
						const previousUrl = uploadedUrls[fieldName].url;
						if (previousUrl) {
							await deleteFileFromURL(previousUrl);
							console.log(
								`Deleted previous ${fieldName} file before uploading new one`
							);
						}

						const email = auth?.currentUser?.email || "anonymous";
						const transID = transactionId || "TRN" + Date.now();
						const uploadResult = await uploadFilesAndGetURLs(
							email,
							transID,
							{
								[fieldName]: [file],
							}
						);
						const url = uploadResult[fieldName];
						setUploadedUrls((prev) => ({
							...prev,
							[fieldName]: { url, fileName: file.name },
						}));
						setValue(fieldName, url);
						setFileErrors((prev) => ({
							...prev,
							[fieldName]: "",
						}));
					} catch (err) {
						setFileErrors((prev) => ({
							...prev,
							[fieldName]: "Upload failed. Please try again.",
						}));
					} finally {
						setUploadingField(null);
					}
				}
			}
		};

	const onSubmit = async (data: FieldValues) => {
		// Check file uploads and set errors manually if needed
		let hasFileErrors = false;

		console.log("Starting form submission with uploaded URLs:", uploadedUrls);

		if (!uploadedUrls.eyeglassesReceipt.url) {
			setFileErrors((prev) => ({
				...prev,
				eyeglassesReceipt: "Eyeglasses receipt is required",
			}));
			hasFileErrors = true;
		}

		if (!uploadedUrls.applicantSignature.url) {
			setFileErrors((prev) => ({
				...prev,
				applicantSignature: "Applicant's signature is required",
			}));
			hasFileErrors = true;
		}

		// If there are file errors, don't proceed
		if (hasFileErrors) {
			console.log("File errors detected, stopping submission");
			return;
		}

		setFormSubmitted(true);
		setSubmissionStatus("processing");
		setShowSuccessNotification(true);

		try {
			const email = auth?.currentUser?.email;
			const transID = isRevisionMode ? transactionId : "TRN" + Date.now();
			setFormIdString(transID);
			
			console.log("Current user email:", email);
			console.log("Transaction ID:", transID);

			const pendingRequestData = {
				transactionId: transID,
				requester: auth?.currentUser?.displayName || email || "Unknown",
				dateSubmitted: new Date().toLocaleString("en-US", {
					timeZone: "Asia/Manila",
					month: "2-digit",
					day: "2-digit",
					year: "numeric",
					hour: "numeric",
					minute: "numeric",
					hour12: true,
				}),
				status: "pending",
				formData: {
					formType: "eyeglasses",
					origFormType: "eyeglasses",
					lastname: data.lastname,
					firstname: data.firstname,
					middlename: data.middlename,
					age: data.age,
					gender: data.gender,
					contact: data.contact,
					college: data.college,
					term: data.term,
					year: data.year,
					ORNumber: data.ORNumber,
					issuedBy: data.issuedBy,
					amountPaid: data.amountPaid,
					load: data.load,
					dateHired: data.dateHired,
					maxAmount: MAX_EYEGLASSES_AMOUNT,
					eyeglassesReceipt: uploadedUrls.eyeglassesReceipt.url
						? {
								url: uploadedUrls.eyeglassesReceipt.url,
								filename: "receipt.pdf",
						  }
						: "",
					...(uploadedUrls.employeeID.url
						? {
								employeeID: {
									url: uploadedUrls.employeeID.url,
									filename: "employee_id.pdf",
								},
						  }
						: {}),
					applicantSignature: uploadedUrls.applicantSignature.url
						? {
								url: uploadedUrls.applicantSignature.url,
								filename: "signature.png",
						  }
						: "",
				},
			};
			
			console.log("Form data being submitted:", pendingRequestData);
			console.log("File URLs in submission:", {
				eyeglassesReceipt: pendingRequestData.formData.eyeglassesReceipt,
				employeeID: uploadedUrls.employeeID.url ? pendingRequestData.formData.employeeID : "Not provided",
				applicantSignature: pendingRequestData.formData.applicantSignature
			});

			if (isRevisionMode) {
				try {
					await removeRequest(transactionId);
					console.log(
						`Attempted to remove request with ID: ${transactionId}`
					);
				} catch (error) {
					console.error("Error removing previous request:", error);
				}
			}

			console.log("Submitting to Firestore collection 'FormRequests'...");
			const docRef = await addDoc(collection(db, "FormRequests"), pendingRequestData);
			console.log("Document written with ID:", docRef.id);

			setSubmissionStatus("success");
			await pushPendingNotification(transID);

			clearFormData("eyeglasses");
			resetRevision();
			reset();
		} catch (error) {
			console.error("Form submission error:", error);
			console.error("Error details:", JSON.stringify(error, null, 2));
			setSubmissionStatus("error");
			setErrorMessage(
				error instanceof Error
					? error.message
					: "An unexpected error occurred"
			);
		}
	};

	const { removeRequest } = useRemoveRequest();

	// Helper to create file object for preview
	const getFilePreviewObj = (
		fileInfo: { url: string | null; fileName: string | null },
		fallbackName: string
	) =>
		fileInfo.url
			? { url: fileInfo.url, filename: fileInfo.fileName || fallbackName }
			: null;

	// Handle modal opening and closing (match FormMedicalFiles)
	const openModal = (file: { url: string; filename: string } | null) => {
		if (file && file.url) {
			setPreviewFile(file);
			setIsModalOpen(true);
		}
	};

	const closeModal = () => {
		setIsModalOpen(false);
		setPreviewFile(null);
	};

	return (
		<div className="form-body">
			<div className="button-container">
				<BackButton />
				<RemainingBenefit />
			</div>
			<div className="container">
				<FormHeader formType="Eyeglasses Form" />
				<div className="form-body">
					<div className="form-container">
						<form onSubmit={handleSubmit(onSubmit)}>
							{isSubmitted && Object.keys(errors).length > 0 && (
								<ValidationErrorDropdown errors={errors} />
							)}

							<FormPersonalInfo
								register={register}
								errors={errors}
								setValue={setValue}
								watch={watch}
								phoneInputValue={phoneInputValue}
								setPhoneInputValue={setPhoneInputValue}
							/>

							{/* Use the enhanced FormInvoice component that now includes academic year, term, load and date hired */}
							<FormInvoice
								register={register}
								errors={errors}
								setValue={setValue}
								watch={watch}
								dateHired={dateHired}
								setDateHired={setDateHired}
							/>

							<FormUploadDisclaimer />

							{/* Custom document upload table */}
							<div className="document-input-container fieldset-no-line">
								<table className="table-borderless">
									<thead className="table-header table-header-padding">
										<tr>
											<th>Document</th>
											<th className="d-flex justify-content-center">
												Upload
											</th>
										</tr>
									</thead>
									<tbody>
										<tr>
											<td>Employee/UST ID</td>
											<td className="d-flex justify-content-start">
												{uploadingField ===
												"employeeID" ? (
													<div className="uploading-indicator">
														<span className="spinner-border spinner-border-sm"></span>
														<span className="uploading-text">
															Uploading...
														</span>
													</div>
												) : uploadedUrls.employeeID
														.url ? (
													<div className="uploaded-file-actions">
														<button
															type="button"
															className="uploaded-file-view-btn"
															onClick={() =>
																openModal(
																	getFilePreviewObj(
																		uploadedUrls.employeeID,
																		"employee_id.pdf"
																	)
																)
															}
														>
															View Uploaded File
														</button>
														<button
															type="button"
															className="uploaded-file-reupload-btn"
															onClick={async () => {
																// Delete the file from storage
																const url =
																	uploadedUrls
																		.employeeID
																		.url;
																if (url) {
																	try {
																		await deleteFileFromURL(
																			url
																		);
																		console.log(
																			"Deleted employeeID file when re-uploading"
																		);
																	} catch (err) {
																		console.error(
																			"Error deleting file:",
																			err
																		);
																	}
																}
																setUploadedUrls(
																	(prev) => ({
																		...prev,
																		employeeID:
																			{
																				url: null,
																				fileName:
																					null,
																			},
																	})
																);
																setValue(
																	"employeeID",
																	null
																);
															}}
														>
															Re-upload
														</button>
													</div>
												) : (
													<input
														id="employeeID"
														type="file"
														accept=".pdf, .png, .jpg, .jpeg"
														className={`form-control ${
															errors.employeeID ||
															fileErrors.employeeID
																? "is-invalid"
																: ""
														}`}
														{...register(
															"employeeID"
														)}
														name="employeeID"
														onChange={handleFileChange(
															"employeeID"
														)}
													/>
												)}
												{(errors.employeeID ||
													fileErrors.employeeID) && (
													<p className="invalid-feedback">
														{fileErrors.employeeID ||
															(errors.employeeID
																?.message as string)}
													</p>
												)}
											</td>
										</tr>
										<tr>
											<td>
												Eyeglasses Receipt{" "}
												<span className="required-asterisk">
													*
												</span>
											</td>
											<td className="d-flex justify-content-start">
												{uploadingField ===
												"eyeglassesReceipt" ? (
													<div className="uploading-indicator">
														<span className="spinner-border spinner-border-sm"></span>
														<span className="uploading-text">
															Uploading...
														</span>
													</div>
												) : uploadedUrls
														.eyeglassesReceipt
														.url ? (
													<div className="uploaded-file-actions">
														<button
															type="button"
															className="uploaded-file-view-btn"
															onClick={() =>
																openModal(
																	getFilePreviewObj(
																		uploadedUrls.eyeglassesReceipt,
																		"receipt.pdf"
																	)
																)
															}
														>
															View Uploaded File
														</button>
														<button
															type="button"
															className="uploaded-file-reupload-btn"
															onClick={async () => {
																// Delete the file from storage
																const url =
																	uploadedUrls
																		.eyeglassesReceipt
																		.url;
																if (url) {
																	try {
																		await deleteFileFromURL(
																			url
																		);
																		console.log(
																			"Deleted eyeglassesReceipt file when re-uploading"
																		);
																	} catch (err) {
																		console.error(
																			"Error deleting file:",
																			err
																		);
																	}
																}
																setUploadedUrls(
																	(prev) => ({
																		...prev,
																		eyeglassesReceipt:
																			{
																				url: null,
																				fileName:
																					null,
																			},
																	})
																);
																setValue(
																	"eyeglassesReceipt",
																	null
																);
															}}
														>
															Re-upload
														</button>
													</div>
												) : (
													<input
														id="eyeglassesReceipt"
														type="file"
														accept=".pdf, .png, .jpg, .jpeg"
														className={`form-control ${
															errors.eyeglassesReceipt ||
															fileErrors.eyeglassesReceipt
																? "is-invalid"
																: ""
														}`}
														{...register(
															"eyeglassesReceipt"
														)}
														name="eyeglassesReceipt"
														onChange={handleFileChange(
															"eyeglassesReceipt"
														)}
													/>
												)}
												{fileErrors.eyeglassesReceipt && (
													<p className="invalid-feedback">
														{
															fileErrors.eyeglassesReceipt
														}
													</p>
												)}
											</td>
										</tr>
										<tr>
											<td>
												Applicant's Signature{" "}
												<span className="required-asterisk">
													*
												</span>
											</td>
											<td className="d-flex justify-content-start">
												{uploadingField ===
												"applicantSignature" ? (
													<div className="uploading-indicator">
														<span className="spinner-border spinner-border-sm"></span>
														<span className="uploading-text">
															Uploading...
														</span>
													</div>
												) : uploadedUrls
														.applicantSignature
														.url ? (
													<div className="uploaded-file-actions">
														<button
															type="button"
															className="uploaded-file-view-btn"
															onClick={() =>
																openModal(
																	getFilePreviewObj(
																		uploadedUrls.applicantSignature,
																		"signature.png"
																	)
																)
															}
														>
															View Uploaded File
														</button>
														<button
															type="button"
															className="uploaded-file-reupload-btn"
															onClick={async () => {
																// Delete the file from storage
																const url =
																	uploadedUrls
																		.applicantSignature
																		.url;
																if (url) {
																	try {
																		await deleteFileFromURL(
																			url
																		);
																		console.log(
																			"Deleted applicantSignature file when re-uploading"
																		);
																	} catch (err) {
																		console.error(
																			"Error deleting file:",
																			err
																		);
																	}
																}
																setUploadedUrls(
																	(prev) => ({
																		...prev,
																		applicantSignature:
																			{
																				url: null,
																				fileName:
																					null,
																			},
																	})
																);
																setValue(
																	"applicantSignature",
																	null
																);
															}}
														>
															Re-upload
														</button>
													</div>
												) : (
													<input
														id="applicantSignature"
														type="file"
														accept=".pdf, .png, .jpg, .jpeg"
														className={`form-control ${
															errors.applicantSignature ||
															fileErrors.applicantSignature
																? "is-invalid"
																: ""
														}`}
														{...register(
															"applicantSignature"
														)}
														name="applicantSignature"
														onChange={handleFileChange(
															"applicantSignature"
														)}
													/>
												)}
												{fileErrors.applicantSignature && (
													<p className="invalid-feedback">
														{
															fileErrors.applicantSignature
														}
													</p>
												)}
											</td>
										</tr>
									</tbody>
								</table>
							</div>

							<FormCertify register={register} errors={errors} />

							<div className="buttonDiv">
								<button
									type="submit"
									className="btn btn-submit form-submit"
								>
									Submit
								</button>
								<button
									type="button"
									className="btn btn-clear form-submit"
									onClick={() =>
										setShowClearConfirmation(true)
									}
								>
									Clear
								</button>
							</div>
						</form>
					</div>
				</div>
			</div>

			{showSuccessNotification && (
				<div
					className={`success-notification ${
						isNotificationHiding ? "hiding" : ""
					} ${
						submissionStatus === "error" ? "error-notification" : ""
					}`}
				>
					<div className={`success-icon ${submissionStatus}`}>
						{submissionStatus === "processing" ? (
							<div className="spinner"></div>
						) : submissionStatus === "success" ? (
							<FiCheck size={18} />
						) : (
							<FiX size={18} />
						)}
					</div>
					<div className="success-content">
						<h4 className="success-title">
							{submissionStatus === "processing"
								? "Submitting Form..."
								: submissionStatus === "success"
								? "Form Submitted Successfully"
								: "Submission Failed"}
						</h4>
						<p className="success-message">
							{submissionStatus === "processing"
								? "Please wait while we process your claim request..."
								: submissionStatus === "success"
								? `Your claim request has been submitted with ID: ${formIdString}`
								: errorMessage ||
								  "An error occurred during submission. Please try again."}
						</p>
						{submissionStatus === "success" && (
							<div className="success-action">
								<a
									href="#"
									onClick={handleTrackingClick}
									className="success-link"
								>
									Track your request{" "}
									<FiArrowRight
										size={14}
										className="success-link-icon"
									/>
								</a>
							</div>
						)}
						{submissionStatus === "error" && (
							<div className="success-action">
								<button
									onClick={closeNotification}
									className="try-again-link"
								>
									Close and try again
								</button>
							</div>
						)}
					</div>
					<button
						className="success-close"
						onClick={closeNotification}
						aria-label="Close notification"
					>
						<FiX size={18} />
					</button>
				</div>
			)}

			{showClearConfirmation && (
				<Popout
					title="Confirm Clear Form"
					message="Are you sure you want to clear the form? All entered data will be lost."
					onConfirm={handleClearConfirm}
					onCancel={handleClearCancel}
					isOpen={showClearConfirmation}
				/>
			)}
			{isModalOpen && (
				<ViewFiles file={previewFile} onClose={closeModal} />
			)}
		</div>
	);
};

export default EyeglassesForm;
