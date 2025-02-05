import React, { useState } from "react";
import { FieldValues, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import "react-datepicker/dist/react-datepicker.css";
import "./FormBody.css";
import FormHeader from "./FormHeader";
import FormPersonalInfo from "./FormPersonalInfo";
import FormMedicalInfo from "./FormMedicalInfo";
import FormTeachingInfo from "./FormTeachingInfo";
import FormUploadDisclaimer from "./FormUploadDisclaimer";
import FormMedicalFiles from "./FormMedicalFiles";
import FormHospitalStatus from "./FormHospitalStatus";
import FormCertify from "./FormCertify";

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
	// const [dateHired, setDateHired] = useState(new Date());
	// const [dateRetired, setDateRetired] = useState(new Date());
	const [dateHired, setDateHired] = useState<Date | null>(null);
	const [dateRetired, setDateRetired] = useState<Date | null>(null);

	const {
		register,
		handleSubmit,
		formState: { errors, isValid },
	} = useForm<FormData>({ resolver: zodResolver(schema) });

	const onSubmit = (data: FieldValues) => {
		console.log({
			...data,
			dateHired,
			dateRetired,
		});
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

export default FormBody;
