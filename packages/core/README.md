# @thermal-label/labelmanager-core

Core protocol and bitmap helpers for DYMO LabelManager / LabelPoint
D1 tape printers.

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
import {
  buildPrinterStream,
  findDevice,
  renderText,
} from '@thermal-label/labelmanager-core';

const device = findDevice(0x0922, 0x1002);
if (!device) throw new Error('Unsupported DYMO device');

const bitmap = renderText('Hello DYMO');
const stream = buildPrinterStream(bitmap, device.engines[0], { tapeWidth: 12 });
```

`stream` is a single `Uint8Array` that the transport layer ships to
the printer's OUT endpoint. The transport is responsible for chunking
to the endpoint's `wMaxPacketSize` (64 bytes).

## API Highlights

- `renderText(text, options)` renders text into a monochrome label bitmap.
- `renderImage(rawImageData, options)` converts raw pixels into a printable label bitmap.
- `buildPrinterStream(bitmap, engine, options, media)` encodes a complete print job into a contiguous USB byte stream.
- `STATUS_REQUEST` and `parseStatus(bytes)` for the 1-byte status protocol.
- `DEVICES` and `findDevice(vid, pid)` provide supported device metadata.

## Common Examples

### Render and encode text with print options

```ts
import {
  buildPrinterStream,
  findDevice,
  renderText,
} from '@thermal-label/labelmanager-core';

const device = findDevice(0x0922, 0x1002)!;
const bitmap = renderText('Shelf A-17', { invert: false });
const stream = buildPrinterStream(bitmap, device.engines[0], {
  tapeWidth: 12,
  copies: 2,
});
```

### Convert raw RGBA image pixels into a print stream

```ts
import {
  buildPrinterStream,
  findDevice,
  renderImage,
} from '@thermal-label/labelmanager-core';

const device = findDevice(0x0922, 0x1002)!;
const raw = {
  width: 128,
  height: 32,
  data: new Uint8Array(128 * 32 * 4), // RGBA pixels
};

const bitmap = renderImage(raw, { dither: true, threshold: 128 });
const stream = buildPrinterStream(bitmap, device.engines[0], { tapeWidth: 12 });
```

### Check whether a USB device is supported

```ts
import { findDevice } from '@thermal-label/labelmanager-core';

const descriptor = findDevice(0x0922, 0x1002);
if (!descriptor) {
  throw new Error('Unsupported DYMO LabelManager device');
}
```

## Supported Devices

Use `DEVICES`/`findDevice` to detect known models. The package tracks common DYMO LabelManager-family USB product IDs and tape-width capabilities.

For the latest compatibility list, see the project site:
https://thermal-label.github.io/labelmanager/

## Integration Notes

- This package does not open USB devices by itself.
- Use `@thermal-label/labelmanager-node` (libusb / `usb`) or `@thermal-label/labelmanager-web` (WebUSB) for transport.
- Keep this package if you need custom transport layers while reusing bitmap/protocol logic.

## Environment

- ESM package.
- Designed as a shared protocol/core layer for higher-level packages.

## Links

- Homepage: https://thermal-label.github.io/labelmanager/
- Repository: https://github.com/thermal-label/labelmanager
- Issues: https://github.com/thermal-label/labelmanager/issues

## Supported hardware

<!-- HARDWARE_TABLE:START -->
**8 devices** — 1 verified · 0 partial · 1 broken · 6 untested

| Model | Key | USB PID | Transports | Status |
| --- | --- | --- | --- | --- |
| [LabelManager 280](https://thermal-label.github.io/hardware/labelmanager/lm-280) | `LM_280` | 0x1006 | USB | ⏳ untested |
| [LabelManager 400](https://thermal-label.github.io/hardware/labelmanager/lm-400) | `LM_400` | 0x0013 | USB | ⏳ untested |
| [LabelManager 420P](https://thermal-label.github.io/hardware/labelmanager/lm-420p) | `LM_420P` | 0x1004 | USB | ⏳ untested |
| [LabelManager PC](https://thermal-label.github.io/hardware/labelmanager/lm-pc) | `LM_PC` | 0x0011 | USB | ⏳ untested |
| [LabelManager PnP](https://thermal-label.github.io/hardware/labelmanager/lm-pnp) | `LM_PNP` | 0x1002 | USB | ✅ verified |
| [LabelManager Wireless PnP](https://thermal-label.github.io/hardware/labelmanager/lm-wireless-pnp) | `LM_WIRELESS_PNP` | 0x1008 | USB | ⏳ untested |
| [LabelPoint 350](https://thermal-label.github.io/hardware/labelmanager/labelpoint-350) | `LABELPOINT_350` | 0x0015 | USB | ⏳ untested |
| [MobileLabeler](https://thermal-label.github.io/hardware/labelmanager/mobile-labeler) | `MOBILE_LABELER` | 0x1009 | USB | ❌ broken |

Click any model to open its detail page on the docs site, where engines, supported media, and verification reports live. The same data backs the [interactive cross-driver table](https://thermal-label.github.io/hardware/).
<!-- HARDWARE_TABLE:END -->

## License

MIT
