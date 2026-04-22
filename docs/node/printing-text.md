# Printing Text

Text printing uses the bitmap font pipeline from `@mbtech-nl/bitmap` through the core package.

## Example

```ts
import { openPrinter } from "@thermal-label/labelmanager-node";

const printer = await openPrinter();
await printer.printText("Fragile", {
  density: "high",
  copies: 2,
  invert: false
});
printer.close();
```

## Options

- `density`: `normal` or `high`
- `copies`: number of times to print the same label
- `invert`: white-on-black rendering for the bitmap before encoding
