import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "jsdom",
		setupFiles: ["./src/tests/setup.ts"], // Add the setup file here
		globals: true,
		css: true,
	},
});
