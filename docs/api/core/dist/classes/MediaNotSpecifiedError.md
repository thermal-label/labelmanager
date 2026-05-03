[**labelmanager**](../../../README.md)

***

[labelmanager](../../../modules.md) / [core/dist](../README.md) / MediaNotSpecifiedError

# Class: MediaNotSpecifiedError

`PrinterAdapter.print()` or `createPreview()` was called without a
media argument and no detected media was available.

The caller must either pass `media` explicitly or call `getStatus()`
first so the adapter can cache a detected media descriptor.

## Extends

- `Error`

## Constructors

### Constructor

> **new MediaNotSpecifiedError**(): `MediaNotSpecifiedError`

#### Returns

`MediaNotSpecifiedError`

#### Overrides

`Error.constructor`

## Properties

### message

> **message**: `string`

#### Inherited from

`Error.message`

***

### name

> **name**: `string`

#### Inherited from

`Error.name`

***

### stack?

> `optional` **stack?**: `string`

#### Inherited from

`Error.stack`
