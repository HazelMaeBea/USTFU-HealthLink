import React, { useState, useEffect } from "react";
import "./Settings.css";
import Popout from "../Page Elements/Popout/Popout";
import { useFirebase } from "../../contexts/firebaseContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";

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
			<div className="changes-summary">
				<p>You've made the following changes:</p>
				<ul>
					{Object.entries(changedFields).map(([field, values]) => (
						<li key={field}>
							<strong>{fieldLabels[field] || field}:</strong>
							<span className="old-value">
								{values.old || "(empty)"}
							</span>{" "}
							→{" "}
							<span className="new-value">
								{values.new || "(empty)"}
							</span>
						</li>
					))}
				</ul>
			</div>
		);
	};

	const handleConfirmSave = async () => {
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

	if (isLoading) {
		return (
			<div className="settings-container">
				<div className="loading-indicator">
					Loading your settings...
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="settings-container">
				<div className="error-message">
					<p>{error}</p>
					<button onClick={() => setError(null)}>Dismiss</button>
				</div>
			</div>
		);
	}

	return (
		<div className="settings-container">
			<div className="settings-section">
				<h3>Personal Preferences</h3>
				<div className="toggle-group">
					<div className="toggle-row">
						<p>Email Notifications:</p>
						<div className="form-check">
							<label className="form-check-label form-check-toggle">
								<input
									className="form-check-input"
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
					<div className="toggle-row">
						<p>Auto-fill Information:</p>
						<div className="form-check">
							<label className="form-check-label form-check-toggle">
								<input
									className="form-check-input"
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

			<div className="settings-section">
				<h3>Personal Information</h3>

				{/* Row 1: Name fields */}
				<div className="form-row">
					<div className="form-group form-group-lg">
						<label>First Name</label>
						<div
							className="editable settings-field-value"
							contentEditable
							suppressContentEditableWarning
							onBlur={(e) => handleFieldBlur("firstname", e)}
						>
							{settings.firstname}
						</div>
					</div>
					<div className="form-group form-group-lg">
						<label>Last Name</label>
						<div
							className="editable settings-field-value"
							contentEditable
							suppressContentEditableWarning
							onBlur={(e) => handleFieldBlur("lastname", e)}
						>
							{settings.lastname}
						</div>
					</div>
					<div className="form-group form-group-lg">
						<label>Middle Name</label>
						<div
							className="editable settings-field-value"
							contentEditable
							suppressContentEditableWarning
							onBlur={(e) => handleFieldBlur("middlename", e)}
						>
							{settings.middlename}
						</div>
					</div>
					<div className="form-group form-group-xs">
						<label>Suffix</label>
						<div
							className="editable settings-field-value"
							contentEditable
							suppressContentEditableWarning
							onBlur={(e) => handleFieldBlur("suffix", e)}
						>
							{settings.suffix}
						</div>
					</div>
				</div>

				{/* Row 2: Personal details */}
				<div className="form-row">
					<div className="form-group form-group-md">
						<label>Birthdate</label>
						<div
							className="editable settings-field-value"
							contentEditable
							suppressContentEditableWarning
							onBlur={(e) => handleFieldBlur("birthdate", e)}
						>
							{settings.birthdate}
						</div>
					</div>
					<div className="form-group form-group-xs">
						<label>Age</label>
						<div className="settings-field-value non-editable">
							{calculatedAge || "N/A"}
						</div>
					</div>
					<div className="form-group form-group-sm">
						<label>Gender</label>
						<div
							className="editable settings-field-value"
							contentEditable
							suppressContentEditableWarning
							onBlur={(e) => handleFieldBlur("gender", e)}
						>
							{settings.gender}
						</div>
					</div>
					<div className="form-group form-group-md">
						<label>Phone Number</label>
						<div
							className="editable settings-field-value"
							contentEditable
							suppressContentEditableWarning
							onBlur={(e) => handleFieldBlur("phoneNumber", e)}
						>
							{settings.phoneNumber}
						</div>
					</div>
					<div className="form-group form-group-flex">
						<label>ID Number</label>
						<div
							className="editable settings-field-value"
							contentEditable
							suppressContentEditableWarning
							onBlur={(e) => handleFieldBlur("numberID", e)}
						>
							{settings.numberID}
						</div>
					</div>
				</div>

				{/* Row 3: Work details */}
				<div className="form-row">
					<div className="form-group form-group-xs">
						<label>Term</label>
						<div
							className="editable settings-field-value"
							contentEditable
							suppressContentEditableWarning
							onBlur={(e) => handleFieldBlur("term", e)}
						>
							{settings.term}
						</div>
					</div>
					<div className="form-group form-group-sm">
						<label>Year</label>
						<div
							className="editable settings-field-value"
							contentEditable
							suppressContentEditableWarning
							onBlur={(e) => handleFieldBlur("year", e)}
						>
							{settings.year}
						</div>
					</div>
					<div className="form-group form-group-xs">
						<label>Load</label>
						<div
							className="editable settings-field-value"
							contentEditable
							suppressContentEditableWarning
							onBlur={(e) => handleFieldBlur("load", e)}
						>
							{settings.load}
						</div>
					</div>
					<div className="form-group form-group-md">
						<label>Status</label>
						<div
							className="editable settings-field-value"
							contentEditable
							suppressContentEditableWarning
							onBlur={(e) => handleFieldBlur("status", e)}
						>
							{settings.status}
						</div>
					</div>
					<div className="form-group form-group-md">
						<label>Date Hired</label>
						<div
							className="editable settings-field-value"
							contentEditable
							suppressContentEditableWarning
							onBlur={(e) => handleFieldBlur("dateHired", e)}
						>
							{settings.dateHired}
						</div>
					</div>
					<div className="form-group form-group-flex">
						<label>Date Retired</label>
						<div
							className="editable settings-field-value"
							contentEditable
							suppressContentEditableWarning
							onBlur={(e) => handleFieldBlur("dateRetired", e)}
						>
							{settings.dateRetired || "N/A"}
						</div>
					</div>
				</div>

				{/* Row 4: College and address */}
				<div className="form-row">
					<div className="form-group form-group-half">
						<label>College</label>
						<div
							className="editable settings-field-value"
							contentEditable
							suppressContentEditableWarning
							onBlur={(e) => handleFieldBlur("college", e)}
						>
							{settings.college}
						</div>
					</div>
					<div className="form-group form-group-half">
						<label>Address</label>
						<div
							className="editable settings-field-value"
							contentEditable
							suppressContentEditableWarning
							onBlur={(e) => handleFieldBlur("address", e)}
						>
							{settings.address}
						</div>
					</div>
				</div>

				<div className="buttonDiv">
					<button
						onClick={() => setIsConfirmOpen(true)}
						className="settings-btn-submit"
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
