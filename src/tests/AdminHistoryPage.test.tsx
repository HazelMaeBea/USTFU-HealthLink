import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, test, expect, beforeEach, vi } from "vitest";
import "@testing-library/jest-dom";
import type { ReactNode } from "react";

// Mock navigate function
const mockNavigate = vi.fn();

// Mock the Firestore functions
const mockCollection = vi.fn().mockReturnValue("mockCollection");
const mockQuery = vi.fn().mockReturnValue("mockQuery");
const mockOrderBy = vi.fn().mockReturnValue("mockOrderBy");
const mockWhere = vi.fn().mockReturnValue("mockWhere");
const mockLimit = vi.fn().mockReturnValue("mockLimit");
const mockOnSnapshot = vi.fn();
const mockDoc = vi.fn().mockReturnValue("mockDocRef");
const mockGetDoc = vi.fn();

// Create a store for firebase context values
const firebaseContextStore = {
	value: {
		uid: "admin-user-123",
		isAuthenticated: true,
		db: "mockDb",
		displayName: "Admin User",
		photoURL: null,
		userClaims: { role: "operations handler" },
		isLoading: false,
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
		callFunction: vi.fn(),
		currentUser: { uid: "admin-user-123" },
	},
};

// Create a store for user context values
const userContextStore = {
	value: {
		selectedRole: "operations handler",
		setSelectedRole: vi.fn(),
		availableRoles: ["operations handler"],
		switchRole: vi.fn(),
		loading: false,
		displayName: "Admin User",
		photoURL: null,
	},
};

// Mock all required context modules
vi.mock("../../src/contexts/firebaseContext", () => ({
	useFirebase: () => firebaseContextStore.value,
	FirebaseProvider: ({ children }: { children: ReactNode }) => children,
}));

vi.mock("../../src/contexts/userContext", () => ({
	useUser: () => userContextStore.value,
	UserProvider: ({ children }: { children: ReactNode }) => children,
}));

// Mock Firebase modules
vi.mock("firebase/firestore", () => ({
	collection: (db: unknown, path: string) => mockCollection(db, path),
	query: (...args: unknown[]) => mockQuery(...args),
	orderBy: (field: string, direction: string) =>
		mockOrderBy(field, direction),
	where: (field: string, op: string, value: unknown) =>
		mockWhere(field, op, value),
	limit: (n: number) => mockLimit(n),
	onSnapshot: (...args: unknown[]) => mockOnSnapshot(...args),
	doc: (db: unknown, collection: string, id: string) =>
		mockDoc(db, collection, id),
	getDoc: (docRef: unknown) => mockGetDoc(docRef),
	getFirestore: vi.fn().mockReturnValue("mockFirestore"),
	startAfter: vi.fn().mockReturnValue("mockStartAfter"),
	getDocs: vi.fn().mockResolvedValue({ docs: [] }),
	serverTimestamp: vi.fn().mockReturnValue("mockServerTimestamp"),
}));

