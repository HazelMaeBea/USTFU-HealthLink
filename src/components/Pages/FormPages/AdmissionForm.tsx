import { useState, useEffect } from "react";
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
import { FiCheck, FiArrowRight, FiX } from "react-icons/fi";
import {
  uploadFilesAndGetURLs,
  validateFileListSize,
} from "../../../utils/fileUpload.ts";
import { baseFormSchema, UnifiedFormData } from "./FormUtil/formTypes.ts";
import { pushPendingNotification } from "../../Page Elements/NotifBadge/NotifTrigger.ts";
import { useRevisionStore } from "../../Page Elements/RevisionFuncs/revisionStore.ts";
import { useRemoveRequest } from "../../Page Elements/RevisionFuncs/removeRequest.ts";
import ViewFiles from "../../Page Elements/ViewFiles/ViewFiles.tsx";
import {
  saveFormData,
  loadFormData,
  clearFormData,
} from "./FormUtil/formPresistence.ts";

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

// Extend the base schema with admission-specific fields
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
  })
  .omit({ claimRequestCount: true }) // Remove claimRequestCount requirement
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
  const navigate = useNavigate();

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
    }
  }, [reset]);

  // auto save data on change
  useEffect(() => {
    const subscription = watch((value) => {
      saveFormData("admission", value);
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  const { removeRequest } = useRemoveRequest();
  const [files, setFiles] = useState<any>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
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
        applicantSignature: formData.applicantSignature,
        docRequest: formData.docRequest,
        hospitalInvoice: formData.hospitalInvoice,
        labInvoice: formData.labInvoice,
        employeeID: formData.employeeID,
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
    // Reset form with empty select values
    reset({
      gender: undefined,
      college: "",
      status: "",
    });

    // Clear file errors
    setFileErrors({});
    setShouldReapplyAutofill(true);
    setShowClearConfirmation(false);
  };

  const handleClearCancel = () => {
    setShowClearConfirmation(false);
  };

  // Handler for file input changes
  const handleFileChange =
    (fieldName: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
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

        // Set form error
        setError(fieldName as any, {
          type: "manual",
          message: result.errorMessage,
        });
      } else {
        // Handle valid files
        if (files && files.length > 0) {
          const file = files[0];
          // Assuming you're uploading and receiving a file URL back from the upload service
          const uploadedFileUrl = URL.createObjectURL(file); // Example of a temporary URL

          // Update the file state with the new uploaded file URL
          setFiles((prevFiles: FileState) => ({
            ...prevFiles,
            [fieldName]: uploadedFileUrl, // You can replace this with your actual file URL
          }));
        }

        setIsNewUpload((prev) => ({
          ...prev,
          [fieldName]: true,
        }));

        // Clear error if file is valid
        setFileErrors((prev) => ({
          ...prev,
          [fieldName]: "",
        }));
      }
    };

  const onSubmit = async (data: FieldValues) => {
    setSubmissionStatus("processing");
    setShowSuccessNotification(true);

    try {
      const email = auth?.currentUser?.email;

      const filesToUpload = {
        applicantSignature: data.applicantSignature,
        docRequest: data.docRequest,
        employeeID: data.employeeID,
        hospitalInvoice: data.hospitalInvoice,
        labInvoice: data.labInvoice,
      };
      const transID = isRevisionMode ? transactionId : "TRN" + Date.now(); // Use existing transactionId for revision mode
      setFormIdString(transID);

      const fileUploadResults = await uploadFilesAndGetURLs(
        email,
        transID,
        filesToUpload
      );

      const pendingRequestData = {
        transactionId: transID,
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
        formData: {
          formType: "admission",
          origFormType: "admission",
          lastname: data["lastname"],
          firstname: data["firstname"],
          middlename: data["middlename"],
          idNumber: data["idNumber"],
          address: data["address"],
          age: data["age"],
          gender: data["gender"],
          contact: data["contact"],
          college: data["college"],
          load: data["load"],
          status: data["status"],
          dateHired: data.dateHired,
          dateRetired: data.dateRetired,
          docRequest: fileUploadResults.docRequest
            ? {
                url: fileUploadResults.docRequest,
                filename: filesToUpload.docRequest?.[0]?.name || "document.pdf",
              }
            : "",
          hospitalInvoice: fileUploadResults.hospitalInvoice
            ? {
                url: fileUploadResults.hospitalInvoice,
                filename:
                  filesToUpload.hospitalInvoice?.[0]?.name || "invoice.pdf",
              }
            : "",
          labInvoice: fileUploadResults.labInvoice
            ? {
                url: fileUploadResults.labInvoice,
                filename:
                  filesToUpload.labInvoice?.[0]?.name || "lab_invoice.pdf",
              }
            : "",
          ...(fileUploadResults.employeeID
            ? {
                employeeID: {
                  url: fileUploadResults.employeeID,
                  filename:
                    filesToUpload.employeeID?.[0]?.name || "employee_id.pdf",
                },
              }
            : {}),
          applicantSignature: fileUploadResults.applicantSignature
            ? {
                url: fileUploadResults.applicantSignature,
                filename:
                  filesToUpload.applicantSignature?.[0]?.name ||
                  "signature.png",
              }
            : "",
        },
      };

      if (isRevisionMode) {
        try {
          await removeRequest(transactionId);
          console.log(`Attempted to remove request with ID: ${transactionId}`);
          // ... proceed with submitting the new revision
        } catch (error) {
          console.error("Error removing previous request:", error);
          // Handle the error appropriately (e.g., show a message to the user)
        }
      }

      // Add the pending request document to Firestore.
      await addDoc(collection(db, "FormRequests"), pendingRequestData);
      console.log("Document written with ID: ", transID);

      // Show success notification
      setSubmissionStatus("success");

      await pushPendingNotification(transID);

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
    } catch (error) {
      console.error(error);
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

  return (
    <div className="form-body">
      <div className="button-container">
        <BackButton />
        <RemainingBenefit />
      </div>
      <div className="container">
        <FormHeader formType="Hospital Admission Form" />
        <div className="form-body">
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
                    <tr>
                      <td>Employee/UST ID</td>
                      <td className="d-flex justify-content-center">
                        {isFileInput["employeeID"] &&
                        files.employeeID &&
                        isRevisionMode &&
                        !isNewUpload["employeeID"] ? (
                          <div className="d-flex gap-2">
                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm"
                              onClick={() =>
                                setIsFileInput((prev) => ({
                                  ...prev,
                                  employeeID: false,
                                }))
                              }
                            >
                              Re-upload File
                            </button>
                            <a
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                openModal(files.employeeID);
                              }}
                              className="btn btn-outline-primary btn-sm"
                            >
                              View Previously Uploaded File
                            </a>
                          </div>
                        ) : (
                          <input
                            id="employeeID"
                            type="file"
                            accept=".pdf, .png, .jpg, .jpeg"
                            className={`form-control ${
                              errors.employeeID || fileErrors.employeeID
                                ? "is-invalid"
                                : ""
                            }`}
                            {...register("employeeID")}
                            name="employeeID"
                            onChange={(e) => {
                              register("employeeID").onChange(e);
                              handleFileChange("employeeID")(e);
                            }}
                          />
                        )}
                        {/* {(errors.employeeID || fileErrors.employeeID) && (
                          <p className="invalid-feedback">
                            {fileErrors.employeeID ||
                              (errors.employeeID?.message as string)}
                          </p>
                        )} */}
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <label htmlFor="docRequest">
                          Doctor's Note/Request
                        </label>{" "}
                        <span className="required-asterisk">*</span>
                      </td>
                      <td className="d-flex justify-content-center">
                        {isFileInput["docRequest"] &&
                        files.docRequest &&
                        isRevisionMode &&
                        !isNewUpload["docRequest"] ? (
                          <div className="d-flex gap-2">
                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm"
                              onClick={() =>
                                setIsFileInput((prev) => ({
                                  ...prev,
                                  docRequest: false,
                                }))
                              } // Switch to file input when clicked
                            >
                              Re-upload File
                            </button>
                            <a
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                openModal(files.docRequest); // Open the modal with file preview
                              }}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-outline-primary btn-sm"
                            >
                              View Previously Uploaded File
                            </a>
                          </div>
                        ) : (
                          <input
                            id="docRequest"
                            type="file"
                            accept=".pdf, .png, .jpg, .jpeg"
                            className={`form-control ${
                              errors.docRequest || fileErrors.docRequest
                                ? "is-invalid"
                                : ""
                            }`}
                            {...register("docRequest")}
                            name="docRequest"
                            onChange={(e) => {
                              register("docRequest").onChange(e);
                              handleFileChange("docRequest")(e);
                            }}
                          />
                        )}
                        {/* {(errors.docRequest || fileErrors.docRequest) && (
                          <p className="invalid-feedback">
                            {fileErrors.docRequest ||
                              (errors.docRequest?.message as string)}
                          </p>
                        )} */}
                      </td>
                    </tr>
                    <tr>
                      <td>
                        Hospital Receipt/Invoice{" "}
                        <span className="required-asterisk">*</span>
                      </td>
                      <td className="d-flex justify-content-center">
                        {isFileInput["hospitalInvoice"] &&
                        files.hospitalInvoice &&
                        isRevisionMode &&
                        !isNewUpload["hospitalInvoice"] ? (
                          <div className="d-flex gap-2">
                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm"
                              onClick={() =>
                                setIsFileInput((prev) => ({
                                  ...prev,
                                  hospitalInvoice: false,
                                }))
                              } // Switch to file input when clicked
                            >
                              Re-upload File
                            </button>
                            <a
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                openModal(files.hospitalInvoice); // Open the modal with file preview
                              }}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-outline-primary btn-sm"
                            >
                              View Previously Uploaded File
                            </a>
                          </div>
                        ) : (
                          <input
                            id="hospitalInvoice"
                            type="file"
                            accept=".pdf, .png, .jpg, .jpeg"
                            className={`form-control ${
                              errors.hospitalInvoice ||
                              fileErrors.hospitalInvoice
                                ? "is-invalid"
                                : ""
                            }`}
                            {...register("hospitalInvoice")}
                            name="hospitalInvoice"
                            onChange={(e) => {
                              register("hospitalInvoice").onChange(e);
                              handleFileChange("hospitalInvoice")(e);
                            }}
                          />
                        )}
                        {/* {(errors.hospitalInvoice ||
                          fileErrors.hospitalInvoice) && (
                          <p className="invalid-feedback">
                            {fileErrors.hospitalInvoice ||
                              (errors.hospitalInvoice?.message as string)}
                          </p>
                        )} */}
                      </td>
                    </tr>
                    <tr>
                      <td>
                        Laboratory Receipt/Invoice{" "}
                        <span className="required-asterisk">*</span>
                      </td>
                      <td className="d-flex justify-content-center">
                        {isFileInput["labInvoice"] &&
                        files.labInvoice &&
                        isRevisionMode &&
                        !isNewUpload["labInvoice"] ? (
                          <div className="d-flex gap-2">
                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm"
                              onClick={() =>
                                setIsFileInput((prev) => ({
                                  ...prev,
                                  labInvoice: false,
                                }))
                              } // Switch to file input when clicked
                            >
                              Re-upload File
                            </button>
                            <a
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                openModal(files.labInvoice); // Open the modal with file preview
                              }}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-outline-primary btn-sm"
                            >
                              View Previously Uploaded File
                            </a>
                          </div>
                        ) : (
                          <input
                            id="labInvoice"
                            type="file"
                            accept=".pdf, .png, .jpg, .jpeg"
                            className={`form-control ${
                              errors.labInvoice || fileErrors.labInvoice
                                ? "is-invalid"
                                : ""
                            }`}
                            {...register("labInvoice")}
                            name="labInvoice"
                            onChange={(e) => {
                              register("labInvoice").onChange(e);
                              handleFileChange("labInvoice")(e);
                            }}
                          />
                        )}
                        {/* {(errors.labInvoice || fileErrors.labInvoice) && (
                          <p className="invalid-feedback">
                            {fileErrors.labInvoice ||
                              (errors.labInvoice?.message as string)}
                          </p>
                        )} */}
                      </td>
                    </tr>
                    <tr>
                      <td>
                        Applicant's Signature{" "}
                        <span className="required-asterisk">*</span>
                      </td>
                      <td className="d-flex justify-content-center">
                        {isFileInput["applicantSignature"] &&
                        files.applicantSignature &&
                        isRevisionMode &&
                        !isNewUpload["applicantSignature"] ? (
                          <div className="d-flex gap-2">
                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm"
                              onClick={() =>
                                setIsFileInput((prev) => ({
                                  ...prev,
                                  applicantSignature: false,
                                }))
                              } // Switch to file input when clicked
                            >
                              Re-upload File
                            </button>
                            <a
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                openModal(files.applicantSignature); // Open the modal with file preview
                              }}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-outline-primary btn-sm"
                            >
                              View Previously Uploaded File
                            </a>
                          </div>
                        ) : (
                          <input
                            id="applicantSignature"
                            type="file"
                            accept=".pdf, .png, .jpg, .jpeg"
                            className={`form-control ${
                              errors.applicantSignature ||
                              fileErrors.applicantSignature
                                ? "is-invalid"
                                : ""
                            }`}
                            {...register("applicantSignature")}
                            name="applicantSignature"
                            onChange={(e) => {
                              register("applicantSignature").onChange(e);
                              handleFileChange("applicantSignature")(e);
                            }}
                          />
                        )}
                        {/* {(errors.applicantSignature ||
                          fileErrors.applicantSignature) && (
                          <p className="invalid-feedback">
                            {fileErrors.applicantSignature ||
                              (errors.applicantSignature?.message as string)}
                          </p>
                        )} */}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <FormCertify register={register} errors={errors} />

              <div className="buttonDiv">
                <button type="submit" className="btn btn-submit form-submit">
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
