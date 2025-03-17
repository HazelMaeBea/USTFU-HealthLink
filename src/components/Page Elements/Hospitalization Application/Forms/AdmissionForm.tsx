import { useState, useEffect } from "react";
import { FieldValues, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import "react-datepicker/dist/react-datepicker.css";
import "./FormBody.css";
import FormHeader from "./FormHeader";
import FormPersonalInfo from "./FormPersonalInfo";
import FormUploadDisclaimer from "./FormUploadDisclaimer";
import FormMedicalFiles from "./FormMedicalFiles";
import FormCertify from "./FormCertify";
import AdmissionTeachingInfo from "./AdmissionTeachingInfo";
import { doc, setDoc } from "firebase/firestore";
import { auth, db, storage, getFormID } from "../../../../config/firebase.ts";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import BackButton from "./BackButton";
import RemainingBenefit from "./RemainingBenefit";
import "./FormBody.css";
// Update import to use the hook instead of the function
import { useAutofill } from "../Autofill.ts";
import { useNavigate } from "react-router-dom";
import Popout from "../../../Page Elements/Popout/Popout";
import { FiCheck, FiArrowRight, FiX } from "react-icons/fi";

export type FormData = z.infer<typeof schema>;

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
		idNumber: z
			.string({
				required_error: "Please enter your ID number",
				invalid_type_error: "ID number must be text",
			})
			.min(1, "Please enter your ID number"),
		address: z
			.string({
				required_error: "Please enter your address",
				invalid_type_error: "Address must be text",
			})
			.min(1, "Please enter your address"),
		suffix: z
			.string({
				invalid_type_error: "Suffix must be text",
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
		load: z.coerce
			.number({
				required_error: "Please enter your teaching load",
				invalid_type_error: "Teaching load must be a number",
			})
			.min(0, "Teaching load cannot be negative")
			.max(30, "Teaching load cannot exceed 30 units"),
		status: z.string().nonempty("Please select your employment status"),
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
		docRequest: z.any().refine((files) => files && files.length > 0, {
			message: "File is required",
		}),
		hospitalInvoice: z.any().refine((files) => files && files.length > 0, {
			message: "File is required",
		}),
		labInvoice: z.any().refine((files) => files && files.length > 0, {
			message: "File is required",
		}),
		employeeID: z.any().refine((files) => files && files.length > 0, {
			message: "File is required",
		}),
		applicantSignature: z
			.any()
			.refine((files) => files && files.length > 0, {
				message: "File is required",
			}),
		claimRequestCount: z.coerce
			.number({
				invalid_type_error: "Please enter a valid number",
				required_error: "Number of claims is required",
			})
			.min(1, "Please enter at least 1 claim")
			.max(10, "Maximum of 10 claims allowed"),
		certify: z.enum(["Yes"], {
			errorMap: () => ({
				message:
					"You must certify that all information provided is true and correct",
			}),
		}),
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
	});

const AdmissionForm = () => {
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
	const navigate = useNavigate();

	const {
		register,
		handleSubmit,
		reset,
		setValue,
		formState: { errors, isSubmitted },
	} = useForm<FormData>({ resolver: zodResolver(schema), mode: "onChange" });

	// Use the hook directly instead of calling it within useEffect
	useAutofill(setValue, setDateHired, setDateRetired);

	// Add a handler to close the notification with animation
	const closeNotification = () => {
		setIsNotificationHiding(true);

		// After animation completes, hide the notification
		setTimeout(() => {
			setShowSuccessNotification(false);
			setIsNotificationHiding(false);
		}, 300); // Animation duration
	};

	const handleTrackingClick = (e: React.MouseEvent) => {
		e.preventDefault();
		navigate("/tracking");
	};

	const handleClearConfirm = () => {
		reset();
		setShowClearConfirmation(false);
	};

	const handleClearCancel = () => {
		setShowClearConfirmation(false);
	};

	const onSubmit = async (data: FieldValues) => {
		// Show notification immediately with processing state
		setSubmissionStatus("processing");
		setShowSuccessNotification(true);

		try {
			const email = auth?.currentUser?.email;

			const formID = await getFormID(true);
			const formIDString = formID?.toString().padStart(6, "0") || "error";
			setFormIdString(formIDString); // Make sure to set this state for the notification
			const currentYear: string = new Date().getFullYear().toString();

			// Upload and get download URL for applicantSignature
			let imageRef = ref(
				storage,
				`FormRequests/${email}/${currentYear}-${formIDString}-O/${data.applicantSignature[0].name}`
			);
			await uploadBytes(imageRef, data.applicantSignature[0]);
			const applicantSignatureDownloadUrl = await getDownloadURL(
				imageRef
			);

			// Upload and get download URL for docRequest
			imageRef = ref(
				storage,
				`FormRequests/${email}/${currentYear}-${formIDString}-O/${data.docRequest[0].name}`
			);
			await uploadBytes(imageRef, data.docRequest[0]);
			const docRequestDownloadUrl = await getDownloadURL(imageRef);

			// Upload and get download URL for employeeID
			imageRef = ref(
				storage,
				`FormRequests/${email}/${currentYear}-${formIDString}-O/${data.employeeID[0].name}`
			);
			await uploadBytes(imageRef, data.employeeID[0]);
			const employeeIDDownloadUrl = await getDownloadURL(imageRef);

			// Upload and get download URL for hospitalInvoice
			imageRef = ref(
				storage,
				`FormRequests/${email}/${currentYear}-${formIDString}-O/${data.hospitalInvoice[0].name}`
			);
			await uploadBytes(imageRef, data.hospitalInvoice[0]);
			const hospitalInvoiceDownloadUrl = await getDownloadURL(imageRef);

			// Upload and get download URL for labInvoice
			imageRef = ref(
				storage,
				`FormRequests/${email}/${currentYear}-${formIDString}-O/${data.labInvoice[0].name}`
			);
			await uploadBytes(imageRef, data.labInvoice[0]);
			const labInvoiceDownloadUrl = await getDownloadURL(imageRef);

			const pendingRequestData = {
				transactionId: "TRN" + Date.now(),
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
					formType: "admission",
					origFormType: "admission",
					lastname: data["lastname"],
					firstname: data["firstname"],
					middlename: data["middlename"],
					idNumber: data["idNumber"],
					address: data["address"],
					age: data["age"],
					gender: data["gender"],
					contact: data["contact"],
					college: data["college"],
					load: data["load"],
					status: data["status"],
					dateHired: data.dateHired,
					dateRetired: data.dateRetired,
					docRequest: {
						url: docRequestDownloadUrl,
						filename: data.docRequest[0].name,
					},
					hospitalInvoice: {
						url: hospitalInvoiceDownloadUrl,
						filename: data.hospitalInvoice[0].name,
					},
					labInvoice: {
						url: labInvoiceDownloadUrl,
						filename: data.labInvoice[0].name,
					},
					employeeID: {
						url: employeeIDDownloadUrl,
						filename: data.employeeID[0].name,
					},
					applicantSignature: {
						url: applicantSignatureDownloadUrl,
						filename: data.applicantSignature[0].name,
					},
					claimRequestCount: data["claimRequestCount"],
				},
			};

			// Add the pending request document to Firestore.
			await setDoc(
				doc(
					db,
					"FormRequests",
					currentYear + "-" + formIDString + "-O"
				),
				pendingRequestData
			);
			console.log(
				"Document written with ID: ",
				currentYear + "-" + formIDString
			);

			// Show success notification
			setSubmissionStatus("success");

			// Reset form after successful submission
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

	return (
		<div className="form-body">
			<div className="button-container">
				<BackButton />
				<RemainingBenefit />
			</div>
			<div className="container">
				<FormHeader formType="Hospital Admission Form" />
				<div className="form-body">
					<div className="form-container">
						<form onSubmit={handleSubmit(onSubmit)}>
							{isSubmitted && Object.keys(errors).length > 0 && (
								<p className="note">
									Please fill out the following boxes
								</p>
							)}

							<FormPersonalInfo
								register={register}
								errors={errors}
							/>
							<AdmissionTeachingInfo
								register={register}
								errors={errors}
								dateHired={dateHired}
								setDateHired={setDateHired}
								dateRetired={dateRetired}
								setDateRetired={setDateRetired}
								setValue={setValue} // Add setValue prop here
							/>
							<FormUploadDisclaimer />
							<FormMedicalFiles
								register={register}
								errors={errors}
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

			{/* Add success notification component */}
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
		</div>
	);
};

export default AdmissionForm;
