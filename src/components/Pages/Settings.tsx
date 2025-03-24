import React, { useState, useEffect } from "react";
import styles from "./Settings.module.css";
import "./Settings.css"; // Add this import for the loading skeleton styles
import Popout from "../Page Elements/Popout/Popout";
import { useFirebase } from "../../contexts/firebaseContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";

const suffixOptions = ["", "Sr.", "Jr.", "II", "III", "IV", "MD", "PhD"];
const genderOptions = ["Male", "Female", "Other"];
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

const statusOptions = [
	"Tenured",
	"Tenured-Track",
	"Lecturer Before 2001",
	"Extendee",
	"Retiree",
];

const termOptions = ["1st", "2nd", "Su"];
const currentAcademicYear = `${
	new Date().getFullYear() - 1
}-${new Date().getFullYear()}`;
const currentTerm =
	termOptions[
		new Date().getMonth() >= 7 ? 0 : new Date().getMonth() <= 4 ? 1 : 2
	];

const getAcademicYears = () => {
	const currentYear = new Date().getFullYear();
	return [
		`${currentYear - 1}-${currentYear}`,
		`${currentYear}-${currentYear + 1}`,
	];
};

getAcademicYears();

// Helper function to calculate age based on birthdate string (format: MM/DD/YYYY)
const calculateAge = (birthdateStr: string): string => {
	if (!birthdateStr) return "";

	// Parse the birthdate string
	const parts = birthdateStr.split("/");
	if (parts.length !== 3) return "";

	const birthMonth = parseInt(parts[0], 10);
	const birthDay = parseInt(parts[1], 10);
	const birthYear = parseInt(parts[2], 10);

	if (isNaN(birthMonth) || isNaN(birthDay) || isNaN(birthYear)) return "";

	const birthDate = new Date(birthYear, birthMonth - 1, birthDay);
	const today = new Date();

	let age = today.getFullYear() - birthDate.getFullYear();

	// Adjust age if birthday hasn't occurred yet this year
	const monthDiff = today.getMonth() - birthDate.getMonth();
	if (
		monthDiff < 0 ||
		(monthDiff === 0 && today.getDate() < birthDate.getDate())
	) {
		age--;
	}

	return age.toString();
};

// Updated auto-format function to ensure valid date values for mm/dd/yyyy format
const formatDateInput = (value: string): string => {
	const cleaned = value.replace(/\D/g, "");
	let formatted = "";
	if (cleaned.length > 0) {
		let month = parseInt(cleaned.substring(0, 2), 10);
		if (isNaN(month) || month < 1) month = 1;
		if (month > 12) month = 12;
		formatted += month < 10 ? "0" + month : month.toString();
	}
	if (cleaned.length >= 3) {
		let day = parseInt(cleaned.substring(2, 4), 10);
		if (isNaN(day) || day < 1) day = 1;
		if (day > 31) day = 31;
		formatted += "/" + (day < 10 ? "0" + day : day.toString());
	}
	if (cleaned.length >= 5) {
		const year = cleaned.substring(4, 8);
		formatted += "/" + year;
	}
	return formatted;
};

// Updated processDateField to only clamp when the date is complete (mm/dd/yyyy)
const processDateField = (value: string): string => {
	const formatted = formatDateInput(value);
	// Only process when date is complete (10 characters: mm/dd/yyyy)
	if (formatted.length === 10) {
		const parts = formatted.split("/");
		const month = parseInt(parts[0], 10);
		const day = parseInt(parts[1], 10);
		const year = parseInt(parts[2], 10);
		const inputDate = new Date(year, month - 1, day);
		const today = new Date();
		// If the input date is in the future, clamp it to today's date.
		if (inputDate > today) {
			const m = today.getMonth() + 1;
			const d = today.getDate();
			const y = today.getFullYear();
			const mm = m < 10 ? "0" + m : m.toString();
			const dd = d < 10 ? "0" + d : d.toString();
			return mm + "/" + dd + "/" + y;
		}
	}
	return formatted;
};

