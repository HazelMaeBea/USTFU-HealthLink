import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, test, expect, beforeEach, vi } from "vitest";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";

// First, define mock values for firebase functions
const mockSetDoc = vi.fn().mockResolvedValue(undefined);
const mockDoc = vi.fn().mockReturnValue("mockDocRef");

// Mock the entire document head for USTFULogo import
vi.mock("../../../assets/USTFULogo.png", () => "mock-logo-path");

// Define proper types for Firebase functions to fix the "any[]" warnings
type DocRef = string;
type DocData = Record<string, unknown>;
type SetDocOptions = { merge?: boolean };

// Mock firebase/firestore using the same pattern as ServiceCards.test.tsx
vi.mock("firebase/firestore", () => ({
	collection: () => "mockCollection",
	query: () => "mockQuery",
	where: () => "mockWhere",
	onSnapshot: vi.fn().mockImplementation(() => () => {}),
	setDoc: (ref: DocRef, data: DocData, options?: SetDocOptions) =>
		mockSetDoc(ref, data, options),
	doc: (db: unknown, collection: string, ...pathSegments: string[]) =>
		mockDoc(db, collection, ...pathSegments),
	getDoc: vi.fn().mockResolvedValue({ exists: () => true, data: () => ({}) }),
	getFirestore: vi.fn().mockReturnValue("mockFirestore"),
}));

// Mock Firebase context
const firebaseContextValue = {
	currentUser: { uid: "mock-user-123" },
	displayName: "Mock User",
	photoURL: "mock-photo-url",
	email: "mockuser@example.com",
	isAuthenticated: true,
	isLoading: false,
	uid: "mock-user-123",
	userClaims: { role: "member" },
	isVerified: true,
	userStatus: "active",
	login: vi.fn(),
	logout: vi.fn(),
	fullName: "Mock User",
	getFormID: vi.fn(),
	app: {},
	auth: {},
	db: {},
	storage: {},
	storageRef: {},
	callFunction: vi.fn(),
};

vi.mock("../../src/contexts/firebaseContext", () => ({
	useFirebase: () => firebaseContextValue,
}));

// Mock the Firebase db import
vi.mock("../../src/contexts/firebase", () => ({
	db: "mockDb",
}));

// Mock the confirmation message component
vi.mock(
	"../../src/components/Pages/RegistrationPage/ConfirmationMessage",
	() => ({
		default: () => (
			<div data-testid="confirmation-message">
				Registration successful!
			</div>
		),
	})
);

// Mock window.location
Object.defineProperty(window, "location", {
	value: {
		href: "",
	},
	writable: true,
});

// Import the component AFTER all mocks are set
import RegistrationPage from "../../src/components/Pages/RegistrationPage/RegistrationPage";

