# Getting Started

Pick the integration that fits your stack. Both share the same underlying
protocol and device support.

## Node.js

Install and print in four lines:

```bash
pnpm add @thermal-label/labelmanager-node
```

```ts
import { discovery } from '@thermal-label/labelmanager-node';
import { MEDIA } from '@thermal-label/labelmanager-core';

const printer = await discovery.openPrinter();
try {
  // image is `RawImageData` from `@mbtech-nl/bitmap` — `{ width, height, data }`
  // where `data` is a `Uint8Array` of RGBA pixels.
  await printer.print(image, MEDIA.TAPE_12MM);
} finally {
  await printer.close();
}
```

→ [Full Node.js guide](./node) — discovery, media, status, options.

## Browser (WebUSB)

Install and call from a user gesture:

```bash
pnpm add @thermal-label/labelmanager-web
```

```ts
import { requestPrinter } from '@thermal-label/labelmanager-web';
import { MEDIA } from '@thermal-label/labelmanager-core';

// Must be called from a user gesture (button click, etc.)
const printer = await requestPrinter();
try {
  await printer.print(image, MEDIA.TAPE_12MM);
} finally {
  await printer.close();
}
```

→ [Full Web guide](./web) — vanilla JS, React, status checks.

## Unified CLI

For one-off printing from the command line, use the shared
[`thermal-label-cli`](https://www.npmjs.com/package/thermal-label-cli)
instead of a DYMO-specific tool. It auto-detects every installed
`@thermal-label/*-node` driver via the `discovery` export convention.

```bash
pnpm add -g thermal-label-cli @thermal-label/labelmanager-node
thermal-label list
thermal-label print ./label.png --media tape-12
```

---

## Linux Setup

Linux requires a udev rule so your user account can access the DYMO USB
device without `sudo`. Call `generateUdevRules()` from the node package
to get the right content.

### 1. Install required packages

```bash
sudo apt-get update
sudo apt-get install -y usb-modeswitch usb-modeswitch-data
```

`usb_modeswitch` ensures the device enumerates correctly with its Printer
class interface exposed alongside the HID and Mass Storage interfaces.

### 2. Generate the udev rule

```ts
import { generateUdevRules } from '@thermal-label/labelmanager-node';
import { writeFileSync } from 'node:fs';
writeFileSync('99-dymo-labelmanager.rules', generateUdevRules());
```

Or a one-liner:

```bash
node -e "console.log(require('@thermal-label/labelmanager-node').generateUdevRules())" \
  | sudo tee /etc/udev/rules.d/99-dymo-labelmanager.rules
```

The generated file contains two rules — one for `hidraw` and one for
`usb` — so both the HID status interface and the raw USB print interface
are accessible without elevated privileges.

### 3. Reload udev

```bash
sudo udevadm control --reload-rules
sudo udevadm trigger
```

### 4. Reconnect and verify

Unplug and replug the printer, then enumerate:

```ts
import { discovery } from '@thermal-label/labelmanager-node';
console.log(await discovery.listPrinters());
```

If your device appears, setup is complete.

---

## Windows Setup

Some Windows systems need the default printer driver replaced with
WinUSB so `node-usb` can claim the device.

1. Download and open [Zadig](https://zadig.akeo.ie/) as Administrator
2. Select the DYMO device from the dropdown
3. Choose **WinUSB** as the target driver
4. Click **Install Driver** and reconnect the printer

---

## Looking for a Python alternative?

[labelle](https://github.com/labelle-org/labelle) is a mature open-source
Python tool for the same DYMO LabelManager device family. If your stack
is Python-based, it may be a better fit.
