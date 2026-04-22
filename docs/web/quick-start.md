# Quick Start (Vanilla JS)

```ts
import { requestPrinter } from "@thermal-label/labelmanager-web";

// Triggers browser USB permission prompt — must be called from a user gesture
const printer = await requestPrinter();
await printer.printText("Hello from the browser", { tapeWidth: 12 });
await printer.disconnect();
```

For image printing from URLs:

```ts
await printer.printImageURL("/assets/logo.png", { dither: true });
```

For status checks:

```ts
const status = await printer.getStatus();
console.log(status.ready, status.tapeInserted, status.labelLow);
```

## How it works

`requestPrinter()` calls `navigator.usb.requestDevice()`, then opens the
device and claims Interface 0 (Printer class, EP 5 OUT). Print data is encoded
with the same `buildPrinterStream` function used by the Node.js package —
`ESC C 0` + `ESC D N` + `SYN` row bytes + `ESC A` — sent as raw bulk USB
transfers, not HID reports.
