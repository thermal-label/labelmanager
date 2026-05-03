# Hardware Compatibility

The canonical per-device matrix lives on the org-wide hardware page:
[thermal-label.github.io/hardware/](https://thermal-label.github.io/hardware/).
It's generated from each driver's `data/devices/*.json5` source of truth — for
this driver, those entries live under
[`packages/core/data/devices/`](https://github.com/thermal-label/labelmanager/tree/main/packages/core/data/devices).
Got an untested device? Follow the
[verification checklist](./verification-checklist) and file a hardware
verification issue; the PID, support status, and quirks for that entry land
inline in the JSON5 file.

## Supported devices

<!-- HARDWARE_TABLE:START -->

**8 devices** — 1 verified · 0 partial · 1 broken · 6 untested

| Model                                                                                              | Key               | USB PID | Transports | Status      |
| -------------------------------------------------------------------------------------------------- | ----------------- | ------- | ---------- | ----------- |
| [LabelManager 280](https://thermal-label.github.io/hardware/labelmanager/lm-280)                   | `LM_280`          | 0x1006  | USB        | ⏳ untested |
| [LabelManager 400](https://thermal-label.github.io/hardware/labelmanager/lm-400)                   | `LM_400`          | 0x0013  | USB        | ⏳ untested |
| [LabelManager 420P](https://thermal-label.github.io/hardware/labelmanager/lm-420p)                 | `LM_420P`         | 0x1004  | USB        | ⏳ untested |
| [LabelManager PC](https://thermal-label.github.io/hardware/labelmanager/lm-pc)                     | `LM_PC`           | 0x0011  | USB        | ⏳ untested |
| [LabelManager PnP](https://thermal-label.github.io/hardware/labelmanager/lm-pnp)                   | `LM_PNP`          | 0x1002  | USB        | ✅ verified |
| [LabelManager Wireless PnP](https://thermal-label.github.io/hardware/labelmanager/lm-wireless-pnp) | `LM_WIRELESS_PNP` | 0x1008  | USB        | ⏳ untested |
| [LabelPoint 350](https://thermal-label.github.io/hardware/labelmanager/labelpoint-350)             | `LABELPOINT_350`  | 0x0015  | USB        | ⏳ untested |
| [MobileLabeler](https://thermal-label.github.io/hardware/labelmanager/mobile-labeler)              | `MOBILE_LABELER`  | 0x1009  | USB        | ❌ broken   |

Click any model to open its detail page on the docs site, where engines, supported media, and verification reports live. The same data backs the [interactive cross-driver table](https://thermal-label.github.io/hardware/).

<!-- HARDWARE_TABLE:END -->
