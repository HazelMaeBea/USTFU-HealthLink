import { useState, useEffect } from "react";
import { FieldValues, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import "react-datepicker/dist/react-datepicker.css";
import "./FormBody.css";
import FormHeader from "./FormHeader";
import FormPersonalInfo from "./FormPersonalInfo";
import FormInvoice from "./FormInvoice";
import FormUploadDisclaimer from "./FormUploadDisclaimer";
import FormCertify from "./FormCertify";
import { doc, setDoc } from "firebase/firestore";
import { auth, db, getFormID, storage } from "../../../../config/firebase.ts";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import BackButton from "./BackButton";
import RemainingBenefit from "./RemainingBenefit.tsx";
import { useNavigate } from "react-router-dom";
import Popout from "../../../Page Elements/Popout/Popout";
import { FiCheck, FiArrowRight, FiX } from "react-icons/fi";
// Update import to use .ts extension explicitly and use the correct function name
import { useAutofill } from "../Autofill.ts";

export type FormData = z.infer<typeof schema>;

const schema = z.object({
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
	ORNumber: z.string().nonempty("Please enter a valid OR Number"),
	issuedBy: z.string().nonempty("Please enter a valid Issue By"),
	amountPaid: z.coerce
		.number({
			invalid_type_error: "Please enter a valid amount",
			required_error: "Amount Paid is required",
		})
		.min(1, "Amount must be greater than 0"),
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
	dateHired: z
		.string({
			invalid_type_error: "Please select a valid date",
		})
		.nullable()
		.transform((val) => (val ? new Date(val) : null))
		.optional(),
	employeeID: z.any().refine((files) => files && files.length > 0, {
		message: "File is required",
	}),
	applicantSignature: z.any().refine((files) => files && files.length > 0, {
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
});

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
	const navigate = useNavigate();

	const {
		register,
		handleSubmit,
		reset,
		setValue,
		formState: { errors, isSubmitted },
	} = useForm<FormData>({ resolver: zodResolver(schema), mode: "onChange" });

	// Use the useAutofill hook correctly at the component level
	useAutofill(setValue, setDateHired);

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
			setFormIdString(formIDString);
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

			// Upload and get download URL for employeeID
			imageRef = ref(
				storage,
				`FormRequests/${email}/${currentYear}-${formIDString}-O/${data.employeeID[0].name}`
			);
			await uploadBytes(imageRef, data.employeeID[0]);
			const employeeIDDownloadUrl = await getDownloadURL(imageRef);

			// Build new document structure with download URLs
			const newDoc = {
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
					formType: "eyeglasses",
					origFormType: "eyeglasses",
					lastname: data.lastname,
					firstname: data.firstname,
					middlename: data.middlename,
					age: data.age,
					gender: data.gender,
					contact: data.contact,
					college: data.college,
					ORNumber: data.ORNumber,
					issuedBy: data.issuedBy,
					amountPaid: data.amountPaid,
					load: data.load,
					dateHired: data.dateHired,
					employeeID: {
						url: employeeIDDownloadUrl,
						filename: data.employeeID[0].name,
					},
					applicantSignature: {
						url: applicantSignatureDownloadUrl,
						filename: data.applicantSignature[0].name,
					},
					claimRequestCount: data.claimRequestCount,
				},
			};

			await setDoc(
				doc(
					db,
					"FormRequests",
					currentYear + "-" + formIDString + "-O"
				),
				newDoc
			);
			console.log("Document written with ID: ", formIDString);

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
				<FormHeader formType="Eyeglasses Form" />
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

							{/* Add Date Hired field */}
							<fieldset className="personal-info-container">
								<div className="row mb-3">
									<div className="col-md-3">
										<label
											htmlFor="load"
											className="form-label"
										>
											Load (Units){" "}
										</label>
										<input
											id="load"
											type="number"
											className={`form-control ${
												errors.load ? "is-invalid" : ""
											}`}
											{...register("load", {
												valueAsNumber: true,
											})}
											name="load"
											min="0"
											max="30"
											placeholder="Enter units"
										/>
										{errors.load && (
											<div className="invalid-feedback">
												{
													errors.load
														?.message as React.ReactNode
												}
											</div>
										)}
									</div>
									<div className="col-md-6">
										<label
											htmlFor="dateHired"
											className="form-label"
										>
											Date Hired
										</label>
										<input
											type="date"
											{...register("dateHired")}
											id="dateHired"
											className={`form-control ${
												errors.dateHired
													? "is-invalid"
													: ""
											}`}
											onChange={(e) => {
												const date = e.target.value
													? new Date(e.target.value)
													: null;
												setDateHired(date);
												register("dateHired").onChange(
													e
												);
											}}
											style={{ color: "black" }}
										/>
										{errors.dateHired && (
											<p className="text-danger">
												{
													errors.dateHired
														?.message as string
												}
											</p>
										)}
									</div>
								</div>
							</fieldset>

							<FormInvoice register={register} errors={errors} />
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
											<td className="d-flex justify-content-center">
												<label
													htmlFor="employeeID"
													className="form-label"
												></label>
												<input
													id="employeeID"
													type="file"
													accept=".pdf, .png, .jpg, .jpeg"
													className={`form-control ${
														errors.employeeID
															? "is-invalid"
															: ""
													}`}
													{...register("employeeID")}
													name="employeeID"
												/>
												{errors.employeeID && (
													<p className="invalid-feedback">
														{
															errors.employeeID
																?.message as string
														}
													</p>
												)}
											</td>
										</tr>
										<tr>
											<td>Applicant's Signature</td>
											<td className="d-flex justify-content-center">
												<label
													htmlFor="applicantSignature"
													className="form-label"
												></label>
												<input
													id="applicantSignature"
													type="file"
													accept=".pdf, .png, .jpg, .jpeg"
													className={`form-control ${
														errors.applicantSignature
															? "is-invalid"
															: ""
													}`}
													{...register(
														"applicantSignature"
													)}
													name="applicantSignature"
												/>
												{errors.applicantSignature && (
													<p className="invalid-feedback">
														{
															errors
																.applicantSignature
																?.message as string
														}
													</p>
												)}
											</td>
										</tr>
									</tbody>
								</table>
								<div className="claim-request-container">
									<div className="claim-request">
										<div>
											<label htmlFor="claimRequestCount">
												{" "}
											</label>
											How many claims do you want to
											request?
											<br />
											<span className="claim-example">
												(e.g. Multiple Therapy Visits
												for 3 weeks, Scheduled multiple
												operations)
											</span>
											<div className="claim-input">
												<input
													{...register(
														"claimRequestCount",
														{
															valueAsNumber: true,
															min: 1,
															max: 10,
														}
													)}
													id="claimRequestCount"
													type="number"
													className="form-control claimRequestCount"
													placeholder="1-10"
												/>
												<span
													className="claim-text"
													style={{
														fontWeight: "normal",
													}}
												>
													{" "}
													claims
												</span>
											</div>
											{errors.claimRequestCount && (
												<span
													className="text-danger claim-error"
													style={{
														fontWeight: "normal",
													}}
												>
													{" "}
													{
														errors.claimRequestCount
															.message
													}
												</span>
											)}
										</div>
									</div>
								</div>
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
		</div>
	);
};

export default EyeglassesForm;
