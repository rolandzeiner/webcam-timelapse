# Contributing to Webcam Timelapse

Thanks for taking a look. This repo is a Home Assistant integration with a Lovelace card. Everything you need to work on it is on this page, and the gate in *Verification gate* has to pass before a change lands.

## Quick start

```bash
git clone https://github.com/rolandzeiner/webcam-timelapse.git
cd webcam-timelapse
uv venv --python 3.14 && source .venv/bin/activate
uv pip install -r requirements_test.txt pre-commit
pre-commit install
npm ci && npm run build
```

Before a PR, run the gate in *Verification gate*. It is what CI runs, so failing locally only costs you a push.

## Branching and releases

- Work on `dev`; PRs target `dev`. Nothing is committed or force-pushed to `main`.
- For anything bigger than a fix, open an issue first so the shape is agreed before the code is written.
- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`. A subject line, then bullets that say what changed and why.
- The built bundle is committed and travels with the `src/` change that produced it: users install through the Marketplace and never run `npm`, and CI fails when the committed bundle differs from a fresh build by a byte.
- Releases are the maintainer's: a `dev → main` PR, squash-merged, then a tag from `main`. Publishing the release runs `release.yml`, which attaches `webcam_timelapse.zip`, a flat archive of `custom_components/webcam_timelapse/`. `hacs.json` sets `zip_release`, so the Marketplace downloads that file, and a release without it can't be installed. If the job fails, `gh workflow run release.yml -f tag=vX.Y.Z` re-runs it against the existing tag.
- Contributions are accepted under the repo's MIT licence.

## Python environment

- The project uses [`uv`](https://docs.astral.sh/uv/) for Python environments, the same tool CI installs with (`astral-sh/setup-uv` and `uv pip install --system`), so a gate that passes locally resolves what CI resolves. Plain `python -m venv` and `pip` work too.
- `3.14` is the CI interpreter and what `pytest-homeassistant-custom-component` requires. It is deliberately not the support floor; see *Two Python versions*.
- `pre-commit install` runs ruff, ruff-format, mypy and `vp check` on every commit, plus the whitespace hooks, from which the built bundle is excluded (see *Card toolchain*). It also runs `actionlint` on any workflow file you stage, through your system binary (`brew install actionlint`; keep the `rev` in `.pre-commit-config.yaml` equal to `actionlint --version`). `actionlint` is deliberately not in CI: `validate.yml` runs on a nightly cron, and an unpinned linter shipping a new rule would turn the repo red overnight with no code change. As a hook it costs no CI time and reports while you are still editing the file.
- A venv built months ago drifts from `requirements_test.txt`. Re-run `uv pip install -U -r requirements_test.txt` after a pin bump and whenever you come back to the repo; the `-U` is what moves a floating range such as PHACC's.
- `requirements_test.txt` carries its own rules in its header comment: PHACC governs the test stack, and nothing it pins is declared again.
- `custom_components/webcam_timelapse/_dev_fixture.py` is gitignored and the `no-dev-fixture` CI job fails if it ever lands. It injects synthetic data for local card work.

## Two Python versions

Every change has to respect both, and conflating them has shipped a broken release in this portfolio.

| Axis | Version | Where it is declared |
|---|---|---|
| **Runtime**: what we develop and test on | 3.14 | `validate.yml` `tests` job, your local venv |
| **Floor**: the oldest Python we must still run on | 3.13 | `pyproject.toml` `[tool.ruff] target-version`, the `compile-floor-python` CI job |

The floor is whatever `hacs.json`'s `homeassistant` value requires. HA 2025.5.0 declares `REQUIRED_PYTHON_VER = (3, 13, …)`, which you can check rather than remember:

```bash
gh api "repos/home-assistant/core/contents/homeassistant/const.py?ref=2025.5.0" \
  --jq .content | base64 -d | grep REQUIRED_PYTHON_VER
