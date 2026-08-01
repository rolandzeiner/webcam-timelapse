"""Config flow for Webcam Timelapse."""

from __future__ import annotations

import hashlib
import logging
from collections.abc import Mapping
from typing import Any
from urllib.parse import urlparse

import aiohttp
import voluptuous as vol
from homeassistant.config_entries import (
    ConfigEntry,
    ConfigFlow,
    ConfigFlowResult,
    OptionsFlow,
)
from homeassistant.const import (
    CONF_NAME,
    CONF_PASSWORD,
    CONF_URL,
    CONF_USERNAME,
    CONF_VERIFY_SSL,
)
from homeassistant.core import HomeAssistant, callback
from homeassistant.data_entry_flow import section
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.selector import (
    BooleanSelector,
    NumberSelector,
    NumberSelectorConfig,
    NumberSelectorMode,
    SelectSelector,
    SelectSelectorConfig,
    SelectSelectorMode,
    TextSelector,
    TextSelectorConfig,
    TextSelectorType,
)

from .capture import request_headers
from .const import (
    ALLOWED_CAPTURE_INTERVALS,
    ALLOWED_MAX_WIDTHS,
    CONF_CAPTURE_INTERVAL,
    CONF_FRAMES_PATH,
    CONF_LIVE_REFRESH,
    CONF_MAX_WIDTH,
    CONF_QUALITY,
    CONF_RETENTION_DAYS,
    DEFAULT_CAPTURE_INTERVAL,
    DEFAULT_LIVE_REFRESH,
    DEFAULT_MAX_WIDTH,
    DEFAULT_NAME,
    DEFAULT_QUALITY,
    DEFAULT_RETENTION_DAYS,
    DOMAIN,
    FETCH_TIMEOUT_SECONDS,
    MAX_LIVE_REFRESH,
    MAX_QUALITY,
    MAX_RETENTION_DAYS,
    MIN_LIVE_REFRESH,
    MIN_QUALITY,
    MIN_RETENTION_DAYS,
    USER_AGENT,
)

_LOGGER = logging.getLogger(__name__)

# Expert options live in a collapsed section rather than behind
# `show_advanced_options` — that toggle is deprecated as of HA 2026.6.
_ADVANCED = "advanced"

_ADVANCED_KEYS = (
    CONF_MAX_WIDTH,
    CONF_QUALITY,
    CONF_LIVE_REFRESH,
    CONF_FRAMES_PATH,
    CONF_VERIFY_SSL,
    CONF_USERNAME,
    CONF_PASSWORD,
)


async def async_probe_url(
    hass: HomeAssistant,
    url: str,
    *,
    username: str | None = None,
    password: str | None = None,
    verify_ssl: bool = True,
) -> str | None:
    """Try the URL once. Returns an error key, or None on success.

    Satisfies the `test-before-configure` rule, and catches the two
    mistakes users actually make: a typo'd host, and a URL that returns a
    login page or an HTML error with a 200.
    """
    session = async_get_clientsession(hass)
    headers = request_headers(USER_AGENT)
    if username:
        headers["Authorization"] = aiohttp.encode_basic_auth(username, password or "")
    timeout = aiohttp.ClientTimeout(total=FETCH_TIMEOUT_SECONDS)

    try:
        response = await session.get(
            url, headers=headers, timeout=timeout, ssl=verify_ssl
        )
        async with response:
            if response.status in (401, 403):
                return "invalid_auth"
            response.raise_for_status()
            content_type = (
                response.headers.get("Content-Type", "").split(";")[0].strip()
            )
            if content_type and not content_type.startswith("image/"):
                return "not_an_image"
    except TimeoutError:
        return "timeout"
    except (aiohttp.ClientError, OSError):
        return "cannot_connect"

    return None