// >>> Added formatting helper functions (based on your RegistrationPage)
const formatBirthdate = (value: string): string => {
	const digits = value.replace(/\D/g, "").slice(0, 8);
	return digits.length >= 5
		? `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
		: digits;
};

const formatIDNumber = (value: string): string => {
	const digits = value.replace(/\D/g, "").slice(0, 10);
	return digits.length > 4
		? `${digits.slice(0, 4)}-${digits.slice(4)}`
		: digits;
};

const Settings = () => {
	const [settings, setSettings] = useState({
		// User profile fields with safe defaults
		firstname: "",
		lastname: "",
		middlename: "",
		suffix: "",
		term: "",
		year: "",
		load: "",
		status: "",
		numberID: "",
		address: "",
		dateHired: "",
		dateRetired: "",
		birthdate: "",
		phoneNumber: "",
		gender: "",
		college: "",
		// Toggles - fixed naming to match database
		notification: false,
		autofill: false,
	});

	// Original settings to compare against for detecting changes
	const [originalSettings, setOriginalSettings] = useState({});

	// Computed age state
	const [calculatedAge, setCalculatedAge] = useState("");

	// Track which fields have changed
	const [changedFields, setChangedFields] = useState<
		Record<string, { old: string; new: string }>
	>({});

	const [isConfirmOpen, setIsConfirmOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isSaving, setIsSaving] = useState(false);
	const [phoneInputValue, setPhoneInputValue] = useState<string>("+63");
	const [isPhoneFocused, setIsPhoneFocused] = useState<boolean>(false);

	// Get Firebase context
	const { db, currentUser, uid } = useFirebase();

	// Update age whenever birthdate changes
	useEffect(() => {
		setCalculatedAge(calculateAge(settings.birthdate));
	}, [settings.birthdate]);

	// Fetch user data from Firestore
	useEffect(() => {
		const fetchUserData = async () => {
			if (!uid) {
				setIsLoading(false);
				return;
			}

			try {
				setIsLoading(true);
				const userDocRef = doc(db, "users", uid);
				const userDoc = await getDoc(userDocRef);

				if (userDoc.exists()) {
					const userData = userDoc.data();
					const personalInfo = userData.personalInfo || {};

					// Add console log to debug the structure
					console.log(
						"Full user data structure:",
						JSON.stringify(userData, null, 2)
					);

					// Set settings with nested fields from personalInfo
					const updatedSettings = {
						firstname: personalInfo.firstName || "",
						lastname: personalInfo.lastName || "",
						middlename: personalInfo.middleName || "",
						suffix: personalInfo.suffix || "",
						term: personalInfo.term || "",
						year: personalInfo.year || "",
						load: personalInfo.load || "",
						status: personalInfo.status || "",
						numberID: personalInfo.idNumber || "",
						address: personalInfo.address || "",
						dateHired: personalInfo.dateHired || "",
						dateRetired: personalInfo.dateRetired || "",
						birthdate: personalInfo.birthdate || "",
						phoneNumber: personalInfo.phoneNumber || "",
						gender: personalInfo.gender || "",
						college: personalInfo.college || "",
						notification:
							userData.notification !== undefined
								? userData.notification
								: userData.settings?.notification !== undefined
								? userData.settings.notification
								: false,
						autofill:
							userData.autofill !== undefined
								? userData.autofill
								: userData.settings?.autofill !== undefined
								? userData.settings.autofill
								: false,
					};

					setSettings(updatedSettings);
					setOriginalSettings({ ...updatedSettings }); // Store original values for comparison
					setCalculatedAge(
						calculateAge(personalInfo.birthdate || "")
					);
					setChangedFields({}); // Reset changed fields when loading new data

					console.log("Fetched user data:", userData);
					console.log("Personal info:", personalInfo);
				} else {
					console.log("No such document!");
				}
			} catch (err) {
				console.error("Error fetching user data:", err);
				setError(
					"Failed to load your profile data. Please try again later."
				);
			} finally {
				setIsLoading(false);
			}
		};

		fetchUserData();
	}, [db, uid]);

	const handleFieldBlur = async (
		field: string,
		e: React.FocusEvent<HTMLDivElement>
	) => {
		const newValue = e.currentTarget.innerText;

		// Only track changes that differ from original
		if (newValue !== (originalSettings as any)[field]) {
			setChangedFields((prev) => ({
				...prev,
				[field]: {
					old: (originalSettings as any)[field] || "",
					new: newValue,
				},
			}));
		} else {
			// Remove from changed fields if it matches original
			const updatedChanges = { ...changedFields };
			delete updatedChanges[field];
			setChangedFields(updatedChanges);
		}

		setSettings({ ...settings, [field]: newValue });
	};

	// Handle toggle changes and track them properly
	const handleToggleChange = async (field: string, checked: boolean) => {
		// Track the change for the summary popup
		if (checked !== (originalSettings as any)[field]) {
			setChangedFields((prev) => ({
				...prev,
				[field]: {
					old: (originalSettings as any)[field] ? "true" : "false",
					new: checked ? "true" : "false",
				},
			}));
		} else {
			// Remove from changed fields if it matches original
			const updatedChanges = { ...changedFields };
			delete updatedChanges[field];
			setChangedFields(updatedChanges);
		}
		// Update the settings state
		setSettings({ ...settings, [field]: checked });
	};

	const handleFieldChange = (field: string, value: string) => {
		// Track the change for the summary popup
		if (value !== (originalSettings as any)[field]) {
			setChangedFields((prev) => ({
				...prev,
				[field]: {
					old: (originalSettings as any)[field] || "",
					new: value,
				},
			}));
		} else {
			// Remove from changed fields if it matches original
			const updatedChanges = { ...changedFields };
			delete updatedChanges[field];
			setChangedFields(updatedChanges);
		}
		// Update the settings state
		setSettings({ ...settings, [field]: value });
	};

	// Generate a summary of changes for the popup
	const generateChangeSummary = () => {
		if (Object.keys(changedFields).length === 0) {
			return "No changes detected.";
		}

		// Map field names to more readable labels
		const fieldLabels: Record<string, string> = {
			firstname: "First Name",
			lastname: "Last Name",
			middlename: "Middle Name",
			suffix: "Suffix",
			term: "Term",
			year: "Year",
			load: "Load",
			status: "Status",
			numberID: "ID Number",
			address: "Address",
			dateHired: "Date Hired",
			dateRetired: "Date Retired",
			birthdate: "Birthdate",
			phoneNumber: "Phone Number",
			gender: "Gender",
			college: "College",
			notification: "Email Notifications",
			autofill: "Auto-fill Information",
		};

		return (
			<div className={styles.changesSummary}>
				<p>You've made the following changes:</p>
				<ul>
					{Object.entries(changedFields).map(([field, values]) => (
						<li key={field}>
							<strong>{fieldLabels[field] || field}:</strong>
							<span className={styles.oldValue}>
								{values.old || "(empty)"}
							</span>{" "}
							→{" "}
							<span className={styles.newValue}>
								{values.new || "(empty)"}
							</span>
						</li>
					))}
				</ul>
			</div>
		);
	};

	const handleConfirmSave = async () => {
		// Update phone validation to check for proper length, not prefix
		if (settings.phoneNumber.length < 10) {
			setError("Please enter a valid phone number");
			return;
		}
		if (!uid) {
			setError("You must be logged in to save changes.");
			setIsConfirmOpen(false);
			return;
		}

		try {
			setIsSaving(true);
			const userDocRef = doc(db, "users", uid);

			// Create the update object with the correct structure
			const updateData: Record<string, any> = {};

			// Map settings fields directly to their counterparts in personalInfo
			const fieldMappings: Record<string, string> = {
				firstname: "firstName",
				lastname: "lastName",
				middlename: "middleName",
				suffix: "suffix",
				term: "term",
				year: "year",
				load: "load",
				status: "status",
				numberID: "idNumber",
				address: "address",
				dateHired: "dateHired",
				dateRetired: "dateRetired",
				birthdate: "birthdate",
				phoneNumber: "phoneNumber",
				gender: "gender",
			};

			// Check each field against the original value
			for (const [settingKey, firestoreKey] of Object.entries(
				fieldMappings
			)) {
				if (
					settings[settingKey as keyof typeof settings] !==
					(originalSettings as any)[settingKey]
				) {
					updateData[`personalInfo.${firestoreKey}`] =
						settings[settingKey as keyof typeof settings];
				}
			}

			// Handle top-level fields
			if (settings.college !== (originalSettings as any).college) {
				updateData["personalInfo.college"] = settings.college; // Changed from updateData.college
			}

			// Fix the path for notification and autofill - check both possible locations
			const userDoc = await getDoc(userDocRef);
			const userData = userDoc.exists() ? userDoc.data() : null;

			// Determine where notification and autofill should be saved based on current structure
			const hasSettingsObject =
				userData && userData.settings !== undefined;

			if (
				settings.notification !== (originalSettings as any).notification
			) {
				if (hasSettingsObject) {
					updateData["settings.notification"] = settings.notification;
				} else {
					updateData.notification = settings.notification;
				}
			}

			if (settings.autofill !== (originalSettings as any).autofill) {
				if (hasSettingsObject) {
					updateData["settings.autofill"] = settings.autofill;
				} else {
					updateData.autofill = settings.autofill;
				}
			}

			if (Object.keys(updateData).length === 0) {
				console.log("No changes detected. Skipping Firestore update.");
				setIsConfirmOpen(false);
				setIsSaving(false);
				return;
			}

			console.log("🔄 Saving changes to Firestore:", updateData);

			// Update the document with the correct structure
			await updateDoc(userDocRef, updateData);

			console.log("Settings saved successfully");

			// Update originalSettings to match the newly saved settings
			setOriginalSettings({ ...settings });

			// Clear the changedFields since we've saved successfully
			setChangedFields({});
		} catch (err) {
			console.error("Error saving settings:", err);
			setError("Failed to save your changes. Please try again.");
		} finally {
			setIsSaving(false);
			setIsConfirmOpen(false);
		}
	};

	// Add these phone formatting functions
	const formatPhoneNumberDisplay = (value: string) => {
		// Make sure value starts with +63
		if (!value.startsWith("+63")) {
			value = "+63" + value;
		}

		// Format for display (e.g., +63-XXX-XXX-XXXX)
		let formattedValue = value;

		// If more than +63 is present, format with hyphens
		if (value.length > 3) {
			const mainNumber = value.substring(3); // get everything after +63

			let formatted = mainNumber.replace(
				/(\d{3})(\d{3})(\d+)/,
				"$1-$2-$3"
			);
			formattedValue = "+63-" + formatted;
		}

		setPhoneInputValue(formattedValue);
	};

	const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		let value = e.target.value;

		// Ensure it always starts with +63
		if (!value.startsWith("+63")) {
			if (value.startsWith("+")) {
				value = "+63" + value.substring(1);
			} else {
				value = "+63" + value;
			}
		}

		// Remove non-digit characters (except the leading +)
		const digitsOnly = "+" + value.substring(1).replace(/\D/g, "");

		setPhoneInputValue(digitsOnly);

		// Update the form value with just the numeric part for backend storage
		if (digitsOnly.length > 3) {
			const phoneWithoutPrefix = digitsOnly.substring(3);
			handleFieldChange("phoneNumber", phoneWithoutPrefix);
		} else {
			handleFieldChange("phoneNumber", "");
		}
	};

	const handlePhoneFocus = () => {
		setIsPhoneFocused(true);
		// Remove formatting when focused, but keep +63
		if (settings.phoneNumber) {
			let rawValue = "+63" + settings.phoneNumber;
			setPhoneInputValue(rawValue);
		} else {
			setPhoneInputValue("+63");
		}
	};

	const handlePhoneBlur = () => {
		setIsPhoneFocused(false);

		// Reapply formatting
		if (phoneInputValue.length > 3) {
			const numericPart = phoneInputValue.substring(3).replace(/\D/g, "");
			if (numericPart) {
				formatPhoneNumberDisplay("+63" + numericPart);
			}
		}
	};

	// Initialize phone input value when data loads
	useEffect(() => {
		if (settings.phoneNumber) {
			formatPhoneNumberDisplay("+63" + settings.phoneNumber);
		}
	}, [settings.phoneNumber]);

	if (isLoading) {
		return (
			<div className={styles.settingsContainer}>
				<div className="loading-container">
					{/* Preferences Section */}
					<div className="loading-section">
						<div className="loading-header skeleton"></div>
						<div className="loading-toggle-row">
							<div className="loading-toggle-label skeleton"></div>
							<div className="loading-toggle skeleton"></div>
						</div>
						<div className="loading-toggle-row">
							<div className="loading-toggle-label skeleton"></div>
							<div className="loading-toggle skeleton"></div>
						</div>
					</div>

					{/* Personal Information Section */}
					<div className="loading-section">
						<div className="loading-header skeleton"></div>

						{/* Name Fields */}
						<div className="loading-form-row">
							{["lg", "lg", "lg", "xs"].map((size, index) => (
								<div
									key={index}
									className={`loading-form-group loading-${size}`}
								>
									<div className="loading-label skeleton"></div>
									<div className="loading-field skeleton"></div>
								</div>
							))}
						</div>

						{/* Personal Details */}
						<div className="loading-form-row">
							{["md", "xs", "sm", "md", "flex"].map(
								(size, index) => (
									<div
										key={index}
										className={`loading-form-group loading-${size}`}
									>
										<div className="loading-label skeleton"></div>
										<div className="loading-field skeleton"></div>
									</div>
								)
							)}
						</div>

						{/* Work Details */}
						<div className="loading-form-row">
							{["xs", "sm", "xs", "md", "md", "flex"].map(
								(size, index) => (
									<div
										key={index}
										className={`loading-form-group loading-${size}`}
									>
										<div className="loading-label skeleton"></div>
										<div className="loading-field skeleton"></div>
									</div>
								)
							)}
						</div>

						{/* College and Address */}
						<div className="loading-form-row">
							{["half", "half"].map((size, index) => (
								<div
									key={index}
									className={`loading-form-group loading-${size}`}
								>
									<div className="loading-label skeleton"></div>
									<div className="loading-field skeleton"></div>
								</div>
							))}
						</div>

						{/* Loading Spinner */}
						<div className="loading-spinner-container">
							<div className="loading-spinner"></div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className={styles.settingsContainer}>
				<div className={styles.errorMessage}>
					<p>{error}</p>
					<button onClick={() => setError(null)}>Dismiss</button>
				</div>
			</div>
		);
	}

	return (
		<div className={styles.settingsContainer}>
			<div className={styles.settingsSection}>
				<h3>Personal Preferences</h3>
				{/* Updated toggle button markup using CSS modules */}
				<div className={styles.toggleGroup}>
					<div className={styles.toggleRow}>
						<p>Email Notifications:</p>
						<div className="form-check">
							<label
								className={`${styles["form-check-label"]} ${styles.formCheckToggle}`}
							>
								<input
									className={styles.formCheckInput}
									type="checkbox"
									checked={settings.notification}
									onChange={(e) =>
										handleToggleChange(
											"notification",
											e.target.checked
										)
									}
									aria-label="toggle notifications"
								/>
								<span></span>
							</label>
						</div>
					</div>
					<div className={styles.toggleRow}>
						<p>Auto-fill Information:</p>
						<div className="form-check">
							<label
								className={`${styles["form-check-label"]} ${styles.formCheckToggle}`}
							>
								<input
									className={styles.formCheckInput}
									type="checkbox"
									checked={settings.autofill}
									onChange={(e) =>
										handleToggleChange(
											"autofill",
											e.target.checked
										)
									}
									aria-label="toggle autofill"
								/>
								<span></span>
							</label>
						</div>
					</div>
				</div>
			</div>

			<div className={styles.settingsSection}>
				<h3>Personal Information</h3>

				{/* Row 1: Name fields */}
				<div className={styles.formRow}>
					<div className={styles.formGroupLg}>
						<label>First Name</label>
						<input
							type="text"
							className="form-control settings-field-value"
							value={settings.firstname}
							onChange={(e) =>
								handleFieldChange("firstname", e.target.value)
							}
							aria-label="First Name"
						/>
					</div>
					<div className={styles.formGroupLg}>
						<label>Last Name</label>
						<input
							type="text"
							className="form-control settings-field-value"
							value={settings.lastname}
							onChange={(e) =>
								handleFieldChange("lastname", e.target.value)
							}
							aria-label="Last-Name"
						/>
					</div>
					<div className={styles.formGroupLg}>
						<label>Middle Name</label>
						<input
							type="text"
							className="form-control settings-field-value"
							value={settings.middlename}
							onChange={(e) =>
								handleFieldChange("middlename", e.target.value)
							}
							aria-label="Middle Name"
						/>
					</div>
					<div className={styles.formGroupXs}>
						<label>Suffix</label>
						<select
							className="form-select settings-field-value"
							value={settings.suffix}
							onChange={(e) =>
								handleFieldChange("suffix", e.target.value)
							}
							aria-label="Suffix"
						>
							<option value="" disabled hidden>
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

				{/* Row 2: Personal details */}
				<div className={styles.formRow}>
					<div className={styles.formGroupMd}>
						<label>Birthdate</label>
						<input
							type="text"
							className="form-control settings-field-value"
							value={settings.birthdate}
							onChange={(e) =>
								handleFieldChange(
									"birthdate",
									formatBirthdate(e.target.value)
								)
							}
							aria-label="Birthdate"
						/>
					</div>
					<div className={styles.formGroupXs}>
						<label>Age</label>
						<div
							className={`${styles.settingsFieldValue} ${styles.nonEditable}`}
						>
							{calculatedAge || "N/A"}
						</div>
					</div>
					<div className={styles.formGroupSm}>
						<label>Gender</label>
						<select
							className="form-select settings-field-value"
							value={settings.gender}
							onChange={(e) =>
								handleFieldChange("gender", e.target.value)
							}
							aria-label="Gender"
						>
							<option value="" disabled hidden>
								Select gender
							</option>
							{genderOptions.map((option, index) => (
								<option key={index} value={option}>
									{option}
								</option>
							))}
						</select>
					</div>
					<div className={styles.formGroupMd}>
						<label>Phone Number</label>
						<input
							type="text"
							className="form-control settings-field-value"
							value={phoneInputValue}
							onChange={handlePhoneChange}
							onFocus={handlePhoneFocus}
							onBlur={handlePhoneBlur}
							aria-label="Phone Number"
						/>
					</div>
					<div className={styles.formGroupFlex}>
						<label>ID Number</label>
						<input
							type="text"
							className="form-control settings-field-value"
							value={settings.numberID}
							onChange={(e) =>
								handleFieldChange(
									"numberID",
									formatIDNumber(e.target.value)
								)
							}
							aria-label="ID Number"
						/>
					</div>
				</div>

				{/* Row 3: Work details */}
				<div className={styles.formRow}>
					<div className={styles.formGroupXs}>
						<label>Term</label>
						<div
							className={`${styles.settingsFieldValue} ${styles.nonEditable}`}
						>
							{currentTerm}
						</div>
					</div>
					<div className={styles.formGroupSm}>
						<label>Year</label>
						<div
							className={`${styles.settingsFieldValue} ${styles.nonEditable}`}
						>
							{currentAcademicYear}
						</div>
					</div>
					<div className={styles.formGroupXs}>
						<label>Load</label>
						<input
							type="text"
							className="form-control settings-field-value"
							value={settings.load}
							onChange={(e) =>
								handleFieldChange("load", e.target.value)
							}
							aria-label="Load (Units)"
						/>
					</div>
					<div className={styles.formGroupMd}>
						<label>Status</label>
						<select
							className="form-select settings-field-value"
							value={settings.status}
							onChange={(e) =>
								handleFieldChange("status", e.target.value)
							}
							aria-label="Status"
						>
							<option value="" disabled hidden>
								Select status
							</option>
							{statusOptions.map((option, index) => (
								<option key={index} value={option}>
									{option}
								</option>
							))}
						</select>
					</div>
					<div className={styles.formGroupMd}>
						<label>Date Hired</label>
						<input
							type="text"
							placeholder="mm/dd/yyyy"
							className="form-control settings-field-value"
							value={settings.dateHired}
							onChange={(e) =>
								handleFieldChange(
									"dateHired",
									formatBirthdate(e.target.value)
								)
							}
						/>
					</div>
					<div className={styles.formGroupFlex}>
						<label>Date Retired</label>
						<input
							type="text"
							placeholder="mm/dd/yyyy"
							className="form-control settings-field-value"
							value={settings.dateRetired}
							onChange={(e) =>
								handleFieldChange(
									"dateRetired",
									formatBirthdate(e.target.value)
								)
							}
						/>
					</div>
				</div>

				{/* Row 4: College and address */}
				<div className={styles.formRow}>
					<div className={styles.formGroupHalf}>
						<label>College</label>
						<select
							className="form-select settings-field-value"
							value={settings.college}
							onChange={(e) =>
								handleFieldChange("college", e.target.value)
							}
							aria-label="College Affiliation"
						>
							<option value="" disabled hidden>
								Select college affiliation
							</option>
							{collegeOptions.map((option, index) => (
								<option key={index} value={option}>
									{option}
								</option>
							))}
						</select>
					</div>
					<div className={styles.formGroupHalf}>
						<label>Address</label>
						<input
							type="text"
							className="form-control settings-field-value"
							value={settings.address}
							onChange={(e) =>
								handleFieldChange("address", e.target.value)
							}
							aria-label="Home Address"
						/>
					</div>
				</div>

				<div className={styles.buttonDiv}>
					<button
						onClick={() => setIsConfirmOpen(true)}
						className={styles.settingsBtnSubmit}
						disabled={
							isLoading ||
							isSaving ||
							Object.keys(changedFields).length === 0
						}
					>
						{isSaving ? "Saving..." : "Save Changes"}
					</button>
				</div>
			</div>

			{isConfirmOpen && (
				<Popout
					title="Confirm Changes"
					message={generateChangeSummary()}
					onConfirm={handleConfirmSave}
					onCancel={() => setIsConfirmOpen(false)}
					isOpen={isConfirmOpen}
				/>
			)}
		</div>
	);
};

export default Settings;
