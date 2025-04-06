import {
	render,
	screen,
	fireEvent,
	waitFor,
	act,
} from "@testing-library/react";
import { describe, test, expect, beforeEach, vi } from "vitest";
import "@testing-library/jest-dom";
import type { ReactNode } from "react";

// Create mock implementations using vi.hoisted
const mockNavigate = vi.hoisted(() => vi.fn());
const mockLogin = vi.hoisted(() => vi.fn());
const mockIsRegistered = vi.hoisted(() => vi.fn());
const mockGetUserStatus = vi.hoisted(() => vi.fn());
const mockCallFunction = vi.hoisted(() => vi.fn());
const mockUser = vi.hoisted(() => ({
	uid: "test-user-123",
	reload: vi.fn().mockResolvedValue(undefined),
}));

// Mock the firebaseContext module with the correct import path
// The key is to match the exact import path used by LoginPage
vi.mock("../../src/contexts/firebaseContext", () => {
	return {
		useFirebase: () => ({
			login: mockLogin,
			isAuthenticated: false,
			isLoading: false,
			uid: null,
			displayName: null,
			photoURL: null,
			userClaims: {},
			logout: vi.fn(),
			isVerified: false,
			userStatus: null,
			email: null,
			fullName: null,
			app: {},
			auth: {},
			db: {},
			storage: {},
			storageRef: {},
			callFunction: vi.fn(),
			currentUser: null,
			getFormID: vi.fn(),
		}),
		FirebaseProvider: ({ children }: { children: ReactNode }) => children,
	};
});

// Mock additional modules
vi.mock("../../src/contexts/firebase", () => ({
	isRegistered: mockIsRegistered,
	getUserStatus: mockGetUserStatus,
	callFunction: mockCallFunction,
	auth: { currentUser: mockUser },
}));

// Mock Popout component
interface PopoutProps {
	title: string;
	message: string;
	onConfirm: () => void;
	onCancel?: () => void;
	isOpen: boolean;
}

vi.mock("../../src/components/Page Elements/Popout/Popout", () => ({
	default: ({ title, message, onConfirm, onCancel, isOpen }: PopoutProps) =>
		isOpen ? (
			<div data-testid="popout">
				<h2>{title}</h2>
				<p>{message}</p>
				<button onClick={onConfirm}>Confirm</button>
				{onCancel && <button onClick={onCancel}>Cancel</button>}
			</div>
		) : null,
}));

// Mock react-router-dom
vi.mock("react-router-dom", () => ({
	useNavigate: () => mockNavigate,
}));

// Import component after ALL mocks
import LoginPage from "../../src/components/Pages/LoginPage/LoginPage";

describe("LoginPage Component", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test("renders login page correctly", () => {
		render(<LoginPage />);

		expect(screen.getByAltText("Logo")).toBeInTheDocument();
		expect(screen.getByText("Sign in")).toBeInTheDocument();
		expect(
			screen.getByText("UST Google Workspace Personal Account")
		).toBeInTheDocument();
		expect(screen.getByText("Sign in with Google")).toBeInTheDocument();
	});

	test("shows loading state when logging in", async () => {
		mockLogin.mockImplementation(
			() =>
				new Promise((resolve) =>
					setTimeout(() => resolve(mockUser), 100)
				)
		);

		render(<LoginPage />);

		await act(async () => {
			fireEvent.click(screen.getByText("Sign in with Google"));
		});

		expect(screen.getByText("Signing in...")).toBeInTheDocument();
		await waitFor(() => expect(mockLogin).toHaveBeenCalledTimes(1));
	});

	test("shows not registered popout for unregistered users", async () => {
		mockLogin.mockResolvedValue(mockUser);
		mockIsRegistered.mockResolvedValue(false);

		render(<LoginPage />);

		await act(async () => {
			fireEvent.click(screen.getByText("Sign in with Google"));
		});

		await waitFor(() => {
			expect(screen.getByText("Not Registered")).toBeInTheDocument();
			expect(
				screen.getByText(
					"You are not yet registered. Proceed to registration?"
				)
			).toBeInTheDocument();
		});

		fireEvent.click(screen.getByText("Confirm"));
		await waitFor(() =>
			expect(mockNavigate).toHaveBeenCalledWith("/register")
		);
	});

	test("shows pending verification popout", async () => {
		mockLogin.mockResolvedValue(mockUser);
		mockIsRegistered.mockResolvedValue(true);
		mockGetUserStatus.mockResolvedValue("pending");

		render(<LoginPage />);

		await act(async () => {
			fireEvent.click(screen.getByText("Sign in with Google"));
		});

		await waitFor(() => {
			expect(
				screen.getByText("Verification Pending")
			).toBeInTheDocument();
			expect(
				screen.getByText(
					"Your account is pending verification. Please wait for admin approval."
				)
			).toBeInTheDocument();
		});
	});

	test("shows incomplete registration popout", async () => {
		mockLogin.mockResolvedValue(mockUser);
		mockIsRegistered.mockResolvedValue(true);
		mockGetUserStatus.mockResolvedValue("incomplete");

		render(<LoginPage />);

		await act(async () => {
			fireEvent.click(screen.getByText("Sign in with Google"));
		});

		await waitFor(() => {
			expect(
				screen.getByText("Incomplete Registration")
			).toBeInTheDocument();
			expect(
				screen.getByText(
					"You need to complete your registration before accessing the platform."
				)
			).toBeInTheDocument();
		});
	});

	test("handles login failure", async () => {
		mockLogin.mockResolvedValue(null);

		render(<LoginPage />);

		await act(async () => {
			fireEvent.click(screen.getByText("Sign in with Google"));
		});

		await waitFor(() => {
			expect(
				screen.getByText("Login failed. Please try again.")
			).toBeInTheDocument();
		});
	});

	test("handles authentication error", async () => {
		const errorMsg = "Authentication error occurred";
		mockLogin.mockRejectedValue(new Error(errorMsg));

		render(<LoginPage />);

		await act(async () => {
			fireEvent.click(screen.getByText("Sign in with Google"));
		});

		await waitFor(() => {
			expect(screen.getByText(errorMsg)).toBeInTheDocument();
		});
	});

	test("handles keyboard shortcut for syncing claims", async () => {
		mockCallFunction.mockResolvedValue(undefined);

		render(<LoginPage />);

		await act(async () => {
			fireEvent.keyDown(document, {
				key: "S",
				altKey: true,
				shiftKey: true,
				bubbles: true,
			});
		});

		await waitFor(() => {
			expect(mockCallFunction).toHaveBeenCalledWith(
				"syncAllUserClaimsTrigger"
			);
		});
	});
});
