[**labelmanager**](../../../README.md)

***

[labelmanager](../../../README.md) / [core/src](../README.md) / DEVICES

# Variable: DEVICES

> `const` **DEVICES**: `Record`\<`"LABELPOINT_350"` \| `"LM_280"` \| `"LM_400"` \| `"LM_420P"` \| `"LM_PC"` \| `"LM_PNP"` \| `"LM_WIRELESS_PNP"` \| `"MOBILE_LABELER"`, [`LabelManagerDevice`](../type-aliases/LabelManagerDevice.md)\>

Registry of supported LabelManager devices, keyed by the device's
stable `key` field (e.g. `LM_PNP`, `LM_420P`). Values are the full
contracts `DeviceEntry`.

Equivalent to `Object.fromEntries(DEVICE_REGISTRY_DATA.devices.map(d => [d.key, d]))`,
preserved as an indexed const so consumers can write
`DEVICES.LM_PNP` and get a precise type back.
