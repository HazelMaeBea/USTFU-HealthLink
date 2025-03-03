import { FieldValues, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import "react-datepicker/dist/react-datepicker.css";
import "./FormBody.css";
import FormHeader from "./FormHeader";
import FormPersonalInfo from "./FormPersonalInfo";
import FormUploadDisclaimer from "./FormUploadDisclaimer";
import FormMedicalFiles from "./FormMedicalFiles";
import FormCertify from "./FormCertify";
import AdmissionTeachingInfo from "./AdmissionTeachingInfo";
// import { collection, addDoc, doc, setDoc } from "firebase/firestore";
import { doc, setDoc } from "firebase/firestore";
import { auth, db, storage, getFormID } from "../../../../config/firebase.ts";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import BackButton from "./BackButton";

type FormData = z.infer<typeof schema>;

const schema = z.object({
	lastname: z
		.string({
			required_error: "Please enter your last name",
			invalid_type_error: "Last name must be text",
		})
		.min(1, "Please enter your last name"),
	firstname: z
		.string({
			required_error: "Please enter your first name",
			invalid_type_error: "First name must be text",
		})
		.min(1, "Please enter your first name"),
	middlename: z
		.string({
			required_error: "Please enter your middle name",
			invalid_type_error: "Middle name must be text",
		})
		.min(1, "Please enter your middle name"),
	suffix: z
		.string({
			invalid_type_error: "Suffix must be text",
		})
		.nullish(),
	age: z.coerce
		.number({
			invalid_type_error: "Please enter a valid age",
			required_error: "Age is required",
		})
		.min(18, "You must be at least 18 years old to apply"),
	gender: z.enum(["Male", "Female"], {
		errorMap: () => ({ message: "Please select your gender" }),
	}),
	contact: z.coerce
		.number({
			invalid_type_error: "Please enter a valid contact number",
			required_error: "Contact number is required",
		})
		.min(21, "Please provide a valid contact number"),
	college: z
		.string({
			required_error: "Please select your college",
			invalid_type_error: "Please make a valid selection",
		})
		.min(1, "Please select your college"),
	load: z.string().nonempty("Please select your teaching load"),
	status: z.string().nonempty("Please select your employment status"),
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
	claimRequestCount: z.coerce
		.number({
			invalid_type_error: "Please enter a valid number",
			required_error: "Number of claims is required",
		})
		.min(1, "Please enter at least 1 claim")
		.max(10, "Maximum of 10 claims allowed"),
	certify: z.enum(["Yes"], {
		errorMap: () => ({
			message:
				"You must certify that all information provided is true and correct",
		}),
	}),
});

const AdmissionForm = () => {
	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitted },
	} = useForm<FormData>({ resolver: zodResolver(schema), mode: "onChange" });

	// const formsCollectionRef = collection(db, "FormRequests");

	const onSubmit = async (data: FieldValues) => {
		try {
		  const email = auth?.currentUser?.email;
	
		  const formID = await getFormID(true);
		  const formIDString = formID?.toString().padStart(5,"0") || "error"
		  const currentYear: string = new Date().getFullYear().toString();
	
		  if (!formID) {
			throw new Error("Failed to retrieve FormID");
		  }
	
		  // Upload and get download URL for applicantSignature
		  let imageRef = ref(
			storage,
			`FormRequests/${email}/${currentYear}-${formIDString}-O/${data.applicantSignature[0].name}`
		  );
		  await uploadBytes(imageRef, data.applicantSignature[0]);
		  const applicantSignatureDownloadUrl = await getDownloadURL(imageRef);
	
		  // Upload and get download URL for docRequest
		  imageRef = ref(
			storage,
			`FormRequests/${email}/${currentYear}-${formIDString}-O/${data.docRequest[0].name}`
		  );
		  await uploadBytes(imageRef, data.docRequest[0]);
		  const docRequestDownloadUrl = await getDownloadURL(imageRef);
	
		  // Upload and get download URL for employeeID
		  imageRef = ref(
			storage,
			`FormRequests/${email}/${currentYear}-${formIDString}-O/${data.employeeID[0].name}`
		  );
		  await uploadBytes(imageRef, data.employeeID[0]);
		  const employeeIDDownloadUrl = await getDownloadURL(imageRef);
	
		  // Upload and get download URL for hospitalInvoice
		  imageRef = ref(
			storage,
			`FormRequests/${email}/${currentYear}-${formIDString}-O/${data.hospitalInvoice[0].name}`
		  );
		  await uploadBytes(imageRef, data.hospitalInvoice[0]);
		  const hospitalInvoiceDownloadUrl = await getDownloadURL(imageRef);
	
		  // Upload and get download URL for labInvoice
		  imageRef = ref(
			storage,
			`FormRequests/${email}/${currentYear}-${formIDString}-O/${data.labInvoice[0].name}`
		  );
		  await uploadBytes(imageRef, data.labInvoice[0]);
		  const labInvoiceDownloadUrl = await getDownloadURL(imageRef);
	
		  const pendingRequestData = {
			transactionId: "TRN" + Date.now(),
			requester: auth?.currentUser?.displayName || email || "Unknown",
			dateSubmitted: new Date().toLocaleString("en-US", {
			  timeZone: "Asia/Manila",
			  month: "2-digit",
			  day: "2-digit",
			  year: "numeric",
			  hour: "numeric",
			  minute: "numeric",
			  hour12: true,
			}),
			status: "pending",
			formData: {
			  formType: "admission",
			  origFormType: "admission",
			  lastname: data["lastname"],
			  firstname: data["firstname"],
			  middlename: data["middlename"],
			  age: data["age"],
			  gender: data["gender"],
			  contact: data["contact"],
			  college: data["college"],
			  load: data["load"],
			  status: data["status"],
			  docRequest: {
				url: docRequestDownloadUrl,
				filename: data.docRequest[0].name,
			  },
			  hospitalInvoice: {
				url: hospitalInvoiceDownloadUrl,
				filename: data.hospitalInvoice[0].name,
			  },
			  labInvoice: {
				url: labInvoiceDownloadUrl,
				filename: data.labInvoice[0].name,
			  },
			  employeeID: {
				url: employeeIDDownloadUrl,
				filename: data.employeeID[0].name,
			  },
			  applicantSignature: {
				url: applicantSignatureDownloadUrl,
				filename: data.applicantSignature[0].name,
			  },
			  claimRequestCount: data["claimRequestCount"],
			},
		  };
	
		  // Add the pending request document to Firestore.
		  await setDoc(doc(db, "FormRequests", currentYear + "-" + formIDString + "-O"), pendingRequestData);
		  console.log("Document written with ID: ", currentYear + "-" + formIDString);
		} catch (error) {
		  console.error(error);
		}
	  };

	return (
		<div className="form-body">
			<BackButton /> {/* Use BackButton component */}
			<div className="container">
				<FormHeader formType="Hospital Admission Form" />
				<div className="form-body">
					<div className="form-container">
						<form onSubmit={handleSubmit(onSubmit)}>
							{isSubmitted && Object.keys(errors).length > 0 && (
								<p className="note">
									Please fill out the following boxes
								</p>
							)}

							<FormPersonalInfo
								register={register}
								errors={errors}
							/>
							<AdmissionTeachingInfo
								register={register}
								errors={errors}
							/>
							<FormUploadDisclaimer />
							<FormMedicalFiles
								register={register}
								errors={errors}
							/>
							<FormCertify register={register} errors={errors} />

							<div className="buttonDiv">
								<button
									type="submit"
									className="btn btn-submit form-submit"
								>
									Submit
								</button>
								<button
									type="reset"
									className="btn btn-clear form-submit"
								>
									Clear
								</button>
							</div>
						</form>
					</div>
				</div>
			</div>
		</div>
	);
};

export default AdmissionForm;
