import { useState, useEffect, useRef } from "react";
import { FieldValues, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import "react-datepicker/dist/react-datepicker.css";
import "./FormComponents/FormBody.css";
import FormHeader from "./FormComponents/FormHeader.tsx";
import FormPersonalInfo from "./FormComponents/FormPersonalInfo.tsx";
import FormInvoice from "./FormComponents/FormInvoice.tsx";
import FormUploadDisclaimer from "./FormComponents/FormUploadDisclaimer.tsx";
import FormCertify from "./FormComponents/FormCertify.tsx";
import ValidationErrorDropdown from "./FormComponents/ValidationErrorDropdown.tsx";
import { addDoc, collection } from "firebase/firestore";
import { auth, db } from "../../../contexts/firebase.ts";
import BackButton from "../../Page Elements/BackButton/BackButton.tsx";
import RemainingBenefit from "./RemainingBenefitPopout/RemainingBenefit.tsx";
import { useNavigate } from "react-router-dom";
import Popout from "../../Page Elements/Popout/Popout.tsx";
import {
  FiCheck,
  FiArrowRight,
  FiX,
  FiInfo,
  FiUploadCloud,
} from "react-icons/fi";
import { useAutofill, applyAutofill } from "./FormUtil/Autofill.ts";
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
import { formatDateToMMDDYYYY } from "../../../utils/dateUtils.ts";
import {
  saveFormData,
  loadFormData,
  clearFormData,
  hasSavedFormData,
} from "./FormUtil/formPresistence.ts";
import {
  checkForRestoredFormData,
  clearForm,
} from "./FormUtil/formClearUtil.ts";

type FileState = {
  [key: string]: string | null; // Each field (e.g., "applicantSignature") can have a string (file URL) or null
};

const fileFields = [
  "employeeID",
  "applicantSignature",
  "eyeglassesReceipt",
] as const;

type FileField = (typeof fileFields)[number];

let pendingUnmountId: string | null = null;

// Maximum amount allowed for eyeglasses reimbursement - can be changed by admin
const MAX_EYEGLASSES_AMOUNT = 5000;

// Extend the base schema with eyeglasses-specific fields
const schema = baseFormSchema
  .extend({
    benefits: z.string().optional(),
    hmo: z.string().optional(),
    ORNumber: z.string().nonempty("Please enter a valid OR Number"),
    issuedBy: z.string().nonempty("Please enter a valid Issue By"),
    amountPaid: z.coerce
      .number({
        invalid_type_error: "Please enter a valid amount",
        required_error: "Amount Paid is required",
      })
      .min(1, "Amount must be more than 0")
      .max(
        MAX_EYEGLASSES_AMOUNT,
        `Amount cannot exceed ₱${MAX_EYEGLASSES_AMOUNT.toLocaleString()}`
      ),
    load: z.coerce
      .number({
        required_error: "Please enter your teaching load",
        invalid_type_error: "Teaching load must be a number",
      })
      .min(0, "Teaching load cannot be negative")
      .max(30, "Teaching load cannot exceed 30 units"),
    term: z.string().nonempty("Please select a term"),
    year: z.string().nonempty("Please select an academic year"),
    status: z.string().nonempty("Please select your employment status"),
    claimRequestCount: z.coerce
      .number({
        invalid_type_error: "Please enter a valid number",
        required_error: "Number of claims is required",
      })
      .min(1, "Please enter at least 1 claim")
      .max(10, "Maximum of 10 claims allowed"),
    dateHired: z
      .string({
        invalid_type_error: "Please select a valid date",
        required_error: "Please enter the date you were hired",
      })
      .optional()
      .transform((val) => {
        if (!val || val.trim() === "") return null;
        return new Date(val);
      })
      .refine(
        (date) => {
          if (!date) return true;
          return (
            date instanceof Date && !isNaN(date.getTime()) && date <= new Date()
          );
        },
        {
          message: "Please enter a valid date that is not in the future",
        }
      ),
    dateRetired: z
      .string({
        invalid_type_error: "Please select a valid date",
        required_error: "Please enter the date you retired",
      })
      .nullable()
      .optional(),
    employeeID: z.any().nullable().optional(),
    eyeglassesReceipt: z.any().refine((files) => files && files.length > 0, {
      message: "Eyeglasses receipt is required",
    }),
  })
  .omit({ claimRequestCount: true })
  .superRefine((data, ctx) => {
    // Only validate dateHired if status is Tenured-Track
    if (data.status === "Tenured-Track" && !data.dateHired) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Please provide your date of hire as a Tenure-Track faculty member",
        path: ["dateHired"],
      });
    }
    // Only validate dateRetired if status is Retiree
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

