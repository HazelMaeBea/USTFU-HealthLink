import React from "react";
import { UseFormRegister, FieldErrors } from "react-hook-form";
import { FormData } from "./FormBody";

interface FormCertifyProps {
  register: UseFormRegister<FormData>;
  errors: FieldErrors<FormData>;
}

const FormCertify: React.FC<FormCertifyProps> = ({ register, errors }) => {
  return (
    <fieldset className="certify">
      <div className="form-check form-check-inline">
        <input
          {...register("certify")}
          id="certify"
          type="radio"
          value="Yes"
          className="form-check-input"
        />
        <label htmlFor="certify" className="form-check-label">
          <p>
            I hereby certify that all information in this application is TRUE
            and CORRECT and any misrepresentation of facts shall be <br></br>
            sufficient cause for denial of this benefit. For any amount in
            excess of my maximum medical & hospitalization benefit, I am
            <br></br>personally liable to pay directly to UST Hospital
          </p>
        </label>
      </div>
      {errors.certify && (
        <p className="text-danger">{errors.certify.message}</p>
      )}
    </fieldset>
  );
};

export default FormCertify;
