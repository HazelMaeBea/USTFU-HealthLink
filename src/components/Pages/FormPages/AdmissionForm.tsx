import { useState, useEffect, useRef } from "react";
import { FieldValues, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import "react-datepicker/dist/react-datepicker.css";
import "./FormComponents/FormBody.css";
import FormHeader from "./FormComponents/FormHeader.tsx";
import FormPersonalInfo from "./FormComponents/FormPersonalInfo.tsx";
import FormUploadDisclaimer from "./FormComponents/FormUploadDisclaimer.tsx";
import FormCertify from "./FormComponents/FormCertify.tsx";
import AdmissionTeachingInfo from "./FormComponents/AdmissionTeachingInfo.tsx";
import ValidationErrorDropdown from "./FormComponents/ValidationErrorDropdown.tsx";
import { addDoc, collection } from "firebase/firestore";
import { auth, db } from "../../../contexts/firebase.ts";
import BackButton from "../../Page Elements/BackButton/BackButton.tsx";
import RemainingBenefit from "./RemainingBenefitPopout/RemainingBenefit.tsx";
import { useAutofill, applyAutofill } from "./FormUtil/Autofill.ts";
import { useNavigate } from "react-router-dom";
import Popout from "../../Page Elements/Popout/Popout.tsx";
import {
  FiCheck,
  FiArrowRight,
  FiX,
  FiInfo,
  FiUploadCloud,
} from "react-icons/fi";
import {
  uploadFilesAndGetURLs,
  validateFileListSize,
} from "../../../utils/fileUpload.ts";
import {
  uploadFileWithProgress,
  UploadProgress,
} from "../../../utils/progressiveUpload";
import { baseFormSchema, UnifiedFormData } from "./FormUtil/formTypes.ts";
import { pushPendingNotification } from "../../Page Elements/NotifBadge/NotifTrigger.ts";
import { useRevisionStore } from "../../Page Elements/RevisionFuncs/revisionStore.ts";
import { useRemoveRequest } from "../../Page Elements/RevisionFuncs/removeRequest.ts";
import ViewFiles from "../../Page Elements/ViewFiles/ViewFiles.tsx";
import {
  saveFormData,
  loadFormData,
  clearFormData,
  hasSavedFormData,
} from "./FormUtil/formPresistence.ts";
import { checkForRestoredFormData } from "./FormUtil/formClearUtil.ts";
import { clearForm } from "./FormUtil/formClearUtil.ts";
import {
  cleanupFormTempFiles,
  removeTempFilePathsFromStorage,
} from "../../../utils/fileCleanup";

type FileState = {
  [key: string]: string | null; // Each field (e.g., "applicantSignature") can have a string (file URL) or null
};

const fileFields = [
  "employeeID",
  "applicantSignature",
  "docRequest",
  "hospitalInvoice",
  "labInvoice",
] as const;

type FileField = (typeof fileFields)[number];

let pendingUnmountId: string | null = null;

// Extended the base schema with admission-specific fields
const schema = baseFormSchema
  .extend({
    idNumber: z
      .string({
        required_error: "Please enter your ID number",
        invalid_type_error: "ID number must be text",
      })
      .min(1, "Please enter your ID number"),
    address: z
      .string({
        required_error: "Please enter your address",
        invalid_type_error: "Address must be text",
      })
      .min(1, "Please enter your address"),
    load: z.coerce
      .number({
        required_error: "Please enter your teaching load",
        invalid_type_error: "Teaching load must be a number",
      })
      .min(0, "Teaching load cannot be negative")
      .max(30, "Teaching load cannot exceed 30 units"),
    status: z.string().nonempty("Please select your employment status"),
    benefits: z.string().optional(),
    hmo: z.string().optional(),
    dateHired: z
      .string({
        invalid_type_error: "Please select a valid date",
      })
      .nullable()
      .transform((val) => (val ? new Date(val) : null))
      .optional(),
    dateRetired: z
      .string({
        invalid_type_error: "Please select a valid date",
      })
      .nullable()
      .transform((val) => (val ? new Date(val) : null))
      .optional(),
    docRequest: z.any().refine((files) => files && files.length > 0, {
      message: "Doctor's note or request is required",
    }),
    hospitalInvoice: z.any().refine((files) => files && files.length > 0, {
      message: "Hospital invoice is required",
    }),
    labInvoice: z.any().refine((files) => files && files.length > 0, {
      message: "Laboratory invoice is required",
    }),
    employeeID: z.any().nullable().optional(),
    applicantSignature: z.any().refine((files) => files && files.length > 0, {
      message: "Please upload your signature",
    }),
    claimRequestCount: z.coerce
      .number({
        invalid_type_error: "Please enter a valid number",
        required_error: "Number of claims is required",
      })
      .min(1, "Please enter at least 1 claim")
      .max(10, "Maximum of 10 claims allowed"),
  })
  .omit({ claimRequestCount: true })
  .superRefine((data, ctx) => {
    if (data.status === "Tenured-Track" && !data.dateHired) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Please provide your date of hire as a Tenure-Track faculty member",
        path: ["dateHired"],
      });
    }
    if (data.status === "Retiree" && !data.dateRetired) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please provide your retirement date",
        path: ["dateRetired"],
      });
    }
    // If benefits is HMO, hmo field is required
    if (data.benefits === "HMO" && (!data.hmo || data.hmo.trim() === "")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please specify your HMO provider name",
        path: ["hmo"],
      });
    }
  });

