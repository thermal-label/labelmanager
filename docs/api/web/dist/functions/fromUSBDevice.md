[**labelmanager**](../../../README.md)

***

[labelmanager](../../../modules.md) / [web/dist](../README.md) / fromUSBDevice

# Function: fromUSBDevice()

> **fromUSBDevice**(`usbDevice`): `Promise`\<[`WebDymoPrinter`](../classes/WebDymoPrinter.md)\>

Wrap an already-selected `USBDevice` (e.g. from
`navigator.usb.getDevices()` for previously paired devices).

## Parameters

### usbDevice

`USBDevice`

## Returns

`Promise`\<[`WebDymoPrinter`](../classes/WebDymoPrinter.md)\>

## Throws

if the USB device's VID/PID does not match any supported
  LabelManager in the device registry.
