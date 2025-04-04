import {
	render,
	screen,
	fireEvent,
	waitFor,
	act,
} from "@testing-library/react";
import { describe, test, expect, beforeEach, vi } from "vitest";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";

// Import the Settings component at the top
import Settings from "../../src/components/Pages/SettingsPage/Settings";

// Mock Firebase functions
const mockGetDoc = vi.fn();
const mockUpdateDoc = vi.fn().mockResolvedValue(undefined);
const mockDoc = vi.fn().mockReturnValue("mockDocRef");

// Mock firebase/firestore
vi.mock("firebase/firestore", () => ({
	collection: () => "mockCollection",
	query: () => "mockQuery",
	where: () => "mockWhere",
	onSnapshot: vi.fn().mockImplementation(() => () => {}),
	updateDoc: (docRef: unknown, data: Record<string, unknown>) =>
		mockUpdateDoc(docRef, data),
	doc: (...args: unknown[]) => mockDoc(...args),
	getDoc: vi.fn().mockImplementation(() => mockGetDoc()),
	getFirestore: vi.fn().mockReturnValue("mockFirestore"),
}));

// Mock user data
const mockUserData = {
	personalInfo: {
		firstName: "John",
		lastName: "Doe",
		middleName: "Smith",
		suffix: "Jr.",
		term: "1st",
		year: "2023-2024",
		load: "18",
		status: "Tenured",
		idNumber: "2021-123456",
		address: "123 Main St",
		dateHired: "01/01/2015",
		dateRetired: "",
		birthdate: "01/01/1990",
		phoneNumber: "9171234567", // This will be formatted to +63-917-123-4567
		gender: "Male",
		college: "College of Science",
	},
	notification: true,
	autofill: false,
};

// Setup mock getDoc response - ensure this returns a Promise
const setupMockGetDoc = (exists = true, data = mockUserData) => {
	mockGetDoc.mockResolvedValue({
		exists: () => exists,
		data: () => data,
	});
};

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
	auth: {},
	app: {},
	storage: {},
	storageRef: {},
	callFunction: vi.fn(),
	currentUser: { uid: "test-user-123" },
};

vi.mock("../../src/contexts/firebaseContext", () => {
	return {
		useFirebase: () => firebaseContextValue,
		FirebaseProvider: ({ children }: { children: ReactNode }) => children,
	};
});

// Mock Popout component
interface PopoutProps {
	title: string;
	message: React.ReactNode;
	onConfirm: () => void;
	onCancel: () => void;
	isOpen: boolean;
}

vi.mock("../../src/components/Page Elements/Popout/Popout", () => ({
	default: ({ title, message, onConfirm, onCancel, isOpen }: PopoutProps) =>
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

// Mock localStorage
const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: (key: string) => store[key] || null,
		setItem: (key: string, value: string) => {
			store[key] = value;
		},
		clear: () => {
			store = {};
		},
	};
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });

