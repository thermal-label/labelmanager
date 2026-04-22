# Multi-printer Setups

Use `serialNumber` in `openPrinter` when multiple DYMO devices are connected.

## Discover serial numbers

```ts
import { listPrinters } from "@thermal-label/labelmanager-node";
console.log(await listPrinters());
```

## Target a specific printer

```ts
import { openPrinter } from "@thermal-label/labelmanager-node";

const printer = await openPrinter({ serialNumber: "ABC12345" });
await printer.printText("Station 3");
printer.close();
```

This approach avoids race conditions in production systems with shared USB hubs.
