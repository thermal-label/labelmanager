# @thermal-label/labelmanager-node

Node.js USB driver for DYMO LabelManager / LabelPoint D1 tape printers.

Use this package to discover connected printers and print text or images from Node.js.

## Install

```bash
pnpm add @thermal-label/labelmanager-node
```

```bash
npm install @thermal-label/labelmanager-node
```

## Quick Start

```ts
import { openPrinter } from '@thermal-label/labelmanager-node';

const printer = await openPrinter();
await printer.printText('Hello DYMO', { tapeWidth: 12 });
printer.close();
```

## Usage

### Discover printers

```ts
import { listPrinters } from '@thermal-label/labelmanager-node';

const printers = await listPrinters();
console.log(printers);
```

### Print an image

```ts
import { openPrinter } from '@thermal-label/labelmanager-node';

const printer = await openPrinter();
await printer.printImage('./label.png', { tapeWidth: 12, dither: true });
printer.close();
```

### Linux setup helper

```ts
import { generateUdevRules } from '@thermal-label/labelmanager-node';

console.log(generateUdevRules());
```

## Requirements

- Node.js 24 or newer.
- Access to the printer's USB Printer-class interface.
- Linux users typically need udev rules and `usb_modeswitch`.
- Optional image decoding dependency: `@napi-rs/canvas` (required for image file and buffer decoding).

## Links

- Homepage: https://thermal-label.github.io/labelmanager/
- Repository: https://github.com/thermal-label/labelmanager
- Issues: https://github.com/thermal-label/labelmanager/issues

## Supported hardware

<!-- HARDWARE_TABLE:START -->

**8 devices** — 1 verified · 0 partial · 1 broken · 6 untested

| Model                                                                                              | Key               | USB PID | Transports | Status      |
| -------------------------------------------------------------------------------------------------- | ----------------- | ------- | ---------- | ----------- |
| [LabelManager 280](https://thermal-label.github.io/hardware/labelmanager/lm-280)                   | `LM_280`          | 0x1006  | USB        | ⏳ untested |
| [LabelManager 400](https://thermal-label.github.io/hardware/labelmanager/lm-400)                   | `LM_400`          | 0x0013  | USB        | ⏳ untested |
| [LabelManager 420P](https://thermal-label.github.io/hardware/labelmanager/lm-420p)                 | `LM_420P`         | 0x1004  | USB        | ⏳ untested |
| [LabelManager PC](https://thermal-label.github.io/hardware/labelmanager/lm-pc)                     | `LM_PC`           | 0x0011  | USB        | ⏳ untested |
| [LabelManager PnP](https://thermal-label.github.io/hardware/labelmanager/lm-pnp)                   | `LM_PNP`          | 0x1002  | USB        | ✅ verified |
| [LabelManager Wireless PnP](https://thermal-label.github.io/hardware/labelmanager/lm-wireless-pnp) | `LM_WIRELESS_PNP` | 0x1008  | USB        | ⏳ untested |
| [LabelPoint 350](https://thermal-label.github.io/hardware/labelmanager/labelpoint-350)             | `LABELPOINT_350`  | 0x0015  | USB        | ⏳ untested |
| [MobileLabeler](https://thermal-label.github.io/hardware/labelmanager/mobile-labeler)              | `MOBILE_LABELER`  | 0x1009  | USB        | ❌ broken   |

Click any model to open its detail page on the docs site, where engines, supported media, and verification reports live. The same data backs the [interactive cross-driver table](https://thermal-label.github.io/hardware/).

<!-- HARDWARE_TABLE:END -->

## License

MIT
