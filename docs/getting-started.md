# Getting Started

Pick the integration that fits your stack. All three share the same underlying protocol and device support.

## Node.js

Install and print in three lines:

```bash
pnpm add @thermal-label/labelmanager-node
```

```ts
import { openPrinter } from '@thermal-label/labelmanager-node';
const printer = await openPrinter();
await printer.printText('Hello DYMO');
printer.close();
```

→ [Full Node.js guide](/node) — text, images, multi-printer, options.

## CLI

Install the package, then run `dymo`:

```bash
pnpm add -D @thermal-label/labelmanager-cli
dymo print text "Hello"
```

From inside this monorepo, use the root convenience script instead:

```bash
pnpm dymo print text "Hello"
```

`pnpm dymo` is a script in the root `package.json` that forwards to the
`@thermal-label/labelmanager-cli` binary. No global install needed.

→ [Full CLI guide](/cli) — all commands and flags.

## Browser (WebUSB)

Install and call from a user gesture:

```bash
pnpm add @thermal-label/labelmanager-web
```

```ts
import { requestPrinter } from '@thermal-label/labelmanager-web';

// Must be called from a user gesture (button click, etc.)
const printer = await requestPrinter();
await printer.printText('Hello from the browser', { tapeWidth: 12 });
await printer.disconnect();
```

→ [Full Web guide](/web) — vanilla JS, React, status checks.

---

## Linux Setup

Linux requires a udev rule so your user account can access the DYMO USB device
without `sudo`. The CLI generates the correct rule for you.

### 1. Install required packages

```bash
sudo apt-get update
sudo apt-get install -y usb-modeswitch usb-modeswitch-data
```

`usb_modeswitch` ensures the device enumerates correctly with its Printer class
interface exposed alongside the HID and Mass Storage interfaces.

### 2. Generate the udev rule

```bash
pnpm dymo setup linux
```

Copy the output into `/etc/udev/rules.d/99-dymo-labelmanager.rules`.

The generated file contains two rules — one for `hidraw` and one for `usb` —
so both the HID status interface and the raw USB print interface are accessible
without elevated privileges.

### 3. Reload udev

```bash
sudo udevadm control --reload-rules
sudo udevadm trigger
```

### 4. Reconnect and verify

Unplug and replug the printer, then run:

```bash
pnpm dymo list
```

If your device appears in the list, setup is complete.

---

## Windows Setup

Some Windows systems need the default printer driver replaced with WinUSB so
`node-hid` can claim the device.

1. Download and open [Zadig](https://zadig.akeo.ie/) as Administrator
2. Select the DYMO device from the dropdown
3. Choose **WinUSB** as the target driver
4. Click **Install Driver** and reconnect the printer