// Mock react-router-dom
vi.mock("react-router-dom", () => ({
	useNavigate: () => mockNavigate,
	useLocation: () => ({ pathname: "/hospitalizationhistory" }),
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

// Mock hospitalization record data for testing
const mockHospitalizationRecords = [
	{
		id: "record1",
		userId: "user1",
		userName: "John Doe",
		hospitalName: "St. Luke's Medical Center",
		dateSubmitted: { toDate: () => new Date("2023-10-15") },
		dateProcessed: { toDate: () => new Date("2023-10-16") },
		status: "Approved",
		type: "Inpatient",
		amount: 15000,
		processedBy: "Admin User",
	},
	{
		id: "record2",
		userId: "user2",
		userName: "Jane Smith",
		hospitalName: "UST Hospital",
		dateSubmitted: { toDate: () => new Date("2023-09-20") },
		dateProcessed: { toDate: () => new Date("2023-09-22") },
		status: "Rejected",
		type: "Outpatient",
		amount: 5000,
		processedBy: "Admin User",
	},
	{
		id: "record3",
		userId: "user3",
		userName: "Mark Johnson",
		hospitalName: "Manila Doctors Hospital",
		dateSubmitted: { toDate: () => new Date("2023-11-05") },
		dateProcessed: { toDate: () => new Date("2023-11-07") },
		status: "Approved",
		type: "Admission",
		amount: 8000,
		processedBy: "Other Admin",
	},
];

// Mock onSnapshot implementation
const setupMockSnapshot = () => {
	mockOnSnapshot.mockImplementation((query, callback) => {
		callback({
			docs: mockHospitalizationRecords.map((record) => ({
				id: record.id,
				data: () => record,
				exists: () => true,
			})),
			size: mockHospitalizationRecords.length,
		});
		return () => {}; // Unsubscribe function
	});
};

// Import the component after all mocks
import AdminHistoryPage from "../../src/components/Pages/AdminHistoryPage/HistoryPage";

describe("AdminHistoryPage Component", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		setupMockSnapshot();
	});

	test("renders the hospitalization history page correctly", async () => {
		render(<AdminHistoryPage />);

		// Check page title
		expect(screen.getByText("Hospitalization History")).toBeInTheDocument();

		// Check search and filter elements
		expect(
			screen.getByPlaceholderText("Search by name or hospital")
		).toBeInTheDocument();
		expect(screen.getByLabelText("Filter by Status:")).toBeInTheDocument();
		expect(screen.getByLabelText("Filter by Type:")).toBeInTheDocument();

		// Wait for records to be loaded
		await waitFor(() => {
			// Check that all mock records are displayed
			expect(screen.getByText("John Doe")).toBeInTheDocument();
			expect(screen.getByText("Jane Smith")).toBeInTheDocument();
			expect(screen.getByText("Mark Johnson")).toBeInTheDocument();

			// Check hospitals
			expect(
				screen.getByText("St. Luke's Medical Center")
			).toBeInTheDocument();
			expect(screen.getByText("UST Hospital")).toBeInTheDocument();
			expect(
				screen.getByText("Manila Doctors Hospital")
			).toBeInTheDocument();

			// Check statuses and types
			expect(screen.getAllByText("Approved").length).toBe(2);
			expect(screen.getByText("Rejected")).toBeInTheDocument();
			expect(screen.getByText("Inpatient")).toBeInTheDocument();
			expect(screen.getByText("Outpatient")).toBeInTheDocument();
			expect(screen.getByText("Admission")).toBeInTheDocument();
		});
	});

	test("filters records by status", async () => {
		render(<AdminHistoryPage />);

		// Wait for records to load
		await waitFor(() => {
			expect(screen.getByText("John Doe")).toBeInTheDocument();
		});

		// Select Approved status filter
		fireEvent.change(screen.getByLabelText("Filter by Status:"), {
			target: { value: "Approved" },
		});

		await waitFor(() => {
			// Should show approved records
			expect(screen.getByText("John Doe")).toBeInTheDocument();
			expect(screen.getByText("Mark Johnson")).toBeInTheDocument();
			// Should not show rejected records
			expect(screen.queryByText("Jane Smith")).not.toBeInTheDocument();
		});

		// Select Rejected status filter
		fireEvent.change(screen.getByLabelText("Filter by Status:"), {
			target: { value: "Rejected" },
		});

		await waitFor(() => {
			// Should show rejected records
			expect(screen.getByText("Jane Smith")).toBeInTheDocument();
			// Should not show approved records
			expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
			expect(screen.queryByText("Mark Johnson")).not.toBeInTheDocument();
		});
	});

	test("filters records by type", async () => {
		render(<AdminHistoryPage />);

		// Wait for records to load
		await waitFor(() => {
			expect(screen.getByText("John Doe")).toBeInTheDocument();
		});

		// Select Inpatient type filter
		fireEvent.change(screen.getByLabelText("Filter by Type:"), {
			target: { value: "Inpatient" },
		});

		await waitFor(() => {
			// Should show inpatient records
			expect(screen.getByText("John Doe")).toBeInTheDocument();
			// Should not show other types
			expect(screen.queryByText("Jane Smith")).not.toBeInTheDocument();
			expect(screen.queryByText("Mark Johnson")).not.toBeInTheDocument();
		});

		// Select Admission type filter
		fireEvent.change(screen.getByLabelText("Filter by Type:"), {
			target: { value: "Admission" },
		});

		await waitFor(() => {
			// Should show admission records
			expect(screen.getByText("Mark Johnson")).toBeInTheDocument();
			// Should not show other types
			expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
			expect(screen.queryByText("Jane Smith")).not.toBeInTheDocument();
		});
	});

	test("searches records by name", async () => {
		render(<AdminHistoryPage />);

		// Wait for records to load
		await waitFor(() => {
			expect(screen.getByText("John Doe")).toBeInTheDocument();
		});

		// Search for "Jane"
		fireEvent.change(
			screen.getByPlaceholderText("Search by name or hospital"),
			{ target: { value: "Jane" } }
		);

		await waitFor(() => {
			// Should show Jane's record
			expect(screen.getByText("Jane Smith")).toBeInTheDocument();
			// Should not show other records
			expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
			expect(screen.queryByText("Mark Johnson")).not.toBeInTheDocument();
		});
	});

	test("searches records by hospital", async () => {
		render(<AdminHistoryPage />);

		// Wait for records to load
		await waitFor(() => {
			expect(
				screen.getByText("St. Luke's Medical Center")
			).toBeInTheDocument();
		});

		// Search for "UST"
		fireEvent.change(
			screen.getByPlaceholderText("Search by name or hospital"),
			{ target: { value: "UST" } }
		);

		await waitFor(() => {
			// Should show UST Hospital record
			expect(screen.getByText("UST Hospital")).toBeInTheDocument();
			expect(screen.getByText("Jane Smith")).toBeInTheDocument();
			// Should not show other records
			expect(
				screen.queryByText("St. Luke's Medical Center")
			).not.toBeInTheDocument();
			expect(
				screen.queryByText("Manila Doctors Hospital")
			).not.toBeInTheDocument();
		});
	});

	test("sorts records by date", async () => {
		render(<AdminHistoryPage />);

		// Wait for records to load
		await waitFor(() => {
			expect(screen.getByText("John Doe")).toBeInTheDocument();
		});

		// Click on Date header to sort
		fireEvent.click(screen.getByText("Date Processed"));

		// Check that sorting query was called
		expect(mockOrderBy).toHaveBeenCalledWith("dateProcessed", "desc");
	});

	test("displays no records message when filtered results are empty", async () => {
		// Setup a case where filter results in no records
		mockOnSnapshot.mockImplementationOnce((query, callback) => {
			callback({
				docs: [],
				size: 0,
			});
			return () => {};
		});

		render(<AdminHistoryPage />);

		// Wait for the no records message
		await waitFor(() => {
			expect(
				screen.getByText("No hospitalization records found")
			).toBeInTheDocument();
		});
	});

	test("loads more records when load more button is clicked", async () => {
		// Mock additional records that would be loaded
		const additionalRecords = [
			{
				id: "record4",
				userId: "user4",
				userName: "Alex Brown",
				hospitalName: "Cardinal Santos Medical Center",
				dateSubmitted: { toDate: () => new Date("2023-08-10") },
				dateProcessed: { toDate: () => new Date("2023-08-12") },
				status: "Approved",
				type: "Inpatient",
				amount: 12000,
				processedBy: "Admin User",
			},
		];

		// First render with initial records
		render(<AdminHistoryPage />);

		// Wait for initial records to load
		await waitFor(() => {
			expect(screen.getByText("John Doe")).toBeInTheDocument();
		});

		// Mock the next batch of records
		mockOnSnapshot.mockImplementationOnce((query, callback) => {
			callback({
				docs: additionalRecords.map((record) => ({
					id: record.id,
					data: () => record,
					exists: () => true,
				})),
				size: additionalRecords.length,
			});
			return () => {};
		});

		// Find and click the load more button
		const loadMoreButton = screen.getByText("Load More");
		fireEvent.click(loadMoreButton);

		// Wait for additional records to be loaded
		await waitFor(() => {
			expect(screen.getByText("Alex Brown")).toBeInTheDocument();
			expect(
				screen.getByText("Cardinal Santos Medical Center")
			).toBeInTheDocument();
		});
	});

	test("views record details when clicking on a record", async () => {
		render(<AdminHistoryPage />);

		// Wait for records to load
		await waitFor(() => {
			expect(screen.getByText("John Doe")).toBeInTheDocument();
		});

		// Click on the first record
		const recordRow = screen.getByText("John Doe").closest("tr");
		if (recordRow) {
			fireEvent.click(recordRow);
		}

		// Should navigate to the record details page
		expect(mockNavigate).toHaveBeenCalledWith(
			`/hospitalizationhistory/record1`
		);
	});

	test("refreshes data when refresh button is clicked", async () => {
		render(<AdminHistoryPage />);

		// Wait for initial data load
		await waitFor(() => {
			expect(screen.getByText("John Doe")).toBeInTheDocument();
		});

		// Reset mocks to track new calls
		mockCollection.mockClear();
		mockQuery.mockClear();
		mockOnSnapshot.mockClear();

		// Find and click refresh button
		const refreshButton = screen.getByLabelText("Refresh");
		fireEvent.click(refreshButton);

		// Verify that data fetching was triggered again
		expect(mockCollection).toHaveBeenCalledWith(
			"mockDb",
			"hospitalizations"
		);
		expect(mockQuery).toHaveBeenCalled();
		expect(mockOnSnapshot).toHaveBeenCalled();
	});

	test("exports data as CSV when export button is clicked", async () => {
		// Mock window.URL.createObjectURL and document.createElement
		const mockCreateObjectURL = vi.fn().mockReturnValue("mock-blob-url");
		const mockAppendChild = vi.fn();
		const mockRemoveChild = vi.fn();
		const mockClick = vi.fn();

		// Save original functions to restore after test
		const originalCreateObjectURL = window.URL.createObjectURL;
		const originalDocument = document;

		// Mock the functions
		window.URL.createObjectURL = mockCreateObjectURL;

		// Mock document.createElement to return a mock element
		Object.defineProperty(document, "createElement", {
			value: vi.fn().mockImplementation((tag) => {
				if (tag === "a") {
					return {
						setAttribute: vi.fn(),
						style: {},
						href: "",
						download: "",
						click: mockClick,
					};
				}
				return {};
			}),
		});

		// Mock document.body.appendChild and removeChild
		Object.defineProperty(document.body, "appendChild", {
			value: mockAppendChild,
		});
		Object.defineProperty(document.body, "removeChild", {
			value: mockRemoveChild,
		});

		render(<AdminHistoryPage />);

		// Wait for records to load
		await waitFor(() => {
			expect(screen.getByText("John Doe")).toBeInTheDocument();
		});

		// Find and click export button
		const exportButton = screen.getByLabelText("Export");
		fireEvent.click(exportButton);

		// Verify export functionality was called
		expect(mockCreateObjectURL).toHaveBeenCalled();
		expect(mockClick).toHaveBeenCalled();

		// Restore original functions
		window.URL.createObjectURL = originalCreateObjectURL;
		Object.defineProperty(document, "createElement", {
			value: originalDocument.createElement,
		});
	});
});
