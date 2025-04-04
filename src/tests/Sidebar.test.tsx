import type { ReactNode } from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, test, expect, beforeEach, vi } from "vitest";
import "@testing-library/jest-dom";

// Mock user context values
const mockSwitchRole = vi.fn();
const userContextStore = {
	value: {
		selectedRole: "member",
		setSelectedRole: vi.fn(),
		availableRoles: ["member", "operations handler"],
		switchRole: mockSwitchRole,
		loading: false,
		displayName: "Test User",
		photoURL: null,
	},
};

// Mock firebase context values
const firebaseContextStore = {
	value: {
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
	},
};

// Mock both context modules
vi.mock("../../src/contexts/userContext", () => {
	return {
		useUser: () => userContextStore.value,
		UserProvider: ({ children }: { children: ReactNode }) => children,
	};
});

vi.mock("../../src/contexts/firebaseContext", () => {
	return {
		useFirebase: () => firebaseContextStore.value,
		FirebaseProvider: ({ children }: { children: ReactNode }) => children,
	};
});

// Mock navigation
const mockNavigate = vi.fn();
const mockLocation = { pathname: "/home" };
vi.mock("react-router-dom", () => ({
	useNavigate: () => mockNavigate,
	Link: ({
		to,
		children,
		onClick,
	}: {
		to: string;
		children: ReactNode;
		onClick?: () => void;
	}) => (
		<a href={to} onClick={onClick} data-testid={`link-to-${to}`}>
			{children}
		</a>
	),
	useLocation: () => mockLocation,
}));

// Mock child components
vi.mock("../../src/components/Page Elements/Profile/Profile", () => ({
	default: ({
		isCollapsed,
		onRoleChange,
		currentRole,
	}: {
		isCollapsed: boolean;
		onRoleChange: (role: string) => void;
		currentRole: string;
	}) => (
		<div data-testid="profile-component" data-collapsed={isCollapsed}>
			<span>User: {currentRole}</span>
			<button
				data-testid="role-switch-button"
				onClick={() => onRoleChange("operations handler")}
			>
				Switch Role
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
		message: string;
		onConfirm: () => void;
		onCancel: () => void;
		isOpen: boolean;
	}) =>
		isOpen ? (
			<div data-testid="popout">
				<h2>{title}</h2>
				<p>{message}</p>
				<button onClick={onConfirm} data-testid="confirm-logout">
					Confirm
				</button>
				<button onClick={onCancel} data-testid="cancel-logout">
					Cancel
				</button>
			</div>
		) : null,
}));

vi.mock("../../src/components/Page Elements/NotifBadge/NotifBadge", () => ({
	default: ({ children, show }: { children: ReactNode; show: boolean }) => (
		<div
			data-testid={show ? "notification-active" : "notification-inactive"}
		>
			{children}
			{show && <span>•</span>}
		</div>
	),
}));

