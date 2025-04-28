import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../../../contexts/firebase";
import { UseFormSetValue, Path, FieldValues } from "react-hook-form";
import { Dispatch, SetStateAction, useEffect, useRef } from "react";
import { parseToDate, formatDateToMMDDYYYY } from "../../../../utils/dateUtils";

// Define a type for user data from Firebase based on firebase.md schema
interface UserPersonalInfo {
	firstName: string;
	lastName: string;
	middleName: string;
	suffix: string | null;
	idNumber: string;
	birthdate: string;
	gender: "Male" | "Female";
	college: string;
	address: string;
	status: string;
	dateHired: string | null;
	dateRetired: string | null;
	term: string;
	year: string;
	load: string;
	remainingBenefits: number;
	ustEmail: string;
	phoneNumber: string;
	benefits?: string;
	hmo?: string;
}

interface UserData {
	personalInfo: UserPersonalInfo;
	autofill?: boolean;
	settings?: {
		autofill: boolean;
		notification: boolean;
	};
}

// Use this type for form fields that can be autofilled
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
	dateHired?: string | Date | null;
	dateRetired?: string | Date | null;
	benefits?: string;
	hmo?: string | null;
}

export const calculateAge = (birthdateStr: string): number | undefined => {
	try {
		let birthdate: Date;

		// Handle MM/DD/YYYY format
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

		const userData = userDoc.data() as UserData;
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
			status: personalInfo.status || "",
			dateHired: personalInfo.dateHired || null,
			dateRetired: personalInfo.dateRetired || null,
			benefits: personalInfo.benefits || "",
			hmo: personalInfo.hmo || "",
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
export const applyAutofill = async <T extends FieldValues>(
	setValue: UseFormSetValue<T>,
	setDateHired?: Dispatch<SetStateAction<Date | null>>,
	setDateRetired?: Dispatch<SetStateAction<Date | null>>,
	setPhoneInputValue?: Dispatch<SetStateAction<string>>
) => {
	const autofillData = await getAutofillData();

	if (autofillData) {
		Object.entries(autofillData).forEach(([field, value]) => {
			if (value !== undefined && value !== null && value !== "") {
				// Handle date fields separately
				if (field === "dateHired" && value) {
					// For UI state - convert to Date object regardless of input format
					if (setDateHired) {
						setDateHired(parseToDate(value));
					}

					// For form value - ensure MM/DD/YYYY format for backend
					try {
						setValue(
							field as Path<T>,
							formatDateToMMDDYYYY(
								parseToDate(value)
							) as unknown as T[Path<T>],
							{
								shouldDirty: false,
								shouldTouch: false,
							}
						);
					} catch (error) {
						console.error(`Error setting dateHired field:`, error);
					}
					return;
				}

				if (field === "dateRetired" && value) {
					// For UI state - convert to Date object regardless of input format
					if (setDateRetired) {
						setDateRetired(parseToDate(value));
					}

					// For form value - ensure MM/DD/YYYY format for backend
					try {
						setValue(
							field as Path<T>,
							formatDateToMMDDYYYY(
								parseToDate(value)
							) as unknown as T[Path<T>],
							{
								shouldDirty: false,
								shouldTouch: false,
							}
						);
					} catch (error) {
						console.error(
							`Error setting dateRetired field:`,
							error
						);
					}
					return;
				}

				// Special handling for status to ensure conditional UI components show
				if (field === "status") {
					try {
						setValue(field as Path<T>, value as unknown as T[Path<T>], {
							shouldDirty: true,
							shouldTouch: true, // Force UI update for conditional components
							shouldValidate: true, // Ensure validation runs for conditional fields
						});
						
						console.log(`Autofill: Set status to ${value}`);
					} catch (error) {
						console.error(`Error setting status field:`, error);
					}
					return;
				}

				// Continue with existing code for other fields
				if (field === "contact" || field === "phoneNumber") {
					try {
						// Set the form value but don't override user edits later
						setValue(
							field as Path<T>,
							value as unknown as T[Path<T>],
							{
								shouldDirty: false,
								shouldTouch: false,
							}
						);

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
						setValue(
							field as Path<T>,
							value as unknown as T[Path<T>],
							{
								shouldDirty: false,
								shouldTouch: false,
							}
						);
					} catch (error) {
						console.error(`Error setting field ${field}:`, error);
					}
				}
			}
		});

		console.log("Autofill: Complete");
	} else {
		console.log("Autofill: No data available or autofill disabled");
	}
};

/**
 * React hook to apply autofill when component mounts
 * Separate from the actual autofill function to avoid hook rules violations
 */
export const useAutofill = <T extends FieldValues>(
	setValue: UseFormSetValue<T>,
	setDateHired?: Dispatch<SetStateAction<Date | null>>,
	setDateRetired?: Dispatch<SetStateAction<Date | null>>,
	setPhoneInputValue?: Dispatch<SetStateAction<string>>
) => {
	const autofillAppliedRef = useRef(false);

	useEffect(() => {
		// Only run autofill once when the component mounts
		if (!autofillAppliedRef.current) {
			applyAutofill<T>(
				setValue,
				setDateHired,
				setDateRetired,
				setPhoneInputValue
			);
			autofillAppliedRef.current = true;
		}
	}, [setValue, setDateHired, setDateRetired, setPhoneInputValue]);
};
