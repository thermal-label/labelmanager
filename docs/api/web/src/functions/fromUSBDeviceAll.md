[**labelmanager**](../../../README.md)

***

[labelmanager](../../../README.md) / [web/src](../README.md) / fromUSBDeviceAll

# ~~Function: fromUSBDeviceAll()~~

> **fromUSBDeviceAll**(`usbDevice`): `Promise`\<`Record`\<`string`, [`WebDymoPrinter`](../classes/WebDymoPrinter.md)\>\>

Wrap an already-selected `USBDevice` and return a 1-key adapter map
keyed by the device's `engines[0].role`.

## Parameters

### usbDevice

`USBDevice`

## Returns

`Promise`\<`Record`\<`string`, [`WebDymoPrinter`](../classes/WebDymoPrinter.md)\>\>

## Deprecated

Use `requestPrinters({ transport: 'usb' })` from
  `./request-printers.ts`. Removed once consumers migrate (plan 11).
