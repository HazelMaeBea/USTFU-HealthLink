import React from "react";
import { UseFormRegister, FieldErrors } from "react-hook-form";
import { UnifiedFormData } from "../FormUtil/formTypes";

interface FormCertifyProps {
	register: UseFormRegister<UnifiedFormData>;
	errors: FieldErrors<UnifiedFormData>;
}

const FormCertify: React.FC<FormCertifyProps> = ({ register, errors }) => {
	return (
		<fieldset className="certify">
			<div className="form-check form-check-inline">
				<input
					{...register("certify")}
					id="certify"
					type="radio"
					value="Yes"
					className="form-check-input"
				/>
				<label htmlFor="certify" className="form-check-label">
					<p>
						<span className="required-asterisk">*</span> I hereby
						certify that all information in this application is TRUE
						and CORRECT and any misrepresentation of facts shall be
						sufficient cause for denial of this benefit. For any
						amount in excess of my maximum medical & hospitalization
						benefit, I am personally liable to pay directly to UST
						Hospital.{" "}
					</p>
				</label>
			</div>
			{errors.certify && (
				<p className="text-danger">
					{errors.certify.message as string}
				</p>
			)}
		</fieldset>
	);
};

export default FormCertify;
