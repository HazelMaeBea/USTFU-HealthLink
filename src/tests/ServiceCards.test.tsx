import { ReactNode } from "react";
import {
	render,
	screen,
	fireEvent,
	waitFor,
	act,
} from "@testing-library/react";
import { describe, test, expect, beforeEach, vi } from "vitest";
import "@testing-library/jest-dom";
import { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";

// Mock the asset imports first (must be before any imports that use them)
vi.mock("../../../../assets/inpatient.png", () => ({
	default: "mock-inpatient-icon",
}));
vi.mock("../../../../assets/admission.png", () => ({
	default: "mock-admission-icon",
}));
vi.mock("../../../../assets/outpatient.png", () => ({
	default: "mock-outpatient-icon",
}));
vi.mock("../../../../assets/eyeglasses.png", () => ({
	default: "mock-eyeglasses-icon",
}));

// Create mock functions
const mockNavigate = vi.fn();
const mockDisplayName = "Test User";

// Mock react-router-dom
vi.mock("react-router-dom", () => ({
	useNavigate: () => mockNavigate,
}));

// Mock firebase context
vi.mock("../../../../contexts/firebase", () => ({
	db: "mockDb",
}));

// Define types for Firestore snapshot
interface FirestoreSnapshot {
	empty: boolean;
	docs: QueryDocumentSnapshot<DocumentData>[];
}

type SnapshotCallback = (snapshot: FirestoreSnapshot) => void;

// Mock Firestore
let mockSnapshotCallback: SnapshotCallback | undefined;

vi.mock("firebase/firestore", () => ({
	collection: () => "mockCollection",
	query: () => "mockQuery",
	where: () => "mockWhere",
	onSnapshot: (_: unknown, callback: SnapshotCallback) => {
		mockSnapshotCallback = callback;
		return () => {};
	},
	doc: vi.fn(),
	getDoc: vi.fn(),
	getFirestore: vi.fn().mockReturnValue("mockFirestore"),
}));

// Define user data type
interface UserData {
	fullName: string;
	eyeglassesFlag?: {
		toMillis: () => number;
		toDate: () => Date;
	};
}

// Mock user context
vi.mock("../../../../contexts/userContext", () => ({
	useUser: () => ({
		displayName: mockDisplayName,
		selectedRole: "member",
		setSelectedRole: vi.fn(),
		availableRoles: ["member"],
		switchRole: vi.fn(),
		loading: false,
		photoURL: null,
	}),
	UserProvider: ({ children }: { children: ReactNode }) => children,
}));

// Mock firebase context
vi.mock("../../../../contexts/firebaseContext", () => ({
	useFirebase: () => ({
		uid: "test-user-123",
		isAuthenticated: true,
		db: "mockDb",
		displayName: mockDisplayName,
		photoURL: null,
		userClaims: { role: "member" },
		isLoading: false,
	}),
	FirebaseProvider: ({ children }: { children: ReactNode }) => children,
}));

// Mock Popout component
interface PopoutProps {
	title: string;
	message: string;
	onConfirm: () => void;
	onCancel: () => void;
	isOpen: boolean;
}

vi.mock("../../Page Elements/Popout/Popout", () => ({
	default: ({ title, message, onConfirm, onCancel, isOpen }: PopoutProps) =>
		isOpen ? (
			<div data-testid="popout">
				<h2>{title}</h2>
				<p>{message}</p>
				<button onClick={onConfirm}>Confirm</button>
				{onCancel && <button onClick={onCancel}>Cancel</button>}
			</div>
		) : null,
}));

// Import ServiceCards after all mocks are setup
import ServiceCards from "../../src/components/Pages/MainPage/ServiceCards";

// Helper factory function for timestamps
const createMockTimestamp = (milliseconds: number) => ({
	toMillis: () => milliseconds,
	toDate: () => new Date(milliseconds),
});

// Helper to trigger snapshot with different data
const triggerSnapshotWithData = (data: UserData) => {
	if (mockSnapshotCallback) {
		act(() => {
			mockSnapshotCallback!({
				empty: false,
				docs: [
					{
						data: () => data,
						exists: () => true,
						id: "test-doc",
						metadata: { hasPendingWrites: false, fromCache: false },
						ref: null as unknown as any, // This is a mock, so we can't fully type it
					} as unknown as QueryDocumentSnapshot<DocumentData>,
				],
			});
		});
	}
};

describe("ServiceCards Component", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockNavigate.mockClear();

		// Default: No eyeglasses request
		triggerSnapshotWithData({ fullName: "Test User" });
	});

	describe("Card rendering", () => {
		test("renders welcome message and all service cards", async () => {
			render(<ServiceCards />);

			// Check welcome message
			expect(
				screen.getByText(/Welcome to the USTFU HealthLink/i)
			).toBeInTheDocument();

			// Check all service cards are present
			expect(
				screen.getByText("Inpatient Application Form")
			).toBeInTheDocument();
			expect(
				screen.getByText("Admission Application Form")
			).toBeInTheDocument();
			expect(
				screen.getByText("Outpatient Application Form")
			).toBeInTheDocument();
			expect(
				screen.getByText("Eyeglasses Reimbursement Form")
			).toBeInTheDocument();
		});
	});

	describe("Navigation", () => {
		test("navigates to correct paths when cards are clicked", async () => {
			render(<ServiceCards />);

			// Test each card navigation
			await act(async () => {
				fireEvent.click(screen.getByText("Inpatient Application Form"));
			});
			expect(mockNavigate).toHaveBeenCalledWith("/home/inpatient");

			await act(async () => {
				fireEvent.click(screen.getByText("Admission Application Form"));
			});
			expect(mockNavigate).toHaveBeenCalledWith("/home/admission");

			await act(async () => {
				fireEvent.click(
					screen.getByText("Outpatient Application Form")
				);
			});
			expect(mockNavigate).toHaveBeenCalledWith("/home/outpatient");
		});
	});

	describe("Eyeglasses eligibility", () => {
		test("shows popout when eyeglasses card is clicked while disabled", async () => {
			// Setup a recent eyeglasses request (less than 2 years)
			const currentTime = Date.now();
			const requestTime = currentTime - 365 * 24 * 60 * 60 * 1000; // 1 year ago

			triggerSnapshotWithData({
				fullName: "Test User",
				eyeglassesFlag: createMockTimestamp(requestTime),
			});

			render(<ServiceCards />);

			await act(async () => {
				fireEvent.click(
					screen.getByText("Eyeglasses Reimbursement Form")
				);
			});

			expect(mockNavigate).not.toHaveBeenCalledWith("/home/eyeglasses");

			await waitFor(() => {
				expect(screen.getByTestId("popout")).toBeInTheDocument();
				expect(
					screen.getByText(/Sorry, you are unable to request/i)
				).toBeInTheDocument();
			});
		});

		test("navigates to eyeglasses page when eligible", async () => {
			// Setup an old eyeglasses request (more than 2 years)
			const currentTime = Date.now();
			const requestTime = currentTime - 3 * 365 * 24 * 60 * 60 * 1000; // 3 years ago

			triggerSnapshotWithData({
				fullName: "Test User",
				eyeglassesFlag: createMockTimestamp(requestTime),
			});

			render(<ServiceCards />);

			await act(async () => {
				fireEvent.click(
					screen.getByText("Eyeglasses Reimbursement Form")
				);
			});

			expect(mockNavigate).toHaveBeenCalledWith("/home/eyeglasses");
		});
	});

	describe("Popout interactions", () => {
		beforeEach(() => {
			// Setup a recent eyeglasses request
			const currentTime = Date.now();
			const requestTime = currentTime - 365 * 24 * 60 * 60 * 1000; // 1 year ago

			triggerSnapshotWithData({
				fullName: "Test User",
				eyeglassesFlag: createMockTimestamp(requestTime),
			});
		});

		test("closes popout when confirm button is clicked", async () => {
			render(<ServiceCards />);

			await act(async () => {
				fireEvent.click(
					screen.getByText("Eyeglasses Reimbursement Form")
				);
			});

			expect(screen.getByTestId("popout")).toBeInTheDocument();

			await act(async () => {
				fireEvent.click(screen.getByText("Confirm"));
			});

			await waitFor(() => {
				expect(screen.queryByTestId("popout")).not.toBeInTheDocument();
			});
		});

		test("closes popout when cancel button is clicked", async () => {
			render(<ServiceCards />);

			await act(async () => {
				fireEvent.click(
					screen.getByText("Eyeglasses Reimbursement Form")
				);
			});

			expect(screen.getByTestId("popout")).toBeInTheDocument();

			await act(async () => {
				fireEvent.click(screen.getByText("Cancel"));
			});

			await waitFor(() => {
				expect(screen.queryByTestId("popout")).not.toBeInTheDocument();
			});
		});
	});
});
