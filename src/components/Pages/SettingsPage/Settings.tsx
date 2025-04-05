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

const formatIDNumber = (value: string): string => {
	const digits = value.replace(/\D/g, "").slice(0, 10);
	return digits.length > 4
		? `${digits.slice(0, 4)}-${digits.slice(4)}`
		: digits;
};

const formatDateForPicker = (dateString: string): string => {
	if (!dateString) return "";

	const parts = dateString.split("/");
	if (parts.length !== 3) return "";

	const month = parts[0].padStart(2, "0");
	const day = parts[1].padStart(2, "0");
	const year = parts[2];

	return `${year}-${month}-${day}`;
};

const formatDateFromPicker = (dateString: string): string => {
	if (!dateString) return "";

	try {
		const date = new Date(dateString);
		const month = (date.getMonth() + 1).toString().padStart(2, "0");
		const day = date.getDate().toString().padStart(2, "0");
		const year = date.getFullYear();

		return `${month}/${day}/${year}`;
	} catch (e) {
		return dateString;
	}
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
		ustEmail: "", // Added UST email field
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
	const [validationErrors, setValidationErrors] = useState<
		Record<string, string>
	>({});

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
				setError(
					"User not found or not authenticated. Please sign in again."
				);
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
					ustEmail: "",
					notification: false,
					autofill: false,
				};

				if (userDoc.exists()) {
					const userData = userDoc.data();
					const personalInfo = userData.personalInfo || {};

					// Assign data with null/undefined checks
					updatedSettings.firstname = personalInfo.firstName || "";
					updatedSettings.lastname = personalInfo.lastName || "";
					updatedSettings.middlename = personalInfo.middleName || "";
					updatedSettings.suffix = personalInfo.suffix || "";
					updatedSettings.term =
						personalInfo.term || currentTerm || "";
					updatedSettings.year =
						personalInfo.year || currentAcademicYear || "";
					updatedSettings.load = personalInfo.load || "";
					updatedSettings.status = personalInfo.status || "";
					updatedSettings.numberID = personalInfo.idNumber || "";
					updatedSettings.address = personalInfo.address || "";
					updatedSettings.dateHired = personalInfo.dateHired || "";
					updatedSettings.dateRetired =
						personalInfo.dateRetired || "";
					updatedSettings.birthdate = personalInfo.birthdate || "";
					updatedSettings.phoneNumber =
						personalInfo.phoneNumber || "";
					updatedSettings.gender = personalInfo.gender || "";
					updatedSettings.college = personalInfo.college || "";
					updatedSettings.ustEmail = personalInfo.ustEmail || "";

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
					console.log(
						"User document not found. Using default empty fields."
					);
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
					"Failed to load your profile data. Please try again later or contact support if the problem persists."
				);
			} finally {
				setIsLoading(false);
			}
		};

		fetchUserData();
	}, [db, uid]);

	const validatePhoneNumber = (phone: string): boolean => {
		// Phone number should have at least 10 digits (excluding the +63 prefix)
		return phone.length >= 10;
	};

	// Validate load to ensure it's greater than 0 and less than or equal to 30
	const validateLoad = (load: string): boolean => {
		const loadNum = Number(load);
		return !isNaN(loadNum) && loadNum > 0 && loadNum <= 30;
	};

	// Add a new validation function for required fields
	const validateRequiredFields = (): boolean => {
		const requiredFields: Array<{
			field: keyof SettingsType;
			label: string;
		}> = [
			{ field: "firstname", label: "First Name" },
			{ field: "lastname", label: "Last Name" },
			{ field: "middlename", label: "Middle Name" },
			{ field: "numberID", label: "ID Number" },
			{ field: "birthdate", label: "Birthdate" },
			{ field: "phoneNumber", label: "Phone Number" },
			{ field: "gender", label: "Gender" },
			{ field: "load", label: "Load" },
			{ field: "status", label: "Status" },
			{ field: "college", label: "College" },
			{ field: "address", label: "Address" },
			{ field: "dateHired", label: "Date Hired" },
			{ field: "ustEmail", label: "UST Email" },
		];

		let isValid = true;
		const newValidationErrors: Record<string, string> = {};

		requiredFields.forEach(({ field, label }) => {
			if (!settings[field]) {
				newValidationErrors[field] = `${label} is required`;
				isValid = false;
			}
		});

		// Add any existing validation errors not related to empty fields
		Object.entries(validationErrors).forEach(([field, error]) => {
			if (!newValidationErrors[field] && !error.includes("required")) {
				newValidationErrors[field] = error;
			}
		});

		setValidationErrors(newValidationErrors);
		return isValid;
	};

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
		// Clear any previous validation errors for this field
		if (validationErrors[field]) {
			setValidationErrors((prev) => {
				const updated = { ...prev };
				delete updated[field];
				return updated;
			});
		}

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

	const handleDatePickerChange = (
		e: React.ChangeEvent<HTMLInputElement>,
		field: keyof SettingsType
	) => {
		const formattedDate = formatDateFromPicker(e.target.value);
		handleFieldChange(field, formattedDate);
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
			ustEmail: "UST Email",
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
			ustEmail: "UST Email",
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

	const handleSaveClick = () => {
		// Validate all required fields first
		if (!validateRequiredFields()) {
			return;
		}

		// Validate phone number before showing confirmation
		if (!validatePhoneNumber(settings.phoneNumber)) {
			setValidationErrors((prev) => ({
				...prev,
				phoneNumber: "Please enter a valid phone number",
			}));
			return;
		}

		// Validate load
		if (settings.load && !validateLoad(settings.load)) {
			setValidationErrors((prev) => ({
				...prev,
				load: "Load must be greater than 0 and cannot exceed 30 units",
			}));
			return;
		}

		// Validate UST email format if provided
		if (settings.ustEmail && !settings.ustEmail.endsWith("@ust.edu.ph")) {
			setValidationErrors((prev) => ({
				...prev,
				ustEmail:
					"Email must be a valid UST email ending with @ust.edu.ph",
			}));
			return;
		}

		setIsConfirmOpen(true);
	};

	const handleConfirmSave = async () => {
		// Revalidate before saving
		if (!validateRequiredFields()) {
			setIsConfirmOpen(false);
			return;
		}

		// Double-check validation before saving
		if (!validatePhoneNumber(settings.phoneNumber)) {
			setValidationErrors((prev) => ({
				...prev,
				phoneNumber: "Please enter a valid phone number",
			}));
			setIsConfirmOpen(false);
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
				ustEmail: "ustEmail",
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

	// Improved error UI with retry option
	if (error) {
		return (
			<div className={styles.settingsContainer}>
				<div className={styles.errorMessage}>
					<h3>Something went wrong</h3>
					<p>{error}</p>
					<div className={styles.errorActions}>
						<button
							onClick={() => window.location.reload()}
							className={styles.settingsBtnSubmit}
						>
							Try Again
						</button>
						<button
							onClick={() => setError(null)}
							className={styles.settingsBtnCancel}
						>
							Dismiss
						</button>
					</div>
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
						<label htmlFor="firstname">First Name</label>
						<input
							id="firstname"
							type="text"
							className={`form-control settings-field-value ${
								validationErrors.firstname
									? styles.invalidField
									: ""
							}`}
							value={settings.firstname}
							onChange={(e) =>
								handleFieldChange("firstname", e.target.value)
							}
							aria-label="First Name"
						/>
						{validationErrors.firstname && (
							<div className={styles.errorMessage}>
								{validationErrors.firstname}
							</div>
						)}
					</div>
					<div className={styles.formGroupLg}>
						<label htmlFor="lastname">Last Name</label>
						<input
							id="lastname"
							type="text"
							className={`form-control settings-field-value ${
								validationErrors.lastname
									? styles.invalidField
									: ""
							}`}
							value={settings.lastname}
							onChange={(e) =>
								handleFieldChange("lastname", e.target.value)
							}
							aria-label="Last Name"
						/>
						{validationErrors.lastname && (
							<div className={styles.errorMessage}>
								{validationErrors.lastname}
							</div>
						)}
					</div>
					<div className={styles.formGroupLg}>
						<label htmlFor="middlename">Middle Name</label>
						<input
							id="middlename"
							type="text"
							className={`form-control settings-field-value ${
								validationErrors.middlename
									? styles.invalidField
									: ""
							}`}
							value={settings.middlename}
							onChange={(e) =>
								handleFieldChange("middlename", e.target.value)
							}
							aria-label="Middle Name"
						/>
						{validationErrors.middlename && (
							<div className={styles.errorMessage}>
								{validationErrors.middlename}
							</div>
						)}
					</div>
					<div className={styles.formGroupXs}>
						<label htmlFor="suffix">Suffix</label>
						<select
							id="suffix"
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
							type="date"
							className={`form-control settings-field-value ${
								validationErrors.birthdate
									? styles.invalidField
									: ""
							}`}
							value={formatDateForPicker(settings.birthdate)}
							onChange={(e) =>
								handleDatePickerChange(e, "birthdate")
							}
							max={new Date().toISOString().split("T")[0]} // Prevent future dates
							aria-label="Birthdate"
						/>
						{validationErrors.birthdate && (
							<div className={styles.errorMessage}>
								{validationErrors.birthdate}
							</div>
						)}
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
							className={`form-select settings-field-value ${
								validationErrors.gender
									? styles.invalidField
									: ""
							}`}
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
						{validationErrors.gender && (
							<div className={styles.errorMessage}>
								{validationErrors.gender}
							</div>
						)}
					</div>
					<div className={styles.formGroupMd}>
						<label>Phone Number</label>
						<input
							type="text"
							className={`form-control settings-field-value ${
								validationErrors.phoneNumber
									? styles.invalidField
									: ""
							}`}
							value={phoneInputValue}
							onChange={handlePhoneChange}
							onFocus={handlePhoneFocus}
							onBlur={handlePhoneBlur}
							aria-label="Phone Number"
						/>
						{validationErrors.phoneNumber && (
							<div className={styles.errorMessage}>
								{validationErrors.phoneNumber}
							</div>
						)}
					</div>
					<div className={styles.formGroupFlex}>
						<label>ID Number</label>
						<input
							type="text"
							className={`form-control settings-field-value ${
								validationErrors.numberID
									? styles.invalidField
									: ""
							}`}
							value={settings.numberID}
							onChange={(e) =>
								handleFieldChange(
									"numberID",
									formatIDNumber(e.target.value)
								)
							}
							aria-label="ID Number"
						/>
						{validationErrors.numberID && (
							<div className={styles.errorMessage}>
								{validationErrors.numberID}
							</div>
						)}
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
							type="number"
							min="1"
							max="30"
							className={`form-control settings-field-value ${
								validationErrors.load ? styles.invalidField : ""
							}`}
							value={settings.load}
							onChange={(e) =>
								handleFieldChange("load", e.target.value)
							}
							aria-label="Load (Units)"
						/>
						{validationErrors.load && (
							<div className={styles.errorMessage}>
								{validationErrors.load}
							</div>
						)}
					</div>
					<div className={styles.formGroupMd}>
						<label>Status</label>
						<select
							className={`form-select settings-field-value ${
								validationErrors.status
									? styles.invalidField
									: ""
							}`}
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
						{validationErrors.status && (
							<div className={styles.errorMessage}>
								{validationErrors.status}
							</div>
						)}
					</div>
					<div className={styles.formGroupFlex}>
						<label>College</label>
						<select
							className={`form-select settings-field-value ${
								validationErrors.college
									? styles.invalidField
									: ""
							}`}
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
						{validationErrors.college && (
							<div className={styles.errorMessage}>
								{validationErrors.college}
							</div>
						)}
					</div>
				</div>

				<div className={styles.formRow}>
					<div className={styles.formGroupMd}>
						<label>Date Hired</label>
						<input
							type="date"
							className={`form-control settings-field-value ${
								validationErrors.dateHired
									? styles.invalidField
									: ""
							}`}
							value={formatDateForPicker(settings.dateHired)}
							onChange={(e) =>
								handleDatePickerChange(e, "dateHired")
							}
							max={new Date().toISOString().split("T")[0]} // Prevent future dates
							aria-label="Date Hired"
						/>
						{validationErrors.dateHired && (
							<div className={styles.errorMessage}>
								{validationErrors.dateHired}
							</div>
						)}
					</div>
					<div className={styles.formGroupMd}>
						<label>Date Retired</label>
						<input
							type="date"
							className="form-control settings-field-value"
							value={formatDateForPicker(settings.dateRetired)}
							onChange={(e) =>
								handleDatePickerChange(e, "dateRetired")
							}
							min={
								settings.dateHired
									? formatDateForPicker(settings.dateHired)
									: undefined
							}
							aria-label="Date Retired"
						/>
					</div>
					<div className={styles.formGroupFlex}>
						<label>UST Email</label>
						<input
							type="email"
							className={`form-control settings-field-value ${
								validationErrors.ustEmail
									? styles.invalidField
									: ""
							}`}
							value={settings.ustEmail}
							onChange={(e) =>
								handleFieldChange("ustEmail", e.target.value)
							}
							placeholder="name.lastname@ust.edu.ph"
							aria-label="UST Email"
						/>
						{validationErrors.ustEmail && (
							<div className={styles.errorMessage}>
								{validationErrors.ustEmail}
							</div>
						)}
					</div>
				</div>

				<div className={styles.formRow}>
					<div className={styles.formGroupHalf}>
						<label>Address</label>
						<input
							type="text"
							className={`form-control settings-field-value ${
								validationErrors.address
									? styles.invalidField
									: ""
							}`}
							value={settings.address}
							onChange={(e) =>
								handleFieldChange("address", e.target.value)
							}
							aria-label="Home Address"
						/>
						{validationErrors.address && (
							<div className={styles.errorMessage}>
								{validationErrors.address}
							</div>
						)}
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
						onClick={handleSaveClick}
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
