import { useState, useEffect } from "react";
import { FieldValues, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import "react-datepicker/dist/react-datepicker.css";
import "./FormBody.css";
import FormPersonalInfo from "./FormPersonalInfo.tsx";
import FormMedicalInfo from "./FormMedicalInfo.tsx";
import FormTeachingInfo from "./FormTeachingInfo.tsx";
import FormUploadDisclaimer from "./FormUploadDisclaimer.tsx";
import FormMedicalFiles from "./FormMedicalFiles.tsx";
import FormHospitalStatus from "./FormHospitalStatus.tsx";
import FormCertify from "./FormCertify.tsx";
import ValidationErrorDropdown from "./ValidationErrorDropdown.tsx";
import { addDoc, collection } from "firebase/firestore";
import { auth, db } from "../../../../contexts/firebase.ts";
import { useNavigate } from "react-router-dom";
import Popout from "../../../Page Elements/Popout/Popout.tsx";
import { FiCheck, FiArrowRight, FiX } from "react-icons/fi";
import { useAutofill, applyAutofill } from "../FormUtil/Autofill.ts";
import { pushPendingNotification } from "../../../Page Elements/NotifBadge/NotifTrigger.ts";
import { baseFormSchema, UnifiedFormData } from "../FormUtil/formTypes.ts";
import { useRevisionStore } from "../../../Page Elements/RevisionFuncs/revisionStore.ts";
import { useRemoveRequest } from "../../../Page Elements/RevisionFuncs/removeRequest.ts";
import {
  saveFormData,
  loadFormData,
  clearFormData,
} from "../FormUtil/formPresistence.ts";
import { convertToMMDDYYYY } from "../../../../utils/dateUtils.ts";

interface FormBodyProps {
  origFormType: string;
}

function getFileUrl(value: any): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  return null;
}

