---
'@thermal-label/labelmanager-core': minor
---

Consume `@thermal-label/d1-core` for the D1 wire encoder.

`buildPrinterStream`, `parseStatus`, `STATUS_REQUEST`, `tapeTypeFor`,
`TAPE_TYPE_DEFAULT`, and `TAPE_TYPE_MAX` are now re-exported from
`@thermal-label/d1-core` rather than implemented locally — the
LabelManager and the LabelWriter Duo's tape engine speak the same D1
wire protocol, and centralising the encoder keeps both drivers
byte-for-byte aligned. Public API surface of `labelmanager-core` is
unchanged.

`LabelManagerMedia` now extends `D1Media`; `LabelManagerPrintOptions`
extends `D1PrintOptions`. Same fields, same runtime behaviour.

`buildPrinterStream` no longer reads `LabelManagerPrintOptions.tapeWidth`
— it sources raster width from `media.printableDots` capped at
`engine.headDots`. The field stays on the type for documentation,
ignored at runtime; LM media's `printableDots` already encoded the
same value (32 / 48 / 64 / 64).

Pre-publish: `@thermal-label/d1-core` is consumed via `link:../d1-core`
override alongside the existing contracts override.
