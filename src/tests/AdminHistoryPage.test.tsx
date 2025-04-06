import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, test, expect, beforeEach, vi } from "vitest";
import "@testing-library/jest-dom";
import type { ReactNode } from "react";

// Create mock implementations using vi.hoisted
const mockNavigate = vi.hoisted(() => vi.fn());
const mockCallFunction = vi.hoisted(() => vi.fn());
const mockCreateObjectURL = vi.hoisted(() =>
	vi.fn().mockReturnValue("mock-blob-url")
);
const mockRevokeObjectURL = vi.hoisted(() => vi.fn());
const mockClickAnchor = vi.hoisted(() => vi.fn());

// Mock data
const mockPendingRequests = [
	{
		id: "request1",
		requester: "John Doe",
		dateSubmitted: "2023-10-15T00:00:00.000Z",
		formData: {
			formType: "inpatient",
			age: "45",
			college: "College of Science",
			term: "1st",
			year: "2023-2024",
			load: "21",
			status: "Tenured",
			illness: "Pneumonia",
			physician: "Dr. Smith",
			procedures: "X-ray, Medication",
			hospital: true,
			hospitalStatus: "Completed",
		},
	},
	{
		id: "request2",
		requester: "Jane Smith",
		dateSubmitted: "2023-09-20T00:00:00.000Z",
		formData: {
			formType: "outpatient",
			age: "38",
			college: "College of Education",
			term: "2nd",
			year: "2023-2024",
			load: "18",
			status: "Lecturer Before 2001",
			illness: "Influenza",
			physician: "Dr. Jones",
			procedures: "Blood test, Medication",
			hospital: true,
			hospitalStatus: "Pending",
		},
	},
	{
		id: "request3",
		requester: "Mark Johnson",
		dateSubmitted: "2023-11-05T00:00:00.000Z",
		formData: {
			formType: "eyeglasses",
			age: "52",
			college: "Faculty of Engineering",
		},
	},
];

// Mock the usePendingRequests hook
vi.mock(
	"../../src/components/Pages/PendingRequestPage/PendingRequestBackend",
	() => ({
		usePendingRequests: () => ({
			requests: mockPendingRequests,
			loading: false,
			error: null,
			fetchMoreRequests: vi.fn(),
			totalRequests: mockPendingRequests.length,
		}),
	})
);

// Mock the firebaseContext
vi.mock("../../src/contexts/firebaseContext", () => {
	return {
		useFirebase: () => ({
			uid: "admin-user-123",
			isAuthenticated: true,
			isLoading: false,
			db: "mockDb",
			displayName: "Admin User",
			photoURL: null,
			userClaims: { role: "operations handler" },
			login: vi.fn(),
			logout: vi.fn(),
			isVerified: true,
			userStatus: "active",
			email: "admin@example.com",
			fullName: "Admin User",
			getFormID: vi.fn().mockResolvedValue(123),
			auth: {},
			app: {},
			storage: {},
			storageRef: {},
			callFunction: mockCallFunction,
			currentUser: { uid: "admin-user-123" },
		}),
		FirebaseProvider: ({ children }: { children: ReactNode }) => children,
	};
});

// Mock userContext
vi.mock("../../src/contexts/userContext", () => ({
	useUser: () => ({
		selectedRole: "operations handler",
		setSelectedRole: vi.fn(),
		availableRoles: ["operations handler"],
		switchRole: vi.fn(),
		loading: false,
		displayName: "Admin User",
		photoURL: null,
	}),
	UserProvider: ({ children }: { children: ReactNode }) => children,
}));

// Mock react-router-dom
vi.mock("react-router-dom", () => ({
	useNavigate: () => mockNavigate,
	useLocation: () => ({ pathname: "/admin/history" }),
}));

// Mock Firebase modules
vi.mock("firebase/firestore", () => ({
	collection: vi.fn().mockReturnValue("mockCollection"),
	query: vi.fn().mockReturnValue("mockQuery"),
	where: vi.fn().mockReturnValue("mockWhere"),
	orderBy: vi.fn().mockReturnValue("mockOrderBy"),
	limit: vi.fn().mockReturnValue("mockLimit"),
	onSnapshot: vi.fn().mockImplementation((_, callback) => {
		// Simulate snapshot callback with data
		callback({
			docs: mockPendingRequests.map((request) => ({
				id: request.id,
				data: () => request,
			})),
		});
		return vi.fn(); // Unsubscribe function
	}),
	getFirestore: vi.fn().mockReturnValue("mockFirestore"),
	serverTimestamp: vi.fn().mockReturnValue("mockTimestamp"),
	getDocs: vi.fn().mockResolvedValue({ docs: [] }),
	startAfter: vi.fn().mockReturnValue("mockStartAfter"),
	doc: vi.fn().mockReturnValue("mockDocRef"),
	getDoc: vi.fn().mockResolvedValue({ exists: () => true, data: () => ({}) }),
}));

