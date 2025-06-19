import React, { useEffect, useState } from "react";
import {
	UseFormRegister,
	FieldErrors,
	UseFormSetError,
	UseFormSetValue,
} from "react-hook-form";
import { validateFileListSize } from "../../../../utils/fileUpload";
import { UnifiedFormData } from "../FormUtil/formTypes";
import { useRevisionStore } from "../../../Page Elements/RevisionFuncs/revisionStore.ts";
import ViewFiles from "../../../Page Elements/ViewFiles/ViewFiles.tsx";
import { auth } from "../../../../contexts/firebase";
import {
	uploadFileWithProgress,
	UploadProgress,
} from "../../../../utils/progressiveUpload";
import {
	storeTempFilePaths,
	cleanupFormTempFiles,
} from "../../../../utils/fileCleanup";
import { FiCheck, FiUploadCloud, FiX } from "react-icons/fi";

type FileState = {
	[key: string]: string | null; // Each field (e.g., "applicantSignature") can have a string (file URL) or null
};

const fileFields = [
	"employeeID",
	"applicantSignature",
	"docRequest",
	"hospitalInvoice",
	"labInvoice",
] as const;

type FileField = (typeof fileFields)[number];

let pendingUnmountId: string | null = null;

interface FormMedicalFilesProps {
	register: UseFormRegister<UnifiedFormData>;
	errors: FieldErrors<UnifiedFormData>;
	setError?: UseFormSetError<UnifiedFormData>;
	setValue: UseFormSetValue<UnifiedFormData>;
	onFileUploaded: (fieldName: string, url: string, tempPath: string) => void;
	onUploadStatusChange: (allFilesUploaded: boolean) => void;
}

