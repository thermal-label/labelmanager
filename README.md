[![CI](https://github.com/thermal-label/labelmanager/actions/workflows/ci.yml/badge.svg)](https://github.com/thermal-label/labelmanager/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/thermal-label/labelmanager/branch/main/graph/badge.svg)](https://codecov.io/gh/thermal-label/labelmanager)
[![npm core](https://img.shields.io/npm/v/@thermal-label/labelmanager-core)](https://npmjs.com/package/@thermal-label/labelmanager-core)
[![npm node](https://img.shields.io/npm/v/@thermal-label/labelmanager-node)](https://npmjs.com/package/@thermal-label/labelmanager-node)
[![npm web](https://img.shields.io/npm/v/@thermal-label/labelmanager-web)](https://npmjs.com/package/@thermal-label/labelmanager-web)
[![npm cli](https://img.shields.io/npm/v/@thermal-label/labelmanager-cli)](https://npmjs.com/package/@thermal-label/labelmanager-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

# labelmanager

TypeScript-first DYMO D1 LabelManager driver suite for Node.js, browser WebHID, and CLI workflows.

- Project website: https://thermal-label.github.io/labelmanager/
- Repository: https://github.com/thermal-label/labelmanager
- Issues: https://github.com/thermal-label/labelmanager/issues

## Install

Install only what you need:

```bash
pnpm add @thermal-label/labelmanager-node
```

```bash
npm install @thermal-label/labelmanager-node
```

For browser-only usage:

```bash
pnpm add @thermal-label/labelmanager-web
```

For CLI usage:

```bash
npm install -g @thermal-label/labelmanager-cli
```

## Quick Start

### Node.js

```ts
import { openPrinter } from "@thermal-label/labelmanager-node";

const printer = await openPrinter();
await printer.printText("Hello DYMO");
printer.close();
```

### Browser (WebHID)

```ts
import { requestPrinter } from "@thermal-label/labelmanager-web";

const printer = await requestPrinter();
await printer.printText("Hello WebHID");
```

### CLI

```bash
dymo list
dymo print text "Hello DYMO" --tape 12
```

## Packages

- `@thermal-label/labelmanager-core`: shared bitmap rendering and protocol encoding primitives.
- `@thermal-label/labelmanager-node`: Node.js HID transport and printer APIs.
- `@thermal-label/labelmanager-web`: browser WebHID transport and printer APIs.
- `@thermal-label/labelmanager-cli`: command-line tool (`dymo`) for listing, printing, status, and Linux setup.

## Supported Devices

This project targets DYMO LabelManager-family devices. Verified and expected models are listed on the project website:
https://thermal-label.github.io/labelmanager/

## Platform Notes

- Node packages require Node.js `>=24`.
- Browser package requires WebHID-compatible browsers and secure contexts (`https://` or `localhost`).
- Linux users typically need `udev` rules and `usb_modeswitch` for reliable USB access.

## License

MIT
