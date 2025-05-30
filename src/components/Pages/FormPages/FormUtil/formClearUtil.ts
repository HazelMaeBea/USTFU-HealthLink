import { UseFormReset } from "react-hook-form";
import { UnifiedFormData } from "./formTypes";
import { Dispatch, SetStateAction } from "react";
import {
	clearFormData,
	hasSavedFormData,
	saveEmptyFormData,
} from "./formPresistence";

interface ClearFormOptions {
	formType: string;
	reset: UseFormReset<UnifiedFormData>;
	setDateHired?: Dispatch<SetStateAction<Date | null>>;
	setDateRetired?: Dispatch<SetStateAction<Date | null>>;
	setPhoneInputValue?: Dispatch<SetStateAction<string>>;
	setShouldReapplyAutofill: Dispatch<SetStateAction<boolean>>;
	setShowClearSuccess: Dispatch<SetStateAction<boolean>>;
	setShowRestoredMessage?: Dispatch<SetStateAction<boolean>>;
	additionalStates?: Record<string, Dispatch<SetStateAction<any>>>;
}

/**
 * Clears all form fields, resets to default state, scrolls to top, and shows success notification
 * @param options Object containing form reset function and state setters
 */
export const clearForm = (options: ClearFormOptions): void => {
	const {
		formType,
		reset,
		setDateHired,
		setDateRetired,
		setPhoneInputValue,
		setShouldReapplyAutofill,
		setShowClearSuccess,
		setShowRestoredMessage,
		additionalStates,
	} = options;

	console.log(`Clearing form data for ${formType}...`);

	// First, clear the data from localStorage to prevent it from being restored
	clearFormData(formType);

	// Reset form fields with explicitly defined default values for all fields
	// This is especially important for radio buttons like hospitalStatus
	reset({
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
		hospitalStatus: undefined, // Explicitly set hospitalStatus to undefined
		certify: false,
		ORNumber: "",
		issuedBy: "",
		amountPaid: undefined,
		dateHired: undefined,
		dateRetired: undefined,
	});

	// Reset file inputs
	if (window && window.document) {
		const fileInputs = document.querySelectorAll('input[type="file"]');
		fileInputs.forEach((input) => {
			(input as HTMLInputElement).value = "";
		});
	}

	// Reset date states
	if (setDateHired) setDateHired(null);
	if (setDateRetired) setDateRetired(null);

	// Reset phone input
	if (setPhoneInputValue) setPhoneInputValue("+63");

	// Reset additional states if provided
	if (additionalStates) {
		Object.entries(additionalStates).forEach(([key, setter]) => {
			if (key === "setFiles") {
				setter({});
			} else if (key === "setFileErrors") {
				setter({});
			} else if (key === "setIsNewUpload") {
				setter({
					employeeID: false,
					applicantSignature: false,
					eyeglassesReceipt: false,
					docRequest: false,
					hospitalInvoice: false,
					labInvoice: false,
				});
			} else if (key === "setIsFileInput") {
				setter({
					employeeID: false,
					applicantSignature: false,
					eyeglassesReceipt: false,
					docRequest: false,
					hospitalInvoice: false,
					labInvoice: false,
				});
			} else if (typeof setter === "function") {
				try {
					// Try setting to empty object or initial value
					setter({});
				} catch (e) {
					// If error, try setting to false (for boolean states)
					try {
						setter(false);
					} catch (e2) {
						// If still error, try null
						try {
							setter(null);
						} catch (e3) {
							console.error(`Failed to reset state: ${key}`, e3);
						}
					}
				}
			}
		});
	}

	// Explicitly save empty form data to localStorage to overwrite any existing data
	saveEmptyFormData(formType);

	// Flag to reapply autofill
	setShouldReapplyAutofill(true);

	// If we have the setter for restored message, make sure it's off
	if (setShowRestoredMessage) {
		setShowRestoredMessage(false);
	}

	// Scroll to top
	window.scrollTo({ top: 0, behavior: "smooth" });

	// Show success notification
	setShowClearSuccess(true);

	// Hide success notification after 3 seconds
	setTimeout(() => {
		setShowClearSuccess(false);
	}, 3000);

	console.log(`Form ${formType} cleared successfully`);
};

/**
 * Checks if a form has saved data and displays a message accordingly
 * @param formType Unique identifier for the form
 * @param setShowRestoredMessage Function to set state for showing restored message
 */
export const checkForRestoredFormData = (
	formType: string,
	setShowRestoredMessage: Dispatch<SetStateAction<boolean>>
): void => {
	const hasData = hasSavedFormData(formType);
	console.log(`Checking for restored form data (${formType}): ${hasData}`);
	setShowRestoredMessage(hasData);

	// If there's saved data, hide the message after 5 seconds
	if (hasData) {
		setTimeout(() => {
			setShowRestoredMessage(false);
		}, 5000);
	}
};
