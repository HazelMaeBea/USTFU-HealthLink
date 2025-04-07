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

interface SnapshotData {
	docs: Array<{
		id: string;
		data: () => Record<string, unknown>;
	}>;
}
type SnapshotListener = (snapshot: SnapshotData) => void;

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

import * as firebaseContextModule from "../../src/contexts/firebaseContext";

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
		user: MockUser;
		onSave: (user: MockUser, option: "college" | "role" | "status") => void;
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
		const { container } = render(<AdminSettings />);
		expect(
			container.querySelector(".admin-loading-container")
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
});
