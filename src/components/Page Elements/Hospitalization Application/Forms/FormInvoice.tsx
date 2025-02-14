import React from "react";
import { UseFormRegister, FieldErrors } from "react-hook-form";
import { FormData } from "./EyeglassesForm";

interface FormInvoiceProps {
	register: UseFormRegister<FormData>;
	errors: FieldErrors<FormData>;
}

const FormInvoice: React.FC<FormInvoiceProps> = ({ register, errors }) => {
	return (
		<>
			<fieldset className="InvoiceInfo">
				<div className="row">
					<div className="mb-1 col-md-3">
						<label htmlFor="ORNumber" className="form-label">
							OR Number
						</label>
						<input
							{...register("ORNumber")}
							id="ORNumber"
							type="text"
							className="form-control"
						/>
						{errors.ORNumber && (
							<p className="text-danger">
								{errors.ORNumber.message}
							</p>
						)}
					</div>

					<div className="mb-1 col-md-3">
						<label htmlFor="issuedBy" className="form-label">
							Issued by
						</label>
						<input
							{...register("issuedBy")}
							id="issuedBy"
							type="text"
							className="form-control"
						/>
						{errors.issuedBy && (
							<p className="text-danger">
								{errors.issuedBy.message}
							</p>
						)}
					</div>

					<div className="mb-1 col-md-3">
						<label htmlFor="amountPaid" className="form-label">
							Amount Paid
						</label>
						<input
							{...register("amountPaid", { valueAsNumber: true })}
							id="amountPaid"
							type="number"
							className="form-control"
						/>
						{errors.amountPaid && (
							<p className="text-danger">
								{errors.amountPaid.message}
							</p>
						)}
					</div>
				</div>
			</fieldset>
			<hr className="section-separator" />
		</>
	);
};

export default FormInvoice;
