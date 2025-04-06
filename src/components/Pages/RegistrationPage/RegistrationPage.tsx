"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFirebase } from "../../../contexts/firebaseContext";
import styles from "./RegistrationPage.module.css";
import ConfirmationMessage from "./ConfirmationMessage";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../../contexts/firebase";
import USTFULogo from "../../../assets/USTFULogo.png";
import Popout from "../../Page Elements/Popout/Popout";

const schema = z
	.object({
		firstName: z
			.string({
				required_error: "Please enter your First Name",
				invalid_type_error: "First name must be text",
			})
			.min(1, "Please enter your First Name"),

		lastName: z
			.string({
				required_error: "Please enter your Last Name",
				invalid_type_error: "Last name must be text",
			})
			.min(1, "Please enter your Last Name"),

		middleName: z
			.string({
				required_error: "Please enter your Middle Name",
				invalid_type_error: "Middle name must be text",
			})
			.min(1, "Please enter your Middle Name"),

		suffix: z.string().optional(),

		idNumber: z.string().regex(/^\d{4}-\d{6}$/, {
			message: "Please format your ID number",
		}),

		birthdate: z
			.string({
				required_error: "Please enter your Birthdate",
				invalid_type_error: "Please select a valid date",
			})
			.min(1, "Please enter your Birthdate"),

		phoneNumber: z
			.string({
				required_error: "Please enter your Phone Number",
				invalid_type_error: "Please enter a valid phone number",
			})
			.min(10, {
				message: "Phone number must be at least 10 digits after +63",
			}),

		term: z.string().nonempty("Term is required"),
		year: z.string().nonempty("Year is required"),

		load: z.coerce
			.number({
				required_error: "Please enter your Load (Units)",
				invalid_type_error: "Teaching load must be a number",
			})
			.min(0, "Teaching load cannot be negative")
			.max(30, "Teaching load cannot exceed 30 units")
			.refine((val) => val !== 0, {
				message: "Please enter your Load (Units)",
			}),

		status: z.preprocess(
			(val) => (val === null ? "" : val),
			z.string().nonempty("Please select your employment status")
		),

		address: z
			.string({
				required_error: "Please enter your valid Address",
				invalid_type_error: "Address must be text",
			})
			.min(1, "Please enter your valid Address"),

		dateHired: z
			.string({
				required_error: "Please enter the date you were Hired",
				invalid_type_error: "Please select a valid date",
			})
			.min(1, "Please enter the date you were Hired"),

		dateRetired: z
			.string({
				invalid_type_error: "Please select a valid date",
			})
			.nullable()
			.optional(),

		gender: z.preprocess(
			(val) => (val === null ? "" : val),
			z.string().nonempty("Please select your gender")
		),

		college: z.preprocess(
			(val) => (val === null ? "" : val),
			z.string().nonempty("Please select your college")
		),
	})
	.superRefine((data, ctx) => {
		if (data.status === "Retiree" && !data.dateRetired) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Please provide your retirement date",
				path: ["dateRetired"],
			});
		}
	});

type FormData = z.infer<typeof schema>;

const suffixOptions = ["", "Sr.", "Jr.", "II", "III", "IV", "MD", "PhD"];
const genderOptions = ["Male", "Female"];
const statusOptions = [
	"Tenured",
	"Tenured-Track",
	"Lecturer Prior 2001",
	"Extendee",
	"Retiree",
];
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

const calculateAcademicYear = (): string => {
	const currentDate = new Date();
	const currentYear = currentDate.getFullYear();
	const currentMonth = currentDate.getMonth();

	if (currentMonth >= 5) {
		return `${currentYear}-${currentYear + 1}`;
	} else {
		return `${currentYear - 1}-${currentYear}`;
	}
};

const calculateTerm = (): string => {
	const currentDate = new Date();
	const currentMonth = currentDate.getMonth();

	if (currentMonth >= 7 || currentMonth === 0) {
		return "1st";
	} else if (currentMonth >= 1 && currentMonth <= 4) {
		return "2nd";
	} else {
		return "1st";
	}
};

