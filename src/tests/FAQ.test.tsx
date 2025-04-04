import type { ReactNode } from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, test, expect, beforeEach, vi } from "vitest";
import "@testing-library/jest-dom";

// Mock the faq-data.ts module directly instead of Firebase
vi.mock("../../src/components/Pages/FAQPage/faq-data", () => ({
	faqData: [
		{
			topic: "General",
			items: [
				{
					question: "What is HealthLink?",
					answer: "HealthLink is a platform for managing healthcare benefits.",
				},
				{
					question: "How does USTFU-HealthLink work?",
					answer: "The platform streamlines the process of submitting and tracking health benefit claims.",
				},
			],
		},
		{
			topic: "Claims",
			items: [
				{
					question: "How do I submit a claim?",
					answer: "You can submit a claim through the Application Forms section.",
				},
				{
					question: "How long does claim processing take?",
					answer: "Claims are typically processed within 5-7 business days.",
				},
			],
		},
	],
}));

// Mock Firebase context for component rendering
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
	fullName: "Test User",
	getFormID: vi.fn().mockResolvedValue(123),
	auth: { currentUser: { email: "test@test.com", displayName: "Test User" } },
	app: {},
	storage: {},
	storageRef: {},
	callFunction: vi.fn(),
	currentUser: { uid: "test-user-123", email: "test@test.com" },
};

// Mock contexts
vi.mock("../../src/contexts/firebaseContext", () => ({
	useFirebase: () => firebaseContextValue,
	FirebaseProvider: ({ children }: { children: ReactNode }) => children,
}));

vi.mock("../../src/contexts/userContext", () => ({
	useUser: () => ({
		selectedRole: "member",
		setSelectedRole: vi.fn(),
		availableRoles: ["member"],
		switchRole: vi.fn(),
		loading: false,
		displayName: "Test User",
		photoURL: null,
	}),
	UserProvider: ({ children }: { children: ReactNode }) => children,
}));

// Import component after all mocks are set up
import FAQ from "../../src/components/Pages/FAQPage/FAQ";

describe("FAQ Component", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test("renders FAQ page with questions and categories", async () => {
		render(<FAQ />);

		// Check that the header is displayed
		expect(
			screen.getByText("Frequently Asked Questions")
		).toBeInTheDocument();

		// Check for FAQ search input
		expect(
			screen.getByPlaceholderText("Search FAQs...")
		).toBeInTheDocument();

		// Check that categories are rendered
		expect(screen.getByText("General")).toBeInTheDocument();
		expect(screen.getByText("Claims")).toBeInTheDocument();

		// Check that questions are rendered under their respective categories
		expect(screen.getByText("What is HealthLink?")).toBeInTheDocument();
		expect(
			screen.getByText("How do I submit a claim?")
		).toBeInTheDocument();
	});

	test("expands FAQ when clicked", async () => {
		render(<FAQ />);

		// Find a question
		const question = screen.getByText("What is HealthLink?");

		// Click the question to expand
		fireEvent.click(question);

		// Now the answer should be visible
		await waitFor(() => {
			expect(
				screen.getByText(
					"HealthLink is a platform for managing healthcare benefits."
				)
			).toBeInTheDocument();
		});

		// Click again to collapse
		fireEvent.click(question);

		// Answer should no longer be in the document
		await waitFor(() => {
			const answerElement = screen.queryByText(
				"HealthLink is a platform for managing healthcare benefits."
			);
			expect(answerElement).not.toBeInTheDocument();
		});
	});

	test("filters FAQs when searching", async () => {
		render(<FAQ />);

		// Enter search query
		const searchInput = screen.getByPlaceholderText("Search FAQs...");
		fireEvent.change(searchInput, { target: { value: "claim" } });

		// Check that only matching FAQs are shown
		expect(
			screen.queryByText("What is HealthLink?")
		).not.toBeInTheDocument();
		expect(
			screen.getByText("How do I submit a claim?")
		).toBeInTheDocument();
		expect(
			screen.getByText("How long does claim processing take?")
		).toBeInTheDocument();

		// Verify no results message is not shown when we have results
		expect(
			screen.queryByText(/No results found for/)
		).not.toBeInTheDocument();

		// The category heading "General" should not be visible as a section title
		const generalHeadings = screen
			.queryAllByRole("heading")
			.filter((heading) => heading.textContent === "General");
		expect(generalHeadings.length).toBe(0);
	});

	test("shows no results message when search has no matches", () => {
		render(<FAQ />);

		// Enter search query with no matches
		const searchInput = screen.getByPlaceholderText("Search FAQs...");
		fireEvent.change(searchInput, { target: { value: "noMatch" } });

		// Check for no results message
		expect(
			screen.getByText('No results found for "noMatch"')
		).toBeInTheDocument();
	});

	test("clears search when input is emptied", async () => {
		render(<FAQ />);

		// First verify all questions are visible initially
		expect(screen.getByText("What is HealthLink?")).toBeInTheDocument();
		expect(
			screen.getByText("How do I submit a claim?")
		).toBeInTheDocument();

		// Enter search query
		const searchInput = screen.getByPlaceholderText("Search FAQs...");
		fireEvent.change(searchInput, { target: { value: "claim" } });

		// Check filtered results - non-matching question should be hidden
		await waitFor(() => {
			expect(
				screen.queryByText("What is HealthLink?")
			).not.toBeInTheDocument();
		});

		// Specific claim questions should still be visible
		expect(
			screen.getByText("How do I submit a claim?")
		).toBeInTheDocument();

		// Clear search input
		fireEvent.change(searchInput, { target: { value: "" } });

		// After clearing, all categories and questions should be visible again
		await waitFor(() => {
			// Check for category headings
			const categoryHeadings = screen
				.getAllByRole("heading", { level: 2 })
				.filter((heading) =>
					["General", "Claims"].includes(heading.textContent || "")
				);
			expect(categoryHeadings.length).toBe(2);

			// Check that previously filtered question is now visible again
			expect(screen.getByText("What is HealthLink?")).toBeInTheDocument();
			expect(
				screen.getByText("How do I submit a claim?")
			).toBeInTheDocument();
		});
	});
});
