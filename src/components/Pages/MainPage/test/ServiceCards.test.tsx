// Summary of ServiceCards.test.tsx tests:
/*
Key Tests Summary:
- Renders welcome message and service cards correctly:
  Checks that the welcome message and all service cards are rendered on the page.
  
- Navigates to correct paths when cards are clicked:
  Verifies that clicking on service cards navigates to the expected paths.
  
- Shows popout when disabled eyeglasses card is clicked:
  Confirms that clicking on the eyeglasses card when disabled displays the appropriate popout.
  
- Properly handles eyeglasses eligibility based on date:
  Tests the logic for determining if a user is eligible for eyeglasses reimbursement.
  
- Closes popout when confirm/cancel buttons are clicked:
  Ensures the popout can be closed via both confirmation and cancellation.
*/

import {
	render,
	screen,
	fireEvent,
	waitFor,
	act,
} from "@testing-library/react";
import React, { ReactNode } from "react";
import { describe, test, expect, beforeEach, vi } from "vitest";
import ServiceCards from "../ServiceCards";
import "@testing-library/jest-dom";

// Mock data
interface MockTimestamp {
	toMillis: () => number;
	toDate: () => Date;
}

interface MockSnapshot {
	empty: boolean;
	docs: Array<{
		data: () => {
			eyeglassesFlag?: MockTimestamp;
			fullName?: string;
		};
	}>;
}

// Store the snapshot callback at module level
let lastSnapshotCallback: ((snapshot: MockSnapshot) => void) | undefined;

// Mock functions using vi.hoisted to avoid hoisting issues
const mockNavigate = vi.hoisted(() => vi.fn());
const mockDisplayName = vi.hoisted(() => "Test User");
const mockCollection = vi.hoisted(() => vi.fn());
const mockQuery = vi.hoisted(() => vi.fn());
const mockWhere = vi.hoisted(() => vi.fn());
const mockOnSnapshot = vi.hoisted(() => vi.fn());

// Create a mock timestamp factory for testing different scenarios
const createMockTimestamp = vi.hoisted(
	() =>
		(milliseconds: number): MockTimestamp => ({
			toMillis: () => milliseconds,
			toDate: () => new Date(milliseconds),
		})
);

// Mock modules
vi.mock("react-router-dom", () => ({
	useNavigate: () => mockNavigate,
}));

// Update the userContext mock
vi.mock("../../../contexts/userContext", () => {
	// IMPORTANT: Export the actual UserContext for the mock
	const UserContextValue = { displayName: mockDisplayName };
	return {
		useUser: () => UserContextValue,
		UserContext: {
			Provider: ({ children }: { children: ReactNode }) => children,
			Consumer: ({
				children,
			}: {
				children: (value: unknown) => React.ReactNode;
			}) => children(UserContextValue),
		},
		UserProvider: ({ children }: { children: ReactNode }) => children,
	};
});

// Custom render function
const customRender = (ui: React.ReactElement) => {
	return render(ui); // Use regular render since the mock is at module level
};

// Define types for Firestore functions
type FirestoreCollection = string;
type FirestoreQuery = string;
type FirestoreWhere = string;
type FirebaseDb = string;

vi.mock("firebase/firestore", () => ({
	collection: (...args: unknown[]) => {
		mockCollection(...args);
		return "mockCollection" as FirestoreCollection;
	},
	query: (...args: unknown[]) => {
		mockQuery(...args);
		return "mockQuery" as FirestoreQuery;
	},
	where: (...args: unknown[]) => {
		mockWhere(...args);
		return "mockWhere" as FirestoreWhere;
	},
	onSnapshot: (
		query: FirestoreQuery,
		callback: (snapshot: MockSnapshot) => void
	) => {
		mockOnSnapshot(query);
		// Store the callback for tests to control
		lastSnapshotCallback = callback;
		return () => {};
	},
	doc: vi.fn(),
	getDoc: vi.fn(),
	getFirestore: vi.fn().mockReturnValue("mockFirestore"),
}));

vi.mock("../../../contexts/firebase", () => ({
	db: "mockDb" as FirebaseDb,
}));

vi.mock("../../Page Elements/Popout/Popout", () => ({
	default: ({
		title,
		message,
		onConfirm,
		onCancel,
		isOpen,
	}: {
		title: string;
		message: string;
		onConfirm: () => void;
		onCancel?: () => void;
		isOpen: boolean;
	}) =>
		isOpen ? (
			<div data-testid="popout">
				<h2>{title}</h2>
				<p>{message}</p>
				<button onClick={onConfirm}>Confirm</button>
				{onCancel && <button onClick={onCancel}>Cancel</button>}
			</div>
		) : null,
}));

// Mock the asset imports
vi.mock("../../../assets/inpatient.png", () => "mock-inpatient-icon");
vi.mock("../../../assets/admission.png", () => "mock-admission-icon");
vi.mock("../../../assets/outpatient.png", () => "mock-outpatient-icon");
vi.mock("../../../assets/eyeglasses.png", () => "mock-eyeglasses-icon");

