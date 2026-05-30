[**labelmanager**](../../../README.md)

***

[labelmanager](../../../README.md) / [core/src](../README.md) / LabelManagerMedia

# Interface: LabelManagerMedia

DYMO LabelManager media descriptor.

`D1Media` from `@thermal-label/d1-core` already carries every field
this driver needs (`printableDots`, `bytesPerLine`, `tapeWidthMm`,
`text`, `background`, `material`). This interface adds no fields of
its own — it only narrows the shared shape to the LabelManager
chassis: `type` fixed to `'tape'`, `tapeWidthMm` to the supported
widths, and `printableDots` / `bytesPerLine` made required (the
encoder always sizes the raster from them on catalogued media).

## Extends

- `D1Media`

## Properties

### bytesPerLine

> **bytesPerLine**: `number`

Bytes-per-line (`ceil(printableDots / 8)`). Convenience mirror of `printableDots`.

#### Overrides

`D1Media.bytesPerLine`

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

### type

> **type**: `"tape"`

Media type classification — driver-specific string values.

Common values: `'continuous'`, `'die-cut'`, `'tape'`.
Drivers may define additional values as needed.

#### Overrides

`D1Media.type`
