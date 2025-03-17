import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../../config/firebase";
import { UseFormSetValue } from "react-hook-form";

// Define interface for autofill data
interface AutofillData {
	// Personal Information
	lastname?: string;
	firstname?: string;
	middlename?: string;
	suffix?: string;
	age?: number;
	gender?: "Male" | "Female";
	contact?: number;
	college?: string;

	// Teaching Information
	term?: string;
	year?: string;
	load?: string;
	status?: string;
	dateHired?: Date | null;
	dateRetired?: Date | null;
	benefits?: string;
	hmo?: string;
}

/**
 * Calculate age from birthdate string (MM/DD/YYYY format)
 */
const calculateAge = (birthdateStr: string): number | undefined => {
	if (!birthdateStr) return undefined;

	const parts = birthdateStr.split("/");
	if (parts.length !== 3) return undefined;

	const birthdate = new Date(`${parts[2]}-${parts[0]}-${parts[1]}`);
	const today = new Date();
	let age = today.getFullYear() - birthdate.getFullYear();
	const m = today.getMonth() - birthdate.getMonth();

	if (m < 0 || (m === 0 && today.getDate() < birthdate.getDate())) {
		age--;
	}

	return age;
};

/**
 * Fetches user data for autofilling forms
 * Returns null if user is not logged in, autofill is disabled, or an error occurs
 */
export const getAutofillData = async (): Promise<AutofillData | null> => {
	const currentUser = auth.currentUser;
	if (!currentUser) {
		console.log("Autofill: No current user found");
		return null;
	}

	try {
		// Get user document from Firestore
		const userDocRef = doc(db, "users", currentUser.uid);
		const userDoc = await getDoc(userDocRef);

		console.log("Autofill: User document exists:", userDoc.exists());

		// Check if document exists
		if (!userDoc.exists()) {
			return null;
		}

		const userData = userDoc.data();
		console.log("Autofill: User data retrieved:", userData);

		// Check if autofill is enabled
		if (userData.autofill !== true) {
			console.log("Autofill: Autofill is disabled for this user");
			return null;
		}

		// Access the personalInfo nested object
		const personalInfo = userData.personalInfo || {};

		// Calculate age from birthdate if available
		const age = personalInfo.birthdate
			? calculateAge(personalInfo.birthdate)
			: undefined;

		// Format phone number - remove country code if present
		let contactNumber: number | undefined;
		if (personalInfo.phoneNumber) {
			// Parse phone number, removing any non-digit characters
			const phoneStr = personalInfo.phoneNumber.replace(/\D/g, "");
			contactNumber = phoneStr ? parseInt(phoneStr) : undefined;
		}

		// Map the fields from your user document structure to the form fields
		const result: AutofillData = {
			lastname: personalInfo.lastName || "",
			firstname: personalInfo.firstName || "",
			middlename: personalInfo.middleName || "",
			suffix: personalInfo.suffix || "",
			age: age,
			gender: (personalInfo.gender as "Male" | "Female") || undefined,
			contact: contactNumber,
			college: userData.college || "",
			term: personalInfo.term || "",
			year: personalInfo.year || "",
			load: personalInfo.load || "",
			status: personalInfo.status || "",
			dateHired: personalInfo.dateHired
				? new Date(personalInfo.dateHired)
				: null,
			dateRetired:
				personalInfo.dateRetired && personalInfo.dateRetired !== ""
					? new Date(personalInfo.dateRetired)
					: null,
			// Other fields could be added if they exist in your document
			benefits: "", // Add if available in your data
			hmo: "", // Add if available in your data
		};

		console.log("Autofill: Processed data for form:", result);
		return result;
	} catch (error) {
		console.error("Error fetching autofill data:", error);
		return null;
	}
};

/**
 * Applies autofill data to any form
 * @param setValue - React Hook Form's setValue function
 * @param data - The data to fill into the form
 */
export const applyAutofill = <T>(
	setValue: UseFormSetValue<T>,
	data: AutofillData
): void => {
	// Only apply values that exist in the data
	Object.entries(data).forEach(([field, value]) => {
		if (value !== undefined && value !== null) {
			console.log(`Autofill: Setting ${field} to:`, value);
			try {
				// Use type assertion to handle the generic type
				setValue(field as any, value as any);
			} catch (error) {
				console.error(`Error setting field ${field}:`, error);
			}
		}
	});
};

/**
 * Updates form field values based on autofill settings
 * @param setValue - React Hook Form's setValue function
 * @param setDateHired - Optional state setter for dateHired (if form uses it)
 * @param setDateRetired - Optional state setter for dateRetired (if form uses it)
 */
export const useAutofill = async <T>(
	setValue: UseFormSetValue<T>,
	setDateHired?: React.Dispatch<React.SetStateAction<Date | null>>,
	setDateRetired?: React.Dispatch<React.SetStateAction<Date | null>>
): Promise<void> => {
	console.log("Autofill: Attempting to autofill form");
	const autofillData = await getAutofillData();

	if (autofillData) {
		// Apply general form data
		applyAutofill(setValue, autofillData);

		// Handle date fields if the form uses them and setters are provided
		if (setDateHired && autofillData.dateHired) {
			console.log(
				"Autofill: Setting dateHired to",
				autofillData.dateHired
			);
			setDateHired(autofillData.dateHired);
		}

		if (setDateRetired && autofillData.dateRetired) {
			console.log(
				"Autofill: Setting dateRetired to",
				autofillData.dateRetired
			);
			setDateRetired(autofillData.dateRetired);
		}

		console.log("Autofill: Complete");
	} else {
		console.log("Autofill: No data available or autofill disabled");
	}
};
