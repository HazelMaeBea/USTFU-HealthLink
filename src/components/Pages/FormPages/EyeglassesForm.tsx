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
} from "../../../utils/fileUpload.ts";
import { baseFormSchema, UnifiedFormData } from "./FormUtil/formTypes.ts";
import { pushPendingNotification } from "../../Page Elements/NotifBadge/NotifTrigger.ts";
import { useRevisionStore } from "../../Page Elements/RevisionFuncs/revisionStore.ts";
import { useRemoveRequest } from "../../Page Elements/RevisionFuncs/removeRequest.ts";
import ViewFiles from "../../Page Elements/ViewFiles/ViewFiles.tsx";

type FileState = {
	[key: string]: string | null; // Each field (e.g., "applicantSignature") can have a string (file URL) or null
};

const fileFields = [
	"employeeID",
	"applicantSignature",
	"eyeglassesReceipt",
] as const;

type FileField = (typeof fileFields)[number];

let pendingUnmountId: string | null = null;
import {
	saveFormData,
	loadFormData,
	clearFormData,
} from "./FormUtil/formPresistence.ts";

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
				// Handle valid files
				if (files && files.length > 0) {
					const file = files[0];
					// Assuming you're uploading and receiving a file URL back from the upload service
					const uploadedFileUrl = URL.createObjectURL(file); // Example of a temporary URL

					// Update the file state with the new uploaded file URL
					setFiles((prevFiles: FileState) => ({
						...prevFiles,
						[fieldName]: uploadedFileUrl, // You can replace this with your actual file URL
					}));
				}

				setIsNewUpload((prev) => ({
					...prev,
					[fieldName]: true,
				}));

				// Clear error if file is valid
				setFileErrors((prev) => ({
					...prev,
					[fieldName]: "",
				}));
			}
		};

	const onSubmit = async (data: FieldValues) => {
		setSubmissionStatus("processing");
		setShowSuccessNotification(true);

		try {
			const email = auth?.currentUser?.email;

			const filesToUpload = {
				applicantSignature: data.applicantSignature,
				docRequest: data.docRequest,
				eyeglassesReceipt: data.eyeglassesReceipt,
				employeeID: data.employeeID,
			};

			const transID = isRevisionMode ? transactionId : "TRN" + Date.now(); // Use existing transactionId for revision mode
			setFormIdString(transID);

			const fileUploadResults = await uploadFilesAndGetURLs(
				email,
				transID,
				filesToUpload
			);

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
					docRequest: fileUploadResults.docRequest
						? {
								url: fileUploadResults.docRequest,
								filename:
									filesToUpload.docRequest?.[0]?.name ||
									"document.pdf",
						  }
						: "",
					eyeglassesReceipt: fileUploadResults.eyeglassesReceipt
						? {
								url: fileUploadResults.eyeglassesReceipt,
								filename:
									filesToUpload.eyeglassesReceipt?.[0]
										?.name || "receipt.pdf",
						  }
						: "",
					...(fileUploadResults.employeeID
						? {
								employeeID: {
									url: fileUploadResults.employeeID,
									filename:
										filesToUpload.employeeID?.[0]?.name ||
										"employee_id.pdf",
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
					console.error("Error removing previous request:", error);
					// Handle the error appropriately (e.g., show a message to the user)
				}
			}

			await addDoc(collection(db, "FormRequests"), pendingRequestData);
			console.log("Document written with ID: ", transID);

			// Show success notification
			setSubmissionStatus("success");

			await pushPendingNotification(transID);

			// Clear persisted form data after successful submission
			clearFormData("eyeglasses");

			// Reset form after successful submission
			resetRevision();
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

	const { removeRequest } = useRemoveRequest();
	const [files, setFiles] = useState<any>({});
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [previewFile, setPreviewFile] = useState<any>(null);
	const [isFileInput, setIsFileInput] = useState<Record<FileField, boolean>>({
		employeeID: false,
		applicantSignature: false,
		eyeglassesReceipt: false,
	});
	const { formData, isRevisionMode, transactionId } = useRevisionStore();
	const resetRevision = useRevisionStore((state) => state.resetRevision);
	const updateFileInputStates = (newFiles: any) => {
		const inputStates = Object.fromEntries(
			fileFields.map((key) => [key, Boolean(newFiles[key])])
		) as Record<FileField, boolean>;
		setIsFileInput(inputStates);
	};
	const [isNewUpload, setIsNewUpload] = useState({
		employeeID: false,
		applicantSignature: false,
		eyeglassesReceipt: false,
	});

	useEffect(() => {
		return () => {
			console.log("Component unmounting...");
			console.log("isRevisionMode:", isRevisionMode);
			console.log("transactionId:", transactionId);

			pendingUnmountId = transactionId;

			setTimeout(() => {
				const {
					transactionId: currentId,
					isRevisionMode: currentRev,
					resetRevision,
				} = useRevisionStore.getState();

				// Only reset if the same transactionId hasn’t come back
				if (pendingUnmountId === currentId && currentRev) {
					console.log("Resetting revision due to true unmount");
					resetRevision();
				} else {
					console.log("Skipping resetRevision - likely remounted");
				}

				pendingUnmountId = null; // clean up
			}, 100);
		};
	}, [transactionId]);

	useEffect(() => {
		if (transactionId) {
			if (pendingUnmountId === transactionId) {
				console.log("Remount detected - preventing reset");
				pendingUnmountId = null;
			}
		}
	}, [transactionId]);

	useEffect(() => {
		if (isRevisionMode && formData) {
			// Populate form values
			Object.keys(formData).forEach((key) => {
				setValue(
					key as keyof UnifiedFormData,
					formData[key as keyof UnifiedFormData]
				);
			});

			// Set files based on formData
			const prefills = {
				employeeID: formData.employeeID,
				eyeglassesReceipt: formData.eyeglassesReceipt,
				applicantSignature: formData.applicantSignature,
			};
			setFiles(prefills);
			updateFileInputStates(prefills);
		}
	}, [formData, isRevisionMode, setValue]);

	useEffect(() => {
		if (isRevisionMode && files) {
			updateFileInputStates(files);
			console.log(`Updated isFileInput: ${JSON.stringify(isFileInput)}`);
		}
	}, [files, isRevisionMode, isFileInput]);

	useEffect(() => {
		console.log("isRevisionMode changed:", isRevisionMode);
	}, [isRevisionMode]);

	useEffect(() => {
		console.log("Files state changed:", files);
	}, [files]);

	// Handle modal opening and closing
	const openModal = (file: any) => {
		setPreviewFile(file);
		setIsModalOpen(true);
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
											<td className="d-flex justify-content-center">
												{isFileInput["employeeID"] &&
												files.employeeID &&
												isRevisionMode &&
												!isNewUpload["employeeID"] ? (
													<div className="d-flex gap-2">
														<button
															type="button"
															className="btn btn-outline-secondary btn-sm"
															onClick={() =>
																setIsFileInput(
																	(prev) => ({
																		...prev,
																		employeeID:
																			false,
																	})
																)
															}
														>
															Re-upload File
														</button>
														<a
															href="#"
															onClick={(e) => {
																e.preventDefault();
																openModal(
																	files.employeeID
																);
															}}
															className="btn btn-outline-primary btn-sm"
														>
															View Previously
															Uploaded File
														</a>
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
														onChange={(e) => {
															register(
																"employeeID"
															).onChange(e);
															handleFileChange(
																"employeeID"
															)(e);
														}}
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
											<td className="d-flex justify-content-center">
												{isFileInput[
													"eyeglassesReceipt"
												] &&
												files.eyeglassesReceipt &&
												isRevisionMode &&
												!isNewUpload[
													"eyeglassesReceipt"
												] ? (
													<div className="d-flex gap-2">
														<button
															type="button"
															className="btn btn-outline-secondary btn-sm"
															onClick={() =>
																setIsFileInput(
																	(prev) => ({
																		...prev,
																		eyeglassesReceipt:
																			false,
																	})
																)
															}
														>
															Re-upload File
														</button>
														<a
															href="#"
															onClick={(e) => {
																e.preventDefault();
																openModal(
																	files.eyeglassesReceipt
																);
															}}
															className="btn btn-outline-primary btn-sm"
														>
															View Previously
															Uploaded File
														</a>
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
														onChange={(e) => {
															register(
																"eyeglassesReceipt"
															).onChange(e);
															handleFileChange(
																"eyeglassesReceipt"
															)(e);
														}}
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
												Applicant's Signature{" "}
												<span className="required-asterisk">
													*
												</span>
											</td>
											<td className="d-flex justify-content-center">
												{isFileInput[
													"applicantSignature"
												] &&
												files.applicantSignature &&
												isRevisionMode &&
												!isNewUpload[
													"applicantSignature"
												] ? (
													<div className="d-flex gap-2">
														<button
															type="button"
															className="btn btn-outline-secondary btn-sm"
															onClick={() =>
																setIsFileInput(
																	(prev) => ({
																		...prev,
																		applicantSignature:
																			false,
																	})
																)
															} // Switch to file input when clicked
														>
															Re-upload File
														</button>
														<a
															href="#"
															onClick={(e) => {
																e.preventDefault();
																openModal(
																	files.applicantSignature
																); // Open the modal with file preview
															}}
															target="_blank"
															rel="noopener noreferrer"
															className="btn btn-outline-primary btn-sm"
														>
															View Previously
															Uploaded File
														</a>
													</div>
												) : (
													<input
														id="applicantSignature"
														type="file"
														accept=".pdf, .png, .jpg, .jpeg"
														className={`form-control ${
															errors.applicantSignature &&
															!files.applicantSignature
																? "is-invalid"
																: ""
														}`}
														{...register(
															"applicantSignature"
														)}
														name="applicantSignature"
														onChange={(e) => {
															register(
																"applicantSignature"
															).onChange(e);
															handleFileChange(
																"applicantSignature"
															)(e);
														}}
													/>
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
