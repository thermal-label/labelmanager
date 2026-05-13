# @thermal-label/labelmanager-web

WebUSB browser driver for DYMO LabelManager / LabelPoint D1 tape printers.

Use this package to connect and print labels directly from supported browsers.

## Install

```bash
pnpm add @thermal-label/labelmanager-web
```

```bash
npm install @thermal-label/labelmanager-web
```

## Quick Start

```ts
import { requestPrinter } from '@thermal-label/labelmanager-web';

const printer = await requestPrinter();
await printer.printText('Hello WebUSB', { tapeWidth: 12 });
```

## Usage

### Print text

```ts
import { requestPrinter } from '@thermal-label/labelmanager-web';

const printer = await requestPrinter();
await printer.printText('Shipping Label', {
  tapeWidth: 12,
  copies: 1,
});
```

### Print image URL

```ts
import { requestPrinter } from '@thermal-label/labelmanager-web';

const printer = await requestPrinter();
await printer.printImageURL('/assets/label.png', { tapeWidth: 12, dither: true });
```

## Requirements

- Browser with WebUSB support (for example recent Chromium-based browsers).
- Secure context (`https://` or `http://localhost`).
- `requestPrinter()` must be triggered from a user gesture (button click, etc.).

## Links

- Homepage: https://thermal-label.github.io/labelmanager/
- Repository: https://github.com/thermal-label/labelmanager
- Issues: https://github.com/thermal-label/labelmanager/issues

## Supported hardware

<!-- HARDWARE_TABLE:START -->
<!-- HARDWARE_TABLE:END -->

## License

MIT
