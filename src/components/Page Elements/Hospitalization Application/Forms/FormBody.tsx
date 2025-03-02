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
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate } from "react-router-dom";
import Popout from "../../../Page Elements/Popout/Popout"; // adjust path if needed

export type FormData = z.infer<typeof schema>;

const schema = z
	.object({
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
		hospital: z
			.string({
				required_error: "Please enter the hospital name",
				invalid_type_error: "Hospital name must be text",
			})
			.min(1, "Please enter the hospital name"),
		illness: z
			.string({
				required_error: "Please specify your illness/condition",
				invalid_type_error: "Illness/condition must be text",
			})
			.min(1, "Please specify your illness/condition"),
		physician: z
			.string({
				required_error: "Please enter your attending physician's name",
				invalid_type_error: "Physician name must be text",
			})
			.min(1, "Please enter your attending physician's name"),
		procedures: z
			.string({
				required_error: "Please specify the medical procedures",
				invalid_type_error: "Medical procedures must be text",
			})
			.min(1, "Please specify the medical procedures"),
		term: z.string().nonempty("Please select the academic term"),
		year: z.string().nonempty("Please select the academic year"),
		load: z.string().nonempty("Please select your teaching load"),
		status: z.string().nonempty("Please select your employment status"),
		dateHired: z
			.string({
				invalid_type_error: "Please select a valid date",
			})
			.nullable()
			.transform((val) => (val ? new Date(val) : null))
			.optional(),
		dateRetired: z
			.string({
				invalid_type_error: "Please select a valid date",
			})
			.nullable()
			.transform((val) => (val ? new Date(val) : null))
			.optional(),
		benefits: z.string().nonempty("Please select your health benefits"),
		hmo: z.string().nullable().optional(),
		docRequest: z.any().refine((files) => files && files.length > 0, {
			message: "Please upload your doctor's request/order",
		}),
		hospitalInvoice: z.any().refine((files) => files && files.length > 0, {
			message: "Please upload the hospital invoice",
		}),
		labInvoice: z.any().refine((files) => files && files.length > 0, {
			message: "Please upload the laboratory invoice",
		}),
		employeeID: z.any().refine((files) => files && files.length > 0, {
			message: "Please upload a copy of your employee ID",
		}),
		applicantSignature: z
			.any()
			.refine((files) => files && files.length > 0, {
				message: "Please upload your signature",
			}),
		hospitalStatus: z.enum(
			["In-Patient", "Out-Patient", "ER Consultation"],
			{
				errorMap: () => ({
					message: "Please select your hospital status",
				}),
			}
		),
		certify: z.enum(["Yes"], {
			errorMap: () => ({
				message:
					"You must certify that all information provided is true and correct",
			}),
		}),
		claimRequestCount: z.coerce
			.number({
				invalid_type_error: "Please enter a valid number",
				required_error: "Number of claims is required",
			})
			.min(1, "Please enter at least 1 claim")
			.max(10, "Maximum of 10 claims allowed"),
	})
	.superRefine((data, ctx) => {
		if (data.status === "Tenured-Track" && !data.dateHired) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message:
					"Please provide your date of hire as a Tenure-Track faculty member",
				path: ["dateHired"],
			});
		}
		if (data.status === "Retiree" && !data.dateRetired) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Please provide your retirement date",
				path: ["dateRetired"],
			});
		}
		if (data.benefits === "HMO" && (!data.hmo || data.hmo.trim() === "")) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Please specify your HMO provider name",
				path: ["hmo"],
			});
		}
	});

