import { vi } from "vitest";

const mockUnreadPending = {
	unreadTransactionIds: ["request-1"],
	isReadByList: { "request-1": ["user-1"] },
	setUnreadTransactionIds: vi.fn(),
};

vi.mock("../../src/components/Page Elements/NotifBadge/unreadPending", () => ({
	default: () => mockUnreadPending,
}));

const notificationHookReturnValue = {
	addNotification: vi.fn(),
	removeNotification: vi.fn(),
	clearPendingNotifications: vi.fn(),
	notificationList: [],
	pendingNotifications: [],
};

vi.mock("../../src/components/Page Elements/NotifBadge/NotifTrigger", () => ({
	pushAccomplishedNotification: vi.fn().mockResolvedValue(undefined),
	useNotifications: () => notificationHookReturnValue,
}));

const mockUsePendingRequests = vi.fn().mockReturnValue({
	requests: [
		{
			id: "request-1",
			transactionId: "request-1",
			dateSubmitted: "2023-05-15T10:30:00.000Z",
			formData: {
				formType: "hospital",
				origFormType: "inpatient",
				firstname: "John",
				lastname: "Doe",
			},
			requester: "John Doe",
			status: "pending",
		},
	],
	pagination: { currentPage: 1, totalPages: 1, totalRecords: 1 },
	setCurrentPage: vi.fn(),
	isLoading: false,
	error: null,
	fetchData: vi.fn(),
});

const mockUpdateDocument = vi.fn();
const mockUpdateBenefits = vi.fn();
const mockGetUsersBenefits = vi.fn().mockResolvedValue({
	"John Doe": 5000,
	"Jane Smith": 3000,
});

vi.mock(
	"../../src/components/Pages/PendingRequestPage/PendingRequestBackend",
	() => ({
		usePendingRequests: () => mockUsePendingRequests(),
		updateDocument: (...args: any[]) => mockUpdateDocument(...args),
		updateBenefits: (...args: any[]) => mockUpdateBenefits(...args),
		getUsersBenefits: () => mockGetUsersBenefits(),
		updateUserEyeglassesReimbursement: vi.fn(),
	})
);

// 3. Mock firebase/firestore
vi.mock("firebase/firestore", () => ({
	collection: vi.fn(),
	getDocs: vi.fn().mockResolvedValue({ docs: [] }),
	query: vi.fn(),
	where: vi.fn(),
	setDoc: vi.fn(),
	updateDoc: vi.fn(),
	deleteDoc: vi.fn(),
	doc: vi.fn(),
	Timestamp: {
		now: vi.fn().mockReturnValue({ toDate: () => new Date() }),
	},
	serverTimestamp: vi.fn(),
}));

// 4. Mock contexts
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
};

vi.mock("../../src/contexts/firebaseContext", () => ({
	useFirebase: () => firebaseContextValue,
}));

vi.mock("../../src/contexts/firebase.ts", () => ({
	db: {},
	getFormID: vi.fn().mockResolvedValue(123),
}));

