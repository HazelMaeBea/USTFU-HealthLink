import { FieldValues, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import "react-datepicker/dist/react-datepicker.css";
import "./FormBody.css";
import FormHeader from "./FormHeader";
import FormPersonalInfo from "./FormPersonalInfo";
import FormInvoice from "./FormInvoice";
import FormUploadDisclaimer from "./FormUploadDisclaimer";
import FormMedicalFiles from "./FormMedicalFiles";
import FormCertify from "./FormCertify";
import AdmissionTeachingInfo from "./AdmissionTeachingInfo";

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
  load: z.string().nonempty("Load is required"),
  status: z.string().nonempty("Status is required"),
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
  claimRequestCount: z.number().min(1, "Claim Request Count is required"),
  certify: z.enum(["Yes"], {
    errorMap: () => ({ message: "Certification is required" }),
  }),
});

const AdmissionForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema), mode: "onChange" });

  const onSubmit = (data: FieldValues) => {
    console.log(data); // Ensure this logs the data correctly
  };

  return (
    <div className="form-body">
      <FormHeader formType="Hospital Admission Form" />

      <form onSubmit={handleSubmit(onSubmit)}>
        <p className="note">Please fill out the following boxes</p>

        <FormPersonalInfo register={register} errors={errors} />
        <AdmissionTeachingInfo register={register} errors={errors} />
        <FormUploadDisclaimer />
        <FormMedicalFiles register={register} errors={errors} />
        <FormCertify register={register} errors={errors} />

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