```

Setting `target-version` to the CI interpreter lets `ruff format` emit syntax the floor cannot parse and then stay silent about it; that is how a sibling once shipped a `SyntaxError` with green CI, because every check ran on the newer interpreter. Raise the floor only by changing all three declarations in one commit, plus the README's requirement line and badge.

## Card toolchain

The card lives in `src/` and builds to `custom_components/webcam_timelapse/www/webcam-timelapse-card.js`. Its whole toolchain runs through [Vite+](https://viteplus.dev/) (`vp`), configured in `vite.config.ts`: `vp build` (Vite library mode on Rolldown), `vp test` (Vitest) and `vp check` (Oxfmt, Oxlint and the type-check). The only card `devDependencies` are `vite-plus` and `happy-dom`; Vitest, Rolldown and the type-checker ship inside `vite-plus`, and `typescript` is not installed. `npx vp` runs the copy in `node_modules`; a global `vp` works too.

| Command | What it does |
|---|---|
| `npm run dev` | Watches `src/` and rebuilds the bundle on save, with a sourcemap (`--mode development`). |
| `npm run build` | Production build into `www/`. |
| `npm test` | `vp test run`: the card suites. |
| `npm run check` | `vp check`: Oxfmt, Oxlint and the type-check. `npx vp check --fix` rewrites what it can. |

Node 24.11 or newer (26 works too) and npm 11.

Commit the built bundle. End users install through the Marketplace and never run `npm`, so `custom_components/webcam_timelapse/www/webcam-timelapse-card.js` is tracked. CI asserts the committed bundle matches a fresh build byte for byte; a stale bundle is the infinite reload-banner bug. A dev build writes a `.map` file next to it; it is gitignored.

Things in `vite.config.ts` that fail silently if you change them:

- The banner must be a **legal** comment, `/*! ... */`, with `comments: { legal: true }`. The minifier strips a `//` banner without a word; only the built file's first bytes show it.
- **`minify` lives on `rolldownOptions.output`, with `dropConsole: false`.** Vite's library mode skips whitespace minification for ES output, so `build.minify` alone ships the bundle with its whitespace left in. `dropConsole` is all-or-nothing, and the `console.*` calls here sit in `catch` blocks, where dropping them turns a caught error into a silent one.
- **Dev vs prod comes from `--mode development`** (`npm run dev`). A plain `vp build` is production: minified, no sourcemap.
- **`fmt.embeddedLanguageFormatting` stays `"off"`.** Otherwise Oxfmt reformats Lit `html` and `css` templates and changes the whitespace inside rendered elements, which is a DOM change, not a style change.
- **Decorators are not configured.** Rolldown reads `tsconfig.json` itself and enables Lit's legacy decorators from it. If that ever regresses, class fields overwrite Lit's accessors and reactivity dies while the build stays green; the three DOM suites that mount the card (see *Tests*) stop passing.
- **`lint.plugins` replaces Oxlint's defaults.** It names `typescript`, `unicorn` and `oxc` next to `vitest`; drop one and its rules stop running without a word. The `vitest/*` rules fail a committed `.only` or `.skip`, a test without an assertion, a duplicate title, an `expect` inside an `if` and a bare `toThrow()`, and `reportUnusedDisableDirectives` fails a disable comment that no longer suppresses anything.
- **`lint.options.denyWarnings: true`.** Without it `vp check` exits 0 on warnings, and CI and pre-commit let them through.
- **`codeSplitting: false`.** The card is one file; a dashboard resource can't load a second chunk the bundler decided on. The editor is eagerly imported and inlined by it.
- **`emptyOutDir: false`.** Vite empties the output directory before each build by default, and `www/` sits inside the integration package.

The `vite` override in `package.json` must name the same version as `vite-plus`. It keeps npm from installing upstream Vite next to Vite+'s core. Dependabot bumps `vite-plus` but not the override, and `src/toolchain.test.ts` fails until both match. Bump with `npx --package=vite-plus@<new> vp migrate --no-interactive`, which moves both; `npm install vite-plus@<new>` fails with ERESOLVE.

The build does not type-check. `vp check` is the only thing between a type error and a green build, which is why the gate runs it as its own step. It also catches a backtick inside a Lit `css` or `html` template, comments included, which ends the template early and fails the card at load while the build stays green.

The bundle is excluded from the `end-of-file-fixer` and `trailing-whitespace` hooks: the bundler emits no trailing newline, and a hook that fixes the file after the build leaves it out of sync with a fresh one, which CI asserts byte for byte. `vp check` runs as a local hook on card source; don't switch to Vite+'s own `vp staged` hooks, which take over `core.hooksPath` and silently disable ruff and mypy.

