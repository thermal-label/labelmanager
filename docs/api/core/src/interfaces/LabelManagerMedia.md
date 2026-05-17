[**labelmanager**](../../../README.md)

***

[labelmanager](../../../README.md) / [core/src](../README.md) / LabelManagerMedia

# Interface: LabelManagerMedia

DYMO LabelManager media descriptor.

Extends `D1Media` from `@thermal-label/d1-core` (the shared D1 tape
shape — `printableDots`, `text`, `background` consumed by the
encoder + tape-type selector) with LabelManager-specific narrowing:
`type` is fixed to `'tape'`, `tapeWidthMm` is narrowed to the
supported widths, and `material` carries the D1 substrate family
for picker UX.

## Extends

- `D1Media`

## Properties

### background?

> `optional` **background?**: `string`

Substrate colour, named.

#### Overrides

`D1Media.background`

***

### bytesPerLine

> **bytesPerLine**: `number`

Bytes-per-line (`ceil(printableDots / 8)`). Convenience mirror of `printableDots`.

#### Overrides

`D1Media.bytesPerLine`

***

### material?

> `optional` **material?**: [`LabelManagerMaterial`](../type-aliases/LabelManagerMaterial.md)

D1 substrate family.

#### Overrides

`D1Media.material`

***

### printableDots

> **printableDots**: `number`

Cartridge-printable raster width in dots.

#### Overrides

`D1Media.printableDots`

***

### tapeWidthMm

> **tapeWidthMm**: [`TapeWidth`](../type-aliases/TapeWidth.md)

Tape width in mm — informational; the encoder reads `printableDots`.

#### Overrides

`D1Media.tapeWidthMm`

***

### text?

> `optional` **text?**: `string`

Printed ink colour, named (the only ink the cartridge carries).

#### Overrides

`D1Media.text`

***

### type

> **type**: `"tape"`

Media type classification — driver-specific string values.

Common values: `'continuous'`, `'die-cut'`, `'tape'`.
Drivers may define additional values as needed.

#### Overrides

`D1Media.type`
