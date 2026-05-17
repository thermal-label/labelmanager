[**labelmanager**](../../../README.md)

***

[labelmanager](../../../README.md) / [web/src](../README.md) / requestPrinters

# Function: requestPrinters()

> **requestPrinters**(`opts`): `Promise`\<`Readonly`\<`Record`\<`string`, [`PrinterAdapter`](/contracts/api/interfaces/PrinterAdapter)\>\>\>

Unified browser-picker factory for the labelmanager driver family.

LabelManager devices are USB-only — the registry declares no other
transports. The factory accepts `ConnectOptions` for uniformity
across drivers but rejects non-USB transports up-front.

USB path: opens the picker, auto-identifies via
`usbDevice.vendorId/productId`. Throws
`DeviceIdentificationRequiredError` (with USB-capable candidates +
a `continueWith` closure reusing the picked USBDevice) when the
picked device's VID/PID is not in the labelmanager registry.

## Parameters

### opts

[`ConnectOptions`](/contracts/api/type-aliases/ConnectOptions)

## Returns

`Promise`\<`Readonly`\<`Record`\<`string`, [`PrinterAdapter`](/contracts/api/interfaces/PrinterAdapter)\>\>\>
