import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    // No DOM. frames.ts and dayticks.ts touch neither the DOM nor Lit,
    // which is exactly why they are separate modules; card-styles.ts
    // imports Lit but only for its `css` tag, and reading .cssText needs
    // no document.
    //
    // Deliberately NOT jsdom. The card's remaining untested surface is
    // paint order and layout, and jsdom implements neither — it would add
    // a dependency and still not catch the class of bug it looks like it
    // would. card-styles.test.ts asserts the stacking-context contract
    // instead, which is the mechanism those bugs actually turn on.
    environment: "node",
  },
});
