# Node.js

`@thermal-label/labelmanager-node` is the production package for server
or desktop Node.js applications that need direct USB access to DYMO
LabelManager printers. It implements the `PrinterAdapter` interface
from [`@thermal-label/contracts`](https://www.npmjs.com/package/@thermal-label/contracts)
and opens the USB port through
[`@thermal-label/transport`](https://www.npmjs.com/package/@thermal-label/transport).

## Install

```bash
pnpm add @thermal-label/labelmanager-node
```

## Quick example

```ts
import { discovery } from '@thermal-label/labelmanager-node';
import { MEDIA } from '@thermal-label/labelmanager-core';

const printer = await discovery.openPrinter();
try {
  await printer.print(image, MEDIA.TAPE_12MM);
} finally {
  await printer.close();
}
```

`image` is `RawImageData` — `{ width, height, data }` where `data` is a
`Uint8Array` of RGBA pixels. Any source that can produce RGBA works:
`@napi-rs/canvas` for PNG/JPEG decoding, `node-canvas` for server-side
rendering, or your own image pipeline.

---

## The adapter interface

`DymoPrinter` implements
[`PrinterAdapter`](https://www.npmjs.com/package/@thermal-label/contracts) —
the same shape every `@thermal-label/*-node` driver exports. Code that
programs against the interface works with any family without branching:

```ts
import type { PrinterAdapter } from '@thermal-label/contracts';

async function printTo(printer: PrinterAdapter, image: RawImageData, media) {
  try {
    await printer.print(image, media);
  } finally {
    await printer.close();
  }
}
```

Surface:

| Method                                      | Description                                     |
| ------------------------------------------- | ----------------------------------------------- |
| `print(image, media?, options?)`            | Print one label; accepts full RGBA              |
| `createPreview(image, options?)`            | Render separated 1bpp planes for UI previews    |
| `getStatus()`                               | Query ready / media-loaded / errors / raw bytes |
| `close()`                                   | Release the USB interface                       |
| `family` / `model` / `device` / `connected` | Identification                                  |

---

## Media

LabelManager printers cannot detect tape width over USB. Always pass
the media descriptor explicitly:

```ts
import { MEDIA, type LabelManagerMedia } from '@thermal-label/labelmanager-core';

MEDIA.TAPE_6MM; // 6 mm tape
MEDIA.TAPE_9MM; // 9 mm tape
MEDIA.TAPE_12MM; // 12 mm tape — DEFAULT_MEDIA for previews
MEDIA.TAPE_19MM; // 19 mm tape
```

`print()` throws `MediaNotSpecifiedError` if you call it without media
and `getStatus()` hasn't been called (or returned no detection).

---

## Discovery

```ts
import { discovery } from '@thermal-label/labelmanager-node';

const printers = await discovery.listPrinters();
// [
//   {
//     device: { name: 'LabelManager PnP', family: 'labelmanager', ... },
//     serialNumber: 'ABC12345',
//     transport: 'usb',
//     connectionId: '1:2',
//   },
//   ...
// ]

// Open the first match
const printer = await discovery.openPrinter();

// Target a specific unit when multiple are attached
const labeler = await discovery.openPrinter({ serialNumber: 'ABC12345' });

// Or filter by VID/PID
const pnp = await discovery.openPrinter({ vid: 0x0922, pid: 0x1002 });
```

`discovery` conforms to the
[`PrinterDiscovery`](https://www.npmjs.com/package/@thermal-label/contracts)
interface, so `thermal-label-cli` picks it up automatically.

---

## Status

```ts
const status = await printer.getStatus();

status.ready; // boolean — printer is idle and error-free
status.mediaLoaded; // boolean — tape cartridge is inserted
status.detectedMedia; // always undefined — LabelManager can't report width
status.errors; // PrinterError[] — { code, message } per error
status.rawBytes; // Uint8Array — raw response for diagnostics
```

Error codes surfaced by LabelManager:

| Code        | Meaning                    |
| ----------- | -------------------------- |
| `not_ready` | Printer is busy            |
| `no_media`  | No tape cartridge inserted |
| `low_media` | Tape supply is low         |

---

## Previewing before printing

`createPreview()` returns a single black 1bpp plane — what the printer
would actually produce for the given media:

```ts
const preview = await printer.createPreview(image, { media: MEDIA.TAPE_9MM });
preview.planes[0]; // { name: 'black', bitmap, displayColor: '#000000' }
preview.assumed; // true if media was not passed and no status was available
```

Without a printer connection, use `createPreviewOffline()` from core:

```ts
import { createPreviewOffline, MEDIA } from '@thermal-label/labelmanager-core';
const preview = createPreviewOffline(image, MEDIA.TAPE_12MM);
```

---

## Linux udev rules

```ts
import { generateUdevRules } from '@thermal-label/labelmanager-node';
console.log(generateUdevRules()); // write into /etc/udev/rules.d/
```

See [Getting Started](./getting-started) for the full Linux setup steps.

---

## API summary

| Export                  | Description                                         |
| ----------------------- | --------------------------------------------------- |
| `discovery`             | `PrinterDiscovery` singleton — enumerate & open     |
| `DymoPrinter`           | Adapter class; consumed directly or via `discovery` |
| `LabelManagerDiscovery` | Class form, in case you want a second instance      |
| `DEFAULT_FILTERS`       | WebUSB filters for browser callers                  |
| `generateUdevRules()`   | Linux udev rule text                                |
