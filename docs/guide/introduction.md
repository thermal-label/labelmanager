# Introduction

`labelmanager-ts` is a monorepo with one protocol core and multiple frontends:

- `@thermal-label/labelmanager-core` for encoding and device metadata
- `@thermal-label/labelmanager-node` for USB HID on Node.js
- `@thermal-label/labelmanager-cli` for terminal workflows
- `@thermal-label/labelmanager-web` for WebHID in browsers

The DYMO LabelManager family uses 64-byte HID reports and a 1-bit bitmap stream.
This project wraps that protocol in a stable TypeScript API so app developers do not
have to handle raw HID bytes directly.

## Protocol Highlights

- Vendor ID: `0x0922`
- Report size: `64` bytes
- Core commands: reset (`1b40`), media (`1b4300`), density (`1b65xx`), form feed (`1b47`)
- Bitmap command prefix: `0x16`

## Who This Is For

- Backend services printing inventory or shipping labels
- Kiosk and desktop apps with browser-based print flows
- CLI users who need repeatable shell scripts
