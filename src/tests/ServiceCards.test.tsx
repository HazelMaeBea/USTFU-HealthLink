import type { ReactNode } from "react";
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

// FIRST - Mock all modules before importing anything
// This is critical - we need to intercept the imports before the components use them

// Mock firebaseContext module - THIS IS THE KEY PART
// We need to completely replace how the useFirebase hook works
vi.mock("../../src/contexts/firebaseContext", () => {
	const mockFirebaseValue = {
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

	return {
		useFirebase: () => mockFirebaseValue,
		FirebaseProvider: ({ children }: { children: ReactNode }) => children,
	};
});

// Be sure to mock the user context too
vi.mock("../../src/contexts/userContext", () => {
	const mockUserValue = {
		displayName: "Test User",
		selectedRole: "member",
		setSelectedRole: vi.fn(),
		availableRoles: ["member"],
		switchRole: vi.fn(),
		loading: false,
		photoURL: null,
	};

	return {
		useUser: () => mockUserValue,
		UserProvider: ({ children }: { children: ReactNode }) => children,
	};
});

// Mock the asset imports
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

// Mock react-router-dom
vi.mock("react-router-dom", () => ({
	useNavigate: () => mockNavigate,
}));

// Mock firebase constants
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

// Import after ALL mocks are setup
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
						ref: null as unknown as QueryDocumentSnapshot["ref"],
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
});
