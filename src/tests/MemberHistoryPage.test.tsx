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
import { MemoryRouter } from "react-router-dom";

// Import actual CSS modules
import tabStyles from "../../src/components/Pages/MemberHistoryPage/Tabs.module.css";
import trackingStyles from "../../src/components/Pages/MemberHistoryPage/TrackingPage.module.css";
import recordStyles from "../../src/components/Pages/MemberHistoryPage/RecordTable.module.css";

// Mock data for tests
const mockRecords = {
	pending: [
		{
			id: "test-id-3",
			data: () => ({
				transactionId: "test-id-3",
				formData: {
					formType: "admission",
					firstname: "John",
					lastname: "Doe",
					middlename: "Smith",
				},
				status: "Pending",
				dateSubmitted: "2023-08-10",
				requester: "John Doe Test",
			}),
		},
	],
	accomplished: [
		{
			id: "test-id-1",
			data: () => ({
				transactionId: "test-id-1",
				formData: {
					formType: "hospital",
					origFormType: "inpatient",
					firstname: "John",
					lastname: "Doe",
					middlename: "Smith",
					age: "30",
					gender: "Male",
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
				},
				status: "Approved",
				DateDecided: {
					toDate: () => new Date("2023-05-15"),
				},
				dateSubmitted: "2023-05-10",
				requester: "John Doe Test",
			}),
		},
		{
			id: "test-id-2",
			data: () => ({
				transactionId: "test-id-2",
				formData: {
					formType: "eyeglasses",
					firstname: "John",
					lastname: "Doe",
					middlename: "Smith",
					age: "30",
					gender: "Male",
					college: "College of Science",
					contact: "+639171234567",
					ORNumber: "12345",
					issuedBy: "Vision Center",
					amountPaid: "2000",
				},
				status: "Rejected",
				DateDecided: {
					toDate: () => new Date("2023-06-20"),
				},
				dateSubmitted: "2023-06-15",
				requester: "John Doe Test",
			}),
		},
	],
	revisions: [
		{
			id: "test-id-4",
			data: () => ({
				transactionId: "test-id-4",
				formData: {
					formType: "hospital",
					origFormType: "outpatient",
					firstname: "John",
					lastname: "Doe",
					middlename: "Smith",
					age: "30",
					gender: "Male",
				},
				status: "For Revision",
				DateDecided: {
					toDate: () => new Date("2023-07-10"),
				},
				dateSubmitted: "2023-07-05",
				requester: "John Doe Test",
			}),
		},
	],
	filtered: [
		{
			id: "test-id-5",
			data: () => ({
				transactionId: "test-id-5",
				formData: { formType: "admission" },
				status: "Pending",
				dateSubmitted: "2023-08-10",
				requester: "Different User", // Should be filtered out
			}),
		},
	],
};

// Mock Firebase and Context values first
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
	fullName: "John Doe Test", // Important for filtering records
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

// Mock unreadAccomplished hook
const unreadAccomplishedContextValue = {
	unreadAccomplishedIds: ["test-id-1", "highlight-test-id"],
	setUnreadAccomplishedIds: vi.fn(),
};

vi.mock(
	"../../src/components/Page Elements/NotifBadge/unreadAccomplished",
	() => ({
		default: () => unreadAccomplishedContextValue,
	})
);

// Mock useNotifications with a more structured approach
const notificationsValue = {
	clearAccomplishedNotifications: vi.fn().mockResolvedValue(undefined),
};

vi.mock("../../src/components/Page Elements/NotifBadge/NotifTrigger", () => ({
	useNotifications: () => notificationsValue,
	default: () => notificationsValue,
}));

// Mock react-router-dom hooks
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
	const actual = await vi.importActual("react-router-dom");
	return {
		...actual,
		useNavigate: () => mockNavigate,
	};
});

// Mock asset imports for icons
vi.mock("../../../assets/inpatient.png", () => "mock-inpatient-icon");
vi.mock("../../../assets/admission.png", () => "mock-admission-icon");
vi.mock("../../../assets/outpatient.png", () => "mock-outpatient-icon");
vi.mock("../../../assets/eyeglasses.png", () => "mock-eyeglasses-icon");
vi.mock("react-icons/io", () => ({
	IoIosArrowBack: () => <div data-testid="back-icon">Back icon</div>,
}));

