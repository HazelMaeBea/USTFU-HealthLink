import React, {
	Dispatch,
	SetStateAction,
	useEffect,
} from "react";
import {
	UseFormRegister,
	FieldErrors,
	UseFormSetValue,
	UseFormWatch,
} from "react-hook-form";
import { UnifiedFormData } from "../FormUtil/formTypes";
import { formatDateToYYYYMMDD } from "../../../../utils/dateUtils";

interface FormTeachingInfoProps {
	register: UseFormRegister<UnifiedFormData>;
	errors: FieldErrors<UnifiedFormData>;
	dateHired: Date | null;
	setDateHired: Dispatch<SetStateAction<Date | null>>;
	dateRetired: Date | null;
	setDateRetired: Dispatch<SetStateAction<Date | null>>;
	setValue: UseFormSetValue<UnifiedFormData>;
	watch: UseFormWatch<UnifiedFormData>;
}

const statusOptions = [
	"Tenured",
	"Tenured-Track",
	"Lecturer Before 2001",
	"Extendee",
	"Retiree",
];
const benefitsOptions = ["HMO", "PCSO", "Senior Citizen"];

const getCurrentAcademicYear = () => {
	const today = new Date();
	const currentMonth = today.getMonth();
	const currentYear = today.getFullYear();
	let academicYearStart: number;
	if (currentMonth >= 7) {
		academicYearStart = currentYear;
	} else {
		academicYearStart = currentYear - 1;
	}
	return `${academicYearStart}-${academicYearStart + 1}`;
};

const getCurrentTerm = () => {
	const today = new Date();
	const currentMonth = today.getMonth();
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
	watch,
}) => {
	const currentAcademicYear = getCurrentAcademicYear();
	const currentTerm = getCurrentTerm();

	const watchedStatus = watch("status");
	const watchedBenefit = watch("benefits");

	// Set initial values when component mounts
	useEffect(() => {
		setValue?.("year", currentAcademicYear);
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
									Academic Term <span className="required-asterisk">*</span>
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
									Academic Year <span className="required-asterisk">*</span>
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
								Load (Units) <span className="required-asterisk">*</span>
							</label>
							<input
								id="load"
								type="number"
								className={`form-control ${errors.load ? "is-invalid" : ""}`}
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
								display: watchedStatus === "Tenured-Track" ? "block" : "none",
							}}
						>
							<label htmlFor="dateHired" className="form-label">
								If Tenure-Track, please input DATE HIRED:
							</label>
							<input
								type="date"
								value={formatDateToYYYYMMDD(dateHired)}
								{...register("dateHired")}
								id="dateHired"
								className={`form-control ${errors.dateHired ? "is-invalid" : ""}`}
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
									{errors.dateHired.message}
								</p>
							)}
						</div>
						<div
							className="mb-1 col-md-12 date-retired-picker"
							style={{
								display: watchedStatus === "Retiree" ? "block" : "none",
							}}
						>
							<label htmlFor="dateRetired" className="form-label">
								If Retiree, please input DATE RETIRED:
							</label>
							<input
								type="date"
								value={formatDateToYYYYMMDD(dateRetired)}
								{...register("dateRetired")}
								id="dateRetired"
								className={`form-control ${errors.dateRetired ? "is-invalid" : ""}`}
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
						<div
							className="mb-1 col-md-12 hmo-input"
							style={{
								display: watchedBenefit === "HMO" ? "block" : "none",
							}}
						>
							<label htmlFor="hmo" className="form-label">
								If HMO, please specify: <span className="required-asterisk">*</span>
							</label>
							<input
								{...register("hmo")}
								id="hmo"
								type="text"
								className={`form-control ${errors.hmo ? "is-invalid" : ""}`}
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
