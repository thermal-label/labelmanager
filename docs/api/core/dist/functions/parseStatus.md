[**labelmanager**](../../../README.md)

***

[labelmanager](../../../modules.md) / [core/dist](../README.md) / parseStatus

# Function: parseStatus()

> **parseStatus**(`bytes`): [`PrinterStatus`](../interfaces/PrinterStatus.md)

Parse a raw status response into the contracts `PrinterStatus` shape.

LabelManager returns a single status byte:
- bit 0 set → printer busy / not ready
- bit 1 set → no tape inserted
- bit 2 set → tape supply low

`detectedMedia` is always `undefined` — LabelManager has no way to
report tape width. Callers must always pass media explicitly to
`DymoPrinter.print()` / `createPreview()`.

## Parameters

### bytes

`Uint8Array`

## Returns

[`PrinterStatus`](../interfaces/PrinterStatus.md)
