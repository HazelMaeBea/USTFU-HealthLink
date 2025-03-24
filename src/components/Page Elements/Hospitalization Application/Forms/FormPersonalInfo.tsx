import React from "react";
import { UseFormRegister, FieldErrors } from "react-hook-form";
import { FormData } from "./FormBody";

interface FormPersonalInfoProps {
	register: UseFormRegister<FormData>;
	errors: FieldErrors<FormData>;
}

const suffixOptions = ["Sr.", "Jr.", "II", "III", "IV", "MD", "PhD"];
const genderOptions = ["Male", "Female"];
const collegeOptions = [
	"College of Accountancy",
	"College of Architecture",
	"Faculty of Arts and Letters",
	"Faculty of Civil Law",
	"College of Commerce and Business Administration",
	"College of Education",
	"Faculty of Engineering",
	"College of Fine Arts and Design",
	"Graduate School",
	"Graduate School of Law",
	"College of Information and Computing Sciences",
	"Faculty of Medicine and Surgery",
	"Conservatory of Music",
	"College of Nursing",
	"Faculty of Pharmacy",
	"Institute of Physical Education and Athletics",
	"College of Rehabilitation Sciences",
	"College of Science",
	"College of Tourism and Hospitality Management",
];

const FormPersonalInfo: React.FC<FormPersonalInfoProps> = ({
	register,
	errors,
}) => {
	return (
		<fieldset className="PersonalInfo">
			<div className="row">
				<div className="mb-1 col-md-3">
					<label htmlFor="lastname" className="form-label">
						Last Name <span className="required-asterisk">*</span>
					</label>
					<input
						{...register("lastname")}
						id="lastname"
						type="text"
						className="form-control"
						placeholder="e.g. Doe..."
					/>
					{errors.lastname && (
						<p className="text-danger">{errors.lastname.message}</p>
					)}
				</div>
				<div className="mb-1 col-md-3">
					<label htmlFor="firstname" className="form-label">
						First Name <span className="required-asterisk">*</span>
					</label>
					<input
						{...register("firstname")}
						id="firstname"
						type="text"
						className="form-control"
						placeholder="e.g. John..."
					/>
					{errors.firstname && (
						<p className="text-danger">
							{errors.firstname.message}
						</p>
					)}
				</div>
				<div className="mb-1 col-md-3">
					<label htmlFor="middlename" className="form-label">
						Middle Name <span className="required-asterisk">*</span>
					</label>
					<input
						{...register("middlename")}
						id="middlename"
						type="text"
						className="form-control"
						placeholder="e.g. Michael..."
					/>
					{errors.middlename && (
						<p className="text-danger">
							{errors.middlename.message}
						</p>
					)}
				</div>
				<div className="mb-1 col-md-3">
					<label htmlFor="suffix" className="form-label">
						Suffix
					</label>
					<select
						{...register("suffix")}
						id="suffix"
						className="form-select"
					>
						<option
							className="option-placeholder"
							value=""
							disabled
							selected
							hidden
						>
							Select suffix
						</option>
						{suffixOptions.map((option, index) => (
							<option key={index} value={option}>
								{option}
							</option>
						))}
					</select>
				</div>
			</div>
			<div className="row">
				<div className="mb-1 col-md-1">
					<label htmlFor="age" className="form-label">
						Age <span className="required-asterisk">*</span>
					</label>
					<input
						{...register("age", { valueAsNumber: true })}
						id="age"
						type="number"
						className="form-control"
						placeholder="35..."
					/>
					{errors.age && (
						<p className="text-danger">{errors.age.message}</p>
					)}
				</div>
				<div className="mb-1 col-md-2">
					<label htmlFor="gender" className="form-label">
						Gender <span className="required-asterisk">*</span>
					</label>
					<select
						{...register("gender")}
						id="gender"
						className="form-select"
					>
						<option
							className="option-placeholder"
							value=""
							disabled
							selected
							hidden
						>
							Select gender
						</option>
						{genderOptions.map((option, index) => (
							<option key={index} value={option}>
								{option}
							</option>
						))}
					</select>
					{errors.gender && (
						<p className="text-danger">{errors.gender.message}</p>
					)}
				</div>
				<div className="mb-1 col-md-6">
					<label htmlFor="college" className="form-label">
						College Affiliation <span className="required-asterisk">*</span>
					</label>
					<select
						{...register("college")}
						id="college"
						className="form-select"
					>
						<option value="" disabled selected hidden>
							Select college affiliation
						</option>
						{collegeOptions.map((option, index) => (
							<option key={index} value={option}>
								{option}
							</option>
						))}
					</select>
					{errors.college && (
						<p className="text-danger">{errors.college.message}</p>
					)}
				</div>
				<div className="mb-1 col-md-3">
					<label htmlFor="contact" className="form-label">
						Phone Number <span className="required-asterisk">*</span>
					</label>
					<input
						{...register("contact", { valueAsNumber: true })}
						id="contact"
						type="number"
						className="form-control"
						placeholder="e.g. +639-xxx-xxx-xxx..."
					/>
					{errors.contact && (
						<p className="text-danger">{errors.contact.message}</p>
					)}
				</div>
			</div>
			<hr className="section-separator" />
		</fieldset>
	);
};

export default FormPersonalInfo;