const FormMedicalFiles: React.FC<FormMedicalFilesProps> = ({
	register,
	errors,
	setError,
	setValue,
	onFileUploaded,
	onUploadStatusChange,
}) => {
	const [fileErrors, setFileErrors] = useState<Record<string, string>>({});
	const [files, setFiles] = useState<any>({});
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [previewFile, setPreviewFile] = useState<any>(null);
	const [isFileInput, setIsFileInput] = useState<Record<FileField, boolean>>({
		employeeID: false,
		applicantSignature: false,
		docRequest: false,
		hospitalInvoice: false,
		labInvoice: false,
	});

	// Add upload progress tracking state
	const [uploadProgress, setUploadProgress] = useState<
		Record<string, UploadProgress>
	>({
		employeeID: { progress: 0, status: "idle", url: null, tempPath: null },
		applicantSignature: {
			progress: 0,
			status: "idle",
			url: null,
			tempPath: null,
		},
		docRequest: { progress: 0, status: "idle", url: null, tempPath: null },
		hospitalInvoice: {
			progress: 0,
			status: "idle",
			url: null,
			tempPath: null,
		},
		labInvoice: { progress: 0, status: "idle", url: null, tempPath: null },
	});

	// Track temporary file paths for cleanup if form is not submitted
	const [tempFilePaths, setTempFilePaths] = useState<string[]>([]);
	const [requiredUploadsInProgress, setRequiredUploadsInProgress] =
		useState(false);

	const { formData, isRevisionMode, transactionId } = useRevisionStore();
	const updateFileInputStates = (newFiles: any) => {
		const inputStates = Object.fromEntries(
			fileFields.map((key) => [key, Boolean(newFiles[key])])
		) as Record<FileField, boolean>;
		setIsFileInput(inputStates);
	};
	const [isNewUpload, setIsNewUpload] = useState({
		employeeID: false,
		applicantSignature: false,
		docRequest: false,
		hospitalInvoice: false,
		labInvoice: false,
	});

	// Check if all required uploads are complete
	useEffect(() => {
		// Define required fields (employeeID is optional)
		const requiredFields = [
			"applicantSignature",
			"docRequest",
			"hospitalInvoice",
			"labInvoice",
		];

		// Check if any required field is in 'uploading' status
		const uploadsInProgress = requiredFields.some(
			(field) => uploadProgress[field]?.status === "uploading"
		);

		// Check if all required fields have been successfully uploaded
		const allRequiredUploaded = requiredFields.every(
			(field) =>
				uploadProgress[field]?.status === "success" ||
				(isRevisionMode &&
					!isNewUpload[field as FileField] &&
					files[field])
		);

		setRequiredUploadsInProgress(uploadsInProgress);
		onUploadStatusChange(allRequiredUploaded && !uploadsInProgress);
	}, [
		uploadProgress,
		isRevisionMode,
		isNewUpload,
		files,
		onUploadStatusChange,
	]);

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
				applicantSignature: formData.applicantSignature,
				docRequest: formData.docRequest,
				hospitalInvoice: formData.hospitalInvoice,
				labInvoice: formData.labInvoice,
				employeeID: formData.employeeID,
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
	}, [files, isRevisionMode]);

	useEffect(() => {
		console.log("isRevisionMode changed:", isRevisionMode);
	}, [isRevisionMode]);

	useEffect(() => {
		console.log("Files state changed:", files);
	}, [files]);

	useEffect(() => {
		if (isRevisionMode && formData?.claimRequestCount !== undefined) {
			setValue("claimRequestCount", formData.claimRequestCount);
		}
	}, [formData, isRevisionMode, setValue]);

	// Update progress tracking callback
	const handleUploadProgress = (
		fieldName: string,
		progress: UploadProgress
	) => {
		setUploadProgress((prev) => ({
			...prev,
			[fieldName]: progress,
		}));
	};

	// Handler for file input changes - now with progressive upload
	const handleFileChange =
		(fieldName: keyof UnifiedFormData) =>
		async (e: React.ChangeEvent<HTMLInputElement>) => {
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

				// Set form error if setError is provided
				if (setError) {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					setError(fieldName as any, {
						type: "manual",
						message: result.errorMessage,
					});
				}
			} else {
				// Handle valid files
				if (files && files.length > 0) {
					const file = files[0];

					try {
						// Start the upload immediately
						const email = auth?.currentUser?.email;
						const formType = "hospital"; // Use a more specific form type if available

						// Set status to uploading
						handleUploadProgress(fieldName, {
							progress: 0,
							status: "uploading",
							url: null,
							tempPath: null,
						});

						// Upload the file with progress tracking
						const { url, tempPath } = await uploadFileWithProgress(
							file,
							fieldName,
							email,
							(field, progress) =>
								handleUploadProgress(field, progress),
							formType
						);

						// Add to temp paths for potential cleanup
						setTempFilePaths((prev) => [...prev, tempPath]);

						// Update the file state with the uploaded URL
						setFiles((prevFiles: FileState) => ({
							...prevFiles,
							[fieldName]: url,
						}));

						// Notify parent component about the uploaded file
						onFileUploaded(fieldName, url, tempPath);

						// Set as new upload
						setIsNewUpload((prev) => ({
							...prev,
							[fieldName]: true,
						}));

						// Clear error if file is valid
						setFileErrors((prev) => ({
							...prev,
							[fieldName]: "",
						}));
					} catch (error: any) {
						console.error(`Error uploading ${fieldName}:`, error);
						setFileErrors((prev) => ({
							...prev,
							[fieldName]: `Upload failed: ${
								error.message || "Unknown error"
							}`,
						}));

						handleUploadProgress(fieldName, {
							progress: 0,
							status: "error",
							url: null,
							tempPath: null,
							error: error.message,
						});
					}
				}
			}
		};

	// Handle modal opening and closing
	const openModal = (file: any) => {
		setPreviewFile(file);
		setIsModalOpen(true);
	};

	const closeModal = () => {
		setIsModalOpen(false);
		setPreviewFile(null);
	};

	// Render file input with progress indicator
	const renderFileInput = (
		fieldName: keyof UnifiedFormData,
		label: string,
		isRequired: boolean = false
	) => {
		const progress = uploadProgress[fieldName];
		const containerClassName = `file-upload-container ${
			progress.status === "success"
				? "upload-success"
				: progress.status === "error"
				? "upload-error"
				: ""
		} ${progress.progress === 100 ? "complete" : ""}`;

		return (
			<tr>
				<td>
					{label}{" "}
					{isRequired && <span className="required-asterisk">*</span>}
				</td>
				<td className="d-flex justify-content-center">
					{isFileInput[fieldName as FileField] &&
					files[fieldName] &&
					isRevisionMode &&
					!isNewUpload[fieldName as FileField] ? (
						<div className="d-flex gap-2">
							<button
								type="button"
								className="btn btn-outline-secondary btn-sm"
								onClick={() =>
									setIsFileInput((prev) => ({
										...prev,
										[fieldName]: false,
									}))
								}
							>
								Re-upload File
							</button>
							<a
								href="#"
								onClick={(e) => {
									e.preventDefault();
									openModal(files[fieldName]);
								}}
								className="btn btn-outline-primary btn-sm"
							>
								View Previously Uploaded File
							</a>
						</div>
					) : (
						<div className={containerClassName}>
							{progress.status === "uploading" && (
								<div
									className="file-upload-progress-overlay"
									style={{ width: `${progress.progress}%` }}
								></div>
							)}
							<input
								id={fieldName}
								type="file"
								accept=".pdf, .png, .jpg, .jpeg"
								className={`form-control ${
									errors[
										fieldName as keyof UnifiedFormData
									] || fileErrors[fieldName]
										? "is-invalid"
										: ""
								}`}
								{...register(fieldName)}
								name={fieldName}
								onChange={(e) => {
									register(fieldName).onChange(e);
									handleFileChange(fieldName)(e);
								}}
								disabled={progress.status === "uploading"}
							/>
							{progress.status !== "idle" && (
								<div className="file-upload-status">
									{progress.status === "uploading" &&
										`${progress.progress}%`}
									{progress.status === "success" && (
										<FiCheck />
									)}
									{progress.status === "error" && <FiX />}
								</div>
							)}
							{progress.status === "error" && (
								<div className="upload-error-message">
									{progress.error || "Upload failed"}
								</div>
							)}
						</div>
					)}
					{(errors[fieldName as keyof UnifiedFormData] ||
						fileErrors[fieldName]) && (
						<p className="invalid-feedback">
							{fileErrors[fieldName] ||
								(errors[fieldName as keyof UnifiedFormData]
									?.message as string)}
						</p>
					)}
				</td>
			</tr>
		);
	};

	return (
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
					{renderFileInput("employeeID", "Employee/UST ID")}
					{renderFileInput(
						"docRequest",
						"Doctor's Note or Request",
						true
					)}
					{renderFileInput(
						"hospitalInvoice",
						"Hospital Receipt/Invoice",
						true
					)}
					{renderFileInput(
						"labInvoice",
						"Laboratory Receipt/Invoice",
						true
					)}
					{renderFileInput(
						"applicantSignature",
						"Applicant's Signature",
						true
					)}
				</tbody>
			</table>

			<div className="claim-request-container">
				<div className="claim-request">
					<div>
						<label htmlFor="claimRequestCount"> </label>
						How many claims do you want to request?{" "}
						<span className="required-asterisk">*</span>
						<br />
						<span className="claim-example">
							(e.g. Multiple Therapy Visits for 3 weeks, Scheduled
							multiple operations)
						</span>
						<div className="claim-input">
							<input
								{...register("claimRequestCount", {
									valueAsNumber: true,
									min: 1,
									max: 10,
								})}
								id="claimRequestCount"
								type="number"
								className="form-control claimRequestCount"
								placeholder="1-10"
							/>

							<span
								className="claim-text"
								style={{ fontWeight: "normal" }}
							>
								{" "}
								claims
							</span>
						</div>
						{errors.claimRequestCount && (
							<span
								className="text-danger claim-error"
								style={{ fontWeight: "normal" }}
							>
								{" "}
								{errors.claimRequestCount.message}
							</span>
						)}
					</div>
				</div>
			</div>
			{isModalOpen && (
				<ViewFiles file={previewFile} onClose={closeModal} />
			)}

			{requiredUploadsInProgress && (
				<div className="alert alert-warning mt-3">
					<FiUploadCloud className="me-2" />
					Please wait for all files to finish uploading before
					submitting the form.
				</div>
			)}
		</div>
	);
};

export default FormMedicalFiles;
