import { UseFormReset } from "react-hook-form";
import { UnifiedFormData } from "./formTypes";
import { Dispatch, SetStateAction } from "react";
import { clearFormData } from "./formPresistence";

interface ClearFormOptions {
	formType: string;
	reset: UseFormReset<UnifiedFormData>;
	setDateHired?: Dispatch<SetStateAction<Date | null>>;
	setDateRetired?: Dispatch<SetStateAction<Date | null>>;
	setPhoneInputValue?: Dispatch<SetStateAction<string>>;
	setShouldReapplyAutofill: Dispatch<SetStateAction<boolean>>;
	setShowClearSuccess: Dispatch<SetStateAction<boolean>>;
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
		additionalStates,
	} = options;

	// Reset form fields to default values
	reset({
		gender: undefined,
		college: "",
		term: "",
		year: "",
		status: "",
		benefits: "",
		hmo: "",
		certify: undefined,
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
		Object.entries(additionalStates).forEach(([_, setter]) => {
			// Check if it's an object setter (for state objects)
			if (typeof setter === "function") {
				try {
					// Try setting to empty object or initial value
					setter({});
				} catch (e) {
					// If error, try setting to false (for boolean states)
					try {
						setter(false);
					} catch (e2) {
						// If still error, try null
						setter(null);
					}
				}
			}
		});
	}

	// Flag to reapply autofill
	setShouldReapplyAutofill(true);

	// Clear persisted form data
	clearFormData(formType);

	// Scroll to top
	window.scrollTo({ top: 0, behavior: "smooth" });

	// Show success notification
	setShowClearSuccess(true);

	// Hide success notification after 3 seconds
	setTimeout(() => {
		setShowClearSuccess(false);
	}, 3000);
};
