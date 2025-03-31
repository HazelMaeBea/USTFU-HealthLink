import React, { useState, useEffect } from "react";
import {
	UseFormRegister,
	FieldErrors,
	UseFormSetValue,
	UseFormWatch,
} from "react-hook-form";
import { UnifiedFormData } from "./formTypes";
import "./FormInvoice.css";

interface FormInvoiceProps {
	register: UseFormRegister<UnifiedFormData>;
	errors: FieldErrors<UnifiedFormData>;
	setValue: UseFormSetValue<UnifiedFormData>;
	watch: UseFormWatch<UnifiedFormData>;
}

const FormInvoice: React.FC<FormInvoiceProps> = ({
	register,
	errors,
	setValue,
	watch,
}) => {
	const [inputValue, setInputValue] = useState<string>("");
	const [isFocused, setIsFocused] = useState<boolean>(false);

	const amountPaid = watch("amountPaid");

	// Format number with peso sign, commas and decimal places
	const formatWithCommas = (value: number): string => {
		return (
			"₱ " +
			value.toLocaleString("en-US", {
				minimumFractionDigits: 2,
				maximumFractionDigits: 2,
			})
		);
	};

	useEffect(() => {
		if (amountPaid) {
			if (isFocused) {
				// When focused, show just the numeric value for easy editing
				const plainValue = amountPaid.toString();
				setInputValue(
					plainValue.includes(".") && plainValue.endsWith(".0")
						? plainValue.replace(/\.0+$/, "")
						: plainValue
				);
			} else {
				// When not focused, format with peso sign and commas
				setInputValue(formatWithCommas(Number(amountPaid)));
			}
		} else if (!isFocused) {
			// If no value and not focused, show as empty with peso format
			setInputValue("");
		}
	}, [amountPaid, isFocused]);

	const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;

		// Remove peso sign, spaces and commas during input
		const cleanValue = value.replace(/[₱\s,]/g, "");

		if (cleanValue === "" || /^\d*\.?\d*$/.test(cleanValue)) {
			setInputValue(cleanValue);

			if (cleanValue && !isNaN(Number(cleanValue))) {
				const numValue = parseFloat(cleanValue);
				setValue("amountPaid", numValue);
			} else if (cleanValue === "") {
				setValue("amountPaid", null as unknown as number);
			}
		}
	};

	const handleFocus = () => {
		setIsFocused(true);
		if (amountPaid) {
			// When focusing, strip formatting for easier editing
			const plainValue = amountPaid.toString();
			setInputValue(
				plainValue.includes(".") && plainValue.endsWith(".0")
					? plainValue.replace(/\.0+$/, "")
					: plainValue
			);
		} else {
			setInputValue("");
		}
	};

	const handleBlur = () => {
		setIsFocused(false);
		if (inputValue && !isNaN(parseFloat(inputValue))) {
			const numValue = parseFloat(inputValue);
			// Format with peso sign, commas and 2 decimal places
			setInputValue(formatWithCommas(numValue));
			setValue("amountPaid", numValue);
		} else if (inputValue === "") {
			setInputValue("");
		}
	};

	const {
		name,
		ref,
		onChange: registerOnChange,
		onBlur: registerOnBlur,
		...rest
	} = register("amountPaid");

	return (
		<>
			<fieldset className="InvoiceInfo">
				<div className="row align-items-center">
					<div className="mb-1 col-md-3">
						<label htmlFor="ORNumber" className="form-label">
							OR Number{" "}
							<span className="required-asterisk">*</span>
						</label>
						<input
							{...register("ORNumber")}
							id="ORNumber"
							type="text"
							className="form-control"
							placeholder="eg. OR-2025-00001"
						/>
						{errors.ORNumber && (
							<p className="text-danger">
								{errors.ORNumber.message}
							</p>
						)}
					</div>

					<div className="mb-1 col-md-3">
						<label htmlFor="issuedBy" className="form-label">
							Issued by{" "}
							<span className="required-asterisk">*</span>
						</label>
						<input
							{...register("issuedBy")}
							id="issuedBy"
							type="text"
							className="form-control"
							placeholder="eg. Metro Optical"
						/>
						{errors.issuedBy && (
							<p className="text-danger">
								{errors.issuedBy.message}
							</p>
						)}
					</div>

					<div className="mb-1 col-md-3">
						<label htmlFor="amountPaid" className="form-label">
							Amount Paid (Max ₱2,500)
							<span className="required-asterisk">*</span>
						</label>

						<input
							id="amountPaid"
							name={name}
							ref={ref}
							type="text"
							className={`form-control ${
								errors.amountPaid ? "is-invalid" : ""
							}`}
							placeholder="₱ 2,500.00"
							value={inputValue}
							onChange={(e) => {
								handleAmountChange(e);
								registerOnChange(e);
							}}
							onFocus={handleFocus}
							onBlur={(e) => {
								handleBlur();
								if (registerOnBlur) registerOnBlur(e);
							}}
							{...rest}
						/>

						{errors.amountPaid && (
							<p className="text-danger">
								{errors.amountPaid.message as string}
							</p>
						)}
					</div>
				</div>
			</fieldset>
		</>
	);
};

export default FormInvoice;
