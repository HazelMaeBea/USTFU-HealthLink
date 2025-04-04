import type { ReactNode } from "react";
import {
	render,
	screen,
	fireEvent,
	waitFor,
	act,
} from "@testing-library/react";
import { describe, test, expect, beforeEach, vi, afterEach } from "vitest";
import "@testing-library/jest-dom";

// Mock Firebase context values
const firebaseContextValue = {
	uid: "test-user-123",
	isAuthenticated: true,
	db: "mockDb",
	displayName: "Test User",
	photoURL: null,
	userClaims: { role: "operations handler" },
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

// Mock context modules
vi.mock("../../src/contexts/firebaseContext", () => ({
	useFirebase: () => firebaseContextValue,
	FirebaseProvider: ({ children }: { children: ReactNode }) => children,
}));

// Mock user context
const userContextValue = {
	selectedRole: "operations handler",
	setSelectedRole: vi.fn(),
	availableRoles: ["member", "operations handler"],
	switchRole: vi.fn(),
	loading: false,
	displayName: "Test User",
	photoURL: null,
};

vi.mock("../../src/contexts/userContext", () => ({
	useUser: () => userContextValue,
	UserProvider: ({ children }: { children: ReactNode }) => children,
}));

// Mock react-router
const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
	useNavigate: () => mockNavigate,
	useLocation: () => ({ pathname: "/pendingrequests" }),
}));

// Mock Firebase Firestore functions
type MockSnapshotCallback = (snapshot: unknown) => void;
let mockSnapshotCallbacks: { [key: string]: MockSnapshotCallback } = {};

const mockUpdateDoc = vi.fn().mockResolvedValue(undefined);
const mockCollection = vi.fn().mockReturnValue("mockCollectionRef");
const mockDoc = vi.fn().mockReturnValue("mockDocRef");
const mockAddDoc = vi.fn().mockResolvedValue({ id: "new-doc-id" });
const mockServerTimestamp = vi.fn().mockReturnValue("mockTimestamp");
const mockWhere = vi.fn().mockReturnValue("mockWhereClause");
const mockOrderBy = vi.fn().mockReturnValue("mockOrderByClause");
const mockQuery = vi.fn().mockReturnValue("mockQueryRef");

