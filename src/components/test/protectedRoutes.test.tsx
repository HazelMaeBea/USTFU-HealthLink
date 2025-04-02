import { render, screen } from "@testing-library/react";
import { describe, test, expect, beforeEach, vi, afterEach } from "vitest";
import ProtectedRoute from "../Page Elements/Routing/protectedRoutes";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import React from "react";

// Mock the useNavigate hook
const mockNavigate = vi.hoisted(() => vi.fn());

// Create mock implementations for Firebase context
const mockIsLoading = vi.hoisted(() => vi.fn().mockReturnValue(false));
const mockIsAuthenticated = vi.hoisted(() => vi.fn().mockReturnValue(true));
const mockIsVerified = vi.hoisted(() => vi.fn().mockReturnValue(true));
const mockUserStatus = vi.hoisted(() => vi.fn().mockReturnValue("active"));
const mockUserClaims = vi.hoisted(() =>
	vi.fn().mockReturnValue({ role: "member" })
);

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
vi.mock("../contexts/firebaseContext", () => {
	// Create a mock FirebaseContext value
	const mockFirebaseContext = {
		isLoading: mockIsLoading(),
		isAuthenticated: mockIsAuthenticated(),
		isVerified: mockIsVerified(),
		userStatus: mockUserStatus(),
		userClaims: mockUserClaims(),
	};

	return {
		useFirebase: () => mockFirebaseContext,
		FirebaseContext: {
			Provider: ({ children }: { children: ReactNode }) => children,
			Consumer: ({
				children,
			}: {
				children: (value: unknown) => React.ReactNode;
			}) => children(mockFirebaseContext),
		},
		FirebaseProvider: ({ children }: { children: ReactNode }) => children,
	};
});

describe("ProtectedRoute Component", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		localStorage.clear();

		// Reset mock return values to defaults
		mockIsLoading.mockReturnValue(false);
		mockIsAuthenticated.mockReturnValue(true);
		mockIsVerified.mockReturnValue(true);
		mockUserStatus.mockReturnValue("active");
		mockUserClaims.mockReturnValue({ role: "member" });
	});

	afterEach(() => {
		localStorage.clear();
	});

	test("shows loading spinner when isLoading is true", () => {
		mockIsLoading.mockReturnValue(true);

		render(
			<MemoryRouter>
				<ProtectedRoute />
			</MemoryRouter>
		);

		// Fix: use getByTestId instead of getByClass
		expect(screen.getByTestId("spinner")).toBeInTheDocument();
	});

	// Add additional tests for different authentication states...
});
