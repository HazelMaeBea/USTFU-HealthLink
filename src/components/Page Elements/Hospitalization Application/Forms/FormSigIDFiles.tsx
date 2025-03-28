import React from "react";
import { UseFormRegister, FieldErrors } from "react-hook-form";
import { UnifiedFormData } from "./formTypes";

interface FormSigIDFiles {
	register: UseFormRegister<UnifiedFormData>;
	errors: FieldErrors<UnifiedFormData>;
}

const FormSigIDFiles: React.FC<FormSigIDFiles> = ({ register, errors }) => {
	return (
		<fieldset className="medicalFiles">
			<div className="row">
				<div className="mb-1 col-md-4 employeeID">Employee/UST ID</div>
				<div className="mb-1 col-md-4 fileType">PNG, JPG, PDF </div>
				<div className="mb-1 col-md-4">
					<label htmlFor="employeeID" className="form-label"></label>
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
				</div>
			</div>

			<div className="row">
				<div className="mb-1 col-md-4 applicantSignature">
					Applicant's Signature
				</div>
				<div className="mb-1 col-md-4 fileType">PNG, JPG, PDF </div>
				<div className="mb-1 col-md-4">
					<label
						htmlFor="applicantSignature"
						className="form-label"
					></label>
					<input
						id="applicantSignature"
						type="file"
						accept=".pdf, .png, .jpg, .jpeg"
						className={`form-control ${
							errors.applicantSignature ? "is-invalid" : ""
						}`}
						{...register("applicantSignature")}
						name="applicantSignature"
					/>
					{errors.applicantSignature && (
						<p className="invalid-feedback">
							{errors.applicantSignature?.message as string}
						</p>
					)}
				</div>
			</div>
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
							{errors.claimRequestCount && (
								<p className="text-danger">
									{errors.claimRequestCount.message}
								</p>
							)}
							<span
								className="claim-text"
								style={{ fontWeight: "normal" }}
							>
								{" "}
								claims
							</span>
						</div>
					</div>
				</div>
			</div>
		</fieldset>
	);
};

export default FormSigIDFiles;
