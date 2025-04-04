import {
	render,
	screen,
	fireEvent,
	waitFor,
	act,
} from "@testing-library/react";
import { describe, test, expect, beforeEach, vi, afterEach } from "vitest";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";

// Mock Firebase functions before importing components
const mockAddDoc = vi.fn().mockResolvedValue({ id: "mock-doc-id" });
const mockUploadFilesAndGetURLs = vi.fn().mockResolvedValue({
	applicantSignature: "mock-signature-url",
	employeeID: "mock-id-url",
	docRequest: "mock-doc-request-url",
	hospitalInvoice: "mock-hospital-invoice-url",
	labInvoice: "mock-lab-invoice-url",
	eyeglassesReceipt: "mock-eyeglasses-receipt-url",
});
const mockPushPendingNotification = vi.fn().mockResolvedValue(undefined);
const mockGetDoc = vi.fn().mockResolvedValue({
	exists: () => true,
	data: () => ({
		personalInfo: {
			firstName: "John",
			lastName: "Doe",
			middleName: "Smith",
			suffix: "Jr.",
			idNumber: "2021-123456",
			birthdate: "01/01/1990",
			gender: "Male",
			phoneNumber: "9171234567",
			address: "123 Main St",
			college: "College of Science",
			load: "18",
			status: "Tenured",
			dateHired: "01/01/2015",
			term: "1st",
			year: "2023-2024",
		},
	}),
});
const mockQuery = vi.fn().mockReturnValue("mockQuery");
const mockWhere = vi.fn().mockReturnValue("mockWhere");
const mockGetDocs = vi.fn().mockResolvedValue({
	empty: false,
	docs: [],
});

// Mock firebase/firestore
vi.mock("firebase/firestore", () => ({
	collection: () => "mockCollection",
	query: (...args: unknown[]) => mockQuery(...args),
	where: (...args: unknown[]) => mockWhere(...args),
	onSnapshot: vi.fn().mockImplementation(() => () => {}),
	updateDoc: vi.fn().mockResolvedValue(undefined),
	setDoc: vi.fn().mockResolvedValue(undefined),
	doc: vi.fn().mockReturnValue("mockDocRef"),
	getDoc: () => mockGetDoc(),
	addDoc: (...args: unknown[]) => mockAddDoc(...args),
	getDocs: () => mockGetDocs(),
	getFirestore: vi.fn().mockReturnValue("mockFirestore"),
	Timestamp: {
		now: () => ({ toDate: () => new Date() }),
	},
}));

// Mock file upload functionality
vi.mock("../../../utils/fileUpload.ts", () => ({
	uploadFilesAndGetURLs: (...args: unknown[]) =>
		mockUploadFilesAndGetURLs(...args),
	validateFileListSize: () => ({ valid: true, errorMessage: "" }),
}));

// Mock notification trigger
vi.mock("../../Page Elements/NotifBadge/NotifTrigger.ts", () => ({
	pushPendingNotification: () => mockPushPendingNotification(),
}));

// Mock Firebase context
const firebaseContextValue = {
	uid: "test-user-123",
	isAuthenticated: true,
	db: "mockDb",
	displayName: "Test User",
	photoURL: null,
	userClaims: { role: "member" },
	isLoading: false,
	login: vi.fn(),
	logout: vi.fn(),
	isVerified: true,
	userStatus: "active",
	email: "test@test.com",
	fullName: "Test User",
	getFormID: vi.fn().mockResolvedValue(123),
	auth: { currentUser: { email: "test@test.com", displayName: "Test User" } },
	app: {},
	storage: {},
	storageRef: {},
	callFunction: vi.fn(),
	currentUser: { uid: "test-user-123", email: "test@test.com" },
};

vi.mock("../../src/contexts/firebaseContext", () => ({
	useFirebase: () => firebaseContextValue,
	FirebaseProvider: ({ children }: { children: ReactNode }) => children,
}));

// Mock firebase.ts context
vi.mock("../../src/contexts/firebase", () => ({
	auth: { currentUser: { email: "test@test.com", displayName: "Test User" } },
	db: "mockDb",
}));

// Mock React Router
const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
	useNavigate: () => mockNavigate,
	useLocation: () => ({ pathname: "/home" }),
}));