`tsconfig.json`'s `lib` is the card's browser floor: ES2023. The card may call ES2023 built-ins such as `toSorted()`, which the bundle does not polyfill, and `deflicker.ts` and `overlay-history.ts` do. Raising it raises the browser requirement in the README's Requirements section; change both together.

### Trying it in Home Assistant

Copy `custom_components/webcam_timelapse/` into your Home Assistant config's `custom_components/` and restart Home Assistant. After a card change, copy the rebuilt `www/` file the same way and hard-refresh the browser: the resource URL only changes with the version.

## Verification gate

```bash
# Python
pytest tests/ -v
mypy --strict --ignore-missing-imports custom_components/webcam_timelapse
ruff check .
ruff format --check .                     # separate: `ruff check` never inspects formatting

# The oldest Python we support, derived from pyproject.toml, never hardcoded
FLOOR=$(sed -n 's/^target-version = "py3\([0-9]*\)"/3.\1/p' pyproject.toml)
uv run --python "$FLOOR" --no-project python -m compileall -q custom_components/webcam_timelapse

# Card
npx vp check                              # format, lint and the only type-check
npm test                                  # vp test run
npm run build                             # commit the rebuilt bundle with the src/ change
git diff --exit-code -- custom_components/webcam_timelapse/www/*.js
node -c custom_components/webcam_timelapse/www/webcam-timelapse-card.js
```

CI runs the same checks plus hassfest, HACS validation, `npm audit --omit=dev --audit-level=high`, a check that the committed bundle matches a fresh build, the dev-fixture guard and CodeQL. Failing locally only costs you a push.

Two of these are easy to skip and expensive to skip:

- **`ruff format --check`** is separate from `ruff check`, which never inspects formatting. Without it the formatter drifts silently until someone runs it.
- **`npx vp check`** is the only type-check anywhere. The build strips types without checking them, so a type error builds cleanly all the way to a shipped bundle.

**Keep `--no-project`** on the `compileall` line. Without it `uv` treats the repo root as a project, finds no `requires-python`, and rebuilds `.venv` on the floor interpreter, taking every tool in it along. Recover with `uv venv --clear --python 3.14 && uv pip install -r requirements_test.txt pre-commit`.

## Tests

**Python.** `pytest tests/` runs on `pytest-homeassistant-custom-component`. `tests/conftest.py` holds what a new test starts from: `make_jpeg()` renders a synthetic frame, `make_entry()` and `setup_entry()` build and load a config entry, `write_frames()` and `grid_slots()` fill an archive on the capture grid, `install_ffmpeg()` and the `ffmpeg` fixture put a few lines of Python where the exporter expects the binary, and four autouse fixtures are on in every test (`auto_enable_custom_integrations`, `mock_aiohttp_session`, `isolate_frames_dir` and `no_deprecated_ha_api`). `test_frame_store.py`, `test_encode.py`, `test_overlay.py` and `test_deflicker.py` run without the HA harness, because the modules they test import nothing from Home Assistant (see *Home Assistant conventions*). `test_overlay.py` and `test_deflicker.py` carry the same cases as `src/overlay-history.test.ts` and `src/deflicker.test.ts`, since the Python ports must agree with the card. `test_export.py` drives the exporter against the ffmpeg stand-in; one test uses the real binary and is skipped where it is not installed. `test_export_history.py` is the one file that runs against a real recorder. `test_versions.py` pins the version pair and the User-Agent. The harness traps that cost an afternoon:

- `pytest-homeassistant-custom-component`'s `hass.config.config_dir` is a fixed directory inside site-packages, shared across tests and runs. The autouse `isolate_frames_dir` fixture redirects the archive to `tmp_path`; without it, frames accumulate between tests and retention assertions fail on counts from some earlier test.
- The capture tick is dispatched as a background task. The default `async_block_till_done()` does not await those, so assertions run while the encode is still in the executor. Use `async_block_till_done(wait_background_tasks=True)`.
- The autouse `no_deprecated_ha_api` fixture fails any test that trips Home Assistant's deprecation channel, in both of HA's message shapes. A test that exercises a deprecated API on purpose takes `@pytest.mark.allow_deprecated_ha_api`; don't weaken the fixture.
- Unknown markers fail the run (`strict_markers`), a hung fixture fails after 15 s, and a `DeprecationWarning` reached through our own code is an error (`pytest.ini` says which libraries are exempt and how to add one).

