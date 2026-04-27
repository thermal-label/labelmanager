# Browser (WebUSB)

`@thermal-label/labelmanager-web` uses the browser
[WebUSB API](https://developer.mozilla.org/en-US/docs/Web/API/WebUSB_API)
to talk to the printer over USB Interface 0 (Printer class). It
implements the same `PrinterAdapter` interface the Node.js driver does,
built on `WebUsbTransport` from `@thermal-label/transport/web`. No
server or native dependencies.

## Browser support

| Browser    | Support      |
| ---------- | ------------ |
| Chrome 89+ | ✅           |
| Edge 89+   | ✅           |
| Firefox    | ❌ No WebUSB |
| Safari     | ❌ No WebUSB |

WebUSB requires a **secure context** (`https://` or `localhost`) and a
**user gesture** (click, keypress) for the initial pairing prompt.

## Install

```bash
pnpm add @thermal-label/labelmanager-web
```

---

## Quick start

```ts
import { requestPrinter } from '@thermal-label/labelmanager-web';
import { MEDIA } from '@thermal-label/labelmanager-core';

// Must run from a user gesture.
const printer = await requestPrinter();
try {
  await printer.print(image, MEDIA.TAPE_12MM);
} finally {
  await printer.close();
}
```

`image` is `RawImageData` — typically produced from an `ImageData`
canvas read or an `<img>` drawn to an `OffscreenCanvas`:

```ts
const bmp = await createImageBitmap(file);
const canvas = new OffscreenCanvas(bmp.width, bmp.height);
const ctx = canvas.getContext('2d')!;
ctx.drawImage(bmp, 0, 0);
const { data, width, height } = ctx.getImageData(0, 0, bmp.width, bmp.height);
const image = { width, height, data: new Uint8Array(data.buffer) };
```

---

## Status

```ts
const status = await printer.getStatus();

status.ready; // printer is idle and error-free
status.mediaLoaded; // tape cartridge is inserted
status.errors; // structured PrinterError[] — { code, message }
```

Error codes are the same as the Node.js driver — `not_ready`,
`no_media`, `low_media`. `status.detectedMedia` is always `undefined`
because LabelManager has no media-detection protocol.

---

## Previewing

```ts
const preview = await printer.createPreview(image, { media: MEDIA.TAPE_9MM });
// preview.planes[0].bitmap is the 1bpp LabelBitmap the printer would produce
// preview.planes[0].displayColor is '#000000' — useful when rendering to a canvas
```

For offline previews without a live connection, import
`createPreviewOffline` from `@thermal-label/labelmanager-core`.

---

## React example

```tsx
import { useState } from 'react';
import { requestPrinter, type WebDymoPrinter } from '@thermal-label/labelmanager-web';
import { MEDIA } from '@thermal-label/labelmanager-core';

export function PrintButton({
  image,
}: {
  image: { width: number; height: number; data: Uint8Array };
}) {
  const [printer, setPrinter] = useState<WebDymoPrinter | null>(null);

  async function connect() {
    setPrinter(await requestPrinter());
  }

  async function print() {
    if (!printer) return;
    await printer.print(image, MEDIA.TAPE_12MM);
  }

  async function disconnect() {
    if (!printer) return;
    await printer.close();
    setPrinter(null);
  }

  return (
    <div>
      <button onClick={connect} disabled={!!printer}>
        Connect
      </button>
      <button onClick={print} disabled={!printer}>
        Print
      </button>
      <button onClick={disconnect} disabled={!printer}>
        Disconnect
      </button>
    </div>
  );
}
```

Keep the printer reference in component state. Call `close()` on
unmount (or when the user is done) — it releases USB Interface 0 and
closes the device.

---

## How it works

`requestPrinter()` calls `navigator.usb.requestDevice({ filters })`
with the LabelManager VID/PIDs, then hands the `USBDevice` to
`WebUsbTransport.fromDevice()`, which:

1. `device.open()`
2. `device.selectConfiguration(1)` (if not already configured)
3. `device.claimInterface(0)` (Printer class)
4. Resolves the bulk IN / OUT endpoint numbers from the interface
   descriptor — no hard-coded EP numbers.

`print()` encodes via `buildPrinterStream` (identical to the Node.js
driver) and sends in 64-byte chunks via `transferOut`.
`getStatus()` writes `ESC A` and reads the single-byte response.

---

## API summary

| Export                  | Description                                                       |
| ----------------------- | ----------------------------------------------------------------- |
| `requestPrinter(opts?)` | Show USB permission prompt and open a device                      |
| `fromUSBDevice(device)` | Wrap a pre-paired `USBDevice` (from `navigator.usb.getDevices()`) |
| `WebDymoPrinter`        | Adapter class                                                     |
| `DEFAULT_FILTERS`       | LabelManager VID/PID filter set                                   |

`WebDymoPrinter` implements `PrinterAdapter` from
[`@thermal-label/contracts`](https://www.npmjs.com/package/@thermal-label/contracts) —
`print`, `createPreview`, `getStatus`, `close`, plus the `family`,
`model`, `device`, `connected` getters.

## Live demo

→ [Open the interactive demo](/demo/labelmanager) to preview and print a label from
your browser.