vi.mock("../../src/components/Page Elements/NotifBadge/NotifTrigger", () => ({
	default: () => ({
		hasNewPendingRequest: true,
		hasNewAccomplishedRecord: true,
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

// Import the Sidebar component after all mocks are set up
import Sidebar from "../../src/components/Page Elements/Sidebar/Sidebar";

describe("Sidebar Component", () => {
	// Mock logout function
	const mockLogout = vi.fn().mockImplementation(() => Promise.resolve());

	beforeEach(() => {
		vi.clearAllMocks();
		localStorageMock.clear();

		// Reset context values before each test
		userContextStore.value = {
			selectedRole: "member",
			setSelectedRole: vi.fn(),
			availableRoles: ["member", "operations handler"],
			switchRole: mockSwitchRole,
			loading: false,
			displayName: "Test User",
			photoURL: null,
		};

		mockLocation.pathname = "/home";
	});

	test("renders sidebar with correct menu items for member role", () => {
		render(<Sidebar onLogout={mockLogout} />);

		// Check that member menu items are rendered
		expect(
			screen.getByText("HOSPITALIZATION APPLICATION")
		).toBeInTheDocument();
		expect(
			screen.getByText("HOSPITALIZATION TRACKING")
		).toBeInTheDocument();
		expect(screen.getByText("SETTINGS")).toBeInTheDocument();
		expect(screen.getByText("FAQ")).toBeInTheDocument();
		expect(screen.getByText("LOGOUT")).toBeInTheDocument();

		// Admin items should not be present
		expect(screen.queryByText("PENDING REQUESTS")).not.toBeInTheDocument();
		expect(
			screen.queryByText("HOSPITALIZATION HISTORY")
		).not.toBeInTheDocument();
		expect(screen.queryByText("ADMIN SETTINGS")).not.toBeInTheDocument();
	});

	test("renders sidebar with correct menu items for operations handler role", () => {
		userContextStore.value.selectedRole = "operations handler";

		render(<Sidebar onLogout={mockLogout} />);

		// Check that operations handler menu items are rendered
		expect(screen.getByText("PENDING REQUESTS")).toBeInTheDocument();
		expect(screen.getByText("HOSPITALIZATION HISTORY")).toBeInTheDocument();
		expect(screen.getByText("ADMIN SETTINGS")).toBeInTheDocument();
		expect(screen.getByText("SETTINGS")).toBeInTheDocument();
		expect(screen.getByText("FAQ")).toBeInTheDocument();
		expect(screen.getByText("LOGOUT")).toBeInTheDocument();

		// Member-specific items should not be present
		expect(
			screen.queryByText("HOSPITALIZATION APPLICATION")
		).not.toBeInTheDocument();
		expect(
			screen.queryByText("HOSPITALIZATION TRACKING")
		).not.toBeInTheDocument();
	});

	test("toggles sidebar when toggle button is clicked", () => {
		render(<Sidebar onLogout={mockLogout} />);

		const sidebar = screen.getByRole("complementary", { name: /sidebar/i });
		const toggleButton = screen.getByRole("button", {
			name: /toggle sidebar/i,
		});

		// Initially sidebar should not have collapsed class
		expect(sidebar).not.toHaveClass("collapsed");

		// Click toggle button
		fireEvent.click(toggleButton);

		// Sidebar should now have collapsed class
		expect(sidebar).toHaveClass("collapsed");

		// Click again to expand
		fireEvent.click(toggleButton);

		// Sidebar should not have collapsed class again
		expect(sidebar).not.toHaveClass("collapsed");
	});

	test("shows logout confirmation popout when logout is clicked", () => {
		render(<Sidebar onLogout={mockLogout} />);

		// Initially popout should not be visible
		expect(screen.queryByTestId("popout")).not.toBeInTheDocument();

		// Click logout button
		fireEvent.click(screen.getByText("LOGOUT"));

		// Popout should now be visible
		expect(screen.getByTestId("popout")).toBeInTheDocument();
		expect(screen.getByText("Confirm Logout")).toBeInTheDocument();
		expect(
			screen.getByText("Are you sure you want to logout?")
		).toBeInTheDocument();
	});

	test("navigates to correct route when menu item is clicked", async () => {
		render(<Sidebar onLogout={mockLogout} />);

		// Click FAQ menu item
		fireEvent.click(screen.getByText("FAQ"));

		// Should navigate to the correct path
		expect(mockNavigate).toHaveBeenCalledWith("/faqs");

		// Active item should be updated in localStorage
		expect(localStorageMock.getItem("activePage")).toBe("FAQ");
	});

	test("calls logout function and navigates when logout is confirmed", async () => {
		render(<Sidebar onLogout={mockLogout} />);

		// Click logout button
		fireEvent.click(screen.getByText("LOGOUT"));

		// Confirm logout
		await act(async () => {
			fireEvent.click(screen.getByTestId("confirm-logout"));
		});

		// Should call logout function and navigate to login
		expect(mockLogout).toHaveBeenCalled();
		expect(mockNavigate).toHaveBeenCalledWith("/login");
	});

	test("closes logout popout when cancel is clicked", () => {
		render(<Sidebar onLogout={mockLogout} />);

		// Click logout button
		fireEvent.click(screen.getByText("LOGOUT"));
		expect(screen.getByTestId("popout")).toBeInTheDocument();

		// Cancel logout
		fireEvent.click(screen.getByTestId("cancel-logout"));

		// Popout should be closed
		expect(screen.queryByTestId("popout")).not.toBeInTheDocument();
		expect(mockLogout).not.toHaveBeenCalled();
	});

	test("calls switchRole when role is changed from profile component", () => {
		render(<Sidebar onLogout={mockLogout} />);

		// Find and click role switch button in profile component
		const roleButton = screen.getByTestId("role-switch-button");
		fireEvent.click(roleButton);

		// Should call switchRole with new role
		expect(mockSwitchRole).toHaveBeenCalledWith("operations handler");
	});

	test("redirects user when current route is not valid for role", () => {
		mockLocation.pathname = "/adminsettings"; // Not valid for member role
		render(<Sidebar onLogout={mockLogout} />);

		// Should navigate to the first valid route
		expect(mockNavigate).toHaveBeenCalledWith("/home");
	});

	test("shows notification badge for pending requests", () => {
		userContextStore.value.selectedRole = "operations handler";
		render(<Sidebar onLogout={mockLogout} />);

		// Should show notification badge
		expect(screen.getByTestId("notification-active")).toBeInTheDocument();
	});

	test("collapses sidebar after timeout when mouse leaves", async () => {
		// Mock timers
		vi.useFakeTimers();

		render(<Sidebar onLogout={mockLogout} />);
		const sidebarWrapper = document.querySelector(".sidebar-wrapper");

		// Trigger mouseleave event
		if (sidebarWrapper) {
			fireEvent.mouseLeave(sidebarWrapper);
		}

		// Fast-forward timer
		await act(async () => {
			vi.runAllTimers();
		});

		// Sidebar should now be collapsed
		const sidebar = screen.getByRole("complementary", { name: /sidebar/i });
		expect(sidebar).toHaveClass("collapsed");

		vi.useRealTimers();
	});

	test("preserves active menu state between renders", () => {
		// Set active page in localStorage
		localStorageMock.setItem("activePage", "SETTINGS");

		render(<Sidebar onLogout={mockLogout} />);

		// The SETTINGS menu item should have 'active' class
		const settingsMenuItem = screen
			.getByText("SETTINGS")
			.closest(".menu-item");
		expect(settingsMenuItem).toHaveClass("active");
	});
});
