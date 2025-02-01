import React from "react";
import { UseFormRegister, FieldErrors } from "react-hook-form";
import { FormData } from "./FormBody";

interface FormPersonalInfoProps {
  register: UseFormRegister<FormData>;
  errors: FieldErrors<FormData>;
}

const suffixOptions = [
  "Sr.",
  "Jr.",
  "II",
  "III",
  "IV",
  "MD",
  "PhD",
  "Lord",
  "Master",
  "Optimus Prime",
];
const genderOptions = ["Male", "Female"];
const collegeOptions = ["asd"];

const FormPersonalInfo: React.FC<FormPersonalInfoProps> = ({
  register,
  errors,
}) => {
  return (
    <fieldset className="PersonalInfo">
      <div className="row">
        <div className="mb-1 col-md-3">
          <label htmlFor="lastname" className="form-label">
            Last Name
          </label>
          <input
            {...register("lastname")}
            id="lastname"
            type="text"
            className="form-control"
          />
          {errors.lastname && (
            <p className="text-danger">{errors.lastname.message}</p>
          )}
        </div>
        <div className="mb-1 col-md-3">
          <label htmlFor="firstname" className="form-label">
            First Name
          </label>
          <input
            {...register("firstname")}
            id="firstname"
            type="text"
            className="form-control"
          />
          {errors.firstname && (
            <p className="text-danger">{errors.firstname.message}</p>
          )}
        </div>
        <div className="mb-1 col-md-3">
          <label htmlFor="middlename" className="form-label">
            Middle Name
          </label>
          <input
            {...register("middlename")}
            id="middlename"
            type="text"
            className="form-control"
          />
          {errors.middlename && (
            <p className="text-danger">{errors.middlename.message}</p>
          )}
        </div>
        <div className="mb-1 col-md-3">
          <label htmlFor="suffix" className="form-label">
            Suffix
          </label>
          <select {...register("suffix")} id="suffix" className="form-select">
            <option value="" disabled selected hidden></option>
            {suffixOptions.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="row">
        <div className="mb-1 col-md-1">
          <label htmlFor="age" className="form-label">
            Age
          </label>
          <input
            {...register("age", { valueAsNumber: true })}
            id="age"
            type="number"
            className="form-control"
          />
          {errors.age && <p className="text-danger">{errors.age.message}</p>}
        </div>
        <div className="mb-1 col-md-2">
          <label htmlFor="gender" className="form-label">
            Gender
          </label>
          <select {...register("gender")} id="gender" className="form-select">
            <option value="" disabled selected hidden></option>
            {genderOptions.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
          {errors.gender && (
            <p className="text-danger">{errors.gender.message}</p>
          )}
        </div>
        <div className="mb-1 col-md-6">
          <label htmlFor="college" className="form-label">
            College Affiliation
          </label>
          <select {...register("college")} id="college" className="form-select">
            <option value="" disabled selected hidden></option>
            {collegeOptions.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
          {errors.college && (
            <p className="text-danger">{errors.college.message}</p>
          )}
        </div>
        <div className="mb-1 col-md-3">
          <label htmlFor="contact" className="form-label">
            Contact Number
          </label>
          <input
            {...register("contact", { valueAsNumber: true })}
            id="contact"
            type="number"
            className="form-control"
          />
          {errors.contact && (
            <p className="text-danger">{errors.contact.message}</p>
          )}
        </div>
      </div>
    </fieldset>
  );
};

export default FormPersonalInfo;