def validate_url(raw: str) -> str | None:
    """Return an error key if the URL is unusable, else None."""
    parsed = urlparse(raw.strip())
    if parsed.scheme not in ("http", "https"):
        # Anything else (file://, ftp://) would either fail later in an
        # obscure way or, worse, read from the HA host's filesystem.
        return "invalid_scheme"
    if not parsed.netloc:
        return "invalid_url"
    return None


def compute_unique_id(url: str) -> str:
    """Stable unique_id. NEVER CHANGE after v0.1.0 — installs are keyed by it.

    Keyed on the image URL rather than the name (renameable) or the
    entry_id (not stable across a remove/re-add), so configuring the same
    camera twice aborts instead of silently interleaving two archives.

    SHA-256, not Python's ``hash()``: per PEP 456 str hashes are
    randomised per process, so a built-in hash would change on every HA
    restart and never match.
    """
    return hashlib.sha256(url.encode("utf-8")).hexdigest()[:16]


def flatten(user_input: dict[str, Any]) -> dict[str, Any]:
    """Merge the collapsed advanced section back up to the top level."""
    flat = dict(user_input)
    flat.update(flat.pop(_ADVANCED, {}) or {})
    return flat


def _build_schema(defaults: dict[str, Any], *, include_url: bool = True) -> vol.Schema:
    """Build the shared config / reconfigure / options schema."""
    fields: dict[Any, Any] = {
        vol.Required(CONF_NAME, default=defaults.get(CONF_NAME, DEFAULT_NAME)): (
            TextSelector()
        )
    }

    if include_url:
        fields[vol.Required(CONF_URL, default=defaults.get(CONF_URL, ""))] = (
            TextSelector(TextSelectorConfig(type=TextSelectorType.URL))
        )

    fields[
        vol.Required(
            CONF_CAPTURE_INTERVAL,
            default=str(defaults.get(CONF_CAPTURE_INTERVAL, DEFAULT_CAPTURE_INTERVAL)),
        )
    ] = SelectSelector(
        # A select, not a free number. Every option divides 60 exactly,
        # which is what keeps captures on a clean wall-clock grid — the
        # invariant the on-disk slot naming and the card's index both rest
        # on. Making it structural beats a validator someone can relax.
        SelectSelectorConfig(
            options=[str(minutes) for minutes in ALLOWED_CAPTURE_INTERVALS],
            mode=SelectSelectorMode.DROPDOWN,
            translation_key="capture_interval",
        )
    )

    fields[
        vol.Required(
            CONF_RETENTION_DAYS,
            default=defaults.get(CONF_RETENTION_DAYS, DEFAULT_RETENTION_DAYS),
        )
    ] = NumberSelector(
        NumberSelectorConfig(
            min=MIN_RETENTION_DAYS,
            max=MAX_RETENTION_DAYS,
            step=1,
            unit_of_measurement="d",
            mode=NumberSelectorMode.BOX,
        )
    )

    advanced_schema = vol.Schema(
        {
            vol.Required(
                CONF_MAX_WIDTH,
                default=str(defaults.get(CONF_MAX_WIDTH, DEFAULT_MAX_WIDTH)),
            ): SelectSelector(
                SelectSelectorConfig(
                    options=[str(width) for width in ALLOWED_MAX_WIDTHS],
                    mode=SelectSelectorMode.DROPDOWN,
                    translation_key="max_width",
                )
            ),
            vol.Required(
                CONF_QUALITY, default=defaults.get(CONF_QUALITY, DEFAULT_QUALITY)
            ): NumberSelector(
                NumberSelectorConfig(
                    min=MIN_QUALITY,
                    max=MAX_QUALITY,
                    step=1,
                    mode=NumberSelectorMode.SLIDER,
                )
            ),
            vol.Required(
                CONF_LIVE_REFRESH,
                default=defaults.get(CONF_LIVE_REFRESH, DEFAULT_LIVE_REFRESH),
            ): NumberSelector(
                NumberSelectorConfig(
                    min=MIN_LIVE_REFRESH,
                    max=MAX_LIVE_REFRESH,
                    step=5,
                    unit_of_measurement="s",
                    mode=NumberSelectorMode.BOX,
                )
            ),
            vol.Optional(
                CONF_FRAMES_PATH, default=defaults.get(CONF_FRAMES_PATH, "")
            ): TextSelector(),
            vol.Required(
                CONF_VERIFY_SSL, default=defaults.get(CONF_VERIFY_SSL, True)
            ): BooleanSelector(),
            vol.Optional(
                CONF_USERNAME, default=defaults.get(CONF_USERNAME, "")
            ): TextSelector(),
            vol.Optional(
                CONF_PASSWORD, default=defaults.get(CONF_PASSWORD, "")
            ): TextSelector(TextSelectorConfig(type=TextSelectorType.PASSWORD)),
        }
    )
    fields[vol.Required(_ADVANCED)] = section(advanced_schema, {"collapsed": True})

    return vol.Schema(fields)


