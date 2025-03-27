import React from "react";
import { UseFormRegister, FieldErrors } from "react-hook-form";
import { HospitalFormData } from "../../PendingRequests/types";

// import { FormData } from "./FormBody";
// interface FormHospitalStatusProps {
// 	register: UseFormRegister<FormData>;
// 	errors: FieldErrors<FormData>;
// }

interface FormHospitalStatusProps {
	register: UseFormRegister<HospitalFormData>;
	errors: FieldErrors<HospitalFormData>;
}

const hospitalStatusOptions = ["In-Patient", "Out-Patient", "ER Consultation"];

const FormHospitalStatus: React.FC<FormHospitalStatusProps> = ({
	register,
	errors,
}) => {
	return (
		<>
			<hr className="section-separator" />
			<fieldset className="hospitalStatusFieldset">
				<label className="form-label hospital-status-label">
					Hospital Status:{" "}
					<span className="required-asterisk">*</span>
				</label>
				<div className="hospital-status-options-container row">
					{hospitalStatusOptions.map((option, index) => (
						<div key={index} className="col-12 col-md-auto mb-2">
							<div className="hospital-status-option">
								<input
									{...register("hospitalStatus")}
									id={`hospitalStatus-${index}`}
									type="radio"
									value={option}
									className="form-check-input me-2"
								/>
								<label
									htmlFor={`hospitalStatus-${index}`}
									className="form-check-label"
								>
									{option}
								</label>
							</div>
						</div>
					))}
				</div>
				{errors.hospitalStatus && (
					<p className="text-danger">
						{errors.hospitalStatus.message}
					</p>
				)}
			</fieldset>
			<hr className="section-separator" />
		</>
	);
};

export default FormHospitalStatus;
