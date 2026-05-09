# Core

`@thermal-label/labelmanager-core` is the shared protocol layer used by
both the Node.js and Web packages. It contains the byte-stream
encoder, the bitmap pipeline wiring, the device and media registries,
the status parser, and the offline preview helper. It also re-exports
the `@thermal-label/contracts` base types (`PrinterAdapter`,
`MediaDescriptor`, `PrinterStatus`, …) for consumer convenience.

You rarely import `*-core` directly — use the Node.js or Web package
for production code. Core is useful when you need the protocol encoder
or offline preview without a live printer.

::: tip Looking for byte-level details?
The [D1 tape protocol reference](../d1-core/protocol) (in d1-core,
shared with the LabelWriter Duo) documents the USB topology, exact
byte sequences, status bits, mode-switch flow, and a porting checklist
for other languages or runtimes.
:::

## Core API

| Export                                                               | Description                                                   |
| -------------------------------------------------------------------- | ------------------------------------------------------------- |
| `DEVICES` / `findDevice`                                             | Device registry (VID, PID, family, supported tapes)           |
| `MEDIA` / `DEFAULT_MEDIA`                                            | Media registry and the 12 mm fallback for assumed previews    |
| `findMediaByTapeWidth(widthMm)`                                      | Lookup helper                                                 |
| `STATUS_REQUEST`                                                     | `ESC A` byte sequence                                         |
| `parseStatus(bytes)`                                                 | Parse the status byte into `PrinterStatus` (contracts shape)  |
| `createPreviewOffline(image, media)`                                 | Render `PreviewResult` without a live printer connection      |
| `buildPrinterStream(bitmap, engine, opts, media)`                    | Encode a full label job as a contiguous USB byte stream       |
| `LabelManagerDevice`                                                 | Device descriptor type (extends contracts `DeviceDescriptor`) |
| `LabelManagerMedia`                                                  | Media descriptor type (extends contracts `MediaDescriptor`)   |
| `LabelManagerPrintOptions`                                           | Protocol options (`copies`, `tapeWidth`, `rotate`)            |
| `TapeWidth`                                                          | `6 \| 9 \| 12 \| 19`                                          |
| `PrinterAdapter`, `MediaDescriptor`, `PrinterStatus`, `Transport`, … | Re-exported from `@thermal-label/contracts`                   |

## One encoder, transport's choice of interface

`buildPrinterStream` produces a single contiguous byte stream — the
opcode order is fixed and bench-validated against the labelle Python
prior art (see [protocol reference](../d1-core/protocol)). The transport layer
is responsible for chunking that stream to the target endpoint's
`wMaxPacketSize` (64 bytes) and for selecting which USB interface to
write to.

The stream prints correctly on either of the two viable interfaces a
LabelManager exposes after mode-switch:

- **Printer class** (Interface 0, bulk EP `0x05` OUT) — the default.
  Linux doesn't bind a kernel driver to it, so no `detachKernelDriver`
  step is needed and the udev story is conventional.
- **HID** (Interface 2, interrupt EP `0x01` OUT) — viable, but the
  Node driver needs to detach `usbhid` first; the browser would use
  WebHID instead of WebUSB. Not currently exposed by the Node or web
  packages, but the encoder output is interface-agnostic.

The byte stream is identical in either case. There is no separate
"HID-style report" output shape — that was a misconception in earlier
versions of this driver, drawn from generic ESC/POS receipt-printer
conventions that don't apply to D1.
