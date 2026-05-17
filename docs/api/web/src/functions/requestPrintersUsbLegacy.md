[**labelmanager**](../../../README.md)

***

[labelmanager](../../../README.md) / [web/src](../README.md) / requestPrintersUsbLegacy

# ~~Function: requestPrintersUsbLegacy()~~

> **requestPrintersUsbLegacy**(`options?`): `Promise`\<`Record`\<`string`, [`WebDymoPrinter`](../classes/WebDymoPrinter.md)\>\>

Show the browser's USB picker and return one `PrinterAdapter` per
drivable engine on the selected device, keyed by engine role.

## Parameters

### options?

[`RequestOptions`](../interfaces/RequestOptions.md) = `{}`

## Returns

`Promise`\<`Record`\<`string`, [`WebDymoPrinter`](../classes/WebDymoPrinter.md)\>\>

## Deprecated

Use `requestPrinters({ transport: 'usb' })` from
  `./request-printers.ts`; the legacy USB-only `requestPrinters` is
  preserved as `requestPrintersUsbLegacy` for back-compat. Removed
  once consumers migrate (plan 11).
