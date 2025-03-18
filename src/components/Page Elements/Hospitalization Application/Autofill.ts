import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../../config/firebase";
import { FieldValues, UseFormSetValue } from "react-hook-form";
import { Dispatch, SetStateAction, useEffect } from "react";

// Define interface for autofill data
interface AutofillData {
	// Personal Information
	lastname?: string;
	firstname?: string;
	middlename?: string;
	suffix?: string;
	age?: number;
	gender?: "Male" | "Female";
	contact?: number | string;
	college?: string;
	idNumber?: string;
	numberID?: string; // Alternative field name
	address?: string;
	phoneNumber?: string; // Alternative field name

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

		// Check if autofill is enabled (checking both possible locations)
		const isAutofillEnabled =
			userData.autofill !== undefined
				? userData.autofill
				: userData.settings?.autofill !== undefined
				? userData.settings.autofill
				: false;

		if (!isAutofillEnabled) {
			console.log("Autofill: Autofill is disabled for this user");
			return null;
		}

		// Access the personalInfo nested object
		const personalInfo = userData.personalInfo || {};

		// Calculate age from birthdate if available
		const age = personalInfo.birthdate
			? calculateAge(personalInfo.birthdate)
			: undefined;

		// Format phone number - keep as string to preserve formatting
		const contactNumber = personalInfo.phoneNumber || undefined;

		// Map the fields from your user document structure to the form fields
		const result: AutofillData = {
			lastname: personalInfo.lastName || "",
			firstname: personalInfo.firstName || "",
			middlename: personalInfo.middleName || "",
			suffix: personalInfo.suffix || "",
			age: age,
			gender: (personalInfo.gender as "Male" | "Female") || undefined,
			contact: contactNumber,
			phoneNumber: contactNumber,
			college: personalInfo.college || "",
			idNumber: personalInfo.idNumber || "",
			numberID: personalInfo.idNumber || "", // Alternative field name
			address: personalInfo.address || "",
			term: personalInfo.term || "",
			year: personalInfo.year || "",
			load: personalInfo.load || "",
			// status: personalInfo.status || "",
			// dateHired: personalInfo.dateHired
			// 	? new Date(personalInfo.dateHired)
			// 	: null,
			// dateRetired:
			// 	personalInfo.dateRetired && personalInfo.dateRetired !== ""
			// 		? new Date(personalInfo.dateRetired)
			// 		: null,
			// benefits: personalInfo.benefits || "",
			// hmo: personalInfo.hmo || "",
		};

		console.log("Autofill: Processed data for form:", result);
		return result;
	} catch (error) {
		console.error("Error fetching autofill data:", error);
		return null;
	}
};

/**
 * Updates form field values based on autofill settings
 * @param setValue - React Hook Form's setValue function
 * @param setDateHired - Optional state setter for dateHired (if form uses it)
 * @param setDateRetired - Optional state setter for dateRetired (if form uses it)
 */
export const useAutofill = (
	setValue: UseFormSetValue<any>,
	setDateHired?: Dispatch<SetStateAction<Date | null>>,
	setDateRetired?: Dispatch<SetStateAction<Date | null>>
): void => {
	console.log("Autofill: Attempting to autofill form");

	// Use useEffect to run this once when component mounts
	useEffect(() => {
		const fillForm = async () => {
			const autofillData = await getAutofillData();

			if (autofillData) {
				// Apply form data - using shouldDirty:true to mark fields as editable
				Object.entries(autofillData).forEach(([field, value]) => {
					if (value !== undefined && value !== null && value !== "") {
						console.log(`Autofill: Setting ${field} to:`, value);
						try {
							// Set the value while making sure it's marked as editable
							setValue(field as any, value as any, {
								shouldDirty: true, // Mark field as dirty so it's editable
								shouldTouch: true, // Mark field as touched
							});
						} catch (error) {
							console.error(
								`Error setting field ${field}:`,
								error
							);
						}
					}
				});

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

		fillForm();
	}, [setValue, setDateHired, setDateRetired]); // Dependencies for useEffect
};
