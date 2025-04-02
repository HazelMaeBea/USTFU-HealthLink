import { render, screen, act, waitFor } from "@testing-library/react";
import { describe, test, expect, beforeEach, vi, afterEach } from "vitest";
import ProtectedRoute from "../protectedRoutes";
import "@testing-library/jest-dom";
import { MemoryRouter, Route, Routes } from "react-router-dom";

// Mock the useNavigate hook
const mockNavigate = vi.hoisted(() => vi.fn());
vi.mock("react-router-dom", async () => {
	const actual = await vi.importActual("react-router-dom");
	return {
		...(actual as object),
		useNavigate: () => mockNavigate,
		Navigate: ({ to }: { to: string }) => (
			<div data-testid="navigate" data-to={to}></div>
		),
	};
});

// Mock the useFirebase hook with different authentication states
const mockUseFirebase = vi.hoisted(() => vi.fn());
vi.mock("../contexts/firebaseContext", () => ({
	useFirebase: () => mockUseFirebase(),
}));

describe("ProtectedRoute Component", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		// Clear localStorage for each test
		localStorage.clear();
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
				<ProtectedRoute />
			</MemoryRouter>
		);

		// Should show loading spinner
		expect(screen.getByClass("spinner")).toBeInTheDocument();
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
				<ProtectedRoute />
			</MemoryRouter>
		);

		// Wait for grace period to end
		await act(() => new Promise((resolve) => setTimeout(resolve, 600)));

		// Should redirect to login
		const navigate = screen.getByTestId("navigate");
		expect(navigate.getAttribute("data-to")).toBe("/login");
	});

	test("redirects to login page when user is not verified", async () => {
		mockUseFirebase.mockReturnValue({
			isLoading: false,
			isAuthenticated: true,
			isVerified: false, // Not verified
			userStatus: "active",
			userClaims: { role: "member" },
		});

		render(
			<MemoryRouter>
				<ProtectedRoute />
			</MemoryRouter>
		);

		await act(() => new Promise((resolve) => setTimeout(resolve, 600)));

		const navigate = screen.getByTestId("navigate");
		expect(navigate.getAttribute("data-to")).toBe("/login");
	});

	test("redirects to login page when user status is not active", async () => {
		mockUseFirebase.mockReturnValue({
			isLoading: false,
			isAuthenticated: true,
			isVerified: true,
			userStatus: "pending", // Not active
			userClaims: { role: "member" },
		});

		render(
			<MemoryRouter>
				<ProtectedRoute />
			</MemoryRouter>
		);

		await act(() => new Promise((resolve) => setTimeout(resolve, 600)));

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
				<ProtectedRoute />
			</MemoryRouter>
		);

		await act(() => new Promise((resolve) => setTimeout(resolve, 600)));

		// Should have redirected to pending requests
		expect(mockNavigate).toHaveBeenCalledWith("/pendingrequests", {
			replace: true,
		});

		// Should have set localStorage flag
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
				<ProtectedRoute />
			</MemoryRouter>
		);

		await act(() => new Promise((resolve) => setTimeout(resolve, 600)));

		// Should have redirected to home
		expect(mockNavigate).toHaveBeenCalledWith("/home", { replace: true });
		expect(localStorage.getItem("redirected")).toBe("true");
	});

	test("doesn't redirect if already redirected", async () => {
		// Set localStorage to indicate already redirected
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
				<ProtectedRoute />
			</MemoryRouter>
		);

		await act(() => new Promise((resolve) => setTimeout(resolve, 600)));

		// Should not have navigated again
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

		const TestComponent = () => (
			<div data-testid="protected-content">Protected Content</div>
		);

		render(
			<MemoryRouter initialEntries={["/protected"]}>
				<Routes>
					<Route element={<ProtectedRoute />}>
						<Route path="/protected" element={<TestComponent />} />
					</Route>
				</Routes>
			</MemoryRouter>
		);

		await act(() => new Promise((resolve) => setTimeout(resolve, 600)));

		// Should render the protected content
		await waitFor(() => {
			expect(screen.getByTestId("protected-content")).toBeInTheDocument();
		});
	});

	test("clears redirected flag when user logs out", async () => {
		// Set localStorage flag
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
				<ProtectedRoute />
			</MemoryRouter>
		);

		// Update the authentication state to simulate logout
		firebaseState = {
			...firebaseState,
			isAuthenticated: false,
		};

		// Re-render with updated auth state
		rerender(
			<MemoryRouter>
				<ProtectedRoute />
			</MemoryRouter>
		);

		// Flag should be cleared
		expect(localStorage.getItem("redirected")).toBeNull();
	});
});
