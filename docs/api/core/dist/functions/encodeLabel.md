[**labelmanager**](../../../README.md)

***

[labelmanager](../../../modules.md) / [core/dist](../README.md) / encodeLabel

# Function: encodeLabel()

> **encodeLabel**(`bitmap`, `options?`): `Uint8Array`[]

Encode a complete label job into HID report payloads.

## Parameters

### bitmap

`LabelBitmap`

Bitmap to print (head-aligned, see `prepareForEmission`).

### options?

[`LabelManagerPrintOptions`](../interfaces/LabelManagerPrintOptions.md)

Density/copies options.

## Returns

`Uint8Array`[]

Full report list for one or more copies.
