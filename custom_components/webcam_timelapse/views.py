"""HTTP view that serves the frame archive to signed-in users.

Frames used to be a static mount, and static paths in Home Assistant skip
authentication entirely: anyone who could reach the instance could fetch
every stored frame, and slot names are predictable. The integration also
records cameras behind HTTP basic authentication, whose frames must not be
public. A ``HomeAssistantView`` keeps ``requires_auth`` at its default, so
the auth middleware turns away a request without a valid token before
``get`` runs. The card loads frames with ``hass.fetchWithAuth``.
"""

from __future__ import annotations

import logging
import re

from aiohttp import hdrs, web
from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.http import KEY_HASS, HomeAssistantView

from .const import DOMAIN, FRAME_EXTENSION, FRAMES_URL_BASE
from .frame_store import frame_path

_LOGGER = logging.getLogger(__name__)

# Slot names are epoch seconds. Anything else is refused before it gets
# near the filesystem, which is what rules out a path traversal through the
# file name; the entry id has to name a loaded entry of this domain.
_FRAME_NAME = re.compile(rf"^(\d{{1,12}}){re.escape(FRAME_EXTENSION)}$")

# Frames are immutable once written, so the browser keeps them for the same
# 31 days the static mount used to promise. `private`, because the response
# belongs to one signed-in user and a shared proxy must not reuse it.
_CACHE_HEADERS = {hdrs.CACHE_CONTROL: "private, max-age=2678400"}


class FrameView(HomeAssistantView):
    """One archived frame, for a signed-in user."""

    url = FRAMES_URL_BASE + "/{entry_id}/{name}"
    name = f"api:{DOMAIN}:frame"

    async def get(
        self, request: web.Request, entry_id: str, name: str
    ) -> web.StreamResponse:
        """Return the frame file, or 404 for anything that isn't one."""
        hass = request.app[KEY_HASS]
        match = _FRAME_NAME.match(name)
        entry = hass.config_entries.async_get_entry(entry_id)
        if (
            match is None
            or entry is None
            or entry.domain != DOMAIN
            or entry.state is not ConfigEntryState.LOADED
        ):
            raise web.HTTPNotFound
        # Read from the coordinator rather than the default root, so an
        # entry with its own storage folder is served too.
        path = frame_path(entry.runtime_data.frames_dir, int(match.group(1)))
        if not await hass.async_add_executor_job(path.is_file):
            raise web.HTTPNotFound
        return web.FileResponse(path, headers=_CACHE_HEADERS)


@callback
def async_register_frame_view(hass: HomeAssistant) -> None:
    """Register the frame view, once per process from ``async_setup``.

    ``http`` is only an after-dependency, and pytest-homeassistant-custom-
    component doesn't set it up unless a test asks for it, so a missing
    ``hass.http`` is skipped rather than crashed on.
    """
    if getattr(hass, "http", None) is None:
        _LOGGER.debug("http component not available; skipping frame view")
        return
    hass.http.register_view(FrameView())
