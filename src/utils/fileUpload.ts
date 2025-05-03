import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "../contexts/firebase";
import imageCompression from "browser-image-compression";

interface FileUploadResult {
	url: string;
	filename: string;
}

// Maximum file size in MB
const MAX_FILE_SIZE_MB = 5;
// Maximum file size in bytes (5MB)
export const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

/**
 * Checks if a file is within the acceptable size limit
 * @param file The file to check
 * @returns An object with the validation result and error message if any
 */
export const validateFileSize = (
	file: File | null | undefined
): { valid: boolean; errorMessage: string } => {
	if (!file) {
		return { valid: true, errorMessage: "" };
	}

	if (file.size > MAX_FILE_SIZE) {
		const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
		return {
			valid: false,
			errorMessage: `File is too large (${fileSizeMB}MB). Maximum file size is ${MAX_FILE_SIZE_MB}MB.`,
		};
	}

	return { valid: true, errorMessage: "" };
};

/**
 * Validates a FileList to ensure all files are within size limits
 * @param fileList The FileList to check
 * @returns An object with the validation result and error message if any
 */
export const validateFileListSize = (
	fileList: FileList | null | undefined
): { valid: boolean; errorMessage: string } => {
	if (!fileList || fileList.length === 0) {
		return { valid: true, errorMessage: "" };
	}

	for (let i = 0; i < fileList.length; i++) {
		const result = validateFileSize(fileList[i]);
		if (!result.valid) {
			return result;
		}
	}

	return { valid: true, errorMessage: "" };
};

/**
 * Optimize image files before upload (if they are images)
 */
const optimizeImageIfNeeded = async (file) => {
	// First check file size - if it's already small, skip compression
	if (file.size <= 500 * 1024) {
		// Less than 500KB
		return file;
	}

	const isImage = file.type.startsWith("image/");

	if (isImage) {
		// More aggressive compression options
		const options = {
			maxSizeMB: 0.5,
			maxWidthOrHeight: 1280,
			useWebWorker: true,
		};

		try {
			console.log(
				`Compressing image: ${file.name} (${(
					file.size /
					1024 /
					1024
				).toFixed(2)}MB)`
			);
			const compressedFile = await imageCompression(file, options);
			console.log(
				`Compressed to: ${(compressedFile.size / 1024 / 1024).toFixed(
					2
				)}MB`
			);
			return compressedFile;
		} catch (error) {
			console.error(
				"Image compression failed, using original file:",
				error
			);
			return file;
		}
	}

	return file;
};

/**
 * Check if file size exceeds the limit
 * @deprecated Use validateFileSize instead for more detailed error messages
 */
const validateFileSizeLegacy = (file: File): boolean => {
	const fileSizeMB = file.size / (1024 * 1024);
	if (fileSizeMB > MAX_FILE_SIZE_MB) {
		alert(
			`File ${file.name} is too large (${fileSizeMB.toFixed(
				2
			)}MB). Maximum allowed size is ${MAX_FILE_SIZE_MB}MB.`
		);
		return false;
	}
	return true;
};

/**
 * Upload multiple files to Firebase Storage and return their download URLs
 *
 * @param email User's email for path construction
 * @param transactionId Transaction ID for path construction
 * @param files Object with field names as keys and FileList or File[] or undefined as values
 * @returns Object with field names as keys and download URLs as values
 */
export const uploadFilesAndGetURLs = async (
	email: string | null | undefined,
	transactionId: string,
	files: {
		[key: string]: FileList | File[] | undefined;
	}
): Promise<{ [key: string]: string }> => {
	const results: { [key: string]: string } = {};

	console.log("Files to upload:", Object.keys(files));
    console.log("Storage instance:", storage);
    console.log("Using transaction ID:", transactionId);
    console.log("Using email:", email);

	// Process each file in the files object
	for (const [fieldName, fileListOrArray] of Object.entries(files)) {
		console.log(`Processing ${fieldName}:`, fileListOrArray);

		// Skip if fileListOrArray is undefined or empty
		if (!fileListOrArray) {
			console.log(`Skipping ${fieldName} - no file provided (undefined)`);
			continue;
		}

		if (fileListOrArray.length === 0) {
			console.log(`Skipping ${fieldName} - no file provided (length 0)`);
			continue;
		}

		try {
			// Get the first file from the FileList or array
			const file = fileListOrArray[0];

			// Skip if the actual file is undefined
			if (!file) {
				console.log(`Skipping ${fieldName} - file is undefined`);
				continue;
			}

			console.log(
				`Processing ${fieldName}: ${file.name} (${file.size} bytes)`
			);

			// Optimize the file if it's an image
			const optimizedFile = await optimizeImageIfNeeded(file);
			console.log(
				`File ${
					optimizedFile === file ? "not optimized" : "optimized"
				}: ${optimizedFile.size} bytes`
			);

			// Create reference path for the file
			const storagePath = `${email}/${transactionId}/${fieldName}/${file.name}`;
			console.log("Storage path:", storagePath);
			const storageRef = ref(storage, storagePath);
            console.log("Storage reference created:", storageRef);

			// Upload the optimized file
			const uploadResult = await uploadBytes(storageRef, optimizedFile);
            console.log("Upload completed:", uploadResult);

			// Get download URL
			const downloadURL = await getDownloadURL(storageRef);
			console.log(
				`Full download URL for ${fieldName}: ${downloadURL}`
			);

			// Store the download URL in the results
			results[fieldName] = downloadURL;
		} catch (error) {
			console.error(`Error uploading ${fieldName}:`, error);
            console.error("Error details:", JSON.stringify(error));
			// Add empty string for failed uploads to ensure the property exists
			results[fieldName] = "";
		}
	}

	console.log("Final upload results:", results);
	return results;
};

/**
 * Upload a single file with progress tracking
 * For future use with progress indicators
 */
export const uploadSingleFileWithProgress = async (
	email: string | null | undefined,
	formIDString: string,
	fieldName: string,
	file: File,
	onProgress?: (progress: number) => void
): Promise<FileUploadResult> => {
	// This is a placeholder for future implementation with progress tracking
	// To be implemented when Firebase Storage supports progress tracking in v9

	// For now, use the batch upload method
	const files = {
		[fieldName]: { 0: file, length: 1 } as unknown as FileList,
	};
	const results = await uploadFilesAndGetURLs(email, formIDString, files);
	return { url: results[fieldName], filename: file.name };
};

/**
 * Deletes a file from storage given its URL
 */
export async function deleteFileFromURL(url: string): Promise<void> {
	if (!url || typeof url !== "string") {
		console.warn("Invalid URL provided to deleteFileFromURL:", url);
		return;
	}

	try {
		// Extract the path from the download URL
		// Firebase Storage URLs have the format: https://firebasestorage.googleapis.com/v0/b/bucket-name/o/encoded-path?alt=media&token=...
		const encodedPath = url.split("/o/")[1]?.split("?")[0];

		if (!encodedPath) {
			console.error("Could not extract path from URL:", url);
			return;
		}

		// Decode the path
		const path = decodeURIComponent(encodedPath);

		// Create a reference to the file
		const fileRef = ref(storage, path);

		// Delete the file
		await deleteObject(fileRef);
		console.log(`Successfully deleted file: ${path}`);
	} catch (error) {
		console.error("Error deleting file:", error);
		// Don't throw the error, as this is a cleanup operation
		// and we don't want it to break the form submission flow
	}
}
