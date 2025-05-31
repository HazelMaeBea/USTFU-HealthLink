import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storeTempFilePaths } from './fileCleanup';

export interface UploadProgress {
  progress: number;
  status: "idle" | "uploading" | "success" | "error";
  url: string | null;
  tempPath: string | null;
  error?: string;
}

/**
 * Uploads a file with progress tracking
 * 
 * @param file The file to upload
 * @param fieldName Field name for the file (e.g. "applicantSignature")
 * @param email User email for folder organization
 * @param progressCallback Callback function to report progress
 * @param formType Type of form (e.g., "eyeglasses", "hospital", "admission", etc.)
 * @returns Promise with the download URL and temporary path
 */
export const uploadFileWithProgress = async (
  file: File,
  fieldName: string,
  email: string | null | undefined,
  progressCallback: (fieldName: string, progress: UploadProgress) => void,
  formType: string = 'unknown'
): Promise<{ url: string; tempPath: string }> => {
  const storage = getStorage();
  
  // Generate unique file identifier
  const timestamp = Date.now();
  const uniqueId = Math.random().toString(36).substring(2, 10);
  
  // Create a temporary path for the file that includes the original filename
  // We use "temp" in the path to indicate this is a temporary file
  const safeFilename = encodeURIComponent(file.name.replace(/[^a-zA-Z0-9._-]/g, '_'));
  const tempPath = `uploads/${email || 'anonymous'}/temp/${fieldName}_${timestamp}_${uniqueId}_${safeFilename}`;
  const storageRef = ref(storage, tempPath);
  
  // Start the upload
  const uploadTask = uploadBytesResumable(storageRef, file);
  
  // Create a promise that resolves when the upload is complete
  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        // Calculate progress
        const progress = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        
        // Report progress through callback
        progressCallback(fieldName, {
          progress,
          status: "uploading",
          url: null,
          tempPath
        });
      },
      (error) => {
        // Handle unsuccessful uploads
        console.error(`Error uploading file ${fieldName}:`, error);
        progressCallback(fieldName, {
          progress: 0,
          status: "error",
          url: null,
          tempPath: null,
          error: error.message
        });
        reject(error);
      },
      async () => {
        // Handle successful upload
        try {
          // Get download URL
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          
          // Report success
          progressCallback(fieldName, {
            progress: 100,
            status: "success",
            url,
            tempPath
          });
          
          // Store this temp path with form type for potential cleanup
          storeTempFilePaths([tempPath], formType);
          
          // Resolve with URL and temp path
          resolve({ url, tempPath });
        } catch (error) {
          console.error("Error getting download URL:", error);
          progressCallback(fieldName, {
            progress: 0,
            status: "error",
            url: null,
            tempPath: null,
            error: "Failed to get download URL"
          });
          reject(error);
        }
      }
    );
  });
};
