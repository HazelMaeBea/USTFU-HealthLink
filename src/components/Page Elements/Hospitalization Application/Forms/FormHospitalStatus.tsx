import React from "react";
import { UseFormRegister, FieldErrors } from "react-hook-form";
import { FormData } from "./FormBody";

interface FormHospitalStatusProps {
	register: UseFormRegister<FormData>;
	errors: FieldErrors<FormData>;
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
				</label>
				{hospitalStatusOptions.map((option, index) => (
					<div key={index} className="form-check form-check-inline">
						<input
							{...register("hospitalStatus")}
							id={`hospitalStatus-${index}`}
							type="radio"
							value={option}
							className="form-check-input"
						/>
						<label
							htmlFor={`hospitalStatus-${index}`}
							className="form-check-label"
						>
							{option}
						</label>
					</div>
				))}
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
