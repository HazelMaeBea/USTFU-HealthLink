import React, { useState } from "react";
import { UseFormRegister, FieldErrors } from "react-hook-form";
import { FormData } from "./FormBody";

interface FormTeachingInfoProps {
  register: UseFormRegister<FormData>;
  errors: FieldErrors<FormData>;
  dateHired: Date | null;
  setDateHired: React.Dispatch<React.SetStateAction<Date | null>>;
  dateRetired: Date | null;
  setDateRetired: React.Dispatch<React.SetStateAction<Date | null>>;
}

const termOptions = ["1st", "2nd"];
const yearOptions = ["2021-2022", "2022-2023", "2023-2024"];
const loadOptions = ["Full", "Part"];
const statusOptions = [
  "Tenured",
  "Tenured-Track",
  "Lecturer Before 2001",
  "Extendee",
  "Retiree",
];
const benefitsOptions = ["HMO", "PCSO", "Senior Citizen"];

const FormTeachingInfo: React.FC<FormTeachingInfoProps> = ({
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

  const handleBenefitChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setBenefit(event.target.value);
  };

  return (
    <>
      <hr className="section-separator" />
      <fieldset className="TeachingInfo">
        <div className="row">
          <div className="mb-1 col-md-4">
            <div className="row">
              <div className="mb-1 col-md-6">
                <label htmlFor="term" className="form-label">
                  Academic Term
                </label>
                <select {...register("term")} id="term" className="form-select">
                  <option value="" disabled selected hidden></option>
                  {termOptions.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {errors.term && (
                  <p className="text-danger">{errors.term.message}</p>
                )}
              </div>
              <div className="mb-1 col-md-6">
                <label htmlFor="year" className="form-label">
                  Academic Year
                </label>
                <select {...register("year")} id="year" className="form-select">
                  <option value="" disabled selected hidden></option>
                  {yearOptions.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {errors.year && (
                  <p className="text-danger">{errors.year.message}</p>
                )}
              </div>
            </div>
            <div className="mb-1 col-md-12">
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
              {errors.load && (
                <p className="text-danger">{errors.load.message}</p>
              )}
            </div>
          </div>
          <div className="mb-1 col-md-2">
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
          <div className="mb-1 col-md-3">
            <div
              className="mb-1 col-md-12 date-hired-picker"
              style={{ display: status === "Tenured-Track" ? "block" : "none" }}
            >
              <label htmlFor="dateHired" className="form-label">
                If Tenure-Track, please input DATE HIRED:
              </label>
              <input
                type="date"
                value={dateHired ? dateHired.toISOString().split("T")[0] : ""}
                onChange={(e) =>
                  setDateHired(e.target.value ? new Date(e.target.value) : null)
                }
                id="dateHired"
                className="form-control"
                name="dateHired"
                style={{ color: "black" }}
              />
              {errors.dateHired && (
                <p className="text-danger">{errors.dateHired.message}</p>
              )}
            </div>
            <div
              className="mb-1 col-md-12 date-retired-picker"
              style={{ display: status === "Retiree" ? "block" : "none" }}
            >
              <label htmlFor="dateRetired" className="form-label">
                If Retiree, please input DATE RETIRED:
              </label>
              <input
                type="date"
                value={
                  dateRetired ? dateRetired.toISOString().split("T")[0] : ""
                }
                onChange={(e) =>
                  setDateRetired(
                    e.target.value ? new Date(e.target.value) : null
                  )
                }
                id="dateRetired"
                className="form-control"
                name="dateRetired"
                style={{ color: "black" }}
              />
              {errors.dateRetired && (
                <p className="text-danger">{errors.dateRetired.message}</p>
              )}
            </div>
          </div>
          <div className="mb-1 col-md-3">
            <label className="form-label">Health Benefits</label>
            {benefitsOptions.map((option, index) => (
              <div key={index} className="form-check">
                <input
                  {...register("benefits")}
                  id={`benefits-${index}`}
                  type="radio"
                  value={option}
                  className="form-check-input"
                  onChange={handleBenefitChange}
                />
                <label
                  htmlFor={`benefits-${index}`}
                  className="form-check-label"
                >
                  {option}
                </label>
              </div>
            ))}
            {errors.benefits && (
              <p className="text-danger">{errors.benefits.message}</p>
            )}
            <p></p>
            {/* empty space */}
            <div
              className="mb-1 col-md-12 hmo-input"
              style={{ display: benefit === "HMO" ? "block" : "none" }}
            >
              <label htmlFor="hmo" className="form-label">
                If HMO, please specify:
              </label>
              <input
                {...register("hmo")}
                id="hmo"
                type="text"
                className="form-control"
              />
              {errors.hmo && (
                <p className="text-danger">{errors.hmo.message}</p>
              )}
            </div>
          </div>
        </div>
      </fieldset>
    </>
  );
};

export default FormTeachingInfo;
