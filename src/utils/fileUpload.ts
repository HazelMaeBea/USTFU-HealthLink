import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../contexts/firebase";
import imageCompression from "browser-image-compression";

interface FileUploadResult {
	url: string;
	filename: string;
}

interface FileUploadMap {
	[key: string]: FileUploadResult;
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
 * @param formIDString Form ID for path construction
 * @param files Object with field names as keys and File objects as values
 * @returns Object with field names as keys and {url, filename} objects as values
 */
export const uploadFilesAndGetURLs = async (
	email: string | null | undefined,
	formIDString: string,
	files: Record<string, FileList>
): Promise<FileUploadMap> => {
	const currentYear = new Date().getFullYear().toString();
	const basePath = `FormRequests/${email}/${currentYear}-${formIDString}-O`;

	// Create batches of promises to avoid overwhelming Firebase
	const resultMap: FileUploadMap = {};
	const validFiles: { field: string; file: File }[] = [];

	// First validate all files
	for (const [field, fileList] of Object.entries(files)) {
		if (fileList && fileList.length > 0) {
			const file = fileList[0];
			if (validateFileSizeLegacy(file)) {
				validFiles.push({ field, file });
			} else {
				// Skip this file but provide a placeholder
				resultMap[field] = {
					url: "",
					filename: "File too large - skipped",
				};
			}
		}
	}

	// Process files in batches of 2
	const BATCH_SIZE = 2;
	for (let i = 0; i < validFiles.length; i += BATCH_SIZE) {
		const batch = validFiles.slice(i, i + BATCH_SIZE);

		// Process batch in parallel
		const batchPromises = batch.map(async ({ field, file }) => {
			try {
				// Optimize file if it's an image
				const optimizedFile = await optimizeImageIfNeeded(file);

				// Upload to Firebase
				const filePath = `${basePath}/${file.name}`;
				const storageRef = ref(storage, filePath);

				await uploadBytes(storageRef, optimizedFile);
				const url = await getDownloadURL(storageRef);

				// Store result
				resultMap[field] = {
					url,
					filename: file.name,
				};
			} catch (error) {
				console.error(`Error uploading ${field}:`, error);
				resultMap[field] = {
					url: "",
					filename: `Upload failed: ${
						error instanceof Error ? error.message : "Unknown error"
					}`,
				};
			}
		});

		// Wait for all files in this batch to finish
		await Promise.all(batchPromises);
	}

	return resultMap;
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
	return results[fieldName];
};
