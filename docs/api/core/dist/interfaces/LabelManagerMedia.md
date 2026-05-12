[**labelmanager**](../../../README.md)

***

[labelmanager](../../../modules.md) / [core/dist](../README.md) / LabelManagerMedia

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

### category?

> `optional` **category?**: `"address"` \| `"shipping"` \| `"file-folder"` \| `"multi-purpose"` \| `"name-badge"` \| `"barcode"` \| `"price-tag"` \| `"continuous"` \| `"cartridge"` \| `"tape"` \| `"die-cut"`

Coarse category for grouping in docs and UI. Driver-extensible;
common values listed for cross-driver consistency.

#### Inherited from

`D1Media.category`

***

### cornerRadiusMm?

> `optional` **cornerRadiusMm?**: `number`

Corner radius (mm) of die-cut labels with rounded corners.

Only meaningful for die-cut media. Undefined or `0` = sharp
corners. For round labels, set this to `widthMm / 2` so the
rounded rectangle degenerates to a circle.

#### Inherited from

`D1Media.cornerRadiusMm`

***

### defaultOrientation?

> `optional` **defaultOrientation?**: `"horizontal"` \| `"vertical"`

Hint for how the user is expected to author content for this media.
Drives the auto-rotate decision in `print()`:

- `'horizontal'` — long axis horizontal when reading (landscape).
  Driver rotates 90° in the family-specific direction when input
  matches landscape dimensions. Examples: 89×28 mm address labels,
  12 mm narrow tape with a name on it.
- `'vertical'` — long axis vertical when reading (portrait).
  Driver passes through.
- `undefined` — driver passes through. Recommended for continuous
  wide tape (62 mm) where users may go either way.

#### Inherited from

`D1Media.defaultOrientation`

***

### heightMm?

> `optional` **heightMm?**: `number`

Physical height/length in mm.

- Undefined = continuous (variable length; printer cuts to content).
- A number = fixed length (die-cut labels, tape segments).

#### Inherited from

`D1Media.heightMm`

***

### id

> **id**: `string` \| `number`

Unique identifier within the driver family.

#### Inherited from

`D1Media.id`

***

### material?

> `optional` **material?**: [`LabelManagerMaterial`](../type-aliases/LabelManagerMaterial.md)

D1 substrate family.

#### Overrides

`D1Media.material`

***

### name

> **name**: `string`

Human-readable name, e.g. `"62mm continuous"` or `"DK-22251"`.

#### Inherited from

`D1Media.name`

***

### palette?

> `optional` **palette?**: readonly `PaletteEntry`[]

Inks this media supports, beyond the implicit white substrate.

- Undefined = single-colour black-on-white. Driver renders via
  `renderImage` (luminance threshold + optional dither).
- Defined = multi-plane media. Driver renders via
  `renderMultiPlaneImage` with this palette.

For DK-22251 (the only multi-ink media we ship today):
`[{ name: 'black', rgb: [0, 0, 0] }, { name: 'red', rgb: [255, 0, 0] }]`

#### Inherited from

`D1Media.palette`

***

### printableDots

> **printableDots**: `number`

Cartridge-printable raster width in dots.

#### Overrides

`D1Media.printableDots`

***

### printMargins?

> `optional` **printMargins?**: `object`

Insets (mm) inside the media bounds where the printer may clip a
design (paper-feed tolerance, head edges, die-cut slack).

Informational — for label designers and previews. Drivers do not
enforce these; protocol-level margins (head pin offsets, head-dot
fitting) are handled separately by family-specific fields.

When present, all four edges are required (pass `0` where there is
no margin). Omit the whole field when the entire media area is
safe to design within.

#### bottomMm

> `readonly` **bottomMm**: `number`

#### leftMm

> `readonly` **leftMm**: `number`

#### rightMm

> `readonly` **rightMm**: `number`

#### topMm

> `readonly` **topMm**: `number`

#### Inherited from

`D1Media.printMargins`

***

### skus?

> `optional` **skus?**: readonly `string`[]

Vendor SKUs for this media — e.g. Dymo `'30321'` / `'S0722400'`,
Brother `'DK-22251'`. Mixed formats allowed; the registry does no
validation. Used by docs (per-device "supported media" table) and
by UI consumers that let users search by SKU.

#### Inherited from

`D1Media.skus`

***

### tapeWidthMm

> **tapeWidthMm**: [`TapeWidth`](../type-aliases/TapeWidth.md)

Tape width in mm — informational; the encoder reads `printableDots`.

#### Overrides

`D1Media.tapeWidthMm`

***

### targetModels?

> `optional` **targetModels?**: readonly `string`[]

Devices this media is compatible with. Driver-defined string set;
matched against `PrintEngine.mediaCompatibility`. Examples:
`['standard']` (paper roll fits 672-dot heads),
`['4xl', '5xl']` (wide-head only), `['duo']` (D1 cartridges).
Omit = fits every device in the family.

#### Inherited from

`D1Media.targetModels`

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

***

### widthMm

> **widthMm**: `number`

Physical width in mm.

#### Inherited from

`D1Media.widthMm`
