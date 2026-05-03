[**labelmanager**](../../../README.md)

***

[labelmanager](../../../modules.md) / [core/dist](../README.md) / LabelManagerDevice

# Type Alias: LabelManagerDevice

> **LabelManagerDevice** = [`DeviceEntry`](../interfaces/DeviceEntry.md) & `object`

DYMO LabelManager device entry.

Alias for the contracts `DeviceEntry` shape, narrowed to
`family: 'labelmanager'`. The driver-side registry adds no
LabelManager-specific top-level fields today — every previously
driver-only field folds into the contracts shape: tape compatibility
lives on `engines[].mediaCompatibility` + `MediaDescriptor.targetModels`,
and the old `experimental?` flag collapses into `support.status`.

## Type Declaration

### family

> **family**: `"labelmanager"`
