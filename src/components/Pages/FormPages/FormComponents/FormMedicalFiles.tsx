import React, { useEffect, useState } from "react";
import {
  UseFormRegister,
  FieldErrors,
  UseFormSetError,
  UseFormSetValue,
} from "react-hook-form";
import { validateFileListSize } from "../../../../utils/fileUpload";
import { UnifiedFormData } from "../FormUtil/formTypes";
import { useRevisionStore } from "../../../Page Elements/RevisionFuncs/revisionStore.ts";
import ViewFiles from "../../../Page Elements/ViewFiles/ViewFiles.tsx";
import { uploadFilesAndGetURLs } from "../../../../utils/fileUpload.ts";
import { deleteFileFromURL } from "../../../../utils/fileUpload.ts"; // You need to implement this utility
import { FiX } from "react-icons/fi";

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

interface FormMedicalFilesProps {
  register: UseFormRegister<UnifiedFormData>;
  errors: FieldErrors<UnifiedFormData>;
  setError?: UseFormSetError<UnifiedFormData>;
  setValue: UseFormSetValue<UnifiedFormData>;
  setFormSubmitted?: (submitted: boolean) => void; // Add this prop
}

const FormMedicalFiles: React.FC<FormMedicalFilesProps> = ({
  register,
  errors,
  setError,
  setValue,
  setFormSubmitted, // Add this prop
}) => {
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});

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
  const [uploadedUrls, setUploadedUrls] = useState<
    Record<FileField, string | null>
  >({
    employeeID: null,
    applicantSignature: null,
    docRequest: null,
    hospitalInvoice: null,
    labInvoice: null,
  });
  const { formData, isRevisionMode, transactionId } = useRevisionStore();
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
  const [uploadingField, setUploadingField] = useState<FileField | null>(null);
  const [formSubmitted, setFormSubmittedLocal] = useState(false);

  // Expose setFormSubmitted to parent if provided
  useEffect(() => {
    if (setFormSubmitted) {
      setFormSubmitted((submitted) => {
        setFormSubmittedLocal(submitted);
        return submitted;
      });
    }
  }, [setFormSubmitted]);

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

      // Delete uploaded files if form was not submitted
      if (!formSubmitted) {
        Object.values(uploadedUrls).forEach((url) => {
          if (url) {
            deleteFileFromURL(url);
          }
        });
      }
    };
  }, [transactionId, formSubmitted, uploadedUrls]);

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

  useEffect(() => {
    if (isRevisionMode && formData?.claimRequestCount !== undefined) {
      setValue("claimRequestCount", formData.claimRequestCount);
    }
  }, [formData, isRevisionMode, setValue]);

  // Handler for file input changes (now uploads immediately)
  const handleFileChange =
    (fieldName: FileField) =>
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      const result = validateFileListSize(files);

      if (!result.valid) {
        setFileErrors((prev) => ({
          ...prev,
          [fieldName]: result.errorMessage,
        }));
        e.target.value = "";
        if (setError) {
          setError(fieldName as any, {
            type: "manual",
            message: result.errorMessage,
          });
        }
      } else {
        if (files && files.length > 0) {
          const file = files[0];
          setUploadingField(fieldName); // set loading spinner
          setFileErrors((prev) => ({
            ...prev,
            [fieldName]: "",
          }));
          try {
            const email =
              (window as any).auth?.currentUser?.email || "anonymous";
            const transID = transactionId || "TRN" + Date.now();
            const uploadResult = await uploadFilesAndGetURLs(email, transID, {
              [fieldName]: [file],
            });
            const url = uploadResult[fieldName];
            setUploadedUrls((prev) => ({
              ...prev,
              [fieldName]: url,
            }));
            setFiles((prevFiles: FileState) => ({
              ...prevFiles,
              [fieldName]: url,
            }));
            setValue(fieldName, url);
            setFileErrors((prev) => ({
              ...prev,
              [fieldName]: "",
            }));
          } catch (err) {
            setFileErrors((prev) => ({
              ...prev,
              [fieldName]: "Upload failed. Please try again.",
            }));
          } finally {
            setUploadingField(null);
          }
        }
        setIsNewUpload((prev) => ({
          ...prev,
          [fieldName]: true,
        }));
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

  // Helper to create file object for preview
  const getFilePreviewObj = (url: string | null, fallbackName: string) =>
    url ? { url, filename: fallbackName } : null;

  return (
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
            <td className="d-flex justify-content-start">
              {uploadingField === "employeeID" ? (
                <div className="uploading-indicator">
                  <span className="spinner-border spinner-border-sm"></span>
                  <span className="uploading-text">Uploading...</span>
                </div>
              ) : uploadedUrls.employeeID ? (
                <div className="uploaded-file-actions">
                  <button
                    type="button"
                    className="uploaded-file-view-btn"
                    onClick={() =>
                      openModal(
                        getFilePreviewObj(
                          uploadedUrls.employeeID,
                          "employee_id.pdf"
                        )
                      )
                    }
                  >
                    View Uploaded File
                  </button>
                  <button
                    type="button"
                    className="uploaded-file-reupload-btn"
                    onClick={() => {
                      setUploadedUrls((prev) => ({
                        ...prev,
                        employeeID: null,
                      }));
                      setValue("employeeID", null);
                    }}
                  >
                    Re-upload
                  </button>
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
                  onChange={handleFileChange("employeeID")}
                />
              )}
              {(errors.employeeID || fileErrors.employeeID) && (
                <p className="invalid-feedback">
                  {fileErrors.employeeID ||
                    (errors.employeeID?.message as string)}
                </p>
              )}
            </td>
          </tr>
          <tr>
            <td>
              Doctor's Note or Request{" "}
              <span className="required-asterisk">*</span>
            </td>
            <td className="d-flex justify-content-start">
              {uploadingField === "docRequest" ? (
                <div className="uploading-indicator">
                  <span className="spinner-border spinner-border-sm"></span>
                  <span className="uploading-text">Uploading...</span>
                </div>
              ) : uploadedUrls.docRequest ? (
                <div className="uploaded-file-actions">
                  <button
                    type="button"
                    className="uploaded-file-view-btn"
                    onClick={() =>
                      openModal(
                        getFilePreviewObj(
                          uploadedUrls.docRequest,
                          "document.pdf"
                        )
                      )
                    }
                  >
                    View Uploaded File
                  </button>
                  <button
                    type="button"
                    className="uploaded-file-reupload-btn"
                    onClick={() => {
                      setUploadedUrls((prev) => ({
                        ...prev,
                        docRequest: null,
                      }));
                      setValue("docRequest", null);
                    }}
                  >
                    Re-upload
                  </button>
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
                  onChange={handleFileChange("docRequest")}
                />
              )}
              {(errors.docRequest || fileErrors.docRequest) &&
                !(
                  errors.docRequest?.message ===
                  "Please upload your doctor's request/order"
                ) && (
                  <p className="invalid-feedback">
                    {fileErrors.docRequest ||
                      (errors.docRequest?.message as string)}
                  </p>
                )}
            </td>
          </tr>
          <tr>
            <td>
              Hospital Receipt/Invoice{" "}
              <span className="required-asterisk">*</span>
            </td>
            <td className="d-flex justify-content-start">
              {uploadingField === "hospitalInvoice" ? (
                <div className="uploading-indicator">
                  <span className="spinner-border spinner-border-sm"></span>
                  <span className="uploading-text">Uploading...</span>
                </div>
              ) : uploadedUrls.hospitalInvoice ? (
                <div className="uploaded-file-actions">
                  <button
                    type="button"
                    className="uploaded-file-view-btn"
                    onClick={() =>
                      openModal(
                        getFilePreviewObj(
                          uploadedUrls.hospitalInvoice,
                          "invoice.pdf"
                        )
                      )
                    }
                  >
                    View Uploaded File
                  </button>
                  <button
                    type="button"
                    className="uploaded-file-reupload-btn"
                    onClick={() => {
                      setUploadedUrls((prev) => ({
                        ...prev,
                        hospitalInvoice: null,
                      }));
                      setValue("hospitalInvoice", null);
                    }}
                  >
                    Re-upload
                  </button>
                </div>
              ) : (
                <input
                  id="hospitalInvoice"
                  type="file"
                  accept=".pdf, .png, .jpg, .jpeg"
                  className={`form-control ${
                    errors.hospitalInvoice || fileErrors.hospitalInvoice
                      ? "is-invalid"
                      : ""
                  }`}
                  {...register("hospitalInvoice")}
                  name="hospitalInvoice"
                  onChange={handleFileChange("hospitalInvoice")}
                />
              )}
              {(errors.hospitalInvoice || fileErrors.hospitalInvoice) &&
                !(
                  errors.hospitalInvoice?.message ===
                  "Please upload the hospital invoice"
                ) && (
                  <p className="invalid-feedback">
                    {fileErrors.hospitalInvoice ||
                      (errors.hospitalInvoice?.message as string)}
                  </p>
                )}
            </td>
          </tr>
          <tr>
            <td>
              Laboratory Receipt/Invoice{" "}
              <span className="required-asterisk">*</span>
            </td>
            <td className="d-flex justify-content-start">
              {uploadingField === "labInvoice" ? (
                <div className="uploading-indicator">
                  <span className="spinner-border spinner-border-sm"></span>
                  <span className="uploading-text">Uploading...</span>
                </div>
              ) : uploadedUrls.labInvoice ? (
                <div className="uploaded-file-actions">
                  <button
                    type="button"
                    className="uploaded-file-view-btn"
                    onClick={() =>
                      openModal(
                        getFilePreviewObj(
                          uploadedUrls.labInvoice,
                          "lab_invoice.pdf"
                        )
                      )
                    }
                  >
                    View Uploaded File
                  </button>
                  <button
                    type="button"
                    className="uploaded-file-reupload-btn"
                    onClick={() => {
                      setUploadedUrls((prev) => ({
                        ...prev,
                        labInvoice: null,
                      }));
                      setValue("labInvoice", null);
                    }}
                  >
                    Re-upload
                  </button>
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
                  onChange={handleFileChange("labInvoice")}
                />
              )}
              {(errors.labInvoice || fileErrors.labInvoice) &&
                !(
                  errors.labInvoice?.message ===
                  "Please upload the laboratory invoice"
                ) && (
                  <p className="invalid-feedback">
                    {fileErrors.labInvoice ||
                      (errors.labInvoice?.message as string)}
                  </p>
                )}
            </td>
          </tr>
          <tr>
            <td>
              Applicant's Signature <span className="required-asterisk">*</span>
            </td>
            <td className="d-flex justify-content-start">
              {uploadingField === "applicantSignature" ? (
                <div className="uploading-indicator">
                  <span className="spinner-border spinner-border-sm"></span>
                  <span className="uploading-text">Uploading...</span>
                </div>
              ) : uploadedUrls.applicantSignature ? (
                <div className="uploaded-file-actions">
                  <button
                    type="button"
                    className="uploaded-file-view-btn"
                    onClick={() =>
                      openModal(
                        getFilePreviewObj(
                          uploadedUrls.applicantSignature,
                          "signature.png"
                        )
                      )
                    }
                  >
                    View Uploaded File
                  </button>
                  <button
                    type="button"
                    className="uploaded-file-reupload-btn"
                    onClick={() => {
                      setUploadedUrls((prev) => ({
                        ...prev,
                        applicantSignature: null,
                      }));
                      setValue("applicantSignature", null);
                    }}
                  >
                    Re-upload
                  </button>
                </div>
              ) : (
                <input
                  id="applicantSignature"
                  type="file"
                  accept=".pdf, .png, .jpg, .jpeg"
                  className={`form-control ${
                    errors.applicantSignature || fileErrors.applicantSignature
                      ? "is-invalid"
                      : ""
                  }`}
                  {...register("applicantSignature")}
                  name="applicantSignature"
                  onChange={handleFileChange("applicantSignature")}
                />
              )}
              {(errors.applicantSignature || fileErrors.applicantSignature) &&
                // Suppress both "This field is required" and "Please upload your signature"
                !(
                  errors.applicantSignature?.message ===
                    "This field is required" ||
                  errors.applicantSignature?.message ===
                    "Please upload your signature" ||
                  errors.applicantSignature?.message ===
                    "Please upload the applicant's signature"
                ) && (
                  <p className="invalid-feedback">
                    {fileErrors.applicantSignature ||
                      (errors.applicantSignature?.message as string)}
                  </p>
                )}
            </td>
          </tr>
        </tbody>
      </table>

      <div className="claim-request-container">
        <div className="claim-request">
          <div>
            <label htmlFor="claimRequestCount"> </label>
            How many claims do you want to request?{" "}
            <span className="required-asterisk">*</span>
            <br />
            <span className="claim-example">
              (e.g. Multiple Therapy Visits for 3 weeks, Scheduled multiple
              operations)
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

              <span className="claim-text" style={{ fontWeight: "normal" }}>
                {" "}
                claims
              </span>
            </div>
            {errors.claimRequestCount && (
              <span
                className="text-danger claim-error"
                style={{ fontWeight: "normal" }}
              >
                {" "}
                {errors.claimRequestCount.message}
              </span>
            )}
          </div>
        </div>
      </div>
      {isModalOpen && <ViewFiles file={previewFile} onClose={closeModal} />}
    </div>
  );
};

export default FormMedicalFiles;
