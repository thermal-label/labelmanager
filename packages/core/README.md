# @thermal-label/labelmanager-core

Core protocol and bitmap helpers for DYMO LabelManager printers.

Use this package when you want low-level rendering and encoding primitives to build custom Node.js or browser printing flows.

It is the shared foundation used by the higher-level packages:

- `@thermal-label/labelmanager-node`
- `@thermal-label/labelmanager-web`
- `@thermal-label/labelmanager-cli`

## Install

```bash
pnpm add @thermal-label/labelmanager-core
```

```bash
npm install @thermal-label/labelmanager-core
```

## Quick Start

```ts
import { encodeLabel, renderText } from "@thermal-label/labelmanager-core";

const bitmap = renderText("Hello DYMO");
const reports = encodeLabel(bitmap, { tapeWidth: 12, density: "normal" });
```

`reports` is an array of `Uint8Array` chunks ready to send to a HID transport implementation.

## API Highlights

- `renderText(text, options)` renders text into a monochrome label bitmap.
- `renderImage(rawImageData, options)` converts raw pixels into a printable label bitmap.
- `encodeLabel(bitmap, printOptions)` encodes a bitmap into protocol reports.
- `buildResetSequence()` and `buildFormFeed()` expose lower-level protocol commands.
- `DEVICES` and `findDevice(vid, pid)` provide supported device metadata.

## Common Examples

### Render and encode text with print options

```ts
import { encodeLabel, renderText } from "@thermal-label/labelmanager-core";

const bitmap = renderText("Shelf A-17", { invert: false });
const reports = encodeLabel(bitmap, {
  tapeWidth: 12,
  density: "high",
  copies: 2,
});
```

### Convert raw RGBA image pixels into printer reports

```ts
import { encodeLabel, renderImage } from "@thermal-label/labelmanager-core";

const raw = {
  width: 128,
  height: 32,
  data: new Uint8Array(128 * 32 * 4), // RGBA pixels
};

const bitmap = renderImage(raw, { dither: true, threshold: 128 });
const reports = encodeLabel(bitmap, { tapeWidth: 12 });
```

### Check whether a USB HID device is supported

```ts
import { findDevice } from "@thermal-label/labelmanager-core";

const descriptor = findDevice(0x0922, 0x1002);
if (!descriptor) {
  throw new Error("Unsupported DYMO LabelManager device");
}
```

## Supported Devices

Use `DEVICES`/`findDevice` to detect known models. The package tracks common DYMO LabelManager-family USB product IDs and tape-width capabilities.

For the latest compatibility list, see the project site:
https://thermal-label.github.io/labelmanager/

## Integration Notes

- This package does not open USB/HID devices by itself.
- Use Node WebUSB/HID wrappers in `@thermal-label/labelmanager-node` or browser WebHID support in `@thermal-label/labelmanager-web` for transport.
- Keep this package if you need custom transport layers while reusing bitmap/protocol logic.

## Environment

- ESM package.
- Designed as a shared protocol/core layer for higher-level packages.

## Links

- Homepage: https://thermal-label.github.io/labelmanager/
- Repository: https://github.com/thermal-label/labelmanager
- Issues: https://github.com/thermal-label/labelmanager/issues

## License

MIT
