import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";

// Setup React Testing Environment
const originalError = console.error;

// Mock requestAnimationFrame globally
global.requestAnimationFrame = (callback) => {
	return setTimeout(callback, 0);
};

// Mock IntersectionObserver with proper interface implementation
class MockIntersectionObserver implements IntersectionObserver {
	readonly root: Element | Document | null = null;
	readonly rootMargin: string = "0px";
	readonly thresholds: ReadonlyArray<number> = [0];

	/* eslint-disable @typescript-eslint/no-unused-vars */
	constructor(
		_callback: IntersectionObserverCallback,
		_options?: IntersectionObserverInit
	) {}
	/* eslint-enable @typescript-eslint/no-unused-vars */

	observe(): void {}
	unobserve(): void {}
	disconnect(): void {}
	takeRecords(): IntersectionObserverEntry[] {
		return [];
	}
}

// Assign the mock implementation to global
global.IntersectionObserver =
	MockIntersectionObserver as unknown as typeof IntersectionObserver;

// Mock console.error
console.error = (...args) => {
	// Filter out act() warnings
	if (
		args[0]?.includes?.(
			"Warning: The current testing environment is not configured to support act"
		) ||
		args[0]?.includes?.("Warning: You seem to have overlapping act() calls")
	) {
		return;
	}
	originalError(...args);
};

// Cleanup after each test
afterEach(() => {
	cleanup();
});

// Restore console after tests run
afterAll(() => {
	console.error = originalError;
});
