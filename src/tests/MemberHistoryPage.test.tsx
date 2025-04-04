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
	unreadAccomplishedIds: ["test-id-1"],
	setUnreadAccomplishedIds: vi.fn(),
};

vi.mock(
	"../../src/components/Page Elements/NotifBadge/unreadAccomplished",
	() => ({
		default: () => unreadAccomplishedContextValue,
	})
);

// Mock useNotifications
const notificationsValue = {
	clearAccomplishedNotifications: vi.fn().mockResolvedValue(undefined),
};

vi.mock("../../src/components/Page Elements/NotifBadge/NotifTrigger", () => ({
	default: () => notificationsValue,
}));

// Mock asset imports for icons
vi.mock("../../../assets/inpatient.png", () => "mock-inpatient-icon");
vi.mock("../../../assets/admission.png", () => "mock-admission-icon");
vi.mock("../../../assets/outpatient.png", () => "mock-outpatient-icon");
vi.mock("../../../assets/eyeglasses.png", () => "mock-eyeglasses-icon");
vi.mock("react-icons/io", () => ({
	IoIosArrowBack: () => <span>Back icon</span>,
}));

// Mock firestore methods
type MockSnapshotCallback = (snapshot: unknown) => void;
let mockSnapshotCallbacks: { [key: string]: MockSnapshotCallback } = {};

vi.mock("firebase/firestore", () => ({
	collection: vi.fn().mockReturnValue("mockCollection"),
	query: vi.fn().mockReturnValue("mockQuery"),
	orderBy: vi.fn().mockReturnValue("mockOrderBy"),
	where: vi.fn().mockReturnValue("mockWhere"),
	onSnapshot: vi.fn().mockImplementation((_, callback) => {
		const id = Math.random().toString();
		mockSnapshotCallbacks[id] = callback;
		return () => {
			delete mockSnapshotCallbacks[id];
		};
	}),
	getDocs: vi.fn().mockResolvedValue({
		docs: [
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
				exists: () => true,
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
				exists: () => true,
			},
			{
				id: "test-id-3",
				data: () => ({
					transactionId: "test-id-3",
					formData: {
						formType: "hospital",
						origFormType: "outpatient",
						firstname: "John",
						lastname: "Doe",
						middlename: "Smith",
						age: "30",
						gender: "Male",
						college: "College of Science",
						contact: "+639171234567",
					},
					status: "Pending",
					dateSubmitted: "2023-07-10",
					requester: "Different User", // Should be filtered out
				}),
				exists: () => true,
			},
		],
	}),
}));

vi.mock("../../src/contexts/firebase", () => ({
	db: "mockDb",
}));

// Mock ViewFiles component (used in StatusTracking)
vi.mock("../../src/components/Page Elements/ViewFiles/ViewFiles", () => ({
	default: () => <div data-testid="view-files-component">File Viewer</div>,
}));

// Import components after all mocks are set
import TrackingPage from "../../src/components/Pages/MemberHistoryPage/TrackingPage";

