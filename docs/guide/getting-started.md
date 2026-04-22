# Getting Started

## Prerequisites

- Node.js `>=24`
- `pnpm >=9` (or npm)
- A supported DYMO LabelManager printer connected over USB

## Install

```bash
pnpm add @thermal-label/labelmanager-node
```

## Print Your First Label

```ts
import { openPrinter } from "@thermal-label/labelmanager-node";

const printer = await openPrinter();
await printer.printText("First label", { density: "normal" });
printer.close();
```

## Windows Notes

Some Windows systems require replacing the default printer driver with WinUSB
using [Zadig](https://zadig.akeo.ie/) so `node-hid` can access the device.

Steps:

1. Open Zadig as Administrator
2. Select the DYMO device
3. Choose WinUSB
4. Install the driver and reconnect the printer
