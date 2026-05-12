[**labelmanager**](../../../README.md)

***

[labelmanager](../../../modules.md) / [web/dist](../README.md) / requestPrinters

# Function: requestPrinters()

> **requestPrinters**(`options?`): `Promise`\<`Record`\<`string`, [`WebDymoPrinter`](../classes/WebDymoPrinter.md)\>\>

Show the browser's USB picker and return one `PrinterAdapter` per
drivable engine on the selected device, keyed by engine role.

LabelManager devices are always single-engine — this returns a 1-key
record keyed by the device's `engines[0].role` (typically `'primary'`).
Mirrors the labelwriter driver's `requestPrinters()` factory so harness
adapters can stay symmetric across driver families.

## Parameters

### options?

[`RequestOptions`](../interfaces/RequestOptions.md)

## Returns

`Promise`\<`Record`\<`string`, [`WebDymoPrinter`](../classes/WebDymoPrinter.md)\>\>
