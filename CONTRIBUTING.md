# Contributing

## Setup

Python side, using [`uv`](https://docs.astral.sh/uv/):

```bash
uv venv --python 3.14
source .venv/bin/activate
uv pip install -r requirements_test.txt
```

Card side:

```bash
npm install
```

Optionally, the local hooks:

```bash
uv pip install pre-commit
pre-commit install
```

They run the same ruff and mypy that CI does, at the same pinned versions,
plus `actionlint` on any workflow file you touch.

`actionlint` is deliberately **not** in CI. `validate.yml` runs on a nightly
cron, and an unpinned linter shipping a new rule turns the repo red overnight
with no code change — which is exactly what ruff 0.16.0 did in July. As a
hook it costs no CI time and reports while you are still editing the file.
It uses your system binary (`brew install actionlint`); keep the `rev` in
`.pre-commit-config.yaml` equal to `actionlint --version`.

## Verification gate

Everything below must pass before a commit. CI runs the same set, so failing
locally only costs you a push.

```bash
pytest tests/                                     # 90% coverage floor, enforced
mypy --strict --ignore-missing-imports custom_components/webcam_timelapse
ruff check .
ruff format --check .                             # `ruff check` ignores formatting
npx vp check                                      # card format, lint, type-check; the build does not type-check
npm test                                          # vp test: the pure card logic
npm run build                                     # vp build: the card bundle
```

Plus one check on the **oldest** Python this integration supports:

```bash
uv run --python 3.13 --no-project python -m compileall -q custom_components/webcam_timelapse
```

That last one is not redundant. Everything else runs 3.14, so a construct that
parses there but not on the floor leaves ruff, mypy, pytest and hassfest all
green while the integration fails to import for every user below HA 2026.3.

## Two Python versions, deliberately different

| | Version | Where |
|---|---|---|
| **Runtime** — what we develop and test on | 3.14 | `validate.yml` `tests` job, the local venv |
| **Floor** — what the code must still parse on | 3.13 | `pyproject.toml` `target-version`, `compile-floor-python` job |

The floor follows `hacs.json`'s `homeassistant` value (2025.5.0 → Python 3.13).
Raise all three together or none of them.

Do **not** set `target-version` to the CI interpreter. A sibling project did,
and a routine `ruff format` then rewrote `except (A, B):` into 3.14-only
syntax — a hard `SyntaxError` for everyone on an older HA, with fully green CI,
because every check ran 3.14.

## Linter pins

`ruff` and `mypy` are pinned **exact** in `requirements_test.txt`; the
`.pre-commit-config.yaml` revs are hand-synced to match. A floating range lets
an upstream release turn CI red with no code change on your side, which is
vicious on the nightly scheduled run. Pinned, upgrades arrive as a Dependabot
PR whose CI shows the new findings, and you adopt them deliberately.

`pytest-homeassistant-custom-component` stays ranged on purpose — it tracks
HA core, and pinning it would freeze the HA version we test against.

`PyTurboJPEG` is pinned to the exact version HA's `camera` component
requires. It is not a runtime dependency of this integration; it is here
because `homeassistant.components.camera` imports `turbojpeg` at module level,
and the test environment has no manifest-resolution step to install it.

## Architecture notes worth knowing before you edit

**`encode.py` and `frame_store.py` import nothing from `homeassistant`.** That
is structural, not stylistic: everything in them does blocking work (a WebP
encode, `os.scandir`, `unlink`), so every call must go through
`hass.async_add_executor_job`. Keeping the modules HA-free makes an
`await`-less call from async code visible on review rather than only as a
blocking-call warning at runtime.

**Frame filenames are wall-clock grid slots, never derived from upstream
headers.** The card addresses frames densely as `t0 + i * step`, so a frame
must sit exactly on the grid. Naming files after a response's `Last-Modified`
looks equivalent and silently overwrites one file forever against any camera
whose header freezes.

**`unique_id` formulas are frozen.** Changing the entry-level or entity-level
formula wipes every existing install.

**The card bundle is generated.** `custom_components/webcam_timelapse/www/*.js`
comes from `src/` via `vp build` — never hand-edit it. Commit the rebuilt bundle
alongside the source change; HACS users never run `npm`.

`vite.config.ts` is the whole card toolchain, run through
[Vite+](https://viteplus.dev/) (`vp`): `vp build` (Vite library mode on
Rolldown), `vp test` (Vitest) and `vp check` (Oxfmt + Oxlint + type-check).
The only card `devDependency` is `vite-plus`; Vitest, Rolldown and the
type-checker ship inside it, and `typescript` is not installed. Five things in
that file fail silently if you change them:

- The banner must be a **legal** comment (`/*! ... */`) with
  `comments: { legal: true }`, or the minifier strips it.
- **`minify` lives on `rolldownOptions.output`, with `dropConsole: false`.**
  Vite's library mode skips whitespace minification for ES output, so
  `build.minify` alone ships a larger bundle. `dropConsole` is all-or-nothing,
  and the calls it would remove sit in `catch` blocks.
- **Dev vs prod comes from `--mode development`** (`npm run dev`). A plain
  `vp build` is production: minified, no sourcemap.
- **`fmt.embeddedLanguageFormatting` stays `"off"`.** Otherwise Oxfmt
  reformats Lit `html`/`css` templates and changes the whitespace inside
  rendered elements, which is a DOM change, not a style change.
- **Decorators are not configured.** Rolldown reads `tsconfig.json` itself;
  if that regresses, class fields overwrite Lit's accessors and reactivity
  dies while the build stays green.

The `vite` override in `package.json` must name the same version as
`vite-plus`: it keeps npm from installing upstream Vite next to Vite+'s core.
Dependabot bumps `vite-plus` but not the override, and `src/toolchain.test.ts`
fails until both move together. The build does not type-check, so `vp check`
is the only gate between a type error and a shipped bundle.

Card tests live next to the code as `src/**/*.test.ts` and run in plain node
(settings in `vite.config.ts`'s `test` block).

`tsconfig.json`'s `lib` is the card's browser floor. It is `es2023`, so the
card may call ES2023 built-ins such as `toSorted()`, which the bundle does not
polyfill. Raising it raises the browser requirement in the README's Install
section; change both together.

Note the bundle is excluded from the `end-of-file-fixer` / `trailing-whitespace`
pre-commit hooks: Rolldown emits no trailing newline, and a hook that "fixes"
the file *after* the build leaves the committed bundle out of sync with a fresh
one — which `validate.yml` asserts byte-for-byte. `vp check` also runs as a
local pre-commit hook on card source; don't switch to Vite+'s own `vp staged`
hooks, which take over `core.hooksPath` and silently disable ruff and mypy.

**Version sync is byte-identical.** `manifest.json` `version` and
`src/const.ts` `CARD_VERSION` must match; `const.py` derives its value from the
manifest at import. `tests/test_versions.py` enforces the pair. Drift means the
card's version probe sees a mismatch, shows a reload banner, the reload serves
the same JS, and the banner returns — a loop.

## Quality scale

This integration targets **Platinum**. Every change must leave
`custom_components/webcam_timelapse/quality_scale.yaml` at `done` or `exempt`
with a written reason. Four things that break rules silently:

- A bare-string `UpdateFailed` — every raise needs `translation_domain`,
  `translation_key` and placeholders.
- A new entity type without matching entries in `strings.json`,
  `translations/en.json`, `translations/de.json` **and** `icons.json`. All four,
  same commit.
- `_attr_icon = "mdi:..."` anywhere — icons belong in `icons.json`.
- A platform module without `PARALLEL_UPDATES = 0`.

## Branches and releases

Work happens on `dev`. `main` is protected and takes changes only through a
PR from `dev`, with all CI checks green.

Releases: bump `manifest.json` and `src/const.ts` together, rebuild the
bundle, open the PR, merge, then tag from `main`.

## Testing against a live Home Assistant

`scripts/dev-push.sh` rsyncs the integration to a running HA container. After
a push: a card-JS change needs a browser hard-refresh, a Python change needs
an HA restart.

Two harness details that will otherwise cost you an afternoon:

- `pytest-homeassistant-custom-component`'s `hass.config.config_dir` is a
  **fixed directory inside site-packages**, shared across tests and runs. The
  `isolate_frames_dir` fixture redirects the archive to `tmp_path`; without it,
  frames accumulate between tests and retention assertions fail on counts from
  some earlier test.
- The capture tick is dispatched as a **background** task. The default
  `async_block_till_done()` does not await those, so assertions run while the
  encode is still in the executor. Use
  `async_block_till_done(wait_background_tasks=True)`.
