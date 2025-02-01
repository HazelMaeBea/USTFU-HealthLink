import React from "react";
import { UseFormRegister, FieldErrors } from "react-hook-form";
import { FormData } from "./FormBody";

interface FormMedicalInfoProps {
  register: UseFormRegister<FormData>;
  errors: FieldErrors<FormData>;
}

const FormMedicalInfo: React.FC<FormMedicalInfoProps> = ({ register, errors }) => {
  return (
    <fieldset className="MedicalInfo">
      <div className="row">
        <div className="mb-1 col-md-3">
          <label htmlFor="hospital" className="form-label">
            Hospital Name
          </label>
          <input
            {...register("hospital")}
            id="hospital"
            type="text"
            className="form-control"
          />
          {errors.hospital && (
            <p className="text-danger">{errors.hospital.message}</p>
          )}
        </div>
        <div className="mb-1 col-md-6">
          <label htmlFor="illness" className="form-label">
            Nature of Illness
          </label>
          <input
            {...register("illness")}
            id="illness"
            type="text"
            className="form-control"
          />
          {errors.illness && (
            <p className="text-danger">{errors.illness.message}</p>
          )}
        </div>
        <div className="mb-1 col-md-3">
          <label htmlFor="physician" className="form-label">
            Physician
          </label>
          <input
            {...register("physician")}
            id="physician"
            type="text"
            className="form-control"
          />
          {errors.physician && (
            <p className="text-danger">{errors.physician.message}</p>
          )}
        </div>
      </div>
      <div className="row">
        <div className="mb-1 col-md-6">
          <label htmlFor="procedures" className="form-label">
            Procedures
          </label>
          <input
            {...register("procedures")}
            id="procedures"
            type="text"
            className="form-control"
          />
          {errors.procedures && (
            <p className="text-danger">{errors.procedures.message}</p>
          )}
        </div>
      </div>
    </fieldset>
  );
};

export default FormMedicalInfo;
