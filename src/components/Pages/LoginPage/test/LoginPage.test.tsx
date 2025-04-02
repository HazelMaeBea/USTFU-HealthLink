// Summary of LoginPage.test.tsx tests:
/*
Key Tests Summary:
- Renders login page correctly:
  Checks that essential elements (Logo, "Sign in" text, account description, and the "Sign in with Google" button)
  are rendered on the page.
  
- Shows loading state when logging in:
  Simulates a delayed login and verifies that a "Signing in..." message is displayed while waiting for the login to resolve.
  
- Redirects to home when user is verified:
  After a successful login with verified user status, confirms that the user is navigated to "/home".
  
- Shows not registered popout for unregistered users:
  For unregistered users, ensures a popout prompting registration is displayed;
  upon confirmation, the user is redirected to "/register".
  
- Shows pending verification popout:
  If the logged-in user’s registration status is "pending",
  the interface shows a message informing the user that verification is pending.
  
- Shows incomplete registration popout:
  When the registration status is "incomplete", alerts the user to complete their registration.
  
- Handles login failure:
  If the login fails (returns null), verifies that an error message "Login failed. Please try again." is displayed.
  
- Handles authentication error:
  When login results in an error (thrown exception), confirms that the specific error message is showed.
  
- Handles keyboard shortcut for syncing claims:
  Simulates an Alt+Shift+S keyboard event and checks that the syncing function (syncAllUserClaimsTrigger) is called.
*/

import React, { ReactNode } from "react";
import {
	render,
	screen,
	fireEvent,
	waitFor,
	act,
} from "@testing-library/react";
import { describe, test, expect, beforeEach, vi, Mock } from "vitest";
import LoginPage from "../LoginPage";
import "@testing-library/jest-dom";

// Define mock types
interface MockUser {
	uid: string;
	reload: Mock;
}

// Create mock implementations using vi.hoisted to avoid hoisting issues
const mockNavigate = vi.hoisted(() => vi.fn());
const mockLogin = vi.hoisted(() => vi.fn());
const mockIsRegistered = vi.hoisted(() => vi.fn());
const mockGetUserStatus = vi.hoisted(() => vi.fn());
const mockCallFunction = vi.hoisted(() => vi.fn());
const mockUser = vi.hoisted(
	() =>
		({
			uid: "test-user-123",
			reload: vi.fn().mockResolvedValue(undefined),
		} as MockUser)
);

// Mock FirebaseContext
const FirebaseContext = React.createContext({
	login: mockLogin,
});

// Mock FirebaseProvider component
const MockFirebaseProvider: React.FC<{ children: ReactNode }> = ({
	children,
}) => {
	return (
		<FirebaseContext.Provider value={{ login: mockLogin }}>
			{children}
		</FirebaseContext.Provider>
	);
};

// Setup a custom render function that includes the FirebaseProvider
const customRender = (ui: React.ReactElement) => {
	return render(<MockFirebaseProvider>{ui}</MockFirebaseProvider>);
};

// Mock modules
vi.mock("react-router-dom", () => ({
	useNavigate: () => mockNavigate,
}));

vi.mock("../../../../contexts/firebaseContext", () => ({
	useFirebase: () => ({ login: mockLogin }),
	FirebaseProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("../../../../contexts/firebase", () => ({
	isRegistered: mockIsRegistered,
	getUserStatus: mockGetUserStatus,
	callFunction: mockCallFunction,
	auth: { currentUser: mockUser },
}));

vi.mock("../../../Page Elements/Popout/Popout", () => ({
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
		onCancel?: () => void;
		isOpen: boolean;
	}) =>
		isOpen ? (
			<div data-testid="popout">
				<h2>{title}</h2>
				<p>{message}</p>
				<button onClick={onConfirm}>Confirm</button>
				{onCancel && <button onClick={onCancel}>Cancel</button>}
			</div>
		) : null,
}));

describe("LoginPage Component", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test("renders login page correctly", () => {
		customRender(<LoginPage />);

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

		customRender(<LoginPage />);

		await act(async () => {
			fireEvent.click(screen.getByText("Sign in with Google"));
		});

		expect(screen.getByText("Signing in...")).toBeInTheDocument();
		await waitFor(() => expect(mockLogin).toHaveBeenCalledTimes(1));
	});

	test("redirects to home when user is verified", async () => {
		mockLogin.mockResolvedValue(mockUser);
		mockIsRegistered.mockResolvedValue(true);
		mockGetUserStatus.mockResolvedValue("verified");

		customRender(<LoginPage />);

		await act(async () => {
			fireEvent.click(screen.getByText("Sign in with Google"));
		});

		await waitFor(() => {
			expect(mockIsRegistered).toHaveBeenCalledWith(mockUser.uid);
			expect(mockGetUserStatus).toHaveBeenCalledWith(mockUser.uid);
		});

		await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/home"));
	});

	test("shows not registered popout for unregistered users", async () => {
		mockLogin.mockResolvedValue(mockUser);
		mockIsRegistered.mockResolvedValue(false);

		customRender(<LoginPage />);

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

		customRender(<LoginPage />);

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

		customRender(<LoginPage />);

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

		customRender(<LoginPage />);

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

		customRender(<LoginPage />);

		await act(async () => {
			fireEvent.click(screen.getByText("Sign in with Google"));
		});

		await waitFor(() => {
			expect(screen.getByText(errorMsg)).toBeInTheDocument();
		});
	});

	test("handles keyboard shortcut for syncing claims", async () => {
		mockCallFunction.mockResolvedValue(undefined);

		customRender(<LoginPage />);

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