// Create a more structured approach to Firestore mocking
const mockFirestore = {
	collection: vi.fn().mockReturnValue("mockCollection"),
	query: vi.fn().mockReturnValue("mockQuery"),
	orderBy: vi.fn().mockReturnValue("mockOrderBy"),
	where: vi.fn().mockReturnValue("mockWhere"),
	onSnapshot: vi.fn(),
	getDocs: vi.fn(),
	DocumentData: vi.fn(),
};

// Setup snapshot listeners
let mockSnapshotCallbacks: { [key: string]: (snapshot: any) => void } = {};

// Mock firestore methods
vi.mock("firebase/firestore", () => ({
	collection: (...args: any[]) => mockFirestore.collection(...args),
	query: (...args: any[]) => mockFirestore.query(...args),
	orderBy: (...args: any[]) => mockFirestore.orderBy(...args),
	where: (...args: any[]) => mockFirestore.where(...args),
	onSnapshot: (...args: any[]) => {
		const callback = args[1];
		const id = Math.random().toString();
		mockSnapshotCallbacks[id] = callback;
		return () => {
			delete mockSnapshotCallbacks[id];
		};
	},
	getDocs: vi.fn(),
	DocumentData: vi.fn(),
}));

vi.mock("../../src/contexts/firebase", () => ({
	db: "mockDb",
}));

// Mock ViewFiles component (used in StatusTracking)
vi.mock("../../src/components/Page Elements/ViewFiles/ViewFiles", () => ({
	default: ({ onClose }: { onClose: () => void }) => (
		<div data-testid="view-files-component">
			File Viewer
			<button onClick={onClose} data-testid="close-viewer">
				Close
			</button>
		</div>
	),
}));

// Import components after all mocks are set
import TrackingPage from "../../src/components/Pages/MemberHistoryPage/TrackingPage";

// Create a custom render function that wraps with Router
const renderWithRouter = (component: React.ReactNode) => {
	return render(<MemoryRouter>{component}</MemoryRouter>);
};

