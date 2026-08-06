# Webcam Timelapse

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://github.com/hacs/integration)
[![HA min version](https://img.shields.io/badge/Home%20Assistant-%3E%3D2025.5-blue.svg)](https://www.home-assistant.io/)
[![Version](https://img.shields.io/github/v/release/rolandzeiner/webcam-timelapse?include_prereleases&label=version&color=blue)](https://github.com/rolandzeiner/webcam-timelapse/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![vibe-coded](https://img.shields.io/badge/vibe-coded-ff69b4?logo=musicbrainz&logoColor=white)](https://en.wikipedia.org/wiki/Vibe_coding)

**Keep a webcam's history and scroll back through it.**

Home Assistant fetches one image URL on a schedule, stores every frame, and
gives you a card that plays them back like a timelapse — with a scrubber, day
markers, and optional sensor readings that show the value **at the moment you
scrolled to**, not right now.

Point it at any address that returns a still image. Nothing here assumes a
particular camera or a particular kind of sensor.

---

## Contents

- [What you can do with it](#what-you-can-do-with-it)
- [Install](#install)
- [Set up a camera](#set-up-a-camera)
- [Settings](#settings)
- [How much disk it uses](#how-much-disk-it-uses)
- [The card](#the-card)
- [Overlay readings](#overlay-readings)
- [Smoothing cloud flicker](#smoothing-cloud-flicker)
- [Entities](#entities)
- [Actions](#actions)
- [How data updates](#how-data-updates)
- [Troubleshooting](#troubleshooting)
- [Known limitations](#known-limitations)
- [Remove the integration](#remove-the-integration)
- [Your responsibility for the URL you poll](#your-responsibility-for-the-url-you-poll)
- [Contributing](#contributing)

---

## What you can do with it

**Watch a river rise.** Scroll back through two weeks of a gauge camera and
see the water level readings from each moment beside the picture.

**Check what the weather did overnight.** Jump to 03:00 and step through
frame by frame.

**Build a construction or garden timelapse.** Point it at any site camera and
play back weeks at 64×.

**Prove when something happened.** Every frame is timestamped and kept on
disk, so you can find the exact capture.

**Use it without the card.** Each camera also becomes a normal Home Assistant
camera entity, so `camera.snapshot`, picture cards and the mobile app all
work.

## Install

1. In HACS, open the three-dot menu and choose **Custom repositories**.
2. Add `https://github.com/rolandzeiner/webcam-timelapse` as an
   **Integration**.
3. Install it, then restart Home Assistant.

[![Add to HACS](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=rolandzeiner&repository=webcam-timelapse&category=integration)

Needs Home Assistant **2025.5.0** or newer.

## Set up a camera

[![Open your Home Assistant instance and start setting up a new integration.](https://my.home-assistant.io/badges/config_flow_start.svg)](https://my.home-assistant.io/redirect/config_flow_start/?domain=webcam_timelapse)

1. Go to **Settings → Devices & Services → Add Integration**.
2. Search for **Webcam Timelapse**.
3. Enter a name and the image URL. Home Assistant checks the URL before
   saving, so you find out straight away if it is wrong.
4. Choose how often to capture and how long to keep frames.
5. Open **Advanced** if you want to change image size, quality, or add
   credentials.

Add as many cameras as you like — each one is its own entry with its own
archive.

**Use the direct link to the image**, not the page it sits on. It usually ends
in `.jpg` or `.png`. If you are unsure, right-click the picture in your
browser and copy the image address.

## Settings

Every setting can be changed later without losing captured frames.

| Setting | Default | What it does |
|---|---|---|
| Name | Webcam | Names the device and its entities |
| Image URL | — | The picture to fetch. `http` and `https` only |
| Capture every | 10 min | 1, 2, 3, 5, 10, 15, 20, 30 or 60 minutes |
| Keep frames for | 14 days | Older frames are deleted automatically |
| Resize to | 1024 px | Frames are scaled to this width. Smaller images are left alone |
| Image quality | 78 | Higher keeps more detail and uses more disk |
| Live view refresh | 30 s | How often the camera entity fetches a fresh picture. `0` shows only the last captured frame |
| Storage folder | *(automatic)* | Leave empty unless you want frames somewhere else |
| Verify SSL certificate | on | Turn off only for a camera with a self-signed certificate |
| Username / password | — | For a camera behind HTTP basic authentication |

**Changing the capture interval to a longer one hides older frames.** Frames
taken every minute have no place on a five-minute timeline. They stay on disk
and expire normally, and switching back makes them visible again.

## How much disk it uses

Measured on a 1200×900 source scaled to 1024 px:

| Quality | Per frame | 14 days at 5 min | 14 days at 1 min |
|---|---|---|---|
| 70 | ~39 KB | 155 MB | 0.78 GB |
| **78** *(default)* | ~48 KB | **192 MB** | 0.96 GB |
| 90 | ~96 KB | 387 MB | 1.94 GB |
| 95 | ~150 KB | 606 MB | 3.03 GB |

**Quality costs more than frequency.** Going from 78 to 95 roughly triples the
size for detail a 1024 px timelapse frame will not show.

Frames live in `config/.cache/webcam_timelapse/<entry_id>/`. Home Assistant
skips that folder when it makes a backup, so a large archive will not bloat
your backups.

## The card

The card is added like any other. Search for **Webcam Timelapse** in the card
picker, or in YAML:

```yaml
type: custom:webcam-timelapse-card
camera_entity: camera.your_webcam
```

Everything else is optional and editable in the visual editor:

```yaml
type: custom:webcam-timelapse-card
camera_entity: camera.kleine_erlauf
title: Kleine Erlauf
autoplay: false
speed: 8                 # 1 | 2 | 4 | 8 | 16 | 32 | 64 (default 32)
show_dayticks: true
show_graph: true
graph_hours: 24
deflicker: 50            # 0 turns it off
entities: []
```

**Controls sit over the picture.** Play, step one frame, cycle the speed,
jump back to now. Drag the bar below to scrub. Arrow keys, Home, End and Page
Up/Down all work — the scrubber is a real slider, so your keyboard and screen
reader treat it as one.

**Above 16× the card skips frames.** A browser decodes about thirty images a
second, so faster speeds cover more ground per frame instead of painting every
one. The motion stays smooth; the steps get bigger.

**Tap the picture for the camera, a reading for its sensor.** Both open the
usual Home Assistant details dialog, and both work from the keyboard.

**Playing from the newest frame replays the archive from the start**, since
there is nothing newer to move into.

**Gaps show as hatched red on the bar.** Playback skips over them in one step
rather than sitting on blank time.

## Overlay readings

Add any sensors you want shown over the picture:

```yaml
overlay_title: Kleine Erlauf      # optional; omit for no heading
entities:
  - entity: sensor.wasserstand
    name: Level
    unit: cm
    decimals: 0
    color: "#3d7ea6"
    graph: true
    show_icon: true
    time_attribute: timestamp
  - entity: sensor.wassertemperatur
    name: Temperature
    unit: °C
    decimals: 1
    color: "#c1663f"
```

Each row shows the reading **that was in effect at the frame you scrolled
to**, along with the time that reading was taken. That second part matters: if
a sensor reports hourly, a value sitting next to a 12:05 frame would otherwise
look like a 12:05 measurement.

Values are held from the last real reading and never interpolated. Drawing a
smooth line between two hourly readings would invent a number nobody measured.

| Option | What it does |
|---|---|
| `entity` | Required. Any sensor |
| `name` | Label. Defaults to the entity's friendly name |
| `unit` | Defaults to the entity's own unit |
| `decimals` | Decimal places. Default 1 |
| `color` | Any CSS colour |
| `graph` | Draw a sparkline behind the playhead |
| `graph_hours` | Override the card's `graph_hours` for this row |
| `show_icon` | Show the entity's own icon before its label |
| `time_attribute` | Read the measurement time from this attribute instead of the state's last-changed time |

`show_icon` uses whatever icon the entity has in Home Assistant, including the
device-class default when none is set explicitly — so it follows the entity
rather than duplicating an icon name in the card config.

`graph_hours` per row exists because one window rarely suits every gauge on the
same card. A river level moves every few minutes and reads well over the
card-wide 24 hours; a groundwater gauge moves millimetres a day and stays a flat
line until you give it weeks:

```yaml
graph_hours: 24                   # the card default
entities_left:
  - entity: sensor.grundwasserspiegel
    graph: true
    graph_hours: 720              # 30 days, so the trend is visible at all
```

A slow gauge still draws even when it has not changed inside the window. The
recorder only stores changes, so such a window can be genuinely empty — the card
carries the reading that was already in effect into it and holds the line flat,
rather than dropping the graph and implying the sensor is dead.

`overlay_title` sits above the readings as a heading for the block. Leaving it
empty or omitting it renders nothing, which is the default look.

### A second block on the left

`entities` sits in the bottom-right corner. To show a second set of readings,
put them in `entities_left`:

```yaml
overlay_title: Kleine Erlauf      # bottom right, as before
entities:
  - entity: sensor.wasserstand

overlay_title_left: Wetter        # bottom left
entities_left:
  - entity: sensor.aussentemperatur
```

`entities_left` takes exactly the same options as `entities`.

Adding it never moves what you already had: `entities` keeps the right-hand
corner whether or not a second block is beside it. A card with only
`entities_left` shows one block on the left.

On a narrow card the two stack at the top of the picture instead, with the
right-hand block above the left one — there is no room for two blocks and the
playback controls along the bottom edge. Sparklines are hidden at that width,
as they are for a single block.

Use `time_attribute` for sensors whose real measurement time lives in an
attribute. It is off by default because asking for attributes makes the
history request about 25× larger.

## Smoothing cloud flicker

Passing cloud makes one frame brighter than the next, and at playback speed
that looks like strobing. **`deflicker`** (0–100, default 50) evens it out.

Each frame's brightness is measured once when it is captured. The card then
scales each frame toward a rolling average of the frames around it. Slow
changes survive — a sunset moves the average with it, so dusk still looks like
dusk. Only jumps faster than the window are pulled back.

Your stored frames are never changed. The correction happens at playback, so
setting `deflicker: 0` gives you the originals back exactly.

Turn it up if playback still strobes. Turn it down if evening transitions look
flattened.

## Entities

Each camera creates one device with these entities:

| Entity | What it tells you |
|---|---|
| `camera.<name>_live_view` | The latest picture. Works with `camera.snapshot` and stock picture cards |
| `sensor.<name>_last_capture` | When the newest stored frame was taken |
| `sensor.<name>_stored_frames` | How many frames are archived |
| `sensor.<name>_storage_used` | Disk used by the archive |
| `binary_sensor.<name>_camera_online` | Off when several captures in a row came back identical |

**`camera_online` is not a reachability check.** A camera whose software has
frozen keeps serving its last picture with a perfectly healthy response. This
turns off when the picture stops changing, which is the thing you can act on —
and it puts the outage in Home Assistant's history, so a jump in the timelapse
has a visible explanation.

## Actions

| Action | What it does |
|---|---|
| `webcam_timelapse.capture_now` | Saves a frame immediately |
| `webcam_timelapse.purge_frames` | Deletes every stored frame for one camera |
| `webcam_timelapse.pause_capture` | Stops capturing. Stored frames are kept |
| `webcam_timelapse.resume_capture` | Starts capturing again |

Each takes an `entry_id`, which the UI offers as a picker.

**`capture_now` will not overwrite an existing frame.** A frame you already
have cannot be fetched from the camera again, so the action refuses rather
than destroying history.

Pausing keeps the schedule intact, so resuming lands on the same capture times
as before.

```yaml
# Capture whenever the doorbell rings
actions:
  - action: webcam_timelapse.capture_now
    data:
      entry_id: 01ABCDEF...
```

## How data updates

Captures run on the **wall clock**, not on a timer from when Home Assistant
started. At a ten-minute interval, frames land at :00, :10, :20 and so on,
five seconds past the minute — so a camera that publishes on the minute has
finished writing before the fetch.

That fixed grid is what lets the card address frames by position and jump
straight to any moment.

Every capture is compared with the previous one. If the camera returns an
unchanged picture — either a `304` response or byte-identical data — nothing
is stored and that slot becomes a gap. After three in a row, `camera_online`
turns off and a repair issue appears.

Pruning runs on the same tick. In normal use that is one file deleted per
capture.

The live camera entity fetches separately, at its own refresh interval, so
having a dashboard open does not affect the archive.

## Troubleshooting

**The card says no frames are archived.**
The first frame appears at the next capture time, not immediately. At a
ten-minute interval that can be up to ten minutes.

**The card shows nothing after an update.**
Hard-refresh your browser (⌘⇧R or Ctrl⇧R). If a banner offers a reload
button, use that — it clears the cached copy first.

**Setup says the URL returned a page, not an image.**
You have the address of the page around the picture. Right-click the picture
itself and copy the image address.

**The timelapse has gaps.**
Either Home Assistant was not running, or the camera returned the same picture
several times. Check `binary_sensor.<name>_camera_online` history to tell
which.

**Frames stopped appearing.**
Check the camera entity still shows a picture, then look for a repair issue
under **Settings → System → Repairs**.

**Older frames vanished from the timeline.**
If you changed the capture interval to a longer one, the older frames no
longer sit on the timeline's grid. They are still on disk and switching back
restores them.

**Playback stutters.**
Lower the speed, or reduce **Resize to**. Each frame has to be decoded, and a
low-powered tablet has a limit.

For a bug report, attach the diagnostics from the integration's three-dot
menu. It contains no credentials and no image data.

## Known limitations

- **No backfill.** History starts when you add the camera. Most webcams
  publish only a current-image URL, so there is nothing earlier to fetch.
- **Frames are served without authentication**, at the same level as Home
  Assistant's `/local/` folder. The source is a publicly published webcam, so
  storing it locally does not make it more private. Use the camera entity if
  you need an authenticated path.
- **No video stream.** This fetches still images. There is no RTSP or HLS
  source, and no MJPEG stream.
- **A longer capture interval hides older frames** until you switch back.
- **One image per camera.** Multi-view cameras need one entry per view.

## Remove the integration

Go to **Settings → Devices & Services**, open the three-dot menu on the
Webcam Timelapse entry and choose **Delete**.

This deletes that camera's stored frames along with the entry. Other cameras
are untouched. When the last entry is removed, the card is unregistered from
your dashboard resources.

To uninstall completely, remove the repository in HACS and restart Home
Assistant.

## Your responsibility for the URL you poll

This integration fetches whatever address you give it, as often as you tell it
to, from inside your network.

Check that you are allowed to poll that image at that frequency. Camera
operators publish terms, and a one-minute cadence against someone else's
server is a decision you are making on their behalf. The ten-minute default is
deliberately conservative.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the development setup, the
verification gate, and the architecture notes worth reading before changing
anything.

## Licence

MIT
