# Core

`@thermal-label/labelmanager-core` is the shared protocol layer used by
both the Node.js and Web packages. It contains the ESC-sequence
encoder, the bitmap pipeline wiring, the device and media registries,
the status parser, and the offline preview helper. It also re-exports
the `@thermal-label/contracts` base types (`PrinterAdapter`,
`MediaDescriptor`, `PrinterStatus`, …) for consumer convenience.

You rarely import `*-core` directly — use the Node.js or Web package
for production code. Core is useful when you need the protocol encoder
or offline preview without a live printer.

::: tip Looking for byte-level details?
The [D1 tape protocol reference](./protocol) documents the USB
topology, exact byte sequences, status bits, mode-switch flow, and a
porting checklist for other languages or runtimes.
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
| `buildPrinterStream(bitmap, opts)`                                   | Encode a full label job as a raw USB byte stream              |
| `buildBitmapRows(bitmap, opts)`                                      | Encode a bitmap as HID-style row reports                      |
| `buildResetSequence(opts)`                                           | ESC reset + media type + density                              |
| `buildFormFeed()`                                                    | Form-feed / cut                                               |
| `encodeLabel(bitmap, opts)`                                          | Full HID report sequence for one or more copies               |
| `LabelManagerDevice`                                                 | Device descriptor type (extends contracts `DeviceDescriptor`) |
| `LabelManagerMedia`                                                  | Media descriptor type (extends contracts `MediaDescriptor`)   |
| `LabelManagerPrintOptions`                                           | Protocol options (`density`, `copies`, `tapeWidth`)           |
| `TapeWidth`                                                          | `6 \| 9 \| 12 \| 19`                                          |
| `PrinterAdapter`, `MediaDescriptor`, `PrinterStatus`, `Transport`, … | Re-exported from `@thermal-label/contracts`                   |

## Why we don't use the HID interface for printing

Several DYMO LabelManager models present three USB interfaces — Printer
class on Interface 0, Mass Storage on Interface 1, and HID on Interface 2. The HID interface only describes the on-device keyboard and feature
buttons; **no output report is defined**, so writing print data to it
fails silently at the firmware level.

Worse: an unrecognised command token (e.g. raw `ESC @` sent as a HID
report body) corrupts the printer's parser state machine across both
interfaces. Subsequent commands to Interface 0 are then also blocked
until a USB reset. Earlier prototypes of this driver hit exactly this
trap — the conclusion is to claim Interface 0 directly via `libusb` (or
WebUSB) and never touch the HID interface for printing.

See the [protocol reference](./protocol) for the full USB topology and
the byte sequences that actually work.