describe("RegistrationPage Component", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		window.location.href = "";
	});

	test("renders the registration form correctly", () => {
		render(<RegistrationPage />);

		// Check that user profile info is displayed
		expect(screen.getByText(/Hi, mock user/i)).toBeInTheDocument();
		expect(
			screen.getByText(firebaseContextValue.email)
		).toBeInTheDocument();
		expect(screen.getByAltText("User")).toHaveAttribute(
			"src",
			"mock-photo-url"
		);

		// Check that form fields are rendered
		expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/Last Name/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/Middle Name/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/Suffix/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/ID Number/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/Birthdate/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/Gender/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/Phone Number/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/Load/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/Status/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/College/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/Address/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/Date Hired/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/Date Retired/i)).toBeInTheDocument();

		// Check button is present
		expect(screen.getByText("Register Now")).toBeInTheDocument();
	});

	test("term and year fields are pre-populated and readonly", async () => {
		render(<RegistrationPage />);

		const termField = screen.getByLabelText(/Term/i);
		const yearField = screen.getByLabelText(/Year/i);

		expect(termField).toHaveAttribute("readOnly");
		expect(yearField).toHaveAttribute("readOnly");

		// Fix the assertion to properly check the term value
		const termValue = termField.getAttribute("value");
		expect(termValue === "1st" || termValue === "2nd").toBeTruthy();

		// Use a regex test directly on the value attribute for year
		const yearValue = yearField.getAttribute("value");
		expect(/^\d{4}-\d{4}$/.test(yearValue || "")).toBeTruthy();
	});

	test("ID number is formatted correctly", async () => {
		render(<RegistrationPage />);

		const idField = screen.getByLabelText(/ID Number/i);

		await userEvent.type(idField, "20211234567");

		expect(idField).toHaveValue("2021-123456");
	});

	// test("phone number is formatted correctly", async () => {
	// 	render(<RegistrationPage />);

	// 	const phoneField = screen.getByLabelText(/Phone Number/i);

	// 	await userEvent.clear(phoneField);
	// 	await userEvent.type(phoneField, "9171234567");
	// 	await userEvent.tab(); // Trigger blur event

	// 	expect(phoneField).toHaveValue("+63-917-123-4567");
	// });

	test("phone number always starts with +63", async () => {
		render(<RegistrationPage />);

		const phoneField = screen.getByLabelText(/Phone Number/i);

		await userEvent.clear(phoneField);
		await userEvent.type(phoneField, "9171234567");

		expect(phoneField).toHaveValue("+639171234567");
	});

	test("shows validation errors when submitting empty form", async () => {
		render(<RegistrationPage />);

		const submitButton = screen.getByText("Register Now");
		fireEvent.click(submitButton);

		await waitFor(() => {
			expect(
				screen.getByText("Please enter your First Name")
			).toBeInTheDocument();
			expect(
				screen.getByText("Please enter your Last Name")
			).toBeInTheDocument();
			expect(
				screen.getByText("Please format your ID number")
			).toBeInTheDocument();
			expect(
				screen.getByText("Please enter your Birthdate")
			).toBeInTheDocument();
			expect(
				screen.getByText("Please enter your Phone Number")
			).toBeInTheDocument();
			expect(
				screen.getByText("Please enter your Load (Units)")
			).toBeInTheDocument();
			expect(
				screen.getByText("Please select your employment status")
			).toBeInTheDocument();
			expect(
				screen.getByText("Please enter your valid Address")
			).toBeInTheDocument();
			expect(
				screen.getByText("Please enter the date you were Hired")
			).toBeInTheDocument();
			expect(
				screen.getByText("Please select your gender")
			).toBeInTheDocument();
			expect(
				screen.getByText("Please select your college")
			).toBeInTheDocument();
		});
	});

	test("navigates back to login when 'Go back to sign in' is clicked", () => {
		render(<RegistrationPage />);

		const backButton = screen.getByText("Go back to sign in page");
		fireEvent.click(backButton);

		expect(window.location.href).toBe("/login");
	});

	test("form fields have correct options", () => {
		render(<RegistrationPage />);

		// Check suffix options
		const suffixOptions = screen
			.getByLabelText(/Suffix/i)
			.querySelectorAll("option");
		expect(suffixOptions.length).toBeGreaterThan(1); // At least default + empty option
		expect(screen.getByRole("option", { name: "Sr." })).toBeInTheDocument();
		expect(screen.getByRole("option", { name: "Jr." })).toBeInTheDocument();

		// Check gender options
		const genderOptions = screen
			.getByLabelText(/Gender/i)
			.querySelectorAll("option");
		expect(genderOptions.length).toBe(3); // Default + male + female
		expect(
			screen.getByRole("option", { name: "Male" })
		).toBeInTheDocument();
		expect(
			screen.getByRole("option", { name: "Female" })
		).toBeInTheDocument();

		// Check status options
		const statusOptions = screen
			.getByLabelText(/Status/i)
			.querySelectorAll("option");
		expect(statusOptions.length).toBeGreaterThan(1);
		expect(
			screen.getByRole("option", { name: "Tenured" })
		).toBeInTheDocument();

		// Check college options
		const collegeOptions = screen
			.getByLabelText(/College/i)
			.querySelectorAll("option");
		expect(collegeOptions.length).toBeGreaterThan(1);
		expect(
			screen.getByRole("option", { name: "College of Science" })
		).toBeInTheDocument();
	});
});