def _build_entry_data(flat: dict[str, Any]) -> dict[str, Any]:
    """Pack validated, flattened input into ConfigEntry.data shape."""
    data: dict[str, Any] = {
        CONF_NAME: flat[CONF_NAME].strip(),
        CONF_URL: flat[CONF_URL].strip(),
        CONF_CAPTURE_INTERVAL: int(flat[CONF_CAPTURE_INTERVAL]),
        CONF_RETENTION_DAYS: int(flat[CONF_RETENTION_DAYS]),
        CONF_MAX_WIDTH: int(flat.get(CONF_MAX_WIDTH, DEFAULT_MAX_WIDTH)),
        CONF_QUALITY: int(flat.get(CONF_QUALITY, DEFAULT_QUALITY)),
        CONF_LIVE_REFRESH: int(flat.get(CONF_LIVE_REFRESH, DEFAULT_LIVE_REFRESH)),
        CONF_VERIFY_SSL: bool(flat.get(CONF_VERIFY_SSL, True)),
    }
    # Optional strings are omitted entirely when blank rather than stored
    # as "", so `config.get(...)` truthiness checks downstream stay simple.
    for key in (CONF_FRAMES_PATH, CONF_USERNAME, CONF_PASSWORD):
        if value := str(flat.get(key, "") or "").strip():
            data[key] = value
    return data


async def _validate(
    hass: HomeAssistant, flat: dict[str, Any]
) -> tuple[dict[str, Any], dict[str, str]]:
    """Validate the flattened input; returns (entry_data, errors)."""
    errors: dict[str, str] = {}

    url = str(flat.get(CONF_URL, "")).strip()
    if error := validate_url(url):
        errors[CONF_URL] = error
        return {}, errors

    if int(flat[CONF_CAPTURE_INTERVAL]) not in ALLOWED_CAPTURE_INTERVALS:
        errors[CONF_CAPTURE_INTERVAL] = "invalid_interval"
        return {}, errors

    probe_error = await async_probe_url(
        hass,
        url,
        username=flat.get(CONF_USERNAME) or None,
        password=flat.get(CONF_PASSWORD) or None,
        verify_ssl=bool(flat.get(CONF_VERIFY_SSL, True)),
    )
    if probe_error:
        errors["base"] = probe_error
        return {}, errors

    return _build_entry_data(flat), errors


def _defaults_from(entry: ConfigEntry) -> dict[str, Any]:
    """Current values, flattened, for pre-filling a form."""
    return {**entry.data, **entry.options}


