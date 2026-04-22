# labelmanager

TypeScript-first DYMO D1 LabelManager driver for Node.js, browsers (WebUSB), and CLI workflows.

## Install

```bash
pnpm add @thermal-label/labelmanager-node
```

```bash
npm install @thermal-label/labelmanager-node
```

## Features

- Node.js USB printing for DYMO LabelManager devices
- Browser printing with WebUSB (Chrome/Edge)
- CLI commands for printing, status checks, and Linux setup
- Shared protocol core with tests and typed APIs
- Zero external runtime dependencies in core

## Supported Devices

| Device | USB PID | Tape widths | Status |
|---|---|---|---|
| LabelManager PnP | `0x1002` | 6, 9, 12mm | Verified |
| LabelManager 420P | `0x1004` | 6, 9, 12, 19mm | Expected |
| LabelManager Wireless PnP | `0x1008` | 6, 9, 12mm | Expected |
| LabelManager PC | `0x1002` | 6, 9, 12mm | Expected |
| LabelPoint 350 | `0x1003` | 6, 9, 12mm | Expected |
| MobileLabeler | `0x1009` | 6, 9, 12mm | Expected |

## Three-line Example

```ts
import { openPrinter } from "@thermal-label/labelmanager-node";
const printer = await openPrinter();
await printer.printText("Hello DYMO");
```

## Browser Demo

<LiveDemo />

> Printing requires Chrome or Edge with WebUSB support. The bitmap preview works in any modern browser.