// Mock date-fns
vi.mock("date-fns", () => ({
	format: vi.fn().mockImplementation((date) => {
		if (!date) return "Invalid Date";
		return new Date(date).toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	}),
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

// Import component after ALL mocks
import HistoryPage from "../../src/components/Pages/AdminHistoryPage/HistoryPage";

describe("HistoryPage Component", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		localStorageMock.clear();

		// Mock URL methods directly
		URL.createObjectURL = mockCreateObjectURL;
		URL.revokeObjectURL = mockRevokeObjectURL;

		// Mock document.createElement
		const originalCreateElement = document.createElement;
		document.createElement = function (tagName: string) {
			if (tagName === "a") {
				return {
					click: mockClickAnchor,
					setAttribute: vi.fn(),
					style: {},
					download: "",
					href: "",
				} as unknown as HTMLAnchorElement;
			}
			return originalCreateElement.call(document, tagName);
		};
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test("renders transaction history page with header and controls", () => {
		render(<HistoryPage />);

		// Check for page title and description
		expect(screen.getByText("Transaction History")).toBeInTheDocument();
		expect(
			screen.getByText("View and filter all transaction records")
		).toBeInTheDocument();

		// Check for search field
		expect(
			screen.getByPlaceholderText("Search by name")
		).toBeInTheDocument();

		// Check for main control buttons
		expect(screen.getByText("Filter")).toBeInTheDocument();
		expect(screen.getByText("Export")).toBeInTheDocument();
	});

	test("displays data table with transaction records", async () => {
		render(<HistoryPage />);

		// Wait for data to load
		await waitFor(() => {
			// Check for presence of data in table
			expect(screen.getByText("John Doe")).toBeInTheDocument();
			expect(screen.getByText("Jane Smith")).toBeInTheDocument();
			expect(screen.getByText("Mark Johnson")).toBeInTheDocument();
		});

		// Check table headers
		expect(screen.getByText("Form Type")).toBeInTheDocument();
		expect(screen.getByText("Date Approved")).toBeInTheDocument();
		expect(screen.getByText("Name")).toBeInTheDocument();
		expect(screen.getByText("College")).toBeInTheDocument();
	});

	test("filters transactions by form type", async () => {
		render(<HistoryPage />);

		// Open form type dropdown
		fireEvent.click(screen.getByText("All Forms"));

		// Select Inpatient filter
		fireEvent.click(screen.getByText("Inpatient"));

		// Check filtered results
		await waitFor(() => {
			// Should show John Doe (inpatient)
			expect(screen.getByText("John Doe")).toBeInTheDocument();
			// Should not show Mark Johnson (eyeglasses)
			expect(screen.queryByText("Mark Johnson")).not.toBeInTheDocument();
		});
	});

	test("searches transactions by name", async () => {
		render(<HistoryPage />);

		// Enter search text
		const searchInput = screen.getByPlaceholderText("Search by name");
		fireEvent.change(searchInput, { target: { value: "Jane" } });

		// Check filtered results
		await waitFor(() => {
			// Should show Jane Smith
			expect(screen.getByText("Jane Smith")).toBeInTheDocument();
			// Should not show others
			expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
			expect(screen.queryByText("Mark Johnson")).not.toBeInTheDocument();
		});
	});

	test("shows empty state when no records match filter", async () => {
		render(<HistoryPage />);

		// Enter search that won't match any records
		const searchInput = screen.getByPlaceholderText("Search by name");
		fireEvent.change(searchInput, { target: { value: "Nobody" } });

		// Check for empty state message
		await waitFor(() => {
			expect(
				screen.getByText("No history records found")
			).toBeInTheDocument();
			expect(
				screen.getByText(
					"Try adjusting your filters or search criteria"
				)
			).toBeInTheDocument();
		});
	});

	test("applies date range filter correctly", async () => {
		render(<HistoryPage />);

		// Click filter button
		fireEvent.click(screen.getByText("Filter"));

		// Select Date option
		fireEvent.click(screen.getByText("Date"));

		// Fill date range inputs
		const startDateInput = screen.getByLabelText("Start Date");
		const endDateInput = screen.getByLabelText("End Date");

		fireEvent.change(startDateInput, { target: { value: "2023-09-01" } });
		fireEvent.change(endDateInput, { target: { value: "2023-10-31" } });

		// Apply filter
		fireEvent.click(screen.getByText("Apply Filter"));

		// Check that date filter tag appears
		await waitFor(() => {
			expect(screen.getByText("Date:")).toBeInTheDocument();
		});
	});

	test("clears all filters when Clear All is clicked", async () => {
		render(<HistoryPage />);

		// Apply form type filter
		fireEvent.click(screen.getByText("All Forms"));
		fireEvent.click(screen.getByText("Inpatient"));

		// Apply search filter
		const searchInput = screen.getByPlaceholderText("Search by name");
		fireEvent.change(searchInput, { target: { value: "John" } });

		// Verify filtered results
		await waitFor(() => {
			expect(screen.getByText("John Doe")).toBeInTheDocument();
			expect(screen.queryByText("Jane Smith")).not.toBeInTheDocument();
		});

		// Click clear all button
		fireEvent.click(screen.getByText("Clear all"));

		// Confirm in modal
		fireEvent.click(screen.getByText("Clear All"));

		// Verify all records show again
		await waitFor(() => {
			expect(screen.getByText("John Doe")).toBeInTheDocument();
			expect(screen.getByText("Jane Smith")).toBeInTheDocument();
			expect(screen.getByText("Mark Johnson")).toBeInTheDocument();
		});
	});
});
