[**labelmanager**](../../../README.md)

***

[labelmanager](../../../modules.md) / [core/dist](../README.md) / ROTATE\_DIRECTION

# Variable: ROTATE\_DIRECTION

> `const` **ROTATE\_DIRECTION**: [`RotateDirection`](../type-aliases/RotateDirection.md)

Direction the LabelManager print head rotates landscape input.

`90` = clockwise. Matches the pre-retrofit hard-coded
`rotateBitmap(padded, 90)` in `protocol.ts`, which is now driven by
`pickRotation` instead. Verify on hardware with a die-cut "F"
landscape print if anything changes here.