class WebcamTimelapseConfigFlow(ConfigFlow, domain=DOMAIN):
    """Handle a config flow for Webcam Timelapse."""

    VERSION = 1

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> WebcamTimelapseOptionsFlow:
        """Return the options flow handler."""
        return WebcamTimelapseOptionsFlow()

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Handle the initial step."""
        errors: dict[str, str] = {}
        defaults: dict[str, Any] = {}

        if user_input is not None:
            defaults = flatten(user_input)
            data, errors = await _validate(self.hass, defaults)
            if not errors:
                await self.async_set_unique_id(compute_unique_id(data[CONF_URL]))
                # reload_on_update=False — the entry.add_update_listener in
                # __init__.py is the SOLE reload owner. Pairing a reloading
                # config-flow method with that listener is deprecated in HA
                # 2026.6, a hard error in 2026.12, and double-reloads today.
                self._abort_if_unique_id_configured(reload_on_update=False)
                return self.async_create_entry(title=data[CONF_NAME], data=data)

        return self.async_show_form(
            step_id="user",
            data_schema=_build_schema(defaults),
            errors=errors,
        )

    async def async_step_reconfigure(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Change any setting on an existing entry, keeping its entities."""
        entry = self._get_reconfigure_entry()
        errors: dict[str, str] = {}
        defaults = _defaults_from(entry)

        if user_input is not None:
            defaults = flatten(user_input)
            data, errors = await _validate(self.hass, defaults)
            if not errors:
                await self.async_set_unique_id(compute_unique_id(data[CONF_URL]))
                self._abort_if_unique_id_mismatch()
                # async_update_and_abort, NOT async_update_reload_and_abort:
                # __init__.py's update listener already reloads on this
                # data change. One reload owner only.
                return self.async_update_and_abort(
                    entry, data=data, title=data[CONF_NAME]
                )

        return self.async_show_form(
            step_id="reconfigure",
            data_schema=_build_schema(defaults),
            errors=errors,
        )

    # ------------------------------------------------------------------
    # Reauth — triggered when capture.py raises ConfigEntryAuthFailed on a
    # 401/403. Only relevant for cameras behind basic auth, but those are
    # squarely in scope for a generic still-image poller.
    # ------------------------------------------------------------------

    async def async_step_reauth(
        self, entry_data: Mapping[str, Any]
    ) -> ConfigFlowResult:
        """Perform reauth upon an authentication error."""
        return await self.async_step_reauth_confirm()

    async def async_step_reauth_confirm(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Prompt for fresh camera credentials."""
        entry = self._get_reauth_entry()
        errors: dict[str, str] = {}
        current = _defaults_from(entry)

        if user_input is not None:
            probe_error = await async_probe_url(
                self.hass,
                current[CONF_URL],
                username=user_input.get(CONF_USERNAME) or None,
                password=user_input.get(CONF_PASSWORD) or None,
                verify_ssl=bool(current.get(CONF_VERIFY_SSL, True)),
            )
            if probe_error:
                errors["base"] = probe_error
            else:
                return self.async_update_and_abort(
                    entry,
                    data={
                        **entry.data,
                        CONF_USERNAME: user_input.get(CONF_USERNAME, ""),
                        CONF_PASSWORD: user_input.get(CONF_PASSWORD, ""),
                    },
                )

        return self.async_show_form(
            step_id="reauth_confirm",
            data_schema=vol.Schema(
                {
                    vol.Optional(
                        CONF_USERNAME, default=current.get(CONF_USERNAME, "")
                    ): TextSelector(),
                    vol.Optional(CONF_PASSWORD): TextSelector(
                        TextSelectorConfig(type=TextSelectorType.PASSWORD)
                    ),
                }
            ),
            description_placeholders={"url": current.get(CONF_URL, "")},
            errors=errors,
        )


class WebcamTimelapseOptionsFlow(OptionsFlow):
    """Handle options for Webcam Timelapse."""

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Adjust cadence, retention and encoding for an existing camera."""
        errors: dict[str, str] = {}
        defaults = {**self.config_entry.data, **self.config_entry.options}

        if user_input is not None:
            merged = {**defaults, **flatten(user_input)}
            data, errors = await _validate(self.hass, merged)
            if not errors:
                return self.async_create_entry(data=data)

        return self.async_show_form(
            step_id="init",
            data_schema=_build_schema(defaults, include_url=False),
            errors=errors,
        )