const AdmissionForm = () => {
  const [dateHired, setDateHired] = useState<Date | null>(null);
  const [dateRetired, setDateRetired] = useState<Date | null>(null);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [isNotificationHiding, setIsNotificationHiding] = useState(false);
  const [showClearConfirmation, setShowClearConfirmation] =
    useState<boolean>(false);
  const [formIdString, setFormIdString] = useState<string>("");
  const [submissionStatus, setSubmissionStatus] = useState<
    "processing" | "success" | "error"
  >("processing");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [phoneInputValue, setPhoneInputValue] = useState<string>("+63");
  const [shouldReapplyAutofill, setShouldReapplyAutofill] = useState(false);
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});
  const [showClearSuccess, setShowClearSuccess] = useState(false);
  const [showRestoredMessage, setShowRestoredMessage] = useState(false);
  const navigate = useNavigate();

  const [uploadedFiles, setUploadedFiles] = useState<
    Record<string, { url: string; tempPath: string; filename: string }> // Modified to include filename
  >({});

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    setError,
    formState: { errors, isSubmitted },
  } = useForm<UnifiedFormData>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      gender: undefined,
      college: "",
      status: "",
    },
  });

  // load saved data on mount
  useEffect(() => {
    const savedData = loadFormData("admission");
    if (savedData) {
      reset(savedData);
      // Display message that form was restored from previous session
      checkForRestoredFormData("admission", setShowRestoredMessage);
    }
  }, [reset]);

  const formSaveTimeout = useRef<NodeJS.Timeout | null>(null);

  // auto save data on change with debouncing
  useEffect(() => {
    const subscription = watch((value) => {
      // We don't want to save empty forms
      if (
        Object.keys(value).some((key) => {
          const formKey = key as keyof typeof value;
          return (
            value[formKey] !== undefined &&
            value[formKey] !== null &&
            value[formKey] !== "" &&
            !(value[formKey] instanceof FileList)
          );
        })
      ) {
        // Use setTimeout to debounce (only save after 500ms of no changes)
        if (formSaveTimeout.current) {
          clearTimeout(formSaveTimeout.current);
        }

        formSaveTimeout.current = setTimeout(() => {
          saveFormData("admission", value);
        }, 500);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (formSaveTimeout.current) {
        clearTimeout(formSaveTimeout.current);
      }
    };
  }, [watch]);

  const [files, setFiles] = useState<Record<string, string | null>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  // const [previewFile, setPreviewFile] = useState<any>(null);
  const [previewFile, setPreviewFile] = useState<any>(null);
  const [isFileInput, setIsFileInput] = useState<Record<FileField, boolean>>({
    employeeID: false,
    applicantSignature: false,
    docRequest: false,
    hospitalInvoice: false,
    labInvoice: false,
  });
  const { formData, isRevisionMode, transactionId } = useRevisionStore();
  const resetRevision = useRevisionStore((state) => state.resetRevision);
  const updateFileInputStates = (newFiles: any) => {
    const inputStates = Object.fromEntries(
      fileFields.map((key) => [key, Boolean(newFiles[key])])
    ) as Record<FileField, boolean>;
    setIsFileInput(inputStates);
  };
  const [isNewUpload, setIsNewUpload] = useState({
    employeeID: false,
    applicantSignature: false,
    docRequest: false,
    hospitalInvoice: false,
    labInvoice: false,
  });

  useEffect(() => {
    return () => {
      console.log("Component unmounting...");
      console.log("isRevisionMode:", isRevisionMode);
      console.log("transactionId:", transactionId);

      pendingUnmountId = transactionId;

      setTimeout(() => {
        const {
          transactionId: currentId,
          isRevisionMode: currentRev,
          resetRevision,
        } = useRevisionStore.getState();

        // Only reset if the same transactionId hasn’t come back
        if (pendingUnmountId === currentId && currentRev) {
          console.log("Resetting revision due to true unmount");
          resetRevision();
        } else {
          console.log("Skipping resetRevision - likely remounted");
        }

        pendingUnmountId = null;
      }, 100);
    };
  }, [transactionId]);

  useEffect(() => {
    if (transactionId) {
      if (pendingUnmountId === transactionId) {
        console.log("Remount detected - preventing reset");
        pendingUnmountId = null;
      }
    }
  }, [transactionId]);

  useEffect(() => {
    if (isRevisionMode && formData) {
      // Populate form values
      Object.keys(formData).forEach((key) => {
        setValue(
          key as keyof UnifiedFormData,
          formData[key as keyof UnifiedFormData]
        );
      });

      // Set files based on formData
      const prefills: Record<string, string | null> = {
        applicantSignature: formData.applicantSignature?.url || null,
        docRequest: formData.docRequest?.url || null,
        hospitalInvoice: formData.hospitalInvoice?.url || null,
        labInvoice: formData.labInvoice?.url || null,
        employeeID: formData.employeeID?.url || null,
      };
      setFiles(prefills);
      updateFileInputStates(prefills);

      const revisionUploadedFiles: Record<
        string,
        { url: string; tempPath: string; filename: string }
      > = {};
      fileFields.forEach((field) => {
        const fileData = formData[field as keyof UnifiedFormData] as
          | { url?: string; filename?: string }
          | undefined;
        if (fileData?.url && fileData?.filename) {
          revisionUploadedFiles[field] = {
            url: fileData.url,
            tempPath: "", // TempPath is not available for existing files
            filename: fileData.filename,
          };
        }
      });
      setUploadedFiles(revisionUploadedFiles);
    }
  }, [formData, isRevisionMode, setValue]);

  useEffect(() => {
    if (isRevisionMode && files) {
      updateFileInputStates(files);
      console.log(`Updated isFileInput: ${JSON.stringify(isFileInput)}`);
    }
  }, [files, isRevisionMode]);

  useEffect(() => {
    console.log("isRevisionMode changed:", isRevisionMode);
  }, [isRevisionMode]);

  useEffect(() => {
    console.log("Files state changed:", files);
  }, [files]);

  useAutofill(setValue, setDateHired, setDateRetired, setPhoneInputValue);
  // Re-apply autofill after form is cleared
  useEffect(() => {
    if (shouldReapplyAutofill) {
      // Use applyAutofill function directly, not the hook
      applyAutofill(setValue, setDateHired, setDateRetired, setPhoneInputValue);
      setShouldReapplyAutofill(false);
    }
  }, [
    shouldReapplyAutofill,
    setValue,
    setDateHired,
    setDateRetired,
    setPhoneInputValue,
  ]);

  const closeNotification = () => {
    setIsNotificationHiding(true);

    setTimeout(() => {
      setShowSuccessNotification(false);
      setIsNotificationHiding(false);
    }, 300);
  };

  const handleTrackingClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate("/tracking");
  };

  const handleClearConfirm = () => {
    // Clear form using utility function
    clearForm({
      formType: "admission",
      reset,
      setDateHired,
      setDateRetired,
      setPhoneInputValue,
      setShouldReapplyAutofill,
      setShowClearSuccess,
      setShowRestoredMessage,
      additionalStates: {
        setFiles,
        setFileErrors,
        setIsNewUpload,
        setIsFileInput,
        setUploadedFiles,
      },
    });

    // Close confirmation dialog
    setShowClearConfirmation(false);
  };

  const handleClearCancel = () => {
    setShowClearConfirmation(false);
  };

  // Add state to track file names
  const [fileNames, setFileNames] = useState<Record<string, string>>({
    employeeID: "",
    applicantSignature: "",
    docRequest: "",
    hospitalInvoice: "",
    labInvoice: "",
  });

  // Handler for file changes that performs progressive upload
  const handleChange = async (
    fieldName: keyof UnifiedFormData,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Set the file name first for immediate UI feedback
    const uploadedFileName = files[0].name;
    setFileNames((prev) => ({
      ...prev,
      [fieldName]: uploadedFileName,
    }));

    register(fieldName).onChange(e);

    const result = validateFileListSize(files);

    if (!result.valid) {
      setFileErrors((prev) => ({
        ...prev,
        [fieldName]: result.errorMessage,
      }));

      // Clear the input
      e.target.value = "";

      setError(fieldName, {
        type: "manual",
        message: result.errorMessage,
      });
      return;
    }

    // Start the upload immediately
    const email = auth?.currentUser?.email;
    const formType = "admission";

    // Set status to uploading
    setUploadProgress((prev) => ({
      ...prev,
      [fieldName]: {
        progress: 0,
        status: "uploading",
        url: null,
        tempPath: null,
      },
    }));

    // Upload the file with progress tracking
    try {
      const { url, tempPath } = await uploadFileWithProgress(
        files[0],
        fieldName,
        email,
        (field, progress) =>
          setUploadProgress((prev) => ({
            ...prev,
            [field]: progress,
          })),
        formType
      );

      // Update the file state with the uploaded URL
      setFiles((prevFiles: Record<string, string | null>) => ({
        ...prevFiles,
        [fieldName]: url,
      }));

      // Notify parent component about the uploaded file
      handleFileUploaded(fieldName, url, tempPath, uploadedFileName);

      // Set as new upload
      setIsNewUpload((prev) => ({
        ...prev,
        [fieldName]: true,
      }));

      // Clear error if file is valid
      setFileErrors((prev) => ({
        ...prev,
        [fieldName]: "",
      }));
    } catch (error: any) {
      console.error(`Error uploading ${fieldName}:`, error);
      setFileErrors((prev) => ({
        ...prev,
        [fieldName]: `Upload failed: ${error.message || "Unknown error"}`,
      }));

      setUploadProgress((prev) => ({
        ...prev,
        [fieldName]: {
          progress: 0,
          status: "error",
          url: null,
          tempPath: null,
          error: error.message,
        },
      }));
    }
  };

  // Add upload progress tracking state for all fields
  const [uploadProgress, setUploadProgress] = useState<
    Record<string, UploadProgress>
  >({
    employeeID: { progress: 0, status: "idle", url: null, tempPath: null },
    applicantSignature: {
      progress: 0,
      status: "idle",
      url: null,
      tempPath: null,
    },
    docRequest: { progress: 0, status: "idle", url: null, tempPath: null },
    hospitalInvoice: {
      progress: 0,
      status: "idle",
      url: null,
      tempPath: null,
    },
    labInvoice: { progress: 0, status: "idle", url: null, tempPath: null },
  });

  // Update the FileUploadWithProgress component to match FormMedicalFiles style
  const FileUploadWithProgress = ({
    fieldName,
    label,
    isRequired = false,
  }: {
    fieldName: keyof UnifiedFormData;
    label: string;
    isRequired?: boolean;
  }) => {
    // Use type assertion to ensure progress is properly typed
    const progress = uploadProgress[
      fieldName as keyof typeof uploadProgress
    ] || {
      progress: 0,
      status: "idle",
      url: null,
      tempPath: null,
    };

    const containerClassName = `file-upload-container ${
      progress.status === "success"
        ? "upload-success"
        : progress.status === "error"
        ? "upload-error"
        : ""
    } ${progress.progress === 100 ? "complete" : ""}`;

    return (
      <tr>
        <td>
          {label} {isRequired && <span className="required-asterisk">*</span>}
        </td>
        <td className="d-flex justify-content-center">
          {isFileInput[fieldName as FileField] &&
          files[fieldName] &&
          isRevisionMode &&
          !isNewUpload[fieldName as FileField] ? (
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() =>
                  setIsFileInput((prev) => ({
                    ...prev,
                    [fieldName]: false,
                  }))
                }
              >
                Re-upload File
              </button>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  openModal(files[fieldName]);
                }}
                className="btn btn-outline-primary btn-sm"
              >
                View Previously Uploaded File
              </a>
            </div>
          ) : (
            <div className={containerClassName}>
              {progress.status === "uploading" && (
                <div
                  className="file-upload-progress-overlay"
                  style={{
                    width: `${progress.progress}%`,
                  }}
                ></div>
              )}
              <input
                id={fieldName}
                type="file"
                accept=".pdf, .png, .jpg, .jpeg"
                className={`form-control ${
                  errors[fieldName] || fileErrors[fieldName] ? "is-invalid" : ""
                }`}
                {...register(fieldName)}
                onChange={(e) => handleChange(fieldName, e)}
                disabled={progress.status === "uploading"}
              />
              {progress.status !== "idle" && (
                <div className="file-upload-status">
                  {progress.status === "uploading" && `${progress.progress}%`}
                  {progress.status === "success" && <FiCheck />}
                  {progress.status === "error" && <FiX />}
                </div>
              )}
              {progress.status === "error" && (
                <div className="upload-error-message">
                  {progress.error || "Upload failed"}
                </div>
              )}
            </div>
          )}
          {(errors[fieldName as keyof typeof errors] ||
            fileErrors[fieldName]) && (
            <p className="invalid-feedback">
              {fileErrors[fieldName] ||
                (errors[fieldName as keyof typeof errors]?.message as string)}
            </p>
          )}
        </td>
      </tr>
    );
  };

  const onSubmit = async (data: FieldValues) => {
    setSubmissionStatus("processing");
    setShowSuccessNotification(true);

    try {
      const email = auth?.currentUser?.email;

      // Use already uploaded files from progressive uploads
      const missingFiles: Record<string, File[]> = {};
      const fileFields = [
        "applicantSignature",
        "docRequest",
        "hospitalInvoice",
        "labInvoice",
        "employeeID",
      ] as const;

      // Check if any files haven't been uploaded yet
      fileFields.forEach((field) => {
        // Type-safe field access using keyof
        const files = data[field as keyof typeof data];
        if (
          files &&
          files instanceof FileList &&
          files.length > 0 &&
          !uploadedFiles[field]
        ) {
          missingFiles[field] = Array.from(files) as File[];
        }
      });

      const transID = isRevisionMode ? transactionId : "TRN" + Date.now();
      setFormIdString(transID);

      // Only upload files that weren't already progressively uploaded
      const fileUploadResults: Record<
        string,
        { url: string; filename: string }
      > = {};

      if (Object.keys(missingFiles).length > 0) {
        const uploadResults = await uploadFilesAndGetURLs(
          email,
          transID,
          missingFiles
        );

        // Convert simple URL results to include filenames
        Object.entries(uploadResults).forEach(([field, url]) => {
          const files = missingFiles[field];
          const filename = files && files.length > 0 ? files[0].name : field;
          fileUploadResults[field] = { url, filename };
        });
      }

      // Combine progressively uploaded files with any remaining uploads
      const finalFileObjects: Record<
        string,
        { url: string; filename: string }
      > = {};
      fileFields.forEach((field) => {
        if (uploadedFiles[field]) {
          finalFileObjects[field] = {
            url: uploadedFiles[field].url,
            filename: uploadedFiles[field].filename,
          };
        } else if (fileUploadResults[field]) {
          finalFileObjects[field] = fileUploadResults[field];
        }
      });

      // Get all temp file paths used for this submission
      const usedTempPaths = Object.values(uploadedFiles)
        .map((item) => item.tempPath)
        .filter((path): path is string => path !== null);

      // After successful submission, mark files as permanent
      if (usedTempPaths.length > 0) {
        removeTempFilePathsFromStorage(usedTempPaths);
        console.log(
          "Files are now permanent and won't be cleaned up:",
          usedTempPaths
        );
      }

      if (isRevisionMode) {
        try {
          // Use the hook directly here
          const { removeRequest } = useRemoveRequest();
          await removeRequest(transactionId);
          console.log(`Attempted to remove request with ID: ${transactionId}`);
        } catch (error) {
          console.error("Error removing previous request:", error);
        }
      }

      // Get claim count (defaulting to 1 if not specified)
      const claimCount = data.claimRequestCount
        ? Number(data.claimRequestCount)
        : 1;

      // Create and submit multiple claims if requested
      for (let i = 0; i < claimCount; i++) {
        const claimTransID = i === 0 ? transID : `${transID}-${i}`;

        // Important: Create a clean object structure with *only* the fields that belong to this form
        // This prevents any field from hospitalStatus or other forms from being included
        const cleanFormData = {
          formType: "admission",
          origFormType: "admission",
          lastname: data.lastname ? String(data.lastname) : "",
          firstname: data.firstname ? String(data.firstname) : "",
          middlename: data.middlename ? String(data.middlename) : "",
          idNumber: data.idNumber ? String(data.idNumber) : "",
          address: data.address ? String(data.address) : "",
          age: data.age ? Number(data.age) : 0,
          gender: data.gender ? String(data.gender) : "",
          contact: data.contact ? String(data.contact) : "",
          college: data.college ? String(data.college) : "",
          load: data.load ? Number(data.load) : 0,
          status: data.status ? String(data.status) : "",
          dateHired: data.dateHired || null,
          dateRetired: data.dateRetired || null,
          hmo: data.hmo ? String(data.hmo) : null,
          benefits: data.benefits ? String(data.benefits) : null,
          claimNumber: i + 1,
          totalClaims: claimCount,
          claimRequestCount: claimCount,
          docRequest: finalFileObjects.docRequest
            ? {
                url: finalFileObjects.docRequest.url,
                filename: finalFileObjects.docRequest.filename,
              }
            : null,
          hospitalInvoice: finalFileObjects.hospitalInvoice
            ? {
                url: finalFileObjects.hospitalInvoice.url,
                filename: finalFileObjects.hospitalInvoice.filename,
              }
            : null,
          labInvoice: finalFileObjects.labInvoice
            ? {
                url: finalFileObjects.labInvoice.url,
                filename: finalFileObjects.labInvoice.filename,
              }
            : null,
          employeeID: finalFileObjects.employeeID
            ? {
                url: finalFileObjects.employeeID.url,
                filename: finalFileObjects.employeeID.filename,
              }
            : null,
          applicantSignature: finalFileObjects.applicantSignature
            ? {
                url: finalFileObjects.applicantSignature.url,
                filename: finalFileObjects.applicantSignature.filename,
              }
            : null,
        };

        // Create a safe version by removing any undefined values
        const safeFormData = JSON.parse(JSON.stringify(cleanFormData));

        // Log the data for debugging
        console.log("Safe form data being sent to Firestore:", safeFormData);

        const pendingRequestData = {
          transactionId: claimTransID,
          requester: auth?.currentUser?.displayName || email || "Unknown",
          dateSubmitted: new Date().toLocaleString("en-US", {
            timeZone: "Asia/Manila",
            month: "2-digit",
            day: "2-digit",
            year: "numeric",
            hour: "numeric",
            minute: "numeric",
            hour12: true,
          }),
          status: "pending",
          formData: safeFormData,
        };

        // Add the pending request document to Firestore
        await addDoc(collection(db, "FormRequests"), pendingRequestData);
        console.log(`Claim ${i + 1} written with ID: ${claimTransID}`);

        // Only send notification for the first claim
        if (i === 0) {
          await pushPendingNotification(transID);
        }
      }

      // Show success notification
      setSubmissionStatus("success");

      // After a successful submission clear the form data
      clearFormData("admission");

      // Reset revision store
      resetRevision(); // Call reset to clear the revision state
      // Reset form after successful submission
      reset();
      setDateHired(null);
      setDateRetired(null);
      setPhoneInputValue("+63");
      setFileErrors({});
      setUploadedFiles({});
      setFiles({});

      // After successful submission, reset the upload progress states too
      setSubmissionStatus("success");

      // Also reset the upload progress states to clear green UI indicators
      setUploadProgress({
        employeeID: {
          progress: 0,
          status: "idle",
          url: null,
          tempPath: null,
        },
        applicantSignature: {
          progress: 0,
          status: "idle",
          url: null,
          tempPath: null,
        },
        docRequest: {
          progress: 0,
          status: "idle",
          url: null,
          tempPath: null,
        },
        hospitalInvoice: {
          progress: 0,
          status: "idle",
          url: null,
          tempPath: null,
        },
        labInvoice: {
          progress: 0,
          status: "idle",
          url: null,
          tempPath: null,
        },
      });
    } catch (error) {
      console.error("Submission error details:", error);
      setSubmissionStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    }
  };

  // Handle modal opening and closing
  const openModal = (file: any) => {
    setPreviewFile(file);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setPreviewFile(null);
  };

  // Add state to track upload status
  const [requiredUploadsInProgress, setRequiredUploadsInProgress] =
    useState(false);
  const [allFilesUploaded, setAllFilesUploaded] = useState(true);

  // Add handler for file uploads
  const handleFileUploaded = (
    fieldName: string,
    url: string,
    tempPath: string,
    filename: string // Added filename parameter
  ) => {
    setUploadedFiles((prev) => ({
      ...prev,
      [fieldName]: { url, tempPath, filename }, // Store filename
    }));
  };

  // Check if all required uploads are complete
  useEffect(() => {
    // Define required fields (employeeID is optional)
    const requiredFields = [
      "applicantSignature",
      "docRequest",
      "hospitalInvoice",
      "labInvoice",
    ];

    // Check if any required field is in 'uploading' status
    const uploadsInProgress = requiredFields.some((field) => {
      const progress = uploadProgress[field];
      return progress?.status === "uploading";
    });

    // Check if all required fields have valid URLs
    const allRequiredUploaded = requiredFields.every((field) => {
      if (isRevisionMode && !isNewUpload[field as FileField] && files[field]) {
        return true;
      }

      const progress = uploadProgress[field];
      return (
        progress?.status === "success" ||
        (uploadedFiles[field] && uploadedFiles[field].url)
      );
    });

    setRequiredUploadsInProgress(uploadsInProgress);
    setAllFilesUploaded(allRequiredUploaded && !uploadsInProgress);
  }, [uploadProgress, uploadedFiles, isRevisionMode, isNewUpload, files]);

  // Add warning message before submit button
  return (
    <div className="form-body">
      {/* Clear success notification */}
      {showClearSuccess && (
        <div className="success-notification">
          <div className="success-icon success">
            <FiCheck size={18} />
          </div>
          <div className="success-content">
            <h4 className="success-title">Form Cleared Successfully</h4>
            <p className="success-message">
              The form has been reset to default values.
            </p>
          </div>
          <button
            className="success-close"
            onClick={() => setShowClearSuccess(false)}
            aria-label="Close notification"
          >
            <FiX size={18} />
          </button>
        </div>
      )}

      <div className="button-container">
        <BackButton />
        <RemainingBenefit />
      </div>
      <div className="container">
        <FormHeader formType="Hospital Admission Form" />
        <div className="form-body">
          {/* Restored data notification */}
          {showRestoredMessage && (
            <div className="info-notification">
              <div className="info-icon">
                <FiInfo size={18} />
              </div>
              <div className="info-content">
                <p>Your previous form data has been restored.</p>
              </div>
              <button
                className="info-close"
                onClick={() => setShowRestoredMessage(false)}
                aria-label="Close notification"
              >
                <FiX size={18} />
              </button>
            </div>
          )}
          <div className="form-container">
            <form onSubmit={handleSubmit(onSubmit)}>
              {isSubmitted && Object.keys(errors).length > 0 && (
                <ValidationErrorDropdown errors={errors} />
              )}

              <FormPersonalInfo
                register={register}
                errors={errors}
                setValue={setValue}
                watch={watch}
                phoneInputValue={phoneInputValue}
                setPhoneInputValue={setPhoneInputValue}
              />
              <AdmissionTeachingInfo
                register={register}
                errors={errors}
                dateHired={dateHired}
                setDateHired={setDateHired}
                dateRetired={dateRetired}
                setDateRetired={setDateRetired}
                setValue={setValue}
                watch={watch}
              />
              <FormUploadDisclaimer />

              {/* Custom document upload table */}
              <div className="document-input-container fieldset-no-line">
                <table className="table-borderless">
                  <thead className="table-header table-header-padding">
                    <tr>
                      <th>Document</th>
                      <th className="d-flex justify-content-center">Upload</th>
                    </tr>
                  </thead>
                  <tbody>
                    <FileUploadWithProgress
                      fieldName="employeeID"
                      label="Employee/UST ID"
                    />
                    <FileUploadWithProgress
                      fieldName="docRequest"
                      label="Doctor's Note/Request"
                      isRequired={true}
                    />
                    <FileUploadWithProgress
                      fieldName="hospitalInvoice"
                      label="Hospital Receipt/Invoice"
                      isRequired={true}
                    />
                    <FileUploadWithProgress
                      fieldName="labInvoice"
                      label="Laboratory Receipt/Invoice"
                      isRequired={true}
                    />
                    <FileUploadWithProgress
                      fieldName="applicantSignature"
                      label="Applicant's Signature"
                      isRequired={true}
                    />
                  </tbody>
                </table>
              </div>

              {/* Add claim request count field */}
              <div className="claim-request-container">
                <div className="claim-request">
                  <div>
                    <label htmlFor="claimRequestCount"> </label>
                    How many claims do you want to request?{" "}
                    <span className="required-asterisk">*</span>
                    <br />
                    <span className="claim-example">
                      (e.g. Multiple hospital visits)
                    </span>
                    <div className="claim-input">
                      <input
                        {...register("claimRequestCount", {
                          valueAsNumber: true,
                          min: 1,
                          max: 10,
                        })}
                        id="claimRequestCount"
                        type="number"
                        className="form-control claimRequestCount"
                        placeholder="1-10"
                        defaultValue={1}
                      />
                      <span
                        className="claim-text"
                        style={{ fontWeight: "normal" }}
                      >
                        {" "}
                        claims
                      </span>
                    </div>
                    {errors.claimRequestCount && (
                      <span
                        className="text-danger claim-error"
                        style={{ fontWeight: "normal" }}
                      >
                        {errors.claimRequestCount.message}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <FormCertify register={register} errors={errors} />

              {/* Add a file upload warning */}
              {requiredUploadsInProgress && (
                <div className="alert alert-warning mt-3">
                  <FiUploadCloud className="me-2" />
                  Please wait for all files to finish uploading before
                  submitting the form.
                </div>
              )}

              <div className="buttonDiv">
                <button
                  type="submit"
                  className="btn btn-submit form-submit"
                  disabled={!allFilesUploaded}
                  title={
                    !allFilesUploaded
                      ? "Please wait for all files to finish uploading"
                      : ""
                  }
                >
                  Submit
                </button>
                <button
                  type="button"
                  className="btn btn-clear form-submit"
                  onClick={() => setShowClearConfirmation(true)}
                >
                  Clear
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Success notification component */}
      {showSuccessNotification && (
        <div
          className={`success-notification ${
            isNotificationHiding ? "hiding" : ""
          } ${submissionStatus === "error" ? "error-notification" : ""}`}
        >
          <div className={`success-icon ${submissionStatus}`}>
            {submissionStatus === "processing" ? (
              <div className="spinner"></div>
            ) : submissionStatus === "success" ? (
              <FiCheck size={18} />
            ) : (
              <FiX size={18} />
            )}
          </div>
          <div className="success-content">
            <h4 className="success-title">
              {submissionStatus === "processing"
                ? "Submitting Form..."
                : submissionStatus === "success"
                ? "Form Submitted Successfully"
                : "Submission Failed"}
            </h4>
            <p className="success-message">
              {submissionStatus === "processing"
                ? "Please wait while we process your claim request..."
                : submissionStatus === "success"
                ? `Your claim request has been submitted with ID: ${formIdString}`
                : errorMessage ||
                  "An error occurred during submission. Please try again."}
            </p>
            {submissionStatus === "success" && (
              <div className="success-action">
                <a
                  href="#"
                  onClick={handleTrackingClick}
                  className="success-link"
                >
                  Track your request{" "}
                  <FiArrowRight size={14} className="success-link-icon" />
                </a>
              </div>
            )}
            {submissionStatus === "error" && (
              <div className="success-action">
                <button onClick={closeNotification} className="try-again-link">
                  Close and try again
                </button>
              </div>
            )}
          </div>
          <button
            className="success-close"
            onClick={closeNotification}
            aria-label="Close notification"
          >
            <FiX size={18} />
          </button>
        </div>
      )}

      {showClearConfirmation && (
        <Popout
          title="Confirm Clear Form"
          message="Are you sure you want to clear the form? All entered data will be lost."
          onConfirm={handleClearConfirm}
          onCancel={handleClearCancel}
          isOpen={showClearConfirmation}
        />
      )}
      {isModalOpen && <ViewFiles file={previewFile} onClose={closeModal} />}
    </div>
  );
};

export default AdmissionForm;