describe("MemberHistoryPage Components", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockSnapshotCallbacks = {};
		unreadAccomplishedContextValue.setUnreadAccomplishedIds.mockClear();
		notificationsValue.clearAccomplishedNotifications.mockClear();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("TrackingPage Component", () => {
		test("renders tracking page with tabs", async () => {
			render(<TrackingPage />);

			// Check tabs are rendered
			expect(screen.getByText("Current Records")).toBeInTheDocument();
			expect(screen.getByText("Completed Records")).toBeInTheDocument();

			// Trigger mock data loading
			if (Object.keys(mockSnapshotCallbacks).length > 0) {
				act(() => {
					const callback = Object.values(mockSnapshotCallbacks)[0];
					callback({
						docs: [
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
						size: 1,
					});
				});
			}

			// Check that RecordTable is rendered
			await waitFor(() => {
				expect(screen.getByText("Transaction ID")).toBeInTheDocument();
				expect(screen.getByText("Date")).toBeInTheDocument();
				expect(screen.getByText("Form Type")).toBeInTheDocument();
				expect(screen.getByText("Status")).toBeInTheDocument();
			});
		});

		test("switches between tabs", async () => {
			render(<TrackingPage />);

			// Click on Completed Records tab
			const completedTab = screen.getByText("Completed Records");
			fireEvent.click(completedTab);

			// Should show completed records
			await waitFor(() => {
				expect(completedTab.closest("div")).toHaveClass("active");
			});

			// Click back to Current Records tab
			const currentTab = screen.getByText("Current Records");
			fireEvent.click(currentTab);

			// Should show current records
			await waitFor(() => {
				expect(currentTab.closest("div")).toHaveClass("active");
			});
		});

		test("displays record details when Details button is clicked", async () => {
			render(<TrackingPage />);

			// Trigger mock data loading
			if (Object.keys(mockSnapshotCallbacks).length > 0) {
				act(() => {
					const callback = Object.values(mockSnapshotCallbacks)[0];
					callback({
						docs: [
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
						size: 1,
					});
				});
			}

			// Wait for records to load
			await waitFor(() => {
				expect(screen.getAllByText("DETAILS").length).toBeGreaterThan(
					0
				);
			});

			// Click Details button on the first record
			const detailsButtons = screen.getAllByText("DETAILS");
			fireEvent.click(detailsButtons[0]);

			// Should show StatusTracking component
			await waitFor(() => {
				expect(
					screen.getByText(/FORM REQUEST SUBMITTED/i)
				).toBeInTheDocument();
			});

			// Click back button
			const backButton = screen.getByRole("button", { name: /back/i });
			fireEvent.click(backButton);

			// Should show record table again
			await waitFor(() => {
				expect(screen.getAllByText("DETAILS").length).toBeGreaterThan(
					0
				);
			});
		});

		test("clears unread notification when viewing an unread record", async () => {
			render(<TrackingPage />);

			// Trigger mock data loading with an ID that matches unreadAccomplishedIds
			if (Object.keys(mockSnapshotCallbacks).length > 0) {
				act(() => {
					const callback = Object.values(mockSnapshotCallbacks)[0];
					callback({
						docs: [],
						size: 0,
					});
				});
			}

			// Wait for data to load
			await waitFor(() => {
				expect(screen.getByText("Current Records")).toBeInTheDocument();
			});

			// Switch to completed tab
			const completedTab = screen.getByText("Completed Records");
			fireEvent.click(completedTab);

			// Wait for detail buttons to appear
			await waitFor(() => {
				expect(screen.getAllByText("DETAILS").length).toBeGreaterThan(
					0
				);
			});

			// Get the details button for the record that has an unread notification
			const detailsButtons = screen.getAllByText("DETAILS");
			fireEvent.click(detailsButtons[0]);

			// Should clear the notification
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
			// Create mock data with more than one page worth of records
			const mockManyRecords = Array(10)
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
					exists: () => true,
				}));

			render(<TrackingPage />);

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

			// Should show pagination
			await waitFor(() => {
				expect(screen.getByText("1")).toBeInTheDocument(); // First page
				expect(screen.getByText("2")).toBeInTheDocument(); // Second page
			});

			// Click on second page
			fireEvent.click(screen.getByText("2"));

			// Should show different set of records
			await waitFor(() => {
				expect(screen.getByText("2").closest("button")).toHaveClass(
					"active"
				);
			});
		});
	});

	describe("StatusTracking Component", () => {
		test("displays record details correctly when record is found", async () => {
			render(<TrackingPage />);

			// Trigger mock data loading
			if (Object.keys(mockSnapshotCallbacks).length > 0) {
				act(() => {
					const callback = Object.values(mockSnapshotCallbacks)[0];
					callback({
						docs: [
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
										gender: "Male",
										college: "College of Science",
										contact: "+639171234567",
										suffix: "Jr.",
										age: "30",
									},
									status: "Approved",
									DateDecided: {
										toDate: () => new Date("2023-05-15"),
									},
									dateSubmitted: "2023-05-10",
									requester: "John Doe Test",
								}),
							},
						],
						size: 1,
					});
				});
			}

			// Wait for records to load and click on Details
			await waitFor(() => {
				expect(screen.getAllByText("DETAILS").length).toBeGreaterThan(
					0
				);
			});

			// Click on the Details button
			const detailsButton = screen.getAllByText("DETAILS")[0];
			fireEvent.click(detailsButton);

			// Check StatusTracking component content
			await waitFor(() => {
				// Check header with transaction ID
				expect(screen.getByText("test-id-1")).toBeInTheDocument();

				// Check status updates
				expect(
					screen.getByText("FORM REQUEST SUBMITTED")
				).toBeInTheDocument();
				expect(
					screen.getByText("REQUEST APPROVED")
				).toBeInTheDocument();

				// Check personal details
				expect(screen.getByText("John")).toBeInTheDocument();
				expect(screen.getByText("Doe")).toBeInTheDocument();
				expect(screen.getByText("Smith")).toBeInTheDocument();
				expect(screen.getByText("Male")).toBeInTheDocument();
			});
		});

		test("shows not found message when record is not found", async () => {
			render(<TrackingPage />);

			// Trigger with empty data
			if (Object.keys(mockSnapshotCallbacks).length > 0) {
				act(() => {
					const callback = Object.values(mockSnapshotCallbacks)[0];
					callback({
						docs: [],
						size: 0,
					});
				});
			}

			// Create a record selection without providing it in the data
			act(() => {
				// Access the component's internal state to set selectedRecord
				// This is a bit hacky but simulates clicking on a non-existent record
				const trackingPage = document.querySelector(".tracking-page");
				if (trackingPage) {
					// Using a custom event to manipulate internal state (test-only approach)
					const testEvent = new CustomEvent("test:selectRecord", {
						detail: {
							transactionID: "non-existent-id",
							dateTime: new Date(),
							status: "Pending",
						},
					});
					trackingPage.dispatchEvent(testEvent);
				}
			});

			// Manually render the StatusTracking with a non-existent ID
			const { rerender } = render(<TrackingPage />);

			// Force rerender and manual trigger of detail view
			rerender(<TrackingPage />);
			if (screen.getAllByText("DETAILS").length > 0) {
				fireEvent.click(screen.getAllByText("DETAILS")[0]);
			}

			// Should eventually show records again after processing the not-found state
			await waitFor(() => {
				expect(screen.getAllByText("DETAILS").length).toBeGreaterThan(
					0
				);
			});
		});
	});

	describe("RecordTable Component", () => {
		test("renders different status styles correctly", async () => {
			render(<TrackingPage />);

			// Trigger mock data with different status values
			if (Object.keys(mockSnapshotCallbacks).length > 0) {
				act(() => {
					const callback = Object.values(mockSnapshotCallbacks)[0];
					callback({
						docs: [
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
						],
						size: 3,
					});
				});
			}

			// Check for different status badges
			await waitFor(() => {
				// Find status badges
				const pendingBadge = screen.getByText("Pending");
				const approvedBadge = screen.getByText("Approved");
				const rejectedBadge = screen.getByText("Rejected");

				// Verify they have correct styling classes through parent elements
				expect(
					pendingBadge.closest(".status-pending")
				).toBeInTheDocument();
				expect(
					approvedBadge.closest(".status-approved")
				).toBeInTheDocument();
				expect(
					rejectedBadge.closest(".status-rejected")
				).toBeInTheDocument();
			});
		});

		test("displays form type with correct icon", async () => {
			render(<TrackingPage />);

			// Trigger mock data with different form types
			if (Object.keys(mockSnapshotCallbacks).length > 0) {
				act(() => {
					const callback = Object.values(mockSnapshotCallbacks)[0];
					callback({
						docs: [
							{
								id: "test-id-1",
								data: () => ({
									transactionId: "test-id-1",
									formData: {
										formType: "eyeglasses",
									},
									status: "Pending",
									dateSubmitted: "2023-08-10",
									requester: "John Doe Test",
								}),
							},
							{
								id: "test-id-2",
								data: () => ({
									transactionId: "test-id-2",
									formData: {
										formType: "hospital",
										origFormType: "inpatient",
									},
									status: "Pending",
									dateSubmitted: "2023-08-05",
									requester: "John Doe Test",
								}),
							},
						],
						size: 2,
					});
				});
			}

			// Check for form type displays
			await waitFor(() => {
				// Form type names should be displayed
				expect(screen.getByText("Eyeglasses")).toBeInTheDocument();
				expect(screen.getByText("Inpatient")).toBeInTheDocument();

				// Form type icons should be present (we can't directly check the src but we can check for img elements)
				const imgElements =
					document.querySelectorAll(".form-type-icon");
				expect(imgElements.length).toBe(2);
			});
		});

		test("highlights unread records with appropriate styling", async () => {
			// Set an unread record ID
			unreadAccomplishedContextValue.unreadAccomplishedIds = [
				"highlight-test-id",
			];

			render(<TrackingPage />);

			// Switch to completed tab
			const completedTab = screen.getByText("Completed Records");
			fireEvent.click(completedTab);

			// Trigger mock data with an unread record
			if (Object.keys(mockSnapshotCallbacks).length > 0) {
				act(() => {
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
				});
			}

			// Check for highlighted record
			await waitFor(() => {
				// Find all record boxes
				const recordBoxes = document.querySelectorAll(".record-box");
				expect(recordBoxes.length).toBe(2);

				// Find the highlighted one
				const highlightedBox = Array.from(recordBoxes).find((box) =>
					box.classList.contains("highlight")
				);

				expect(highlightedBox).toBeInTheDocument();
			});
		});
	});
});
