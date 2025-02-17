import { useState } from "react";
import { FieldValues, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import "react-datepicker/dist/react-datepicker.css";
import "./FormBody.css";
import FormPersonalInfo from "./FormPersonalInfo";
import FormMedicalInfo from "./FormMedicalInfo";
import FormTeachingInfo from "./FormTeachingInfo";
import FormUploadDisclaimer from "./FormUploadDisclaimer";
import FormMedicalFiles from "./FormMedicalFiles";
import FormHospitalStatus from "./FormHospitalStatus";
import FormCertify from "./FormCertify";
import { collection, addDoc } from "firebase/firestore";
import { auth, db, storage } from "../../../../config/firebase.ts";
import { ref, uploadBytes } from "firebase/storage";
import { useNavigate } from "react-router-dom";

export type FormData = z.infer<typeof schema>;

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
  dateHired: z.date().optional(),
  dateRetired: z.date().optional(),
  benefits: z.string().nonempty("Benefits is required"),
  hmo: z.string().optional(),
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
  certify: z.enum(["Yes"], {
    errorMap: () => ({ message: "Certification is required" }),
  }),
  claimRequestCount: z.number().min(1, "Claim Request Count is required"),
});

const FormBody = () => {
  const [dateHired, setDateHired] = useState<Date | null>(null);
  const [dateRetired, setDateRetired] = useState<Date | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const formsCollectionRef = collection(db, "FormRequests");
  const onSubmit = async (data: FieldValues) => {
    try {
      const email = auth?.currentUser?.email;

      let imageRef = ref(
        storage,
        "FormRequests/" +
          email +
          "/FormRequest O-0000000001/" +
          data.applicantSignature[0].name
      );
      await uploadBytes(imageRef, data.applicantSignature[0]);
      imageRef = ref(
        storage,
        "FormRequests/" +
          email +
          "/FormRequest O-0000000001/" +
          data.docRequest[0].name
      );
      await uploadBytes(imageRef, data.docRequest[0]);
      imageRef = ref(
        storage,
        "FormRequests/" +
          email +
          "/FormRequest O-0000000001/" +
          data.employeeID[0].name
      );
      await uploadBytes(imageRef, data.employeeID[0]);
      imageRef = ref(
        storage,
        "FormRequests/" +
          email +
          "/FormRequest O-0000000001/" +
          data.hospitalInvoice[0].name
      );
      await uploadBytes(imageRef, data.hospitalInvoice[0]);
      imageRef = ref(
        storage,
        "FormRequests/" +
          email +
          "/FormRequest O-0000000001/" +
          data.labInvoice[0].name
      );
      await uploadBytes(imageRef, data.labInvoice[0]);

      await addDoc(formsCollectionRef, {
        Age: data["age"],
        ApplicantSignature:
          "FormRequests/" +
          email +
          "/FormRequest O-0000000001/" +
          data.applicantSignature[0].name,
        Benefits: data["benefits"],
        ClaimRequestCount: data["claimRequestCount"],
        College: data["college"],
        Contact: data["contact"],
        FirstName: data["firstname"],
        Gender: data["gender"],
        HMO: data["hmo"],
        Hospital: data["hospital"],
        HospitalInvoice:
          "FormRequests/" +
          email +
          "/FormRequest O-0000000001/" +
          data.hospitalInvoice[0].name,
        HospitalStatus: data["hospitalStatus"],
        Illness: data["illness"],
        LabInvoice:
          "FormRequests/" +
          email +
          "/FormRequest O-0000000001/" +
          data.labInvoice[0].name,
        LastName: data["lastname"],
        Load: data["load"],
        MiddleName: data["middlename"],
        Physician: data["physician"],
        Procedures: data["procedures"],
        Status: data["status"],
        Suffix: data["suffix"],
        Term: data["term"],
        Year: data["year"],
        DocRequest:
          "FormRequests/" +
          email +
          "/FormRequest O-0000000001/" +
          data.docRequest[0].name,
        EmployeeID:
          "FormRequests/" +
          email +
          "/FormRequest O-0000000001/" +
          data.employeeID[0].name,
        DateHired: dateHired,
        DateRetired: dateRetired,
        SubmittedAt: new Date(),
      });
      setShowPopup(true);
    } catch (error) {
      console.error(error);
    }
  };

  const handlePopupClick = () => {
    navigate("/tracking");
  };

  return (
    <div className="form-body">
      <form onSubmit={handleSubmit(onSubmit)}>
        <p className="note">Please fill out the following boxes</p>

        <FormPersonalInfo register={register} errors={errors} />
        <FormMedicalInfo register={register} errors={errors} />
        <FormTeachingInfo
          register={register}
          errors={errors}
          dateHired={dateHired}
          setDateHired={setDateHired}
          dateRetired={dateRetired}
          setDateRetired={setDateRetired}
        />
        <FormUploadDisclaimer />
        <FormMedicalFiles register={register} errors={errors} />
        <FormHospitalStatus register={register} errors={errors} />
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
      {showPopup && (
        <>
          <div className="popup-overlay"></div>
          <div className="popup">
            <p>Claim Request submitted!</p>
            <a href="#" onClick={handlePopupClick}>
              Click here to track your pending requests
            </a>
          </div>
        </>
      )}
    </div>
  );
};

export default FormBody;