**Card.** The suites sit beside the sources as `src/**/*.test.ts` and import from `vite-plus/test`, not `vitest`. Most run in plain Node and cover the pure modules: `frames.test.ts` (slot, time and URL maths, gaps, preloading), `dayticks.test.ts` and `sun.test.ts` (the marks under the scrubber), `deflicker.test.ts`, `overlay-history.test.ts`, `overlay-groups.test.ts` and `sparkline.test.ts` (the readings overlay), `export.test.ts` (range, crop and size maths for the video export), `config.test.ts` and `editor-fields.test.ts` (the defaults the editor shows and saves), `coalesce.test.ts` (latest-wins serialisation), `localize.test.ts` (key parity between the language packs) and `card-styles.test.ts` (the gated grid-cell rules and the stacking-context contract, checked on the stylesheet text, since Node does no layout). `editor.test.ts` and `sparkline.test.ts` read source files through Vite's `?raw` suffix to pin a contract the type-checker can't. Three suites need a DOM and opt in with a `@vitest-environment happy-dom` line in the file's leading comment: `card-render.test.ts` mounts the card (the fixed-height class, the missing-entity warnings), `card-refresh.test.ts` covers the frame-index poll stopping and restarting with the card, and `shared-render.test.ts` the WebSocket version probe and the reload banner. `toolchain.test.ts` pins the `vite` override named in *Card toolchain*.

- The HA components the card and editor host (`ha-card`, `ha-form`, `ha-icon`, `ha-alert`) are deliberately never defined in tests. An undefined element is inert, Lit renders straight through it, and not stubbing them is what keeps this layer free of a test harness.
- happy-dom lays nothing out and paints nothing, so paint order, layout and the picture itself are checked on the stylesheet text or left to a browser.

A change to what the card does comes with a test that fails without it.

### Coverage

`pytest.ini` enforces `--cov-fail-under=90` on the package total; `pytest tests/ --cov-report=term-missing` gives the per-file view. The card side has no gate and the provider is not a dependency. To see which branches a change left unexercised, install it for one run at the Vitest version Vite+ bundles:

```bash
V=$(npx vp toolchain vitest | grep -oE 'vitest@[0-9.]+' | head -1 | cut -d@ -f2)
npm i --no-save @vitest/coverage-v8@"$V"
npx vp test run --coverage --coverage.provider=v8 --coverage.reporter=text \
  '--coverage.include=src/**/*.ts' '--coverage.exclude=src/**/*.test.ts'
```

`--no-save` leaves `package.json` and the lockfile alone; the next `npm ci` removes the provider.

## Version sync

`manifest.json` `version` and `src/const.ts` `CARD_VERSION` must match byte for byte. `const.py` derives its value from the manifest at import, so the Python side needs no edit, and `tests/test_versions.py` enforces the pair. The failure mode: the card's version check sees a mismatch, shows the reload banner, the reload re-serves the same bundle, and the banner comes back, for every user. A bump edits both files, rebuilds the bundle and commits all three together. Neither carries a `-beta` suffix: a pre-release has the final release's number and GitHub's pre-release flag. The README badge reads the latest release tag and needs no edit.

## Dependencies

| Package | Pin | Why |
|---|---|---|
| `ruff`, `mypy` | exact, `requirements_test.txt` | CI runs nightly; a floating linter turns the build red with no code change. The `rev:` in `.pre-commit-config.yaml` must match; check both tools when bumping either. |
| `pytest-homeassistant-custom-component` | `>=` floor with a `<` cap | it tracks HA core; pinning it would freeze the HA version tested against |
| `PyTurboJPEG` | exact, `requirements_test.txt` | not a dependency of the integration: `homeassistant.components.camera` imports `turbojpeg` at module level, and the test environment has no manifest-resolution step to install it. The pin equals what HA core's `camera` manifest requires, so the tests run the decoder users run, not the newest one. Dependabot is told to ignore it; raise it only when HA core does. |
| `vite-plus` | exact, `package.json` | it decides what the committed bundle looks like; the `vite` override names the same version |
| `happy-dom` | exact | it decides what the DOM suites see; the siblings keep one version |
| `lit` | caret | maintained, keeps semver |

