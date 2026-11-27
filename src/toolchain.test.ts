/**
 * Guards the one hand-maintained pin in package.json.
 *
 * The `vite` override points every Vite consumer at Vite+'s core, so npm
 * installs one Vite instead of hoisting upstream vite next to it. It names
 * an exact core version, and Dependabot bumps `vite-plus` without touching
 * overrides. Left behind, npm would quietly run the new Vite+ CLI on the
 * old core. `vp migrate` moves both together.
 *
 * The expected value is the core the installed vite-plus depends on, not
 * its own version: up to 1.6.0 the two were equal, since 1.7.0 the core
 * follows Vite's numbering (vite-plus 1.8.0 uses core 8.3.8001).
 */
import { describe, expect, it } from "vite-plus/test";
import vitePlus from "vite-plus/package.json";

import pkg from "../package.json";

describe("toolchain pins", () => {
  it("keeps the vite override on the core the installed vite-plus uses", () => {
    expect(pkg.overrides.vite).toBe(vitePlus.dependencies.vite);
  });
});
