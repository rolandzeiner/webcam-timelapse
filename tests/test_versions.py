"""Version-identity tests.

The card bundle hard-codes its version at build time, so three files have
to agree: manifest.json (HACS's source of truth), const.py (Python side),
and src/const.ts (the bundle). const.py aliases CARD_VERSION to the
manifest, which collapses that to a single pair worth checking — but it is
exactly the pair a release commit can forget.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

from custom_components.webcam_timelapse.const import (
    CARD_VERSION,
    DOMAIN,
    INTEGRATION_VERSION,
    USER_AGENT,
)

REPO_ROOT = Path(__file__).resolve().parents[1]
COMPONENT = REPO_ROOT / "custom_components" / "webcam_timelapse"


def test_integration_version_comes_from_the_manifest() -> None:
    manifest = json.loads((COMPONENT / "manifest.json").read_text(encoding="utf-8"))
    assert INTEGRATION_VERSION == manifest["version"]


def test_card_version_matches_the_typescript_bundle() -> None:
    """src/const.ts must declare the same version as the manifest.

    The word boundary on both sides matters: a bare `CARD_VERSION` would
    also match inside a future `RETRO_CARD_VERSION`, and the test would
    then pass while asserting against the wrong constant.
    """
    source = (REPO_ROOT / "src" / "const.ts").read_text(encoding="utf-8")
    match = re.search(r"\bCARD_VERSION\b\s*=\s*[\"']([^\"']+)[\"']", source)

    assert match is not None, "CARD_VERSION not found in src/const.ts"
    assert match.group(1) == CARD_VERSION


def test_user_agent_shape() -> None:
    """RFC-9110 product tokens plus a contact comment.

    A camera operator who sees this integration in their access log should
    be able to reach the project without guessing.
    """
    assert USER_AGENT.startswith("HomeAssistant/")
    assert f"{DOMAIN}/{INTEGRATION_VERSION}" in USER_AGENT
    assert "(+https://github.com/rolandzeiner/webcam-timelapse)" in USER_AGENT


def test_manifest_key_order_and_required_keys() -> None:
    """hassfest enforces domain + name first, then strict alphabetical."""
    raw = (COMPONENT / "manifest.json").read_text(encoding="utf-8")
    keys = list(json.loads(raw).keys())

    assert keys[0] == "domain"
    assert keys[1] == "name"
    assert keys[2:] == sorted(keys[2:])
    # Custom integrations must NOT declare a minimum HA version here —
    # hassfest rejects it. It lives in hacs.json instead.
    assert "homeassistant" not in keys


def test_hacs_json_shape() -> None:
    """No `country`: this tool is not country-scoped, unlike the siblings."""
    hacs = json.loads((REPO_ROOT / "hacs.json").read_text(encoding="utf-8"))

    assert hacs["name"] == "Webcam Timelapse"
    assert "country" not in hacs
    assert re.fullmatch(r"\d{4}\.\d{1,2}\.\d+", hacs["homeassistant"])
