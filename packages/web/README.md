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
**8 devices** — 1 verified · 0 partial · 1 broken · 6 untested

| Model | Key | USB PID | Transports | Status |
| --- | --- | --- | --- | --- |
| [LabelManager 280](https://thermal-label.github.io/hardware/labelmanager/lm-280) | `LM_280` | 0x1006 | USB | ⏳ untested |
| [LabelManager 400](https://thermal-label.github.io/hardware/labelmanager/lm-400) | `LM_400` | 0x0013 | USB | ⏳ untested |
| [LabelManager 420P](https://thermal-label.github.io/hardware/labelmanager/lm-420p) | `LM_420P` | 0x1004 | USB | ⏳ untested |
| [LabelManager PC](https://thermal-label.github.io/hardware/labelmanager/lm-pc) | `LM_PC` | 0x0011 | USB | ⏳ untested |
| [LabelManager PnP](https://thermal-label.github.io/hardware/labelmanager/lm-pnp) | `LM_PNP` | 0x1002 | USB | ✅ verified |
| [LabelManager Wireless PnP](https://thermal-label.github.io/hardware/labelmanager/lm-wireless-pnp) | `LM_WIRELESS_PNP` | 0x1008 | USB | ⏳ untested |
| [LabelPoint 350](https://thermal-label.github.io/hardware/labelmanager/labelpoint-350) | `LABELPOINT_350` | 0x0015 | USB | ⏳ untested |
| [MobileLabeler](https://thermal-label.github.io/hardware/labelmanager/mobile-labeler) | `MOBILE_LABELER` | 0x1009 | USB | ❌ broken |

Click any model to open its detail page on the docs site, where engines, supported media, and verification reports live. The same data backs the [interactive cross-driver table](https://thermal-label.github.io/hardware/).
<!-- HARDWARE_TABLE:END -->

## License

MIT
