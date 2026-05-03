[**labelmanager**](../../../README.md)

***

[labelmanager](../../../modules.md) / [web/dist](../README.md) / requestPrinter

# Function: requestPrinter()

> **requestPrinter**(`options?`): `Promise`\<[`WebDymoPrinter`](../classes/WebDymoPrinter.md)\>

Show the browser's USB picker and wrap the selected device.

Requires a user gesture (click, keypress). Opens the device and claims
interface 0 via `WebUsbTransport.fromDevice`.

## Parameters

### options?

[`RequestOptions`](../interfaces/RequestOptions.md)

## Returns

`Promise`\<[`WebDymoPrinter`](../classes/WebDymoPrinter.md)\>
