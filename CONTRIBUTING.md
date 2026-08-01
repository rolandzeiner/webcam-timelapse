# Contributing to Skill Demo Austria

This is a **showcase** integration — its primary purpose is to exercise
the scaffolding patterns used across the author's portfolio of
`*-austria` HACS integrations. PRs are welcome, but the scope is
deliberately narrow:

- **In scope**: bug fixes, dependency bumps, tightening the Quality
  Scale annotations, improvements that make the showcase faithfully
  represent current best practice.
- **Out of scope**: new domains, real upstream APIs, anything that turns
  this into a production-grade integration rather than a demonstration
  of patterns. If you need a real API, fork this repo as a starting
  point.

## Local setup

```bash
git clone git@github.com:rolandzeiner/skill-demo-austria.git
cd skill-demo-austria

# Python — requires Python 3.14+ (HA core 2026.5 floor).
python3.14 -m venv .venv
.venv/bin/pip install -r requirements_test.txt

# Card bundle.
npm install
npm run build
```

## The verification gate

Every PR must pass:

```bash
.venv/bin/ruff check .
.venv/bin/mypy --strict --ignore-missing-imports custom_components/skill_demo_austria
.venv/bin/pytest tests/ -v
npm run build
node -c custom_components/skill_demo_austria/www/skill-demo-austria-card.js
```

CI runs these (plus hassfest and HACS validate) on every push.

## Version bumps

The Python and TypeScript card versions must stay in lockstep:

1. Bump `custom_components/skill_demo_austria/manifest.json` `version`.
2. Bump `src/const.ts` `CARD_VERSION` to the same string.
3. `tests/test_card_version.py` enforces the parity — run it locally
   before pushing.

## Commit style

Match the existing log shape: `chore:` / `feat:` / `fix:` / `docs:` /
`ci:` prefixes, imperative mood, no period.

```
feat(card): add status pip backed by the online binary sensor
```

Co-Authored-By trailers are fine. Squash-merge from PR.
