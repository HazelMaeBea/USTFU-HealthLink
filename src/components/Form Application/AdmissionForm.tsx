import React, { useState } from "react";
import { FieldValues, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import "./FormBody.css";
import FormHeader from "./FormHeader";

const schema = z.object({
  lastname: z.string().nonempty("Last name is required"),
  firstname: z.string().nonempty("First name is required"),
  middlename: z.string().nonempty("Middle name is required"),
  suffix: z.string().optional(),
  college: z.enum(
    [
      "Faculty of Sacred Theology",
      "Faculty of Philosophy",
      "Faculty of Canon Law",
      "Faculty of Civil Law",
      "Faculty of Medicine and Surgery",
      "Faculty of Pharmacy",
      "Faculty of Engineering",
      "Faculty of Arts and Letters",
      "College of Architecture",
      "College of Commerce and Business Administration",
      "College of Education",
      "College of Fine Arts and Design",
      "College of Nursing",
      "College of Rehabilitation Sciences",
      "College of Science",
      "College of Tourism and Hospitality Management",
      "College of Information and Computing Sciences (CICS)",
      "Graduate School",
      "Graduate School of Law",
      "Conservatory of Music",
      "Institute of Physical Education and Athletics (IPEA)",
      "UST Senior High School",
      "UST Junior High School",
      "UST Education High School",
    ],
    { errorMap: () => ({ message: "College Affiliation is required" }) }
  ),
  contact: z.number().min(21, "Contact number is required"),
  hospital: z.string().nonempty("Hospital is required"),
  physician: z.string().nonempty("Physician is required"),
  status: z.enum(
    ["Tenured", "Tenured-Track", "Lecturer Before 2001", "Extendee", "Retiree"],
    { errorMap: () => ({ message: "Status is required" }) }
  ),
  term: z.enum(["idk", "idk2"], {
    errorMap: () => ({ message: "Academic Term is required" }),
  }),
  year: z.enum(["idk", "idk2"], {
    errorMap: () => ({ message: "Academic Year is required" }),
  }),
  load: z.enum(["idk", "idk2"], {
    errorMap: () => ({ message: "Teaching Load is required" }),
  }),
  ustID: z
    .instanceof(FileList)
    .refine((files) => files.length > 0, { message: "Must be a file" })
    .refine(
      (files) => {
        const fileType = files[0]?.type;
        return (
          fileType === "application/pdf" ||
          fileType === "image/png" ||
          fileType === "image/jpeg" ||
          fileType === "image/jpg"
        );
      },
      { message: "Only PDF, PNG, JPG, or JPEG file types allowed" }
    ),
  signature: z
    .instanceof(FileList)
    .refine((files) => files.length > 0, { message: "Must be a file" })
    .refine(
      (files) => {
        const fileType = files[0]?.type;
        return (
          fileType === "application/pdf" ||
          fileType === "image/png" ||
          fileType === "image/jpeg" ||
          fileType === "image/jpg"
        );
      },
      { message: "Only PDF, PNG, JPG, or JPEG file types allowed" }
    ),
  claims: z.number().min(1, "Claims are required"),
  certify: z.enum([" "], {
    errorMap: () => ({ message: "Certification is required" }),
  }),
  ORNumber: z.string().nonempty("OR Number is required"),
  issuedBy: z.string().nonempty("Issued by is required"),
  amountPaid: z.number().min(1, "Amount Paid is required"),
  contactNumber: z.number().min(1, "Contact Number is required"),
  IDNumber: z.number().min(1, "ID Number is required"),
  address: z.string().nonempty("Address is required"),
});

type FormData = z.infer<typeof schema>;

const AdmissionForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormData>({ resolver: zodResolver(schema), mode: "onChange" });

  const [claims, setClaims] = useState(1);

  const incrementClaims = () => setClaims(claims + 1);
  const decrementClaims = () => setClaims(claims > 1 ? claims - 1 : 1);
  const onSubmit = (data: FieldValues) => {
    console.log(data);
  };
  const statusOptions = [
    "Tenured",
    "Tenured-Track",
    "Lecturer Before 2001",
    "Extendee",
    "Retiree",
  ];
  const loadOptions = ["idk", "idk2"];
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
  const collegeOptions = [
    "Faculty of Sacred Theology",
    "Faculty of Philosophy",
    "Faculty of Canon Law",
    "Faculty of Civil Law",
    "Faculty of Medicine and Surgery",
    "Faculty of Pharmacy",
    "Faculty of Engineering",
    "Faculty of Arts and Letters",
    "College of Architecture",
    "College of Commerce and Business Administration",
    "College of Education",
    "College of Fine Arts and Design",
    "College of Nursing",
    "College of Rehabilitation Sciences",
    "College of Science",
    "College of Tourism and Hospitality Management",
    "College of Information and Computing Sciences (CICS)",
    "Graduate School",
    "Graduate School of Law",
    "Conservatory of Music",
    "Institute of Physical Education and Athletics (IPEA)",
    "UST Senior High School",
    "UST Junior High School",
    "UST Education High School",
  ];

  return (
    <div>
      <FormHeader formType="Hospital Admission Form" />
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
            <div className="mb-1 col-md-3">
              <label htmlFor="IDNumber" className="form-label">
                ID Number
              </label>
              <input
                {...register("IDNumber", { valueAsNumber: true })}
                id="IDNumber"
                type="number"
                className="form-control"
              />
              {errors.IDNumber && (
                <p className="text-danger">{errors.IDNumber.message}</p>
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
              <label htmlFor="address" className="form-label">
                Address
              </label>
              <input
                {...register("address")}
                id="address"
                type="text"
                className="form-control"
              />
              {errors.address && (
                <p className="text-danger">{errors.address.message}</p>
              )}
            </div>
          </div>
        </fieldset>
        <fieldset className="TeachingInfo">
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
              {errors.load && (
                <p className="text-danger">{errors.load.message}</p>
              )}
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
            <div className="mb-1 col-md-4 ustID">Employee/UST ID</div>
            <div className="mb-1 col-md-4 fileType">PNG, JPG, PDF </div>
            <div className="mb-1 col-md-4">
              <label htmlFor="ustID" className="form-label"></label>
              <input
                {...register("ustID")}
                id="ustID"
                type="file"
                accept=".pdf, .png, .jpg, .jpeg"
                className="form-control"
              />
              {errors.ustID && (
                <p className="text-danger">{errors.ustID.message}</p>
              )}
            </div>
          </div>
          <div className="row">
            <div className="mb-1 col-md-4 signature">Applicant's Signature</div>
            <div className="mb-1 col-md-4 fileType">PNG, JPG, PDF </div>
            <div className="mb-1 col-md-4">
              <label htmlFor="signature" className="form-label"></label>
              <input
                {...register("signature")}
                id="signature"
                type="file"
                accept=".pdf, .png, .jpg, .jpeg"
                className="form-control"
              />
              {errors.signature && (
                <p className="text-danger">{errors.signature.message}</p>
              )}
            </div>
          </div>
          <div className="row claimCount">
            <div>How many claims do you need to request?</div>
            <div>
              <button
                type="button"
                onClick={decrementClaims}
                className="btn btn-secondary claimCompute"
              >
                -
              </button>
              <span className="claims-count">{claims}</span>
              <button
                type="button"
                onClick={incrementClaims}
                className="btn btn-secondary claimCompute"
              >
                +
              </button>
            </div>
          </div>
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

export default AdmissionForm;
