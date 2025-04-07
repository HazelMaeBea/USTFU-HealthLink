import React, { useEffect } from "react";
import {
  UseFormRegister,
  FieldErrors,
  UseFormWatch,
  UseFormSetValue,
} from "react-hook-form";
import { UnifiedFormData } from "../FormUtil/formTypes";
import { useRevisionStore } from "../../../Page Elements/RevisionFuncs/revisionStore.ts";

interface FormMedicalInfoProps {
  register: UseFormRegister<UnifiedFormData>;
  errors: FieldErrors<UnifiedFormData>;
  formType?: string; // Add formType prop
  watch?: UseFormWatch<UnifiedFormData>; // Add watch prop to monitor field changes
  setValue: UseFormSetValue<UnifiedFormData>;
}

const procedureOptions = [
  "Physical Therapy",
  "Consultation",
  "Surgery",
  "Checkup",
  "X-ray",
  "MRI",
  "Blood Test",
  "Vaccination",
  "Other",
];

const FormMedicalInfo: React.FC<FormMedicalInfoProps> = ({
  register,
  errors,
  formType,
  watch,
  setValue,
}) => {
  const { formData, isRevisionMode } = useRevisionStore();

  useEffect(() => {
    if (isRevisionMode) {
      // If in revision mode, prefill form using formData from store
      if (formData) {
        Object.keys(formData).forEach((key) => {
          // Cast key to a valid key of UnifiedFormData
          setValue(
            key as keyof UnifiedFormData,
            formData[key as keyof UnifiedFormData]
          );
        });
      }
    } else {
      <p>"No Form Data"</p>;
    }
  }, [formData, isRevisionMode, setValue]);
  // Helper function to format date as YYYY-MM-DD for date inputs
  const formatDateForInput = (date: Date | null) => {
    if (!date) return "";
    return date.toISOString().split("T")[0];
  };

  // Get today's date for max attribute
  const today = formatDateForInput(new Date());

  // Watch the confinementFrom value to set the min date for confinementTo
  const confinementFromValue = watch ? watch("confinementFrom") : "";

  return (
    <fieldset className="MedicalInfo">
      <div className="row">
        <div className="mb-1 col-md-3">
          <label htmlFor="hospital" className="form-label">
            Hospital Name <span className="required-asterisk">*</span>
          </label>
          <input
            {...register("hospital")}
            id="hospital"
            type="text"
            className="form-control"
            placeholder="e.g. UST Hospital..."
          />
          {errors.hospital && (
            <p className="text-danger">{errors.hospital.message as string}</p>
          )}
        </div>
        <div className="mb-1 col-md-6">
          <label htmlFor="illness" className="form-label">
            Nature of Illness <span className="required-asterisk">*</span>
          </label>
          <input
            {...register("illness")}
            id="illness"
            type="text"
            className="form-control"
            placeholder="e.g. Chronic Back Pain..."
          />
          {errors.illness && (
            <p className="text-danger">{errors.illness.message as string}</p>
          )}
        </div>
        <div className="mb-1 col-md-3">
          <label htmlFor="physician" className="form-label">
            Physician <span className="required-asterisk">*</span>
          </label>
          <input
            {...register("physician")}
            id="physician"
            type="text"
            className="form-control"
            placeholder="e.g. Dr. John Smith..."
          />
          {errors.physician && (
            <p className="text-danger">{errors.physician.message as string}</p>
          )}
        </div>
      </div>

      {/* Conditionally render confinement dates for inpatient forms only */}
      {formType === "inpatient" && (
        <div className="row">
          <div className="mb-1 col-md-6">
            <label htmlFor="confinementFrom" className="form-label">
              Confinement From <span className="required-asterisk">*</span>
            </label>
            <input
              {...register("confinementFrom")}
              id="confinementFrom"
              type="date"
              className="form-control"
              max={today} // Keep max as today for start date
            />
            {errors.confinementFrom && (
              <p className="text-danger">
                {errors.confinementFrom.message as string}
              </p>
            )}
          </div>
          <div className="mb-1 col-md-6">
            <label htmlFor="confinementTo" className="form-label">
              Confinement To <span className="required-asterisk">*</span>
            </label>
            <input
              {...register("confinementTo")}
              id="confinementTo"
              type="date"
              className="form-control"
              min={confinementFromValue} // Keep min date constraint
            />
            {errors.confinementTo && (
              <p className="text-danger">
                {errors.confinementTo.message as string}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="row">
        <div className="mb-1 col-md-6">
          <label htmlFor="procedures" className="form-label">
            Procedures <span className="required-asterisk">*</span>
          </label>
          <select
            {...register("procedures")}
            id="procedures"
            className="form-select"
            defaultValue=""
          >
            <option value="" disabled>
              Select procedure
            </option>
            {procedureOptions.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
          {errors.procedures && (
            <p className="text-danger">{errors.procedures.message as string}</p>
          )}
        </div>
        <div className="col-md-6">
          <label htmlFor="procedureSpecify" className="form-label">
            Specify Procedure: <span className="required-asterisk">*</span>
          </label>
          <input
            {...register("procedureSpecify", {
              required: "Specify Procedure is required",
            })}
            id="procedureSpecify"
            type="text"
            className="form-control"
            placeholder="Please specify"
          />
          {errors.procedureSpecify && (
            <p className="text-danger">
              {errors.procedureSpecify.message as string}
            </p>
          )}
        </div>
      </div>
    </fieldset>
  );
};

export default FormMedicalInfo;
