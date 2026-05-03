[**labelmanager**](../../../README.md)

***

[labelmanager](../../../modules.md) / [core/dist](../README.md) / DEVICES

# Variable: DEVICES

> `const` **DEVICES**: `Record`\<`DeviceKey`, [`LabelManagerDevice`](../type-aliases/LabelManagerDevice.md)\>

Registry of supported LabelManager devices, keyed by the device's
stable `key` field (e.g. `LM_PNP`, `LM_420P`). Values are the full
contracts `DeviceEntry`.

Equivalent to `Object.fromEntries(DEVICE_REGISTRY_DATA.devices.map(d => [d.key, d]))`,
preserved as an indexed const so consumers can write
`DEVICES.LM_PNP` and get a precise type back.
