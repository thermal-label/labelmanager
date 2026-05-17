[**labelmanager**](../../../README.md)

***

[labelmanager](../../../modules.md) / [web/dist](../README.md) / WebDymoPrinter

# Class: WebDymoPrinter

WebUSB `PrinterAdapter` implementation for DYMO LabelManager printers.

Thin wrapper over `WebUsbTransport` from `@thermal-label/transport/web`.
Shares `DymoPrinter`'s rendering path — callers pass full RGBA and the
driver thresholds/dithers to 1bpp internally, with the same
`pickRotation` heuristic.

## Implements

- [`PrinterAdapter`](/contracts/api/interfaces/PrinterAdapter)

## Constructors

### Constructor

> **new WebDymoPrinter**(`device`, `transport`): `WebDymoPrinter`

#### Parameters

##### device

`LabelManagerDevice`

##### transport

[`Transport`](/contracts/api/interfaces/Transport)

#### Returns

`WebDymoPrinter`

## Properties

### device

> `readonly` **device**: `LabelManagerDevice`

The device entry for the connected printer.

Useful for logging, diagnostics, and displaying VID/PID. Undefined
if the connection was established without device matching (e.g. a
raw TCP connection to a known IP).

#### Implementation of

`PrinterAdapter.device`

***

### family

> `readonly` **family**: `"labelmanager"`

Driver family identifier, e.g. `'brother-ql'` or `'labelwriter'`.

#### Implementation of

`PrinterAdapter.family`

## Accessors

### connected

#### Get Signature

> **get** **connected**(): `boolean`

Whether the printer is currently connected.

##### Returns

`boolean`

#### Implementation of

`PrinterAdapter.connected`

***

### model

#### Get Signature

> **get** **model**(): `string`

Human-readable model name from the driver's device registry.

##### Returns

`string`

#### Implementation of

`PrinterAdapter.model`

## Methods

### close()

> **close**(): `Promise`\<`void`\>

Close the connection. Always call in `finally` blocks.

#### Returns

`Promise`\<`void`\>

#### Implementation of

`PrinterAdapter.close`

***

### createPreview()

> **createPreview**(`image`, `options?`): `Promise`\<[`PreviewResult`](/contracts/api/interfaces/PreviewResult)\>

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

[`PreviewOptions`](/contracts/api/interfaces/PreviewOptions)

— optional media override. If media is omitted, uses
  detected media from the last `getStatus()`. If no status is
  available, the driver defaults to single-colour at the printer's
  native head width and sets `PreviewResult.assumed = true`.

#### Returns

`Promise`\<[`PreviewResult`](/contracts/api/interfaces/PreviewResult)\>

#### Implementation of

`PrinterAdapter.createPreview`

***

### getStatus()

> **getStatus**(): `Promise`\<[`PrinterStatus`](/contracts/api/interfaces/PrinterStatus)\>

Query printer status including detected media.

#### Returns

`Promise`\<[`PrinterStatus`](/contracts/api/interfaces/PrinterStatus)\>

#### Implementation of

`PrinterAdapter.getStatus`

***

### onStatus()

> **onStatus**(`cb`): () => `void`

Subscribe to status updates. LabelManager firmware doesn't push
unsolicited status frames; this is a polling shim built on
`pollingOnStatus` from contracts, which calls `getStatus()` every
4 s and forwards each result to the subscriber.

Per plan 11 §`onStatus` parity — every driver-web printer
implements `onStatus` so the harness shell can collapse its
push-vs-pull branch into a single subscription path.

#### Parameters

##### cb

(`status`) => `void`

#### Returns

() => `void`

#### Implementation of

`PrinterAdapter.onStatus`

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

[`MediaDescriptor`](/contracts/api/interfaces/MediaDescriptor)

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

`PrinterAdapter.print`
