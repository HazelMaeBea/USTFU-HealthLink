import { FieldValues } from "react-hook-form";

// Fields that are considered part of autofill data and not user-entered data
const autofillFields = [
	"gender",
	"college",
	"term",
	"year",
	"status",
	"benefits",
	"hospitalStatus",
	"firstname",
	"lastname",
	"middlename",
	"contact",
];

// Fields that would indicate user-entered data (not just autofill)
const userEditedFields = [
	"amountPaid",
	"ORNumber",
	"issuedBy",
	"hospital",
	"illness",
	"physician",
	"procedures",
	"procedureSpecify",
	"confinementFrom",
	"confinementTo",
	"idNumber",
	"address",
];

/**
 * Determines if the form data contains actual user-entered content beyond autofill
 * @param data Form data to check
 * @returns true if there's meaningful user-entered data, false if only autofill or empty
 */
const hasUserEnteredData = (data: FieldValues): boolean => {
	// Check if any user-edited fields have values
	const hasEditedData = userEditedFields.some((field) => {
		return (
			data[field] !== undefined &&
			data[field] !== null &&
			data[field] !== ""
		);
	});

	// Check if any non-autofill fields have values
	const hasOtherData = Object.entries(data).some(([key, value]) => {
		// Skip checking autofill fields
		if (autofillFields.includes(key)) {
			return false;
		}
		// Skip checking fields we already explicitly checked
		if (userEditedFields.includes(key)) {
			return false;
		}
		// Check if the field has a non-empty value
		return value !== undefined && value !== null && value !== "";
	});

	return hasEditedData || hasOtherData;
};

/**
 * Save form data to localStorage
 * @param formType Unique identifier for the form (e.g., 'inpatient', 'outpatient')
 * @param data Form data to save
 */
export const saveFormData = (formType: string, data: FieldValues): void => {
	try {
		// Filter out file objects as they can't be serialized
		const cleanData = { ...data };

		// Remove file inputs since they can't be properly serialized
		Object.keys(cleanData).forEach((key) => {
			if (
				cleanData[key] instanceof FileList ||
				(Array.isArray(cleanData[key]) &&
					cleanData[key].length > 0 &&
					cleanData[key][0] instanceof File)
			) {
				delete cleanData[key];
			}
		});

		localStorage.setItem(`form_${formType}`, JSON.stringify(cleanData));
		console.log(`Form data for ${formType} saved to localStorage`);
	} catch (error) {
		console.error("Error saving form data:", error);
	}
};

/**
 * Load saved form data from localStorage
 * @param formType Unique identifier for the form
 * @returns The saved form data or null if none exists
 */
export const loadFormData = (formType: string): FieldValues | null => {
	try {
		const saved = localStorage.getItem(`form_${formType}`);
		return saved ? JSON.parse(saved) : null;
	} catch (error) {
		console.error("Error loading form data:", error);
		// If there's a parse error, clear the corrupted data
		localStorage.removeItem(`form_${formType}`);
		return null;
	}
};

/**
 * Check if saved form data exists in localStorage and contains user-entered data
 * @param formType Unique identifier for the form
 * @returns boolean indicating if saved data exists with user-entered content
 */
export const hasSavedFormData = (formType: string): boolean => {
	try {
		const savedData = localStorage.getItem(`form_${formType}`);
		if (!savedData) return false;

		// Parse the saved data
		const data = JSON.parse(savedData);

		// Check if the data contains meaningful user-entered content
		const hasUserData = hasUserEnteredData(data);

		console.log(`Form ${formType} has user-entered data: ${hasUserData}`);
		return hasUserData;
	} catch (error) {
		console.error("Error checking for saved form data:", error);
		return false;
	}
};

/**
 * Clear saved form data from localStorage
 * @param formType Unique identifier for the form
 */
export const clearFormData = (formType: string): void => {
	try {
		localStorage.removeItem(`form_${formType}`);
		console.log(
			`Form data for ${formType} has been cleared from localStorage`
		);
	} catch (error) {
		console.error("Error clearing form data:", error);
	}
};

/**
 * Force save empty default values to overwrite previous data
 * @param formType Unique identifier for the form
 */
export const saveEmptyFormData = (formType: string): void => {
	try {
		// Create a minimal empty data object
		const emptyData: Record<string, any> = {
			gender: undefined,
			college: "",
			term: "",
			year: "",
			status: "",
			benefits: "",
			hmo: "",
			hospital: "",
			illness: "",
			physician: "",
			procedures: "",
			procedureSpecify: "",
			confinementFrom: "",
			confinementTo: "",
			load: undefined,
			certify: false,
			claimRequestCount: 1, // Set default to 1
		};

		// For hospital-related forms, explicitly set hospitalStatus
		if (formType === "inpatient") {
			emptyData.hospitalStatus = "In-Patient";  // Explicitly set for inpatient
		} else if (formType === "outpatient") {
			emptyData.hospitalStatus = "Out-Patient"; // Explicitly set for outpatient
		} else {
			// For non-hospital forms, exclude hospitalStatus completely
			emptyData.hospitalStatus = undefined;
		}

		localStorage.setItem(`form_${formType}`, JSON.stringify(emptyData));
		console.log(`Empty form data for ${formType} saved to localStorage`);
	} catch (error) {
		console.error("Error saving empty form data:", error);
	}
};
