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
import {
	addDoc,
	collection,
	doc,
	getDocs,
	query,
	setDoc,
	Timestamp,
	where,
} from "firebase/firestore";
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
} from "../../../utils/fileUpload.ts";
import { baseFormSchema, UnifiedFormData } from "./FormUtil/formTypes.ts";

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
			.max(2500, "Amount cannot exceed ₱2,500.00"),
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
		employeeID: z.any().nullable().optional(),
		eyeglassesReceipt: z
			.any()
			.refine((files) => files && files.length > 0, {
				message: "Eyeglasses receipt is required",
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
	// Add a state for phone input value at the form level
	const [phoneInputValue, setPhoneInputValue] = useState<string>("+63");
	const [fileErrors, setFileErrors] = useState<Record<string, string>>({});
	const [shouldReapplyAutofill, setShouldReapplyAutofill] = useState(false);
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
		},
	});

	// Apply autofill when component loads
	useAutofill(setValue, setDateHired, undefined, setPhoneInputValue);

	// Re-apply autofill after form is cleared
	useEffect(() => {
		if (shouldReapplyAutofill) {
			// Use applyAutofill function directly, not the hook
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

	// Handler for file input changes
	const handleFileChange =
		(fieldName: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
			const files = e.target.files;
			const result = validateFileListSize(files);

			if (!result.valid) {
				// Set custom file error
				setFileErrors((prev) => ({
					...prev,
					[fieldName]: result.errorMessage,
				}));

				// Clear the input
				e.target.value = "";

				// Set form error
				setError(fieldName as any, {
					type: "manual",
					message: result.errorMessage,
				});
			} else {
				// Clear error if file is valid
				setFileErrors((prev) => ({
					...prev,
					[fieldName]: "",
				}));
			}
		};

	const onSubmit = async (data: FieldValues) => {
		// Show notification immediately with processing state
		setSubmissionStatus("processing");
		setShowSuccessNotification(true);

		try {
			const email = auth?.currentUser?.email;
			const transID = "TRN" + Date.now();

			const filesToUpload = {
				applicantSignature: data.applicantSignature,
				employeeID: data.employeeID,
				eyeglassesReceipt: data.eyeglassesReceipt,
			};

			const fileUploadResults = await uploadFilesAndGetURLs(
				email,
				transID,
				filesToUpload
			);

			// Build new document structure with download URLs
			const newDoc = {
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
					ORNumber: data.ORNumber,
					issuedBy: data.issuedBy,
					amountPaid: data.amountPaid,
					load: data.load,
					dateHired: data.dateHired,
					employeeID: fileUploadResults.employeeID,
					applicantSignature: fileUploadResults.applicantSignature,
					eyeglassesReceipt: fileUploadResults.eyeglassesReceipt,
				},
			};

			await addDoc(collection(db, "FormRequests"), newDoc);
			console.log("Document written with ID: ", transID);

			const usersRef = collection(db, "users");
			const q = query(usersRef, where("email", "==", email));
			const querySnapshot = await getDocs(q);
			querySnapshot.forEach(async (docSnapshot) => {
				const docRef = doc(db, "users", docSnapshot.id);

				await setDoc(
					docRef,
					{ eyeglassesFlag: Timestamp.now() },
					{ merge: true }
				);
				console.log("Document updated successfully.");
			});
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

							{/* Add Date Hired field */}
							<fieldset className="personal-info-container">
								<div className="row mb-3">
									<div className="col-md-3">
										<label
											htmlFor="load"
											className="form-label"
										>
											Load (Units){" "}
											<span className="required-asterisk">
												*
											</span>
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
											Date Hired{" "}
											<span className="required-asterisk">
												*
											</span>
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

							<FormInvoice
								register={register}
								errors={errors}
								setValue={setValue}
								watch={watch}
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
														errors.employeeID ||
														fileErrors.employeeID
															? "is-invalid"
															: ""
													}`}
													{...register("employeeID")}
													name="employeeID"
													onChange={(e) => {
														register(
															"employeeID"
														).onChange(e);
														handleFileChange(
															"employeeID"
														)(e);
													}}
												/>
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
											<td className="d-flex justify-content-center">
												<label
													htmlFor="eyeglassesReceipt"
													className="form-label"
												></label>
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
													data-testid="eyeglassesReceipt"
													onChange={(e) => {
														register(
															"eyeglassesReceipt"
														).onChange(e);
														handleFileChange(
															"eyeglassesReceipt"
														)(e);
													}}
												/>
												{(errors.eyeglassesReceipt ||
													fileErrors.eyeglassesReceipt) && (
													<p className="invalid-feedback">
														{fileErrors.eyeglassesReceipt ||
															(errors
																.eyeglassesReceipt
																?.message as string)}
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
														errors.applicantSignature ||
														fileErrors.applicantSignature
															? "is-invalid"
															: ""
													}`}
													{...register(
														"applicantSignature"
													)}
													name="applicantSignature"
													data-testid="applicantSignature"
													onChange={(e) => {
														register(
															"applicantSignature"
														).onChange(e);
														handleFileChange(
															"applicantSignature"
														)(e);
													}}
												/>
												{(errors.applicantSignature ||
													fileErrors.applicantSignature) && (
													<p className="invalid-feedback">
														{fileErrors.applicantSignature ||
															(errors
																.applicantSignature
																?.message as string)}
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
		</div>
	);
};

export default EyeglassesForm;