describe("ServiceCards Component", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		// Reset the callback
		lastSnapshotCallback = undefined;

		// Setup default query behavior
		mockCollection.mockReturnValue("usersCollection");
		mockQuery.mockReturnValue("userQuery");
		mockWhere.mockReturnValue("whereClause");

		// Default: No eyeglasses request
		triggerSnapshotWithNoEyeglassData();
	});

	// Helper to trigger snapshot callback with different data
	function triggerSnapshotWithNoEyeglassData(): void {
		if (typeof lastSnapshotCallback === "function") {
			act(() => {
				(lastSnapshotCallback as (snapshot: MockSnapshot) => void)({
					empty: false,
					docs: [
						{
							data: () => ({
								fullName: "Test User",
							}),
						},
					],
				});
			});
		}
	}

	function triggerSnapshotWithRecentEyeglassRequest(): void {
		const currentTime = Date.now();
		const requestTime = currentTime - 365 * 24 * 60 * 60 * 1000; // 1 year ago

		if (typeof lastSnapshotCallback === "function") {
			act(() => {
				(lastSnapshotCallback as (snapshot: MockSnapshot) => void)({
					empty: false,
					docs: [
						{
							data: () => ({
								fullName: "Test User",
								eyeglassesFlag:
									createMockTimestamp(requestTime),
							}),
						},
					],
				});
			});
		}
	}

	function triggerSnapshotWithOldEyeglassRequest(): void {
		const currentTime = Date.now();
		const requestTime = currentTime - 3 * 365 * 24 * 60 * 60 * 1000; // 3 years ago

		if (typeof lastSnapshotCallback === "function") {
			act(() => {
				(lastSnapshotCallback as (snapshot: MockSnapshot) => void)({
					empty: false,
					docs: [
						{
							data: () => ({
								fullName: "Test User",
								eyeglassesFlag:
									createMockTimestamp(requestTime),
							}),
						},
					],
				});
			});
		}
	}

	test("renders welcome message and all service cards", async () => {
		customRender(<ServiceCards />);

		// Check welcome message
		expect(
			screen.getByText(/Welcome to the USTFU HealthLink/i)
		).toBeInTheDocument();
		expect(
			screen.getByText(/Choose your desired service below/i)
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

	test("navigates to correct path when cards are clicked", async () => {
		customRender(<ServiceCards />);

		// Click on the inpatient card
		await act(async () => {
			fireEvent.click(screen.getByText("Inpatient Application Form"));
		});

		expect(mockNavigate).toHaveBeenCalledWith("/home/inpatient");

		// Click on the admission card
		await act(async () => {
			fireEvent.click(screen.getByText("Admission Application Form"));
		});

		expect(mockNavigate).toHaveBeenCalledWith("/home/admission");

		// Click on the outpatient card
		await act(async () => {
			fireEvent.click(screen.getByText("Outpatient Application Form"));
		});

		expect(mockNavigate).toHaveBeenCalledWith("/home/outpatient");
	});

	test("shows popout when eyeglasses card is clicked while disabled", async () => {
		// Setup a recent eyeglasses request (less than 2 years)
		triggerSnapshotWithRecentEyeglassRequest();

		customRender(<ServiceCards />);

		// Card should be disabled (recent request), click it
		await act(async () => {
			fireEvent.click(screen.getByText("Eyeglasses Reimbursement Form"));
		});

		// Should show popout instead of navigating
		expect(mockNavigate).not.toHaveBeenCalledWith("/home/eyeglasses");

		// Verify popout is shown
		await waitFor(() => {
			expect(screen.getByTestId("popout")).toBeInTheDocument();
			expect(
				screen.getByText(
					/Sorry, you are unable to request for Eyeglasses Benefits/i
				)
			).toBeInTheDocument();
		});
	});

	test("navigates to eyeglasses page when eligible", async () => {
		// Setup an old eyeglasses request (more than 2 years)
		triggerSnapshotWithOldEyeglassRequest();

		customRender(<ServiceCards />);

		// Card should not be disabled (old request), click it
		await act(async () => {
			fireEvent.click(screen.getByText("Eyeglasses Reimbursement Form"));
		});

		// Should navigate to eyeglasses page
		expect(mockNavigate).toHaveBeenCalledWith("/home/eyeglasses");
	});

	test("closes popout when confirm button is clicked", async () => {
		// Setup a recent eyeglasses request
		triggerSnapshotWithRecentEyeglassRequest();

		customRender(<ServiceCards />);

		// Open popout
		await act(async () => {
			fireEvent.click(screen.getByText("Eyeglasses Reimbursement Form"));
		});

		// Verify popout is shown
		expect(screen.getByTestId("popout")).toBeInTheDocument();

		// Click confirm button
		await act(async () => {
			fireEvent.click(screen.getByText("Confirm"));
		});

		// Verify popout is closed
		await waitFor(() => {
			expect(screen.queryByTestId("popout")).not.toBeInTheDocument();
		});
	});

	test("closes popout when cancel button is clicked", async () => {
		// Setup a recent eyeglasses request
		triggerSnapshotWithRecentEyeglassRequest();

		customRender(<ServiceCards />);

		// Open popout
		await act(async () => {
			fireEvent.click(screen.getByText("Eyeglasses Reimbursement Form"));
		});

		// Verify popout is shown
		expect(screen.getByTestId("popout")).toBeInTheDocument();

		// Click cancel button
		await act(async () => {
			fireEvent.click(screen.getByText("Cancel"));
		});

		// Verify popout is closed
		await waitFor(() => {
			expect(screen.queryByTestId("popout")).not.toBeInTheDocument();
		});
	});
});
