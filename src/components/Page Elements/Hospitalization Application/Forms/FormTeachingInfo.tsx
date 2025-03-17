import React, { useEffect, useState } from "react";
import { UseFormRegister, FieldErrors, UseFormSetValue } from "react-hook-form";
import { FormData } from "./FormBody";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface FormTeachingInfoProps {
	register: UseFormRegister<FormData>;
	errors: FieldErrors<FormData>;
	dateHired: Date | null;
	setDateHired: React.Dispatch<React.SetStateAction<Date | null>>;
	dateRetired: Date | null;
	setDateRetired: React.Dispatch<React.SetStateAction<Date | null>>;
	setValue: UseFormSetValue<FormData>;
}

// Removed commented-out termOptions and yearOptions as they're no longer needed
const loadOptions = ["Full", "Part"];
const statusOptions = [
	"Tenured",
	"Tenured-Track",
	"Lecturer Before 2001",
	"Extendee",
	"Retiree",
];
const benefitsOptions = ["HMO", "PCSO", "Senior Citizen"];

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

const FormTeachingInfo: React.FC<FormTeachingInfoProps> = ({
	register,
	errors,
	dateHired,
	setDateHired,
	dateRetired,
	setDateRetired,
	setValue,
}) => {
	const [status, setStatus] = useState("");
	const [benefit, setBenefit] = useState("");
	const currentAcademicYear = getCurrentAcademicYear();
	const currentTerm = getCurrentTerm();

	//set initial values when component mounts
	useEffect(() => {
		// Set the academic year field
		setValue("year", currentAcademicYear);

		// Set the term field
		setValue("term", currentTerm);
	}, [setValue, currentAcademicYear, currentTerm]);

	const handleStatusChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setStatus(event.target.value);
	};

	const handleBenefitChange = (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		setBenefit(event.target.value);
	};

	return (
		<>
			<hr className="section-separator" />
			<fieldset className="TeachingInfo">
				<div className="row">
					<div className="mb-1 col-md-4">
						<div className="row">
							<div className="mb-1 col-md-6">
								<label htmlFor="term" className="form-label">
									Academic Term
								</label>
								<input
									{...register("term")}
									id="term"
									type="text"
									className="form-control"
									value={currentTerm}
									readOnly
								/>
								{errors.term && (
									<p className="text-danger">
										{errors.term.message}
									</p>
								)}
							</div>
							<div className="mb-1 col-md-6">
								<label htmlFor="year" className="form-label">
									Academic Year
								</label>
								<input
									{...register("year")}
									id="year"
									type="text"
									className="form-control"
									value={currentAcademicYear}
									readOnly
								/>
								{errors.year && (
									<p className="text-danger">
										{errors.year.message}
									</p>
								)}
							</div>
						</div>
						<div className="mb-1 col-md-12">
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
								<p className="text-danger">
									{errors.load.message}
								</p>
							)}
						</div>
					</div>
					<div className="mb-1 col-md-2">
						<label className="form-label">Status</label>
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
								{errors.status.message}
							</p>
						)}
					</div>
					<div className="mb-1 col-md-3">
						<div
							className="mb-1 col-md-12 date-hired-picker"
							style={{
								display:
									status === "Tenured-Track"
										? "block"
										: "none",
							}}
						>
							<label htmlFor="dateHired" className="form-label">
								If Tenure-Track, please input DATE HIRED:
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
								<p className="text-danger">
									{errors.dateHired.message}
								</p>
							)}
						</div>
						<div
							className="mb-1 col-md-12 date-retired-picker"
							style={{
								display:
									status === "Retiree" ? "block" : "none",
							}}
						>
							<label htmlFor="dateRetired" className="form-label">
								If Retiree, please input DATE RETIRED:
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
								<p className="text-danger">
									{errors.dateRetired.message}
								</p>
							)}
						</div>
					</div>
					<div className="mb-1 col-md-3">
						<label className="form-label">Health Benefits</label>
						{benefitsOptions.map((option, index) => (
							<div key={index} className="form-check">
								<input
									{...register("benefits")}
									id={`benefits-${index}`}
									type="radio"
									value={option}
									className="form-check-input"
									onChange={handleBenefitChange}
								/>
								<label
									htmlFor={`benefits-${index}`}
									className="form-check-label"
								>
									{option}
								</label>
							</div>
						))}
						{errors.benefits && (
							<p className="text-danger">
								{errors.benefits.message}
							</p>
						)}
						<p></p>
						{/* empty space */}
						<div
							className="mb-1 col-md-12 hmo-input"
							style={{
								display: benefit === "HMO" ? "block" : "none",
							}}
						>
							<label htmlFor="hmo" className="form-label">
								If HMO, please specify:
							</label>
							<input
								{...register("hmo")}
								id="hmo"
								type="text"
								className={`form-control ${
									errors.hmo ? "is-invalid" : ""
								}`}
								placeholder="Enter HMO provider name"
							/>
							{errors.hmo && (
								<p className="text-danger">
									{errors.hmo.message}
								</p>
							)}
						</div>
					</div>
				</div>
			</fieldset>
		</>
	);
};

export default FormTeachingInfo;
