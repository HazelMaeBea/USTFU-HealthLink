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
	setDateHired?: Dispatch<SetStateAction<Date | null>>;
}

// Get current academic year
const getCurrentAcademicYear = () => {
	const today = new Date();
	const currentMonth = today.getMonth();
	const currentYear = today.getFullYear();

	let academicYearStart: number;

	if (currentMonth >= 7) {
		// August or later
		academicYearStart = currentYear;
	} else {
		// Before August
		academicYearStart = currentYear - 1;
	}
	return `${academicYearStart}-${academicYearStart + 1}`;
};

// Get current term
const getCurrentTerm = () => {
	const today = new Date();
	const currentMonth = today.getMonth(); // 0-11 (Jan-Dec)

	if (currentMonth >= 7 && currentMonth <= 11) {
		return "1st";
	} else if (currentMonth >= 0 && currentMonth <= 4) {
		return "2nd";
	} else {
		return "Su";
	}
};

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

const MAX_EYEGLASSES_AMOUNT = 5000;

const FormInvoice: React.FC<FormInvoiceProps> = ({
	register,
	errors,
	setValue,
	watch,
	setDateHired,
}) => {
	const [inputValue, setInputValue] = useState<string>("");
	const [isFocused, setIsFocused] = useState<boolean>(false);
	const [amountError, setAmountError] = useState<string>("");
	const currentAcademicYear = getCurrentAcademicYear();
	const currentTerm = getCurrentTerm();

	const amountPaid = watch("amountPaid");
	const { formData, isRevisionMode } = useRevisionStore();

	// Set initial term and academic year values
	useEffect(() => {
		setValue("year", currentAcademicYear);
		setValue("term", currentTerm);
	}, [setValue, currentAcademicYear, currentTerm]);

	// Handle amount display formatting
	useEffect(() => {
		if (!isFocused && amountPaid) {
			setInputValue(formatWithCommas(Number(amountPaid)));
		}
	}, [amountPaid, isFocused]);

	// Handle revision mode data
	useEffect(() => {
		if (isRevisionMode && formData) {
			Object.keys(formData).forEach((key) => {
				setValue(
					key as keyof UnifiedFormData,
					formData[key as keyof UnifiedFormData]
				);
			});
		}
	}, [formData, isRevisionMode, setValue]);

	const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		const cleanValue = value.replace(/[₱\s,]/g, "");

		if (cleanValue === "" || /^\d*\.?\d*$/.test(cleanValue)) {
			if (cleanValue === "") {
				setInputValue("");
				setValue("amountPaid", 0);
				setAmountError("");
				return;
			}

			const numValue = parseFloat(cleanValue);

			// Check if the number exceeds the maximum
			if (numValue > MAX_EYEGLASSES_AMOUNT) {
				setAmountError(
					`Amount cannot exceed ₱${MAX_EYEGLASSES_AMOUNT.toLocaleString()}`
				);
				return; // Don't update the value
			}

			// If we get here, the value is valid
			setAmountError("");
			setInputValue(cleanValue);
			setValue("amountPaid", numValue);
		}
	};

	const handleFocus = () => {
		setIsFocused(true);
		setInputValue(amountPaid ? amountPaid.toString() : "");
	};

	const handleBlur = () => {
		setIsFocused(false);
		if (inputValue === "") {
			setInputValue("");
			setValue("amountPaid", 0);
		} else if (!isNaN(parseFloat(inputValue))) {
			const numValue = parseFloat(inputValue);
			setInputValue(formatWithCommas(numValue));
			setValue("amountPaid", numValue);
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
							<div className="invalid-feedback d-block">
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
							<div className="invalid-feedback d-block">
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
							<div className="invalid-feedback d-block">
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
							<div className="invalid-feedback d-block">
								{errors.dateHired?.message as string}
							</div>
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
							className={`form-control ${
								errors.ORNumber ? "is-invalid" : ""
							}`}
							placeholder="eg. OR-2025-00001"
						/>
						{errors.ORNumber && (
							<div className="invalid-feedback d-block">
								{errors.ORNumber.message}
							</div>
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
							className={`form-control ${
								errors.issuedBy ? "is-invalid" : ""
							}`}
							placeholder="eg. Metro Optical"
						/>
						{errors.issuedBy && (
							<div className="invalid-feedback d-block">
								{errors.issuedBy.message}
							</div>
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
								errors.amountPaid || amountError
									? "is-invalid"
									: ""
							}`}
							placeholder={`₱ ${MAX_EYEGLASSES_AMOUNT.toLocaleString()}.00`}
							value={
								isFocused
									? inputValue
									: amountPaid
									? formatWithCommas(amountPaid)
									: ""
							}
							onChange={(e) => {
								handleAmountChange(e);
								registerOnChange(e);
							}}
							onFocus={handleFocus}
							onBlur={(e) => {
								handleBlur();
								if (registerOnBlur) registerOnBlur(e);
							}}
							maxLength={10}
							{...rest}
						/>

						{amountError ? (
							<div className="invalid-feedback d-block">
								{amountError}
							</div>
						) : errors.amountPaid ? (
							<div className="invalid-feedback d-block">
								{errors.amountPaid.message as string}
							</div>
						) : null}
					</div>
				</div>
			</fieldset>
		</>
	);
};

export default FormInvoice;
