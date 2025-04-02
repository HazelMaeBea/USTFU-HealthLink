import React, { useState } from "react";
import { UseFormRegister, FieldErrors, UseFormSetError } from "react-hook-form";
import { validateFileListSize } from "../../../../utils/fileUpload";
import { UnifiedFormData } from "../FormUtil/formTypes";

interface FormMedicalFilesProps {
	register: UseFormRegister<UnifiedFormData>;
	errors: FieldErrors<UnifiedFormData>;
	setError?: UseFormSetError<UnifiedFormData>;
}

const FormMedicalFiles: React.FC<FormMedicalFilesProps> = ({
	register,
	errors,
	setError,
}) => {
	const [fileErrors, setFileErrors] = useState<Record<string, string>>({});

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
				// Clear error if file is valid
				setFileErrors((prev) => ({
					...prev,
					[fieldName]: "",
				}));
			}
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
						<td>
							Doctor's Note or Request{" "}
							<span className="required-asterisk">*</span>
						</td>
						<td className="d-flex justify-content-center">
							<label
								htmlFor="docRequest"
								className="form-label"
							></label>
							<input
								id="docRequest"
								type="file"
								accept=".pdf, .png, .jpg, .jpeg"
								className={`form-control ${
									errors.docRequest || fileErrors.docRequest
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
							{(errors.docRequest || fileErrors.docRequest) && (
								<p className="invalid-feedback">
									{fileErrors.docRequest ||
										(errors.docRequest?.message as string)}
								</p>
							)}
						</td>
					</tr>
					<tr>
						<td>
							Hospital Receipt/Invoice{" "}
							<span className="required-asterisk">*</span>
						</td>
						<td className="d-flex justify-content-center">
							<label
								htmlFor="hospitalInvoice"
								className="form-label"
							></label>
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
							{(errors.hospitalInvoice ||
								fileErrors.hospitalInvoice) && (
								<p className="invalid-feedback">
									{fileErrors.hospitalInvoice ||
										(errors.hospitalInvoice
											?.message as string)}
								</p>
							)}
						</td>
					</tr>
					<tr>
						<td>
							Laboratory Receipt/Invoice{" "}
							<span className="required-asterisk">*</span>
						</td>
						<td className="d-flex justify-content-center">
							<label
								htmlFor="labInvoice"
								className="form-label"
							></label>
							<input
								id="labInvoice"
								type="file"
								accept=".pdf, .png, .jpg, .jpeg"
								className={`form-control ${
									errors.labInvoice || fileErrors.labInvoice
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
							{(errors.labInvoice || fileErrors.labInvoice) && (
								<p className="invalid-feedback">
									{fileErrors.labInvoice ||
										(errors.labInvoice?.message as string)}
								</p>
							)}
						</td>
					</tr>
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
									errors.employeeID || fileErrors.employeeID
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
							{(errors.employeeID || fileErrors.employeeID) && (
								<p className="invalid-feedback">
									{fileErrors.employeeID ||
										(errors.employeeID?.message as string)}
								</p>
							)}
						</td>
					</tr>
					<tr>
						<td>
							Applicant's Signature{" "}
							<span className="required-asterisk">*</span>
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
								{...register("applicantSignature")}
								name="applicantSignature"
								onChange={(e) => {
									register("applicantSignature").onChange(e);
									handleFileChange("applicantSignature")(e);
								}}
							/>
							{(errors.applicantSignature ||
								fileErrors.applicantSignature) && (
								<p className="invalid-feedback">
									{fileErrors.applicantSignature ||
										(errors.applicantSignature
											?.message as string)}
								</p>
							)}
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
		</div>
	);
};

export default FormMedicalFiles;