vi.mock("firebase/firestore", () => ({
	collection: (...args: unknown[]) => mockCollection(...args),
	doc: (...args: unknown[]) => mockDoc(...args),
	updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
	addDoc: (...args: unknown[]) => mockAddDoc(...args),
	onSnapshot: vi.fn().mockImplementation((_, callback) => {
		const id = Math.random().toString();
		mockSnapshotCallbacks[id] = callback;
		return () => {
			delete mockSnapshotCallbacks[id];
		};
	}),
	query: (...args: unknown[]) => mockQuery(...args),
	where: (...args: unknown[]) => mockWhere(...args),
	orderBy: (...args: unknown[]) => mockOrderBy(...args),
	serverTimestamp: () => mockServerTimestamp(),
	Timestamp: {
		now: () => ({ toDate: () => new Date() }),
	},
	getFirestore: vi.fn().mockReturnValue("mockFirestore"),
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

// Mock ViewFiles component
vi.mock("../../src/components/Page Elements/ViewFiles/ViewFiles", () => ({
	default: () => <div data-testid="view-files">File Viewer Mock</div>,
}));

// Mock NotifTrigger
vi.mock("../../src/components/Page Elements/NotifBadge/NotifTrigger", () => ({
	pushAccomplishedNotification: vi.fn().mockResolvedValue(undefined),
}));

// Mock image imports
vi.mock("../../../assets/inpatient.png", () => "mock-inpatient-icon");
vi.mock("../../../assets/admission.png", () => "mock-admission-icon");
vi.mock("../../../assets/outpatient.png", () => "mock-outpatient-icon");
vi.mock("../../../assets/eyeglasses.png", () => "mock-eyeglasses-icon");

// Import components after all mocks are set up
import PendingRequests from "../../src/components/Pages/PendingRequestPage/PendingRequests";
import { pushAccomplishedNotification } from "../../src/components/Page Elements/NotifBadge/NotifTrigger";

// Mock request data factory function
const createMockRequest = (
	id: string,
	type: string = "hospital",
	customData = {}
) => ({
	id,
	data: () => ({
		transactionId: id,
		dateSubmitted: "2023-05-15T10:30:00.000Z",
		formData: {
			formType: type,
			origFormType: type === "hospital" ? "inpatient" : type,
			firstname: "John",
			lastname: "Doe",
			middlename: "Smith",
			suffix: "Jr.",
			gender: "Male",
			age: "35",
			college: "College of Science",
			contact: "+639171234567",
			hospital: "UST Hospital",
			illness: "Fever",
			physician: "Dr. Smith",
			procedures: "Consultation",
			term: "1st",
			year: "2023-2024",
			load: "18",
			status: "Tenured",
			// Eyeglasses specific fields
			...(type === "eyeglasses"
				? {
						ORNumber: "12345",
						issuedBy: "Vision Center",
						amountPaid: "2000",
				  }
				: {}),
			// Add any custom data
			...customData,
		},
		requester: "John Doe",
		...customData,
	}),
});

describe("PendingRequest Component", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockSnapshotCallbacks = {};
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test("renders pending requests list with header", async () => {
		render(<PendingRequests />);

		// Check header is rendered
		expect(screen.getByText("Pending Requests")).toBeInTheDocument();

		// Trigger mock data from Firestore
		if (Object.keys(mockSnapshotCallbacks).length > 0) {
			act(() => {
				const callback = Object.values(mockSnapshotCallbacks)[0];
				callback({
					docs: [
						createMockRequest("request-1", "hospital"),
						createMockRequest("request-2", "eyeglasses"),
					],
				});
			});
		}

		// Check table headers
		await waitFor(() => {
			expect(screen.getByText("Transaction ID")).toBeInTheDocument();
			expect(screen.getByText("Date")).toBeInTheDocument();
			expect(screen.getByText("Requester")).toBeInTheDocument();
			expect(screen.getByText("Form Type")).toBeInTheDocument();
			expect(screen.getByText("Actions")).toBeInTheDocument();
		});

		// Check both request items are displayed
		expect(screen.getByText("request-1")).toBeInTheDocument();
		expect(screen.getByText("request-2")).toBeInTheDocument();

		// Check form types
		const inpatientText = screen.getByText("Inpatient");
		const eyeglassesText = screen.getByText("Eyeglasses");
		expect(inpatientText).toBeInTheDocument();
		expect(eyeglassesText).toBeInTheDocument();
	});

	test("opens view details when View button is clicked", async () => {
		render(<PendingRequests />);

		// Trigger mock data from Firestore
		if (Object.keys(mockSnapshotCallbacks).length > 0) {
			act(() => {
				const callback = Object.values(mockSnapshotCallbacks)[0];
				callback({
					docs: [createMockRequest("request-1", "hospital")],
				});
			});
		}

		await waitFor(() => {
			expect(screen.getByText("request-1")).toBeInTheDocument();
		});

		// Click the View button
		const viewButtons = screen.getAllByText("View");
		fireEvent.click(viewButtons[0]);

		// Check that detail section is shown
		await waitFor(() => {
			expect(screen.getByText("Request Details")).toBeInTheDocument();
			expect(
				screen.getByText("Personal Information")
			).toBeInTheDocument();
			expect(screen.getByText("John")).toBeInTheDocument(); // First name
			expect(screen.getByText("Doe")).toBeInTheDocument(); // Last name
			expect(screen.getByText("Smith")).toBeInTheDocument(); // Middle name
			expect(screen.getByText("UST Hospital")).toBeInTheDocument(); // Hospital name
		});

		// Check if files viewer is rendered
		expect(screen.getByTestId("view-files")).toBeInTheDocument();
	});

	test("shows no requests message when list is empty", async () => {
		render(<PendingRequests />);

		// Trigger empty data from Firestore
		if (Object.keys(mockSnapshotCallbacks).length > 0) {
			act(() => {
				const callback = Object.values(mockSnapshotCallbacks)[0];
				callback({
					docs: [],
				});
			});
		}

		// Check for no requests message
		await waitFor(() => {
			expect(
				screen.getByText("No pending requests found.")
			).toBeInTheDocument();
		});
	});

	test("back button returns to list view from details view", async () => {
		render(<PendingRequests />);

		// Trigger mock data from Firestore
		if (Object.keys(mockSnapshotCallbacks).length > 0) {
			act(() => {
				const callback = Object.values(mockSnapshotCallbacks)[0];
				callback({
					docs: [createMockRequest("request-1", "hospital")],
				});
			});
		}

		await waitFor(() => {
			expect(screen.getByText("request-1")).toBeInTheDocument();
		});

		// Click the View button to show details
		const viewButtons = screen.getAllByText("View");
		fireEvent.click(viewButtons[0]);

		// Wait for details view to appear
		await waitFor(() => {
			expect(screen.getByText("Request Details")).toBeInTheDocument();
		});

		// Click the Back button
		const backButton = screen.getByText("Back");
		fireEvent.click(backButton);

		// Should return to list view
		await waitFor(() => {
			expect(screen.getByText("Pending Requests")).toBeInTheDocument();
			expect(
				screen.queryByText("Request Details")
			).not.toBeInTheDocument();
		});
	});

	test("shows confirmation popout when Approve button is clicked", async () => {
		render(<PendingRequests />);

		// Trigger mock data from Firestore
		if (Object.keys(mockSnapshotCallbacks).length > 0) {
			act(() => {
				const callback = Object.values(mockSnapshotCallbacks)[0];
				callback({
					docs: [createMockRequest("request-1", "hospital")],
				});
			});
		}

		await waitFor(() => {
			expect(screen.getByText("request-1")).toBeInTheDocument();
		});

		// Click the Approve button
		const approveButtons = screen.getAllByText("Approve");
		fireEvent.click(approveButtons[0]);

		// Check that confirmation popout is shown
		await waitFor(() => {
			expect(screen.getByTestId("popout")).toBeInTheDocument();
			expect(screen.getByText("Confirm Approval")).toBeInTheDocument();
		});
	});

	test("shows confirmation popout when Reject button is clicked", async () => {
		render(<PendingRequests />);

		// Trigger mock data from Firestore
		if (Object.keys(mockSnapshotCallbacks).length > 0) {
			act(() => {
				const callback = Object.values(mockSnapshotCallbacks)[0];
				callback({
					docs: [createMockRequest("request-1", "hospital")],
				});
			});
		}

		await waitFor(() => {
			expect(screen.getByText("request-1")).toBeInTheDocument();
		});

		// Click the Reject button
		const rejectButtons = screen.getAllByText("Reject");
		fireEvent.click(rejectButtons[0]);

		// Check that confirmation popout is shown
		await waitFor(() => {
			expect(screen.getByTestId("popout")).toBeInTheDocument();
			expect(screen.getByText("Confirm Rejection")).toBeInTheDocument();
		});
	});

	test("properly approves a request when confirmed", async () => {
		render(<PendingRequests />);

		// Trigger mock data from Firestore
		if (Object.keys(mockSnapshotCallbacks).length > 0) {
			act(() => {
				const callback = Object.values(mockSnapshotCallbacks)[0];
				callback({
					docs: [createMockRequest("request-1", "hospital")],
				});
			});
		}

		await waitFor(() => {
			expect(screen.getByText("request-1")).toBeInTheDocument();
		});

		// Click the Approve button
		const approveButtons = screen.getAllByText("Approve");
		fireEvent.click(approveButtons[0]);

		// Confirm approval
		await waitFor(() => {
			expect(screen.getByTestId("popout-confirm")).toBeInTheDocument();
		});

		fireEvent.click(screen.getByTestId("popout-confirm"));

		// Check that Firestore was updated correctly
		await waitFor(() => {
			// Should call addDoc to add to accomplished collection
			expect(mockAddDoc).toHaveBeenCalledTimes(1);

			// Should call updateDoc to update the original request
			expect(mockUpdateDoc).toHaveBeenCalledTimes(1);

			// Check that notification was pushed
			expect(pushAccomplishedNotification).toHaveBeenCalledTimes(1);
		});
	});

	test("properly rejects a request when confirmed", async () => {
		render(<PendingRequests />);

		// Trigger mock data from Firestore
		if (Object.keys(mockSnapshotCallbacks).length > 0) {
			act(() => {
				const callback = Object.values(mockSnapshotCallbacks)[0];
				callback({
					docs: [createMockRequest("request-1", "hospital")],
				});
			});
		}

		await waitFor(() => {
			expect(screen.getByText("request-1")).toBeInTheDocument();
		});

		// Click the Reject button
		const rejectButtons = screen.getAllByText("Reject");
		fireEvent.click(rejectButtons[0]);

		// Confirm rejection
		await waitFor(() => {
			expect(screen.getByTestId("popout-confirm")).toBeInTheDocument();
		});

		fireEvent.click(screen.getByTestId("popout-confirm"));

		// Check that Firestore was updated correctly
		await waitFor(() => {
			// Should call addDoc to add to accomplished collection
			expect(mockAddDoc).toHaveBeenCalledTimes(1);

			// Should call updateDoc to update the original request
			expect(mockUpdateDoc).toHaveBeenCalledTimes(1);

			// Check that notification was pushed
			expect(pushAccomplishedNotification).toHaveBeenCalledTimes(1);
		});
	});

	test("cancels approval when cancel is clicked in popout", async () => {
		render(<PendingRequests />);

		// Trigger mock data from Firestore
		if (Object.keys(mockSnapshotCallbacks).length > 0) {
			act(() => {
				const callback = Object.values(mockSnapshotCallbacks)[0];
				callback({
					docs: [createMockRequest("request-1", "hospital")],
				});
			});
		}

		await waitFor(() => {
			expect(screen.getByText("request-1")).toBeInTheDocument();
		});

		// Click the Approve button
		const approveButtons = screen.getAllByText("Approve");
		fireEvent.click(approveButtons[0]);

		// Click cancel in popout
		await waitFor(() => {
			expect(screen.getByTestId("popout-cancel")).toBeInTheDocument();
		});

		fireEvent.click(screen.getByTestId("popout-cancel"));

		// Check that popout is closed and no Firestore calls were made
		expect(screen.queryByTestId("popout")).not.toBeInTheDocument();
		expect(mockAddDoc).not.toHaveBeenCalled();
		expect(mockUpdateDoc).not.toHaveBeenCalled();
	});

	test("shows different form fields for eyeglasses request", async () => {
		render(<PendingRequests />);

		// Trigger mock data from Firestore with eyeglasses request
		if (Object.keys(mockSnapshotCallbacks).length > 0) {
			act(() => {
				const callback = Object.values(mockSnapshotCallbacks)[0];
				callback({
					docs: [createMockRequest("request-1", "eyeglasses")],
				});
			});
		}

		await waitFor(() => {
			expect(screen.getByText("request-1")).toBeInTheDocument();
		});

		// Click the View button
		const viewButtons = screen.getAllByText("View");
		fireEvent.click(viewButtons[0]);

		// Check for eyeglasses-specific fields
		await waitFor(() => {
			expect(screen.getByText("OR Number")).toBeInTheDocument();
			expect(screen.getByText("12345")).toBeInTheDocument(); // OR Number value
			expect(screen.getByText("Issued By")).toBeInTheDocument();
			expect(screen.getByText("Vision Center")).toBeInTheDocument(); // Issued By value
			expect(screen.getByText("Amount Paid")).toBeInTheDocument();
			expect(screen.getByText("2000")).toBeInTheDocument(); // Amount Paid value
		});
	});

	test("handles requests with missing fields gracefully", async () => {
		render(<PendingRequests />);

		// Create request with missing data
		const incompleteRequest = createMockRequest(
			"request-incomplete",
			"hospital",
			{
				// Remove some fields from form data
				formData: {
					formType: "hospital",
					origFormType: "inpatient",
					firstname: "John",
					lastname: "Doe",
					// Missing middlename
					// Missing other fields
				},
			}
		);

		// Trigger mock data from Firestore
		if (Object.keys(mockSnapshotCallbacks).length > 0) {
			act(() => {
				const callback = Object.values(mockSnapshotCallbacks)[0];
				callback({
					docs: [incompleteRequest],
				});
			});
		}

		await waitFor(() => {
			expect(screen.getByText("request-incomplete")).toBeInTheDocument();
		});

		// Click the View button
		const viewButtons = screen.getAllByText("View");
		fireEvent.click(viewButtons[0]);

		// Should display available fields without errors
		await waitFor(() => {
			expect(screen.getByText("Request Details")).toBeInTheDocument();
			expect(screen.getByText("John")).toBeInTheDocument(); // First name
			expect(screen.getByText("Doe")).toBeInTheDocument(); // Last name

			// Missing fields should be handled gracefully - either shown as empty or N/A
			// We don't test for specific display of missing fields, just that the component doesn't crash
		});
	});

	test("pagination works correctly with multiple pages", async () => {
		render(<PendingRequests />);

		// Create more requests than will fit on one page
		const manyRequests = Array(15)
			.fill(null)
			.map((_, i) =>
				createMockRequest(
					`request-${i + 1}`,
					i % 2 === 0 ? "hospital" : "eyeglasses"
				)
			);

		// Trigger mock data from Firestore
		if (Object.keys(mockSnapshotCallbacks).length > 0) {
			act(() => {
				const callback = Object.values(mockSnapshotCallbacks)[0];
				callback({
					docs: manyRequests,
				});
			});
		}

		// Should show pagination controls
		await waitFor(() => {
			// The presence of "1" button indicates pagination is active
			expect(screen.getByText("1")).toBeInTheDocument();
			expect(screen.getByText("2")).toBeInTheDocument();
		});

		// First page should show the first set of requests
		expect(screen.getByText("request-1")).toBeInTheDocument();
		expect(screen.getByText("request-10")).toBeInTheDocument();

		// Click to second page
		fireEvent.click(screen.getByText("2"));

		// Second page should show the next set of requests
		expect(screen.queryByText("request-1")).not.toBeInTheDocument();
		expect(screen.getByText("request-11")).toBeInTheDocument();
		expect(screen.getByText("request-15")).toBeInTheDocument();
	});

	test("search filters requests correctly", async () => {
		render(<PendingRequests />);

		// Trigger mock data with multiple requests
		if (Object.keys(mockSnapshotCallbacks).length > 0) {
			act(() => {
				const callback = Object.values(mockSnapshotCallbacks)[0];
				callback({
					docs: [
						createMockRequest("ABC-123", "hospital"),
						createMockRequest("DEF-456", "eyeglasses"),
						createMockRequest("ABC-789", "hospital"),
					],
				});
			});
		}

		await waitFor(() => {
			expect(screen.getByText("ABC-123")).toBeInTheDocument();
			expect(screen.getByText("DEF-456")).toBeInTheDocument();
			expect(screen.getByText("ABC-789")).toBeInTheDocument();
		});

		// Find search input and type in it
		const searchInput = screen.getByPlaceholderText(
			"Search by ID or name..."
		);
		fireEvent.change(searchInput, { target: { value: "ABC" } });

		// Should only show matching requests
		await waitFor(() => {
			expect(screen.getByText("ABC-123")).toBeInTheDocument();
			expect(screen.getByText("ABC-789")).toBeInTheDocument();
			expect(screen.queryByText("DEF-456")).not.toBeInTheDocument();
		});

		// Clear search
		fireEvent.change(searchInput, { target: { value: "" } });

		// Should show all requests again
		await waitFor(() => {
			expect(screen.getByText("ABC-123")).toBeInTheDocument();
			expect(screen.getByText("DEF-456")).toBeInTheDocument();
			expect(screen.getByText("ABC-789")).toBeInTheDocument();
		});
	});

	test("error handling when Firestore operations fail", async () => {
		// Mock updateDoc to fail
		mockUpdateDoc.mockRejectedValueOnce(new Error("Firestore error"));

		render(<PendingRequests />);

		// Trigger mock data from Firestore
		if (Object.keys(mockSnapshotCallbacks).length > 0) {
			act(() => {
				const callback = Object.values(mockSnapshotCallbacks)[0];
				callback({
					docs: [createMockRequest("request-1", "hospital")],
				});
			});
		}

		await waitFor(() => {
			expect(screen.getByText("request-1")).toBeInTheDocument();
		});

		// Click the Approve button
		const approveButtons = screen.getAllByText("Approve");
		fireEvent.click(approveButtons[0]);

		// Confirm approval
		await waitFor(() => {
			expect(screen.getByTestId("popout-confirm")).toBeInTheDocument();
		});

		fireEvent.click(screen.getByTestId("popout-confirm"));

		// Should show error message
		await waitFor(() => {
			expect(
				screen.getByText(/Error approving request/i)
			).toBeInTheDocument();
		});
	});
});
