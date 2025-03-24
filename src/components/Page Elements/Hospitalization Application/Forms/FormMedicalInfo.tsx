import React from "react";
import { UseFormRegister, FieldErrors } from "react-hook-form";
import { FormData } from "./FormBody";

interface FormMedicalInfoProps {
	register: UseFormRegister<FormData>;
	errors: FieldErrors<FormData>;
}

const procedureOptions = [
	"Physical Therapy",
	"Consultation",
	"Surgery",
	"Checkup",
	"X-ray",
	"MRI",
	"Blood Test",
	"Vaccination",
	"Other",
];

const FormMedicalInfo: React.FC<FormMedicalInfoProps> = ({
	register,
	errors,
}) => {
	return (
		<fieldset className="MedicalInfo">
			<div className="row">
				<div className="mb-1 col-md-3">
					<label htmlFor="hospital" className="form-label">
						Hospital Name{" "}
						<span className="required-asterisk">*</span>
					</label>
					<input
						{...register("hospital")}
						id="hospital"
						type="text"
						className="form-control"
						placeholder="e.g. UST Hospital..."
					/>
					{errors.hospital && (
						<p className="text-danger">{errors.hospital.message}</p>
					)}
				</div>
				<div className="mb-1 col-md-6">
					<label htmlFor="illness" className="form-label">
						Nature of Illness{" "}
						<span className="required-asterisk">*</span>
					</label>
					<input
						{...register("illness")}
						id="illness"
						type="text"
						className="form-control"
						placeholder="e.g. Chronic Back Pain..."
					/>
					{errors.illness && (
						<p className="text-danger">{errors.illness.message}</p>
					)}
				</div>
				<div className="mb-1 col-md-3">
					<label htmlFor="physician" className="form-label">
						Physician <span className="required-asterisk">*</span>
					</label>
					<input
						{...register("physician")}
						id="physician"
						type="text"
						className="form-control"
						placeholder="e.g. Dr. John Smith..."
					/>
					{errors.physician && (
						<p className="text-danger">
							{errors.physician.message}
						</p>
					)}
				</div>
			</div>
			<div className="row">
				<div className="mb-1 col-md-6">
					<label htmlFor="procedures" className="form-label">
						Procedures <span className="required-asterisk">*</span>
					</label>
					<select
						{...register("procedures")}
						id="procedures"
						className="form-select"
						defaultValue=""
					>
						<option value="" disabled>
							Select procedure
						</option>
						{procedureOptions.map((option, index) => (
							<option key={index} value={option}>
								{option}
							</option>
						))}
					</select>
					{errors.procedures && (
						<p className="text-danger">
							{errors.procedures.message}
						</p>
					)}
				</div>
				<div className="col-md-6">
					<label htmlFor="procedureSpecify" className="form-label">
						Specify Procedure:{" "}
						<span className="required-asterisk">*</span>
					</label>
					<input
						{...register("procedureSpecify", {
							required: "Specify Procedure is required",
						})}
						id="procedureSpecify"
						type="text"
						className="form-control"
						placeholder="Please specify"
					/>
					{errors.procedureSpecify && (
						<p className="text-danger">
							{errors.procedureSpecify.message}
						</p>
					)}
				</div>
			</div>
		</fieldset>
	);
};

export default FormMedicalInfo;