// Mock Popout component
vi.mock("../../src/components/Page Elements/Popout/Popout", () => ({
	default: ({
		title,
		message,
		onConfirm,
		onCancel,
		isOpen,
	}: {
		title: string;
		message: ReactNode;
		onConfirm: () => void;
		onCancel: () => void;
		isOpen: boolean;
	}) =>
		isOpen ? (
			<div data-testid="popout">
				<h2>{title}</h2>
				<div data-testid="popout-message">{message}</div>
				<button onClick={onConfirm} data-testid="popout-confirm">
					Confirm
				</button>
				<button onClick={onCancel} data-testid="popout-cancel">
					Cancel
				</button>
			</div>
		) : null,
}));

// Mock BackButton component
vi.mock("../../src/components/Page Elements/BackButton/BackButton", () => ({
	default: () => <button data-testid="back-button">Back</button>,
}));

// Mock RemainingBenefit component
vi.mock(
	"../../src/components/Pages/FormPages/RemainingBenefitPopout/RemainingBenefit",
	() => ({
		default: () => (
			<div data-testid="remaining-benefit">Remaining Benefit</div>
		),
	})
);

// Type definitions for form hook methods
type SetValueFn = (
	field: string,
	value: string | boolean | number | null
) => void;
type SetDateFn = React.Dispatch<React.SetStateAction<Date | null>>;
type SetPhoneInputValueFn = React.Dispatch<React.SetStateAction<string>>;

// Mock Autofill with proper types
vi.mock("../../src/components/Pages/FormPages/FormUtil/Autofill", () => ({
	useAutofill: (
		setValue: SetValueFn,
		setDateHired: SetDateFn | undefined,
		setDateRetired: SetDateFn | undefined,
		setPhoneInputValue: SetPhoneInputValueFn | undefined
	): void => {
		// Apply some mock autofill data during tests
		setTimeout(() => {
			setValue("firstname", "John");
			setValue("lastname", "Doe");
			setValue("middlename", "Smith");
			setValue("gender", "Male");
			setValue("college", "College of Science");
			if (setPhoneInputValue) {
				setPhoneInputValue("+639171234567");
			}
		}, 0);
	},
	applyAutofill: (
		setValue: SetValueFn,
		setDateHired: SetDateFn | undefined,
		setDateRetired: SetDateFn | undefined,
		setPhoneInputValue: SetPhoneInputValueFn | undefined
	): void => {
		setValue("firstname", "John");
		setValue("lastname", "Doe");
		setValue("middlename", "Smith");
		setValue("gender", "Male");
		setValue("college", "College of Science");
		if (setPhoneInputValue) {
			setPhoneInputValue("+639171234567");
		}
	},
}));

// Import components after all mocks are set up
import EyeglassesForm from "../../src/components/Pages/FormPages/EyeglassesForm";
import InpatientForm from "../../src/components/Pages/FormPages/InpatientForm";
import OutpatientForm from "../../src/components/Pages/FormPages/OutpatientForm";
import AdmissionForm from "../../src/components/Pages/FormPages/AdmissionForm";

// Utility function to create a mock file
const createMockFile = (
	name = "test.pdf",
	type = "application/pdf",
	size = 1024
) => {
	const file = new File(["dummy content"], name, { type });
	Object.defineProperty(file, "size", { value: size });
	return file;
};

