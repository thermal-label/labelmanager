[**labelmanager**](../../../README.md)

***

[labelmanager](../../../modules.md) / [core/dist](../README.md) / findDevice

# Function: findDevice()

> **findDevice**(`vid`, `pid`): [`LabelManagerDevice`](../type-aliases/LabelManagerDevice.md)

Find a supported device entry by USB vendor and product ID.

Looks at the `transports.usb` block of each entry — devices that do
not declare a USB transport (none today, but the shape allows it)
are skipped.

## Parameters

### vid

`number`

USB vendor ID (numeric, as reported by node-usb / WebUSB).

### pid

`number`

USB product ID (numeric).

## Returns

[`LabelManagerDevice`](../type-aliases/LabelManagerDevice.md)

Matching entry or `undefined` when unsupported.
