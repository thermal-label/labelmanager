# Node.js

`@thermal-label/labelmanager-node` is the production package for server or desktop
Node.js applications that need direct USB access to DYMO LabelManager printers.

## Install

```bash
pnpm add @thermal-label/labelmanager-node
```

## Quick example

```ts
import { openPrinter } from '@thermal-label/labelmanager-node';

const printer = await openPrinter();
await printer.printText('Warehouse A-12');
printer.close();
```

---

## Printing text

Text is rendered using the built-in bitmap font pipeline from `@mbtech-nl/bitmap`.

```ts
import { openPrinter } from '@thermal-label/labelmanager-node';

const printer = await openPrinter();
await printer.printText('Fragile', {
  tapeWidth: 12, // mm — 6, 9, 12, or 19
  density: 'high',
  copies: 2,
  invert: false, // white-on-black
});
printer.close();
```

### Text options

| Option      | Type                 | Default    | Description               |
| ----------- | -------------------- | ---------- | ------------------------- |
| `tapeWidth` | `6 \| 9 \| 12 \| 19` | `12`       | Tape width in mm          |
| `density`   | `"normal" \| "high"` | `"normal"` | Print density             |
| `copies`    | `number`             | `1`        | Number of copies to print |
| `invert`    | `boolean`            | `false`    | White-on-black rendering  |

---

## Printing images

`printImage` accepts file paths, image buffers, or pre-decoded raw image data.
File path and buffer decoding requires optional `@napi-rs/canvas`.

```ts
import { openPrinter } from '@thermal-label/labelmanager-node';

const printer = await openPrinter();
await printer.printImage('./logo.png', {
  tapeWidth: 12,
  dither: true,
  threshold: 140,
  density: 'normal',
});
printer.close();
```

If `@napi-rs/canvas` is not installed, pass pre-decoded raw image data directly:

```ts
await printer.printImage({
  width: 200,
  height: 64,
  data: rawRgbaBuffer, // Uint8ClampedArray, RGBA
});
```

### Image options

| Option      | Type                 | Default    | Description                    |
| ----------- | -------------------- | ---------- | ------------------------------ |
| `tapeWidth` | `6 \| 9 \| 12 \| 19` | `12`       | Tape width in mm               |
| `density`   | `"normal" \| "high"` | `"normal"` | Print density                  |
| `copies`    | `number`             | `1`        | Number of copies               |
| `dither`    | `boolean`            | `false`    | Floyd-Steinberg dithering      |
| `threshold` | `number`             | `128`      | Binarization threshold (0–255) |

---

## Multi-printer setups

Use `serialNumber` in `openPrinter` when multiple DYMO devices are connected.

### Discover serial numbers

```ts
import { listPrinters } from '@thermal-label/labelmanager-node';

const printers = await listPrinters();
console.log(printers);
// [{ serialNumber: 'ABC12345', name: 'LabelManager PnP', ... }, ...]
```

### Target a specific printer

```ts
import { openPrinter } from '@thermal-label/labelmanager-node';

const printer = await openPrinter({ serialNumber: 'ABC12345' });
await printer.printText('Station 3');
printer.close();
```

Targeting by serial number avoids race conditions in production systems with
shared USB hubs.

---

## Status checks

```ts
const status = await printer.getStatus();
console.log(status.ready); // false if printer is busy
console.log(status.tapeInserted); // false if no tape loaded
console.log(status.labelLow); // true when tape is almost out
```

---

## API summary

| Function / Method                | Description                           |
| -------------------------------- | ------------------------------------- |
| `listPrinters()`                 | List all connected compatible devices |
| `openPrinter(opts?)`             | Connect and return a `DymoPrinter`    |
| `printer.printText(text, opts?)` | Print a text label                    |
| `printer.printImage(src, opts?)` | Print an image label                  |
| `printer.getStatus()`            | Read status flags                     |
| `printer.close()`                | Close the USB device                  |
| `generateUdevRules()`            | Return udev rule strings for Linux    |
