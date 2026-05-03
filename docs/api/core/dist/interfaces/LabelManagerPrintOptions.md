[**labelmanager**](../../../README.md)

***

[labelmanager](../../../modules.md) / [core/dist](../README.md) / LabelManagerPrintOptions

# Interface: LabelManagerPrintOptions

Protocol-internal print options.

Extends the cross-driver `PrintOptions` with LabelManager-specific
`tapeWidth` — the protocol encoder needs it to pick the right
`ESC D N` byte-per-line setting. `density` is narrowed to the
values the printer supports. `rotate` overrides the orientation
heuristic — `'auto'` (default) defers to the media's
`defaultOrientation`; an explicit angle bypasses it.

## Extends

- [`PrintOptions`](PrintOptions.md)

## Properties

### copies?

> `optional` **copies?**: `number`

Number of copies to print. Default 1.

#### Inherited from

[`PrintOptions`](PrintOptions.md).[`copies`](PrintOptions.md#copies)

***

### density?

> `optional` **density?**: `"normal"` \| `"high"`

Driver-specific density setting.

Common values: `'light'`, `'normal'`, `'dark'`. Some drivers support
additional values such as `'medium'` or `'high'`. Drivers throw
`UnsupportedOperationError` for unrecognised values.

`'normal'` is universally supported across all drivers.

#### Overrides

[`PrintOptions`](PrintOptions.md).[`density`](PrintOptions.md#density)

***

### engine?

> `optional` **engine?**: `string`

Engine to route to on multi-engine devices. Role name from
`printer.engines` (e.g. `'left'`, `'right'`, `'label'`, `'tape'`)
or `'auto'` to defer to firmware (where the protocol supports it).

Default behaviour:
- Single-engine device — ignored.
- Multi-engine, protocol supports auto — defaults to `'auto'`.
- Multi-engine, protocol does not (e.g. LabelWriter Duo) —
  required; the driver throws `EngineRequiredError` when omitted.

`'auto'` is a routing mode the protocol module interprets — the
registry does not store it. Whether a protocol supports auto is
implicit in whether its implementation exposes an auto-address
sentinel.

#### Inherited from

[`PrintOptions`](PrintOptions.md).[`engine`](PrintOptions.md#engine)

***

### rotate?

> `optional` **rotate?**: `0` \| `90` \| `270` \| `"auto"` \| `180`

***

### tapeWidth?

> `optional` **tapeWidth?**: [`TapeWidth`](../type-aliases/TapeWidth.md)
