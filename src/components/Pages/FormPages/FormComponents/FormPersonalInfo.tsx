import React, {
	useState,
	useEffect,
	Dispatch,
	SetStateAction,
	useCallback,
} from "react";
import {
	UseFormRegister,
	FieldErrors,
	UseFormSetValue,
	UseFormWatch,
} from "react-hook-form";
import { UnifiedFormData } from "../FormUtil/formTypes";

interface FormPersonalInfoProps {
	register: UseFormRegister<UnifiedFormData>;
	errors: FieldErrors<UnifiedFormData>;
	setValue: UseFormSetValue<UnifiedFormData>;
	watch: UseFormWatch<UnifiedFormData>;
	phoneInputValue?: string;
	setPhoneInputValue?: Dispatch<SetStateAction<string>>;
}

const suffixOptions = ["Sr.", "Jr.", "II", "III", "IV", "MD", "PhD"];
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
	setValue,
	watch,
	phoneInputValue: externalPhoneValue,
	setPhoneInputValue: externalSetPhoneValue,
}) => {
	const [localPhoneInputValue, setLocalPhoneInputValue] =
		useState<string>("+63");
	const [isPhoneFocused, setIsPhoneFocused] = useState<boolean>(false);

	const phoneInputValue = externalPhoneValue || localPhoneInputValue;
	const setPhoneInputValue = externalSetPhoneValue || setLocalPhoneInputValue;

	// Use the watch function to get all form values instead of watching just "contact"
	const formValues = watch();
	const contactValue = formValues.contact;

	// Memoize formatPhoneNumberDisplay with useCallback
	const formatPhoneNumberDisplay = useCallback(
		(value: string) => {
			if (value.startsWith("+63+63")) {
				value = "+63" + value.substring(6);
			} else if (!value.startsWith("+63")) {
				value = "+63" + value.replace(/^63/, "");
			}

			let formattedValue = value;

			if (value.length > 3) {
				const mainNumber = value.substring(3);
				const formatted = mainNumber.replace(
					/(\d{3})(\d{3})(\d+)/,
					"$1-$2-$3"
				);
				formattedValue = "+63-" + formatted;
			}

			setPhoneInputValue(formattedValue);
		},
		[setPhoneInputValue]
	);

	useEffect(() => {
		if (contactValue && !isPhoneFocused) {
			formatPhoneNumberDisplay(contactValue.toString());
		}
	}, [contactValue, isPhoneFocused, formatPhoneNumberDisplay]);

	const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		let value = e.target.value;
		const previousValue = phoneInputValue;
		const selectionStart = e.target.selectionStart;

		const isBackspace =
			value.length < previousValue.length &&
			selectionStart !== null &&
			selectionStart <= previousValue.length;

		if (isBackspace && selectionStart !== null && selectionStart <= 4) {
			if (value.length < 3 || !value.startsWith("+")) {
				setPhoneInputValue("+63");
				return;
			}
		}

		if (!value.startsWith("+63")) {
			if (value.startsWith("+")) {
				value = "+63" + value.substring(1).replace(/^63/, "");
			} else {
				value = "+63" + value.replace(/^63/, "");
			}
		}

		while (value.includes("+63+63")) {
			value = value.replace("+63+63", "+63");
		}

		const digitsOnly = "+" + value.substring(1).replace(/\D/g, "");

		setPhoneInputValue(digitsOnly);

		if (digitsOnly.length > 3) {
			const numericValue = parseInt(digitsOnly.substring(3), 10);
			setValue("contact" as keyof UnifiedFormData, numericValue, {
				shouldValidate: true,
			});
		} else {
			setValue("contact" as keyof UnifiedFormData, null, {
				shouldValidate: true,
			});
		}

		if (!isBackspace && e.target.selectionStart !== null) {
			setTimeout(() => {
				if (e.target) {
					const newPosition = Math.min(
						Math.max(selectionStart || 0, 3),
						digitsOnly.length
					);
					e.target.setSelectionRange(newPosition, newPosition);
				}
			}, 0);
		}
	};

	const handlePhoneFocus = () => {
		setIsPhoneFocused(true);
		if (contactValue) {
			let rawValue = contactValue.toString();
			if (!rawValue.startsWith("+63") && !rawValue.startsWith("63")) {
				rawValue = "+63" + rawValue;
			} else if (rawValue.startsWith("63")) {
				rawValue = "+" + rawValue;
			}
			setPhoneInputValue(rawValue);
		} else {
			setPhoneInputValue("+63");
		}
	};

	const handlePhoneBlur = () => {
		setIsPhoneFocused(false);

		if (phoneInputValue.length > 3) {
			const numericPart = phoneInputValue.substring(3).replace(/\D/g, "");
			if (numericPart) {
				formatPhoneNumberDisplay("+63" + numericPart);
			}
		}
	};

	// Get the register result for "contact" safely
	const contactRegister = register("contact" as keyof UnifiedFormData);

	const {
		name: contactName,
		ref: contactRef,
		onChange: contactOnChange,
		onBlur: contactOnBlur,
		...contactRest
	} = contactRegister;

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
						<p className="text-danger">
							{errors.lastname.message as string}
						</p>
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
							{errors.firstname.message as string}
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
							{errors.middlename.message as string}
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
						<p className="text-danger">
							{errors.age.message as string}
						</p>
					)}
				</div>

				<div className="mb-1 col-md-2">
					<label htmlFor="gender" className="form-label">
						Gender <span className="required-asterisk">*</span>
					</label>
					<select
						id="gender"
						className={`form-select ${
							errors.gender ? "is-invalid" : ""
						}`}
						{...register("gender")}
					>
						<option value="">Please select gender</option>
						<option value="Male">Male</option>
						<option value="Female">Female</option>
					</select>
					{errors.gender && (
						<p className="text-danger">
							{errors.gender.message as string}
						</p>
					)}
				</div>

				<div className="mb-1 col-md-6">
					<label htmlFor="college" className="form-label">
						College Affiliation{" "}
						<span className="required-asterisk">*</span>
					</label>
					<select
						id="college"
						className={`form-select ${
							errors.college ? "is-invalid" : ""
						}`}
						{...register("college")}
					>
						<option value="">Please select college</option>
						<option value="College of Architecture">
							College of Architecture
						</option>
						{collegeOptions.map((option, index) => (
							<option key={index} value={option}>
								{option}
							</option>
						))}
					</select>
					{errors.college && (
						<p className="text-danger">
							{errors.college.message as string}
						</p>
					)}
				</div>

				<div className="mb-1 col-md-3">
					<label htmlFor="contact" className="form-label">
						Phone Number{" "}
						<span className="required-asterisk">*</span>
					</label>
					<input
						id="contact"
						name={contactName}
						ref={contactRef}
						type="text"
						className={`form-control ${
							errors.contact ? "is-invalid" : ""
						}`}
						placeholder="e.g. +63-XXX-XXX-XXXX"
						value={phoneInputValue}
						onChange={(e) => {
							handlePhoneChange(e);
							contactOnChange(e);
						}}
						onFocus={handlePhoneFocus}
						onBlur={(e) => {
							handlePhoneBlur();
							if (contactOnBlur) contactOnBlur(e);
						}}
						{...contactRest}
					/>
					{errors.contact && (
						<p className="text-danger">
							{errors.contact.message as string}
						</p>
					)}
				</div>
			</div>
			<hr className="section-separator" />
		</fieldset>
	);
};

export default FormPersonalInfo;