- **Dependabot's blind spots.** It bumps the `requirements_test.txt` pin and leaves the hook `rev` alone (it is told to); it bumps `vite-plus` and leaves the override alone. The toolchain test catches the second; nothing catches the first except reading both files.
- **Runtime vs dev.** What the build inlines into the bundle is a `dependency`; a build-time tool is a `devDependency` even though the build needs it. CI's `npm audit --omit=dev` only means something because of that split.
- **Adding a dependency.** The bundle loads on every dashboard, so a new runtime dependency is discussed in an issue first; today the card has `lit` alone. Its licence must be compatible with MIT and its notice must survive the build (`comments: { legal: true }` keeps the `@license` comments). Prefer vendoring a few constants with a provenance comment over depending on a package that exports thousands.

## Translations

Adding or changing a user-visible string means touching four files together: `strings.json`, `translations/en.json`, `translations/de.json`, and `icons.json` for a new entity. hassfest checks the keys in CI, and the German copy uses **du**, never **Sie**.

The card's strings live in `src/localize/languages/{de,en}.json`. `src/localize/localize.ts` default-imports each pack (`import de from "./languages/de.json"`; a namespace import exposes each key as a named export, and a key that is a reserved word such as `export` then goes missing without an error), resolves the language from the card config first, then Home Assistant's, then English, and falls back to English for a missing key. `src/localize/localize.test.ts` compares the packs' keys. A new language is a pack beside `en.json` with the same keys, imported and added to the `languages` record the same way.

## Home Assistant conventions

