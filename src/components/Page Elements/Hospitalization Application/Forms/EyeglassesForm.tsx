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
import { collection, addDoc } from "firebase/firestore";
import { auth, db, storage } from "../../../../config/firebase.ts";
import { ref, uploadBytes } from "firebase/storage";

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

	const formsCollectionRef = collection(db, "FormRequests");
	const onSubmit = async (data: FieldValues) => {
		// console.log(data); // Ensure this logs the data correctly
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
					data.employeeID[0].name
			);
			await uploadBytes(imageRef, data.employeeID[0]);

			await addDoc(formsCollectionRef, {
				Age: data["age"],
				FirstName: data["firstname"],
				LastName: data["lastname"],
				MiddleName: data["middlename"],
				ClaimRequestCount: data["claimRequestCount"],
				College: data["college"],
				Contact: data["contact"],
				Suffix: data["suffix"],
				ORNumber: data["ORNumber"],
				AmountPaid: data["amountPaid"],
				Gender: data["gender"],
				IssuedBy: data["issuedBy"],
				ApplicantSignature:
					"FormRequests/" +
					email +
					"/FormRequest O-0000000001/" +
					data.applicantSignature[0].name,
				EmployeeED:
					"FormRequests/" +
					email +
					"/FormRequest O-0000000001/" +
					data.employeeID[0].name,
				SubmittedAt: new Date(),
			});
		} catch (error) {
			console.error(error);
		}
	};

	return (
		<div className="form-body">
			<FormHeader formType="Eyeglasses Form" />

			<form onSubmit={handleSubmit(onSubmit)}>
				{isSubmitted && Object.keys(errors).length > 0 && (
					<p className="note">Please fill out the following boxes</p>
				)}

				<FormPersonalInfo register={register} errors={errors} />
				<FormInvoice register={register} errors={errors} />
				<FormUploadDisclaimer />
				<FormSigIDFiles register={register} errors={errors} />
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

export default EyeglassesForm;