describe("Eyeglasses Form", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test("renders the eyeglasses form correctly", async () => {
		render(<EyeglassesForm />);

		// Check that the header is displayed
		await waitFor(() => {
			expect(screen.getByText("Eyeglasses Form")).toBeInTheDocument();
		});

		// Check navigation elements
		expect(screen.getByTestId("back-button")).toBeInTheDocument();
		expect(screen.getByTestId("remaining-benefit")).toBeInTheDocument();

		// Check for eyeglasses-specific form fields
		await waitFor(() => {
			expect(screen.getByLabelText(/OR Number/i)).toBeInTheDocument();
			expect(screen.getByLabelText(/Issued By/i)).toBeInTheDocument();
			expect(screen.getByText(/Amount Paid/i)).toBeInTheDocument();
		});

		// Check required file uploads
		expect(screen.getByText(/Eyeglasses Receipt/i)).toBeInTheDocument();
		expect(screen.getByText(/Applicant's Signature/i)).toBeInTheDocument();
	}, 10000); // 10 second timeout

	test("validates required fields for eyeglasses form", async () => {
		render(<EyeglassesForm />);

		// Try to submit the form without filling required fields
		const submitButton = await screen.findByText("Submit");
		fireEvent.click(submitButton);

		// Check for validation errors
		await waitFor(() => {
			expect(
				screen.getByText(/Please enter a valid OR Number/i)
			).toBeInTheDocument();
			expect(
				screen.getByText(/Please enter a valid Issue By/i)
			).toBeInTheDocument();
			expect(
				screen.getByText(/Amount must be more than 0/i)
			).toBeInTheDocument();
			expect(
				screen.getByText(/Eyeglasses receipt is required/i)
			).toBeInTheDocument();
			expect(
				screen.getByText(/Please upload your signature/i)
			).toBeInTheDocument();
			expect(
				screen.getByText(
					/You must certify that all information provided is true and correct/i
				)
			).toBeInTheDocument();
		});
	}, 10000);

	test("submits eyeglasses form successfully", async () => {
		render(<EyeglassesForm />);

		// Fill required fields
		await userEvent.type(
			await screen.findByLabelText(/OR Number/i),
			"12345"
		);
		await userEvent.type(
			screen.getByLabelText(/Issued By/i),
			"Test Vendor"
		);
		await userEvent.type(screen.getByLabelText(/Amount Paid/i), "2000");

		// Attach files - get the file inputs directly by their IDs
		const signatureInput =
			screen.getByTestId("applicantSignature") ||
			document.getElementById("applicantSignature");
		const receiptInput =
			screen.getByTestId("eyeglassesReceipt") ||
			document.getElementById("eyeglassesReceipt");

		await act(async () => {
			const signatureFile = createMockFile("signature.jpg", "image/jpeg");
			const receiptFile = createMockFile(
				"receipt.pdf",
				"application/pdf"
			);

			await userEvent.upload(signatureInput, signatureFile);
			await userEvent.upload(receiptInput, receiptFile);
		});

		// Submit the form
		const submitButton = screen.getByText("Submit");
		await act(async () => {
			fireEvent.click(submitButton);
		});

		// Check if form submission was called
		await waitFor(() => {
			expect(mockAddDoc).toHaveBeenCalledTimes(1);
			expect(mockUploadFilesAndGetURLs).toHaveBeenCalledTimes(1);
		});

		// Check if success notification appears
		await waitFor(() => {
			expect(
				screen.getByText("Form Submitted Successfully")
			).toBeInTheDocument();
		});
	}, 10000);
});

describe("Inpatient Form", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test("renders the inpatient form correctly", async () => {
		render(<InpatientForm />);

		// Check that the header is displayed
		await waitFor(() => {
			expect(screen.getByText("Inpatient Form")).toBeInTheDocument();
		});

		// Check navigation elements
		expect(screen.getByTestId("back-button")).toBeInTheDocument();
		expect(screen.getByTestId("remaining-benefit")).toBeInTheDocument();

		// Check for form sections
		await waitFor(() => {
			expect(screen.getByLabelText(/Hospital Name/i)).toBeInTheDocument();
			expect(
				screen.getByLabelText(/Nature of Illness/i)
			).toBeInTheDocument();
			expect(screen.getByLabelText(/Physician/i)).toBeInTheDocument();
		});

		// Check for hospital status radio buttons
		expect(screen.getByLabelText(/In-Patient/i)).toBeInTheDocument();

		// Check for file upload fields
		expect(
			screen.getByText(/Doctor's Note or Request/i)
		).toBeInTheDocument();
		expect(
			screen.getByText(/Laboratory Receipt\/Invoice/i)
		).toBeInTheDocument();
	}, 10000);

	test("validates required fields for inpatient form", async () => {
		render(<InpatientForm />);

		// Try to submit the form without filling required fields
		const submitButton = await screen.findByText("Submit");
		fireEvent.click(submitButton);

		// Check for validation errors
		await waitFor(() => {
			expect(
				screen.getByText(/Please enter a valid hospital name/i)
			).toBeInTheDocument();
			expect(
				screen.getByText(/Please specify your illness\/condition/i)
			).toBeInTheDocument();
			expect(
				screen.getByText(
					/Please enter your attending physician's name/i
				)
			).toBeInTheDocument();
			expect(
				screen.getByText(/Please specify the medical procedure/i)
			).toBeInTheDocument();
			expect(
				screen.getByText(/Please specify the medical procedure/i)
			).toBeInTheDocument();
			expect(
				screen.getByText(/Please upload your doctor's request\/order/i)
			).toBeInTheDocument();
			expect(
				screen.getByText(/Please upload the hospital invoice/i)
			).toBeInTheDocument();
			expect(
				screen.getByText(/Please upload the laboratory invoice/i)
			).toBeInTheDocument();
			expect(
				screen.getByText(/Please upload your signature/i)
			).toBeInTheDocument();
			expect(
				screen.getByText(/Please enter a valid number/i)
			).toBeInTheDocument();
			expect(
				screen.getByText(
					/You must certify that all information provided is true and correct/i
				)
			).toBeInTheDocument();
		});
	}, 10000);

	test("submits inpatient form successfully", async () => {
		render(<InpatientForm />);

		// Fill required fields
		await userEvent.type(
			await screen.findByLabelText(/Hospital Name/i),
			"UST Hospital"
		);
		await userEvent.type(
			screen.getByLabelText(/Nature of Illness/i),
			"Fever"
		);
		await userEvent.type(screen.getByLabelText(/Physician/i), "Dr. Smith");
		await userEvent.selectOptions(
			screen.getByLabelText(/Procedures/i),
			"Consultation"
		);
		await userEvent.type(
			screen.getByLabelText(/Specify Procedure/i),
			"General checkup"
		);

		// Select hospital status
		const inpatientRadio = screen.getByLabelText(/In-Patient/i);
		fireEvent.click(inpatientRadio);

		// Attach files
		await act(async () => {
			const mockFile = createMockFile("test.pdf");

			const docRequestInput = screen.getByLabelText(
				/Doctor's request\/order/i
			);
			const hospitalInvoiceInput =
				screen.getByLabelText(/Hospital invoice/i);
			const labInvoiceInput =
				screen.getByLabelText(/Laboratory invoice/i);
			const signatureInput = screen.getByLabelText(
				/Applicant's Signature/i
			);

			await userEvent.upload(docRequestInput, mockFile);
			await userEvent.upload(hospitalInvoiceInput, mockFile);
			await userEvent.upload(labInvoiceInput, mockFile);
			await userEvent.upload(signatureInput, mockFile);
		});

		// Set number of claims
		const claimsInput = screen.getByLabelText(
			/How many claims do you want to request?/i
		);
		await userEvent.clear(claimsInput);
		await userEvent.type(claimsInput, "1");

		// Agree to certification
		const certifyCheckbox = screen.getByLabelText(
			/I hereby certify that all information/i
		);
		fireEvent.click(certifyCheckbox);

		// Submit the form
		const submitButton = screen.getByText("Submit");
		await act(async () => {
			fireEvent.click(submitButton);
		});

		// Check if form submission was called
		await waitFor(() => {
			expect(mockAddDoc).toHaveBeenCalledTimes(1);
			expect(mockUploadFilesAndGetURLs).toHaveBeenCalledTimes(1);
		});
	}, 10000);
});

describe("Outpatient Form", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test("renders the outpatient form correctly", async () => {
		render(<OutpatientForm />);

		// Check that the header is displayed
		await waitFor(() => {
			expect(screen.getByText("Outpatient Form")).toBeInTheDocument();
		});

		// Check navigation elements
		expect(screen.getByTestId("back-button")).toBeInTheDocument();
		expect(screen.getByTestId("remaining-benefit")).toBeInTheDocument();

		// Check for form sections specific to outpatient
		await waitFor(() => {
			expect(screen.getByLabelText(/Hospital Name/i)).toBeInTheDocument();
			expect(
				screen.getByLabelText(/Nature of Illness/i)
			).toBeInTheDocument();
			expect(screen.getByLabelText(/Physician/i)).toBeInTheDocument();
		});

		// Check for hospital status radio buttons
		expect(screen.getByLabelText(/Out-Patient/i)).toBeInTheDocument();
	}, 10000);

	test("validates required fields for outpatient form", async () => {
		render(<OutpatientForm />);

		// Try to submit the form without filling required fields
		const submitButton = await screen.findByText("Submit");
		fireEvent.click(submitButton);

		// Check for validation errors
		await waitFor(() => {
			expect(
				screen.getByText(/Please enter a valid hospital name/i)
			).toBeInTheDocument();
			expect(
				screen.getByText(/Please specify your illness\/condition/i)
			).toBeInTheDocument();
			expect(
				screen.getByText(
					/Please enter your attending physician's name/i
				)
			).toBeInTheDocument();
			expect(
				screen.getByText(/Please specify the medical procedure/i)
			).toBeInTheDocument();
			expect(
				screen.getByText(/Please specify the medical procedure/i)
			).toBeInTheDocument();
			expect(
				screen.getByText(/Please upload your doctor's request\/order/i)
			).toBeInTheDocument();
			expect(
				screen.getByText(/Please upload the hospital invoice/i)
			).toBeInTheDocument();
			expect(
				screen.getByText(/Please upload the laboratory invoice/i)
			).toBeInTheDocument();
			expect(
				screen.getByText(/Please upload your signature/i)
			).toBeInTheDocument();
			expect(
				screen.getByText(/Please enter a valid number/i)
			).toBeInTheDocument();
			expect(
				screen.getByText(
					/You must certify that all information provided is true and correct/i
				)
			).toBeInTheDocument();
		});
	}, 10000);

	test("submits outpatient form successfully", async () => {
		render(<OutpatientForm />);

		// Fill required fields
		await userEvent.type(
			await screen.findByLabelText(/Hospital Name/i),
			"UST Hospital"
		);
		await userEvent.type(
			screen.getByLabelText(/Nature of Illness/i),
			"Minor injury"
		);
		await userEvent.type(screen.getByLabelText(/Physician/i), "Dr. Jones");
		await userEvent.selectOptions(
			screen.getByLabelText(/Procedures/i),
			"Checkup"
		);
		await userEvent.type(
			screen.getByLabelText(/Specify Procedure/i),
			"General checkup"
		);

		// Select hospital status
		const outpatientRadio = screen.getByLabelText(/Out-Patient/i);
		fireEvent.click(outpatientRadio);

		// Attach files
		await act(async () => {
			const mockFile = createMockFile("test.pdf");

			const docRequestInput = screen.getByLabelText(
				/Doctor's request\/order/i
			);
			const hospitalInvoiceInput =
				screen.getByLabelText(/Hospital invoice/i);
			const labInvoiceInput =
				screen.getByLabelText(/Laboratory invoice/i);
			const signatureInput = screen.getByLabelText(
				/Applicant's Signature/i
			);

			await userEvent.upload(docRequestInput, mockFile);
			await userEvent.upload(hospitalInvoiceInput, mockFile);
			await userEvent.upload(labInvoiceInput, mockFile);
			await userEvent.upload(signatureInput, mockFile);
		});

		// Set number of claims
		const claimsInput = screen.getByLabelText(
			/How many claims do you want to request?/i
		);
		await userEvent.clear(claimsInput);
		await userEvent.type(claimsInput, "1");

		// Agree to certification
		const certifyCheckbox = screen.getByLabelText(
			/I hereby certify that all information/i
		);
		fireEvent.click(certifyCheckbox);

		// Submit the form
		const submitButton = screen.getByText("Submit");
		await act(async () => {
			fireEvent.click(submitButton);
		});

		// Check if form submission was called
		await waitFor(() => {
			expect(mockAddDoc).toHaveBeenCalledTimes(1);
			expect(mockUploadFilesAndGetURLs).toHaveBeenCalledTimes(1);
		});
	}, 10000);
});

describe("Admission Form", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test("renders the admission form correctly", async () => {
		render(<AdmissionForm />);

		// Check that the header is displayed
		await waitFor(() => {
			expect(
				screen.getByText("Hospital Admission Form")
			).toBeInTheDocument();
		});

		// Check navigation elements
		expect(screen.getByTestId("back-button")).toBeInTheDocument();
		expect(screen.getByTestId("remaining-benefit")).toBeInTheDocument();

		// Check for form sections specific to admission
		await waitFor(() => {
			expect(screen.getByLabelText(/Home Address/i)).toBeInTheDocument();
			expect(
				screen.getByLabelText(/Employee ID Number/i)
			).toBeInTheDocument();
			expect(screen.getByText(/Employment Status/i)).toBeInTheDocument();
		});
	}, 10000);

	test("handles employment status dependent fields", async () => {
		render(<AdmissionForm />);

		// Wait for form to load
		await waitFor(() => {
			expect(
				screen.getByText("Hospital Admission Form")
			).toBeInTheDocument();
		});

		// Verify that tenure-track specific field is not shown initially
		expect(screen.queryByText(/DATE HIRED/i)).not.toBeInTheDocument();

		// Select Tenure-Track status
		const tenureTrackRadio = screen.getByLabelText("Tenured-Track");
		await act(async () => {
			fireEvent.click(tenureTrackRadio);
		});

		// Check that date hired field appears
		await waitFor(() => {
			expect(screen.getByText(/DATE HIRED/i)).toBeInTheDocument();
		});

		// Select Retiree status
		const retireeRadio = screen.getByLabelText("Retiree");
		await act(async () => {
			fireEvent.click(retireeRadio);
		});

		// Check that date retired field appears
		await waitFor(() => {
			expect(screen.getByText(/DATE RETIRED/i)).toBeInTheDocument();
		});
	}, 10000);

	test("validates required fields for admission form", async () => {
		render(<AdmissionForm />);

		// Try to submit the form without filling required fields
		const submitButton = await screen.findByText("Submit");
		fireEvent.click(submitButton);

		// Check for validation errors
		await waitFor(() => {
			expect(
				screen.getByText(/Please enter your home address/i)
			).toBeInTheDocument();
			expect(
				screen.getByText(/Please enter your Employee ID Number/i)
			).toBeInTheDocument();
			expect(
				screen.getByText(/Please enter your academic load/i)
			).toBeInTheDocument();
			expect(
				screen.getByText(/Please select an employment status/i)
			).toBeInTheDocument();
			expect(
				screen.getByText(/Doctor's Note\/Request is required/i)
			).toBeInTheDocument();
			expect(
				screen.getByText(/Hospital Receipt\/Invoice is required/i)
			).toBeInTheDocument();
			expect(
				screen.getByText(/Laboratory Receipt\/Invoice is required/i)
			).toBeInTheDocument();
			expect(
				screen.getByText(/Please upload your signature/i)
			).toBeInTheDocument();
			expect(
				screen.getByText(
					/You must certify that all information provided is true and correct/i
				)
			).toBeInTheDocument();
		});
	}, 10000);

	test("submits admission form successfully", async () => {
		render(<AdmissionForm />);

		// Fill required fields
		await waitFor(() => {
			expect(screen.getByLabelText(/Home Address/i)).toBeInTheDocument();
		});

		await userEvent.type(
			screen.getByLabelText(/Home Address/i),
			"123 Main St"
		);
		await userEvent.type(
			screen.getByLabelText(/Employee ID Number/i),
			"2021-123456"
		);
		await userEvent.type(screen.getByLabelText(/Load/i), "18");

		// Select status
		const tenuredRadio = screen.getByLabelText("Tenured");
		fireEvent.click(tenuredRadio);

		// Attach files
		await act(async () => {
			const mockFile = createMockFile("test.pdf");

			const docRequestInput = screen.getByLabelText(
				/Doctor's Note\/Request/i
			);
			const hospitalInvoiceInput = screen.getByLabelText(
				/Hospital Receipt\/Invoice/i
			);
			const labInvoiceInput = screen.getByLabelText(
				/Laboratory Receipt\/Invoice/i
			);
			const signatureInput = screen.getByLabelText(
				/Applicant's Signature/i
			);

			await userEvent.upload(docRequestInput, mockFile);
			await userEvent.upload(hospitalInvoiceInput, mockFile);
			await userEvent.upload(labInvoiceInput, mockFile);
			await userEvent.upload(signatureInput, mockFile);
		});

		// Agree to certification
		const certifyCheckbox = screen.getByLabelText(
			/I hereby certify that all information/i
		);
		fireEvent.click(certifyCheckbox);

		// Submit the form
		const submitButton = screen.getByText("Submit");
		await act(async () => {
			fireEvent.click(submitButton);
		});

		// Check if form submission was called
		await waitFor(() => {
			expect(mockAddDoc).toHaveBeenCalledTimes(1);
			expect(mockUploadFilesAndGetURLs).toHaveBeenCalledTimes(1);
		});

		// Check if success notification appears
		await waitFor(() => {
			expect(
				screen.getByText(/Form Submitted Successfully/i)
			).toBeInTheDocument();
		});
	}, 10000);
});
