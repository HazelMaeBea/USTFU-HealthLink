import React, { useEffect, useState } from "react";
import { UseFormRegister, FieldErrors } from "react-hook-form";
import { UnifiedFormData } from "../FormUtil/formTypes";

interface FormHospitalStatusProps {
	register: UseFormRegister<UnifiedFormData>;
	errors: FieldErrors<UnifiedFormData>;
	watch?: (name: string) => any;
}

const hospitalStatusOptions = ["In-Patient", "Out-Patient", "ER Consultation"];
const hospitalStatusLabels: Record<string, string> = {
	"In-Patient": "For Confinement",
	"Out-Patient": "Done as Out-Patient",
	"ER Consultation": "ER Consultation",
};

const FormHospitalStatus: React.FC<FormHospitalStatusProps> = ({
	register,
	errors,
	watch,
}) => {
	const [resetKey, setResetKey] = useState(0);

	useEffect(() => {
		const hospitalStatusRadios = document.querySelectorAll(
			'input[name="hospitalStatus"]'
		);
		hospitalStatusRadios.forEach((radio: Element) => {
			(radio as HTMLInputElement).checked = false;
		});

		register("hospitalStatus");
	}, [resetKey, register]);

	useEffect(() => {
		if (watch) {
			const subscription = watch((value, { name, type }) => {
				if (type === "change" && name === "hospitalStatus" && !value) {
					setResetKey((prev) => prev + 1);
				}
			});
			return () => subscription.unsubscribe();
		}
	}, [watch]);

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
									{hospitalStatusLabels[option]}
								</label>
							</div>
						</div>
					))}
				</div>
				{errors.hospitalStatus && (
					<p className="text-danger">
						{errors.hospitalStatus.message as string}
					</p>
				)}
			</fieldset>
			<hr className="section-separator" />
		</>
	);
};

export default FormHospitalStatus;
