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
}

const FormMedicalFiles: React.FC<FormMedicalFilesProps> = ({
	register,
	errors,
	setError,
	setValue,
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
											setIsFileInput((prev) => ({
												...prev,
												employeeID: false,
											}))
										}
									>
										Re-upload File
									</button>
									<a
										href="#"
										onClick={(e) => {
											e.preventDefault();
											openModal(files.employeeID);
										}}
										className="btn btn-outline-primary btn-sm"
									>
										View Previously Uploaded File
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
									{...register("employeeID")}
									name="employeeID"
									onChange={(e) => {
										register("employeeID").onChange(e);
										handleFileChange("employeeID")(e);
									}}
								/>
							)}
							{/* {(errors.employeeID || fileErrors.employeeID) && (
								<p className="invalid-feedback">
									{fileErrors.employeeID ||
										(errors.employeeID?.message as string)}
								</p>
							)} */}
						</td>
					</tr>
					<tr>
						<td>
							Doctor's Note or Request{" "}
							<span className="required-asterisk">*</span>
						</td>
						<td className="d-flex justify-content-center">
							{isFileInput["docRequest"] &&
							files.docRequest &&
							isRevisionMode &&
							!isNewUpload["docRequest"] ? (
								<div className="d-flex gap-2">
									<button
										type="button"
										className="btn btn-outline-secondary btn-sm"
										onClick={() =>
											setIsFileInput((prev) => ({
												...prev,
												docRequest: false,
											}))
										} // Switch to file input when clicked
									>
										Re-upload File
									</button>
									<a
										href="#"
										onClick={(e) => {
											e.preventDefault();
											openModal(files.docRequest); // Open the modal with file preview
										}}
										target="_blank"
										rel="noopener noreferrer"
										className="btn btn-outline-primary btn-sm"
									>
										View Previously Uploaded File
									</a>
								</div>
							) : (
								<input
									id="docRequest"
									type="file"
									accept=".pdf, .png, .jpg, .jpeg"
									className={`form-control ${
										errors.docRequest ||
										fileErrors.docRequest
											? "is-invalid"
											: ""
									}`}
									{...register("docRequest")}
									name="docRequest"
									onChange={(e) => {
										register("docRequest").onChange(e);
										handleFileChange("docRequest")(e);
									}}
								/>
							)}
							{/* {(errors.docRequest || fileErrors.docRequest) && (
								<p className="invalid-feedback">
									{fileErrors.docRequest ||
										(errors.docRequest?.message as string)}
								</p>
							)} */}
						</td>
					</tr>
					<tr>
						<td>
							Hospital Receipt/Invoice{" "}
							<span className="required-asterisk">*</span>
						</td>
						<td className="d-flex justify-content-center">
							{isFileInput["hospitalInvoice"] &&
							files.hospitalInvoice &&
							isRevisionMode &&
							!isNewUpload["hospitalInvoice"] ? (
								<div className="d-flex gap-2">
									<button
										type="button"
										className="btn btn-outline-secondary btn-sm"
										onClick={() =>
											setIsFileInput((prev) => ({
												...prev,
												hospitalInvoice: false,
											}))
										} // Switch to file input when clicked
									>
										Re-upload File
									</button>
									<a
										href="#"
										onClick={(e) => {
											e.preventDefault();
											openModal(files.hospitalInvoice); // Open the modal with file preview
										}}
										target="_blank"
										rel="noopener noreferrer"
										className="btn btn-outline-primary btn-sm"
									>
										View Previously Uploaded File
									</a>
								</div>
							) : (
								<input
									id="hospitalInvoice"
									type="file"
									accept=".pdf, .png, .jpg, .jpeg"
									className={`form-control ${
										errors.hospitalInvoice ||
										fileErrors.hospitalInvoice
											? "is-invalid"
											: ""
									}`}
									{...register("hospitalInvoice")}
									name="hospitalInvoice"
									onChange={(e) => {
										register("hospitalInvoice").onChange(e);
										handleFileChange("hospitalInvoice")(e);
									}}
								/>
							)}
							{/* {(errors.hospitalInvoice ||
								fileErrors.hospitalInvoice) && (
								<p className="invalid-feedback">
									{fileErrors.hospitalInvoice ||
										(errors.hospitalInvoice
											?.message as string)}
								</p>
							)} */}
						</td>
					</tr>
					<tr>
						<td>
							Laboratory Receipt/Invoice{" "}
							<span className="required-asterisk">*</span>
						</td>
						<td className="d-flex justify-content-center">
							{isFileInput["labInvoice"] &&
							files.labInvoice &&
							isRevisionMode &&
							!isNewUpload["labInvoice"] ? (
								<div className="d-flex gap-2">
									<button
										type="button"
										className="btn btn-outline-secondary btn-sm"
										onClick={() =>
											setIsFileInput((prev) => ({
												...prev,
												labInvoice: false,
											}))
										} // Switch to file input when clicked
									>
										Re-upload File
									</button>
									<a
										href="#"
										onClick={(e) => {
											e.preventDefault();
											openModal(files.labInvoice); // Open the modal with file preview
										}}
										target="_blank"
										rel="noopener noreferrer"
										className="btn btn-outline-primary btn-sm"
									>
										View Previously Uploaded File
									</a>
								</div>
							) : (
								<input
									id="labInvoice"
									type="file"
									accept=".pdf, .png, .jpg, .jpeg"
									className={`form-control ${
										errors.labInvoice ||
										fileErrors.labInvoice
											? "is-invalid"
											: ""
									}`}
									{...register("labInvoice")}
									name="labInvoice"
									onChange={(e) => {
										register("labInvoice").onChange(e);
										handleFileChange("labInvoice")(e);
									}}
								/>
							)}
							{/* {(errors.labInvoice || fileErrors.labInvoice) && (
								<p className="invalid-feedback">
									{fileErrors.labInvoice ||
										(errors.labInvoice?.message as string)}
								</p>
							)} */}
						</td>
					</tr>
					<tr>
						<td>
							Applicant's Signature{" "}
							<span className="required-asterisk">*</span>
						</td>
						<td className="d-flex justify-content-center">
							{isFileInput["applicantSignature"] &&
							files.applicantSignature &&
							isRevisionMode &&
							!isNewUpload["applicantSignature"] ? (
								<div className="d-flex gap-2">
									<button
										type="button"
										className="btn btn-outline-secondary btn-sm"
										onClick={() =>
											setIsFileInput((prev) => ({
												...prev,
												applicantSignature: false,
											}))
										} // Switch to file input when clicked
									>
										Re-upload File
									</button>
									<a
										href="#"
										onClick={(e) => {
											e.preventDefault();
											openModal(files.applicantSignature); // Open the modal with file preview
										}}
										target="_blank"
										rel="noopener noreferrer"
										className="btn btn-outline-primary btn-sm"
									>
										View Previously Uploaded File
									</a>
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
									{...register("applicantSignature")}
									name="applicantSignature"
									onChange={(e) => {
										register("applicantSignature").onChange(
											e
										);
										handleFileChange("applicantSignature")(
											e
										);
									}}
								/>
							)}
							{/* {(errors.applicantSignature ||
								fileErrors.applicantSignature) && (
								<p className="invalid-feedback">
									{fileErrors.applicantSignature ||
										(errors.applicantSignature
											?.message as string)}
								</p>
							)} */}
						</td>
					</tr>
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
		</div>
	);
};

export default FormMedicalFiles;
