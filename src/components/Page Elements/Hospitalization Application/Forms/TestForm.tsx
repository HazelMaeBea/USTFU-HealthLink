import React, { useState } from "react";
import { FieldValues, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import "./FormBody.css";
import FormHeader from "./FormHeader";

type FormData = z.infer<typeof schema>;

const schema = z.object({
  lastname: z.string().nonempty("Last name is required"),
  firstname: z.string().nonempty("First name is required"),
  middlename: z.string().nonempty("Middle name is required"),
  suffix: z.string().optional(),
  age: z.number().min(18, "Age must be at least 18"),
  gender: z.enum(["Male", "Female"], {
    errorMap: () => ({ message: "Gender is required" }),
  }),
  contact: z.number().min(21, "Contact number is required"),
  college: z.string().nonempty("College is required"),
  hospital: z.string().nonempty("Hospital is required"),
  illness: z.string().nonempty("Illness is required"),
  physician: z.string().nonempty("Physician is required"),
  procedures: z.string().nonempty("Procedures is required"),
  term: z.string().nonempty("Term is required"),
  year: z.string().nonempty("Year is required"),
  load: z.string().nonempty("Load is required"),
  status: z.string().nonempty("Status is required"),
  dateHired: z.string().nonempty("Date Hired is required"),
  dateRetired: z.string().nonempty("Date Retired is required"),
  benefits: z.string().nonempty("Benefits is required"),
  hmo: z.string().nonempty("HMO is required"),
  docRequest: z.any().refine((files) => files && files.length > 0, {
    message: "File is required",
  }),
  hospitalInvoice: z.any().refine((files) => files && files.length > 0, {
    message: "File is required",
  }),
  labInvoice: z.any().refine((files) => files && files.length > 0, {
    message: "File is required",
  }),
  employeeID: z.any().refine((files) => files && files.length > 0, {
    message: "File is required",
  }),
  applicantSignature: z.any().refine((files) => files && files.length > 0, {
    message: "File is required",
  }),
  hospitalStatus: z.enum(["In-Patient", "Out-Patient", "ER Consultation"], {
    errorMap: () => ({ message: "Hospital Status is required" }),
  }),
  certify: z.enum([" "], {
    errorMap: () => ({ message: "Certification is required" }),
  }),
  claimRequestCount: z.number().min(1, "Claim Request Count is required"),
});

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
const hospitalStatusOptions = ["In-Patient", "Out-Patient", "ER Consultation"];

// const [claims, setClaims] = useState(1);

// const incrementClaims = () => setClaims(claims + 1);
// const decrementClaims = () => setClaims(claims > 1 ? claims - 1 : 1);

const TestForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormData>({ resolver: zodResolver(schema), mode: "onChange" });

  const onSubmit = (data: FieldValues) => {
    console.log(data);
  };

  return (
    <div>
      <FormHeader formType="Test Form" />

      <form onSubmit={handleSubmit(onSubmit)}>
        <p className="note">Please fill out the following boxes</p>
        <fieldset className="PersonalInfo line">
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
              <select
                {...register("suffix")}
                id="suffix"
                className="form-select"
              >
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
              {errors.age && (
                <p className="text-danger">{errors.age.message}</p>
              )}
            </div>
            <div className="mb-1 col-md-2">
              <label htmlFor="gender" className="form-label">
                Gender
              </label>
              <select
                {...register("gender")}
                id="gender"
                className="form-select"
              >
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
              <select
                {...register("college")}
                id="college"
                className="form-select"
              >
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

        <fieldset className="TeachingInfo">
          <div className="row">
            <div className="mb-1 col-md-3">
              <div className="row">
                <div className="mb-1 col-md-6">
                  <label htmlFor="term" className="form-label">
                    Academic Term
                  </label>
                  <select
                    {...register("term")}
                    id="term"
                    className="form-select"
                  >
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
                  <select
                    {...register("year")}
                    id="year"
                    className="form-select"
                  >
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
            <div className="mb-1 col-md-3">
              <label className="form-label">Status</label>
              {statusOptions.map((option, index) => (
                <div key={index} className="form-check">
                  <input
                    {...register("status")}
                    id={`status-${index}`}
                    type="radio"
                    value={option}
                    className="form-check-input"
                  />
                  <label
                    htmlFor={`status-${index}`}
                    className="form-check-label"
                  >
                    {option}
                  </label>
                </div>
              ))}
              {errors.status && (
                <p className="text-danger">{errors.status.message}</p>
              )}
            </div>
            <div className="mb-1 col-md-3">
              <div className="mb-1 col-md-12">
                <label htmlFor="dateHired" className="form-label">
                  If Tenure-Track, please input DATE HIRED:
                </label>
                <input
                  {...register("dateHired")}
                  id="dateHired"
                  type="date"
                  className="form-control"
                />
                {errors.dateHired && (
                  <p className="text-danger">{errors.dateHired.message}</p>
                )}
              </div>
              <div className="mb-1 col-md-12">
                <label htmlFor="dateRetired" className="form-label">
                  If Retiree, please input DATE RETIRED:
                </label>
                <input
                  {...register("dateRetired")}
                  id="dateRetired"
                  type="date"
                  className="form-control"
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
              <div className="mb-1 col-md-12">
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

        <fieldset className="uploadDisclaimer">
          <p>Kindly upload the necessary documents needed. </p>
          <div className="row">
            <div className="mb-1 col-md-4">
              <strong>Required Attachments</strong>
            </div>
            <div className="mb-1 col-md-4">
              <strong>File Type</strong>
            </div>
            <div className="mb-1 col-md-4">
              <strong>Upload here</strong>
            </div>
          </div>
        </fieldset>

        <fieldset className="medicalFiles">
          <div className="row">
            <div className="mb-1 col-md-4 docRequest">
              Doctor's Note or Request
            </div>
            <div className="mb-1 col-md-4 fileType">PNG, JPG, PDF </div>
            <div className="mb-1 col-md-4">
              <label htmlFor="docRequest" className="form-label"></label>
              <input
                id="docRequest"
                type="file"
                accept=".pdf, .png, .jpg, .jpeg"
                className={`form-control ${
                  errors.docRequest ? "is-invalid" : ""
                }`}
                {...register("docRequest")}
              />
              {errors.docRequest && (
                <p className="invalid-feedback">
                  {" "}
                  {errors.docRequest?.message as string}{" "}
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
                  {" "}
                  {errors.hospitalInvoice?.message as string}{" "}
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
                className={`form-control ${
                  errors.labInvoice ? "is-invalid" : ""
                }`}
                {...register("labInvoice")}
              />
              {errors.labInvoice && (
                <p className="invalid-feedback">
                  {" "}
                  {errors.labInvoice?.message as string}{" "}
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
                className={`form-control ${
                  errors.employeeID ? "is-invalid" : ""
                }`}
                {...register("employeeID")}
              />
              {errors.employeeID && (
                <p className="invalid-feedback">
                  {" "}
                  {errors.employeeID?.message as string}{" "}
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
              <label
                htmlFor="applicantSignature"
                className="form-label"
              ></label>
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
                  {" "}
                  {errors.applicantSignature?.message as string}{" "}
                </p>
              )}
            </div>
          </div>

          <div className="row claimRow">
            <div className="claimText">
              <p>
                <strong>How many claims do you need to request?</strong>
              </p>
            </div>
            <div className="claimRequest">
              <label htmlFor="claimRequestCount" className="form-label"></label>
              <input
                {...register("claimRequestCount", { valueAsNumber: true })}
                id="claimRequestCount"
                type="number"
                className="form-control"
              />
              {errors.claimRequestCount && (
                <p className="text-danger">
                  {errors.claimRequestCount.message}
                </p>
              )}
            </div>
          </div>
        </fieldset>

        <fieldset>
          <label className="form-label"></label>
          {hospitalStatusOptions.map((option, index) => (
            <div key={index} className="form-check form-check-inline">
              <input
                {...register("hospitalStatus")}
                id={`hospitalStatus-${index}`}
                type="radio"
                value={option}
                className="form-check-input"
              />
              <label
                htmlFor={`hospitalStatus-${index}`}
                className="form-check-label"
              >
                {option}
              </label>
            </div>
          ))}
          {errors.hospitalStatus && (
            <p className="text-danger">{errors.hospitalStatus.message}</p>
          )}
        </fieldset>

        <fieldset className="certify">
          <div className="form-check form-check-inline">
            <input
              {...register("certify")}
              id="certify"
              type="radio"
              value=" "
              className="form-check-input"
            />
            <label htmlFor="certify" className="form-check-label">
              <p>
                I hereby certify that all information in this application is
                TRUE and CORRECT and any misrepresentation of facts shall be{" "}
                <br></br>sufficient cause for denial of this benefit. For any
                amount in excess of my maximum medical & hospitalization
                benefit, I am<br></br>personally liable to pay directly to UST
                Hospital
              </p>
            </label>
          </div>
          {errors.certify && (
            <p className="text-danger">{errors.certify.message}</p>
          )}
        </fieldset>

        <div className="buttonDiv">
          {/* disabled={!isValid} */}
          <button type="submit" className="btn btn-submit form-submit">
            Submit
          </button>
          <button type="reset" className="btn btn-clear form-submit">
            Clear
          </button>
        </div>
      </form>
    </div>
  );
};

export default TestForm;
