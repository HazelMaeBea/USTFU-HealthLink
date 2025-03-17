"use client";

import type React from "react";
import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFirebase } from "../../../contexts/firebaseContext";
import styles from "./RegistrationPage.module.css";
import ConfirmationMessage from "./ConfirmationMessage";
import USTFULogo from "../../../images/USTFULogo.png"; // Adjust the path as necessary
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../../config/firebase"; // Adjust based on your Firebase config import

const schema = z.object({
	firstName: z.string().min(1, { message: "First name is required" }),
	lastName: z.string().min(1, { message: "Last name is required" }),
	middleName: z.string().optional(),
	suffix: z.string().optional(),
	idNumber: z.string().regex(/^\d{4}-\d{6}$/, {
		message: "ID Number must be in the format YYYY-XXXXXX",
	}),
	birthdate: z.string().min(1, { message: "Birthdate is required" }),
	phoneNumber: z.string().regex(/^63\d{10}$/, {
		message: "Phone number must start with 63 and be 12 digits long",
	}),
	term: z.string().min(1, { message: "Term is required" }),
	year: z.string().min(1, { message: "Year is required" }),
	load: z.string().min(1, { message: "Load is required" }),
	status: z.string().min(1, { message: "Status is required" }),
	address: z.string().min(1, { message: "Address is required" }),
	dateHired: z.string().min(1, { message: "Date Hired is required" }),
	dateRetired: z.string().optional(),
	gender: z.string().min(1, { message: "Gender is required" }),
});

type FormData = z.infer<typeof schema>;

const suffixOptions = ["", "Sr.", "Jr.", "II", "III", "IV", "MD", "PhD"];
const termOptions = ["1st", "2nd"];
const yearOptions = ["2024-2025"];
const statusOptions = [
	"Tenured",
	"Tenured-Track",
	"Lecturer Prior 2001",
	"Extendee",
	"Retiree",
];
const genderOptions = ["Male", "Female", "Other"];

