[**labelmanager**](../../../README.md)

***

[labelmanager](../../../modules.md) / [web/dist](../README.md) / fromUSBDeviceAll

# Function: fromUSBDeviceAll()

> **fromUSBDeviceAll**(`usbDevice`): `Promise`\<`Record`\<`string`, [`WebDymoPrinter`](../classes/WebDymoPrinter.md)\>\>

Wrap an already-selected `USBDevice` and return a 1-key adapter map
keyed by the device's `engines[0].role`. Public surface for
`requestPrinters()`; exported so harnesses that already hold a
`USBDevice` (e.g. picked-up via `navigator.usb.getDevices()` on a
returning visit) can skip the picker.

Single-interface only — LabelManager's USB transport always claims
IF 0 (Printer Class, EP 5 bulk). The HID interface (IF 2) is real
but unused by this driver.

## Parameters

### usbDevice

`USBDevice`

## Returns

`Promise`\<`Record`\<`string`, [`WebDymoPrinter`](../classes/WebDymoPrinter.md)\>\>
