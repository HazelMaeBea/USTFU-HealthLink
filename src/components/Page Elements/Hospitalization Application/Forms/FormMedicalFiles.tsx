import React from "react";
import { UseFormRegister, FieldErrors } from "react-hook-form";
import { FormData } from "./FormBody";

interface FormMedicalFilesProps {
	register: UseFormRegister<FormData>;
	errors: FieldErrors<FormData>;
}

const FormMedicalFiles: React.FC<FormMedicalFilesProps> = ({
	register,
	errors,
}) => {
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
						<td>Doctor's Note or Request</td>
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
									errors.docRequest ? "is-invalid" : ""
								}`}
								{...register("docRequest")}
								name="docRequest"
							/>
							{errors.docRequest && (
								<p className="invalid-feedback">
									{errors.docRequest?.message as string}
								</p>
							)}
						</td>
					</tr>
					<tr>
						<td>Hospital Receipt/Invoice</td>
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
									errors.hospitalInvoice ? "is-invalid" : ""
								}`}
								{...register("hospitalInvoice")}
								name="hospitalInvoice"
							/>
							{errors.hospitalInvoice && (
								<p className="invalid-feedback">
									{errors.hospitalInvoice?.message as string}
								</p>
							)}
						</td>
					</tr>
					<tr>
						<td>Laboratory Receipt/Invoice</td>
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
									errors.labInvoice ? "is-invalid" : ""
								}`}
								{...register("labInvoice")}
								name="labInvoice"
							/>
							{errors.labInvoice && (
								<p className="invalid-feedback">
									{errors.labInvoice?.message as string}
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
									errors.employeeID ? "is-invalid" : ""
								}`}
								{...register("employeeID")}
								name="employeeID"
							/>
							{errors.employeeID && (
								<p className="invalid-feedback">
									{errors.employeeID?.message as string}
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
								{...register("applicantSignature")}
								name="applicantSignature"
							/>
							{errors.applicantSignature && (
								<p className="invalid-feedback">
									{
										errors.applicantSignature
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
						<label htmlFor="claimRequestCount"> </label>
						How many claims do you want to request?
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
