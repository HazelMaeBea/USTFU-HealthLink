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
import { collection, addDoc } from "firebase/firestore";
import { auth, db, storage } from "../../../../config/firebase.ts";
import { ref, uploadBytes } from "firebase/storage";

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
				FirstName: data["firstname"],
				LastName: data["lastname"],
				MiddleName: data["middlename"],
				ClaimRequestCount: data["claimRequestCount"],
				College: data["college"],
				Contact: data["contact"],
				Suffix: data["suffix"],
				Gender: data["gender"],
				Status: data["status"],
				Load: data["load"],
				SubmittedAt: new Date(),
			});
		} catch (error) {
			console.error(error);
		}
	};

	return (
		<div className="form-body">
			<FormHeader formType="Hospital Admission Form" />

			<form onSubmit={handleSubmit(onSubmit)}>
				{isSubmitted && Object.keys(errors).length > 0 && (
					<p className="note">Please fill out the following boxes</p>
				)}

				<FormPersonalInfo register={register} errors={errors} />
				<AdmissionTeachingInfo register={register} errors={errors} />
				<FormUploadDisclaimer />
				<FormMedicalFiles register={register} errors={errors} />
				<FormCertify register={register} errors={errors} />

				<div className="buttonDiv">
					<button
						type="submit"
						className="btn btn-submit form-submit"
					>
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
