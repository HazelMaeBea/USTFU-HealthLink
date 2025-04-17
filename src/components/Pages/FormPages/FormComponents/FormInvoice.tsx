import React, { useState, useEffect, Dispatch, SetStateAction } from "react";
import {
	UseFormRegister,
	FieldErrors,
	UseFormSetValue,
	UseFormWatch,
} from "react-hook-form";
import { UnifiedFormData } from "../FormUtil/formTypes";
import "./FormInvoice.css";
import { useRevisionStore } from "../../../Page Elements/RevisionFuncs/revisionStore.ts";

interface FormInvoiceProps {
	register: UseFormRegister<UnifiedFormData>;
	errors: FieldErrors<UnifiedFormData>;
	setValue: UseFormSetValue<UnifiedFormData>;
	watch: UseFormWatch<UnifiedFormData>;
	dateHired?: Date | null;
	setDateHired?: Dispatch<SetStateAction<Date | null>>;
}

// Get current academic year
const getCurrentAcademicYear = () => {
	const today = new Date();
	const currentMonth = today.getMonth();
	const currentYear = today.getFullYear();

	let academicYearStart: number;

	if (currentMonth >= 7) {
		//August or later
		academicYearStart = currentYear;
	} else {
		//Before August
		academicYearStart = currentYear - 1;
	}
	return `${academicYearStart}-${academicYearStart + 1}`;
};

// Get current term
const getCurrentTerm = () => {
	const today = new Date();
	const currentMonth = today.getMonth(); // 0-11 (Jan-Dec)

	// First term: Aug(7) to Dec(11)
	// Second term: Jan(0) to May(4)
	// Special term: Jun(5) to Jul(6)
	if (currentMonth >= 7 && currentMonth <= 11) {
		return "1st";
	} else if (currentMonth >= 0 && currentMonth <= 4) {
		return "2nd";
	} else {
		return "Su";
	}
};

// Import the MAX_EYEGLASSES_AMOUNT constant
const MAX_EYEGLASSES_AMOUNT = 5000;

const FormInvoice: React.FC<FormInvoiceProps> = ({
	register,
	errors,
	setValue,
	watch,
	// dateHired,
	setDateHired,
}) => {
	const [inputValue, setInputValue] = useState<string>("");
	const [isFocused, setIsFocused] = useState<boolean>(false);
	const currentAcademicYear = getCurrentAcademicYear();
	const currentTerm = getCurrentTerm();

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

	// Set initial term and academic year values
	useEffect(() => {
		// Set the academic year field
		setValue("year", currentAcademicYear);
		// Set the term field
		setValue("term", currentTerm);
	}, [setValue, currentAcademicYear, currentTerm]);

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

	const { formData, isRevisionMode } = useRevisionStore();

	useEffect(() => {
		if (isRevisionMode) {
			// If in revision mode, prefill form using formData from store
			if (formData) {
				Object.keys(formData).forEach((key) => {
					// Cast key to a valid key of UnifiedFormData
					setValue(
						key as keyof UnifiedFormData,
						formData[key as keyof UnifiedFormData]
					);
				});
			}
		} else {
			<p>"No Form Data"</p>;
		}
	}, [formData, isRevisionMode, setValue]);

	return (
		<>
			<fieldset className="InvoiceInfo">
				{/* Academic Year, Term, Load and Date Hired Section */}
				<div className="row mb-3">
					<div className="col-md-2">
						<label htmlFor="year" className="form-label">
							Academic Year{" "}
							<span className="required-asterisk">*</span>
						</label>
						<input
							id="year"
							type="text"
							className="form-control"
							{...register("year")}
							value={currentAcademicYear}
							readOnly
						/>
						{errors.year && (
							<div className="invalid-feedback">
								{errors.year?.message as React.ReactNode}
							</div>
						)}
					</div>
					<div className="col-md-2">
						<label htmlFor="term" className="form-label">
							Term <span className="required-asterisk">*</span>
						</label>
						<input
							id="term"
							type="text"
							className="form-control"
							{...register("term")}
							value={currentTerm}
							readOnly
						/>
						{errors.term && (
							<div className="invalid-feedback">
								{errors.term?.message as React.ReactNode}
							</div>
						)}
					</div>
					<div className="col-md-2">
						<label htmlFor="load" className="form-label">
							Load (Units){" "}
							<span className="required-asterisk">*</span>
						</label>
						<input
							id="load"
							type="number"
							className={`form-control ${
								errors.load ? "is-invalid" : ""
							}`}
							{...register("load", { valueAsNumber: true })}
							name="load"
							min="0"
							max="30"
							placeholder="Enter units"
						/>
						{errors.load && (
							<div className="invalid-feedback">
								{errors.load?.message as React.ReactNode}
							</div>
						)}
					</div>

					<div className="col-md-6">
						<label htmlFor="dateHired" className="form-label">
							Date Hired{" "}
							<span className="required-asterisk">*</span>
						</label>
						<input
							type="date"
							{...register("dateHired")}
							id="dateHired"
							className={`form-control ${
								errors.dateHired ? "is-invalid" : ""
							}`}
							onChange={(e) => {
								const date = e.target.value
									? new Date(e.target.value)
									: null;
								if (setDateHired) {
									setDateHired(date);
								}
								register("dateHired").onChange(e);
							}}
							style={{ color: "black" }}
						/>
						{errors.dateHired && (
							<p className="text-danger">
								{errors.dateHired?.message as string}
							</p>
						)}
					</div>
				</div>

				<div className="row mb-3">
					<div className="col-md-4">
						<label htmlFor="ORNumber" className="form-label">
							Official Receipt Number{" "}
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
					<div className="col-md-4">
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

					<div className="col-md-4">
						<label htmlFor="amountPaid" className="form-label">
							Amount Paid (Max ₱
							{MAX_EYEGLASSES_AMOUNT.toLocaleString()})
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
							placeholder={`₱ ${MAX_EYEGLASSES_AMOUNT.toLocaleString()}.00`}
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