const EyeglassesForm = () => {
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [isNotificationHiding, setIsNotificationHiding] = useState(false);
  const [showClearConfirmation, setShowClearConfirmation] =
    useState<boolean>(false);
  const [formIdString, setFormIdString] = useState<string>("");
  const [submissionStatus, setSubmissionStatus] = useState<
    "processing" | "success" | "error"
  >("processing");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [dateHired, setDateHired] = useState<Date | null>(null);
  const [dateRetired, setDateRetired] = useState<Date | null>(null);
  const [phoneInputValue, setPhoneInputValue] = useState<string>("+63");
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});
  const [shouldReapplyAutofill, setShouldReapplyAutofill] = useState(false);
  const [showClearSuccess, setShowClearSuccess] = useState(false);
  const [showRestoredMessage, setShowRestoredMessage] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    setError,
    formState: { errors, isSubmitted, touchedFields },
  } = useForm<UnifiedFormData>({
    resolver: zodResolver(schema),
    mode: "onTouched", // Only validate fields after they've been touched
    defaultValues: {
      gender: undefined,
      college: "",
      term: "",
      year: "",
      status: "", // Add status to default values
    },
  });

  // Define timeout ref for form auto-save
  const formSaveTimeout = useRef<NodeJS.Timeout | null>(null);

  // Load persisted form data on mount
  useEffect(() => {
    const savedData = loadFormData("eyeglasses");
    if (savedData) {
      reset(savedData);
      // Display message that form was restored from previous session
      if (typeof checkForRestoredFormData === "function") {
        checkForRestoredFormData("eyeglasses", setShowRestoredMessage);
      }
    }
  }, [reset]);

  //Auto-save form data on changes, with debounce to reduce storage operations
  useEffect(() => {
    const subscription = watch((value) => {
      // We don't want to save empty forms
      if (
        Object.keys(value).some(
          (key) =>
            value[key as keyof typeof value] !== undefined &&
            value[key as keyof typeof value] !== null &&
            value[key as keyof typeof value] !== "" &&
            !(value[key as keyof typeof value] instanceof FileList)
        )
      ) {
        // Use setTimeout to debounce (only save after 500ms of no changes)
        if (formSaveTimeout.current) {
          clearTimeout(formSaveTimeout.current);
        }

        formSaveTimeout.current = setTimeout(() => {
          saveFormData("eyeglasses", value);
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

  // Apply autofill when component loads
  useAutofill(setValue, setDateHired, setDateRetired, setPhoneInputValue);

  // Re-apply autofill after form is cleared
  useEffect(() => {
    if (shouldReapplyAutofill) {
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

  useEffect(() => {
    if (dateHired) {
      setValue("dateHired", formatDateToMMDDYYYY(dateHired), {
        shouldValidate: touchedFields.dateHired || false, // Only validate if the field has been touched
      });
    }
  }, [dateHired, setValue, touchedFields.dateHired]);

  useEffect(() => {
    if (dateRetired) {
      setValue("dateRetired", formatDateToMMDDYYYY(dateRetired), {
        shouldValidate: true,
      });
    }
  }, [dateRetired, setValue]);

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
    try {
      console.log("Starting form clear operation for eyeglasses form");
      clearFormData("eyeglasses");

      clearForm({
        formType: "eyeglasses",
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
        },
      });

      // Prevent auto-save for a short period after clearing
      if (formSaveTimeout.current) {
        clearTimeout(formSaveTimeout.current);
      }

      // Force immediate save of empty data to overwrite any existing data
      saveFormData("eyeglasses", {
        gender: undefined,
        college: "",
        term: "",
        year: "",
        status: "",
      });

      // Close confirmation dialog
      setShowClearConfirmation(false);

      console.log("Form clear operation completed for eyeglasses form");
    } catch (error) {
      console.error("Error clearing form:", error);
      // Fallback manual clearing
      clearFormData("eyeglasses");
      reset();
      setDateHired(null);
      setDateRetired(null);
      setPhoneInputValue("+63");
      setShowClearConfirmation(false);
    }
  };

  const handleClearCancel = () => {
    setShowClearConfirmation(false);
  };

  // Add state to track all uploaded files
  const [uploadedFiles, setUploadedFiles] = useState<
    Record<string, { url: string; tempPath: string }>
  >({});

  // Add state to track if all required files are uploaded
  const [allFilesUploaded, setAllFilesUploaded] = useState(false);
  const [requiredUploadsInProgress, setRequiredUploadsInProgress] =
    useState(false);

  // Add upload progress tracking state
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
    eyeglassesReceipt: {
      progress: 0,
      status: "idle",
      url: null,
      tempPath: null,
    },
  });

  // Add handler for file uploads
  const handleFileUploaded = (
    fieldName: string,
    url: string,
    tempPath: string
  ) => {
    setUploadedFiles((prev) => ({
      ...prev,
      [fieldName]: { url, tempPath },
    }));
  };

  // Handle upload status changes
  const handleUploadStatusChange = (filesUploaded: boolean) => {
    setAllFilesUploaded(filesUploaded);
  };

  const [files, setFiles] = useState<any>({});
  const { formData, isRevisionMode, transactionId } = useRevisionStore();
  const resetRevision = useRevisionStore((state) => state.resetRevision);
  const [isNewUpload, setIsNewUpload] = useState({
    employeeID: false,
    applicantSignature: false,
    eyeglassesReceipt: false,
  });

  // Check if all required uploads are complete
  useEffect(() => {
    // Define required fields (employeeID is optional)
    const requiredFields = ["applicantSignature", "eyeglassesReceipt"];

    // Check if any required field is in 'uploading' status
    const uploadsInProgress = requiredFields.some(
      (field) => uploadProgress[field]?.status === "uploading"
    );

    // Check if all required fields have been successfully uploaded
    const allRequiredUploaded = requiredFields.every(
      (field) =>
        uploadProgress[field]?.status === "success" ||
        (isRevisionMode && !isNewUpload[field as FileField] && files[field])
    );

    setRequiredUploadsInProgress(uploadsInProgress);
    handleUploadStatusChange(allRequiredUploaded && !uploadsInProgress);
  }, [uploadProgress, isRevisionMode, isNewUpload, files]);

  // Modify the FileUploadWithProgress component to match FormMedicalFiles style
  const FileUploadWithProgress = ({
    fieldName,
    label,
    isRequired = false,
  }: {
    fieldName: string;
    label: string;
    isRequired?: boolean;
  }) => {
    const progress = uploadProgress[fieldName] || {
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
                  style={{ width: `${progress.progress}%` }}
                />
              )}
              <input
                id={fieldName}
                type="file"
                accept=".pdf, .png, .jpg, .jpeg"
                className={`form-control ${
                  errors[fieldName as FileField] || fileErrors[fieldName]
                    ? "is-invalid"
                    : ""
                }`}
                {...register(fieldName as FileField)}
                name={fieldName}
                onChange={(e) => {
                  register(fieldName as FileField).onChange(e);
                  handleFileChange(fieldName, e);
                }}
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
          {(errors[fieldName as FileField] || fileErrors[fieldName]) && (
            <p className="invalid-feedback">
              {fileErrors[fieldName] ||
                (errors[fieldName as FileField]?.message as string)}
            </p>
          )}
        </td>
      </tr>
    );
  };

  // Handler for file changes with progressive upload
  const handleFileChange = async (
    fieldName: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    const result = validateFileListSize(files);

    if (!result.valid) {
      // Set custom file error
      setFileErrors((prev) => ({
        ...prev,
        [fieldName]: result.errorMessage,
      }));

      // Clear the input
      e.target.value = "";

      // Set form error if setError is provided
      setError(fieldName as any, {
        type: "manual",
        message: result.errorMessage,
      });
    } else {
      // Handle valid files
      if (files && files.length > 0) {
        const file = files[0];

        try {
          // Start the upload immediately
          const email = auth?.currentUser?.email;
          const formType = "eyeglasses";

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
          const { url, tempPath } = await uploadFileWithProgress(
            file,
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

          // Notify about the uploaded file
          handleFileUploaded(fieldName, url, tempPath);

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
      }
    }
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
        "eyeglassesReceipt",
        "employeeID",
      ];

      // Check if any files haven't been uploaded yet
      fileFields.forEach((field) => {
        const files = data[field];
        if (files && files.length > 0 && !uploadedFiles[field]) {
          missingFiles[field] = files;
        }
      });

      const transID = isRevisionMode ? transactionId : "TRN" + Date.now();
      setFormIdString(transID);

      // Only upload files that weren't already progressively uploaded
      let fileUploadResults: Record<string, string> = {};

      if (Object.keys(missingFiles).length > 0) {
        fileUploadResults = await uploadFilesAndGetURLs(
          email,
          transID,
          missingFiles
        );
      }

      // Combine progressively uploaded files with any remaining uploads
      const finalFileUrls: Record<string, string> = {};
      fileFields.forEach((field) => {
        if (uploadedFiles[field]) {
          finalFileUrls[field] = uploadedFiles[field].url;
        } else if (fileUploadResults[field]) {
          finalFileUrls[field] = fileUploadResults[field];
        }
      });

      if (isRevisionMode) {
        try {
          await removeRequest(transactionId);
          console.log(`Attempted to remove request with ID: ${transactionId}`);
        } catch (error) {
          console.error("Error removing previous request:", error);
        }
      }

      // Get claim count (defaulting to 1 if not specified)
      const claimCount = data.claimRequestCount || 1;

      // Create and submit multiple claims if requested
      for (let i = 0; i < claimCount; i++) {
        const claimTransID = i === 0 ? transID : `${transID}-${i}`;

        // Create a clean form data structure with only fields that belong to this form
        const cleanFormData = {
          formType: "eyeglasses",
          origFormType: "eyeglasses",
          lastname: data.lastname ? String(data.lastname) : "",
          firstname: data.firstname ? String(data.firstname) : "",
          middlename: data.middlename ? String(data.middlename) : "",
          age: data.age ? Number(data.age) : 0,
          gender: data.gender ? String(data.gender) : "",
          contact: data.contact ? String(data.contact) : "",
          college: data.college ? String(data.college) : "",
          term: data.term ? String(data.term) : "",
          year: data.year ? String(data.year) : "",
          ORNumber: data.ORNumber ? String(data.ORNumber) : "",
          issuedBy: data.issuedBy ? String(data.issuedBy) : "",
          amountPaid: data.amountPaid ? Number(data.amountPaid) : 0,
          load: data.load ? Number(data.load) : 0,
          dateHired: data.dateHired || null,
          maxAmount: MAX_EYEGLASSES_AMOUNT,
          status: data.status ? String(data.status) : "",
          claimNumber: i + 1,
          totalClaims: claimCount,
          claimRequestCount: claimCount,
          eyeglassesReceipt: finalFileUrls.eyeglassesReceipt
            ? {
                url: finalFileUrls.eyeglassesReceipt,
                filename: "receipt.pdf",
              }
            : null,
          employeeID: finalFileUrls.employeeID
            ? {
                url: finalFileUrls.employeeID,
                filename: "employee_id.pdf",
              }
            : null,
          applicantSignature: finalFileUrls.applicantSignature
            ? {
                url: finalFileUrls.applicantSignature,
                filename: "signature.png",
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

        await addDoc(collection(db, "FormRequests"), pendingRequestData);
        console.log(`Claim ${i + 1} written with ID: ${claimTransID}`);

        // Only send notification for the first claim
        if (i === 0) {
          await pushPendingNotification(transID);
        }
      }

      // Show success notification
      setSubmissionStatus("success");

      // Clear persisted form data after successful submission
      clearFormData("eyeglasses");

      // Reset form after successful submission
      resetRevision();
      reset();
    } catch (error) {
      console.error("Submission error details:", error);
      setSubmissionStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    }
  };

  const { removeRequest } = useRemoveRequest();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<any>(null);
  const [isFileInput, setIsFileInput] = useState<Record<FileField, boolean>>({
    employeeID: false,
    applicantSignature: false,
    eyeglassesReceipt: false,
  });

  const updateFileInputStates = (newFiles: any) => {
    const inputStates = Object.fromEntries(
      fileFields.map((key) => [key, Boolean(newFiles[key])])
    ) as Record<FileField, boolean>;
    setIsFileInput(inputStates);
  };

  // Add state to track file names
  const [fileNames, setFileNames] = useState<Record<string, string>>({
    employeeID: "",
    applicantSignature: "",
    eyeglassesReceipt: "",
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

        pendingUnmountId = null; // clean up
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
      const prefills = {
        employeeID: formData.employeeID,
        eyeglassesReceipt: formData.eyeglassesReceipt,
        applicantSignature: formData.applicantSignature,
      };
      setFiles(prefills);
      updateFileInputStates(prefills);
    }
  }, [formData, isRevisionMode, setValue]);

  useEffect(() => {
    if (isRevisionMode && files) {
      updateFileInputStates(files);
      console.log(`Updated isFileInput: ${JSON.stringify(isFileInput)}`);
    }
  }, [files, isRevisionMode, isFileInput]);

  useEffect(() => {
    console.log("isRevisionMode changed:", isRevisionMode);
  }, [isRevisionMode]);

  useEffect(() => {
    console.log("Files state changed:", files);
  }, [files]);
  // Handle modal opening and closing
  const openModal = (file: any) => {
    setPreviewFile(file);
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setPreviewFile(null);
  };

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
        <FormHeader formType="Eyeglasses Form" />
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

              {/* Use the enhanced FormInvoice component that now includes academic year, term, load and date hired */}
              <FormInvoice
                register={register}
                errors={errors}
                setValue={setValue}
                watch={watch}
                dateHired={dateHired}
                setDateHired={setDateHired}
                dateRetired={dateRetired}
                setDateRetired={setDateRetired}
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
                      fieldName="eyeglassesReceipt"
                      label="Eyeglasses Receipt"
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
                      (e.g. Multiple eyeglasses purchases for family members)
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

              {/* File upload progress warning message */}
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

export default EyeglassesForm;
