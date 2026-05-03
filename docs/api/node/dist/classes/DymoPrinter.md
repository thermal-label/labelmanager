[**labelmanager**](../../../README.md)

***

[labelmanager](../../../modules.md) / [node/dist](../README.md) / DymoPrinter

# Class: DymoPrinter

Node.js USB driver for DYMO LabelManager printers.

Implements the shared `PrinterAdapter` interface from
`@thermal-label/contracts`. The caller supplies a `Transport` — in
production this is typically `UsbTransport` from
`@thermal-label/transport/node`, obtained via the `discovery`
singleton exported by this package.

Orientation is auto-decided via `pickRotation`: every tape entry
carries `defaultOrientation: 'horizontal'`, so the driver rotates
landscape input 90° CW (matches the long-standing pre-retrofit
unconditional rotate). Override per-call with `options.rotate`.

## Implements

- [`PrinterAdapter`](../../../core/dist/interfaces/PrinterAdapter.md)

## Constructors

### Constructor

> **new DymoPrinter**(`device`, `transport`): `DymoPrinter`

#### Parameters

##### device

`LabelManagerDevice`

##### transport

[`Transport`](../../../core/dist/interfaces/Transport.md)

#### Returns

`DymoPrinter`

## Properties

### device

> `readonly` **device**: `LabelManagerDevice`

The device entry for the connected printer.

Useful for logging, diagnostics, and displaying VID/PID. Undefined
if the connection was established without device matching (e.g. a
raw TCP connection to a known IP).

#### Implementation of

[`PrinterAdapter`](../../../core/dist/interfaces/PrinterAdapter.md).[`device`](../../../core/dist/interfaces/PrinterAdapter.md#device)

***

### family

> `readonly` **family**: `"labelmanager"`

Driver family identifier, e.g. `'brother-ql'` or `'labelwriter'`.

#### Implementation of

[`PrinterAdapter`](../../../core/dist/interfaces/PrinterAdapter.md).[`family`](../../../core/dist/interfaces/PrinterAdapter.md#family)

## Accessors

### connected

#### Get Signature

> **get** **connected**(): `boolean`

Whether the printer is currently connected.

##### Returns

`boolean`

Whether the printer is currently connected.

#### Implementation of

[`PrinterAdapter`](../../../core/dist/interfaces/PrinterAdapter.md).[`connected`](../../../core/dist/interfaces/PrinterAdapter.md#connected)

***

### model

#### Get Signature

> **get** **model**(): `string`

Human-readable model name from the driver's device registry.

##### Returns

`string`

Human-readable model name from the driver's device registry.

#### Implementation of

[`PrinterAdapter`](../../../core/dist/interfaces/PrinterAdapter.md).[`model`](../../../core/dist/interfaces/PrinterAdapter.md#model)

## Methods

### close()

> **close**(): `Promise`\<`void`\>

Close the connection. Always call in `finally` blocks.

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`PrinterAdapter`](../../../core/dist/interfaces/PrinterAdapter.md).[`close`](../../../core/dist/interfaces/PrinterAdapter.md#close)

***

### createPreview()

> **createPreview**(`image`, `options?`): `Promise`\<[`PreviewResult`](../../../core/dist/interfaces/PreviewResult.md)\>

Generate a preview showing how this printer would reproduce the
design on the given media. Returns separated 1bpp planes with
display colours.

The driver uses its own colour-splitting logic (the same code that
`print()` uses internally) to produce the planes. The consuming app
renders whatever planes come back without needing to know the
splitting rules.

For offline preview without a live connection, use the static
`createPreviewOffline()` function exported from the driver's
`*-core` package instead.

#### Parameters

##### image

`RawImageData`

— full RGBA, typically from `designer.render()`.

##### options?

[`PreviewOptions`](../../../core/dist/interfaces/PreviewOptions.md)

— optional media override. If media is omitted, uses
  detected media from the last `getStatus()`. If no status is
  available, the driver defaults to single-colour at the printer's
  native head width and sets `PreviewResult.assumed = true`.

#### Returns

`Promise`\<[`PreviewResult`](../../../core/dist/interfaces/PreviewResult.md)\>

#### Implementation of

[`PrinterAdapter`](../../../core/dist/interfaces/PrinterAdapter.md).[`createPreview`](../../../core/dist/interfaces/PrinterAdapter.md#createpreview)

***

### getStatus()

> **getStatus**(): `Promise`\<[`PrinterStatus`](../../../core/dist/interfaces/PrinterStatus.md)\>

Query printer status including detected media.

#### Returns

`Promise`\<[`PrinterStatus`](../../../core/dist/interfaces/PrinterStatus.md)\>

#### Implementation of

[`PrinterAdapter`](../../../core/dist/interfaces/PrinterAdapter.md).[`getStatus`](../../../core/dist/interfaces/PrinterAdapter.md#getstatus)

***

### print()

> **print**(`image`, `media?`, `options?`): `Promise`\<`void`\>

Print from a full-colour RGBA image.

The driver converts to its native format internally:

- Single-colour media (`media.palette` undefined) — threshold/dither
  RGBA to a single 1bpp plane via `renderImage`.
- Multi-ink media (`media.palette` defined) — split into planes via
  `renderMultiPlaneImage` using that palette.

**Orientation:** drivers compute the rotation via `pickRotation`
(see `./orientation.ts`) — the input image is treated as the
intended visual; the driver auto-rotates landscape input on media
tagged `defaultOrientation: 'horizontal'`.

**Multi-ink splitting:** the palette on the media descriptor names
every ink the driver should classify pixels into; the contracts
package does not pick "red" or "black" — those facts live with the
media entry.

**Batch printing:** call `print()` once per label. The driver
handles job framing internally (e.g. Brother QL page-break commands
between sequential `print()` calls within the same session).

#### Parameters

##### image

`RawImageData`

— full RGBA, typically from `designer.render()`.

##### media?

[`MediaDescriptor`](../../../core/dist/interfaces/MediaDescriptor.md)

— which media to print on. Determines dimensions,
  margins, and colour mode. If omitted, uses detected media from
  the last `getStatus()`.

##### options?

`LabelManagerPrintOptions`

— per-call options (copies, density, etc.).

#### Returns

`Promise`\<`void`\>

#### Throws

MediaNotSpecifiedError if no media is known.

#### Implementation of

[`PrinterAdapter`](../../../core/dist/interfaces/PrinterAdapter.md).[`print`](../../../core/dist/interfaces/PrinterAdapter.md#print)
