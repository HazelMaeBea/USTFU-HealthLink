export type FileData = {
	url: string;
	filename: string;
};

export type BaseFormData = {
	lastname?: string;
	firstname?: string;
	middlename?: string;
	suffix?: string | null;
	age?: number;
	gender?: "Male" | "Female";
	contact?: number;
	college?: string;
	employeeID?: FileData;
	applicantSignature?: FileData;
	claimRequestCount?: number;
};

export type HospitalFormData = BaseFormData & {
	formType?: "hospital";
	origFormType?: string;
	hospital?: string;
	illness?: string;
	physician?: string;
	procedures?: string;
	procedureSpecify?: string;
	term?: string;
	year?: string;
	load?: number;
	status?: string;
	dateHired?: Date | null;
	dateRetired?: Date | null;
	benefits?: string;
	hmo?: string | null;
	docRequest?: FileData;
	hospitalInvoice?: FileData;
	labInvoice?: FileData;
	hospitalStatus?: "In-Patient" | "Out-Patient" | "ER Consultation";
	certify?: "Yes" | "No";
};

export type EyeglassesFormData = BaseFormData & {
	formType?: "eyeglasses";
	ORNumber?: string;
	issuedBy?: string;
	amountPaid?: number;
};

export type AdmissionFormData = BaseFormData & {
	formType?: "admission";
	load?: string;
	status?: string;
	docRequest?: FileData;
	hospitalInvoice?: FileData;
	labInvoice?: FileData;
};

export type FormData =
	| HospitalFormData
	| EyeglassesFormData
	| AdmissionFormData;

export type PendingRequest = {
	[x: string]: any;
	transactionId: string;
	requester: string;
	dateSubmitted: string;
	status: "pending" | "approved" | "rejected" | "revision";
	formData?: FormData;
};

export type Archive = PendingRequest;

export interface Record {
	dateTime: Date;
	transactionID: string;
	typeOfForm: string;
	status: string;
	formData?: any; // Make optional
	dateSubmitted?: string; // Make optional
	DateDecided?: { toDate: () => Date }; // Make optional
	requester: string;
}
