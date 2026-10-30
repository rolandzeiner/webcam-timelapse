# <sub><sub><img src="https://raw.githubusercontent.com/rolandzeiner/webcam-timelapse/main/custom_components/webcam_timelapse/brand/icon.png" width="40" height="40" alt=""></sub></sub> Webcam Timelapse

[![Marketplace](https://img.shields.io/badge/Marketplace-Custom-41BDF5.svg)](https://www.home-assistant.io/integrations/marketplace/)
[![HA min version](https://img.shields.io/badge/Home%20Assistant-%3E%3D2025.5-blue.svg)](https://www.home-assistant.io/)
[![Version](https://img.shields.io/github/v/release/rolandzeiner/webcam-timelapse?include_prereleases&label=version&color=blue)](https://github.com/rolandzeiner/webcam-timelapse/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![vibe-coded](https://img.shields.io/badge/vibe-coded-ff69b4?logo=musicbrainz&logoColor=white)](https://en.wikipedia.org/wiki/Vibe_coding)

Keep a webcam's history and scroll back through it. Home Assistant fetches one image URL on a schedule, stores every frame, and gives you a card that plays them back as a timelapse. Sensor readings beside the picture show the value **from the moment you scrolled to**.

## Features

- Captures any still-image URL every 1 to 60 minutes and keeps the frames for up to a year.
- Plays the archive back on a card at up to 64×, with a scrubber, day markers and frame-by-frame stepping.
- Shows sensor readings and sparklines over the picture, each with the value in effect at that frame.
- Switches lights on for each capture, so a scene that is dark at night still gets recorded.
- Evens out cloud flicker during playback without touching the stored frames.
- Exports any stretch as an MP4, with readings and timestamp drawn on, in landscape, portrait or square.
- Works as a regular camera entity too, so `camera.snapshot`, picture cards and the mobile app work.
- Flags a frozen camera that keeps sending the same picture, with a sensor and a repair.

## Requirements

- Home Assistant **2025.5.0** or newer.
- Any address that returns a single still image over `http` or `https`. Nothing assumes a particular camera or kind of sensor.
- For the card, a browser from 2023 or newer: Chrome or Edge 110, Safari 16, or Firefox 115. On an older wall tablet, update its browser or WebView first.
- For video export, `ffmpeg`, which Home Assistant OS and the Container image include.

## Installation

### Marketplace (recommended)

The Marketplace is HACS, built into Home Assistant since 2026.11.

[![Open this repository in the Marketplace of your Home Assistant.](https://my.home-assistant.io/badges/marketplace_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=rolandzeiner&repository=webcam-timelapse&category=integration)

1. In **Settings → Marketplace**, select **Add from link**.
2. Enter `rolandzeiner/webcam-timelapse` and select **Add**. The first time, the Marketplace asks you to connect GitHub.
3. Open **Webcam Timelapse** and select **Install**.

On Home Assistant older than 2026.11, add the repository in HACS under ⋮ → **Custom repositories** with type **Integration**, then download it and restart Home Assistant.

### Manual

1. Download `webcam_timelapse.zip` from the [latest release](https://github.com/rolandzeiner/webcam-timelapse/releases/latest).
2. Extract it into `config/custom_components/webcam_timelapse/`.
3. Restart Home Assistant.

## Setup

[![Open your Home Assistant instance and start setting up a new integration.](https://my.home-assistant.io/badges/config_flow_start.svg)](https://my.home-assistant.io/redirect/config_flow_start/?domain=webcam_timelapse)

1. Go to **Settings → Devices & services → Add integration**.
2. Search for **Webcam Timelapse**.
3. Enter a name and the image URL. Home Assistant checks the URL before saving, so a wrong one shows up right away.
4. Choose how often to capture and how long to keep frames.
5. Optional: open **Advanced** to change image size, quality or credentials, or **Lights for capture** to light the scene.

Add as many cameras as you like. Each one is its own entry with its own archive.

**Use the direct link to the image**, not the page it sits on. It usually ends in `.jpg` or `.png`. If you aren't sure, right-click the picture in your browser and copy the image address.

| Field | Default | What it does |
|---|---|---|
| Name | Webcam | Names the device and its entities |
| Image URL | — | The picture to fetch. `http` and `https` only |
| Capture every | 10 min | 1, 2, 3, 5, 10, 15, 20, 30 or 60 minutes |
| Keep frames for | 14 days | Older frames are deleted automatically. 1 to 365 days |
| Resize to | 1024 px | Frames are scaled down to this width. Narrower images are left alone |
| Image quality | 78 | Higher keeps more detail and uses more disk. 40 to 95 |
| Live view refresh | 30 s | How often the camera entity fetches a fresh picture. `0` shows only the last captured frame |
| Storage folder | *(automatic)* | Leave empty unless you want frames somewhere else |
| Verify SSL certificate | on | Turn off only for a camera with a self-signed certificate |
| Username / Password | — | For a camera behind HTTP basic authentication |
| Lights to switch on | — | Lights and switches to turn on for each capture |
| Wait before capturing | 3 s | How long the lights are on before the frame is fetched. 0 to 30 s |
| When to use them | At every capture | Every capture, only at night (sunset to sunrise), or only within a time window |
| Time window from / Time window to | 20:00 / 06:00 | The window for *Only within a time window*. It may cross midnight |

## Options

Select **Configure** on the camera's entry to change any field from the *Setup* table except **Image URL**. To change the URL, select **Reconfigure** instead. Neither loses captured frames.

**Lowering Keep frames for deletes older frames at the next capture.** They can't be recovered.

**A longer capture interval hides older frames.** Frames taken every minute have no place on a five-minute timeline. They stay on disk and expire normally, and switching back shows them again.

### Lights for capture

A camera pointed at something that is dark half the day records half a timelapse. Pick one or more lights, or switches for a lamp on a smart plug, and they're switched on just before each frame is saved and off again straight after.

- **Only lights that were off are touched.** A light that was already on stays on afterwards.
- **A light somebody else used stays on.** If a person or an automation acts on a light during the few seconds it's lit for a capture (a motion light firing as you walk in), the capture leaves it alone.
- **Raise the wait if frames come out dark.** A camera needs a moment to adjust its exposure, and a cheap one may hand back a picture taken before the light came on. Three seconds suits most cameras.
- **Choose when the lights are used.** *Only at night* follows sunset and sunrise at your home's location, so the hours move with the seasons. *Only within a time window* uses two clock times instead. Outside those hours frames are still captured, without the lights.
- **The live view never switches a light.** Only scheduled captures and the `capture_now` action do. Lighting the room every 30 seconds for the live view would be a strobe, so at night the live view stays dark between captures.

A capture is never skipped because a light failed to switch. The frame is taken anyway and the problem goes to the log.

### Disk use

Measured on a 1200×900 source scaled to 1024 px:

| Image quality | Per frame | 14 days at 5 min | 14 days at 1 min |
|---|---|---|---|
| 70 | ~39 KB | 155 MB | 0.78 GB |
| **78** *(default)* | ~48 KB | **192 MB** | 0.96 GB |
| 90 | ~96 KB | 387 MB | 1.94 GB |
| 95 | ~150 KB | 606 MB | 3.03 GB |

**Quality costs more than frequency.** Going from 78 to 95 roughly triples the size, for detail a 1024 px timelapse frame won't show.

Frames live in `config/.cache/webcam_timelapse/<entry_id>/`. Home Assistant skips that folder when it makes a backup, so a large archive won't bloat your backups.

## Entities

Each camera creates one device with these entities:

| Entity | What it tells you |
|---|---|
| `camera.<name>_live_view` | The latest picture. Works with `camera.snapshot` and stock picture cards |
| `sensor.<name>_last_capture` | When the newest stored frame was taken |
| `sensor.<name>_stored_frames` | How many frames are archived |
| `sensor.<name>_storage_used` | Disk used by the archive |
| `binary_sensor.<name>_camera_online` | Off when several captures in a row came back identical |

**Camera online isn't a reachability check.** A camera whose software has frozen keeps serving its last picture with a healthy response. This sensor turns off when the picture stops changing, which is something you can act on, and it puts the outage in Home Assistant's history, so a jump in the timelapse has a visible explanation.

## Actions

| Action | What it does |
|---|---|
| `webcam_timelapse.capture_now` | Saves a frame immediately |
| `webcam_timelapse.purge_frames` | Deletes every stored frame for one camera |
| `webcam_timelapse.pause_capture` | Stops capturing. Stored frames are kept |
| `webcam_timelapse.resume_capture` | Starts capturing again |
| `webcam_timelapse.export_video` | Renders a stretch of the archive to an MP4 in the media folder |

Each takes an `entry_id`, which the UI offers as a picker.

**`capture_now` won't overwrite an existing frame.** A frame you already have can't be fetched from the camera again, so the action refuses instead of destroying history.

**Pausing keeps the schedule**, so resuming lands on the same capture times as before.

```yaml
# Capture whenever the doorbell rings
actions:
  - action: webcam_timelapse.capture_now
    data:
      entry_id: 01ABCDEF...
```

**`export_video` finishes when the video is written**, which can take minutes, and returns where it is, so the next step of an automation can send it somewhere. `start` and `end` are optional and default to the whole archive. `overlay` takes the readings in the same form as the card's configuration. `readings_size`, `timestamp_size`, `readings_position`, `readings_position_left`, `aspect` (`native`, `landscape` for 16:9, `portrait` for 9:16 or `square`), `crop_position` (0 to 100, 50 is the middle) and `every` (use every nth frame) work as in the card's export panel.

## Cards

Search for **Webcam Timelapse** in the card picker, or in YAML:

```yaml
type: custom:webcam-timelapse-card
camera_entity: camera.your_webcam
```

Every option is also in the visual editor.

| Option | Default | What it does |
|---|---|---|
| `camera_entity` | — | Required. A Webcam Timelapse camera, `camera.<name>_live_view` |
| `title` | — | Card heading |
| `autoplay` | `false` | Start playing when the card loads |
| `speed` | `32` | Playback speed: 1, 2, 4, 8, 16, 32 or 64 |
| `show_dayticks` | `true` | Show day markers on the scrubber |
| `show_graph` | `true` | Show sparklines for rows with `graph: true` |
| `show_sun` | `false` | Shade night behind the charts and the scrubber |
| `graph_hours` | `24` | Window of each sparkline in hours, centred on the playhead |
| `deflicker` | `50` | Smooth cloud flicker, 0 to 100. `0` turns it off |
| `show_export` | `true` | Show the **Export video** button in the player bar |
| `entities` | — | Readings for the bottom-right block |
| `overlay_title` | — | Heading above `entities` |
| `entities_left` | — | Readings for a second, bottom-left block |
| `overlay_title_left` | — | Heading above `entities_left` |

**Controls sit over the picture:** play, step one frame, cycle the speed, jump back to now. Drag the bar below to scrub. Arrow keys, Home, End and Page Up/Down work too. The scrubber is a real slider, so your keyboard and screen reader treat it as one.

**Above 16× the card skips frames.** A browser decodes about thirty images a second, so faster speeds cover more ground per frame instead of painting every one. The motion stays smooth and the steps get bigger.

**Tap the picture for the camera, a reading for its sensor.** Both open the usual Home Assistant details dialog, and both work from the keyboard.

**Playing from the newest frame starts the archive over from the beginning**, since there's nothing newer to move into.

**Gaps show as hatched red on the bar.** Playback skips over them in one step.

### Overlay readings

Add the sensors you want shown over the picture:

```yaml
overlay_title: Kleine Erlauf
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

Each row shows the reading **in effect at the frame you scrolled to**, with the time that reading was taken. If a sensor reports hourly, a value next to a 12:05 frame would otherwise look like a 12:05 measurement. Values are held from the last real reading and never interpolated: a smooth line between two hourly readings would invent a number nobody measured.

| Row option | What it does |
|---|---|
| `entity` | Required. Any sensor |
| `name` | Label. Defaults to the entity's friendly name |
| `unit` | Defaults to the entity's own unit |
| `decimals` | Decimal places. Default 1 |
| `color` | Any CSS colour |
| `graph` | Draw a sparkline around the playhead |
| `graph_hours` | Override the card's `graph_hours` for this row |
| `show_icon` | Show the entity's icon before its label, including the device-class default |
| `time_attribute` | Read the measurement time from this attribute instead of the state's last-changed time |

**`time_attribute` is off by default** because asking for attributes makes the history request about 25× larger.

**Give every charted row the same `graph_hours`** unless one gauge needs a different window, such as a monthly trend beside a daily one. Charts on different windows scroll past at different speeds during playback, and the slower one looks stuck.

**Each chart is scaled to its own window.** The line shows the shape of the last hours, and two labels underneath show the size: how far the gauge moved, and over how long.

```
Range 0.009 m                    30 d
```

Without them a millimetre of groundwater and half a metre of river draw the same picture.

**Set `decimals` to what the sensor actually resolves** on any charted row. A groundwater gauge reporting millimetres but printed at one decimal shows the same number for a month while its chart climbs. `decimals: 3` puts the two back in agreement.

**Very small movements are drawn small.** The card works out the finest step a sensor reports and won't stretch one or two of them across the full height, so a gauge idling on its last digit looks idle.

**The marker down the middle is the moment you're looking at**, and the dot on it is the value in effect then. A gauge that hasn't changed inside the window still draws: the recorder stores only changes, so the card carries the earlier reading in as a flat line. The timestamp beside the number tells you how old it is.

**A second block goes on the left.** Put readings in `entities_left`, with `overlay_title_left` as its heading. It takes the same row options as `entities`. Adding it never moves `entities`, which keeps the bottom-right corner. A card with only `entities_left` shows one block on the left. On a narrow card both blocks stack at the top of the picture, right-hand block first, and keep their sparklines.

```yaml
overlay_title: Kleine Erlauf      # bottom right
entities:
  - entity: sensor.wasserstand

overlay_title_left: Wetter        # bottom left
entities_left:
  - entity: sensor.aussentemperatur
```

**The eye in each block's corner folds it away** to show the picture underneath, and brings it back. Each block folds on its own. Folding isn't saved: a reload shows both blocks again, so the next person at a wall tablet doesn't find a card that looks broken.

### Night shading

`show_sun: true` shades the hours between sunset and sunrise behind every chart **and behind the scrubber**. A dip in the readings can be read against whether it was dark, and the dark stretches of the archive are visible before you scrub into them. It's off by default, because it helps a camera pointed outdoors and is noise for one pointed at a workshop wall.

Sunrise and sunset are worked out from the latitude and longitude in your Home Assistant settings. Nothing is read from `sun.sun`, which publishes only the *next* sunrise and sunset and is often excluded from the recorder.

The shading disappears when the bands get too fine. Thirty nights in thirty days is a band every few pixels, so a wide `graph_hours`, or an archive spanning months, draws no shading. Turning off `show_dayticks` leaves it on.

### Smoothing cloud flicker

Passing cloud makes one frame brighter than the next, and at playback speed that looks like strobing. **`deflicker`** evens it out.

Each frame's brightness is measured once when it's captured. The card then scales each frame toward a rolling average of the frames around it. Slow changes survive, so dusk still looks like dusk. Only jumps faster than the window are pulled back.

Stored frames are never changed. The correction happens at playback, so `deflicker: 0` shows the originals exactly. Turn it up if playback still strobes, down if evening transitions look flattened.

### Exporting a video

1. Select the film button (**Export video**) in the player bar.
2. Scrub to the first frame and select **Start at this frame**, then scrub to the last and select **End at this frame**. Or pick a shortcut: the last day, three days, week, or **Everything**.
3. Set **Frames per second**, **Frames used**, **Format** and the overlays, then select **Export**.

The chosen stretch is tinted on the bar, with a grip at each end. Drag one and the picture follows, so you see the frame the video opens or closes on.

**The card estimates the result** before you start: how many frames, how long the video runs and roughly how large the file is. At 24 frames per second, a day captured every five minutes plays in 12 seconds. A picture with a lot of movement makes a larger file. If the media folder would run short of space, the card says so.

**Frames used thins a long range.** **1 in 5** keeps every fifth frame, so the timelapse runs five times as fast and the video is a fifth as long.

**Format crops the video for a phone or a feed.** **As camera** keeps the frames' own shape; **Landscape** (16:9), **Portrait** (9:16) and **Square** (1:1) cut the picture to fit. Only the camera picture is cropped; the date and readings are laid out again inside the new shape. While the panel is open, the card dims what the crop leaves out. Drag the bright frame, or use **Crop position**, to choose the part to keep. Each format keeps its own overlay sizes, and the narrow ones start larger so the readings stay legible on a phone.

**A crop has only the pixels the frames have.** Portrait from frames stored at 1024 × 576 is 324 × 576, which looks soft on a phone, and the card tells you when a crop is that small. For sharper portrait videos, choose a larger **Resize to**. It applies to frames captured from then on.

**Sensor readings** draws the card's overlay blocks on every frame, each showing the value from the moment that frame was captured. **Date and time** stamps each frame in the top-left corner. Both can be switched off.

- **Each has a size**, as a share of the video's width: 30 % for the readings and 15 % for the date and time by default. A long sensor name is shortened instead of shrinking every reading, and text never gets too small to survive video compression.
- **The readings can sit left, right, top or bottom.** Left and right are the bottom corners, as on the card. Top and bottom centre the block on that edge. Two blocks in the same place are stacked, and a block at the top keeps clear of the date and time.
- **Gaps are skipped**, as in playback, so a night without captures doesn't become seconds of frozen picture.
- **The video uses the card's Smooth brightness setting**, so it flickers no more than the playback you exported it from.

Three things differ from the card on purpose:

- **The timestamp includes the year** (`2026-08-01 12:30`). A video outlives the dashboard it came from.
- **The readings block keeps one width** for the whole video. Resizing with its contents would jitter at 24 frames per second.
- **Entity icons aren't drawn.** They belong to Home Assistant's frontend, which the encoder doesn't have.

**Home Assistant encodes the video itself.** You can close the dashboard or lock your phone while it encodes. Open the panel again later and the finished video is there to watch or download.

**Videos are saved in your media folder**, one folder per camera: `/media/webcam_timelapse/<camera>/` on Home Assistant OS. The panel shows the folder, and the full path of each video once it's written. After the first export, **Open in media browser** takes you to the folder in **Media → My media**, the easiest place to delete old ones. Videos aren't deleted with the frames they were made from.

**Readings older than your recorder keeps are hourly averages.** Home Assistant keeps detailed history for ten days unless you changed `purge_keep_days`. For older frames the overlay falls back to long-term statistics, and a sensor without statistics shows a dash.

**One export at a time per camera.** Encoding is the heaviest thing this integration does: a day of 1600 px frames captured every five minutes took about half a minute on a four-core mini PC, and a Raspberry Pi takes longer. Captures carry on meanwhile.

## Data updates

Captures run on the **wall clock**, not on a timer from when Home Assistant started. At a ten-minute interval, frames land at :00, :10, :20 and so on. That fixed grid lets the card address frames by position and jump straight to any moment.

The picture is fetched 5 to 29 seconds past the minute, so a camera that publishes on the minute has finished writing. Each camera gets its own second in that range and keeps it. The second differs between installations, so people watching the same public webcam don't all fetch it at once.

Every capture is compared with the previous one. If the camera returns an unchanged picture, either a `304` response or byte-identical data, nothing is stored and that slot becomes a gap. After three in a row, **Camera online** turns off and a repair issue appears.

Pruning runs on the same tick. In normal use that's one file deleted per capture.

The live camera entity fetches separately, at its own refresh interval, so an open dashboard doesn't affect the archive.

## Examples

- **Watch a river rise.** Scroll back through two weeks of a gauge camera with the water level from each moment beside the picture.
- **See what the weather did overnight.** Jump to 03:00 and step through frame by frame.
- **Build a construction or garden timelapse** and play back weeks at 64×.
- **Find when something happened.** Every frame is timestamped and kept on disk.

Keep each week as a video and send it to your phone:

```yaml
alias: Weekly timelapse video
triggers:
  - trigger: time
    at: "23:30:00"
conditions:
  - condition: time
    weekday: sun
actions:
  - action: webcam_timelapse.export_video
    data:
      entry_id: 01ABCDEF...
      start: "{{ (now() - timedelta(days=7)).strftime('%Y-%m-%d %H:%M:%S') }}"
      fps: 30
      overlay:
        entities:
          - entity: sensor.greenhouse_temperature
            graph: true
    response_variable: video
  - action: notify.mobile_app_phone
    data:
      message: "This week's timelapse: {{ video.file_name }}"
```

## Known limitations

- **No backfill.** History starts when you add the camera. Most webcams publish only a current-image URL, so there's nothing earlier to fetch.
- **Frames are served without authentication**, at the same level as Home Assistant's `/local/` folder. The source is a publicly published webcam, so storing it locally doesn't make it more private. Use the camera entity if you need an authenticated path.
- **No video stream.** This fetches still images: no RTSP, HLS or MJPEG source.
- **One image per camera.** Multi-view cameras need one entry per view.

## Troubleshooting

**The card says no frames are archived.**
The first frame arrives at the next capture time, not immediately. At a ten-minute interval that can take up to ten minutes.

**The card shows nothing after an update.**
Hard-refresh your browser (⌘⇧R or Ctrl⇧R). If a banner offers a reload button, use it: it clears the cached copy first.

**Setup says the URL returned a page, not an image.**
You have the address of the page around the picture. Right-click the picture itself and copy the image address.

**The timelapse has gaps.**
Either Home Assistant wasn't running, or the camera returned the same picture several times. The history of `binary_sensor.<name>_camera_online` tells you which.

**Frames stopped appearing.**
Check that the camera entity still shows a picture, then look for a repair issue under **Settings → System → Repairs**.

**Older frames vanished from the timeline.**
You changed the capture interval to a longer one. The frames are still on disk, and switching back shows them again.

**Playback stutters.**
Lower the speed, or reduce **Resize to**. Each frame has to be decoded, and a low-powered tablet has a limit.

For a bug report, go to **Settings → Devices & services → Webcam Timelapse**, then ⋮ → **Download diagnostics**. The file contains no credentials and no image data.

## Removal

1. Go to **Settings → Devices & services → Webcam Timelapse**, open the entry's menu and select **Delete**. That deletes the camera's stored frames with it. Other cameras and exported videos stay. Removing the last entry also removes the card from your dashboard resources.
2. To uninstall, go to **Settings → Marketplace**, open **Webcam Timelapse**, then ⋮ → **Uninstall**. On Home Assistant older than 2026.11, remove it in HACS. For a manual install, delete `config/custom_components/webcam_timelapse/`. Then restart Home Assistant.

## Attribution

Icon: Font Awesome Free, CC BY 4.0.

The video overlay text uses DejaVu Sans, shipped with its [licence](https://github.com/rolandzeiner/webcam-timelapse/blob/main/custom_components/webcam_timelapse/fonts/DejaVuSans-LICENSE.txt).

## Legal

This integration fetches whatever address you give it, as often as you tell it to, from inside your network.

Check that you're allowed to poll that image at that frequency. Camera operators publish terms, and a one-minute cadence against someone else's server is a decision you make on their behalf. The ten-minute default is deliberately conservative.

## License

MIT, see [LICENSE](https://github.com/rolandzeiner/webcam-timelapse/blob/main/LICENSE).

Dev setup, the verification gate and the architecture notes: [CONTRIBUTING.md](https://github.com/rolandzeiner/webcam-timelapse/blob/main/CONTRIBUTING.md).

## Disclaimer

This integration is provided as is, without warranty of any kind. It is not affiliated with or endorsed by Home Assistant or the Open Home Foundation. Use at your own risk.

---

Diese Integration wird ohne jede Gewährleistung bereitgestellt. Sie steht in keiner Verbindung zu Home Assistant oder der Open Home Foundation und wird von diesen nicht unterstützt. Nutzung auf eigene Verantwortung.