- Every `UpdateFailed` and `ConfigEntryNotReady` carries `translation_domain`, `translation_key` and placeholders; never a bare string.
- Icons live in `icons.json`; `_attr_icon = "mdi:…"` appears nowhere.
- Every platform module sets `PARALLEL_UPDATES = 0`.
- `encode.py`, `frame_store.py`, `overlay.py` and `deflicker.py` import nothing from `homeassistant`. That is structural, not stylistic: everything in them does blocking work (a WebP encode, `os.scandir`, `unlink`, drawing on a decoded frame), so every call must go through `hass.async_add_executor_job`. Keeping the modules HA-free makes an `await`-less call from async code visible on review rather than only as a blocking-call warning at runtime.
- Frame filenames are wall-clock grid slots, never derived from upstream headers. The card addresses frames densely as `t0 + i * step`, so a frame must sit exactly on the grid. Naming files after a response's `Last-Modified` looks equivalent and silently overwrites one file forever against any camera whose header freezes.
- The `USER_AGENT` constant goes on every outbound fetch; `tests/test_capture.py` checks it. The capture interval is the user's, so there is no poll floor to protect; what the integration owes the camera is one request per grid slot and no retry storm when it is down.
- ffmpeg and the recorder are soft dependencies of the export. Both are in `after_dependencies` and neither is imported at module level (the recorder imports sit inside `export.py`'s history step, with the reason beside them), so an install without them still loads and only the export reports the gap.
- `unique_id` formulas are frozen: changing one wipes every existing install.
- Diagnostics redact the fields in `TO_REDACT` in `diagnostics.py`: credentials, tokens and request headers; the set only grows. Test payloads are synthetic: never a real camera address or credential, not even in a fixture.

## Where things are

| Module | Owns |
|---|---|
| `capture.py` | Fetching one still frame from the camera URL, and the freeze detection that stops a stuck camera from filling the archive with one picture. |
| `coordinator.py` | The capture grid, scheduling each tick, pruning, teardown. |
| `frame_store.py` | The on-disk archive: paths, atomic writes, scanning, pruning and the run-length-encoded index. HA-free. |
| `encode.py` | WebP encoding of a captured frame. HA-free. |
| `lights.py` | Switching lights on for the moment of capture and back off after, without stealing a lamp somebody turned on. |
| `export.py` | Rendering a stretch of the archive to an MP4 through ffmpeg: picking frames, the overlay, cleanup. |
| `overlay.py`, `deflicker.py` | The Python ports of `src/overlay-history.ts`, `src/sparkline.ts` and `src/deflicker.ts`, so a reading burned into an exported frame matches what the card shows for it. HA-free. |
| `websocket.py` | The WebSocket API: the frame index, the luma series, the export commands and the card-version probe. |
| `views.py` | The authenticated HTTP view the card fetches frames from. Never a static path: those skip authentication. |
| `camera.py`, `sensor.py`, `binary_sensor.py`, `entity.py` | The camera entity, the sensors, the connectivity flag and their shared base. |
| `config_flow.py`, `services.py`, `diagnostics.py`, `card_registration.py`, `__init__.py` | The user, reconfigure, options and reauth flows; the capture-now, pause, resume, purge and export services; diagnostics; the Lovelace resource registration; the domain setup. |
| `src/webcam-timelapse-card.ts`, `src/card-styles.ts` | The card and its styles: scrubbing, playback, the overlay, the export panel. |
| `src/editor.ts`, `src/editor-fields.ts` | The `ha-form` editor and, as plain data, what it shows. |
| `src/config.ts` | One table of defaults, shared by the card and its editor. |
| `src/frames.ts`, `src/dayticks.ts`, `src/sun.ts` | Frame-index maths, fetching archived frames through `views.py` into object URLs, and the marks under the scrubber. |
| `src/overlay-history.ts`, `src/overlay-groups.ts`, `src/sparkline.ts`, `src/deflicker.ts` | The readings overlay and the brightness smoothing. |
| `src/export.ts` | Everything about the video export that needs no DOM. |
| `src/coalesce.ts`, `src/shared-render.ts`, `src/utils.ts` | Latest-wins serialisation for the frame swap; the version banner and cache-wipe reload; small shared helpers. |
| `src/localize/` | The card strings. |

Change one side of a ported module and change the other in the same commit; the Python tests carry the same cases as the TypeScript ones for that reason.

### Adding a card option

Add the key to `WebcamTimelapseCardConfig` in `src/types.ts`, its default to `DEFAULTS` in `src/config.ts`, and a field to `TOP_FIELDS` or one of the `GROUP_FIELDS` in `src/editor-fields.ts`, with an `editor.*` label in both language packs. `config.test.ts` pins the defaults and `editor-fields.test.ts` what the editor shows for the key.

## The overlay font

The overlay's font, DejaVu Sans, is bundled in `custom_components/webcam_timelapse/fonts/` with its licence: Pillow's built-in face has no umlauts, `µ` or superscripts, and a Home Assistant container ships no system fonts. It is subset to Latin, Greek, Cyrillic and the common symbols, which keeps it under the `check-added-large-files` limit. To regenerate it from the full DejaVu Sans:

```bash
pyftsubset DejaVuSans.ttf --output-file=custom_components/webcam_timelapse/fonts/DejaVuSans.ttf \
  --unicodes="U+0020-007E,U+00A0-024F,U+0370-03FF,U+0400-04FF,U+2000-206F,U+2070-209F,U+20A0-20CF,U+2100-218F,U+2190-21FF,U+2200-22FF,U+25A0-25FF,U+FFFD" \
  --layout-features='*' --name-IDs='*' --name-languages='*' --notdef-outline --glyph-names
```

## Style

- TypeScript strict; the `tsconfig.json` flags are not negotiable, and `vp check` reports no warnings (`denyWarnings`).
- Comments say why, not what; identifiers carry the what.
- The browser floor is ES2023, so `toSorted()` and its siblings are fine. Imports carry no extension; the bundler resolves them.
- Runtime dependencies are `lit` alone; adding one goes through *Dependencies*.
- Python: `pyproject.toml` is the source of truth for ruff, mypy and coverage; change rules there, never in CI flags or hook args. A rule that is noise in tests goes into `per-file-ignores`, not off.
- German copy uses du.

## Reporting issues

Open an issue with:

- your Home Assistant version and the Webcam Timelapse version
- the diagnostics download: **Settings → Devices & services → Webcam Timelapse** → ⋮ → **Download diagnostics**. Credentials, tokens and request headers are redacted before the file is written.
- the steps to reproduce, and the log lines from `custom_components.webcam_timelapse`

A security problem goes through **Report a vulnerability** under the repository's **Security** tab, not a public issue.
