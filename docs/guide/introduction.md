# Introduction

`labelmanager` is a monorepo with one protocol core and multiple frontends:

- `@thermal-label/labelmanager-core` for encoding and device metadata
- `@thermal-label/labelmanager-node` for USB on Node.js
- `@thermal-label/labelmanager-cli` for terminal workflows
- `@thermal-label/labelmanager-web` for WebUSB in browsers

The DYMO LabelManager family exposes a Printer class USB interface. The Node.js
driver communicates over that interface using raw bulk transfers and a simple
ESC-sequence protocol. This project wraps that protocol in a stable TypeScript
API so app developers do not have to handle raw USB bytes directly.

## Protocol Highlights

- Vendor ID: `0x0922`
- Print interface: USB Interface 0 (Printer class), EP 5 OUT
- Core commands: media type (`1b4300`), bytes-per-line (`1b44xx`), form feed / flush (`1b41`)
- Bitmap command prefix: `0x16` (SYN)

See [USB Protocol Internals](/guide/usb-internals) for the full technical reference.

## Who This Is For

- Backend services printing inventory or shipping labels
- Kiosk and desktop apps with browser-based print flows
- CLI users who need repeatable shell scripts
