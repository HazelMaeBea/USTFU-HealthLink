import { render, screen, act } from "@testing-library/react";
import { describe, test, expect, beforeEach, vi, afterEach } from "vitest";
import "@testing-library/jest-dom";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";

// Mock the navigate hook with proper typing
const mockNavigate = vi.hoisted(() => vi.fn());

// We need to create a store for the current context value that can be modified per test
const contextStore = {
	value: {
		isLoading: false,
		isAuthenticated: false,
		isVerified: false,
		userStatus: null as string | null,
		userClaims: {},
		login: vi.fn(),
		logout: vi.fn(),
		uid: null,
		displayName: null,
		photoURL: null,
		email: null,
		fullName: null,
		getFormID: vi.fn(),
		app: {},
		auth: {},
		db: {},
		storage: {},
		storageRef: {},
		callFunction: vi.fn(),
		currentUser: null,
	},
};

// Mock direct import paths - try multiple potential paths
vi.mock("../../src/contexts/firebaseContext", () => {
	return {
		useFirebase: () => contextStore.value,
		FirebaseProvider: ({ children }: { children: ReactNode }) => children,
	};
});

vi.mock("../contexts/firebaseContext", () => {
	return {
		useFirebase: () => contextStore.value,
		FirebaseProvider: ({ children }: { children: ReactNode }) => children,
	};
});

vi.mock(
	"../components/Page Elements/Routing/../../contexts/firebaseContext",
	() => {
		return {
			useFirebase: () => contextStore.value,
			FirebaseProvider: ({ children }: { children: ReactNode }) =>
				children,
		};
	}
);

// Mock react-router-dom
vi.mock("react-router-dom", async () => {
	const actual = await vi.importActual("react-router-dom");
	return {
		...actual,
		useNavigate: () => mockNavigate,
		Navigate: ({ to, children }: { to: string; children?: ReactNode }) => (
			<div data-testid="navigate" data-to={to}>
				{children}
			</div>
		),
	};
});

// Helper component for testing Outlet rendering
const TestComponent = () => (
	<div data-testid="protected-content">Protected Content</div>
);

// Import component dynamically
let ProtectedRoute: React.ComponentType;

describe("ProtectedRoute Component", () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		localStorage.clear();

		// Reset the mock context for each test
		contextStore.value = {
			isLoading: false,
			isAuthenticated: false,
			isVerified: false,
			userStatus: null,
			userClaims: {},
			login: vi.fn(),
			logout: vi.fn(),
			uid: null,
			displayName: null,
			photoURL: null,
			email: null,
			fullName: null,
			getFormID: vi.fn(),
			app: {},
			auth: {},
			db: {},
			storage: {},
			storageRef: {},
			callFunction: vi.fn(),
			currentUser: null,
		};

		// Dynamically import component
		const module = await import(
			"../components/Page Elements/Routing/protectedRoutes"
		);
		ProtectedRoute = module.default;
	});

	afterEach(() => {
		localStorage.clear();
	});

	test("shows loading spinner when isLoading is true", () => {
		// Update context for this specific test
		contextStore.value = {
			...contextStore.value,
			isLoading: true,
		};

		render(
			<MemoryRouter>
				<ProtectedRoute />
			</MemoryRouter>
		);

		expect(screen.getByTestId("spinner")).toBeInTheDocument();
	});

	test("redirects to login page when user is not authenticated", async () => {
		// Default context value is already not authenticated

		render(
			<MemoryRouter>
				<ProtectedRoute />
			</MemoryRouter>
		);

		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 600));
		});

		const navigate = screen.getByTestId("navigate");
		expect(navigate.getAttribute("data-to")).toBe("/login");
	});

	test("redirects to login page when user is not verified", async () => {
		contextStore.value = {
			...contextStore.value,
			isAuthenticated: true,
			isVerified: false,
			userStatus: "active",
			userClaims: { role: "member" },
		};

		render(
			<MemoryRouter>
				<ProtectedRoute />
			</MemoryRouter>
		);

		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 600));
		});

		const navigate = screen.getByTestId("navigate");
		expect(navigate.getAttribute("data-to")).toBe("/login");
	});

	test("redirects to login page when user status is not active", async () => {
		contextStore.value = {
			...contextStore.value,
			isAuthenticated: true,
			isVerified: true,
			userStatus: "pending",
			userClaims: { role: "member" },
		};

		render(
			<MemoryRouter>
				<ProtectedRoute />
			</MemoryRouter>
		);

		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 600));
		});

		const navigate = screen.getByTestId("navigate");
		expect(navigate.getAttribute("data-to")).toBe("/login");
	});

	test("redirects operations handler to pending requests page", async () => {
		contextStore.value = {
			...contextStore.value,
			isAuthenticated: true,
			isVerified: true,
			userStatus: "active",
			userClaims: { role: "operations handler" },
		};

		render(
			<MemoryRouter>
				<ProtectedRoute />
			</MemoryRouter>
		);

		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 600));
		});

		expect(mockNavigate).toHaveBeenCalledWith("/pendingrequests", {
			replace: true,
		});
		expect(localStorage.getItem("redirected")).toBe("true");
	});

	test("redirects member to home page", async () => {
		contextStore.value = {
			...contextStore.value,
			isAuthenticated: true,
			isVerified: true,
			userStatus: "active",
			userClaims: { role: "member" },
		};

		render(
			<MemoryRouter>
				<ProtectedRoute />
			</MemoryRouter>
		);

		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 600));
		});

		expect(mockNavigate).toHaveBeenCalledWith("/home", { replace: true });
		expect(localStorage.getItem("redirected")).toBe("true");
	});

	test("doesn't redirect if already redirected", async () => {
		localStorage.setItem("redirected", "true");

		contextStore.value = {
			...contextStore.value,
			isAuthenticated: true,
			isVerified: true,
			userStatus: "active",
			userClaims: { role: "member" },
		};

		render(
			<MemoryRouter>
				<ProtectedRoute />
			</MemoryRouter>
		);

		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 600));
		});

		expect(mockNavigate).not.toHaveBeenCalled();
	});

	test("renders outlet for authenticated and verified users", async () => {
		localStorage.setItem("redirected", "true");

		contextStore.value = {
			...contextStore.value,
			isAuthenticated: true,
			isVerified: true,
			userStatus: "active",
			userClaims: { role: "member" },
		};

		render(
			<MemoryRouter initialEntries={["/protected"]}>
				<Routes>
					<Route element={<ProtectedRoute />}>
						<Route path="/protected" element={<TestComponent />} />
					</Route>
				</Routes>
			</MemoryRouter>
		);

		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 600));
		});

		expect(screen.getByTestId("protected-content")).toBeInTheDocument();
	});

	test("clears redirected flag when user logs out", async () => {
		localStorage.setItem("redirected", "true");

		contextStore.value = {
			...contextStore.value,
			isAuthenticated: true,
			isVerified: true,
			userStatus: "active",
			userClaims: { role: "member" },
		};

		const { rerender } = render(
			<MemoryRouter>
				<ProtectedRoute />
			</MemoryRouter>
		);

		// Change the authentication state
		contextStore.value = {
			...contextStore.value,
			isAuthenticated: false,
		};

		rerender(
			<MemoryRouter>
				<ProtectedRoute />
			</MemoryRouter>
		);

		expect(localStorage.getItem("redirected")).toBeNull();
	});
});
