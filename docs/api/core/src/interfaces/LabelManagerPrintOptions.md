[**labelmanager**](../../../README.md)

***

[labelmanager](../../../README.md) / [core/src](../README.md) / LabelManagerPrintOptions

# Interface: LabelManagerPrintOptions

Protocol-internal print options.

Extends the cross-driver `PrintOptions` and the D1 shared shape
(`D1PrintOptions` — `copies`, `tapeType`) with LabelManager-specific
`tapeWidth` (informational; the encoder reads `media.printableDots`),
`density` narrowed to printer-supported values, and `rotate` to
override the orientation heuristic — `'auto'` (default) defers to
the media's `defaultOrientation`; an explicit angle bypasses it.

`tapeType` is the `ESC C` selector (0..12), inherited from
`D1PrintOptions`. Host-declared (LabelManager firmware cannot
detect cartridge type); normally derived from the user-selected
media's `text` / `background` via `tapeTypeFor()` and not passed by
the caller. Override only when bench-testing a specific selector.

## Extends

- [`PrintOptions`](/contracts/api/interfaces/PrintOptions).`D1PrintOptions`

## Properties

### density?

> `optional` **density?**: `"normal"` \| `"high"`

Driver-specific density setting.

Common values: `'light'`, `'normal'`, `'dark'`. Some drivers support
additional values such as `'medium'` or `'high'`. Drivers throw
`UnsupportedOperationError` for unrecognised values.

`'normal'` is universally supported across all drivers.

#### Overrides

`PrintOptions.density`

***

### rotate?

> `optional` **rotate?**: `0` \| `180` \| `90` \| `270` \| `"auto"`

***

### tapeWidth?

> `optional` **tapeWidth?**: [`TapeWidth`](../type-aliases/TapeWidth.md)
