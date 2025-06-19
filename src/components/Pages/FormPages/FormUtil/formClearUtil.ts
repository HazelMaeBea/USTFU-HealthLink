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
 * Checks if a form has saved data with real user-entered content and displays a message accordingly
 * @param formType Unique identifier for the form
 * @param setShowRestoredMessage Function to set state for showing restored message
 */
export const checkForRestoredFormData = (
	formType: string,
	setShowRestoredMessage: Dispatch<SetStateAction<boolean>>
): void => {
	try {
		console.log("Running updated checkForRestoredFormData function - version 4");
		
		// Check if this is a brand new session using sessionStorage
		const sessionKey = `session_checked_${formType}`;
		const hasCheckedThisSession = sessionStorage.getItem(sessionKey);
		
		// If we've already checked in this browser session, don't show the notification again
		if (hasCheckedThisSession) {
			console.log(`Already checked form ${formType} in this session, not showing notification`);
			setShowRestoredMessage(false);
			return;
		}
		
		// Mark that we've checked in this session
		sessionStorage.setItem(sessionKey, "true");
		
		// Direct check for user-entered data in localStorage
		const savedData = localStorage.getItem(`form_${formType}`);
		if (!savedData) {
			setShowRestoredMessage(false);
			return;
		}

		// Parse the saved data
		const data = JSON.parse(savedData);
		
		// Check for last save timestamp
		const lastSaveTimeKey = `last_save_time_${formType}`;
		const lastSaveTime = localStorage.getItem(lastSaveTimeKey);
		const currentTime = Date.now();
		
		// If we have a last save time, check if enough time has passed (e.g., 1 hour = 3600000ms)
		const TIME_THRESHOLD = 1800000; // 30 minutes
		let hasBeenAway = false;
		
		if (lastSaveTime) {
			const timeDiff = currentTime - parseInt(lastSaveTime);
			hasBeenAway = timeDiff > TIME_THRESHOLD;
			console.log(`Time since last save: ${timeDiff/60000} minutes, threshold: ${TIME_THRESHOLD/60000} minutes`);
		} else {
			// If no timestamp exists, this might be data from a previous session
			hasBeenAway = true;
		}
		
		// Update the save time for next check
		localStorage.setItem(lastSaveTimeKey, currentTime.toString());

		// If all values are empty, null, or undefined, don't show the message
		const allEmpty = Object.entries(data).every(([key, value]) => {
			// Skip checking certain autofill fields
			if (
				[
					"gender",
					"college",
					"term",
					"year",
					"status",
					"benefits",
					"hospitalStatus",
				].includes(key)
			) {
				return true;
			}

			// For strings, check if they're empty
			if (typeof value === "string") {
				return value === "";
			}

			// For other types, check if they're null or undefined
			return value === null || value === undefined;
		});

		if (allEmpty) {
			console.log(`Form ${formType} data is empty or contains only autofill values`);
			setShowRestoredMessage(false);
			return;
		}

		// Check for fields that would definitely indicate user-entered data
		const userFields = [
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

		const hasUserEnteredData = userFields.some((field) => {
			return (
				data[field] !== undefined &&
				data[field] !== null &&
				data[field] !== ""
			);
		});

		// Only show notification if:
		// 1. There is user-entered data
		// 2. User has been away for some time (or we don't know when they last saved)
		const shouldShowNotification = hasUserEnteredData && hasBeenAway;
		
		console.log(`Form ${formType} has user data: ${hasUserEnteredData}, has been away: ${hasBeenAway}`);
		console.log(`Should show restored notification: ${shouldShowNotification}`);
		
		setShowRestoredMessage(shouldShowNotification);

		// If showing notification, hide it after 5 seconds
		if (shouldShowNotification) {
			setTimeout(() => {
				setShowRestoredMessage(false);
			}, 5000);
		}
	} catch (error) {
		console.error("Error checking for form data to restore:", error);
		setShowRestoredMessage(false);
	}
};
