# Decisions — LabelManager retrofit to contracts/transport

This file records the shared decisions applied across the retrofit. The full
plan lives in `../driver-retrofit-amendment.md`. Later drivers
(labelwriter, brother-ql) re-use the same conventions.

## D1 — Shared contracts and transport packages

- `@thermal-label/contracts@^0.1.0` — interface package (`PrinterAdapter`,
  `PrinterDiscovery`, `DeviceDescriptor`, `MediaDescriptor`,
  `PrinterStatus`, `PreviewResult`, transport errors).
- `@thermal-label/transport@^0.1.0` — concrete transport classes
  (`UsbTransport`, `TcpTransport`, `WebUsbTransport`,
  `WebBluetoothTransport`).

Both packages are consumed from npm (not workspace-linked): the
driver repos are independent git repos.

## D2 — Unified `print(RawImageData, media?, options?)`

`printText`, `printImage`, and (for brother-ql) `printTwoColor` are
**deleted**. The single `print()` method on `PrinterAdapter` is the
driver-facing API. Callers pass full RGBA; the driver handles
thresholding/dithering/colour-splitting internally.

## D3 — Local type renames

The per-driver concrete types are renamed to avoid colliding with the
base types re-exported from `@thermal-label/contracts`:

- `DeviceDescriptor` (local) → `LabelManagerDevice`, extending
  `import type { DeviceDescriptor } from '@thermal-label/contracts'`.
- Similarly `LabelManagerMedia extends MediaDescriptor`.
- `PrintOptions` (local) → `LabelManagerPrintOptions extends PrintOptions`
  for the protocol-internal `tapeWidth` field.

The contracts base types are re-exported from `*-core` so consumers can
import either the base or the concrete form from the same place.

## D4 — `PrinterStatus` shape

The driver returns the contracts `PrinterStatus` shape:

```ts
{
  ready: boolean;
  mediaLoaded: boolean;
  detectedMedia?: MediaDescriptor;  // always undefined for LabelManager
  errors: PrinterError[];
  rawBytes: Uint8Array;
}
```

LabelManager cannot detect tape width — `detectedMedia` is always
`undefined`. The user must always pass `media` to `print()` /
`createPreview()`.

Error codes used:
- `not_ready` — printer busy
- `no_media` — no tape inserted
- `low_media` — tape supply low

## D5 — `DEFAULT_MEDIA` for assumed previews

`createPreview()` without media and without detected media falls back to
`DEFAULT_MEDIA` (12 mm tape) with `PreviewResult.assumed = true`. The
offline variant `createPreviewOffline()` always requires explicit media
and always returns `assumed: false`.

## D6 — `discovery` named export

The node package exports a singleton named `discovery` implementing
`PrinterDiscovery`. This matches the convention the unified
`thermal-label-cli` uses for driver auto-detection.

Web packages do **not** implement `PrinterDiscovery` — browser discovery
uses `navigator.usb.requestDevice()` via `WebUsbTransport.request()`.

## D7 — Transport byte-interface

All transports use `Uint8Array` and async `close()`, per the contracts
`Transport` interface. The LabelManager driver previously had a
`Buffer`-based sync-close `PrinterTransport` — rewritten here to match.

## D8 — CLI removal and version bump

- `packages/cli/` removed from the monorepo. The unified
  `thermal-label-cli` replaces it.
- `npm unpublish @thermal-label/labelmanager-cli --force` is performed
  by the maintainer after the retrofit merges — not part of the
  automated steps.
- All packages bump 0.0.1 → 0.2.0 in a single release. At 0.x there is
  no deprecation path.