const RegistrationPage: React.FC = () => {
	const [submitted, setSubmitted] = useState(false);
	const { displayName, photoURL, email, currentUser } = useFirebase(); // Ensure `useFirebase` provides user info
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<FormData>({
		resolver: zodResolver(schema),
		mode: "onChange",
	});

	const handleRegister = async (formData: FormData) => {
		try {
			if (!currentUser?.uid) throw new Error("User ID is missing");

			const personalInfo = {
				...formData,
				middleName: formData.middleName || "",
				suffix: formData.suffix || "",
				dateRetired: formData.dateRetired || "",
			};

			const userRef = doc(db, "users", currentUser.uid);
			await setDoc(userRef, { personalInfo }, { merge: true });

			console.log("Registration successful!");
			setSubmitted(true);
		} catch (error) {
			console.error("Error during registration:", error);
			setError(error instanceof Error ? error.message : "Failed to register.");
		}
	};

	const onSubmit: SubmitHandler<FormData> = (data) => {
		console.log("Form data:", data);
		handleRegister(data);
		setSubmitted(true);
	};

	const formatIDNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value.replace(/\D/g, "").slice(0, 10);
		const formattedValue =
			value.length > 4 ? `${value.slice(0, 4)}-${value.slice(4)}` : value;
		e.target.value = formattedValue;
	};

	const formatBirthdate = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value.replace(/\D/g, "").slice(0, 8);
		const formattedValue =
			value.length > 2
				? `${value.slice(0, 2)}/${value.slice(2, 4)}/${value.slice(4)}`
				: value;
		e.target.value = formattedValue;
	};

	if (submitted) {
		return <ConfirmationMessage />;
	}

	return (
		<div className={styles.registrationPage}>
			<form onSubmit={handleSubmit(onSubmit)} className={styles.formBody}>
				<div className={styles.profileCard}>
					{photoURL && (
						<>
							<img
								src={photoURL || "/placeholder.svg"}
								alt="User"
								className={styles.userImage}
							/>
							<div className={styles.userInfo}>
								<p className={styles.userEmail}>{email}</p> <br />
								<p className={styles.userName}>
									Hi, {displayName?.toLowerCase()}, let's get you started!
								</p>{" "}
								<br />
								<p className={styles.registrationText}>
									Please set up your account and gain access to USTFU
									HealthLink.
								</p>
							</div>
							<button
								className={styles.signin}
								onClick={() => (window.location.href = "/login")}
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
							<label htmlFor="firstName" className="form-label">
								First Name
							</label>
							<input
								id="firstName"
								type="text"
								className={`form-control ${
									errors.firstName ? "is-invalid" : ""
								}`}
								{...register("firstName")}
								placeholder="Enter first name"
							/>
							{errors.firstName && (
								<p className="invalid-feedback">{errors.firstName.message}</p>
							)}
						</div>
						<div className="mb-3 col-md-3">
							<label htmlFor="lastName" className="form-label">
								Last Name
							</label>
							<input
								id="lastName"
								type="text"
								className={`form-control ${
									errors.lastName ? "is-invalid" : ""
								}`}
								{...register("lastName")}
								placeholder="Enter last name"
							/>
							{errors.lastName && (
								<p className="invalid-feedback">{errors.lastName.message}</p>
							)}
						</div>
						<div className="mb-3 col-md-3">
							<label htmlFor="middleName" className="form-label">
								Middle Name
							</label>
							<input
								id="middleName"
								type="text"
								className={`form-control ${
									errors.middleName ? "is-invalid" : ""
								}`}
								{...register("middleName")}
								placeholder="Enter middle name"
							/>
							{errors.middleName && (
								<p className="invalid-feedback">{errors.middleName.message}</p>
							)}
						</div>
						<div className="mb-3 col-md-3">
							<label htmlFor="suffix" className="form-label">
								Suffix
							</label>
							<select
								id="suffix"
								className={`form-select ${errors.suffix ? "is-invalid" : ""}`}
								{...register("suffix")}
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
								<p className="invalid-feedback">{errors.suffix.message}</p>
							)}
						</div>
					</div>
					<div className="row">
						<div className="mb-3 col-md-3">
							<label htmlFor="idNumber" className="form-label">
								ID Number
							</label>
							<input
								id="idNumber"
								type="text"
								className={`form-control ${
									errors.idNumber ? "is-invalid" : ""
								}`}
								{...register("idNumber")}
								placeholder="YYYY-XXXXXX"
								onChange={formatIDNumber}
							/>
							{errors.idNumber && (
								<p className="invalid-feedback">{errors.idNumber.message}</p>
							)}
						</div>
						<div className="mb-3 col-md-3">
							<label htmlFor="birthdate" className="form-label">
								Birthdate
							</label>
							<input
								id="birthdate"
								type="text"
								className={`form-control ${
									errors.birthdate ? "is-invalid" : ""
								}`}
								{...register("birthdate")}
								placeholder="MM/DD/YYYY"
								onChange={formatBirthdate}
							/>
							{errors.birthdate && (
								<p className="invalid-feedback">{errors.birthdate.message}</p>
							)}
						</div>
						<div className="mb-3 col-md-3">
							<label htmlFor="gender" className="form-label">
								Gender
							</label>
							<select
								id="gender"
								className={`form-select ${errors.gender ? "is-invalid" : ""}`}
								{...register("gender")}
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
								<p className="invalid-feedback">{errors.gender.message}</p>
							)}
						</div>
						<div className="mb-3 col-md-3">
							<label htmlFor="phoneNumber" className="form-label">
								Phone Number
							</label>
							<input
								id="phoneNumber"
								type="text"
								className={`form-control ${
									errors.phoneNumber ? "is-invalid" : ""
								}`}
								{...register("phoneNumber")}
								placeholder="63XXXXXXXXX"
								maxLength={12}
							/>
							{errors.phoneNumber && (
								<p className="invalid-feedback">{errors.phoneNumber.message}</p>
							)}
						</div>
					</div>
					<div className="row">
						<div className="mb-3 col-md-3">
							<label htmlFor="term" className="form-label">
								Term
							</label>
							<select
								id="term"
								className={`form-select ${errors.term ? "is-invalid" : ""}`}
								{...register("term")}
							>
								<option value="" disabled selected hidden>
									Select term
								</option>
								{termOptions.map((option, index) => (
									<option key={index} value={option}>
										{option}
									</option>
								))}
							</select>
							{errors.term && (
								<p className="invalid-feedback">{errors.term.message}</p>
							)}
						</div>
						<div className="mb-3 col-md-3">
							<label htmlFor="year" className="form-label">
								Year
							</label>
							<select
								id="year"
								className={`form-select ${errors.year ? "is-invalid" : ""}`}
								{...register("year")}
							>
								<option value="" disabled selected hidden>
									Select year
								</option>
								{yearOptions.map((option, index) => (
									<option key={index} value={option}>
										{option}
									</option>
								))}
							</select>
							{errors.year && (
								<p className="invalid-feedback">{errors.year.message}</p>
							)}
						</div>
						<div className="mb-3 col-md-3">
							<label htmlFor="load" className="form-label">
								Load
							</label>
							<input
								id="load"
								type="text"
								className={`form-control ${errors.load ? "is-invalid" : ""}`}
								{...register("load")}
								placeholder="Enter Units"
							/>
							{errors.load && (
								<p className="invalid-feedback">{errors.load.message}</p>
							)}
						</div>
						<div className="mb-3 col-md-3">
							<label htmlFor="status" className="form-label">
								Status
							</label>
							<select
								id="status"
								className={`form-select ${errors.status ? "is-invalid" : ""}`}
								{...register("status")}
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
								<p className="invalid-feedback">{errors.status.message}</p>
							)}
						</div>
					</div>
					<div className="row">
						<div className="mb-3 col-md-6">
							<label htmlFor="address" className="form-label">
								Address
							</label>
							<input
								id="address"
								type="text"
								className={`form-control ${errors.address ? "is-invalid" : ""}`}
								{...register("address")}
								placeholder="Enter address"
							/>
							{errors.address && (
								<p className="invalid-feedback">{errors.address.message}</p>
							)}
						</div>
						<div className="mb-3 col-md-3">
							<label htmlFor="dateHired" className="form-label">
								Date Hired
							</label>
							<input
								id="dateHired"
								type="text"
								className={`form-control ${
									errors.dateHired ? "is-invalid" : ""
								}`}
								{...register("dateHired")}
								placeholder="MM/DD/YYYY"
								onChange={formatBirthdate}
							/>
							{errors.dateHired && (
								<p className="invalid-feedback">{errors.dateHired.message}</p>
							)}
						</div>
						<div className="mb-3 col-md-3">
							<label htmlFor="dateRetired" className="form-label">
								Date Retired
							</label>
							<input
								id="dateRetired"
								type="text"
								className={`form-control ${
									errors.dateRetired ? "is-invalid" : ""
								}`}
								{...register("dateRetired")}
								placeholder="MM/DD/YYYY"
								onChange={formatBirthdate}
							/>
							{errors.dateRetired && (
								<p className="invalid-feedback">{errors.dateRetired.message}</p>
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
	);
};

export default RegistrationPage;
function setError(arg0: string) {
	throw new Error("Function not implemented.");
}
