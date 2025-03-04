import React, { useState } from "react";
import { UseFormRegister, FieldErrors } from "react-hook-form";
import { FormData } from "./FormBody"; // Import FormData type

interface AdmissionTeachingInfoProps {
  register: UseFormRegister<FormData>;
  errors: FieldErrors<FormData>;
  dateHired: Date | null;
  setDateHired: React.Dispatch<React.SetStateAction<Date | null>>;
  dateRetired: Date | null;
  setDateRetired: React.Dispatch<React.SetStateAction<Date | null>>;
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
  dateHired,
  setDateHired,
  dateRetired,
  setDateRetired,
}) => {
  const [status, setStatus] = useState("");
  const [benefit, setBenefit] = useState("");

  const handleStatusChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setStatus(event.target.value);
  };
  return (
    <fieldset>
      <div className="row admissionTeaching ">
        <div className="mb-1 col-md-3 align-self-start">
          <label htmlFor="load" className="form-label">
            Teaching Load
          </label>
          <select {...register("load")} id="load" className="form-select">
            <option value="" disabled selected hidden>
              Select teaching load
            </option>
            {loadOptions.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
          {errors.load && <p className="text-danger">{errors.load.message}</p>}
        </div>

        <div className="mb-1 col-md-1">{/* empy space */}</div>

        <div className="mb-1 col-md-4 ">
          <label className="form-label">Status</label>
          {statusOptions.map((option, index) => (
            <div key={index} className="form-check">
              <input
                {...register("status")}
                id={`status-${index}`}
                type="radio"
                value={option}
                className="form-check-input"
                onChange={handleStatusChange}
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

        <div className="mb-1 col-md-4">
          <div
            className="mb-1 col-md-12 date-hired-picker"
            style={{
              display: status === "Tenured-Track" ? "block" : "none",
            }}
          >
            <label htmlFor="dateHired" className="form-label">
              If Tenure-Track, please input DATE HIRED:
              <span className="date-format">(MM/DD/YYYY)</span>
            </label>
            <input
              type="date"
              {...register("dateHired")}
              id="dateHired"
              className={`form-control ${errors.dateHired ? "is-invalid" : ""}`}
              onChange={(e) => {
                const date = e.target.value ? new Date(e.target.value) : null;
                setDateHired(date);
                // Trigger register onChange
                register("dateHired").onChange(e);
              }}
              style={{ color: "black" }}
            />
            {errors.dateHired && (
              <p className="text-danger">{errors.dateHired.message}</p>
            )}
          </div>
          <div
            className="mb-1 col-md-12 date-retired-picker"
            style={{
              display: status === "Retiree" ? "block" : "none",
            }}
          >
            <label htmlFor="dateRetired" className="form-label">
              If Retiree, please input DATE RETIRED:
              <span className="date-format">(MM/DD/YYYY)</span>
            </label>
            <input
              type="date"
              value={dateRetired ? dateRetired.toISOString().split("T")[0] : ""}
              {...register("dateRetired")} // Remove the validation here
              id="dateRetired"
              className={`form-control ${
                errors.dateRetired ? "is-invalid" : ""
              }`}
              onChange={(e) => {
                const date = e.target.value ? new Date(e.target.value) : null;
                setDateRetired(date);
                register("dateRetired").onChange(e);
              }}
              style={{ color: "black" }}
            />
            {errors.dateRetired && (
              <p className="text-danger">{errors.dateRetired.message}</p>
            )}
          </div>
        </div>
      </div>
    </fieldset>
  );
};

export default AdmissionTeachingInfo;