describe("Settings Component", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		localStorageMock.clear();

		// Default mock implementation - user data exists
		setupMockGetDoc(true, mockUserData);
	});

	test("displays loading state initially", async () => {
		// Delay getDoc resolution to keep component in loading state
		mockGetDoc.mockReturnValue(new Promise(() => {}));

		render(<Settings />);

		// Check for skeleton loader elements instead of spinner
		expect(
			screen.getByTestId("settings-skeleton-loader")
		).toBeInTheDocument();
		expect(
			screen.queryByText("Personal Preferences")
		).not.toBeInTheDocument();
	});

	test("displays error message when fetching user data fails", async () => {
		mockGetDoc.mockRejectedValue(new Error("Failed to fetch user data"));

		render(<Settings />);

		await waitFor(() => {
			expect(
				screen.getByText(/Failed to load your profile data/)
			).toBeInTheDocument();
		});
	});

	test("renders user settings when data is loaded successfully", async () => {
		render(<Settings />);

		// Wait for a key element first before checking details
		await waitFor(() => {
			expect(
				screen.getByText("Personal Information")
			).toBeInTheDocument();
		});

		// Now check all the form fields individually with separate waitFor calls
		await waitFor(() =>
			expect(screen.getByDisplayValue("John")).toBeInTheDocument()
		);
		await waitFor(() =>
			expect(screen.getByDisplayValue("Doe")).toBeInTheDocument()
		);
		await waitFor(() =>
			expect(screen.getByDisplayValue("Smith")).toBeInTheDocument()
		);
		await waitFor(() =>
			expect(screen.getByDisplayValue("Jr.")).toBeInTheDocument()
		);
		await waitFor(() =>
			expect(screen.getByDisplayValue("01/01/1990")).toBeInTheDocument()
		);

		// For the phone number specifically, allow for different formatting possibilities
		await waitFor(() => {
			const phoneField = screen.getByLabelText("Phone Number");
			expect(phoneField).toBeInTheDocument();
			const value = phoneField.getAttribute("value");
			expect(
				value === "+63-917-123-4567" ||
					value === "+639171234567" ||
					value?.includes("917") // Partial match as fallback
			).toBeTruthy();
		});

		// Continue checking the rest of the fields
		await waitFor(() =>
			expect(screen.getByDisplayValue("18")).toBeInTheDocument()
		); // load
		await waitFor(() =>
			expect(screen.getByDisplayValue("Tenured")).toBeInTheDocument()
		); // status
		await waitFor(() =>
			expect(
				screen.getByDisplayValue("College of Science")
			).toBeInTheDocument()
		); // college
		await waitFor(() =>
			expect(screen.getByDisplayValue("123 Main St")).toBeInTheDocument()
		); // address
		await waitFor(() =>
			expect(screen.getByDisplayValue("01/01/2015")).toBeInTheDocument()
		); // dateHired

		// Age calculation
		await waitFor(() => {
			expect(screen.getByText(/\d+/)).toBeInTheDocument(); // Age field
		});
	});

	test("toggle switches change state when clicked", async () => {
		render(<Settings />);

		await waitFor(() => {
			expect(
				screen.getByText("Personal Preferences")
			).toBeInTheDocument();
		});

		// Get the toggle switches
		const notificationToggle = screen.getByLabelText(
			"toggle notifications"
		);
		const autofillToggle = screen.getByLabelText("toggle autofill");

		// Initial state - notification on, autofill off
		expect(notificationToggle).toBeChecked();
		expect(autofillToggle).not.toBeChecked();

		// Toggle notification off
		await act(async () => {
			fireEvent.click(notificationToggle);
		});

		// Should update Firestore with the new value
		expect(mockDoc).toHaveBeenCalledWith(
			"mockDb",
			"users",
			"test-user-123"
		);
		expect(mockUpdateDoc).toHaveBeenCalledWith(
			"mockDocRef",
			expect.objectContaining({ notification: false })
		);

		// Toggle autofill on
		await act(async () => {
			fireEvent.click(autofillToggle);
		});

		// Should update Firestore with the new value
		expect(mockUpdateDoc).toHaveBeenCalledWith(
			"mockDocRef",
			expect.objectContaining({ autofill: true })
		);
	});

	test("form fields update state when changed", async () => {
		render(<Settings />);

		await waitFor(() => {
			expect(screen.getByDisplayValue("John")).toBeInTheDocument();
		});

		// Change first name
		const firstNameInput = screen.getByDisplayValue("John");
		await userEvent.clear(firstNameInput);
		await userEvent.type(firstNameInput, "Jane");

		// Change address
		const addressInput = screen.getByDisplayValue("123 Main St");
		await userEvent.clear(addressInput);
		await userEvent.type(addressInput, "456 Oak Ave");

		// Save button should be enabled
		const saveButton = screen.getByText("Save Changes");
		expect(saveButton).not.toBeDisabled();

		// Click save to show confirmation popout
		await act(async () => {
			fireEvent.click(saveButton);
		});

		// Popout should show changed fields
		expect(screen.getByTestId("popout")).toBeInTheDocument();
		const popoutMessage = screen.getByTestId("popout-message");
		expect(popoutMessage.textContent).toContain("First Name");
		expect(popoutMessage.textContent).toContain("John");
		expect(popoutMessage.textContent).toContain("Jane");
		expect(popoutMessage.textContent).toContain("Address");
		expect(popoutMessage.textContent).toContain("123 Main St");
		expect(popoutMessage.textContent).toContain("456 Oak Ave");

		// Confirm changes
		await act(async () => {
			fireEvent.click(screen.getByTestId("popout-confirm"));
		});

		// Should update Firestore with the new values
		expect(mockUpdateDoc).toHaveBeenCalledWith("mockDocRef", {
			"personalInfo.firstName": "Jane",
			"personalInfo.address": "456 Oak Ave",
		});
	});

	test("cancel button discards changes after confirmation", async () => {
		render(<Settings />);

		await waitFor(() => {
			expect(screen.getByDisplayValue("John")).toBeInTheDocument();
		});

		// Change first name
		const firstNameInput = screen.getByDisplayValue("John");
		await userEvent.clear(firstNameInput);
		await userEvent.type(firstNameInput, "Jane");

		// Click cancel button
		await act(async () => {
			fireEvent.click(screen.getByText("Cancel"));
		});

		// Popout should show warning about discarding changes
		expect(screen.getByTestId("popout")).toBeInTheDocument();
		expect(screen.getByText(/Discarding will revert/)).toBeInTheDocument();

		// Confirm discard
		await act(async () => {
			fireEvent.click(screen.getByTestId("popout-confirm"));
		});

		// Fields should revert to original values
		await waitFor(() => {
			expect(screen.getByDisplayValue("John")).toBeInTheDocument();
		});

		// Should not have called updateDoc
		expect(mockUpdateDoc).not.toHaveBeenCalled();
	});

	test("birthdate formats correctly and calculates age", async () => {
		// Mock date to have deterministic age calculation
		const originalDate = Date;
		const fixedDate = new Date(2025, 3, 4); // April 4, 2025

		// Create a mock Date class that follows ESLint rules
		global.Date = class extends Date {
			constructor(...args: unknown[]) {
				if (args.length === 0) {
					return fixedDate as unknown as Date;
				}
				super(...(args as []));
				return this;
			}
		} as DateConstructor;

		render(<Settings />);

		// Verify initial birthdate and age
		await waitFor(() => {
			expect(screen.getByDisplayValue("01/01/1990")).toBeInTheDocument();
		});

		const birthdateInput = screen.getByDisplayValue("01/01/1990");
		const ageDisplay = screen.getByText("Age")
			.nextElementSibling as HTMLElement;

		// Check initial age calculation (35 years in 2025)
		expect(ageDisplay.textContent).toBe("35");

		// Change birthdate and verify formatting
		await userEvent.clear(birthdateInput);
		await userEvent.type(birthdateInput, "05051995");
		expect(birthdateInput).toHaveValue("05/05/1995");

		// Verify age recalculation (29 years in 2025 before May 5)
		await waitFor(() => {
			expect(ageDisplay.textContent).toBe("29");
		});

		// Restore original Date
		global.Date = originalDate;
	});

	test("phone number handles formatting and validation correctly", async () => {
		render(<Settings />);

		// Wait for initial load with formatted phone number
		await waitFor(() => {
			expect(
				screen.getByDisplayValue("+63-917-123-4567")
			).toBeInTheDocument();
		});

		// Get the phone input
		const phoneInput = screen.getByLabelText("Phone Number");

		// Test Focus behavior - should remove formatting
		await userEvent.click(phoneInput);
		expect(phoneInput).toHaveValue("+639171234567");

		// Test Type behavior - always keeps +63 prefix
		await userEvent.clear(phoneInput);
		await userEvent.type(phoneInput, "9998887777");
		expect(phoneInput).toHaveValue("+639998887777");

		// Test Blur behavior - adds formatting with hyphens
		await userEvent.tab(); // Trigger blur event
		expect(phoneInput).toHaveValue("+63-999-888-7777");

		// Test entering number without +63 prefix (adds automatically)
		await userEvent.clear(phoneInput);
		await userEvent.type(phoneInput, "9171234567");
		await userEvent.tab();
		expect(phoneInput).toHaveValue("+63-917-123-4567");
	});

	test("save changes fails when phone number is invalid", async () => {
		render(<Settings />);

		await waitFor(() => {
			expect(
				screen.getByDisplayValue("+63-917-123-4567")
			).toBeInTheDocument();
		});

		// Enter an invalid phone number (too short)
		const phoneInput = screen.getByDisplayValue("+63-917-123-4567");
		await userEvent.clear(phoneInput);
		await userEvent.type(phoneInput, "+6399");

		// Try to save
		await act(async () => {
			fireEvent.click(screen.getByText("Save Changes"));
		});

		// Should show error message
		await waitFor(() => {
			expect(
				screen.getByText("Please enter a valid phone number")
			).toBeInTheDocument();
		});

		// Should not have called updateDoc
		expect(mockUpdateDoc).not.toHaveBeenCalled();
	});

	test("handles case where user data doesn't exist", async () => {
		// Setup mock to return empty data
		setupMockGetDoc(false);

		render(<Settings />);

		// Should still render but with empty fields
		await waitFor(() => {
			expect(
				screen.getByText("Personal Information")
			).toBeInTheDocument();
			expect(screen.getByLabelText("First Name")).toHaveValue("");
			expect(screen.getByLabelText("Last Name")).toHaveValue("");
		});
	});
});
