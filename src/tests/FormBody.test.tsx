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

// Mock dependencies
vi.mock("firebase/firestore", () => ({
	collection: () => "mockCollection",
	query: vi.fn().mockReturnValue("mockQuery"),
	where: vi.fn().mockReturnValue("mockWhere"),
	onSnapshot: vi.fn().mockImplementation(() => () => {}),
	updateDoc: vi.fn().mockResolvedValue(undefined),
	setDoc: vi.fn().mockResolvedValue(undefined),
	doc: vi.fn().mockReturnValue("mockDocRef"),
	getDoc: () => mockGetDoc(),
	addDoc: (...args: unknown[]) => mockAddDoc(...args),
	getDocs: vi.fn().mockResolvedValue({
		empty: false,
		docs: [],
	}),
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

vi.mock("../../../contexts/firebaseContext", () => ({
	useFirebase: () => firebaseContextValue,
	FirebaseProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock firebase.ts context
vi.mock("../../../contexts/firebase", () => ({
	auth: { currentUser: { email: "test@test.com", displayName: "Test User" } },
	db: "mockDb",
}));

// Mock React Router
const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
	useNavigate: () => mockNavigate,
	useLocation: () => ({ pathname: "/home" }),
}));

// Import the component to test
import FormBody from "../components/Pages/FormPages/FormComponents/FormBody";

describe("FormBody Component", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test("renders inpatient form body correctly", async () => {
		render(<FormBody origFormType="inpatient" />);

		// Check for form sections specific to hospital forms
		await waitFor(() => {
			expect(screen.getByLabelText(/Hospital Name/i)).toBeInTheDocument();
			expect(
				screen.getByLabelText(/Nature of Illness/i)
			).toBeInTheDocument();
			expect(screen.getByLabelText(/Physician/i)).toBeInTheDocument();
		});

		// Check that it's set to inpatient
		const inpatientRadio = screen.getByLabelText(/In-Patient/i);
		expect(inpatientRadio).toBeInTheDocument();
	});

	test("renders outpatient form body correctly", async () => {
		render(<FormBody origFormType="outpatient" />);

		// Check for form sections specific to hospital forms
		await waitFor(() => {
			expect(screen.getByLabelText(/Hospital Name/i)).toBeInTheDocument();
			expect(
				screen.getByLabelText(/Nature of Illness/i)
			).toBeInTheDocument();
			expect(screen.getByLabelText(/Physician/i)).toBeInTheDocument();
		});

		// Check that it's set to outpatient
		const outpatientRadio = screen.getByLabelText(/Out-Patient/i);
		expect(outpatientRadio).toBeInTheDocument();
	});

	test("validates required fields", async () => {
		render(<FormBody origFormType="inpatient" />);

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
		});
	});
});
