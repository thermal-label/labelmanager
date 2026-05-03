[**labelmanager**](../../../README.md)

***

[labelmanager](../../../modules.md) / [core/dist](../README.md) / PROTOCOLS

# Variable: PROTOCOLS

> `const` **PROTOCOLS**: `ReadonlySet`\<`string`\>

Protocols this core's encoder produces correct wire bytes for.
Pair with `DEVICE_REGISTRY_DATA` and pass to
`resolveSupportedDevices` from `@thermal-label/contracts` to filter
a device list down to what this runtime can actually drive.
