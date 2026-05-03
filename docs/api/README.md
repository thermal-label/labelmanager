**labelmanager**

***

# @thermal-label/labelmanager

> TypeScript-first DYMO D1 LabelManager driver — Node USB and browser WebUSB.

[![CI](https://github.com/thermal-label/labelmanager/actions/workflows/ci.yml/badge.svg)](https://github.com/thermal-label/labelmanager/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/thermal-label/labelmanager/branch/main/graph/badge.svg)](https://codecov.io/gh/thermal-label/labelmanager)
[![npm core](https://img.shields.io/npm/v/@thermal-label/labelmanager-core.svg?label=core)](https://npmjs.com/package/@thermal-label/labelmanager-core)
[![npm node](https://img.shields.io/npm/v/@thermal-label/labelmanager-node.svg?label=node)](https://npmjs.com/package/@thermal-label/labelmanager-node)
[![npm web](https://img.shields.io/npm/v/@thermal-label/labelmanager-web.svg?label=web)](https://npmjs.com/package/@thermal-label/labelmanager-web)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/thermal-label/labelmanager/blob/main/LICENSE)

## Install

```bash
pnpm add @thermal-label/labelmanager-node    # Node USB
pnpm add @thermal-label/labelmanager-web     # Browser WebUSB
```

For ad-hoc printing from the terminal, install
[`thermal-label-cli`](https://www.npmjs.com/package/thermal-label-cli) — it
auto-detects every installed driver, no per-driver CLI needed.

## Quick example (Node)

```ts
import { discovery } from '@thermal-label/labelmanager-node';
import { TAPE_12MM } from '@thermal-label/labelmanager-core';

const printer = await discovery.openPrinter();
try {
  // image is RawImageData — { width, height, data } where data is RGBA bytes.
  await printer.print(image, TAPE_12MM);
} finally {
  await printer.close();
}
```

## Quick example (Browser)

```ts
import { requestPrinter } from '@thermal-label/labelmanager-web';
import { TAPE_12MM } from '@thermal-label/labelmanager-core';

const printer = await requestPrinter(); // call from a user gesture
try {
  await printer.print(image, TAPE_12MM);
} finally {
  await printer.close();
}
```

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

## Documentation

Full docs at **<https://thermal-label.github.io/labelmanager/>**.

- [Getting started](https://thermal-label.github.io/labelmanager/getting-started)
- [Hardware list](https://thermal-label.github.io/labelmanager/hardware)
- [D1 tape protocol](https://thermal-label.github.io/labelmanager/protocol)
- [Node guide](https://thermal-label.github.io/labelmanager/node)
- [Web guide](https://thermal-label.github.io/labelmanager/web)
- [API reference](https://thermal-label.github.io/labelmanager/api/)
- [Live demo](https://thermal-label.github.io/demo/labelmanager)

## Packages

| Package | Role |
|---|---|
| `@thermal-label/labelmanager-core` | Protocol encoding, device + media registries. Browser + Node. |
| `@thermal-label/labelmanager-node` | Node USB transport. |
| `@thermal-label/labelmanager-web` | Browser WebUSB transport. |

The per-driver `*-cli` package was retired — use the unified
[`thermal-label-cli`](https://www.npmjs.com/package/thermal-label-cli) instead.

## Compatibility

| | |
|---|---|
| Node | ≥ 20.9 (Node 24 LTS recommended) |
| Browsers | Chrome / Edge 89+, secure context (`https://` or `localhost`) |
| Linux | typically needs a `udev` rule for `0922:*`; `usb_modeswitch` may be required for first-run config |
| Devices | DYMO LabelManager (D1 tape) — see hardware list |
| Peers | `@thermal-label/contracts`, `@thermal-label/transport`, `@mbtech-nl/bitmap` |
| License | MIT |

Not affiliated with DYMO. Trademarks belong to their owners.

## Contributing

See [`CONTRIBUTING/`](https://github.com/thermal-label/.github/tree/main/CONTRIBUTING)
on the org `.github` repo.
