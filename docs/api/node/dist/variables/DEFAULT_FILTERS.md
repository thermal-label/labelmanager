[**labelmanager**](../../../README.md)

***

[labelmanager](../../../modules.md) / [node/dist](../README.md) / DEFAULT\_FILTERS

# Variable: DEFAULT\_FILTERS

> `const` **DEFAULT\_FILTERS**: `object`[]

WebUSB filters for any supported LabelManager. Useful for browser
code that wants to request a device through the LabelManager family's
USB VID/PIDs without depending on the browser package. Devices
without a USB transport are skipped.

Typed as `{ vendorId: number; productId: number }[]` rather than
the WebUSB-DOM `USBDeviceFilter[]` so this Node-side module does not
pull in the WebUSB lib types.

## Type Declaration

### productId

> **productId**: `number`

### vendorId

> **vendorId**: `number`
