// Define the attachment type for consistent structure
export interface FormAttachment {
	filename: string;
	url?: string;
	contentType?: string;
}

export type FileData = FormAttachment; // Alias for backward compatibility

export interface BaseFormData {
	lastname?: string;
	firstname?: string;
	middlename?: string;
	suffix?: string | null;
	age?: number;
	gender?: string;
	contact?: string;
	college?: string;
	status?: string;
	employeeID?: FormAttachment;
	applicantSignature?: FormAttachment;
	claimRequestCount?: number;
	formType?: string;
	origFormType?: string;
	docRequest?: FormAttachment;
	hospitalInvoice?: FormAttachment;
	labInvoice?: FormAttachment;
	reimbursementAmount?: number; // Added here for access across all form types
}

export interface HospitalFormData extends BaseFormData {
	formType: "hospital";
	hospital?: string;
	illness?: string;
	physician?: string;
	procedures?: string;
	procedureSpecify?: string;
	term?: string;
	year?: string;
	load?: number;
	status?: string;
	dateHired?: Date | string | null;
	dateRetired?: Date | string | null;
	benefits?: string;
	hmo?: string | null;
	hospitalStatus?: string;
	certify?: string;
}

export interface EyeglassesFormData extends BaseFormData {
	formType: "eyeglasses";
	ORNumber?: string;
	issuedBy?: string;
	amountPaid?: string;
	reimbursementAmount?: number;
	eyeglassesBenefitClaimedDate?: Date | string | null;
	eyeglassesReceipt?: FormAttachment;
	term?: string;
	year?: string;
	load?: number;
	dateHired?: Date | string | null;
}

export interface AdmissionFormData extends BaseFormData {
	formType: "admission";
	idNumber?: string;
	address?: string;
	load?: number;
	status?: string;
	dateHired?: Date | string | null;
	dateRetired?: Date | string | null;
}

export type FormData =
	| HospitalFormData
	| EyeglassesFormData
	| AdmissionFormData;

// Define benefit history tracking
export interface BenefitHistory {
	benefitUsed: number;
	date: Date | { toDate(): Date };
	formType: string;
	originalBenefit: number;
	remainingBenefit: number;
	transactionId: string;
}

export interface PendingRequest {
	id?: string;
	transactionId: string;
	name?: string;
	requester: string;
	status: string;
	dateSubmitted?: string;
	formData?: FormData;
	studentId?: string;
}

export interface ApprovedRequest extends PendingRequest {
	DateDecided: { toDate(): Date } | Date;
	statusReason?: string;
	benefitHistory?: BenefitHistory;
}

export type Archive = PendingRequest;

export interface Record {
	dateTime: Date;
	transactionID: string;
	typeOfForm: string;
	status: string;
	formData?: FormData;
	dateSubmitted?: string;
	DateDecided?: { toDate: () => Date } | Date;
	requester: string;
	pdf?: {
		filename: string;
		url: string;
		generatedAt?: unknown;
	};
	pdfProcessed?: boolean;
	statusReason?: string;
	benefitHistory?: BenefitHistory;
}
