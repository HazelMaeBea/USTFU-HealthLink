import React, { useState, Dispatch, SetStateAction } from "react";
import { UseFormRegister, FieldErrors, UseFormSetValue } from "react-hook-form";
import { FormData } from "./AdmissionForm"; // Update import to use AdmissionForm's FormData type

interface AdmissionTeachingInfoProps {
	register: UseFormRegister<FormData>; // Use FormData type
	errors: FieldErrors<FormData>; // Use FormData type
	dateHired: Date | null;
	setDateHired: Dispatch<SetStateAction<Date | null>>;
	dateRetired: Date | null;
	setDateRetired: Dispatch<SetStateAction<Date | null>>;
	setValue?: UseFormSetValue<FormData>; // Make setValue optional
}

// Status options matching the FormTeachingInfo component
const statusOptions = [
	"Tenured",
	"Tenured-Track",
	"Lecturer Before 2001",
	"Extendee",
	"Retiree",
];

const AdmissionTeachingInfo: React.FC<AdmissionTeachingInfoProps> = ({
	register,
	errors,
	dateHired,
	setDateHired,
	dateRetired,
	setDateRetired,
	setValue, // Accept setValue but make it optional
}) => {
	const [status, setStatus] = useState("");

	const handleStatusChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setStatus(event.target.value);
	};

	return (
		<fieldset className="personal-info-container">
			<div className="row mb-3">
				<div className="col-md-12">
					<label htmlFor="address" className="form-label">
						Home Address <span className="required-asterisk">*</span>
					</label>
					<input
						id="address"
						type="text"
						className={`form-control ${
							errors.address ? "is-invalid" : ""
						}`}
						{...register("address")}
						placeholder="Enter your complete home address"
					/>
					{errors.address && (
						<div className="invalid-feedback">
							{errors.address?.message as React.ReactNode}
						</div>
					)}
				</div>
			</div>
			<div className="row mb-3">
				<div className="col-md-3">
					<label htmlFor="idNumber" className="form-label">
						Employee ID Number <span className="required-asterisk">*</span>
					</label>
					<input
						id="idNumber"
						type="text"
						className={`form-control ${
							errors.idNumber ? "is-invalid" : ""
						}`}
						{...register("idNumber")}
						placeholder="Enter ID number"
					/>
					{errors.idNumber && (
						<div className="invalid-feedback">
							{errors.idNumber?.message as React.ReactNode}
						</div>
					)}
				</div>

				<div className="col-md-2">
					<label htmlFor="load" className="form-label">
						Load (Units){" "} <span className="required-asterisk">*</span>
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

				<div className="col-md-3">
					<label className="form-label">
						Employment Status <span className="required">*</span>
					</label>
					{statusOptions.map((option, index) => (
						<div key={index} className="form-check">
							<input
								{...register("status")}
								id={`status-${index}`}
								type="radio"
								value={option}
								className="form-check-input"
								onChange={handleStatusChange}
							/>
							<label
								htmlFor={`status-${index}`}
								className="form-check-label"
							>
								{option}
							</label>
						</div>
					))}
					{errors.status && (
						<p className="text-danger">
							{errors.status?.message as string}
						</p>
					)}
				</div>

				{/* Adjust the column width to accommodate the ID field */}
				<div className="col-md-3">
					{/* Date fields in the same row */}
					<div
						className="date-hired-container"
						style={{
							display:
								status === "Tenured-Track" ? "block" : "none",
							marginBottom: "15px",
						}}
					>
						<label htmlFor="dateHired" className="form-label">
							If Tenure-Track, please input DATE HIRED:
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
								setDateHired(date);
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

					<div
						className="date-retired-container"
						style={{
							display: status === "Retiree" ? "block" : "none",
							marginBottom: "15px",
						}}
					>
						<label htmlFor="dateRetired" className="form-label">
							If Retiree, please input DATE RETIRED:
						</label>
						<input
							type="date"
							value={
								dateRetired
									? dateRetired.toISOString().split("T")[0]
									: ""
							}
							{...register("dateRetired")}
							id="dateRetired"
							className={`form-control ${
								errors.dateRetired ? "is-invalid" : ""
							}`}
							onChange={(e) => {
								const date = e.target.value
									? new Date(e.target.value)
									: null;
								setDateRetired(date);
								register("dateRetired").onChange(e);
							}}
							style={{ color: "black" }}
						/>
						{errors.dateRetired && (
							<p className="text-danger">
								{errors.dateRetired?.message as string}
							</p>
						)}
					</div>
				</div>
			</div>
		</fieldset>
	);
};

export default AdmissionTeachingInfo;
