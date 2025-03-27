import React, { useEffect, useState, useRef } from "react";
import {
	UseFormRegister,
	FieldErrors,
	UseFormSetValue,
	UseFormWatch,
} from "react-hook-form";
import { HospitalFormData } from "../../PendingRequests/types";

// import { FormData } from "./FormBody";
// interface FormTeachingInfoProps {
// 	register: UseFormRegister<FormData>;
// 	errors: FieldErrors<FormData>;
// 	dateHired: Date | null;
// 	setDateHired: Dispatch<SetStateAction<Date | null>>;
// 	dateRetired: Date | null;
// 	setDateRetired: Dispatch<SetStateAction<Date | null>>;
// 	setValue?: UseFormSetValue<FormData>;
// 	watch?: UseFormWatch<FormData>; // Add watch function to props
// }

interface FormTeachingInfoProps {
	register: UseFormRegister<HospitalFormData>;
	errors: FieldErrors<HospitalFormData>;
	setValue: UseFormSetValue<HospitalFormData>;
	watch: UseFormWatch<HospitalFormData>;
	dateHired: Date | null;
	setDateHired: React.Dispatch<React.SetStateAction<Date | null>>;
	dateRetired: Date | null;
	setDateRetired: React.Dispatch<React.SetStateAction<Date | null>>;
}

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
	watch, // Get watch from props
}) => {
	const [status, setStatus] = useState("");
	const [benefit, setBenefit] = useState("");
	const currentAcademicYear = getCurrentAcademicYear();
	const currentTerm = getCurrentTerm();

	// Get the current status value from the form
	const formStatus = watch ? watch("status") : "";

	// Add a ref to track whether the user has interacted with the status field
	const userInteractedRef = useRef(false);

	// Update local status state when form status changes (handles autofill)
	// but only if the user hasn't interacted with the field
	useEffect(() => {
		if (formStatus && formStatus !== status && !userInteractedRef.current) {
			setStatus(formStatus);
		}
	}, [formStatus, status]);

	const handleStatusChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		userInteractedRef.current = true; // Mark that user has interacted
		setStatus(event.target.value);
	};

	// Similarly for benefit options
	const formBenefit = watch ? watch("benefits") : "";
	const benefitInteractedRef = useRef(false);

	useEffect(() => {
		if (
			formBenefit &&
			formBenefit !== benefit &&
			!benefitInteractedRef.current
		) {
			setBenefit(formBenefit);
		}
	}, [formBenefit, benefit]);

	const handleBenefitChange = (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		benefitInteractedRef.current = true; // Mark that user has interacted
		setBenefit(event.target.value);
	};

	//set initial values when component mounts
	useEffect(() => {
		// Set the academic year field
		setValue?.("year", currentAcademicYear);

		// Set the term field
		setValue?.("term", currentTerm);
	}, [setValue, currentAcademicYear, currentTerm]);

	return (
		<>
			<hr className="section-separator" />
			<fieldset className="TeachingInfo">
				<div className="row">
					<div className="mb-1 col-md-4">
						<div className="row">
							<div className="mb-1 col-md-6">
								<label htmlFor="term" className="form-label">
									Academic Term{" "}
									<span className="required-asterisk">*</span>
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
									Academic Year{" "}
									<span className="required-asterisk">*</span>
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
						<div className="mb-1 col-md-5">
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
								<p className="text-danger">
									{errors.load.message}
								</p>
							)}
						</div>
					</div>
					<div className="mb-1 col-md-2">
						<label className="form-label">
							Status <span className="required-asterisk">*</span>
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
									checked={status === option} // Make sure checked state reflects current status
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
									// Trigger register onChange
									register("dateHired").onChange(e);
								}}
								style={{ color: "black" }}
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
							<input
								type="date"
								value={
									dateRetired
										? dateRetired
												.toISOString()
												.split("T")[0]
										: ""
								}
								{...register("dateRetired")} // Remove the validation here
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
								If HMO, please specify:{" "}
								<span className="required-asterisk">*</span>
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
