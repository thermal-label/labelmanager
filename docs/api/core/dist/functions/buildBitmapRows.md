[**labelmanager**](../../../README.md)

***

[labelmanager](../../../modules.md) / [core/dist](../README.md) / buildBitmapRows

# Function: buildBitmapRows()

> **buildBitmapRows**(`bitmap`, `options?`): `Uint8Array`[]

Convert a head-aligned bitmap to printer row reports.

Input is in head-aligned orientation (see `prepareForEmission`). The
driver applies `pickRotation` to put landscape input there before
calling.

## Parameters

### bitmap

`LabelBitmap`

### options?

[`LabelManagerPrintOptions`](../interfaces/LabelManagerPrintOptions.md)

## Returns

`Uint8Array`[]