describe("MemberHistoryPage Components", () => {
	// Setup before each test
	beforeEach(() => {
		vi.clearAllMocks();
		mockSnapshotCallbacks = {};
		mockNavigate.mockClear();

		// Reset mock implementations
		unreadAccomplishedContextValue.setUnreadAccomplishedIds.mockClear();
		notificationsValue.clearAccomplishedNotifications.mockClear();

		// Create mock data for many records to test pagination
		const mockManyRecords = Array(15)
			.fill(null)
			.map((_, i) => ({
				id: `test-id-${i}`,
				data: () => ({
					transactionId: `test-id-${i}`,
					formData: {
						formType: "hospital",
						firstname: "John",
						lastname: "Doe",
					},
					status: "Pending",
					dateSubmitted: `2023-08-${i + 1}`,
					requester: "John Doe Test",
				}),
			}));

		// Setup mock implementations for getDocs for different collections
		vi.mocked(mockFirestore.getDocs).mockImplementation((query) => {
			const queryStr = JSON.stringify(query);

			if (queryStr.includes("AccomplishedRequests")) {
				return Promise.resolve({
					docs: mockRecords.accomplished,
					size: mockRecords.accomplished.length,
				});
			} else if (queryStr.includes("RevisionsRequests")) {
				return Promise.resolve({
					docs: mockRecords.revisions,
					size: mockRecords.revisions.length,
				});
			} else if (queryStr.includes("FormRequests")) {
				return Promise.resolve({
					docs: mockManyRecords,
					size: mockManyRecords.length,
				});
			}

			// Default response if no match
			return Promise.resolve({
				docs: [],
				size: 0,
			});
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("TrackingPage Component", () => {
		test("renders tracking page with tabs", async () => {
			renderWithRouter(<TrackingPage />);

			// Check tabs are rendered
			expect(screen.getByText("Current Records")).toBeInTheDocument();
			expect(screen.getByText("Completed Records")).toBeInTheDocument();
			expect(screen.getByText("For Revision")).toBeInTheDocument();

			// Trigger mock data loading for pending records
			if (Object.keys(mockSnapshotCallbacks).length > 0) {
				act(() => {
					const callback = Object.values(mockSnapshotCallbacks)[0];
					callback({
						docs: mockRecords.pending,
						size: mockRecords.pending.length,
					});
				});
			}

			// Check table column headers
			await waitFor(() => {
				// Look for column headers using partial text matching
				const dateHeader = screen.getByText(/Date/i);
				expect(dateHeader).toBeInTheDocument();

				const idHeader = screen.getByText(/Transaction ID/i);
				expect(idHeader).toBeInTheDocument();

				const typeHeader = screen.getByText(/Form Type/i);
				expect(typeHeader).toBeInTheDocument();

				const statusHeader = screen.getByText(/Status/i);
				expect(statusHeader).toBeInTheDocument();
			});
		});

		test("switches between tabs", async () => {
			renderWithRouter(<TrackingPage />);

			// Trigger pending records data load
			if (Object.keys(mockSnapshotCallbacks).length > 0) {
				act(() => {
					const callback = Object.values(mockSnapshotCallbacks)[0];
					callback({
						docs: mockRecords.pending,
						size: mockRecords.pending.length,
					});
				});
			}

			// Get tab elements
			const completedTab = screen.getByText("Completed Records");
			const currentTab = screen.getByText("Current Records");
			const revisionTab = screen.getByText("For Revision");

			// Click completed tab
			fireEvent.click(completedTab);

			// Check if tab is active
			await waitFor(() => {
				// Look for tab container and check if it has activeClass
				const tabContainer = completedTab.closest(
					`.${tabStyles["tab-title"]}`
				);
				expect(tabContainer?.className).toContain(tabStyles.active);
			});

			// Click current records tab
			fireEvent.click(currentTab);

			// Check if tab is active
			await waitFor(() => {
				const tabContainer = currentTab.closest(
					`.${tabStyles["tab-title"]}`
				);
				expect(tabContainer?.className).toContain(tabStyles.active);
			});

			// Click revision tab
			fireEvent.click(revisionTab);

			// Check if tab is active
			await waitFor(() => {
				const tabContainer = revisionTab.closest(
					`.${tabStyles["tab-title"]}`
				);
				expect(tabContainer?.className).toContain(tabStyles.active);
			});
		});

		test("displays record details when Details button is clicked", async () => {
			renderWithRouter(<TrackingPage />);

			// Trigger pending records data load
			if (Object.keys(mockSnapshotCallbacks).length > 0) {
				act(() => {
					const callback = Object.values(mockSnapshotCallbacks)[0];
					callback({
						docs: mockRecords.pending,
						size: mockRecords.pending.length,
					});
				});
			}

			// Wait for buttons to load and click details
			await waitFor(() => {
				// Find all buttons that have "DETAILS" text
				const detailsButtons = Array.from(
					document.querySelectorAll(
						`.${recordStyles["details-button"]}`
					)
				).filter((el) => el.textContent?.includes("DETAILS"));
				expect(detailsButtons.length).toBeGreaterThan(0);

				// Click the first details button
				fireEvent.click(detailsButtons[0]);
			});

			// Check if status tracking is displayed
			await waitFor(() => {
				// Look for status tracking container
				const statusContainer = document.querySelector(
					`.${trackingStyles.statusTrackingContainer}`
				);
				expect(statusContainer).not.toBeNull();

				// Look for back button
				const backButton = document.querySelector(
					`.${trackingStyles.backButton}`
				);
				expect(backButton).not.toBeNull();

				// Look for form request submitted status
				const statusItems = document.querySelectorAll(
					`.${trackingStyles.statusItem}`
				);
				expect(statusItems.length).toBeGreaterThan(0);

				// Check for FORM REQUEST SUBMITTED text in one of the items
				const hasFormRequestSubmitted = Array.from(statusItems).some(
					(el) => el.textContent?.includes("FORM REQUEST SUBMITTED")
				);
				expect(hasFormRequestSubmitted).toBe(true);
			});

			// Click back button
			const backButton = document.querySelector(
				`.${trackingStyles.backButton}`
			);
			fireEvent.click(backButton as HTMLElement);

			// Should show record table again
			await waitFor(() => {
				const detailsButtons = document.querySelectorAll(
					`.${recordStyles["details-button"]}`
				);
				expect(detailsButtons.length).toBeGreaterThan(0);
			});
		});

		test("clears unread notification when viewing an unread record", async () => {
			renderWithRouter(<TrackingPage />);

			// Switch to completed tab
			const completedTab = screen.getByText("Completed Records");
			fireEvent.click(completedTab);

			// Force data load manually for completed records
			act(() => {
				if (Object.keys(mockSnapshotCallbacks).length > 0) {
					const callback = Object.values(mockSnapshotCallbacks)[0];
					// Include the unread record in the data
					callback({
						docs: [
							{
								id: "test-id-1", // This matches our unreadAccomplishedIds
								data: () => ({
									transactionId: "test-id-1",
									formData: {
										formType: "hospital",
									},
									status: "Approved",
									DateDecided: { toDate: () => new Date() },
									dateSubmitted: "2023-05-10",
									requester: "John Doe Test",
								}),
							},
						],
						size: 1,
					});
				}
			});

			// Wait for table to load with details buttons
			await waitFor(() => {
				// Look for details buttons in record box
				const recordBoxes = document.querySelectorAll(
					`.${recordStyles["record-box"]}`
				);
				expect(recordBoxes.length).toBeGreaterThan(0);

				const detailsButton = document.querySelector(
					`.${recordStyles["details-button"]}`
				);
				expect(detailsButton).not.toBeNull();
			});

			// Click the details button for the unread record
			const detailsButton = document.querySelector(
				`.${recordStyles["details-button"]}`
			);
			fireEvent.click(detailsButton as HTMLElement);

			// Check if notification was cleared
			await waitFor(() => {
				expect(
					notificationsValue.clearAccomplishedNotifications
				).toHaveBeenCalledWith("test-id-1");
				expect(
					unreadAccomplishedContextValue.setUnreadAccomplishedIds
				).toHaveBeenCalled();
			});
		});

		test("shows pagination when there are multiple pages of records", async () => {
			renderWithRouter(<TrackingPage />);

			// Create mock data with more than one page worth of records
			const mockManyRecords = Array(15)
				.fill(null)
				.map((_, i) => ({
					id: `test-id-${i}`,
					data: () => ({
						transactionId: `test-id-${i}`,
						formData: {
							formType: "hospital",
							firstname: "John",
							lastname: "Doe",
						},
						status: "Pending",
						dateSubmitted: `2023-08-${i + 1}`,
						requester: "John Doe Test",
					}),
				}));

			// Trigger mock data loading with multiple records
			if (Object.keys(mockSnapshotCallbacks).length > 0) {
				act(() => {
					const callback = Object.values(mockSnapshotCallbacks)[0];
					callback({
						docs: mockManyRecords,
						size: mockManyRecords.length,
					});
				});
			}

			// Wait for pagination container to render
			await waitFor(() => {
				// Find the pagination container
				const paginationContainer = document.querySelector(
					".page-buttons-container"
				);
				expect(paginationContainer).not.toBeNull();

				// Look for page buttons
				const pageButtons =
					paginationContainer?.querySelectorAll("button");
				expect(pageButtons?.length).toBeGreaterThan(1);

				// First button should have text "1"
				const firstButton = Array.from(pageButtons || []).find(
					(btn) => btn.textContent === "1"
				);
				expect(firstButton).toBeTruthy();

				// Second button should have text "2"
				const secondButton = Array.from(pageButtons || []).find(
					(btn) => btn.textContent === "2"
				);
				expect(secondButton).toBeTruthy();

				// Click on second page button
				if (secondButton) {
					fireEvent.click(secondButton);
				}
			});

			// Second page button should be active after click
			await waitFor(() => {
				const pageButtons = document.querySelectorAll(
					".page-buttons-container button"
				);
				const secondButton = Array.from(pageButtons).find(
					(btn) => btn.textContent === "2"
				);
				expect(secondButton?.className).toContain("active");
			});
		});
	});

	describe("StatusTracking Component", () => {
		test("displays record details correctly when record is found", async () => {
			renderWithRouter(<TrackingPage />);

			// Load mock data with a detailed record
			act(() => {
				if (Object.keys(mockSnapshotCallbacks).length > 0) {
					const callback = Object.values(mockSnapshotCallbacks)[0];
					callback({
						docs: [mockRecords.accomplished[0]], // Record with complete data
						size: 1,
					});
				}
			});

			// Wait for record to load and click details
			await waitFor(() => {
				const detailsButtons = document.querySelectorAll(
					`.${recordStyles["details-button"]}`
				);
				expect(detailsButtons.length).toBe(1);

				// Click the details button
				fireEvent.click(detailsButtons[0]);
			});

			// Check record details display
			await waitFor(() => {
				// Transaction header should contain the ID
				const transactionHeader = document.querySelector(
					`.${trackingStyles.transactionId}`
				);
				expect(transactionHeader).not.toBeNull();
				expect(transactionHeader?.textContent).toContain("test-id-1");

				// Check form data fields are shown
				const fieldContents = document.querySelectorAll(
					`.${trackingStyles.fieldContent}`
				);
				expect(fieldContents.length).toBeGreaterThan(0);

				// Verify specific field contents (match actual record data)
				const fields = Array.from(fieldContents);
				expect(
					fields.some((el) => el.textContent === "John")
				).toBeTruthy();
				expect(
					fields.some((el) => el.textContent === "Doe")
				).toBeTruthy();
				expect(
					fields.some((el) => el.textContent === "Male")
				).toBeTruthy();
			});
		});

		test("renders different status styles correctly", async () => {
			renderWithRouter(<TrackingPage />);

			// Create mockRecords with different status types
			const mixedStatusRecords = [
				{
					id: "pending-id",
					data: () => ({
						transactionId: "pending-id",
						formData: { formType: "admission" },
						status: "Pending",
						dateSubmitted: "2023-08-10",
						requester: "John Doe Test",
					}),
				},
				{
					id: "approved-id",
					data: () => ({
						transactionId: "approved-id",
						formData: { formType: "hospital" },
						status: "Approved",
						DateDecided: { toDate: () => new Date() },
						dateSubmitted: "2023-08-05",
						requester: "John Doe Test",
					}),
				},
				{
					id: "rejected-id",
					data: () => ({
						transactionId: "rejected-id",
						formData: { formType: "eyeglasses" },
						status: "Rejected",
						DateDecided: { toDate: () => new Date() },
						dateSubmitted: "2023-08-01",
						requester: "John Doe Test",
					}),
				},
			];

			// Load mixed status records
			act(() => {
				if (Object.keys(mockSnapshotCallbacks).length > 0) {
					const callback = Object.values(mockSnapshotCallbacks)[0];
					callback({
						docs: mixedStatusRecords,
						size: mixedStatusRecords.length,
					});
				}
			});

			// Check for status badges in the RecordTable
			await waitFor(() => {
				// Find status badges in record boxes
				const statusBadges = document.querySelectorAll(
					`.${recordStyles["status-badge"]}`
				);
				expect(statusBadges.length).toBe(3);

				// Check if each status is displayed and has correct styling
				const pendingBadge = Array.from(statusBadges).find(
					(badge) => badge.textContent === "Pending"
				);
				const approvedBadge = Array.from(statusBadges).find(
					(badge) => badge.textContent === "Approved"
				);
				const rejectedBadge = Array.from(statusBadges).find(
					(badge) => badge.textContent === "Rejected"
				);

				expect(pendingBadge).not.toBeNull();
				expect(approvedBadge).not.toBeNull();
				expect(rejectedBadge).not.toBeNull();

				// Check class names
				expect(pendingBadge?.className).toContain(
					recordStyles["status-pending"]
				);
				expect(approvedBadge?.className).toContain(
					recordStyles["status-approved"]
				);
				expect(rejectedBadge?.className).toContain(
					recordStyles["status-rejected"]
				);
			});
		});

		test("displays form type with correct icon", async () => {
			renderWithRouter(<TrackingPage />);

			// Create records with different form types
			const formTypeRecords = [
				{
					id: "eyeglasses-id",
					data: () => ({
						transactionId: "eyeglasses-id",
						formData: { formType: "eyeglasses" },
						status: "Pending",
						dateSubmitted: "2023-08-10",
						requester: "John Doe Test",
					}),
				},
				{
					id: "hospital-id",
					data: () => ({
						transactionId: "hospital-id",
						formData: {
							formType: "hospital",
							origFormType: "inpatient",
						},
						status: "Pending",
						dateSubmitted: "2023-08-05",
						requester: "John Doe Test",
					}),
				},
			];

			// Load form type records
			act(() => {
				if (Object.keys(mockSnapshotCallbacks).length > 0) {
					const callback = Object.values(mockSnapshotCallbacks)[0];
					callback({
						docs: formTypeRecords,
						size: formTypeRecords.length,
					});
				}
			});

			// Check for form type icons
			await waitFor(() => {
				// Find all form type icon containers
				const formTypeContainers = document.querySelectorAll(
					`.${recordStyles["record-typeOfForm-value-container"]}`
				);
				expect(formTypeContainers.length).toBe(2);

				// Check if icons are displayed
				const iconImages = document.querySelectorAll(
					`.${recordStyles["form-type-icon"]}`
				);
				expect(iconImages.length).toBe(2);

				// Check form type labels
				const formTypeValues = document.querySelectorAll(
					`.${recordStyles["record-typeOfForm-value"]}`
				);

				const formTypeTexts = Array.from(formTypeValues).map(
					(el) => el.textContent
				);
				expect(formTypeTexts).toContain("Eyeglasses");
				expect(formTypeTexts).toContain("Inpatient");
			});
		});

		test("highlights unread records with appropriate styling", async () => {
			// Setup unread record IDs
			unreadAccomplishedContextValue.unreadAccomplishedIds = [
				"highlight-test-id",
			];

			renderWithRouter(<TrackingPage />);

			// Switch to completed tab
			const completedTab = screen.getByText("Completed Records");
			fireEvent.click(completedTab);

			// Load records with one highlighted
			act(() => {
				if (Object.keys(mockSnapshotCallbacks).length > 0) {
					const callback = Object.values(mockSnapshotCallbacks)[0];
					callback({
						docs: [
							{
								id: "highlight-test-id",
								data: () => ({
									transactionId: "highlight-test-id",
									formData: { formType: "admission" },
									status: "Approved",
									DateDecided: { toDate: () => new Date() },
									dateSubmitted: "2023-08-10",
									requester: "John Doe Test",
								}),
							},
							{
								id: "regular-test-id",
								data: () => ({
									transactionId: "regular-test-id",
									formData: { formType: "hospital" },
									status: "Approved",
									DateDecided: { toDate: () => new Date() },
									dateSubmitted: "2023-08-05",
									requester: "John Doe Test",
								}),
							},
						],
						size: 2,
					});
				}
			});

			// Check for highlighted record
			await waitFor(() => {
				// Find all record boxes
				const recordBoxes = document.querySelectorAll(
					`.${recordStyles["record-box"]}`
				);
				expect(recordBoxes.length).toBe(2);

				// Check if any has highlight class
				const highlightedBox = Array.from(recordBoxes).find((box) =>
					box.className.includes(recordStyles.highlight)
				);

				expect(highlightedBox).not.toBeNull();

				// The one with transaction ID "highlight-test-id" should be highlighted
				const transactionIdElement = highlightedBox?.querySelector(
					`.${recordStyles["record-transactionID-value"]}`
				);
				expect(transactionIdElement?.textContent).toBe(
					"highlight-test-id"
				);
			});
		});
	});
});
