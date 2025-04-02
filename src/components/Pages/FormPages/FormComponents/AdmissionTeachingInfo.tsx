import React, {
	useEffect,
	useState,
	Dispatch,
	SetStateAction,
	useRef,
} from "react";
import {
	UseFormRegister,
	FieldErrors,
	UseFormSetValue,
	UseFormWatch,
} from "react-hook-form";
import { FormData } from "../AdmissionForm";

interface AdmissionTeachingInfoProps {
	register: UseFormRegister<FormData>;
	errors: FieldErrors<FormData>;
	dateHired: Date | null;
	setDateHired: Dispatch<SetStateAction<Date | null>>;
	dateRetired: Date | null;
	setDateRetired: Dispatch<SetStateAction<Date | null>>;
	setValue?: UseFormSetValue<FormData>;
	watch?: UseFormWatch<FormData>;
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
	setValue,
	watch,
}) => {
	const [status, setStatus] = useState("");

	// Get current status from form
	const formStatus = watch ? watch("status") : "";

	// Add a ref to track whether the user has interacted with the status field
	const userInteractedRef = useRef(false);

	// Sync local status with form status (for autofill), but give precedence to user selection
	useEffect(() => {
		// Only update on initial autofill, not on subsequent changes
		if (formStatus && formStatus !== status && !userInteractedRef.current) {
			setStatus(formStatus);
		}
	}, [formStatus, status]);

	const handleStatusChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		userInteractedRef.current = true; // Mark that user has interacted
		setStatus(event.target.value);
	};

	return (
		<fieldset className="personal-info-container">
			<div className="row mb-3">
				<div className="col-md-12">
					<label htmlFor="address" className="form-label">
						Home Address{" "}
						<span className="required-asterisk">*</span>
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
						Employee ID Number{" "}
						<span className="required-asterisk">*</span>
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

				<div className="col-md-3">
					<label className="form-label">
						Employment Status{" "}
						<span className="required-asterisk">*</span>
					</label>
					{/* Replace select with radio buttons */}
					{statusOptions.map((option, index) => (
						<div key={index} className="form-check">
							<input
								{...register("status")}
								id={`status-${index}`}
								type="radio"
								value={option}
								className="form-check-input"
								onChange={handleStatusChange}
								checked={status === option}
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

				<div className="col-md-4">
					{/* Date fields */}
					<div
						style={{
							display:
								status === "Tenured-Track" ? "block" : "none",
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
						style={{
							display: status === "Retiree" ? "block" : "none",
							marginTop:
								status === "Retiree" &&
								status === "Tenured-Track"
									? "1rem"
									: "0",
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
