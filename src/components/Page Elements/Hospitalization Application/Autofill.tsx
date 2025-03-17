import { doc, getDoc } from "firebase/firestore";
import { Dispatch, SetStateAction } from "react";
import { UseFormSetValue } from "react-hook-form";
import { auth, db } from "../../../config/firebase";

/**
 * Helper function to calculate age from birthdate
 * @param birthdate Birthdate string in MM/DD/YYYY format
 * @returns Age as a number or null if invalid
 */
const calculateAge = (birthdate: string): number | null => {
	if (!birthdate) return null;

	// Parse the birthdate string
	const parts = birthdate.split("/");
	if (parts.length !== 3) return null;

	const birthMonth = parseInt(parts[0], 10);
	const birthDay = parseInt(parts[1], 10);
	const birthYear = parseInt(parts[2], 10);

	if (isNaN(birthMonth) || isNaN(birthDay) || isNaN(birthYear)) return null;

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

	return age;
};

/**
 * Apply autofill to form fields with user data
 * Note: This is NOT a React hook, it's a regular async function
 * @param setValue React Hook Form setValue function
 * @param setDateHired Optional state setter for dateHired
 * @param setDateRetired Optional state setter for dateRetired
 */
export const applyAutofill = async <T extends Record<string, any>>(
	setValue: UseFormSetValue<T>,
	setDateHired?: Dispatch<SetStateAction<Date | null>>,
	setDateRetired?: Dispatch<SetStateAction<Date | null>>
): Promise<void> => {
	try {
		// Check if user is logged in
		const user = auth.currentUser;
		if (!user || !user.uid) {
			console.log("User not logged in, skipping autofill");
			return;
		}

		// Check if autofill setting is enabled
		const userDocRef = doc(db, "users", user.uid);
		const userDoc = await getDoc(userDocRef);

		if (!userDoc.exists()) {
			console.log("User document not found");
			return;
		}

		const userData = userDoc.data();
		const personalInfo = userData.personalInfo || {};

		// Check if autofill is enabled (checking both possible locations)
		const isAutofillEnabled =
			userData.autofill !== undefined
				? userData.autofill
				: userData.settings?.autofill !== undefined
				? userData.settings.autofill
				: false;

		if (!isAutofillEnabled) {
			console.log("Autofill is disabled in user settings");
			return;
		}

		console.log("Autofilling form with user data:", personalInfo);

		// Map fields from user data to form fields
		const fieldMappings: Record<string, any> = {
			// Personal info mappings
			lastname: personalInfo.lastName || "",
			firstname: personalInfo.firstName || "",
			middlename: personalInfo.middleName || "",
			suffix: personalInfo.suffix || "",
			gender: personalInfo.gender || "",
			contact: personalInfo.phoneNumber || "",
			college: personalInfo.college || "",
			idNumber: personalInfo.idNumber || "",
			address: personalInfo.address || "",

			// Work info mappings
			term: personalInfo.term || "",
			year: personalInfo.year || "",
			load: personalInfo.load || "",
			status: personalInfo.status || "",

			// Different field names that map to the same data
			numberID: personalInfo.idNumber || "",
			phoneNumber: personalInfo.phoneNumber || "",
		};

		// Calculate age from birthdate if available
		if (personalInfo.birthdate) {
			const age = calculateAge(personalInfo.birthdate);
			if (age !== null) {
				fieldMappings.age = age;
			}
		}

		// Handle date fields
		if (personalInfo.dateHired) {
			fieldMappings.dateHired = personalInfo.dateHired;

			// If date state setters are provided, update them too
			if (setDateHired && personalInfo.dateHired) {
				// Parse date in MM/DD/YYYY format
				const parts = personalInfo.dateHired.split("/");
				if (parts.length === 3) {
					const month = parseInt(parts[0]) - 1; // JS months are 0-indexed
					const day = parseInt(parts[1]);
					const year = parseInt(parts[2]);
					setDateHired(new Date(year, month, day));
				}
			}
		}

		if (personalInfo.dateRetired) {
			fieldMappings.dateRetired = personalInfo.dateRetired;

			// If date state setters are provided, update them too
			if (setDateRetired && personalInfo.dateRetired) {
				// Parse date in MM/DD/YYYY format
				const parts = personalInfo.dateRetired.split("/");
				if (parts.length === 3) {
					const month = parseInt(parts[0]) - 1; // JS months are 0-indexed
					const day = parseInt(parts[1]);
					const year = parseInt(parts[2]);
					setDateRetired(new Date(year, month, day));
				}
			}
		}

		// Set all the mapped values in the form
		Object.entries(fieldMappings).forEach(([key, value]) => {
			// Only set values that are not empty
			if (value !== undefined && value !== null && value !== "") {
				try {
					setValue(key as any, value);
				} catch (error) {
					console.warn(
						`Failed to set value for field ${key}:`,
						error
					);
				}
			}
		});

		console.log("Form autofill completed successfully");
	} catch (error) {
		console.error("Error during autofill:", error);
	}
};
