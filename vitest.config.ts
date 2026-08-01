import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    // Pure logic only — frames.ts and dayticks.ts touch neither the DOM
    // nor Lit, which is exactly why they are separate modules.
    environment: "node",
  },
});
