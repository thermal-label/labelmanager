# Quick Start (Vanilla JS)

```ts
import { requestPrinter } from "@thermal-label/labelmanager-web";

const printer = await requestPrinter();
await printer.printText("WebHID ready");
await printer.disconnect();
```

For image printing from URLs:

```ts
await printer.printImageURL("/assets/logo.png", { dither: true });
```
