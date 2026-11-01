// One config for the whole card toolchain under Vite+ (`vp`): build (Vite 8
// library mode on Rolldown), test (Vitest), lint + type-check (Oxlint with
// tsgolint) and format (Oxfmt). Replaces rolldown.config.mjs and
// vitest.config.ts.
//
// Decorators are deliberately not configured here. Rolldown reads
// tsconfig.json itself and turns on Lit's legacy (experimental) decorators
// from it.
import { defineConfig } from "vite-plus";

// MUST be a legal comment — `/*! ... */` — not `//`. The minifier strips
// ordinary comments including a `//` banner, silently. `comments: { legal:
// true }` below is the other half of the same requirement.
const banner =
  "/*! Webcam Timelapse Card — bundled by Rolldown. Edit sources in src/, then `npm run build`. */";

// Dev vs prod comes from Vite's mode, not from a watch env var: `npm run dev`
// passes `--mode development`, a plain `vp build` is production.
export default defineConfig(({ mode }) => {
  const dev = mode === "development";
  return {
    build: {
      // Library mode: one ES module, no index.html, no hashed file name.
      lib: {
        entry: "src/webcam-timelapse-card.ts",
        formats: ["es"],
        fileName: () => "webcam-timelapse-card.js",
      },
      outDir: "custom_components/webcam_timelapse/www",
      // www/ sits inside the integration package; never let Vite wipe it.
      emptyOutDir: false,
      copyPublicDir: false,
      target: "es2022",
      sourcemap: dev,
      rolldownOptions: {
        output: {
          banner,
          // HACS users get a single .js file, not a chunked dist/. The
          // editor's dynamic import (getConfigElement) is inlined.
          codeSplitting: false,
          comments: { legal: true },
          // Set on the Rolldown output, not `build.minify`: Vite's library
          // mode skips whitespace minification for ES output. Keep console.*
          // (dropConsole: false): the cards' console calls are their only
          // client-side failure signal, and the console.info banner shows
          // which bundle loaded. Rolldown's dropConsole is all-or-nothing.
          minify: dev ? false : { compress: { dropConsole: false }, mangle: true, codegen: true },
        },
      },
    },
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
      //
      // A suite that does need a DOM (clicking a rendered button) opts in
      // per file with an `@vitest-environment happy-dom` docblock, as
      // shared-render.test.ts does; the default stays node.
      environment: "node",
    },
    fmt: {
      // Leave Lit html/css templates alone. Formatting them rewrites the
      // whitespace inside rendered elements, which changes the DOM.
      embeddedLanguageFormatting: "off",
      // Format the card source only. The bundle is build output; Markdown,
      // YAML and TOML keep their hand formatting.
      ignorePatterns: [
        "custom_components/**",
        "**/*.md",
        ".github/**",
        "*.toml",
        "**/__snapshots__/**",
      ],
    },
    lint: {
      ignorePatterns: ["custom_components/**/www/**"],
      // Oxlint's default plugins plus vitest; listing plugins replaces the
      // defaults, so all four are named.
      plugins: ["typescript", "unicorn", "oxc", "vitest"],
      jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
      rules: {
        "vite-plus/prefer-vite-plus-imports": "error",
        // Opt-in rules from the `suspicious` category; the rest of that
        // category is mostly noise for Lit code (e.g. `_private` names).
        "typescript/no-unnecessary-type-assertion": "error",
        "eslint/no-shadow": "error",
        "unicorn/no-array-sort": "error",
        // Test hygiene: a committed .only / .skip, a test without an
        // assertion, a duplicate title, a conditional or stray expect,
        // commented-out tests.
        "vitest/no-focused-tests": "error",
        "vitest/no-disabled-tests": "error",
        "vitest/no-identical-title": "error",
        "vitest/expect-expect": "error",
        "vitest/no-standalone-expect": "error",
        "vitest/no-conditional-expect": "error",
        "vitest/no-commented-out-tests": "error",
        "vitest/valid-title": "error",
        // expect(value, message) is Vitest API; the default of one
        // argument is Jest's.
        "vitest/valid-expect": ["error", { maxArgs: 2 }],
        // Untyped vi.fn() is fine here; the typed form buys nothing in
        // these suites.
        "vitest/require-mock-type-parameters": "off",
      },
      // typeCheck makes `vp check` report tsc's errors (strict tsconfig
      // included), so it can stand in for `tsc --noEmit`.
      // denyWarnings: a warning fails `vp check` (and CI) instead of
      // scrolling past with exit 0.
      // reportUnusedDisableDirectives: a stale oxlint-disable comment fails
      // instead of hiding the next problem.
      options: {
        typeAware: true,
        typeCheck: true,
        denyWarnings: true,
        reportUnusedDisableDirectives: "error",
      },
    },
  };
});
