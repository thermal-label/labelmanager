[**labelmanager**](../../../README.md)

***

[labelmanager](../../../modules.md) / [web/dist](../README.md) / DEFAULT\_FILTERS

# Variable: DEFAULT\_FILTERS

> `const` **DEFAULT\_FILTERS**: `USBDeviceFilter`[]

WebUSB filter set matching every supported LabelManager VID/PID.

Passed to `navigator.usb.requestDevice()` by default when the caller
does not supply their own filters. Devices without a USB transport
are skipped.
