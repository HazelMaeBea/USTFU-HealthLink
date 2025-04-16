/**
 * Converts a date string from YYYY-MM-DD to MM/DD/YYYY format
 */
export const convertToMMDDYYYY = (
	dateStr: string | null | undefined
): string | null => {
	if (!dateStr) return null;

	// Handle already formatted MM/DD/YYYY strings
	if (dateStr.includes("/")) return dateStr;

	try {
		const [year, month, day] = dateStr.split("-");
		return `${month}/${day}/${year}`;
	} catch (error) {
		console.error("Date conversion error:", error);
		return null;
	}
};

/**
 * Converts a date string from MM/DD/YYYY to YYYY-MM-DD format
 */
export const convertToYYYYMMDD = (
	dateStr: string | null | undefined
): string | null => {
	if (!dateStr) return null;

	// Handle already formatted YYYY-MM-DD strings
	if (dateStr.includes("-")) return dateStr;

	try {
		const [month, day, year] = dateStr.split("/");
		return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
	} catch (error) {
		console.error("Date conversion error:", error);
		return null;
	}
};

/**
 * Format Date object to MM/DD/YYYY string
 */
export const formatDateToMMDDYYYY = (
	date: Date | null | undefined
): string | null => {
	if (!date) return null;
	if (!(date instanceof Date) || isNaN(date.getTime())) return null;

	try {
		const month = (date.getMonth() + 1).toString().padStart(2, "0");
		const day = date.getDate().toString().padStart(2, "0");
		const year = date.getFullYear();
		return `${month}/${day}/${year}`;
	} catch (error) {
		console.error("Date formatting error:", error);
		return null;
	}
};

/**
 * Format Date object to YYYY-MM-DD string (for HTML date inputs)
 */
export const formatDateToYYYYMMDD = (date: Date | null | undefined): string => {
	if (!date) return "";
	if (!(date instanceof Date) || isNaN(date.getTime())) return "";

	try {
		return date.toISOString().split("T")[0];
	} catch (error) {
		console.error("Date formatting error:", error);
		return "";
	}
};

/**
 * Parse any date string or Date object to a Date object
 * Handles both MM/DD/YYYY and YYYY-MM-DD formats
 */
export const parseToDate = (
	dateValue: string | Date | null | undefined
): Date | null => {
	if (!dateValue) return null;

	if (dateValue instanceof Date) {
		return isNaN(dateValue.getTime()) ? null : dateValue;
	}

	try {
		// Handle MM/DD/YYYY
		if (dateValue.includes("/")) {
			const [month, day, year] = dateValue
				.split("/")
				.map((part) => parseInt(part, 10));
			if (isNaN(month) || isNaN(day) || isNaN(year)) return null;
			return new Date(year, month - 1, day);
		}
		// Handle YYYY-MM-DD
		else if (dateValue.includes("-")) {
			const [year, month, day] = dateValue
				.split("-")
				.map((part) => parseInt(part, 10));
			if (isNaN(month) || isNaN(day) || isNaN(year)) return null;
			return new Date(year, month - 1, day);
		}
		// Try direct parsing
		const directDate = new Date(dateValue);
		return isNaN(directDate.getTime()) ? null : directDate;
	} catch (error) {
		console.error("Date parsing error:", error);
		return null;
	}
};

/**
 * Format a date for display in UI
 */
export const formatDateForDisplay = (
	dateStr: string | Date | null | undefined
): string => {
	if (!dateStr) return "-";

	const date = parseToDate(dateStr);
	if (!date) return "-";

	return date.toLocaleDateString();
};

/**
 * Check if a string is a valid date in either MM/DD/YYYY or YYYY-MM-DD format
 */
export const isValidDateString = (
	dateStr: string | null | undefined
): boolean => {
	if (!dateStr) return false;
	return parseToDate(dateStr) !== null;
};
