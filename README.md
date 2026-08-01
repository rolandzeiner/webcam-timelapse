# Webcam Timelapse

[![Version](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Frolandzeiner%2Fwebcam-timelapse%2Fmain%2Fcustom_components%2Fwebcam_timelapse%2Fmanifest.json&query=%24.version&label=version)](https://github.com/rolandzeiner/webcam-timelapse/releases)
[![hacs](https://img.shields.io/badge/HACS-custom-41BDF5.svg)](https://hacs.xyz)

Archive any still-image webcam and scrub back through it.

Home Assistant fetches a single image URL on a schedule, stores each frame,
and ships a Lovelace card that plays the result as a timelapse — with a
scrubber, day markers, and optional sensor readings that show the value **at
the moment you scrubbed to**, not the current one.

Nothing here is tied to a particular camera or a particular kind of sensor.
Point it at any URL that returns a still image.

---

## What it does

- **Captures** a still image on a wall-clock schedule (every minute up to
  every hour) and stores it as a downscaled WebP.
- **Prunes** automatically — you set how many days to keep.
- **Detects a stuck camera.** A feeder process that dies keeps serving the
  same picture with a perfectly healthy `200`; that shows up as a gap and a
  Repairs issue, not as hours of duplicate frames pretending to be a
  timelapse.
- **Serves a camera entity** so `camera.snapshot`, `picture-glance` and the
  companion app work without the custom card.
- **Overlays readings** from any sensors you choose, resolved to the scrubbed
  moment from the recorder's history.

## Installation

HACS → three-dot menu → *Custom repositories* → add
`https://github.com/rolandzeiner/webcam-timelapse` as an **Integration**.
Install, restart Home Assistant, then *Settings → Devices & Services → Add
Integration → Webcam Timelapse*.

Requires Home Assistant **2025.5.0** or newer.

## Configuration

| Option | Default | Notes |
|---|---|---|
| Image URL | — | Direct link to the image itself, not the page around it |
| Capture every | 10 min | 1 / 2 / 3 / 5 / 10 / 15 / 20 / 30 / 60 minutes |
| Keep frames for | 14 days | Older frames are deleted automatically |
| Resize to | 1024 px | Images already narrower are left alone |
| Image quality | 78 | WebP quality |
| Live view refresh | 30 s | `0` = only ever show the last captured frame |
| Storage folder | *(auto)* | Leave empty unless you want frames elsewhere |
| Username / password | — | For a camera behind HTTP basic auth |

### How much disk?

Measured on a 1200×900 source downscaled to 1024 px:

| quality | per frame | 14 days @ 5 min | 14 days @ 1 min |
|---|---|---|---|
| 70 | ~39 KB | 155 MB | 0.78 GB |
| **78** | ~48 KB | **192 MB** | 0.96 GB |
| 90 | ~96 KB | 387 MB | 1.94 GB |
| 95 | ~150 KB | 606 MB | 3.03 GB |

Quality is the expensive knob, not the interval — 95 costs roughly 3× 78 for
detail a 1024 px timelapse frame will not show.

Frames live in `config/.cache/webcam_timelapse/<entry_id>/`. That directory is
excluded from Home Assistant's own backups on purpose: the archive is bulk
data you can live without, and including it would add hundreds of megabytes
to every backup you upload.

## The card

```yaml
type: custom:webcam-timelapse-card
camera_entity: camera.your_webcam
```

Everything else is optional:

```yaml
type: custom:webcam-timelapse-card
camera_entity: camera.kleine_erlauf
title: Kleine Erlauf
autoplay: false
speed: 4                 # 1 | 2 | 4 | 8 | 16 | 32
show_dayticks: true
show_graph: true
graph_hours: 24
entities:
  - entity: sensor.wasserstand
    name: Pegel
    unit: cm
    decimals: 0
    color: "#3d7ea6"
    graph: true
    time_attribute: timestamp
  - entity: sensor.wassertemperatur
    name: Temperatur
    unit: °C
    decimals: 1
    color: "#c1663f"
  - entity: sensor.durchfluss
    name: Durchfluss
    unit: m³/s
    decimals: 3
```

`entities` is empty by default — the card has no opinion about what you
overlay. Each row shows the reading **in effect at the scrubbed frame**, plus
the time that reading was actually taken. That second part matters: if a gauge
reports hourly, a value sitting next to a 12:05 frame would otherwise imply a
12:05 measurement.

Values are held from the last real reading, never interpolated. These are
discrete measurements; drawing a smooth ramp between two of them would invent
a number that was never measured and present it as if it had been.

`time_attribute` is for sensors that carry their real measurement time in a
state attribute rather than in `last_changed`. Off by default: requesting
attributes makes the history payload roughly 25× larger, so it is opt-in per
entity.

## Entities

| Entity | |
|---|---|
| `camera.<name>_live_view` | Latest image; works with `camera.snapshot` and stock picture cards |
| `sensor.<name>_last_capture` | Timestamp of the newest stored frame |
| `sensor.<name>_stored_frames` | How many frames are archived |
| `sensor.<name>_storage_used` | Disk occupied |
| `binary_sensor.<name>_camera_online` | Off when several captures in a row came back identical |

## Services

`capture_now` · `purge_frames` · `pause_capture` · `resume_capture`

`capture_now` refuses to overwrite an existing frame — a stored frame can
never be re-fetched from the camera, so the service will not silently destroy
history.

## Known limitations

- **No backfill.** History starts the moment you add the camera. Most webcams
  publish only a "current image" URL with no archive, so there is nothing to
  catch up from.
- **Frames are served unauthenticated**, at the same trust level as
  `/local/`. The source is a publicly-served webcam, so archiving it locally
  does not create a new confidentiality boundary. If you want an
  authenticated path, use the camera entity.
- **Changing to a coarser interval hides older frames.** Frames captured every
  minute have no position on a five-minute timeline. They stay on disk and
  expire normally, and switching back makes them visible again — but they will
  not appear on the timeline meanwhile.
- **No stream.** This polls still images; there is no RTSP or HLS source.

## You are responsible for the URL you poll

This integration fetches whatever address you give it, as often as you tell
it to, from inside your network. Check that you are permitted to poll that
image at that frequency — camera operators publish terms, and a one-minute
cadence against someone else's server is a decision you are making on their
behalf. The ten-minute default is deliberately conservative.

## Licence

MIT
