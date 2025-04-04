import type { ReactNode } from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import { describe, test, expect, beforeEach, vi, afterEach } from "vitest";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";

// Mock Firebase functions
const mockOnSnapshot = vi.fn();
const mockCollection = vi.fn().mockReturnValue("mockCollection");
const mockQuery = vi.fn().mockReturnValue("mockQuery");
const mockWhere = vi.fn().mockReturnValue("mockWhere");
const mockDoc = vi.fn().mockReturnValue("mockDocRef");
const mockSetDoc = vi.fn().mockResolvedValue(undefined);
const mockOnAuthStateChanged = vi.fn();

// Define types for better type safety
type DocRef = string;
type DocData = Record<string, unknown>;
type SetDocOptions = { merge?: boolean };
type SnapshotListener = (snapshot: any) => void;

// Mock firebase/firestore
vi.mock("firebase/firestore", () => ({
	collection: (...args: unknown[]) => mockCollection(...args),
	query: (...args: unknown[]) => mockQuery(...args),
	where: (...args: unknown[]) => mockWhere(...args),
	onSnapshot: (query: unknown, callback: SnapshotListener) => {
		mockOnSnapshot(query, callback);
		return vi.fn(); // Return a cleanup function
	},
	doc: (db: unknown, collection: string, ...pathSegments: string[]) =>
		mockDoc(db, collection, ...pathSegments),
	setDoc: (ref: DocRef, data: DocData, options?: SetDocOptions) =>
		mockSetDoc(ref, data, options),
	Timestamp: {
		now: () => ({ toDate: () => new Date() }),
	},
}));

