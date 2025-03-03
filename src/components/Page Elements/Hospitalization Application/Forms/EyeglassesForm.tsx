import { FieldValues, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import "react-datepicker/dist/react-datepicker.css";
import "./FormBody.css";
import FormHeader from "./FormHeader";
import FormPersonalInfo from "./FormPersonalInfo";
import FormInvoice from "./FormInvoice";
import FormUploadDisclaimer from "./FormUploadDisclaimer";
import FormSigIDFiles from "./FormSigIDFiles";
import FormCertify from "./FormCertify";
// import { collection, addDoc, doc, setDoc } from "firebase/firestore";
import { doc, setDoc } from "firebase/firestore";
import { auth, db, getFormID, storage } from "../../../../config/firebase.ts";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import BackButton from "./BackButton"; // Import BackButton

export type FormData = z.infer<typeof schema>;

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
		errorMap: () => ({ message: "Gender is required" }),
	}),
	contact: z.number().min(21, "Contact number is required"),
	ORNumber: z.string().nonempty("OR Number is required"),
	issuedBy: z.string().nonempty("Issued by is required"),
	amountPaid: z.number().min(1, "Amount Paid is required"),

	college: z.string().nonempty("College is required"),

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

const EyeglassesForm = () => {
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

			// Upload and get download URL for applicantSignature
			let imageRef = ref(
				storage,
				`FormRequests/${email}/${currentYear}-${formIDString}-O/${data.applicantSignature[0].name}`
			);
			await uploadBytes(imageRef, data.applicantSignature[0]);
			const applicantSignatureDownloadUrl = await getDownloadURL(
				imageRef
			);

			// Upload and get download URL for employeeID
			imageRef = ref(
				storage,
				`FormRequests/${email}/${currentYear}-${formIDString}-O/${data.employeeID[0].name}`
			);
			await uploadBytes(imageRef, data.employeeID[0]);
			const employeeIDDownloadUrl = await getDownloadURL(imageRef);

			// Build new document structure with download URLs
			const newDoc = {
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
					formType: "eyeglasses",
					origFormType: "eyeglasses",
					lastname: data.lastname,
					firstname: data.firstname,
					middlename: data.middlename,
					age: data.age,
					gender: data.gender,
					contact: data.contact,
					college: data.college,
					ORNumber: data.ORNumber,
					issuedBy: data.issuedBy,
					amountPaid: data.amountPaid,
					employeeID: {
						url: employeeIDDownloadUrl,
						filename: data.employeeID[0].name,
					},
					applicantSignature: {
						url: applicantSignatureDownloadUrl,
						filename: data.applicantSignature[0].name,
					},
					claimRequestCount: data.claimRequestCount,
				},
			};

			// await addDoc(formsCollectionRef, newDoc);
		await setDoc(doc(db, "FormRequests", currentYear + "-" + formIDString + "-O"), newDoc);
		console.log("Document written with ID: ", formIDString);
		} catch (error) {
			console.error(error);
		}
	};

	return (
		<div className="form-body">
			<BackButton /> {/* Use BackButton component */}
			<div className="container">
				<FormHeader formType="Eyeglasses Form" />
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
							<FormInvoice register={register} errors={errors} />
							<FormUploadDisclaimer />
							<FormSigIDFiles
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

export default EyeglassesForm;
