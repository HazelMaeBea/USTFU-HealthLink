import React, { useState, useEffect } from "react";
import { UseFormRegister, FieldErrors, UseFormSetValue } from "react-hook-form";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface AdmissionTeachingInfoProps {
	register: UseFormRegister<any>;
	errors: FieldErrors<any>;
	dateHired?: Date | null;
	setDateHired?: React.Dispatch<React.SetStateAction<Date | null>>;
	dateRetired?: Date | null;
	setDateRetired?: React.Dispatch<React.SetStateAction<Date | null>>;
	setValue?: UseFormSetValue<any>;
}

const statusOptions = [
	"Full-Time",
	"Part-Time",
	"Probationary",
	"Tenured-Track",
	"Retiree",
];

const AdmissionTeachingInfo = ({
	register,
	errors,
	dateHired,
	setDateHired,
	dateRetired,
	setDateRetired,
	setValue,
}: AdmissionTeachingInfoProps) => {
	const [status, setStatus] = useState("");

	const handleStatusChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setStatus(event.target.value);
	};

	return (
		<fieldset className="form-group p-3">
			<legend className="w-auto">Teaching Information</legend>
			<div className="row mb-3">
				<div className="col-md-6">
					<label htmlFor="college" className="form-label">
						College*
					</label>
					<select
						{...register("college")}
						id="college"
						className={`form-select ${
							errors.college ? "is-invalid" : ""
						}`}
					>
						<option value="">Select College</option>
						<option value="College of Accountancy">
							College of Accountancy
						</option>
						<option value="College of Architecture">
							College of Architecture
						</option>
						<option value="College of Commerce and Business Administration">
							College of Commerce and Business Administration
						</option>
						<option value="College of Education">
							College of Education
						</option>
						<option value="College of Fine Arts and Design">
							College of Fine Arts and Design
						</option>
						<option value="College of Information and Computing Sciences">
							College of Information and Computing Sciences
						</option>
						<option value="College of Nursing">
							College of Nursing
						</option>
						<option value="College of Rehabilitation Sciences">
							College of Rehabilitation Sciences
						</option>
						<option value="College of Science">
							College of Science
						</option>
						<option value="College of Tourism and Hospitality Management">
							College of Tourism and Hospitality Management
						</option>
						<option value="Conservatory of Music">
							Conservatory of Music
						</option>
						<option value="Faculty of Arts and Letters">
							Faculty of Arts and Letters
						</option>
						<option value="Faculty of Canon Law">
							Faculty of Canon Law
						</option>
						<option value="Faculty of Civil Law">
							Faculty of Civil Law
						</option>
						<option value="Faculty of Engineering">
							Faculty of Engineering
						</option>
						<option value="Faculty of Medicine and Surgery">
							Faculty of Medicine and Surgery
						</option>
						<option value="Faculty of Pharmacy">
							Faculty of Pharmacy
						</option>
						<option value="Faculty of Philosophy">
							Faculty of Philosophy
						</option>
						<option value="Faculty of Sacred Theology">
							Faculty of Sacred Theology
						</option>
						<option value="Graduate School">Graduate School</option>
					</select>
					{errors.college && (
						<div className="invalid-feedback">
							{errors.college.message as string}
						</div>
					)}
				</div>

				<div className="col-md-6">
					<label htmlFor="load" className="form-label">
						Teaching Load (Units)*
					</label>
					<input
						{...register("load")}
						id="load"
						type="number"
						min="1"
						className={`form-control ${
							errors.load ? "is-invalid" : ""
						}`}
					/>
					{errors.load && (
						<div className="invalid-feedback">
							{errors.load.message as string}
						</div>
					)}
				</div>
			</div>

			{/* Status section using FormTeachingInfo approach */}
			<div className="row mb-3">
				<div className="col-md-6">
					<label className="form-label">Employment Status*</label>
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
						<div className="invalid-feedback d-block">
							{errors.status.message as string}
						</div>
					)}
				</div>

				{/* Conditional date fields */}
				{setValue && setDateHired && setDateRetired && (
					<div className="col-md-6">
						{/* Date Hired for Tenured-Track */}
						<div
							className={
								status === "Tenured-Track" ? "" : "d-none"
							}
						>
							<label htmlFor="dateHired" className="form-label">
								Date Hired*
							</label>
							<DatePicker
								id="dateHired"
								selected={dateHired}
								onChange={(date) => {
									setDateHired(date);
									setValue("dateHired", date?.toISOString());
								}}
								dateFormat="MM/dd/yyyy"
								className={`form-control ${
									errors.dateHired ? "is-invalid" : ""
								}`}
								placeholderText="MM/DD/YYYY"
							/>
							{errors.dateHired && (
								<div className="invalid-feedback d-block">
									{errors.dateHired.message as string}
								</div>
							)}
						</div>

						{/* Date Retired for Retiree - FIX HERE */}
						<div className={status === "Retiree" ? "" : "d-none"}>
							<label htmlFor="dateRetired" className="form-label">
								Date Retired*
							</label>
							<DatePicker
								id="dateRetired"
								selected={dateRetired}
								onChange={(date) => {
									setDateRetired(date);
									setValue(
										"dateRetired",
										date?.toISOString()
									);
								}}
								dateFormat="MM/dd/yyyy"
								className={`form-control ${
									errors.dateRetired ? "is-invalid" : ""
								}`}
								placeholderText="MM/DD/YYYY"
							/>
							{errors.dateRetired && (
								<div className="invalid-feedback d-block">
									{errors.dateRetired.message as string}
								</div>
							)}
						</div>
					</div>
				)}
			</div>
		</fieldset>
	);
};

export default AdmissionTeachingInfo;
