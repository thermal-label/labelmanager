# Browser (WebUSB)

`@thermal-label/labelmanager-web` uses the browser
[WebUSB API](https://developer.mozilla.org/en-US/docs/Web/API/WebUSB_API)
to communicate directly with the printer over USB Interface 0 (Printer class).
It uses the same `buildPrinterStream` encoding as the Node.js driver — no server
or native dependencies required.

## Browser support

| Browser    | Support      |
| ---------- | ------------ |
| Chrome 89+ | ✅           |
| Edge 89+   | ✅           |
| Firefox    | ❌ No WebUSB |
| Safari     | ❌ No WebUSB |

WebUSB requires a **secure context** (`https://` or `localhost`).

## Install

```bash
pnpm add @thermal-label/labelmanager-web
```

---

## Vanilla JS quick start

```ts
import { requestPrinter } from '@thermal-label/labelmanager-web';

// Must be called from a user gesture (button click, etc.)
const printer = await requestPrinter();
await printer.printText('Hello from the browser', { tapeWidth: 12 });
await printer.disconnect();
```

### Print an image from a URL

```ts
await printer.printImageURL('/assets/logo.png', { dither: true });
```

### Status check

```ts
const status = await printer.getStatus();
console.log(status.ready, status.tapeInserted, status.labelLow);
```

---

## React example

```tsx
import { useState } from 'react';
import { requestPrinter, type WebDymoPrinter } from '@thermal-label/labelmanager-web';

export function PrintButton() {
  const [printer, setPrinter] = useState<WebDymoPrinter | null>(null);

  async function connect() {
    setPrinter(await requestPrinter());
  }

  async function print() {
    if (!printer) return;
    await printer.printText('React label', { tapeWidth: 12 });
  }

  async function disconnect() {
    if (!printer) return;
    await printer.disconnect();
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

Keep the printer reference in component state. Call `disconnect()` when the
component unmounts or the user is done printing — it releases USB Interface 0
and closes the device.

---

## How it works

`requestPrinter()` calls `navigator.usb.requestDevice()`, then:

1. `open()` — opens the USB device
2. `selectConfiguration(1)` — selects the active configuration
3. `claimInterface(0)` — claims Interface 0 (Printer class, EP 5 OUT)

Print data is encoded with `buildPrinterStream` (same function as the Node.js
package) and sent via `device.transferOut(5, chunk)` in 64-byte chunks.

Status is read actively via `getStatus()` → `transferOut(ESC A)` +
`transferIn(5, 64)`, rather than passively listening to HID input reports.

---

## API summary

| Function / Method                   | Description                            |
| ----------------------------------- | -------------------------------------- |
| `requestPrinter(opts?)`             | Show USB permission prompt and connect |
| `fromHIDDevice(device)`             | Wrap an already-opened `USBDevice`     |
| `printer.printText(text, opts?)`    | Print a text label                     |
| `printer.printImageURL(url, opts?)` | Fetch and print an image from a URL    |
| `printer.getStatus()`               | Read status flags                      |
| `printer.disconnect()`              | Release interface and close device     |

## Live demo

<LiveDemo />

> Requires Chrome or Edge. The bitmap preview works in any modern browser.
