import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../../../contexts/firebase";
import { UseFormSetValue } from "react-hook-form";
import { Dispatch, SetStateAction, useEffect, useRef } from "react";

interface AutofillData {
	lastname?: string;
	firstname?: string;
	middlename?: string;
	suffix?: string;
	age?: number;
	gender?: "Male" | "Female";
	contact?: string;
	college?: string;
	idNumber?: string;
	numberID?: string;
	address?: string;
	phoneNumber?: string;
	term?: string;
	year?: string;
	load?: string;
	status?: string;
	dateHired?: Date | null;
	dateRetired?: Date | null;
	benefits?: string;
	hmo?: string;
}

const calculateAge = (birthdateStr: string): number | undefined => {
	if (!birthdateStr) return undefined;

	let birthdate: Date;

	try {
		// Handle MM/DD/YYYY format (stored in Firestore)
		if (birthdateStr.includes("/")) {
			const parts = birthdateStr.split("/");
			if (parts.length !== 3) return undefined;

			const month = parseInt(parts[0], 10);
			const day = parseInt(parts[1], 10);
			const year = parseInt(parts[2], 10);

			if (isNaN(month) || isNaN(day) || isNaN(year)) return undefined;
			birthdate = new Date(year, month - 1, day);
		}
		// Handle YYYY-MM-DD format (used in date inputs)
		else if (birthdateStr.includes("-")) {
			const parts = birthdateStr.split("-");
			if (parts.length !== 3) return undefined;

			const year = parseInt(parts[0], 10);
			const month = parseInt(parts[1], 10);
			const day = parseInt(parts[2], 10);

			if (isNaN(month) || isNaN(day) || isNaN(year)) return undefined;
			birthdate = new Date(year, month - 1, day);
		}
		// Try parsing as direct date
		else {
			birthdate = new Date(birthdateStr);
			if (isNaN(birthdate.getTime())) return undefined;
		}

		const today = new Date();
		let age = today.getFullYear() - birthdate.getFullYear();

		// Adjust age if birthday hasn't occurred yet this year
		if (
			today.getMonth() < birthdate.getMonth() ||
			(today.getMonth() === birthdate.getMonth() &&
				today.getDate() < birthdate.getDate())
		) {
			age--;
		}

		return age;
	} catch (error) {
		console.error("Error calculating age:", error);
		return undefined;
	}
};

export const getAutofillData = async (): Promise<AutofillData | null> => {
	const currentUser = auth.currentUser;
	if (!currentUser) {
		console.log("Autofill: No current user found");
		return null;
	}

	try {
		const userDocRef = doc(db, "users", currentUser.uid);
		const userDoc = await getDoc(userDocRef);

		console.log("Autofill: User document exists:", userDoc.exists());

		if (!userDoc.exists()) {
			return null;
		}

		const userData = userDoc.data();
		console.log("Autofill: User data retrieved:", userData);

		const isAutofillEnabled =
			userData?.autofill ?? userData?.settings?.autofill ?? false;

		if (!isAutofillEnabled) {
			console.log("Autofill: Autofill is disabled for this user");
			return null;
		}

		const personalInfo = userData.personalInfo || {};

		const age = personalInfo.birthdate
			? calculateAge(personalInfo.birthdate)
			: undefined;

		console.log(
			"Autofill: Calculated age:",
			age,
			"from birthdate:",
			personalInfo.birthdate
		);

		const contactNumber = personalInfo.phoneNumber
			? personalInfo.phoneNumber.toString()
			: undefined;

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
			numberID: personalInfo.idNumber || "",
			address: personalInfo.address || "",
			term: personalInfo.term || "",
			year: personalInfo.year || "",
			load: personalInfo.load || "",
			dateHired: personalInfo.dateHired || null,
			dateRetired: personalInfo.dateRetired || null,
		};

		console.log("Autofill: Processed data for form:", result);
		return result;
	} catch (error) {
		console.error("Error fetching autofill data:", error);
		return null;
	}
};

/**
 * Apply autofill data to form fields
 * This is a regular function, not a hook
 */
export const applyAutofill = async (
	setValue: UseFormSetValue<any>,
	setDateHired?: Dispatch<SetStateAction<Date | null>>,
	setDateRetired?: Dispatch<SetStateAction<Date | null>>,
	setPhoneInputValue?: Dispatch<SetStateAction<string>>
) => {
	const autofillData = await getAutofillData();

	if (autofillData) {
		Object.entries(autofillData).forEach(([field, value]) => {
			if (value !== undefined && value !== null && value !== "") {
				console.log(`Autofill: Setting ${field} to:`, value);

				if (field === "contact" || field === "phoneNumber") {
					try {
						// Set the form value but don't override user edits later
						setValue(field as any, value, {
							shouldDirty: false,
							shouldTouch: false,
						});

						if (setPhoneInputValue && typeof value === "string") {
							const formattedValue = value.startsWith("+63")
								? value
								: `+63${value}`;
							setPhoneInputValue(formattedValue);
						}
					} catch (error) {
						console.error(
							`Error setting phone field ${field}:`,
							error
						);
					}
				} else {
					try {
						// Set the form value but don't override user edits later
						setValue(field as any, value as any, {
							shouldDirty: false,
							shouldTouch: false,
						});
					} catch (error) {
						console.error(`Error setting field ${field}:`, error);
					}
				}
			}
		});

		if (setDateHired && autofillData.dateHired) {
			setDateHired(autofillData.dateHired);
		}

		if (setDateRetired && autofillData.dateRetired) {
			setDateRetired(autofillData.dateRetired);
		}

		console.log("Autofill: Complete");
	} else {
		console.log("Autofill: No data available or autofill disabled");
	}
};

/**
 * React hook to apply autofill when component mounts
 * Separate from the actual autofill function to avoid hook rules violations
 */
export const useAutofill = (
	setValue: UseFormSetValue<any>,
	setDateHired?: Dispatch<SetStateAction<Date | null>>,
	setDateRetired?: Dispatch<SetStateAction<Date | null>>,
	setPhoneInputValue?: Dispatch<SetStateAction<string>>
) => {
	const autofillAppliedRef = useRef(false);

	useEffect(() => {
		// Only run autofill once when the component mounts
		if (!autofillAppliedRef.current) {
			applyAutofill(
				setValue,
				setDateHired,
				setDateRetired,
				setPhoneInputValue
			);
			autofillAppliedRef.current = true;
		}
	}, [setValue, setDateHired, setDateRetired, setPhoneInputValue]);
};