const RegistrationPage: React.FC = () => {
	const [submitted, setSubmitted] = useState(false);
	const [currentTerm, setCurrentTerm] = useState<string>("");
	const [currentYear, setCurrentYear] = useState<string>("");
	const [showConfirmation, setShowConfirmation] = useState(false);
	const [formValues, setFormValues] = useState<FormData | null>(null);
	const { displayName, photoURL, email, currentUser } = useFirebase();
	const {
		register,
		handleSubmit,
		setValue,
		formState: { errors },
		watch,
		clearErrors,
	} = useForm<FormData>({
		resolver: zodResolver(schema),
		mode: "onChange",
		defaultValues: {
			gender: undefined,
			college: "",
			status: "",
		},
		reValidateMode: "onChange",
	});

	const [phoneInputValue, setPhoneInputValue] = useState<string>("+63");
	const [isPhoneFocused, setIsPhoneFocused] = useState<boolean>(false);

	useEffect(() => {
		const year = calculateAcademicYear();
		const term = calculateTerm();

		setCurrentYear(year);
		setCurrentTerm(term);

		setValue("year", year);
		setValue("term", term);
	}, [setValue]);

	const handleRegister = async (formData: FormData) => {
		try {
			if (!currentUser?.uid) throw new Error("User ID is missing");

			// Format the phone number correctly by removing the prefix if present
			let formattedPhoneNumber = formData.phoneNumber;
			if (formattedPhoneNumber.startsWith("+63")) {
				formattedPhoneNumber = formattedPhoneNumber.substring(3);
			} else if (formattedPhoneNumber.startsWith("63")) {
				formattedPhoneNumber = formattedPhoneNumber.substring(2);
			}

			// Ensure it only has digits
			formattedPhoneNumber = formattedPhoneNumber.replace(/\D/g, "");

			// Create user document matching the format specified
			const userData = {
				email: email,
				fullName: `${formData.firstName.toUpperCase()} ${formData.middleName.toUpperCase()} ${formData.lastName.toUpperCase()}`,
				college: formData.college,
				createdAt: new Date().toLocaleString("en-US", {
					timeZone: "Asia/Manila",
					month: "long",
					day: "numeric",
					year: "numeric",
					hour: "numeric",
					minute: "numeric",
					second: "numeric",
					hour12: true,
					timeZoneName: "short",
				}),
				role: "member",
				status: "ACTIVE",
				verified: false,
				personalInfo: {
					firstName: formData.firstName,
					middleName: formData.middleName || "",
					lastName: formData.lastName,
					suffix: formData.suffix || "",
					address: formData.address,
					birthdate: formData.birthdate,
					college: formData.college,
					dateHired: formData.dateHired,
					dateRetired: formData.dateRetired || "",
					gender: formData.gender,
					idNumber: formData.idNumber,
					load: formData.load.toString(),
					phoneNumber: formattedPhoneNumber,
					status: formData.status,
					term: formData.term,
					year: formData.year,
					remainingBenefits: 0,
				},
				settings: {
					autofill: true,
					notification: false,
				},
			};

			const userRef = doc(db, "users", currentUser.uid);
			await setDoc(userRef, userData);

			setSubmitted(true);
		} catch (error) {
			console.error("Error during registration:", error);
			if (error instanceof Error) {
				console.error(error.message);
			} else {
				console.error("Failed to register.");
			}
		}
	};

	const onSubmit: SubmitHandler<FormData> = (data) => {
		setFormValues(data);
		setShowConfirmation(true);
	};

	const handleConfirmRegistration = () => {
		if (formValues) {
			handleRegister(formValues);
		}
		setShowConfirmation(false);
	};

	const handleCancelRegistration = () => {
		setShowConfirmation(false);
		setFormValues(null);
	};

	const formatIDNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value.replace(/\D/g, "").slice(0, 10);
		const formattedValue =
			value.length > 4 ? `${value.slice(0, 4)}-${value.slice(4)}` : value;
		e.target.value = formattedValue;

		setValue("idNumber", formattedValue, { shouldValidate: true });
	};

	const formatPhoneNumberDisplay = (value: string) => {
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
	};

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
			const numericValue = digitsOnly.substring(3);
			setValue(
				"phoneNumber",
				numericValue.length >= 10 ? numericValue : "",
				{ shouldValidate: true }
			);
		} else {
			setValue("phoneNumber", "", { shouldValidate: true });
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
		const currentValue = watch("phoneNumber");
		if (currentValue) {
			if (currentValue.startsWith("6363")) {
				const cleanValue = currentValue.replace(/^6363/, "63");
				setValue("phoneNumber", cleanValue);
				setPhoneInputValue("+" + cleanValue);
			} else if (currentValue.startsWith("63")) {
				setPhoneInputValue("+" + currentValue);
			} else {
				setPhoneInputValue("+63" + currentValue);
			}
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

	// Date handling functions
	// Convert date string from YYYY-MM-DD to MM/DD/YYYY
	const formatDateToDisplay = (dateString: string): string => {
		if (!dateString) return "";

		// Check if the date is already in MM/DD/YYYY format
		if (dateString.includes("/")) return dateString;

		try {
			const [year, month, day] = dateString.split("-");
			return `${month}/${day}/${year}`;
		} catch {
			return "";
		}
	};

	// Convert date string from MM/DD/YYYY to YYYY-MM-DD
	const formatDateToInput = (dateString: string): string => {
		if (!dateString) return "";

		// Check if the date is already in YYYY-MM-DD format
		if (dateString.includes("-")) return dateString;

		try {
			const [month, day, year] = dateString.split("/");
			return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
		} catch {
			return "";
		}
	};

	const handleDateInput = (
		e: React.ChangeEvent<HTMLInputElement>,
		fieldName: string
	) => {
		const inputDate = e.target.value; // This is in YYYY-MM-DD format
		if (!inputDate) {
			setValue(fieldName as keyof FormData, "");
		} else {
			const formattedDate = formatDateToDisplay(inputDate);
			setValue(fieldName as keyof FormData, formattedDate, {
				shouldValidate: true,
				shouldDirty: true,
				shouldTouch: true,
			});
		}
	};

	// Custom handler for input changes to clear errors immediately
	const handleInputChange = (fieldName: keyof FormData) => {
		if (errors[fieldName]) {
			clearErrors(fieldName);
		}
	};

	if (submitted) {
		return <ConfirmationMessage />;
	}

	return (
		<>
			<div className={styles.registrationPage}>
				<form
					onSubmit={handleSubmit(onSubmit)}
					className={styles.formBody}
				>
					<div className={styles.profileCard}>
						{photoURL && (
							<>
								<img
									src={photoURL || "/placeholder.svg"}
									alt="User"
									className={styles.userImage}
								/>
								<div className={styles.userInfo}>
									<p className={styles.userEmail}>{email}</p>{" "}
									<br />
									<p className={styles.userName}>
										Hi, {displayName?.toLowerCase()}, let's
										get you started!
									</p>{" "}
									<br />
									<p className={styles.registrationText}>
										Please set up your account and gain
										access to USTFU HealthLink.
									</p>
								</div>
								<button
									className={styles.signin}
									onClick={() =>
										(window.location.href = "/login")
									}
								>
									Go back to sign in page
								</button>
							</>
						)}
					</div>
					<div className={styles.formContent}>
						<div className={styles.logoContainer}>
							<img
								src={USTFULogo}
								alt="USTFU Logo"
								className={styles.ustfuLogo}
							/>
							<h3>Registration Page</h3>
						</div>

						<div className="row">
							<div className="mb-3 col-md-3">
								<label
									htmlFor="firstName"
									className="form-label"
								>
									First Name{" "}
									<span className="required-asterisk">*</span>
								</label>
								<input
									id="firstName"
									type="text"
									className={`form-control ${
										errors.firstName ? "is-invalid" : ""
									}`}
									{...register("firstName", {
										onChange: () =>
											handleInputChange("firstName"),
									})}
									placeholder="Enter first name"
								/>
								{errors.firstName && (
									<div className="invalid-feedback">
										{errors.firstName.message}
									</div>
								)}
							</div>
							<div className="mb-3 col-md-3">
								<label
									htmlFor="lastName"
									className="form-label"
								>
									Last Name{" "}
									<span className="required-asterisk">*</span>
								</label>
								<input
									id="lastName"
									type="text"
									className={`form-control ${
										errors.lastName ? "is-invalid" : ""
									}`}
									{...register("lastName", {
										onChange: () =>
											handleInputChange("lastName"),
									})}
									placeholder="Enter last name"
								/>
								{errors.lastName && (
									<div className="invalid-feedback">
										{errors.lastName.message}
									</div>
								)}
							</div>
							<div className="mb-3 col-md-3">
								<label
									htmlFor="middleName"
									className="form-label"
								>
									Middle Name{" "}
									<span className="required-asterisk">*</span>
								</label>
								<input
									id="middleName"
									type="text"
									className={`form-control ${
										errors.middleName ? "is-invalid" : ""
									}`}
									{...register("middleName", {
										onChange: () =>
											handleInputChange("middleName"),
									})}
									placeholder="Enter middle name"
								/>
								{errors.middleName && (
									<div className="invalid-feedback">
										{errors.middleName.message}
									</div>
								)}
							</div>
							<div className="mb-3 col-md-3">
								<label htmlFor="suffix" className="form-label">
									Suffix
								</label>
								<select
									id="suffix"
									className={`form-select ${
										errors.suffix ? "is-invalid" : ""
									}`}
									{...register("suffix", {
										onChange: () =>
											handleInputChange("suffix"),
									})}
								>
									<option value="" disabled selected hidden>
										Select suffix
									</option>
									{suffixOptions.map((option, index) => (
										<option key={index} value={option}>
											{option}
										</option>
									))}
								</select>
								{errors.suffix && (
									<div className="invalid-feedback">
										{errors.suffix.message}
									</div>
								)}
							</div>
						</div>
						<div className="row">
							<div className="mb-3 col-md-3">
								<label
									htmlFor="idNumber"
									className="form-label"
								>
									ID Number{" "}
									<span className="required-asterisk">*</span>
								</label>
								<input
									id="idNumber"
									type="text"
									className={`form-control ${
										errors.idNumber ? "is-invalid" : ""
									}`}
									{...register("idNumber", {
										onChange: () =>
											handleInputChange("idNumber"),
									})}
									placeholder="YYYY-XXXXXX"
									onChange={formatIDNumber}
								/>
								{errors.idNumber && (
									<div className="invalid-feedback">
										{errors.idNumber.message}
									</div>
								)}
							</div>
							<div className="mb-3 col-md-3">
								<label
									htmlFor="birthdate"
									className="form-label"
								>
									Birthdate{" "}
									<span className="required-asterisk">*</span>
								</label>
								<input
									id="birthdate"
									type="date"
									className={`form-control ${
										errors.birthdate ? "is-invalid" : ""
									}`}
									{...register("birthdate", {
										onChange: () =>
											handleInputChange("birthdate"),
									})}
									onChange={(e) =>
										handleDateInput(e, "birthdate")
									}
									max={new Date().toISOString().split("T")[0]}
									value={formatDateToInput(
										watch("birthdate") || ""
									)}
								/>
								{errors.birthdate && (
									<div className="invalid-feedback">
										{errors.birthdate.message}
									</div>
								)}
							</div>
							<div className="mb-3 col-md-3">
								<label htmlFor="gender" className="form-label">
									Gender{" "}
									<span className="required-asterisk">*</span>
								</label>
								<select
									id="gender"
									className={`form-select ${
										errors.gender ? "is-invalid" : ""
									}`}
									{...register("gender", {
										onChange: () =>
											handleInputChange("gender"),
									})}
								>
									<option value="" disabled selected hidden>
										Select gender
									</option>
									{genderOptions.map((option, index) => (
										<option key={index} value={option}>
											{option}
										</option>
									))}
								</select>
								{errors.gender && (
									<div className="invalid-feedback">
										{errors.gender.message}
									</div>
								)}
							</div>
							<div className="mb-3 col-md-3">
								<label
									htmlFor="phoneNumber"
									className="form-label"
								>
									Phone Number{" "}
									<span className="required-asterisk">*</span>
								</label>
								<input
									id="phoneNumber"
									type="text"
									className={`form-control ${
										errors.phoneNumber ? "is-invalid" : ""
									}`}
									placeholder="e.g. +63-XXX-XXX-XXXX"
									value={phoneInputValue}
									onChange={handlePhoneChange}
									onFocus={handlePhoneFocus}
									onBlur={handlePhoneBlur}
									aria-label="Phone Number"
								/>
								{errors.phoneNumber && (
									<div className="invalid-feedback">
										{errors.phoneNumber.message}
									</div>
								)}
							</div>
						</div>
						<div className="row">
							<div className="mb-3 col-md-12">
								<label htmlFor="address" className="form-label">
									Address{" "}
									<span className="required-asterisk">*</span>
								</label>
								<input
									id="address"
									type="text"
									className={`form-control ${
										errors.address ? "is-invalid" : ""
									}`}
									{...register("address", {
										onChange: () =>
											handleInputChange("address"),
									})}
									placeholder="Enter address"
								/>
								{errors.address && (
									<div className="invalid-feedback">
										{errors.address.message}
									</div>
								)}
							</div>
						</div>
						<div className="row">
							<div className="mb-3 col-md-3">
								<label htmlFor="term" className="form-label">
									Term{" "}
									<span className="required-asterisk">*</span>
								</label>
								<input
									id="term"
									type="text"
									className="form-control"
									value={currentTerm}
									readOnly
									{...register("term")}
								/>
							</div>
							<div className="mb-3 col-md-3">
								<label htmlFor="year" className="form-label">
									Year{" "}
									<span className="required-asterisk">*</span>
								</label>
								<input
									id="year"
									type="text"
									className="form-control"
									value={currentYear}
									readOnly
									{...register("year")}
								/>
							</div>
							<div className="mb-3 col-md-3">
								<label htmlFor="load" className="form-label">
									Load (Units){" "}
									<span className="required-asterisk">*</span>
								</label>
								<input
									id="load"
									type="number"
									min="0"
									max="30"
									className={`form-control ${
										errors.load ? "is-invalid" : ""
									}`}
									{...register("load", {
										required: true,
										onChange: () =>
											handleInputChange("load"),
									})}
									placeholder="Enter Units (0-30)"
								/>
								{errors.load && (
									<div className="invalid-feedback">
										{errors.load.message}
									</div>
								)}
							</div>
							<div className="mb-3 col-md-3">
								<label htmlFor="status" className="form-label">
									Status{" "}
									<span className="required-asterisk">*</span>
								</label>
								<select
									id="status"
									className={`form-select ${
										errors.status ? "is-invalid" : ""
									}`}
									{...register("status", {
										onChange: () =>
											handleInputChange("status"),
									})}
								>
									<option value="" disabled selected hidden>
										Select status
									</option>
									{statusOptions.map((option, index) => (
										<option key={index} value={option}>
											{option}
										</option>
									))}
								</select>
								{errors.status && (
									<div className="invalid-feedback">
										{errors.status.message}
									</div>
								)}
							</div>
						</div>
						<div className="row">
							<div className="mb-3 col-md-12">
								<label htmlFor="college" className="form-label">
									College{" "}
									<span className="required-asterisk">*</span>
								</label>
								<select
									id="college"
									className={`form-select ${
										errors.college ? "is-invalid" : ""
									}`}
									{...register("college", {
										onChange: () =>
											handleInputChange("college"),
									})}
								>
									<option value="" disabled selected hidden>
										Select college
									</option>
									{collegeOptions.map((option, index) => (
										<option key={index} value={option}>
											{option}
										</option>
									))}
								</select>
								{errors.college && (
									<div className="invalid-feedback">
										{errors.college.message}
									</div>
								)}
							</div>
						</div>
						<div className="row">
							<div className="mb-3 col-md-6">
								<label
									htmlFor="dateHired"
									className="form-label"
								>
									Date Hired{" "}
									<span className="required-asterisk">*</span>
								</label>
								<input
									id="dateHired"
									type="date"
									className={`form-control ${
										errors.dateHired ? "is-invalid" : ""
									}`}
									{...register("dateHired", {
										onChange: () =>
											handleInputChange("dateHired"),
									})}
									onChange={(e) =>
										handleDateInput(e, "dateHired")
									}
									max={new Date().toISOString().split("T")[0]}
									value={formatDateToInput(
										watch("dateHired") || ""
									)}
								/>
								{errors.dateHired && (
									<div className="invalid-feedback">
										{errors.dateHired.message}
									</div>
								)}
							</div>
							<div className="mb-3 col-md-6">
								<label
									htmlFor="dateRetired"
									className="form-label"
								>
									Date Retired
								</label>
								<input
									id="dateRetired"
									type="date"
									className={`form-control ${
										errors.dateRetired ? "is-invalid" : ""
									}`}
									{...register("dateRetired", {
										onChange: () =>
											handleInputChange("dateRetired"),
									})}
									onChange={(e) =>
										handleDateInput(e, "dateRetired")
									}
									min={formatDateToInput(
										watch("dateHired") || ""
									)}
									value={formatDateToInput(
										watch("dateRetired") || ""
									)}
								/>
								{errors.dateRetired && (
									<div className="invalid-feedback">
										{errors.dateRetired.message}
									</div>
								)}
							</div>
						</div>
						<div className={styles.buttonDiv}>
							<button
								className={`btn btn-submit ${styles.btnSubmit}`}
								type="submit"
							>
								Register Now
							</button>
						</div>
					</div>
				</form>
			</div>
			<Popout
				title="Confirm Registration"
				message={
					<>
						Are you sure you want to submit your registration?
						Please confirm that all your information is correct
						before proceeding.
					</>
				}
				onConfirm={handleConfirmRegistration}
				onCancel={handleCancelRegistration}
				isOpen={showConfirmation}
				confirmText="Register"
				showCancelButton={true}
				ariaLabel="Confirm Registration"
			/>
		</>
	);
};

export default RegistrationPage;
