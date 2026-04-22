# Node Package

`@thermal-label/labelmanager-node` is the production package for server or desktop
Node.js applications that need direct USB HID access.

## Main APIs

- `listPrinters()` to inspect attached compatible devices
- `openPrinter()` to connect and return a `DymoPrinter`
- `DymoPrinter#printText()` for text labels
- `DymoPrinter#printImage()` for image labels
- `DymoPrinter#getStatus()` for status flags
- `generateUdevRules()` for Linux setup output

## Example

```ts
import { listPrinters, openPrinter } from "@thermal-label/labelmanager-node";

console.log(await listPrinters());
const printer = await openPrinter();
await printer.printText("Warehouse A-12");
printer.close();
```
