import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../../config/firebase";
import { FieldValues, UseFormSetValue } from "react-hook-form";
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
			userData.autofill !== undefined
				? userData.autofill
				: userData.settings?.autofill !== undefined
				? userData.settings.autofill
				: false;

		if (!isAutofillEnabled) {
			console.log("Autofill: Autofill is disabled for this user");
			return null;
		}

		const personalInfo = userData.personalInfo || {};

		const age = personalInfo.birthdate
			? calculateAge(personalInfo.birthdate)
			: undefined;

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
		};

		console.log("Autofill: Processed data for form:", result);
		return result;
	} catch (error) {
		console.error("Error fetching autofill data:", error);
		return null;
	}
};

export const useAutofill = (
	setValue: UseFormSetValue<any>,
	setDateHired?: Dispatch<SetStateAction<Date | null>>,
	setDateRetired?: Dispatch<SetStateAction<Date | null>>,
	setPhoneInputValue?: Dispatch<SetStateAction<string>>
): void => {
	// Add a ref to track whether autofill has already been applied
	const autofillAppliedRef = useRef(false);

	useEffect(() => {
		// Only run autofill once when the component mounts
		if (autofillAppliedRef.current) return;

		const fillForm = async () => {
			const autofillData = await getAutofillData();

			if (autofillData) {
				Object.entries(autofillData).forEach(([field, value]) => {
					if (value !== undefined && value !== null && value !== "") {
						console.log(`Autofill: Setting ${field} to:`, value);

						if (field === "contact" || field === "phoneNumber") {
							try {
								// Set the form value but don't override user edits later
								setValue(field as any, value, {
									shouldDirty: false, // Changed from true
									shouldTouch: false, // Changed from true
								});

								if (
									setPhoneInputValue &&
									typeof value === "string"
								) {
									const formattedValue = value.startsWith(
										"+63"
									)
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
									shouldDirty: false, // Changed from true
									shouldTouch: false, // Changed from true
								});
							} catch (error) {
								console.error(
									`Error setting field ${field}:`,
									error
								);
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
				autofillAppliedRef.current = true;
			} else {
				console.log("Autofill: No data available or autofill disabled");
			}
		};

		fillForm();
	}, [setValue, setDateHired, setDateRetired, setPhoneInputValue]);
};
