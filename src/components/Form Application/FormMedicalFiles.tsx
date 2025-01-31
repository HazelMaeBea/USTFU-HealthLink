import React from "react";
import { UseFormRegister, FieldErrors } from "react-hook-form";
import { FormData } from "./FormBody";

interface FormMedicalFilesProps {
  register: UseFormRegister<FormData>;
  errors: FieldErrors<FormData>;
}

const FormMedicalFiles: React.FC<FormMedicalFilesProps> = ({
  register,
  errors,
}) => {
  return (
    <fieldset className="medicalFiles">
      <div className="row">
        <div className="mb-1 col-md-4 docRequest">Doctor's Note or Request</div>
        <div className="mb-1 col-md-4 fileType">PNG, JPG, PDF </div>
        <div className="mb-1 col-md-4">
          <label htmlFor="docRequest" className="form-label"></label>
          <input
            id="docRequest"
            type="file"
            accept=".pdf, .png, .jpg, .jpeg"
            className={`form-control ${errors.docRequest ? "is-invalid" : ""}`}
            {...register("docRequest")}
          />
          {errors.docRequest && (
            <p className="invalid-feedback">
              {errors.docRequest?.message as string}
            </p>
          )}
        </div>
      </div>

      <div className="row">
        <div className="mb-1 col-md-4 hospitalInvoice">
          Hospital Receipt/Invoice
        </div>
        <div className="mb-1 col-md-4 fileType">PNG, JPG, PDF </div>
        <div className="mb-1 col-md-4">
          <label htmlFor="hospitalInvoice" className="form-label"></label>
          <input
            id="hospitalInvoice"
            type="file"
            accept=".pdf, .png, .jpg, .jpeg"
            className={`form-control ${
              errors.hospitalInvoice ? "is-invalid" : ""
            }`}
            {...register("hospitalInvoice")}
          />
          {errors.hospitalInvoice && (
            <p className="invalid-feedback">
              {errors.hospitalInvoice?.message as string}
            </p>
          )}
        </div>
      </div>

      <div className="row">
        <div className="mb-1 col-md-4 labInvoice">
          Laboratory Receipt/Invoice
        </div>
        <div className="mb-1 col-md-4 fileType">PNG, JPG, PDF </div>
        <div className="mb-1 col-md-4">
          <label htmlFor="labInvoice" className="form-label"></label>
          <input
            id="labInvoice"
            type="file"
            accept=".pdf, .png, .jpg, .jpeg"
            className={`form-control ${errors.labInvoice ? "is-invalid" : ""}`}
            {...register("labInvoice")}
          />
          {errors.labInvoice && (
            <p className="invalid-feedback">
              {errors.labInvoice?.message as string}
            </p>
          )}
        </div>
      </div>

      <div className="row">
        <div className="mb-1 col-md-4 employeeID">Employee/UST ID</div>
        <div className="mb-1 col-md-4 fileType">PNG, JPG, PDF </div>
        <div className="mb-1 col-md-4">
          <label htmlFor="employeeID" className="form-label"></label>
          <input
            id="employeeID"
            type="file"
            accept=".pdf, .png, .jpg, .jpeg"
            className={`form-control ${errors.employeeID ? "is-invalid" : ""}`}
            {...register("employeeID")}
          />
          {errors.employeeID && (
            <p className="invalid-feedback">
              {errors.employeeID?.message as string}
            </p>
          )}
        </div>
      </div>

      <div className="row">
        <div className="mb-1 col-md-4 applicantSignature">
          Applicant's Signature
        </div>
        <div className="mb-1 col-md-4 fileType">PNG, JPG, PDF </div>
        <div className="mb-1 col-md-4">
          <label htmlFor="applicantSignature" className="form-label"></label>
          <input
            id="applicantSignature"
            type="file"
            accept=".pdf, .png, .jpg, .jpeg"
            className={`form-control ${
              errors.applicantSignature ? "is-invalid" : ""
            }`}
            {...register("applicantSignature")}
          />
          {errors.applicantSignature && (
            <p className="invalid-feedback">
              {errors.applicantSignature?.message as string}
            </p>
          )}
        </div>
      </div>

      <div className="form-group row mt-2">
        <label
          htmlFor="claimRequestCount"
          className="form-label col-sm-5 col-form-label col-form-label fw-bolder claimRequest"
        >
          How many claims do you want to request?
        </label>
        <div className="col-sm-1">
          <input
            {...register("claimRequestCount", { valueAsNumber: true })}
            id="claimRequestCount"
            type="number"
            className="form-control"
          />
          {errors.claimRequestCount && (
            <p className="text-danger">{errors.claimRequestCount.message}</p>
          )}
        </div>
      </div>
    </fieldset>
  );
};

export default FormMedicalFiles;
