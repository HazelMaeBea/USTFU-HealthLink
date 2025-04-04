import React, { useState, useEffect } from "react";
import styles from "./Settings.module.css";
import Popout from "../../Page Elements/Popout/Popout";
import { useFirebase } from "../../../contexts/firebaseContext";
import { doc, getDoc, updateDoc, FieldValue } from "firebase/firestore";

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

const calculateAge = (birthdateStr: string): string => {
	if (!birthdateStr) return "";

	const parts = birthdateStr.split("/");
	if (parts.length !== 3) return "";

	const birthMonth = parseInt(parts[0], 10);
	const birthDay = parseInt(parts[1], 10);
	const birthYear = parseInt(parts[2], 10);

	if (isNaN(birthMonth) || isNaN(birthDay) || isNaN(birthYear)) return "";

	const birthDate = new Date(birthYear, birthMonth - 1, birthDay);
	const today = new Date();

	let age = today.getFullYear() - birthDate.getFullYear();

	const monthDiff = today.getMonth() - birthDate.getMonth();
	if (
		monthDiff < 0 ||
		(monthDiff === 0 && today.getDate() < birthDate.getDate())
	) {
		age--;
	}

	return age.toString();
};

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

// Define type for Firestore compatible field values
type FirestoreFieldValue = string | number | boolean | null | FieldValue;