const FormBody = () => {
	const [dateHired, setDateHired] = useState<Date | null>(null);
	const [dateRetired, setDateRetired] = useState<Date | null>(null);
	const [showPopup, setShowPopup] = useState(false);
	const [showClearConfirmation, setShowClearConfirmation] =
		useState<boolean>(false);
	const navigate = useNavigate();

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isSubmitted },
	} = useForm<FormData>({ resolver: zodResolver(schema) });

	const formsCollectionRef = collection(db, "FormRequests");
	const onSubmit = async (data: FieldValues) => {
		try {
			const email = auth?.currentUser?.email;
			// Prepare file storage paths
			const applicantSignatureUrl =
				"FormRequests/" +
				email +
				"/FormRequest O-0000000001/" +
				data.applicantSignature[0].name;
			const docRequestUrl =
				"FormRequests/" +
				email +
				"/FormRequest O-0000000001/" +
				data.docRequest[0].name;
			const employeeIDUrl =
				"FormRequests/" +
				email +
				"/FormRequest O-0000000001/" +
				data.employeeID[0].name;
			const hospitalInvoiceUrl =
				"FormRequests/" +
				email +
				"/FormRequest O-0000000001/" +
				data.hospitalInvoice[0].name;
			const labInvoiceUrl =
				"FormRequests/" +
				email +
				"/FormRequest O-0000000001/" +
				data.labInvoice[0].name;

			// Upload and get download URL for applicantSignature
			let imageRef = ref(storage, applicantSignatureUrl);
			await uploadBytes(imageRef, data.applicantSignature[0]);
			const applicantSignatureDownloadUrl = await getDownloadURL(
				imageRef
			);

			// Repeat for other files: docRequest, employeeID, hospitalInvoice, labInvoice
			imageRef = ref(storage, docRequestUrl);
			await uploadBytes(imageRef, data.docRequest[0]);
			const docRequestDownloadUrl = await getDownloadURL(imageRef);

			imageRef = ref(storage, employeeIDUrl);
			await uploadBytes(imageRef, data.employeeID[0]);
			const employeeIDDownloadUrl = await getDownloadURL(imageRef);

			imageRef = ref(storage, hospitalInvoiceUrl);
			await uploadBytes(imageRef, data.hospitalInvoice[0]);
			const hospitalInvoiceDownloadUrl = await getDownloadURL(imageRef);

			imageRef = ref(storage, labInvoiceUrl);
			await uploadBytes(imageRef, data.labInvoice[0]);
			const labInvoiceDownloadUrl = await getDownloadURL(imageRef);

			// Build new document structure using download URLs
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
					formType: "hospital",
					lastname: data.lastname,
					firstname: data.firstname,
					middlename: data.middlename,
					suffix: data.suffix,
					age: data.age,
					gender: data.gender,
					contact: data.contact,
					college: data.college,
					hospital: data.hospital,
					illness: data.illness,
					physician: data.physician,
					procedures: data.procedures,
					term: data.term,
					year: data.year,
					load: data.load,
					status: data.status,
					benefits: data.benefits,
					hmo: data.hmo,
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
					hospitalStatus: data.hospitalStatus,
					claimRequestCount: data.claimRequestCount,
				},
			};

			await addDoc(formsCollectionRef, newDoc);
			setShowPopup(true);
		} catch (error) {
			console.error(error);
		}
	};

	const handlePopupClick = () => {
		navigate("/tracking");
	};

	const handleClearConfirm = () => {
		reset();
		setShowClearConfirmation(false);
	};

	const handleClearCancel = () => {
		setShowClearConfirmation(false);
	};

	return (
		<div className="form-body">
			<form onSubmit={handleSubmit(onSubmit)}>
				{isSubmitted && Object.keys(errors).length > 0 && (
					<p className="note">Please fill out the following boxes</p>
				)}

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
					<button
						type="button"
						className="btn btn-clear form-submit"
						onClick={() => setShowClearConfirmation(true)}
					>
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
			{showClearConfirmation && (
				<Popout
					title="Confirm Clear Form"
					message="Are you sure you want to clear the form? All entered data will be lost."
					onConfirm={handleClearConfirm}
					onCancel={handleClearCancel}
					isOpen={showClearConfirmation}
				/>
			)}
		</div>
	);
};

export default FormBody;
