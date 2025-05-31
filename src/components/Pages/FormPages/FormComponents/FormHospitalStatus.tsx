import React, { useEffect, useState } from "react";
import { UseFormRegister, FieldErrors, UseFormSetValue } from "react-hook-form";
import { UnifiedFormData } from "../FormUtil/formTypes";

interface FormHospitalStatusProps {
	register: UseFormRegister<UnifiedFormData>;
	errors: FieldErrors<UnifiedFormData>;
	watch?: (name: string) => any;
	setValue?: UseFormSetValue<UnifiedFormData>;
	formType?: string;
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
	setValue,
	formType,
}) => {
	const [resetKey, setResetKey] = useState(0);

	useEffect(() => {
		// Get current pathname to determine form type if not provided
		const pathname = window.location.pathname;
		const isOutpatient =
			formType === "outpatient" || pathname.includes("outpatient");

		// Register the field
		register("hospitalStatus");

		// For outpatient forms, pre-select "Out-Patient"
		if (isOutpatient && setValue) {
			setValue("hospitalStatus", "Out-Patient", { shouldValidate: true });
			console.log("Auto-setting hospitalStatus to Out-Patient");
		}

		const hospitalStatusRadios = document.querySelectorAll(
			'input[name="hospitalStatus"]'
		);

		// For outpatient forms, ensure the UI reflects the selection
		if (isOutpatient) {
			hospitalStatusRadios.forEach((radio: Element) => {
				const inputElement = radio as HTMLInputElement;
				if (inputElement.value === "Out-Patient") {
					inputElement.checked = true;
				}
			});
		} else {
			// For other forms, clear the selection as default
			hospitalStatusRadios.forEach((radio: Element) => {
				(radio as HTMLInputElement).checked = false;
			});
		}
	}, [resetKey, register, setValue, formType]);

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
