# Printing Images

`printImage` accepts file paths, image buffers, or already decoded raw image data.

When you provide a file path or buffer, decoding uses optional `@napi-rs/canvas`.

## Example

```ts
import { openPrinter } from "@thermal-label/labelmanager-node";

const printer = await openPrinter();
await printer.printImage("./logo.png", {
  dither: true,
  threshold: 140,
  density: "normal"
});
printer.close();
```

If `@napi-rs/canvas` is not installed, pass pre-decoded raw image data instead.
