import { useState, useEffect } from "react";
import {
	FieldValues,
	useForm,
	UseFormRegister,
	UseFormSetValue,
	UseFormWatch,
} from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import "react-datepicker/dist/react-datepicker.css";
import "./FormBody.css";
import FormPersonalInfo from "./FormPersonalInfo";
import FormMedicalInfo from "./FormMedicalInfo";
import FormTeachingInfo from "./FormTeachingInfo";
import FormUploadDisclaimer from "./FormUploadDisclaimer";
import FormMedicalFiles from "./FormMedicalFiles";
import FormHospitalStatus from "./FormHospitalStatus";
import FormCertify from "./FormCertify";
import { addDoc, collection } from "firebase/firestore";
import { auth, db } from "../../../../config/firebase.ts";
import { useNavigate } from "react-router-dom";
import Popout from "../../../Page Elements/Popout/Popout";
import { FiCheck, FiArrowRight, FiX } from "react-icons/fi";
import { useAutofill, applyAutofill } from "../Autofill.ts";
import { uploadFilesAndGetURLs } from "../../../../utils/fileUpload.ts";
import { HospitalFormData } from "../../PendingRequests/types.ts";

type FormData = z.infer<typeof schema>;
type UnifiedFormData = FormData & HospitalFormData;

interface FormBodyProps {
	origFormType: string;
}

const schema = z
	.object({
		lastname: z
			.string({
				required_error: "Please enter your last name",
				invalid_type_error: "Last name must be text",
			})
			.min(1, "Please enter your last name"),
		firstname: z
			.string({
				required_error: "Please enter your first name",
				invalid_type_error: "First name must be text",
			})
			.min(1, "Please enter your first name"),
		middlename: z
			.string({
				required_error: "Please enter your middle name",
				invalid_type_error: "Middle name must be text",
			})
			.min(1, "Please enter your middle name"),
		suffix: z
			.string({
				invalid_type_error: "Please enter your suffix",
			})
			.nullish(),
		age: z.coerce
			.number({
				invalid_type_error: "Please enter a valid age",
				required_error: "Age is required",
			})
			.min(18, "You must be at least 18 years old to apply"),
		gender: z.enum(["Male", "Female"], {
			errorMap: () => ({ message: "Please select your gender" }),
		}),
		contact: z.coerce
			.number({
				invalid_type_error: "Please enter a valid contact number",
				required_error: "Contact number is required",
			})
			.min(21, "Please provide a valid contact number"),
		college: z
			.string({
				required_error: "Please select your college",
				invalid_type_error: "Please make a valid selection",
			})
			.min(1, "Please select your college"),
		hospital: z
			.string({
				required_error: "Please enter the hospital name",
				invalid_type_error: "Hospital name must be text",
			})
			.min(1, "Please enter the hospital name"),
		illness: z
			.string({
				required_error: "Please specify your illness/condition",
				invalid_type_error: "Illness/condition must be text",
			})
			.min(1, "Please specify your illness/condition"),
		physician: z
			.string({
				required_error: "Please enter your attending physician's name",
				invalid_type_error: "Physician name must be text",
			})
			.min(1, "Please enter your attending physician's name"),
		procedures: z
			.string({
				required_error: "Please specify the medical procedures",
				invalid_type_error: "Medical procedures must be text",
			})
			.min(1, "Please specify the medical procedures"),
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
			.transform((val) => (val ? new Date(val) : null))
			.optional(),
		dateRetired: z
			.string({
				invalid_type_error: "Please select a valid date",
			})
			.nullable()
			.transform((val) => (val ? new Date(val) : null))
			.optional(),
		benefits: z.preprocess(
			(val) => (val === null ? "" : val),
			z.string().nonempty("Please select your health benefitS")
		),
		hmo: z.string().nullable().optional(),
		docRequest: z.any().refine((files) => files && files.length > 0, {
			message: "Please upload your doctor's request/order",
		}),
		hospitalInvoice: z.any().refine((files) => files && files.length > 0, {
			message: "Please upload the hospital invoice",
		}),
		labInvoice: z.any().refine((files) => files && files.length > 0, {
			message: "Please upload the laboratory invoice",
		}),
		employeeID: z.any().nullable().optional(),
		// employeeID: z.any().refine((files) => files && files.length > 0, {
		// 	message: "Please upload a copy of your employee ID",
		// }),
		applicantSignature: z
			.any()
			.refine((files) => files && files.length > 0, {
				message: "Please upload your signature",
			}),
		hospitalStatus: z.enum(
			["In-Patient", "Out-Patient", "ER Consultation"],
			{
				errorMap: () => ({
					message: "Please select your hospital status",
				}),
			}
		),
		certify: z.enum(["Yes"], {
			errorMap: () => ({
				message:
					"You must certify that all information provided is true and correct",
			}),
		}),
		claimRequestCount: z.coerce
			.number({
				invalid_type_error: "Please enter a valid number",
				required_error: "Number of claims is required",
			})
			.min(1, "Please enter at least 1 claim")
			.max(10, "Maximum of 10 claims allowed"),
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
		if (data.benefits === "HMO" && (!data.hmo || data.hmo.trim() === "")) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Please specify your HMO provider name",
				path: ["hmo"],
			});
		}
	});