const Settings = () => {
	const [settings, setSettings] = useState({
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
		notification: false,
		autofill: false,
	});

	type SettingsType = typeof settings;

	const [originalSettings, setOriginalSettings] = useState<SettingsType>(
		{} as SettingsType
	);
	const [calculatedAge, setCalculatedAge] = useState("");
	const [changedFields, setChangedFields] = useState<
		Record<string, { old: string; new: string }>
	>({});
	const [isConfirmOpen, setIsConfirmOpen] = useState(false);
	const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isSaving, setIsSaving] = useState(false);
	const [phoneInputValue, setPhoneInputValue] = useState<string>("+63");

	const { db, uid } = useFirebase();

	const formatPhoneNumberDisplay = (value: string) => {
		if (!value.startsWith("+63")) {
			value = "+63" + value;
		}

		let formattedValue = value;

		// Improve regex to handle various input lengths properly
		if (value.length > 3) {
			const mainNumber = value.substring(3);

			// Use more robust regex that works with different number lengths
			const formatted = mainNumber.replace(
				/^(\d{3})(\d{3})?(\d+)?$/,
				(_, p1, p2, p3) => {
					let result = p1;
					if (p2) result += "-" + p2;
					if (p3) result += "-" + p3;
					return result;
				}
			);

			formattedValue = "+63-" + formatted;
		}

		setPhoneInputValue(formattedValue);
		return formattedValue;
	};

	useEffect(() => {
		setCalculatedAge(calculateAge(settings.birthdate));
	}, [settings.birthdate]);

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

				const updatedSettings: SettingsType = {
					firstname: "",
					lastname: "",
					middlename: "",
					suffix: "",
					term: currentTerm || "",
					year: currentAcademicYear || "",
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
					notification: false,
					autofill: false,
				};

				if (userDoc.exists()) {
					const userData = userDoc.data();
					const personalInfo = userData.personalInfo || {};

					if (personalInfo.firstName)
						updatedSettings.firstname = personalInfo.firstName;
					if (personalInfo.lastName)
						updatedSettings.lastname = personalInfo.lastName;
					if (personalInfo.middleName)
						updatedSettings.middlename = personalInfo.middleName;
					if (personalInfo.suffix)
						updatedSettings.suffix = personalInfo.suffix;
					if (personalInfo.term)
						updatedSettings.term = personalInfo.term;
					if (personalInfo.year)
						updatedSettings.year = personalInfo.year;
					if (personalInfo.load)
						updatedSettings.load = personalInfo.load;
					if (personalInfo.status)
						updatedSettings.status = personalInfo.status;
					if (personalInfo.idNumber)
						updatedSettings.numberID = personalInfo.idNumber;
					if (personalInfo.address)
						updatedSettings.address = personalInfo.address;
					if (personalInfo.dateHired)
						updatedSettings.dateHired = personalInfo.dateHired;
					if (personalInfo.dateRetired)
						updatedSettings.dateRetired = personalInfo.dateRetired;
					if (personalInfo.birthdate)
						updatedSettings.birthdate = personalInfo.birthdate;
					if (personalInfo.phoneNumber)
						updatedSettings.phoneNumber = personalInfo.phoneNumber;
					if (personalInfo.gender)
						updatedSettings.gender = personalInfo.gender;
					if (personalInfo.college)
						updatedSettings.college = personalInfo.college;

					updatedSettings.notification =
						userData.notification !== undefined
							? userData.notification
							: userData.settings?.notification !== undefined
							? userData.settings.notification
							: false;

					updatedSettings.autofill =
						userData.autofill !== undefined
							? userData.autofill
							: userData.settings?.autofill !== undefined
							? userData.settings.autofill
							: false;
				} else {
					console.log("No such document, using default empty fields");
				}

				setSettings(updatedSettings);
				setOriginalSettings({ ...updatedSettings });
				setCalculatedAge(calculateAge(updatedSettings.birthdate));
				setChangedFields({});

				if (updatedSettings.phoneNumber) {
					formatPhoneNumberDisplay(
						"+63" + updatedSettings.phoneNumber
					);
				} else {
					setPhoneInputValue("+63");
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

	const handleToggleChange = async (field: string, checked: boolean) => {
		try {
			if (!uid) {
				console.error("User ID is missing. Cannot update Firestore.");
				return;
			}

			setSettings((prev) => ({ ...prev, [field]: checked }));

			if (field === "notification" || field === "autofill") {
				const userDocRef = doc(db, "users", uid);

				const userDoc = await getDoc(userDocRef);
				const userData = userDoc.exists() ? userDoc.data() : null;
				const hasSettingsObject =
					userData && userData.settings !== undefined;

				const updateData: Record<string, FirestoreFieldValue> =
					hasSettingsObject
						? { [`settings.${field}`]: checked }
						: { [field]: checked };

				await updateDoc(userDocRef, updateData);

				console.log(
					`✅ ${field} toggled to ${checked} and saved to Firestore.`
				);
			}
		} catch (error) {
			console.error(`❌ Failed to update ${field}:`, error);
		}
	};

	const handleFieldChange = (field: keyof SettingsType, value: string) => {
		if (value !== originalSettings[field]) {
			setChangedFields((prev) => ({
				...prev,
				[field]: {
					old: originalSettings[field]?.toString() || "",
					new: value,
				},
			}));
		} else {
			const updatedChanges = { ...changedFields };
			delete updatedChanges[field];
			setChangedFields(updatedChanges);
		}
		setSettings({ ...settings, [field]: value });
	};

	const handleCancelClick = () => {
		if (Object.keys(changedFields).length > 0) {
			setIsCancelConfirmOpen(true);
		}
	};

	const handleCancel = () => {
		setSettings({ ...originalSettings });
		setChangedFields({});

		if (error) {
			setError(null);
		}

		setIsCancelConfirmOpen(false);
	};

	const generateChangeSummary = () => {
		if (Object.keys(changedFields).length === 0) {
			return "No changes detected.";
		}

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

	const generateCancelSummary = () => {
		if (Object.keys(changedFields).length === 0) {
			return "No changes to discard.";
		}

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
				<p>
					You have unsaved changes. Discarding will revert the
					following:
				</p>
				<ul>
					{Object.entries(changedFields).map(([field, values]) => (
						<li key={field}>
							<strong>{fieldLabels[field] || field}:</strong>
							<span className={styles.newValue}>
								{values.new || "(empty)"}
							</span>{" "}
							→{" "}
							<span className={styles.oldValue}>
								{values.old || "(empty)"}
							</span>
						</li>
					))}
				</ul>
			</div>
		);
	};

	const handleConfirmSave = async () => {
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

			const updateData: Record<string, FirestoreFieldValue> = {};

			const fieldMappings: Record<keyof SettingsType, string> = {
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
				college: "college",
				notification: "notification",
				autofill: "autofill",
			};

			for (const [settingKey, firestoreKey] of Object.entries(
				fieldMappings
			) as [keyof SettingsType, string][]) {
				if (settings[settingKey] !== originalSettings[settingKey]) {
					updateData[`personalInfo.${firestoreKey}`] = settings[
						settingKey
					] as FirestoreFieldValue;
				}
			}

			if (Object.keys(updateData).length === 0) {
				console.log("No changes detected. Skipping Firestore update.");
				setIsConfirmOpen(false);
				setIsSaving(false);
				return;
			}

			console.log("🔄 Saving changes to Firestore:", updateData);

			await updateDoc(userDocRef, updateData);

			console.log("Settings saved successfully");

			setOriginalSettings({ ...settings });

			setChangedFields({});
		} catch (err) {
			console.error("Error saving settings:", err);
			setError("Failed to save your changes. Please try again.");
		} finally {
			setIsSaving(false);
			setIsConfirmOpen(false);
		}
	};

	const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		let value = e.target.value;

		if (!value.startsWith("+63")) {
			if (value.startsWith("+")) {
				value = "+63" + value.substring(1);
			} else {
				value = "+63" + value;
			}
		}

		// Only keep the digits for internal state
		const digitsOnly = "+" + value.substring(1).replace(/\D/g, "");
		setPhoneInputValue(digitsOnly);

		if (digitsOnly.length > 3) {
			const phoneWithoutPrefix = digitsOnly.substring(3);
			handleFieldChange("phoneNumber", phoneWithoutPrefix);
		} else {
			handleFieldChange("phoneNumber", "");
		}
	};

	const handlePhoneFocus = () => {
		if (settings.phoneNumber) {
			const rawValue = "+63" + settings.phoneNumber;
			setPhoneInputValue(rawValue);
		} else {
			setPhoneInputValue("+63");
		}
	};

	const handlePhoneBlur = () => {
		if (phoneInputValue.length > 3) {
			// Extract only the digits from the current phone input value
			const numericPart = phoneInputValue.substring(3).replace(/\D/g, "");

			if (numericPart) {
				// Apply formatting on blur to ensure consistent display
				formatPhoneNumberDisplay("+63" + numericPart);
			}
		}
	};

	if (isLoading) {
		return (
			<div
				className={styles.settingsLoadingContainer}
				data-testid="settings-skeleton-loader"
			>
				<div className={styles.settingsLoadingSection}>
					<div
						className={`${styles.settingsLoadingHeader} ${styles.settingsSkeleton}`}
					></div>
					<div className={styles.settingsLoadingToggleGroup}>
						<div className={styles.settingsLoadingToggleRow}>
							<div
								className={`${styles.settingsLoadingToggleLabel} ${styles.settingsSkeleton}`}
							></div>
							<div
								className={`${styles.settingsLoadingToggle} ${styles.settingsSkeleton}`}
							></div>
						</div>
						<div className={styles.settingsLoadingToggleRow}>
							<div
								className={`${styles.settingsLoadingToggleLabel} ${styles.settingsSkeleton}`}
							></div>
							<div
								className={`${styles.settingsLoadingToggle} ${styles.settingsSkeleton}`}
							></div>
						</div>
					</div>
				</div>

				<div className={styles.settingsLoadingSection}>
					<div
						className={`${styles.settingsLoadingHeader} ${styles.settingsSkeleton}`}
					></div>

					<div className={styles.settingsLoadingFormRow}>
						<div
							className={`${styles.settingsLoadingFormGroup} ${styles.settingsLoadingLg}`}
						>
							<div
								className={`${styles.settingsLoadingLabel} ${styles.settingsSkeleton}`}
							></div>
							<div
								className={`${styles.settingsLoadingField} ${styles.settingsSkeleton}`}
							></div>
						</div>
						<div
							className={`${styles.settingsLoadingFormGroup} ${styles.settingsLoadingLg}`}
						>
							<div
								className={`${styles.settingsLoadingLabel} ${styles.settingsSkeleton}`}
							></div>
							<div
								className={`${styles.settingsLoadingField} ${styles.settingsSkeleton}`}
							></div>
						</div>
						<div
							className={`${styles.settingsLoadingFormGroup} ${styles.settingsLoadingLg}`}
						>
							<div
								className={`${styles.settingsLoadingLabel} ${styles.settingsSkeleton}`}
							></div>
							<div
								className={`${styles.settingsLoadingField} ${styles.settingsSkeleton}`}
							></div>
						</div>
						<div
							className={`${styles.settingsLoadingFormGroup} ${styles.settingsLoadingXs}`}
						>
							<div
								className={`${styles.settingsLoadingLabel} ${styles.settingsSkeleton}`}
							></div>
							<div
								className={`${styles.settingsLoadingField} ${styles.settingsSkeleton}`}
							></div>
						</div>
					</div>

					<div className={styles.settingsLoadingFormRow}>
						<div
							className={`${styles.settingsLoadingFormGroup} ${styles.settingsLoadingMd}`}
						>
							<div
								className={`${styles.settingsLoadingLabel} ${styles.settingsSkeleton}`}
							></div>
							<div
								className={`${styles.settingsLoadingField} ${styles.settingsSkeleton}`}
							></div>
						</div>
						<div
							className={`${styles.settingsLoadingFormGroup} ${styles.settingsLoadingXs}`}
						>
							<div
								className={`${styles.settingsLoadingLabel} ${styles.settingsSkeleton}`}
							></div>
							<div
								className={`${styles.settingsLoadingField} ${styles.settingsSkeleton}`}
							></div>
						</div>
						<div
							className={`${styles.settingsLoadingFormGroup} ${styles.settingsLoadingSm}`}
						>
							<div
								className={`${styles.settingsLoadingLabel} ${styles.settingsSkeleton}`}
							></div>
							<div
								className={`${styles.settingsLoadingField} ${styles.settingsSkeleton}`}
							></div>
						</div>
						<div
							className={`${styles.settingsLoadingFormGroup} ${styles.settingsLoadingMd}`}
						>
							<div
								className={`${styles.settingsLoadingLabel} ${styles.settingsSkeleton}`}
							></div>
							<div
								className={`${styles.settingsLoadingField} ${styles.settingsSkeleton}`}
							></div>
						</div>
						<div
							className={`${styles.settingsLoadingFormGroup} ${styles.settingsLoadingFlex}`}
						>
							<div
								className={`${styles.settingsLoadingLabel} ${styles.settingsSkeleton}`}
							></div>
							<div
								className={`${styles.settingsLoadingField} ${styles.settingsSkeleton}`}
							></div>
						</div>
					</div>

					<div className={styles.settingsLoadingFormRow}>
						<div
							className={`${styles.settingsLoadingFormGroup} ${styles.settingsLoadingXs}`}
						>
							<div
								className={`${styles.settingsLoadingLabel} ${styles.settingsSkeleton}`}
							></div>
							<div
								className={`${styles.settingsLoadingField} ${styles.settingsSkeleton}`}
							></div>
						</div>
						<div
							className={`${styles.settingsLoadingFormGroup} ${styles.settingsLoadingSm}`}
						>
							<div
								className={`${styles.settingsLoadingLabel} ${styles.settingsSkeleton}`}
							></div>
							<div
								className={`${styles.settingsLoadingField} ${styles.settingsSkeleton}`}
							></div>
						</div>
						<div
							className={`${styles.settingsLoadingFormGroup} ${styles.settingsLoadingXs}`}
						>
							<div
								className={`${styles.settingsLoadingLabel} ${styles.settingsSkeleton}`}
							></div>
							<div
								className={`${styles.settingsLoadingField} ${styles.settingsSkeleton}`}
							></div>
						</div>
						<div
							className={`${styles.settingsLoadingFormGroup} ${styles.settingsLoadingMd}`}
						>
							<div
								className={`${styles.settingsLoadingLabel} ${styles.settingsSkeleton}`}
							></div>
							<div
								className={`${styles.settingsLoadingField} ${styles.settingsSkeleton}`}
							></div>
						</div>
						<div
							className={`${styles.settingsLoadingFormGroup} ${styles.settingsLoadingMd}`}
						>
							<div
								className={`${styles.settingsLoadingLabel} ${styles.settingsSkeleton}`}
							></div>
							<div
								className={`${styles.settingsLoadingField} ${styles.settingsSkeleton}`}
							></div>
						</div>
						<div
							className={`${styles.settingsLoadingFormGroup} ${styles.settingsLoadingFlex}`}
						>
							<div
								className={`${styles.settingsLoadingLabel} ${styles.settingsSkeleton}`}
							></div>
							<div
								className={`${styles.settingsLoadingField} ${styles.settingsSkeleton}`}
							></div>
						</div>
					</div>

					<div className={styles.settingsLoadingFormRow}>
						<div
							className={`${styles.settingsLoadingFormGroup} ${styles.settingsLoadingHalf}`}
						>
							<div
								className={`${styles.settingsLoadingLabel} ${styles.settingsSkeleton}`}
							></div>
							<div
								className={`${styles.settingsLoadingField} ${styles.settingsSkeleton}`}
							></div>
						</div>
						<div
							className={`${styles.settingsLoadingFormGroup} ${styles.settingsLoadingHalf}`}
						>
							<div
								className={`${styles.settingsLoadingLabel} ${styles.settingsSkeleton}`}
							></div>
							<div
								className={`${styles.settingsLoadingField} ${styles.settingsSkeleton}`}
							></div>
						</div>
					</div>

					<div
						className={`${styles.settingsLoadingButton} ${styles.settingsSkeleton}`}
					></div>
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
						onClick={handleCancelClick}
						className={styles.settingsBtnCancel}
						disabled={
							isLoading ||
							isSaving ||
							Object.keys(changedFields).length === 0
						}
					>
						Cancel
					</button>
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

			{isCancelConfirmOpen && (
				<Popout
					title="Discard Changes"
					message={generateCancelSummary()}
					onConfirm={handleCancel}
					onCancel={() => setIsCancelConfirmOpen(false)}
					isOpen={isCancelConfirmOpen}
				/>
			)}
		</div>
	);
};

export default Settings;
