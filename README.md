# Webcam Timelapse

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://github.com/hacs/integration)
[![HA min version](https://img.shields.io/badge/Home%20Assistant-%3E%3D2025.5-blue.svg)](https://www.home-assistant.io/)
[![Quality Scale](https://img.shields.io/badge/quality%20scale-platinum-e5e4e2.svg)](https://developers.home-assistant.io/docs/core/integration-quality-scale/)

One-line description of the integration.

## Supported Functions

- TODO: enumerate read/write capabilities and scope.

## Requirements

- Home Assistant **2025.5** or newer.
- TODO: any account/credentials/prerequisites.

## Installation

### HACS (recommended)

1. HACS → **Integrations** → ⋯ → **Custom repositories**.
2. Add `https://github.com/rolandzeiner/webcam-timelapse` as type **Integration**.
3. Search for "Webcam Timelapse" and install.
4. Restart Home Assistant.

### Manual

1. Copy `custom_components/webcam_timelapse/` into your HA `config/custom_components/`.
2. Restart Home Assistant.

## Setup

1. **Settings → Devices & Services → + Add Integration**.
2. Search for **Webcam Timelapse** and follow the flow.

To change settings later: **Configure** (options) or **Reconfigure** (for fields that affect the entry's identity).

## Data Updates

TODO: polling cadence, any upstream refresh windows that may cause empty responses, how partial failures are handled.

## Use Cases

- TODO: 2–4 concrete scenarios where this integration adds value (automations, dashboards, …).

## Automation Examples

```yaml
# TODO: one complete, copy-pasteable automation YAML
```

## Troubleshooting

- **"Cannot connect" during setup.** Usually transient; retry. If it persists, verify connectivity to ``.
- **Collecting diagnostics for a bug report.** Settings → Devices & Services → Webcam Timelapse → ⋯ → Download diagnostics. Sensitive fields are redacted automatically.
- **Debug logs:**
  ```yaml
  # configuration.yaml
  logger:
    default: info
    logs:
      custom_components.webcam_timelapse: debug
  ```

## Known Limitations

- TODO: geographic/functional scope limits, rate-limit hints, anything the user should not expect.

## Removal

1. **Settings → Devices & Services** → find Webcam Timelapse → ⋯ → **Delete**.
2. Remove `custom_components/webcam_timelapse/` from the HA config (manual installs only; HACS removes it automatically).

## License

MIT — see [LICENSE](LICENSE).
