import { render, screen, act, waitFor } from "@testing-library/react";
import { describe, test, expect, beforeEach, vi, afterEach } from "vitest";
import "@testing-library/jest-dom";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import React, { ReactNode } from "react";

// 1. Define proper types for mocked components and context
interface MockNavigateProps {
	to: string;
	children?: ReactNode;
}

interface MockFirebaseContext {
	isLoading: boolean;
	isAuthenticated: boolean;
	isVerified: boolean;
	userStatus: string | null;
	userClaims: { role?: string };
}

// 2. Mock the useNavigate hook with proper typing
const mockNavigate = vi.hoisted(() => vi.fn());
vi.mock("react-router-dom", async () => {
	const actual = await vi.importActual<typeof import("react-router-dom")>(
		"react-router-dom"
	);
	return {
		...actual,
		useNavigate: () => mockNavigate,
		Navigate: ({ to, children }: MockNavigateProps) => (
			<div data-testid="navigate" data-to={to}>
				{children}
			</div>
		),
	};
});

// 3. Create a more comprehensive mock for Firebase context
const mockUseFirebase = vi.hoisted(() => vi.fn<() => MockFirebaseContext>());

// Try multiple potential import paths
vi.mock("../../../contexts/firebaseContext", () => {
	return {
		useFirebase: mockUseFirebase,
		FirebaseProvider: ({ children }: { children: ReactNode }) => (
			<>{children}</>
		),
	};
});

// Also mock alternate potential import paths
vi.mock("../../../../contexts/firebaseContext", () => {
	return {
		useFirebase: mockUseFirebase,
		FirebaseProvider: ({ children }: { children: ReactNode }) => (
			<>{children}</>
		),
	};
});

vi.mock("src/contexts/firebaseContext", () => {
	return {
		useFirebase: mockUseFirebase,
		FirebaseProvider: ({ children }: { children: ReactNode }) => (
			<>{children}</>
		),
	};
});

// Create a wrapper component that will provide the mocked context
const FirebaseWrapper = ({ children }: { children: ReactNode }) => {
	return <>{children}</>;
};

// Import the component after all mocks are set up
// Use dynamic import to ensure mocks are applied first
let ProtectedRoute: React.ComponentType;

// Helper component for testing Outlet rendering
const TestComponent = () => (
	<div data-testid="protected-content">Protected Content</div>
);

describe("ProtectedRoute Component", () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		localStorage.clear();

		// Dynamically import the component in each test
		const module = await import(
			"../components/Page Elements/Routing/protectedRoutes"
		);
		ProtectedRoute = module.default;
	});

	afterEach(() => {
		localStorage.clear();
	});

	test("shows loading spinner when isLoading is true", () => {
		mockUseFirebase.mockReturnValue({
			isLoading: true,
			isAuthenticated: false,
			isVerified: false,
			userStatus: null,
			userClaims: {},
		});

		render(
			<MemoryRouter>
				<FirebaseWrapper>
					<ProtectedRoute />
				</FirebaseWrapper>
			</MemoryRouter>
		);

		expect(screen.getByTestId("spinner")).toBeInTheDocument();
	});

	test("redirects to login page when user is not authenticated", async () => {
		mockUseFirebase.mockReturnValue({
			isLoading: false,
			isAuthenticated: false,
			isVerified: false,
			userStatus: null,
			userClaims: {},
		});

		render(
			<MemoryRouter>
				<FirebaseWrapper>
					<ProtectedRoute />
				</FirebaseWrapper>
			</MemoryRouter>
		);

		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 600));
		});

		const navigate = screen.getByTestId("navigate");
		expect(navigate.getAttribute("data-to")).toBe("/login");
	});

	test("redirects to login page when user is not verified", async () => {
		mockUseFirebase.mockReturnValue({
			isLoading: false,
			isAuthenticated: true,
			isVerified: false,
			userStatus: "active",
			userClaims: { role: "member" },
		});

		render(
			<MemoryRouter>
				<FirebaseWrapper>
					<ProtectedRoute />
				</FirebaseWrapper>
			</MemoryRouter>
		);

		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 600));
		});

		const navigate = screen.getByTestId("navigate");
		expect(navigate.getAttribute("data-to")).toBe("/login");
	});

	test("redirects to login page when user status is not active", async () => {
		mockUseFirebase.mockReturnValue({
			isLoading: false,
			isAuthenticated: true,
			isVerified: true,
			userStatus: "pending",
			userClaims: { role: "member" },
		});

		render(
			<MemoryRouter>
				<FirebaseWrapper>
					<ProtectedRoute />
				</FirebaseWrapper>
			</MemoryRouter>
		);

		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 600));
		});

		const navigate = screen.getByTestId("navigate");
		expect(navigate.getAttribute("data-to")).toBe("/login");
	});

	test("redirects operations handler to pending requests page", async () => {
		mockUseFirebase.mockReturnValue({
			isLoading: false,
			isAuthenticated: true,
			isVerified: true,
			userStatus: "active",
			userClaims: { role: "operations handler" },
		});

		render(
			<MemoryRouter>
				<FirebaseWrapper>
					<ProtectedRoute />
				</FirebaseWrapper>
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
		mockUseFirebase.mockReturnValue({
			isLoading: false,
			isAuthenticated: true,
			isVerified: true,
			userStatus: "active",
			userClaims: { role: "member" },
		});

		render(
			<MemoryRouter>
				<FirebaseWrapper>
					<ProtectedRoute />
				</FirebaseWrapper>
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

		mockUseFirebase.mockReturnValue({
			isLoading: false,
			isAuthenticated: true,
			isVerified: true,
			userStatus: "active",
			userClaims: { role: "member" },
		});

		render(
			<MemoryRouter>
				<FirebaseWrapper>
					<ProtectedRoute />
				</FirebaseWrapper>
			</MemoryRouter>
		);

		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 600));
		});

		expect(mockNavigate).not.toHaveBeenCalled();
	});

	test("renders outlet for authenticated and verified users", async () => {
		localStorage.setItem("redirected", "true");

		mockUseFirebase.mockReturnValue({
			isLoading: false,
			isAuthenticated: true,
			isVerified: true,
			userStatus: "active",
			userClaims: { role: "member" },
		});

		render(
			<MemoryRouter initialEntries={["/protected"]}>
				<Routes>
					<Route
						element={
							<FirebaseWrapper>
								<ProtectedRoute />
							</FirebaseWrapper>
						}
					>
						<Route path="/protected" element={<TestComponent />} />
					</Route>
				</Routes>
			</MemoryRouter>
		);

		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 600));
		});

		await waitFor(() => {
			expect(screen.getByTestId("protected-content")).toBeInTheDocument();
		});
	});

	test("clears redirected flag when user logs out", async () => {
		localStorage.setItem("redirected", "true");

		let firebaseState = {
			isLoading: false,
			isAuthenticated: true,
			isVerified: true,
			userStatus: "active",
			userClaims: { role: "member" },
		};

		mockUseFirebase.mockImplementation(() => firebaseState);

		const { rerender } = render(
			<MemoryRouter>
				<FirebaseWrapper>
					<ProtectedRoute />
				</FirebaseWrapper>
			</MemoryRouter>
		);

		firebaseState = {
			...firebaseState,
			isAuthenticated: false,
		};

		rerender(
			<MemoryRouter>
				<FirebaseWrapper>
					<ProtectedRoute />
				</FirebaseWrapper>
			</MemoryRouter>
		);

		expect(localStorage.getItem("redirected")).toBeNull();
	});
});
