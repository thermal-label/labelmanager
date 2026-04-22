# @thermal-label/labelmanager-node

Node.js USB HID driver for DYMO LabelManager printers.

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
- Access to USB HID devices.
- Linux users typically need udev rules and `usb_modeswitch`.
- Optional image decoding dependency: `@napi-rs/canvas` (required for image file and buffer decoding).

## Links

- Homepage: https://thermal-label.github.io/labelmanager/
- Repository: https://github.com/thermal-label/labelmanager
- Issues: https://github.com/thermal-label/labelmanager/issues

## License

MIT
