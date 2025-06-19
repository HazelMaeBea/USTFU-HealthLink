import { getStorage, ref, deleteObject } from "firebase/storage";
import { auth } from "../contexts/firebase";

// Key for storing temp file paths in localStorage
export const TEMP_FILES_KEY = "tempUploadedFiles";

/**
 * Stores temporary file paths in localStorage with timestamp and form type
 * @param tempPaths Array of temporary file paths
 * @param formType The type of form these files belong to
 */
export const storeTempFilePaths = (
	tempPaths: string[],
	formType: string
): void => {
	try {
		// Get existing temp files or initialize empty array
		const existingTempFiles = JSON.parse(
			localStorage.getItem(TEMP_FILES_KEY) || "[]"
		);

		// Add new temp files with metadata
		const tempFilesWithMetadata = tempPaths.map((path) => ({
			path,
			timestamp: Date.now(),
			formType,
			email: auth?.currentUser?.email || "unknown",
		}));

		// Combine with existing temp files
		const allTempFiles = [...existingTempFiles, ...tempFilesWithMetadata];

		// Store in localStorage
		localStorage.setItem(TEMP_FILES_KEY, JSON.stringify(allTempFiles));

		console.log(
			`Stored ${tempPaths.length} temporary file paths for form type: ${formType}`
		);
	} catch (error) {
		console.error("Error storing temporary file paths:", error);
	}
};

/**
 * Removes temporary file paths from localStorage when they're no longer needed
 * @param tempPaths Array of temporary file paths to remove
 */
export const removeTempFilePathsFromStorage = (tempPaths: string[]): void => {
	try {
		if (!tempPaths.length) return;

		// Get existing temp files
		const existingTempFiles = JSON.parse(
			localStorage.getItem(TEMP_FILES_KEY) || "[]"
		);

		// Filter out the paths that are now permanent
		const remainingTempFiles = existingTempFiles.filter(
			(file: { path: string }) => !tempPaths.includes(file.path)
		);

		// Update localStorage
		localStorage.setItem(
			TEMP_FILES_KEY,
			JSON.stringify(remainingTempFiles)
		);

		console.log(
			`Removed ${tempPaths.length} temporary file paths from storage`
		);
	} catch (error) {
		console.error(
			"Error removing temporary file paths from storage:",
			error
		);
	}
};

/**
 * Cleans up temporary files older than the specified retention period
 * @param retentionDays Number of days to keep temporary files (default: 7)
 */
export const cleanupOldTempFiles = async (retentionDays = 7): Promise<void> => {
	try {
		const storage = getStorage();
		const existingTempFiles = JSON.parse(
			localStorage.getItem(TEMP_FILES_KEY) || "[]"
		);

		if (!existingTempFiles.length) return;

		const now = Date.now();
		const retentionPeriodMs = retentionDays * 24 * 60 * 60 * 1000;
		const pathsToDelete: string[] = [];

		// Identify temp files older than retention period
		const filteredTempFiles = existingTempFiles.filter(
			(file: { path: string; timestamp: number }) => {
				const isOld = now - file.timestamp > retentionPeriodMs;
				if (isOld) {
					pathsToDelete.push(file.path);
				}
				return !isOld; // Keep files that aren't old
			}
		);

		// Delete old files from Firebase Storage
		for (const path of pathsToDelete) {
			try {
				const fileRef = ref(storage, path);
				await deleteObject(fileRef);
				console.log(`Deleted old temporary file: ${path}`);
			} catch (error) {
				console.error(`Error deleting file ${path}:`, error);
			}
		}

		// Update localStorage with remaining files
		localStorage.setItem(TEMP_FILES_KEY, JSON.stringify(filteredTempFiles));

		console.log(`Cleaned up ${pathsToDelete.length} old temporary files`);
	} catch (error) {
		console.error("Error cleaning up old temporary files:", error);
	}
};

/**
 * Cleans up temporary files for a specific form type
 * @param formType The type of form to clean up files for
 * @param userEmail User email to ensure we only delete their files
 */
export const cleanupFormTempFiles = async (
	formType: string,
	userEmail?: string
): Promise<void> => {
	try {
		const storage = getStorage();
		const existingTempFiles = JSON.parse(
			localStorage.getItem(TEMP_FILES_KEY) || "[]"
		);

		if (!existingTempFiles.length) return;

		const email = userEmail || auth?.currentUser?.email || "unknown";

		// Find temp files for this form type and user
		const filesToDelete = existingTempFiles.filter(
			(file: { formType: string; email: string }) =>
				file.formType === formType && file.email === email
		);

		// Get paths to delete
		const pathsToDelete = filesToDelete.map(
			(file: { path: string }) => file.path
		);

		// Delete files from Firebase Storage
		for (const path of pathsToDelete) {
			try {
				const fileRef = ref(storage, path);
				await deleteObject(fileRef);
				console.log(
					`Deleted temporary file for form ${formType}: ${path}`
				);
			} catch (error) {
				console.error(`Error deleting file ${path}:`, error);
			}
		}

		// Update localStorage by removing deleted paths
		const updatedTempFiles = existingTempFiles.filter(
			(file: { path: string }) => !pathsToDelete.includes(file.path)
		);

		localStorage.setItem(TEMP_FILES_KEY, JSON.stringify(updatedTempFiles));

		console.log(
			`Cleaned up ${pathsToDelete.length} temporary files for form type: ${formType}`
		);
	} catch (error) {
		console.error(
			`Error cleaning up temporary files for form type ${formType}:`,
			error
		);
	}
};

/**
 * Initialize file cleanup system - should be called at app startup
 */
export const initFileCleanupSystem = (): void => {
	// Clean up old temp files on startup
	cleanupOldTempFiles();

	// Schedule regular cleanup (once per day)
	const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
	setInterval(() => {
		cleanupOldTempFiles();
	}, CLEANUP_INTERVAL);

	console.log("File cleanup system initialized");
};
