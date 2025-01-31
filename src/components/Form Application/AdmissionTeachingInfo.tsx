import React from "react";
import { UseFormRegister, FieldErrors } from "react-hook-form";
import { FormData } from "./FormBody"; // Import FormData type

interface AdmissionTeachingInfoProps {
  register: UseFormRegister<FormData>; // Use FormData type
  errors: FieldErrors<FormData>; // Use FormData type
}

const loadOptions = ["Full", "Part"];
const statusOptions = [
  "Tenured",
  "Tenured-Track",
  "Lecturer Before 2001",
  "Extendee",
  "Retiree",
];
const AdmissionTeachingInfo: React.FC<AdmissionTeachingInfoProps> = ({
  register,
  errors,
}) => {
  return (
    <fieldset>
      <div className="row admissionTeaching">
        <div className="mb-1 col-md-3">
          <label htmlFor="load" className="form-label">
            Teaching Load
          </label>
          <select {...register("load")} id="load" className="form-select">
            <option value="" disabled selected hidden></option>
            {loadOptions.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
          {errors.load && <p className="text-danger">{errors.load.message}</p>}
        </div>

        <div className="mb-1 col-md-9">
          <p>Status</p>
          <label className="form-label"></label>
          {statusOptions.map((option, index) => (
            <div key={index} className="form-check form-check-inline">
              <input
                {...register("status")}
                id={`status-${index}`}
                type="radio"
                value={option}
                className="form-check-input"
              />
              <label htmlFor={`status-${index}`} className="form-check-label">
                {option}
              </label>
            </div>
          ))}
          {errors.status && (
            <p className="text-danger">{errors.status.message}</p>
          )}
        </div>
      </div>
    </fieldset>
  );
};

export default AdmissionTeachingInfo;
