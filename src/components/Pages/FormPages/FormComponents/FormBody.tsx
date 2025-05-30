import { useState, useEffect, useRef } from "react";
import { FieldValues, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import "react-datepicker/dist/react-datepicker.css";
import "./FormBody.css";
import FormPersonalInfo from "./FormPersonalInfo.tsx";
import FormMedicalInfo from "./FormMedicalInfo.tsx";
import FormTeachingInfo from "./FormTeachingInfo.tsx";
import FormUploadDisclaimer from "./FormUploadDisclaimer.tsx";
import FormMedicalFiles from "./FormMedicalFiles.tsx";
import FormHospitalStatus from "./FormHospitalStatus.tsx";
import FormCertify from "./FormCertify.tsx";
import ValidationErrorDropdown from "./ValidationErrorDropdown.tsx";
import { addDoc, collection } from "firebase/firestore";
import { auth, db } from "../../../../contexts/firebase.ts";
import { useNavigate } from "react-router-dom";
import Popout from "../../../Page Elements/Popout/Popout.tsx";
import { FiCheck, FiArrowRight, FiX, FiInfo } from "react-icons/fi";
import { useAutofill, applyAutofill } from "../FormUtil/Autofill.ts";
import { uploadFilesAndGetURLs } from "../../../../utils/fileUpload.ts";
import { pushPendingNotification } from "../../../Page Elements/NotifBadge/NotifTrigger.ts";
import { baseFormSchema, UnifiedFormData } from "../FormUtil/formTypes.ts";
import { useRevisionStore } from "../../../Page Elements/RevisionFuncs/revisionStore.ts";
import { useRemoveRequest } from "../../../Page Elements/RevisionFuncs/removeRequest.ts";
import {
	saveFormData,
	loadFormData,
	clearFormData,
	hasSavedFormData,
	saveEmptyFormData,
} from "../FormUtil/formPresistence.ts";
import { checkForRestoredFormData } from "../FormUtil/formClearUtil.ts";
import { convertToMMDDYYYY } from "../../../../utils/dateUtils.ts";

interface FormBodyProps {
	origFormType: string;
}

const FormBody = ({ origFormType }: FormBodyProps) => {
	const [dateHired, setDateHired] = useState<Date | null>(null);
	const [dateRetired, setDateRetired] = useState<Date | null>(null);
	const [showSuccessNotification, setShowSuccessNotification] =
		useState(false);
	const [isNotificationHiding, setIsNotificationHiding] = useState(false);
	const [showClearConfirmation, setShowClearConfirmation] =
		useState<boolean>(false);
	const [formIdString] = useState<string>("");
	const [submissionStatus, setSubmissionStatus] = useState<
		"processing" | "success" | "error"
	>("processing");
	const [errorMessage, setErrorMessage] = useState<string>("");
	const [uploadProgress, setUploadProgress] =
		useState<string>("Preparing files...");
	const navigate = useNavigate();
	const [phoneInputValue, setPhoneInputValue] = useState<string>("+63");
	const [shouldReapplyAutofill, setShouldReapplyAutofill] = useState(false);
	const { resetRevision, isRevisionMode, transactionId } = useRevisionStore();
	const { removeRequest } = useRemoveRequest();
	const [showRestoredMessage, setShowRestoredMessage] = useState(false);

	const formSaveTimeout = useRef<NodeJS.Timeout | null>(null);

	const createFormSchema = (formType: string) =>
		baseFormSchema
			.extend({
				hospital: z
					.string({
						required_error: "Please enter a valid hospital name",
						invalid_type_error: "Hospital name must be text",
					})
					.min(1, "Please enter a valid hospital name"),
				illness: z
					.string({
						required_error: "Please specify your illness/condition",
						invalid_type_error: "Illness/condition must be text",
					})
					.min(1, "Please specify your illness/condition"),
				physician: z
					.string({
						required_error:
							"Please enter your attending physician's name",
						invalid_type_error: "Physician name must be text",
					})
					.min(1, "Please enter your attending physician's name"),
				procedures: z
					.string({
						required_error: "Please specify the medical procedure",
						invalid_type_error: "Medical procedures must be text",
					})
					.min(1, "Please specify the medical procedure"),
				procedureSpecify: z
					.string({
						required_error: "Please specify the medical procedure",
						invalid_type_error:
							"Procedure specification must be text",
					})
					.min(1, "Please specify the procedure"),
				// Make confinement dates truly optional unless we're in an inpatient form
				confinementFrom: z.string().optional(),
				confinementTo: z.string().optional(),
				term: z.string().nonempty("Please select the academic term"),
				year: z.string().nonempty("Please select the academic year"),
				load: z.coerce
					.number({
						required_error: "Please enter your teaching load",
						invalid_type_error: "Teaching load must be a number",
					})
					.min(0, "Teaching load cannot be negative")
					.max(30, "Teaching load cannot exceed 30 units"),
				status: z.preprocess(
					(val) => (val === null ? "" : val),
					z.string().nonempty("Please select your employment status")
				),
				dateHired: z
					.string({
						invalid_type_error: "Please select a valid date",
					})
					.nullable()
					.transform((val) => {
						if (!val) return null;
						// Convert from YYYY-MM-DD to MM/DD/YYYY for backend storage
						return convertToMMDDYYYY(val);
					})
					.optional(),
				dateRetired: z
					.string({
						invalid_type_error: "Please select a valid date",
					})
					.nullable()
					.transform((val) => {
						if (!val) return null;
						// Convert from YYYY-MM-DD to MM/DD/YYYY for backend storage
						return convertToMMDDYYYY(val);
					})
					.optional(),
				benefits: z.preprocess(
					(val) => (val === null ? "" : val),
					z.string().nonempty("Please select your health benefits")
				),
				hmo: z.string().nullable().optional(),
				docRequest: z
					.any()
					.refine((files) => files && files.length > 0, {
						message: "Please upload your doctor's request/order",
					}),
				hospitalInvoice: z
					.any()
					.refine((files) => files && files.length > 0, {
						message: "Please upload the hospital invoice",
					}),
				labInvoice: z
					.any()
					.refine((files) => files && files.length > 0, {
						message: "Please upload the laboratory invoice",
					}),
				hospitalStatus:
					formType === "inpatient"
						? z.enum(
								[
									"In-Patient",
									"Out-Patient",
									"ER Consultation",
								],
								{
									errorMap: () => ({
										message:
											"Please select your hospital status",
									}),
								}
						  )
						: z.any().optional(), // Make optional for non-inpatient forms
			})
			.superRefine((data, ctx) => {
				if (data.status === "Tenured-Track" && !data.dateHired) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message:
							"Please provide your date of hire as a Tenure-Track faculty member",
						path: ["dateHired"],
					});
				}
				if (data.status === "Retiree" && !data.dateRetired) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: "Please provide your retirement date",
						path: ["dateRetired"],
					});
				}
				if (
					data.benefits === "HMO" &&
					(!data.hmo || data.hmo.trim() === "")
				) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: "Please specify your HMO provider name",
						path: ["hmo"],
					});
				}
				if (formType === "inpatient") {
					if (!data.confinementFrom) {
						ctx.addIssue({
							code: z.ZodIssueCode.custom,
							message: "Please select the confinement start date",
							path: ["confinementFrom"],
						});
					}
					if (!data.confinementTo) {
						ctx.addIssue({
							code: z.ZodIssueCode.custom,
							message: "Please select the confinement end date",
							path: ["confinementTo"],
						});
					}
					if (data.confinementFrom && data.confinementTo) {
						const fromDate = new Date(data.confinementFrom);
						const toDate = new Date(data.confinementTo);
						const today = new Date();

						if (
							isNaN(fromDate.getTime()) ||
							isNaN(toDate.getTime())
						) {
							ctx.addIssue({
								code: z.ZodIssueCode.custom,
								message: "Please enter valid dates",
								path: ["confinementFrom"],
							});
						} else if (fromDate > toDate) {
							ctx.addIssue({
								code: z.ZodIssueCode.custom,
								message:
									"Confinement start date must be before end date",
								path: ["confinementFrom"],
							});
						} else if (fromDate > today) {
							ctx.addIssue({
								code: z.ZodIssueCode.custom,
								message:
									"Confinement start date cannot be in the future",
								path: ["confinementFrom"],
							});
						} else {
							const diffTime = Math.abs(
								toDate.getTime() - fromDate.getTime()
							);
							const diffDays = Math.ceil(
								diffTime / (1000 * 60 * 60 * 24)
							);
							if (diffDays > 60) {
								ctx.addIssue({
									code: z.ZodIssueCode.custom,
									message:
										"Confinement period cannot exceed 60 days",
									path: ["confinementTo"],
								});
							}
						}
					}
				}
			});

	const schema = createFormSchema(origFormType);

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
		defaultValues: {
			gender: undefined,
			college: "",
			term: "",
			year: "",
			status: "",
			benefits: "",
			hospitalStatus: undefined,
		},
	});

	// load persisted form data on mount
	useEffect(() => {
		const savedData = loadFormData(origFormType);
		if (savedData) {
			reset(savedData);
			checkForRestoredFormData(origFormType, setShowRestoredMessage);
		}
	}, [origFormType, reset]);

	//Auto-save form data on change
	// Auto-save form data on change:
	useEffect(() => {
		const subscription = watch((data) => {
			// We don't want to save empty forms
			if (
				Object.keys(data).some((key) => {
					const value = data[key as keyof typeof data];
					return (
						value !== undefined &&
						value !== null &&
						value !== "" &&
						!(value instanceof FileList)
					);
				})
			) {
				// Use setTimeout to debounce (only save after 500ms of no changes)
				if (formSaveTimeout.current) {
					clearTimeout(formSaveTimeout.current);
				}

				formSaveTimeout.current = setTimeout(() => {
					saveFormData(origFormType, data);
				}, 500);
			}
		});

		return () => {
			subscription.unsubscribe();
			if (formSaveTimeout.current) {
				clearTimeout(formSaveTimeout.current);
			}
		};
	}, [watch, origFormType]);

	// Add a handler to close the notification with animation
	const closeNotification = () => {
		setIsNotificationHiding(true);

		// After animation completes, hide the notification
		setTimeout(() => {
			setShowSuccessNotification(false);
			setIsNotificationHiding(false);
		}, 300); // Animation duration
	};

	const onSubmit = async (data: FieldValues) => {
		// Show notification immediately with processing state
		setSubmissionStatus("processing");
		setShowSuccessNotification(true);

		try {
			const email = auth?.currentUser?.email;

			for (let i = data.claimRequestCount - 1; i >= 0; i--) {
				// Extract all files to upload into a single object
				const filesToUpload: Record<string, File[]> = {};

				// Add required files, checking that they exist first
				if (
					data.applicantSignature &&
					data.applicantSignature.length > 0
				) {
					filesToUpload.applicantSignature = data.applicantSignature;
				}

				if (data.docRequest && data.docRequest.length > 0) {
					filesToUpload.docRequest = data.docRequest;
				}

				if (data.hospitalInvoice && data.hospitalInvoice.length > 0) {
					filesToUpload.hospitalInvoice = data.hospitalInvoice;
				}

				if (data.labInvoice && data.labInvoice.length > 0) {
					filesToUpload.labInvoice = data.labInvoice;
				}

				// Only add employeeID if it exists and has files
				if (data.employeeID && data.employeeID.length > 0) {
					filesToUpload.employeeID = data.employeeID;
				}

				console.log(
					"Files being uploaded:",
					Object.keys(filesToUpload)
				);

				// Pre-process and optimize files before upload
				setUploadProgress("Optimizing files...");

				// Use the new utility to upload all files and get URLs in one operation
				setUploadProgress(
					"Uploading files (this may take a moment)..."
				);

				const transID = isRevisionMode
					? transactionId
					: "TRN" + Date.now();
				const fileUploadResults = await uploadFilesAndGetURLs(
					email,
					transID,
					filesToUpload
				);

				console.log("Upload results:", fileUploadResults);

				setUploadProgress("Creating document...");
				const newDoc = {
					transactionId: transID,
					requester:
						auth?.currentUser?.displayName || email || "Unknown",
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
						formType: "hospital",
						origFormType: origFormType,
						lastname: data.lastname,
						firstname: data.firstname,
						middlename: data.middlename,
						suffix: data.suffix,
						age: data.age,
						gender: data.gender,
						contact: data.contact,
						college: data.college,
						hospital: data.hospital,
						illness: data.illness,
						physician: data.physician,
						procedures: data.procedures,
						...(origFormType === "inpatient" && {
							confinementFrom: data.confinementFrom,
							confinementTo: data.confinementTo,
						}),
						term: data.term,
						year: data.year,
						load: data.load,
						status: data.status,
						benefits: data.benefits,
						hmo: data.hmo,
						// Store attachment data with both URL and filename
						docRequest: fileUploadResults.docRequest
							? {
									url: fileUploadResults.docRequest,
									filename:
										filesToUpload.docRequest?.[0]?.name ||
										"document.pdf",
							  }
							: "",
						hospitalInvoice: fileUploadResults.hospitalInvoice
							? {
									url: fileUploadResults.hospitalInvoice,
									filename:
										filesToUpload.hospitalInvoice?.[0]
											?.name || "invoice.pdf",
							  }
							: "",
						labInvoice: fileUploadResults.labInvoice
							? {
									url: fileUploadResults.labInvoice,
									filename:
										filesToUpload.labInvoice?.[0]?.name ||
										"lab_invoice.pdf",
							  }
							: "",
						...(fileUploadResults.employeeID
							? {
									employeeID: {
										url: fileUploadResults.employeeID,
										filename:
											filesToUpload.employeeID?.[0]
												?.name || "employee_id.pdf",
									},
							  }
							: {}),
						applicantSignature: fileUploadResults.applicantSignature
							? {
									url: fileUploadResults.applicantSignature,
									filename:
										filesToUpload.applicantSignature?.[0]
											?.name || "signature.png",
							  }
							: "",
						hospitalStatus: data.hospitalStatus,
						claimRequestCount: data.claimRequestCount,
					},
				};

				if (isRevisionMode) {
					try {
						await removeRequest(transactionId);
						console.log(
							`Attempted to remove request with ID: ${transactionId}`
						);
						// ... proceed with submitting the new revision
					} catch (error) {
						console.error(
							"Error removing previous request:",
							error
						);
						// Handle the error appropriately (e.g., show a message to the user)
					}
				}

				setUploadProgress("Saving to database...");
				await addDoc(collection(db, "FormRequests"), newDoc);

				console.log("Document written with Transaction ID: ", transID);

				// Trigger real-time notification for operations handlers/admins
				await pushPendingNotification(transID);

				// Show success notification instead of old popup
				setSubmissionStatus("success");

				// Reset form after successful submission
				resetRevision();
				reset();
			}

			//Clears on submit
			clearFormData(origFormType);
		} catch (error) {
			console.error(error);
			setSubmissionStatus("error");
			setErrorMessage(
				error instanceof Error
					? error.message
					: "An unexpected error occurred"
			);
		}
	};

	const handleTrackingClick = (e: React.MouseEvent) => {
		e.preventDefault();
		navigate("/tracking");
	};

	const [showClearSuccess, setShowClearSuccess] = useState(false);

	const handleClearConfirm = () => {
		console.log("Starting form clear operation...");
		// First clear localStorage data
		clearFormData(origFormType);

		// Reset form with explicit default values for all fields
		reset({
			gender: undefined,
			college: "",
			term: "",
			year: "",
			status: "",
			benefits: "",
			hmo: "",
			hospital: "",
			illness: "",
			physician: "",
			procedures: "",
			procedureSpecify: "",
			confinementFrom: "",
			confinementTo: "",
			load: undefined,
			hospitalStatus: undefined, // Explicitly reset hospitalStatus
			certify: false,
		});

		// Reset file inputs
		if (window && window.document) {
			const fileInputs = document.querySelectorAll('input[type="file"]');
			fileInputs.forEach((input) => {
				(input as HTMLInputElement).value = "";
			});
		}

		// Reset states
		setDateHired(null);
		setDateRetired(null);
		setPhoneInputValue("+63");
		setUploadProgress("Preparing files...");

		// Flag to reapply autofill
		setShouldReapplyAutofill(true);

		// Prevent auto-save for a short period after clearing
		if (formSaveTimeout.current) {
			clearTimeout(formSaveTimeout.current);
		}

		// Force immediate save of empty data to overwrite any existing data
		saveEmptyFormData(origFormType);

		// Close confirmation dialog
		setShowClearConfirmation(false);

		// Scroll to top
		window.scrollTo({ top: 0, behavior: "smooth" });

		// Show success notification
		setShowClearSuccess(true);

		// Hide success notification after 3 seconds
		setTimeout(() => {
			setShowClearSuccess(false);
		}, 3000);

		console.log("Form cleared successfully");
	};

	const handleClearCancel = () => {
		setShowClearConfirmation(false);
	};

	// Use the imported useAutofill hook with the correct type
	useAutofill<UnifiedFormData>(
		setValue,
		setDateHired,
		setDateRetired,
		setPhoneInputValue
	);

	// Re-apply autofill after form is cleared
	useEffect(() => {
		if (shouldReapplyAutofill) {
			// Re-apply autofill - use applyAutofill function directly, not the hook
			applyAutofill<UnifiedFormData>(
				setValue,
				setDateHired,
				setDateRetired,
				setPhoneInputValue
			);
			setShouldReapplyAutofill(false);
		}
	}, [
		shouldReapplyAutofill,
		setValue,
		setDateHired,
		setDateRetired,
		setPhoneInputValue,
	]);

	return (
		<div className="form-body">
			{/* Restored data notification */}
			{showRestoredMessage && (
				<div className="info-notification">
					<div className="info-icon">
						<FiInfo size={18} />
					</div>
					<div className="info-content">
						<p>Your previous form data has been restored.</p>
					</div>
					<button
						className="info-close"
						onClick={() => setShowRestoredMessage(false)}
						aria-label="Close notification"
					>
						<FiX size={18} />
					</button>
				</div>
			)}

			{/* Clear success notification */}
			{showClearSuccess && (
				<div className="success-notification">
					<div className="success-icon success">
						<FiCheck size={18} />
					</div>
					<div className="success-content">
						<h4 className="success-title">
							Form Cleared Successfully
						</h4>
						<p className="success-message">
							The form has been reset to default values.
						</p>
					</div>
					<button
						className="success-close"
						onClick={() => setShowClearSuccess(false)}
						aria-label="Close notification"
					>
						<FiX size={18} />
					</button>
				</div>
			)}

			<form onSubmit={handleSubmit(onSubmit)}>
				{isSubmitted && Object.keys(errors).length > 0 && (
					<ValidationErrorDropdown errors={errors} />
				)}

				{/* Only show hospital status for inpatient forms */}
				{origFormType === "inpatient" && (
					<FormHospitalStatus register={register} errors={errors} />
				)}

				<FormPersonalInfo
					register={register}
					errors={errors}
					setValue={setValue}
					watch={watch}
					phoneInputValue={phoneInputValue}
					setPhoneInputValue={setPhoneInputValue}
				/>
				<FormMedicalInfo
					register={register}
					errors={errors}
					formType={origFormType}
					watch={watch}
					setValue={setValue}
				/>
				<FormTeachingInfo
					register={register}
					errors={errors}
					dateHired={dateHired}
					setDateHired={setDateHired}
					dateRetired={dateRetired}
					setDateRetired={setDateRetired}
					setValue={setValue}
					watch={watch}
				/>
				<FormUploadDisclaimer />
				<FormMedicalFiles
					register={register}
					errors={errors}
					setError={setError}
					setValue={setValue}
				/>
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
						onClick={() => setShowClearConfirmation(true)}
					>
						Clear
					</button>
				</div>
			</form>

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
								? uploadProgress
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
		</div>
	);
};

export default FormBody;
