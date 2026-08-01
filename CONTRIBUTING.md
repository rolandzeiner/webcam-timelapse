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
npx tsc --noEmit                                  # card type-check, stricter than Rollup's
npm test                                          # vitest: the pure card logic
npm run build                                     # Rollup bundle
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
comes from `src/` via Rollup — never hand-edit it. Commit the rebuilt bundle
alongside the source change; HACS users never run `npm`.

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