// Mock firebase/auth
vi.mock("firebase/auth", () => ({
	onAuthStateChanged: (...args: unknown[]) => {
		mockOnAuthStateChanged(...args);
		return vi.fn(); // Return an unsubscribe function
	},
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

// Mock Firebase context
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
	currentUser: { uid: "test-user-123" },
};

vi.mock("../../src/contexts/firebaseContext", () => ({
	useFirebase: () => firebaseContextValue,
	FirebaseProvider: ({ children }: { children: ReactNode }) => children,
}));

vi.mock("../../src/contexts/firebase", () => ({
	auth: { currentUser: { email: "test@test.com", displayName: "Test User" } },
	db: "mockDb",
}));

// Mock child components
vi.mock("../../src/components/Pages/AdminSettingsPage/UserRow", () => ({
	default: ({
		user,
		onSave,
	}: {
		user: any;
		onSave: (user: any, option: "college" | "role" | "status") => void;
	}) => (
		<tr data-testid={`user-row-${user.id}`}>
			<td>{user.id}</td>
			<td>{user.name}</td>
			<td>{user.email}</td>
			<td>{user.college}</td>
			<td>{user.birthdate}</td>
			<td>{user.phoneNumber}</td>
			<td>{user.role}</td>
			<td>{user.status}</td>
			<td>
				<button
					onClick={() => onSave(user, "college")}
					data-testid={`edit-college-${user.id}`}
				>
					Edit College
				</button>
				<button
					onClick={() => onSave(user, "role")}
					data-testid={`edit-role-${user.id}`}
				>
					Edit Role
				</button>
				<button
					onClick={() => onSave(user, "status")}
					data-testid={`edit-status-${user.id}`}
				>
					Edit Status
				</button>
			</td>
		</tr>
	),
}));

vi.mock(
	"../../src/components/Pages/AdminSettingsPage/VerificationPage",
	() => ({
		default: () => (
			<div data-testid="verification-page">Verification Page</div>
		),
	})
);

vi.mock("../../src/components/Pages/AdminSettingsPage/UserAuditLogs", () => ({
	default: () => <div data-testid="user-audit-logs">User Audit Logs</div>,
}));

vi.mock("../../src/components/Pages/AdminSettingsPage/AuditLogsPopout", () => ({
	default: ({ onClose }: { onClose: () => void }) => (
		<div data-testid="audit-logs-popout">
			Audit Logs Popout
			<button onClick={onClose} data-testid="close-audit-logs">
				Close
			</button>
		</div>
	),
}));

vi.mock("../../src/components/Page Elements/PageButtons/PageButtons", () => ({
	default: ({
		currentPage,
		totalPages,
		onPageChange,
	}: {
		currentPage: number;
		totalPages: number;
		onPageChange: (page: number) => void;
	}) => (
		<div data-testid="page-buttons">
			<span>
				Page {currentPage} of {totalPages}
			</span>
			<button
				onClick={() => onPageChange(currentPage - 1)}
				data-testid="prev-page"
			>
				Previous
			</button>
			<button
				onClick={() => onPageChange(currentPage + 1)}
				data-testid="next-page"
			>
				Next
			</button>
		</div>
	),
}));

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
			<div data-testid="save-popout">
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

// Import component after all mocks are set up
import AdminSettings from "../../src/components/Pages/AdminSettingsPage/AdminSettings";

// Mock data
const mockUsers = [
	{
		id: "2021-123456",
		name: "Alice Johnson",
		email: "alice@example.com",
		college: "College of Science",
		birthdate: "01/01/1990",
		phoneNumber: "9171234567",
		role: "Member",
		status: "ACTIVE",
		document: "doc1",
		createdAt: { toDate: () => new Date("2023-01-01") },
	},
	{
		id: "2022-654321",
		name: "Bob Smith",
		email: "bob@example.com",
		college: "College of Engineering",
		birthdate: "02/02/1992",
		phoneNumber: "9189876543",
		role: "Operations Handler",
		status: "ACTIVE",
		document: "doc2",
		createdAt: { toDate: () => new Date("2023-02-01") },
	},
	{
		id: "2020-111222",
		name: "Charlie Brown",
		email: "charlie@example.com",
		college: "College of Nursing",
		birthdate: "03/03/1988",
		phoneNumber: "9195555555",
		role: "Member",
		status: "INACTIVE",
		document: "doc3",
		createdAt: { toDate: () => new Date("2023-03-01") },
	},
];

// Type for user data
interface MockUser {
	id: string;
	name: string;
	email: string;
	college: string;
	birthdate: string;
	phoneNumber: string;
	role: string;
	status: string;
	document: string;
	createdAt: { toDate: () => Date };
}

// Helper to simulate onSnapshot callback with proper typing
const simulateUserSnapshot = (users: MockUser[] = mockUsers) => {
	// Get the callback function passed to onSnapshot
	const onSnapshotCallback = mockOnSnapshot.mock.calls[0][1];

	// Create a mock snapshot
	const mockSnapshot = {
		docs: users.map((user) => ({
			id: user.document,
			data: () => ({
				fullName: user.name,
				email: user.email,
				role: user.role,
				status: user.status,
				createdAt: user.createdAt,
				personalInfo: {
					idNumber: user.id,
					college: user.college,
					birthdate: user.birthdate,
					phoneNumber: user.phoneNumber,
				},
			}),
		})),
	};

	// Call the callback with the mock snapshot
	act(() => {
		onSnapshotCallback(mockSnapshot);
	});
};

// Helper to simulate onAuthStateChanged callback
const simulateAuthStateChanged = (user = { uid: "test-user-123" }) => {
	// Get the callback function passed to onAuthStateChanged
	const authCallback = mockOnAuthStateChanged.mock.calls[0][1];

	// Call the callback with the mock user
	act(() => {
		authCallback(user);
	});
};

describe("AdminSettings Component", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		window.alert = vi.fn();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test("renders loading state initially", () => {
		render(<AdminSettings />);

		// Should show loading indicators
		expect(
			screen.getByTestId("admin-loading-container")
		).toBeInTheDocument();
	});

	test("renders user management tab with users after loading", async () => {
		render(<AdminSettings />);

		// Simulate auth and data loading
		simulateAuthStateChanged();
		simulateUserSnapshot();

		// Wait for loading to complete
		await waitFor(() => {
			expect(
				screen.queryByTestId("admin-loading-container")
			).not.toBeInTheDocument();
		});

		// Should show the user management tab by default
		expect(screen.getByText("USER MANAGEMENT")).toHaveClass("active-tab");

		// Should display user rows
		expect(screen.getByTestId("user-row-2021-123456")).toBeInTheDocument();
		expect(screen.getByTestId("user-row-2022-654321")).toBeInTheDocument();
		expect(screen.getByTestId("user-row-2020-111222")).toBeInTheDocument();

		// Should show pagination
		expect(screen.getByTestId("page-buttons")).toBeInTheDocument();
	});

	test("allows searching users by name, email, college, role or status", async () => {
		render(<AdminSettings />);

		// Simulate auth and data loading
		simulateAuthStateChanged();
		simulateUserSnapshot();

		// Wait for loading to complete
		await waitFor(() => {
			expect(
				screen.queryByTestId("admin-loading-container")
			).not.toBeInTheDocument();
		});

		// Search by name
		const searchInput = screen.getByPlaceholderText("Search");
		await userEvent.type(searchInput, "Alice");

		// Should only show matching users
		expect(screen.getByTestId("user-row-2021-123456")).toBeInTheDocument();
		expect(
			screen.queryByTestId("user-row-2022-654321")
		).not.toBeInTheDocument();
		expect(
			screen.queryByTestId("user-row-2020-111222")
		).not.toBeInTheDocument();

		// Clear search and try a different term
		await userEvent.clear(searchInput);
		await userEvent.type(searchInput, "Engineering");

		// Should show matching college
		expect(
			screen.queryByTestId("user-row-2021-123456")
		).not.toBeInTheDocument();
		expect(screen.getByTestId("user-row-2022-654321")).toBeInTheDocument();
		expect(
			screen.queryByTestId("user-row-2020-111222")
		).not.toBeInTheDocument();
	});

	test("switches between user management and verification tabs", async () => {
		render(<AdminSettings />);

		// Simulate auth and data loading
		simulateAuthStateChanged();
		simulateUserSnapshot();

		// Wait for loading to complete
		await waitFor(() => {
			expect(
				screen.queryByTestId("admin-loading-container")
			).not.toBeInTheDocument();
		});

		// User management should be active by default
		expect(screen.getByText("USER MANAGEMENT")).toHaveClass("active-tab");
		expect(screen.getByTestId("user-row-2021-123456")).toBeInTheDocument();

		// Click the registration verification tab
		await userEvent.click(screen.getByText("REGISTRATION VERIFICATION"));

		// Verification tab should now be active
		expect(screen.getByText("REGISTRATION VERIFICATION")).toHaveClass(
			"active-tab"
		);
		expect(screen.getByTestId("verification-page")).toBeInTheDocument();
		expect(
			screen.queryByTestId("user-row-2021-123456")
		).not.toBeInTheDocument();
	});

	test("handles pagination correctly", async () => {
		// Create many mock users to test pagination
		const manyUsers = Array.from({ length: 20 }, (_, i) => ({
			id: `2023-${i.toString().padStart(6, "0")}`,
			name: `User ${i}`,
			email: `user${i}@example.com`,
			college: "College of Science",
			birthdate: "01/01/1990",
			phoneNumber: "9171234567",
			role: "Member",
			status: "ACTIVE",
			document: `doc${i}`,
			createdAt: { toDate: () => new Date("2023-01-01") },
		}));

		// Update mock users to have many users
		mockUsers.length = 0;
		mockUsers.push(...manyUsers);

		render(<AdminSettings />);

		// Simulate auth and data loading
		simulateAuthStateChanged();
		simulateUserSnapshot();

		// Wait for loading to complete
		await waitFor(() => {
			expect(
				screen.queryByTestId("admin-loading-container")
			).not.toBeInTheDocument();
		});

		// Should see the first page of users (first 7 users)
		expect(screen.getByTestId("user-row-2023-000000")).toBeInTheDocument();
		expect(screen.getByTestId("user-row-2023-000006")).toBeInTheDocument();
		expect(
			screen.queryByTestId("user-row-2023-000007")
		).not.toBeInTheDocument();

		// Navigate to the next page
		await userEvent.click(screen.getByTestId("next-page"));

		// Should see the second page of users
		expect(
			screen.queryByTestId("user-row-2023-000000")
		).not.toBeInTheDocument();
		expect(screen.getByTestId("user-row-2023-000007")).toBeInTheDocument();
		expect(screen.getByTestId("user-row-2023-000013")).toBeInTheDocument();
	});

	test("opens user audit logs popout when button is clicked", async () => {
		render(<AdminSettings />);

		// Simulate auth and data loading
		simulateAuthStateChanged();
		simulateUserSnapshot();

		// Wait for loading to complete
		await waitFor(() => {
			expect(
				screen.queryByTestId("admin-loading-container")
			).not.toBeInTheDocument();
		});

		// Audit logs popout should not be visible initially
		expect(
			screen.queryByTestId("audit-logs-popout")
		).not.toBeInTheDocument();

		// Click the audit logs button
		await userEvent.click(screen.getByText("VIEW USER AUDIT LOGS"));

		// Audit logs popout should now be visible
		expect(screen.getByTestId("audit-logs-popout")).toBeInTheDocument();

		// Close the popout
		await userEvent.click(screen.getByTestId("close-audit-logs"));

		// Popout should be closed
		expect(
			screen.queryByTestId("audit-logs-popout")
		).not.toBeInTheDocument();
	});

	test("handles editing user information", async () => {
		render(<AdminSettings />);

		// Simulate auth and data loading
		simulateAuthStateChanged();
		simulateUserSnapshot();

		// Wait for loading to complete
		await waitFor(() => {
			expect(
				screen.queryByTestId("admin-loading-container")
			).not.toBeInTheDocument();
		});

		// Edit a user's college
		await userEvent.click(screen.getByTestId("edit-college-2021-123456"));

		// Should show save confirmation popout
		expect(screen.getByTestId("save-popout")).toBeInTheDocument();
		expect(screen.getByText("Save Changes?")).toBeInTheDocument();
		expect(screen.getByText(/college/i)).toBeInTheDocument();

		// Confirm the save
		await userEvent.click(screen.getByTestId("popout-confirm"));

		// Should call setDoc with correct parameters
		expect(mockDoc).toHaveBeenCalledWith("mockDb", "users", "doc1");
		expect(mockSetDoc).toHaveBeenCalled();
		expect(window.alert).toHaveBeenCalledWith(
			"Changes saved successfully!"
		);
	});

	test("handles cancel on edit confirmation", async () => {
		render(<AdminSettings />);

		// Simulate auth and data loading
		simulateAuthStateChanged();
		simulateUserSnapshot();

		// Wait for loading to complete
		await waitFor(() => {
			expect(
				screen.queryByTestId("admin-loading-container")
			).not.toBeInTheDocument();
		});

		// Edit a user's role
		await userEvent.click(screen.getByTestId("edit-role-2022-654321"));

		// Should show save confirmation popout
		expect(screen.getByTestId("save-popout")).toBeInTheDocument();

		// Cancel the save
		await userEvent.click(screen.getByTestId("popout-cancel"));

		// Should close the popout without saving
		expect(screen.queryByTestId("save-popout")).not.toBeInTheDocument();
		expect(mockSetDoc).not.toHaveBeenCalled();
	});

	test("handles error during save operation", async () => {
		// Mock setDoc to reject
		mockSetDoc.mockRejectedValueOnce(new Error("Save failed"));

		render(<AdminSettings />);

		// Simulate auth and data loading
		simulateAuthStateChanged();
		simulateUserSnapshot();

		// Wait for loading to complete
		await waitFor(() => {
			expect(
				screen.queryByTestId("admin-loading-container")
			).not.toBeInTheDocument();
		});

		// Edit a user's status
		await userEvent.click(screen.getByTestId("edit-status-2020-111222"));

		// Confirm the save
		await userEvent.click(screen.getByTestId("popout-confirm"));

		// Should show error alert
		expect(window.alert).toHaveBeenCalledWith("Failed to save changes.");
	});

	test("handles case when auth state is null", async () => {
		render(<AdminSettings />);

		// Simulate auth callback with null (not logged in)
		simulateAuthStateChanged(null);

		// Should show empty users state
		await waitFor(() => {
			expect(
				screen.queryByTestId("admin-loading-container")
			).not.toBeInTheDocument();
		});

		// Table should be empty or show "no users" message
		expect(
			screen.queryByTestId("user-row-2021-123456")
		).not.toBeInTheDocument();
	});

	test("sorts users correctly when clicking on column headers", async () => {
		render(<AdminSettings />);

		// Simulate auth and data loading
		simulateAuthStateChanged();
		simulateUserSnapshot();

		// Wait for loading to complete
		await waitFor(() => {
			expect(
				screen.queryByTestId("admin-loading-container")
			).not.toBeInTheDocument();
		});

		// Find and click the Name column header
		const nameHeader = screen.getByText("Name");
		await userEvent.click(nameHeader);

		// Wait for sorting to complete
		await waitFor(() => {
			// Verify user rows are in correct order (alphabetical by name)
			const userRows = screen.getAllByTestId(/user-row-/);
			expect(userRows[0]).toHaveTextContent("Alice Johnson");
			expect(userRows[1]).toHaveTextContent("Bob Smith");
			expect(userRows[2]).toHaveTextContent("Charlie Brown");
		});

		// Click again to reverse sort order
		await userEvent.click(nameHeader);

		// Wait for sorting to complete
		await waitFor(() => {
			// Verify user rows are in correct order (reverse alphabetical by name)
			const userRows = screen.getAllByTestId(/user-row-/);
			expect(userRows[0]).toHaveTextContent("Charlie Brown");
			expect(userRows[1]).toHaveTextContent("Bob Smith");
			expect(userRows[2]).toHaveTextContent("Alice Johnson");
		});
	});

	test("filters users by active status", async () => {
		render(<AdminSettings />);

		// Simulate auth and data loading
		simulateAuthStateChanged();
		simulateUserSnapshot();

		// Wait for loading to complete
		await waitFor(() => {
			expect(
				screen.queryByTestId("admin-loading-container")
			).not.toBeInTheDocument();
		});

		// Find and click the Active filter
		const activeFilter = screen.getByLabelText("Active");
		await userEvent.click(activeFilter);

		// Should only show active users
		expect(screen.getByTestId("user-row-2021-123456")).toBeInTheDocument(); // ACTIVE
		expect(screen.getByTestId("user-row-2022-654321")).toBeInTheDocument(); // ACTIVE
		expect(
			screen.queryByTestId("user-row-2020-111222")
		).not.toBeInTheDocument(); // INACTIVE
	});

	test("exports user data to CSV when export button is clicked", async () => {
		// Mock window.URL.createObjectURL and window.URL.revokeObjectURL
		const mockCreateObjectURL = vi.fn().mockReturnValue("mock-blob-url");
		const mockRevokeObjectURL = vi.fn();
		const originalURL = window.URL;

		// Mock document.createElement to track link creation and clicks
		const mockAnchorElement = {
			href: "",
			download: "",
			click: vi.fn(),
			remove: vi.fn(),
		};
		const originalCreateElement = document.createElement;

		try {
			// Setup mocks
			window.URL.createObjectURL = mockCreateObjectURL;
			window.URL.revokeObjectURL = mockRevokeObjectURL;
			document.createElement = vi.fn().mockImplementation((tag) => {
				if (tag === "a") {
					return mockAnchorElement;
				}
				return originalCreateElement.call(document, tag);
			});

			render(<AdminSettings />);

			// Simulate auth and data loading
			simulateAuthStateChanged();
			simulateUserSnapshot();

			// Wait for loading to complete
			await waitFor(() => {
				expect(
					screen.queryByTestId("admin-loading-container")
				).not.toBeInTheDocument();
			});

			// Find and click the export button
			const exportButton = screen.getByText("EXPORT TO CSV");
			await userEvent.click(exportButton);

			// Verify CSV generation and download
			expect(mockCreateObjectURL).toHaveBeenCalled();
			expect(mockAnchorElement.download).toContain("user_data");
			expect(mockAnchorElement.click).toHaveBeenCalled();
			expect(mockAnchorElement.remove).toHaveBeenCalled();
			expect(mockRevokeObjectURL).toHaveBeenCalled();
		} finally {
			// Restore original functions
			window.URL.createObjectURL = originalURL.createObjectURL;
			window.URL.revokeObjectURL = originalURL.revokeObjectURL;
			document.createElement = originalCreateElement;
		}
	});

	test("handles role-based permissions for editing users", async () => {
		// Temporarily modify firebase context to have member role
		const originalUserClaims = firebaseContextValue.userClaims;
		firebaseContextValue.userClaims = { role: "member" };

		try {
			render(<AdminSettings />);

			// Simulate auth and data loading
			simulateAuthStateChanged();
			simulateUserSnapshot();

			// Wait for loading to complete
			await waitFor(() => {
				expect(
					screen.queryByTestId("admin-loading-container")
				).not.toBeInTheDocument();
			});

			// Member role should not have access to edit buttons
			expect(
				screen.queryByTestId("edit-college-2021-123456")
			).not.toBeInTheDocument();
			expect(
				screen.queryByTestId("edit-role-2021-123456")
			).not.toBeInTheDocument();
			expect(
				screen.queryByTestId("edit-status-2021-123456")
			).not.toBeInTheDocument();

			// User table should be in read-only mode
			expect(
				screen.getByText("You have read-only access")
			).toBeInTheDocument();
		} finally {
			// Restore original user claims
			firebaseContextValue.userClaims = originalUserClaims;
		}
	});

	test("handles bulk operations on users", async () => {
		render(<AdminSettings />);

		// Simulate auth and data loading
		simulateAuthStateChanged();
		simulateUserSnapshot();

		// Wait for loading to complete
		await waitFor(() => {
			expect(
				screen.queryByTestId("admin-loading-container")
			).not.toBeInTheDocument();
		});

		// Select multiple users with checkboxes
		const checkboxes = screen.getAllByRole("checkbox", {
			name: /select user/i,
		});
		await userEvent.click(checkboxes[0]);
		await userEvent.click(checkboxes[1]);

		// Click bulk action button
		const bulkActionButton = screen.getByText("Bulk Actions");
		await userEvent.click(bulkActionButton);

		// Select "Set All to Active" from dropdown
		const setActiveOption = screen.getByText("Set All to Active");
		await userEvent.click(setActiveOption);

		// Confirm the bulk action
		await userEvent.click(screen.getByTestId("popout-confirm"));

		// Should have called setDoc twice, once for each selected user
		expect(mockSetDoc).toHaveBeenCalledTimes(2);
		expect(window.alert).toHaveBeenCalledWith(
			"Bulk update completed successfully"
		);
	});

	test("handles no users found scenario", async () => {
		// Setup empty user list
		const emptySnapshot = { docs: [] };
		mockOnSnapshot.mockImplementation((_, callback) => {
			act(() => {
				callback(emptySnapshot);
			});
			return vi.fn();
		});

		render(<AdminSettings />);
		simulateAuthStateChanged();

		// Wait for loading to complete
		await waitFor(() => {
			expect(
				screen.queryByTestId("admin-loading-container")
			).not.toBeInTheDocument();
		});

		// Should show no users message
		expect(screen.getByText("No users found")).toBeInTheDocument();
	});

	test("disables editing for non-admin roles", async () => {
		// Temporarily modify firebase context to have a non-admin role
		const originalUserClaims = firebaseContextValue.userClaims;
		firebaseContextValue.userClaims = { role: "member" };

		try {
			render(<AdminSettings />);
			simulateAuthStateChanged();
			simulateUserSnapshot();

			await waitFor(() => {
				expect(
					screen.queryByTestId("admin-loading-container")
				).not.toBeInTheDocument();
			});

			// Edit buttons should not be visible
			expect(
				screen.queryByTestId("edit-college-2021-123456")
			).not.toBeInTheDocument();
			expect(
				screen.queryByTestId("edit-role-2022-654321")
			).not.toBeInTheDocument();
			expect(
				screen.queryByTestId("edit-status-2020-111222")
			).not.toBeInTheDocument();

			// Table should be in read-only mode
			expect(screen.getByText(/read-only/i)).toBeInTheDocument();
		} finally {
			// Restore original user claims
			firebaseContextValue.userClaims = originalUserClaims;
		}
	});

	test("handles errors when fetching users", async () => {
		// Mock onSnapshot to trigger error
		mockOnSnapshot.mockImplementation((_, __, onError) => {
			if (onError) {
				act(() => {
					onError(new Error("Database connection error"));
				});
			}
			return vi.fn();
		});

		render(<AdminSettings />);
		simulateAuthStateChanged();

		// Wait for loading to complete
		await waitFor(() => {
			expect(
				screen.queryByTestId("admin-loading-container")
			).not.toBeInTheDocument();
		});

		// Should show error message
		expect(
			screen.getByText(/error loading user data/i)
		).toBeInTheDocument();
		expect(
			screen.getByText(/database connection error/i)
		).toBeInTheDocument();
	});

	test("displays warning message for users with expired accounts", async () => {
		// Create users with expired accounts
		const expiredUsers = [
			...mockUsers,
			{
				id: "2019-999999",
				name: "Expired User",
				email: "expired@example.com",
				college: "College of Science",
				birthdate: "01/01/1985",
				phoneNumber: "9171234567",
				role: "Member",
				status: "EXPIRED",
				document: "doc4",
				createdAt: { toDate: () => new Date("2023-01-01") },
			},
		];

		render(<AdminSettings />);
		simulateAuthStateChanged();
		simulateUserSnapshot(expiredUsers);

		// Wait for loading to complete
		await waitFor(() => {
			expect(
				screen.queryByTestId("admin-loading-container")
			).not.toBeInTheDocument();
		});

		// Should show warning badge for expired users
		const expiredBadge = screen.getByText("EXPIRED");
		expect(expiredBadge).toBeInTheDocument();
		expect(expiredBadge).toHaveClass("expired-badge");
	});
});