// 5. Mock UI components
vi.mock("../../src/components/Page Elements/Popout/Popout", () => ({
	default: ({ title, message, onConfirm, onCancel, isOpen }: any) =>
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

vi.mock("../../src/components/Page Elements/ViewFiles/ViewFiles", () => ({
	default: () => <div data-testid="view-files">File Viewer Mock</div>,
}));

vi.mock("../../src/components/Page Elements/PageButtons/PageButtons", () => ({
	default: ({ currentPage, totalPages, onPageChange }: any) => (
		<div data-testid="page-buttons">
			<button onClick={() => onPageChange(currentPage - 1)}>Prev</button>
			<span>
				Page {currentPage} of {totalPages}
			</span>
			<button onClick={() => onPageChange(currentPage + 1)}>Next</button>
		</div>
	),
}));

// 6. Mock react-router-dom
vi.mock("react-router-dom", () => ({
	useNavigate: () => vi.fn(),
	useLocation: () => ({ pathname: "/pending-requests" }),
}));

// 7. Mock image imports
vi.mock("../../../assets/inpatient.png", () => "mock-inpatient-icon");
vi.mock("../../../assets/admission.png", () => "mock-admission-icon");
vi.mock("../../../assets/outpatient.png", () => "mock-outpatient-icon");
vi.mock("../../../assets/eyeglasses.png", () => "mock-eyeglasses-icon");

// Now import React and testing libraries
import type { ReactNode } from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, test, expect, beforeEach, afterEach } from "vitest";
import "@testing-library/jest-dom";

// Finally, import the component under test
import PendingRequestList from "../../src/components/Pages/PendingRequestPage/PendingRequestsList";

describe("PendingRequestList Component", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test("renders list of pending requests", async () => {
		render(<PendingRequestList />);

		// Check that loading is not displayed (since our mock returns isLoading: false)
		expect(
			screen.queryByTestId("loading-skeleton")
		).not.toBeInTheDocument();

		// Check that request is rendered
		await waitFor(() => {
			expect(screen.getByText("request-1")).toBeInTheDocument();
			expect(screen.getByText("John Doe")).toBeInTheDocument();
		});
	});

	test("shows approval buttons in expanded view", async () => {
		render(<PendingRequestList />);

		// Wait for requests to load
		await waitFor(() => {
			expect(screen.getByText("request-1")).toBeInTheDocument();
		});

		// Click on the request header to expand it
		const requestHeader = screen.getByText("request-1").closest("div");
		fireEvent.click(requestHeader!);

		// Check for approval buttons
		await waitFor(() => {
			expect(screen.getByText("Approve")).toBeInTheDocument();
			expect(screen.getByText("Reject")).toBeInTheDocument();
			expect(screen.getByText("To Revise")).toBeInTheDocument();
		});
	});

	test("handles form type filtering", async () => {
		// Set up a mock with multiple request types
		mockUsePendingRequests.mockReturnValueOnce({
			requests: [
				{
					id: "request-1",
					transactionId: "request-1",
					dateSubmitted: "2023-05-15",
					formData: {
						formType: "hospital",
						firstname: "John",
						lastname: "Doe",
					},
					requester: "John Doe",
					status: "pending",
				},
				{
					id: "request-2",
					transactionId: "request-2",
					dateSubmitted: "2023-05-16",
					formData: {
						formType: "eyeglasses",
						firstname: "Jane",
						lastname: "Smith",
					},
					requester: "Jane Smith",
					status: "pending",
				},
			],
			pagination: { currentPage: 1, totalPages: 1, totalRecords: 2 },
			setCurrentPage: vi.fn(),
			isLoading: false,
			error: null,
			fetchData: vi.fn(),
		});

		// Render component with type filter
		render(<PendingRequestList selectedType="eyeglasses" />);

		// Should only show Jane's eyeglasses request, not John's hospital request
		await waitFor(() => {
			expect(screen.getByText("request-2")).toBeInTheDocument();
			expect(screen.queryByText("request-1")).not.toBeInTheDocument();
		});
	});

	test("shows error state when there's an error", async () => {
		// Set up a mock that returns an error
		mockUsePendingRequests.mockReturnValueOnce({
			requests: [],
			pagination: { currentPage: 1, totalPages: 1, totalRecords: 0 },
			setCurrentPage: vi.fn(),
			isLoading: false,
			error: "Failed to load requests",
			fetchData: vi.fn(),
		});

		render(<PendingRequestList />);

		// Should show error message
		await waitFor(() => {
			expect(
				screen.getByText("Failed to load requests")
			).toBeInTheDocument();
		});
	});

	test("shows empty state when there are no requests", async () => {
		// Set up a mock that returns no requests
		mockUsePendingRequests.mockReturnValueOnce({
			requests: [],
			pagination: { currentPage: 1, totalPages: 1, totalRecords: 0 },
			setCurrentPage: vi.fn(),
			isLoading: false,
			error: null,
			fetchData: vi.fn(),
		});

		render(<PendingRequestList />);

		// Should show empty state
		await waitFor(() => {
			expect(screen.getByText("No pending requests")).toBeInTheDocument();
		});
	});
});
