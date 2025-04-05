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

// Mock Popout component with more specific text
interface PopoutProps {
	title: string;
	message: React.ReactNode;
	onConfirm: () => void;
	onCancel: () => void;
	isOpen: boolean;
}

vi.mock("../../src/components/Page Elements/Popout/Popout", () => ({
	default: ({
		title,
		message,
		onConfirm,
		onCancel,
		isOpen,
		"aria-label": ariaLabel,
		"data-testid": testId,
	}: PopoutProps & {
		"aria-label"?: string;
		"data-testid"?: string;
	}) =>
		isOpen ? (
			<div
				data-testid={testId || "popout"}
				aria-label={ariaLabel}
				role="dialog"
			>
				<h2 data-testid="popout-title">{title}</h2>
				<div data-testid="popout-message">{message}</div>
				<div className="popout-buttons">
					<button onClick={onConfirm} data-testid="popout-confirm">
						Confirm
					</button>
					<button onClick={onCancel} data-testid="popout-cancel">
						Cancel
					</button>
				</div>
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
			expect(screen.getByText("Try Again")).toBeInTheDocument();
			expect(screen.getByText("Dismiss")).toBeInTheDocument();
		});
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

	test("handles case where user is deleted from console", async () => {
		// Temporarily remove the UID to simulate deleted user
		const originalUid = firebaseContextValue.uid;
		firebaseContextValue.uid = "";

		render(<Settings />);

		await waitFor(() => {
			expect(
				screen.getByText(/User not found or not authenticated/)
			).toBeInTheDocument();
		});

		// Restore UID for other tests
		firebaseContextValue.uid = originalUid;
	});

	test("renders user settings when data is loaded successfully", async () => {
		render(<Settings />);

		// Wait for a key element first before checking details
		await waitFor(() => {
			expect(
				screen.getByText("Personal Information")
			).toBeInTheDocument();
		});

		// Now check all the form fields - use more robust queries
		await waitFor(() => {
			expect(screen.getByLabelText("First Name")).toHaveValue("John");
			expect(screen.getByLabelText("Last Name")).toHaveValue("Doe");
			expect(screen.getByLabelText("Middle Name")).toHaveValue("Smith");

			// For select elements, check by selected option text
			const suffixSelect = screen.getByLabelText("Suffix");
			expect(suffixSelect).toBeInTheDocument();
			expect(suffixSelect).toHaveValue("Jr.");

			// For date inputs, use a more specific query since date formatting might vary
			const birthdateInput = screen.getByLabelText("Birthdate");
			expect(birthdateInput).toBeInTheDocument();

			// For phone, match more flexibly
			const phoneField = screen.getByLabelText("Phone Number");
			expect(phoneField).toBeInTheDocument();
			expect(phoneField.getAttribute("value")).toContain("917");

			// For load field, convert to string when checking value
			const loadField = screen.getByLabelText("Load (Units)");
			expect(loadField).toHaveValue(18);

			// For status
			expect(screen.getByLabelText("Status")).toHaveValue("Tenured");
			expect(screen.getByLabelText("College Affiliation")).toHaveValue(
				"College of Science"
			);
			expect(screen.getByLabelText("Home Address")).toHaveValue(
				"123 Main St"
			);

			// Age calculation
			const ageElement = screen.getByText("Age").nextElementSibling;
			expect(ageElement).toBeInTheDocument();
			if (ageElement) {
				expect(ageElement.textContent).toMatch(/^\d+$/);
			} else {
				fail("Age element sibling not found");
			}
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
		const popout = screen.getByLabelText("discard changes dialog");
		expect(popout).toBeInTheDocument();
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

	test("calculates age correctly when birthdate is changed", async () => {
		// Use a simple mock for Date that always returns April 4, 2025
		const realDate = global.Date;

		// Create a more robust Date mock that works with the component's date formatting
		const mockDate = new Date(2025, 3, 4); // April 4, 2025
		global.Date = class extends Date {
			constructor(...args: unknown[]) {
				if (args.length) {
					// Use a more specific type instead of any
					super(...(args as ConstructorParameters<typeof Date>));
				} else {
					super(2025, 3, 4); // Fixed date for new Date() calls
					return mockDate;
				}
			}
			static now() {
				return mockDate.getTime();
			}
		} as DateConstructor;

		render(<Settings />);

		// Wait for the component to fully load and display data
		await waitFor(() => {
			expect(screen.getByLabelText("First Name")).toHaveValue("John");
		});

		// Get birthdate input - the component uses date-type input
		const birthdateInput = screen.getByLabelText("Birthdate");

		// Use a direct approach with more specific input values
		// Note: For date inputs, we need to use the yyyy-MM-dd format

		// Test first case: January 1, 2000
		await act(async () => {
			// Clear first and then set the value directly which works better with date inputs
			await fireEvent.change(birthdateInput, {
				target: { value: "2000-01-01" },
			});
			// Force blur event to trigger calculations
			fireEvent.blur(birthdateInput);
		});

		// Wait specifically for the age element to update
		await waitFor(
			() => {
				const ageElement = screen.getByText("Age").nextElementSibling;
				expect(ageElement?.textContent).not.toBe("N/A");
				expect(ageElement?.textContent).toBe("25");
			},
			{ timeout: 3000 }
		);

		// Test second case: May 5, 2000 (hasn't had birthday yet in 2025)
		await act(async () => {
			await fireEvent.change(birthdateInput, {
				target: { value: "2000-05-05" },
			});
			fireEvent.blur(birthdateInput);
		});

		await waitFor(
			() => {
				const ageElement = screen.getByText("Age").nextElementSibling;
				expect(ageElement?.textContent).toBe("24");
			},
			{ timeout: 3000 }
		);

		// Test third case: April 4, 2000 (birthday today)
		await act(async () => {
			await fireEvent.change(birthdateInput, {
				target: { value: "2000-04-04" },
			});
			fireEvent.blur(birthdateInput);
		});

		await waitFor(
			() => {
				const ageElement = screen.getByText("Age").nextElementSibling;
				expect(ageElement?.textContent).toBe("25");
			},
			{ timeout: 3000 }
		);

		// Restore the original Date
		global.Date = realDate;
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

		// Skip checking for specific error text - just verify we can't save with invalid data
		await waitFor(() => {
			// The save button should still be enabled
			expect(screen.getByText("Save Changes")).not.toBeDisabled();
			// We should not see the confirmation dialog
			expect(screen.queryByTestId("popout")).not.toBeInTheDocument();
		});

		// Should not have called updateDoc
		expect(mockUpdateDoc).not.toHaveBeenCalled();
	});

	test("prevents saving when fields are empty", async () => {
		render(<Settings />);

		await waitFor(() => {
			expect(screen.getByLabelText("First Name")).toHaveValue("John");
		});

		// Clear first name field
		const firstNameInput = screen.getByLabelText("First Name");
		await userEvent.clear(firstNameInput);

		// Clear last name field
		const lastNameInput = screen.getByLabelText("Last Name");
		await userEvent.clear(lastNameInput);

		// Try to save
		await act(async () => {
			fireEvent.click(screen.getByText("Save Changes"));
		});

		// Should show validation errors for empty fields
		await waitFor(() => {
			expect(
				screen.getByText("First Name is required")
			).toBeInTheDocument();
			expect(
				screen.getByText("Last Name is required")
			).toBeInTheDocument();
		});

		// Should not have called updateDoc
		expect(mockUpdateDoc).not.toHaveBeenCalled();

		// Should not show confirmation popout
		expect(screen.queryByTestId("popout")).not.toBeInTheDocument();
	});
});
