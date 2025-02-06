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
    <fieldset className="medicalFiles fieldset-no-line">
      <table className="table table-borderless">
        <thead className = "table-header">
          <tr>
            <th>Document</th>
            <th>Upload</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Doctor's Note or Request</td>
            <td>
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
            </td>
          </tr>
          <tr>
            <td>Hospital Receipt/Invoice</td>
            <td>
              <label htmlFor="hospitalInvoice" className="form-label"></label>
              <input
                id="hospitalInvoice"
                type="file"
                accept=".pdf, .png, .jpg, .jpeg"
                className={`form-control ${errors.hospitalInvoice ? "is-invalid" : ""}`}
                {...register("hospitalInvoice")}
              />
              {errors.hospitalInvoice && (
                <p className="invalid-feedback">
                  {errors.hospitalInvoice?.message as string}
                </p>
              )}
            </td>
          </tr>
          <tr>
            <td>Laboratory Receipt/Invoice</td>
            <td>
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
            </td>
          </tr>
          <tr>
            <td>Employee/UST ID</td>
            <td>
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
            </td>
          </tr>
          <tr>
            <td>Applicant's Signature</td>
            <td>
              <label htmlFor="applicantSignature" className="form-label"></label>
              <input
                id="applicantSignature"
                type="file"
                accept=".pdf, .png, .jpg, .jpeg"
                className={`form-control ${errors.applicantSignature ? "is-invalid" : ""}`}
                {...register("applicantSignature")}
              />
              {errors.applicantSignature && (
                <p className="invalid-feedback">
                  {errors.applicantSignature?.message as string}
                </p>
              )}
            </td>
          </tr>
          <tr>
            <td>How many claims do you want to request?</td>
            <td>
              <input
                {...register("claimRequestCount", { valueAsNumber: true })}
                id="claimRequestCount"
                type="number"
                className="form-control"
              />
              {errors.claimRequestCount && (
                <p className="text-danger">{errors.claimRequestCount.message}</p>
              )}
            </td>
          </tr>
        </tbody>
      </table>
    </fieldset>
  );
};

export default FormMedicalFiles;