const FormBody = ({ origFormType }: FormBodyProps) => {
  const [dateHired, setDateHired] = useState<Date | null>(null);
  const [dateRetired, setDateRetired] = useState<Date | null>(null);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [isNotificationHiding, setIsNotificationHiding] = useState(false);
  const [showClearConfirmation, setShowClearConfirmation] =
    useState<boolean>(false);
  const [formIdString] = useState<string>("");
  const [submissionStatus, setSubmissionStatus] = useState<
    "processing" | "success" | "error"
  >("processing");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [uploadProgress, setUploadProgress] =
    useState<string>("Preparing files...");
  const navigate = useNavigate();
  const [phoneInputValue, setPhoneInputValue] = useState<string>("+63");
  const [shouldReapplyAutofill, setShouldReapplyAutofill] = useState(false);
  const { resetRevision, isRevisionMode, transactionId } = useRevisionStore();
  const { removeRequest } = useRemoveRequest();
  const [formSubmitted, setFormSubmitted] = useState(false);

  const createFormSchema = (formType: string) =>
    baseFormSchema
      .extend({
        hospital: z
          .string({
            required_error: "Please enter a valid hospital name",
            invalid_type_error: "Hospital name must be text",
          })
          .min(1, "Please enter a valid hospital name"),
        illness: z
          .string({
            required_error: "Please specify your illness/condition",
            invalid_type_error: "Illness/condition must be text",
          })
          .min(1, "Please specify your illness/condition"),
        physician: z
          .string({
            required_error: "Please enter your attending physician's name",
            invalid_type_error: "Physician name must be text",
          })
          .min(1, "Please enter your attending physician's name"),
        procedures: z
          .string({
            required_error: "Please specify the medical procedure",
            invalid_type_error: "Medical procedures must be text",
          })
          .min(1, "Please specify the medical procedure"),
        procedureSpecify: z
          .string({
            required_error: "Please specify the medical procedure",
            invalid_type_error: "Procedure specification must be text",
          })
          .min(1, "Please specify the procedure"),
        confinementFrom: z.string().optional(),
        confinementTo: z.string().optional(),
        term: z.string().nonempty("Please select the academic term"),
        year: z.string().nonempty("Please select the academic year"),
        load: z.coerce
          .number({
            required_error: "Please enter your teaching load",
            invalid_type_error: "Teaching load must be a number",
          })
          .min(0, "Teaching load cannot be negative")
          .max(30, "Teaching load cannot exceed 30 units"),
        status: z.preprocess(
          (val) => (val === null ? "" : val),
          z.string().nonempty("Please select your employment status")
        ),
        dateHired: z
          .string({
            invalid_type_error: "Please select a valid date",
          })
          .nullable()
          .transform((val) => {
            if (!val) return null;
            return convertToMMDDYYYY(val);
          })
          .optional(),
        dateRetired: z
          .string({
            invalid_type_error: "Please select a valid date",
          })
          .nullable()
          .transform((val) => {
            if (!val) return null;
            return convertToMMDDYYYY(val);
          })
          .optional(),
        benefits: z.preprocess(
          (val) => (val === null ? "" : val),
          z.string().nonempty("Please select your health benefits")
        ),
        hmo: z.string().nullable().optional(),
        docRequest: z.any().refine((files) => files && files.length > 0, {
          message: "Please upload your doctor's request/order",
        }),
        hospitalInvoice: z.any().refine((files) => files && files.length > 0, {
          message: "Please upload the hospital invoice",
        }),
        labInvoice: z.any().refine((files) => files && files.length > 0, {
          message: "Please upload the laboratory invoice",
        }),
        hospitalStatus:
          formType === "inpatient"
            ? z.enum(["In-Patient", "Out-Patient", "ER Consultation"], {
                errorMap: () => ({
                  message: "Please select your hospital status",
                }),
              })
            : z.any().optional(),
      })
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
        if (data.benefits === "HMO" && (!data.hmo || data.hmo.trim() === "")) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Please specify your HMO provider name",
            path: ["hmo"],
          });
        }
        if (formType === "inpatient") {
          if (!data.confinementFrom) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Please select the confinement start date",
              path: ["confinementFrom"],
            });
          }
          if (!data.confinementTo) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Please select the confinement end date",
              path: ["confinementTo"],
            });
          }
          if (data.confinementFrom && data.confinementTo) {
            const fromDate = new Date(data.confinementFrom);
            const toDate = new Date(data.confinementTo);
            const today = new Date();

            if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Please enter valid dates",
                path: ["confinementFrom"],
              });
            } else if (fromDate > toDate) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Confinement start date must be before end date",
                path: ["confinementFrom"],
              });
            } else if (fromDate > today) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Confinement start date cannot be in the future",
                path: ["confinementFrom"],
              });
            } else {
              const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              if (diffDays > 60) {
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: "Confinement period cannot exceed 60 days",
                  path: ["confinementTo"],
                });
              }
            }
          }
        }
      });

  const schema = createFormSchema(origFormType);

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
    defaultValues: {
      gender: undefined,
      college: "",
      term: "",
      year: "",
      status: "",
      benefits: "",
      hospitalStatus: undefined,
    },
  });

  useEffect(() => {
    const savedData = loadFormData(origFormType);
    if (savedData) {
      reset(savedData);
    }
  }, [origFormType, reset]);

  useEffect(() => {
    const subscription = watch((data) => {
      saveFormData(origFormType, data);
    });
    return () => subscription.unsubscribe();
  }, [watch, origFormType]);

  const closeNotification = () => {
    setIsNotificationHiding(true);

    setTimeout(() => {
      setShowSuccessNotification(false);
      setIsNotificationHiding(false);
    }, 300);
  };

  const onSubmit = async (data: FieldValues) => {
    setFormSubmitted(true);
    setSubmissionStatus("processing");
    setShowSuccessNotification(true);

    try {
      const email = auth?.currentUser?.email;
      const transID = isRevisionMode ? transactionId : "TRN" + Date.now();

      for (let i = data.claimRequestCount - 1; i >= 0; i--) {
        setUploadProgress("Creating document...");
        const newDoc = {
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
            formType: "hospital",
            origFormType: origFormType,
            lastname: data.lastname,
            firstname: data.firstname,
            middlename: data.middlename,
            suffix: data.suffix,
            age: data.age,
            gender: data.gender,
            contact: data.contact,
            college: data.college,
            hospital: data.hospital,
            illness: data.illness,
            physician: data.physician,
            procedures: data.procedures,
            ...(origFormType === "inpatient" && {
              confinementFrom: data.confinementFrom,
              confinementTo: data.confinementTo,
            }),
            term: data.term,
            year: data.year,
            load: data.load,
            status: data.status,
            benefits: data.benefits,
            hmo: data.hmo,
            docRequest: getFileUrl(data.docRequest)
              ? { url: getFileUrl(data.docRequest), filename: "document.pdf" }
              : "",
            hospitalInvoice: getFileUrl(data.hospitalInvoice)
              ? { url: getFileUrl(data.hospitalInvoice), filename: "invoice.pdf" }
              : "",
            labInvoice: getFileUrl(data.labInvoice)
              ? { url: getFileUrl(data.labInvoice), filename: "lab_invoice.pdf" }
              : "",
            ...(getFileUrl(data.employeeID)
              ? {
                  employeeID: {
                    url: getFileUrl(data.employeeID),
                    filename: "employee_id.pdf",
                  },
                }
              : {}),
            applicantSignature: getFileUrl(data.applicantSignature)
              ? { url: getFileUrl(data.applicantSignature), filename: "signature.png" }
              : "",
            hospitalStatus: data.hospitalStatus,
            claimRequestCount: data.claimRequestCount,
          },
        };

        if (isRevisionMode) {
          try {
            await removeRequest(transactionId);
            console.log(
              `Attempted to remove request with ID: ${transactionId}`
            );
          } catch (error) {
            console.error("Error removing previous request:", error);
          }
        }

        setUploadProgress("Saving to database...");
        await addDoc(collection(db, "FormRequests"), newDoc);

        console.log("Document written with Transaction ID: ", transID);

        await pushPendingNotification(transID);

        setSubmissionStatus("success");

        resetRevision();
        reset();
      }

      clearFormData(origFormType);
    } catch (error) {
      console.error(error);
      setSubmissionStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    }
  };

  const handleTrackingClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate("/tracking");
  };

  const handleClearConfirm = () => {
    reset({
      gender: undefined,
      college: "",
      term: "",
      year: "",
      status: "",
      benefits: "",
      hospitalStatus: undefined,
    });

    setShouldReapplyAutofill(true);

    setDateHired(null);
    setDateRetired(null);
    setPhoneInputValue("+63");
    setShowClearConfirmation(false);

    clearFormData(origFormType);
  };

  const handleClearCancel = () => {
    setShowClearConfirmation(false);
  };

  useAutofill<UnifiedFormData>(
    setValue,
    setDateHired,
    setDateRetired,
    setPhoneInputValue
  );

  useEffect(() => {
    if (shouldReapplyAutofill) {
      applyAutofill<UnifiedFormData>(
        setValue,
        setDateHired,
        setDateRetired,
        setPhoneInputValue
      );
      setShouldReapplyAutofill(false);
    }
  }, [
    shouldReapplyAutofill,
    setValue,
    setDateHired,
    setDateRetired,
    setPhoneInputValue,
  ]);

  return (
    <div className="form-body">
      <form onSubmit={handleSubmit(onSubmit)}>
        {isSubmitted && Object.keys(errors).length > 0 && (
          <ValidationErrorDropdown errors={errors} />
        )}

        {origFormType === "inpatient" && (
          <FormHospitalStatus register={register} errors={errors} />
        )}

        <FormPersonalInfo
          register={register}
          errors={errors}
          setValue={setValue}
          watch={watch}
          phoneInputValue={phoneInputValue}
          setPhoneInputValue={setPhoneInputValue}
        />
        <FormMedicalInfo
          register={register}
          errors={errors}
          formType={origFormType}
          watch={watch}
          setValue={setValue}
        />
        <FormTeachingInfo
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
        <FormMedicalFiles
          register={register}
          errors={errors}
          setError={setError}
          setValue={setValue}
          setFormSubmitted={setFormSubmitted}
        />
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
                ? uploadProgress
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
    </div>
  );
};

export default FormBody;