const FormBody = ({ origFormType }: FormBodyProps) => {
	const [dateHired, setDateHired] = useState<Date | null>(null);
	const [dateRetired, setDateRetired] = useState<Date | null>(null);
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
	const [uploadProgress, setUploadProgress] =
		useState<string>("Preparing files...");
	const navigate = useNavigate();
	const [phoneInputValue, setPhoneInputValue] = useState<string>("+63");
	const [shouldReapplyAutofill, setShouldReapplyAutofill] = useState(false);

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
				const filesToUpload = {
					applicantSignature: data.applicantSignature,
					docRequest: data.docRequest,
					employeeID: data.employeeID,
					hospitalInvoice: data.hospitalInvoice,
					labInvoice: data.labInvoice,
				};

				// Pre-process and optimize files before upload
				setUploadProgress("Optimizing files...");

				// Use the new utility to upload all files and get URLs in one operation
				setUploadProgress(
					"Uploading files (this may take a moment)..."
				);
				const transID = "TRN" + Date.now();
				const fileUploadResults = await uploadFilesAndGetURLs(
					email,
					transID,
					filesToUpload
				);

				setUploadProgress("Creating document...");
				// Build new document structure using download URLs
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
						term: data.term,
						year: data.year,
						load: data.load,
						status: data.status,
						benefits: data.benefits,
						hmo: data.hmo,
						docRequest: fileUploadResults.docRequest,
						hospitalInvoice: fileUploadResults.hospitalInvoice,
						labInvoice: fileUploadResults.labInvoice,
						employeeID: fileUploadResults.employeeID,
						applicantSignature:
							fileUploadResults.applicantSignature,
						hospitalStatus: data.hospitalStatus,
						claimRequestCount: data.claimRequestCount,
					},
				};

				setUploadProgress("Saving to database...");
				await addDoc(collection(db, "FormRequests"), newDoc);

				console.log("Document written with Transaction ID: ", transID);
				// Show success notification instead of old popup
				setSubmissionStatus("success");

				// Reset form after successful submission
			}
			reset();
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

	const handleClearConfirm = () => {
		// Reset form with empty select values
		reset({
			gender: undefined,
			college: "",
			term: "",
			year: "",
			status: "",
			benefits: "",
			hospitalStatus: undefined,
		});

		// Set flag to reapply autofill - moved outside the reset object
		setShouldReapplyAutofill(true);

		// Reset states
		setDateHired(null);
		setDateRetired(null);
		setPhoneInputValue("+63");
		setShowClearConfirmation(false);
	};

	const handleClearCancel = () => {
		setShowClearConfirmation(false);
	};

	// Use the imported useAutofill hook
	useAutofill(setValue, setDateHired, setDateRetired, setPhoneInputValue);

	// Re-apply autofill after form is cleared
	useEffect(() => {
		if (shouldReapplyAutofill) {
			// Re-apply autofill - use applyAutofill function directly, not the hook
			applyAutofill(
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
			<form onSubmit={handleSubmit(onSubmit)}>
				{isSubmitted && Object.keys(errors).length > 0 && (
					<p className="note">Please fill out the following boxes</p>
				)}

				<FormPersonalInfo
					register={register as UseFormRegister<HospitalFormData>}
					errors={errors}
					setValue={setValue as UseFormSetValue<HospitalFormData>}
					watch={watch as UseFormWatch<HospitalFormData>}
					phoneInputValue={phoneInputValue}
					setPhoneInputValue={setPhoneInputValue}
				/>
				<FormMedicalInfo
					register={register as UseFormRegister<HospitalFormData>}
					errors={errors}
				/>
				<FormTeachingInfo
					register={register as UseFormRegister<HospitalFormData>}
					errors={errors}
					dateHired={dateHired}
					setDateHired={setDateHired}
					dateRetired={dateRetired}
					setDateRetired={setDateRetired}
					setValue={setValue as UseFormSetValue<HospitalFormData>}
					watch={watch as UseFormWatch<HospitalFormData>}
				/>
				<FormUploadDisclaimer />
				<FormMedicalFiles
					register={register as UseFormRegister<HospitalFormData>}
					errors={errors}
					setError={setError}
				/>
				<FormHospitalStatus
					register={register as UseFormRegister<HospitalFormData>}
					errors={errors}
				/>
				<FormCertify
					register={register as UseFormRegister<HospitalFormData>}
					errors={errors}
				/>

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
