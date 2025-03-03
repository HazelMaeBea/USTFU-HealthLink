export type FileData = {
	url: string;
	filename: string;
};

export type BaseFormData = {
	lastname: string;
	firstname: string;
	middlename: string;
	suffix?: string;
	age: number;
	gender: "Male" | "Female";
	contact: number;
	college: string;
	employeeID: FileData;
	applicantSignature: FileData;
	claimRequestCount: number;
};

export type HospitalFormData = BaseFormData & {
	formType: "hospital";
	origFormType: string;
	hospital: string;
	illness: string;
	physician: string;
	procedures: string;
	term: string;
	year: string;
	load: string;
	status: string;
	dateHired?: Date;
	dateRetired?: Date;
	benefits: string;
	hmo?: string;
	docRequest: FileData;
	hospitalInvoice: FileData;
	labInvoice: FileData;
	hospitalStatus: "In-Patient" | "Out-Patient" | "ER Consultation";
};

export type EyeglassesFormData = BaseFormData & {
	formType: "eyeglasses";
	ORNumber: string;
	issuedBy: string;
	amountPaid: number;
};

export type AdmissionFormData = BaseFormData & {
	formType: "admission";
	load: string;
	status: string;
	docRequest: FileData;
	hospitalInvoice: FileData;
	labInvoice: FileData;
};

export type FormData =
	| HospitalFormData
	| EyeglassesFormData
	| AdmissionFormData;

export type PendingRequest = {
	transactionId: string;
	requester: string;
	dateSubmitted: string;
	status: "pending" | "approved" | "rejected" | "revision";
	formData: FormData;
};
