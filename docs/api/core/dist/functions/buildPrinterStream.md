[**labelmanager**](../../../README.md)

***

[labelmanager](../../../modules.md) / [core/dist](../README.md) / buildPrinterStream

# Function: buildPrinterStream()

> **buildPrinterStream**(`bitmap`, `options?`): `Uint8Array`

Build a raw byte stream for the USB Printer class endpoint (Interface 0).

Uses the labelle-compatible protocol: ESC C 0, ESC D N, SYN + row, ESC A.
No HID report framing — send directly to EP 5 OUT.

Input is head-aligned (see `prepareForEmission`).

## Parameters

### bitmap

`LabelBitmap`

### options?

[`LabelManagerPrintOptions`](../interfaces/LabelManagerPrintOptions.md)

## Returns

`Uint8Array`
