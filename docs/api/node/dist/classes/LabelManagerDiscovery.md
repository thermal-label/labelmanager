[**labelmanager**](../../../README.md)

***

[labelmanager](../../../modules.md) / [node/dist](../README.md) / LabelManagerDiscovery

# Class: LabelManagerDiscovery

`PrinterDiscovery` implementation for DYMO LabelManager printers.

Enumerates the USB bus via `node-usb`, matches against the
LabelManager `DEVICES` registry, and opens matching devices through
the shared `UsbTransport` from `@thermal-label/transport/node`.

## Implements

- `PrinterDiscovery`

## Constructors

### Constructor

> **new LabelManagerDiscovery**(): `LabelManagerDiscovery`

#### Returns

`LabelManagerDiscovery`

## Properties

### family

> `readonly` **family**: `"labelmanager"` = `"labelmanager"`

Driver family identifier — matches `DeviceEntry.family`.

#### Implementation of

`PrinterDiscovery.family`

## Methods

### listPrinters()

> **listPrinters**(): `Promise`\<`DiscoveredPrinter`[]\>

List connected printers on this driver's supported transports.

#### Returns

`Promise`\<`DiscoveredPrinter`[]\>

#### Implementation of

`PrinterDiscovery.listPrinters`

***

### openPrinter()

> **openPrinter**(`options?`): `Promise`\<[`DymoPrinter`](DymoPrinter.md)\>

Open a printer matching the given options.

If no options are provided, opens the first available printer.

#### Parameters

##### options?

`OpenOptions`

#### Returns

`Promise`\<[`DymoPrinter`](DymoPrinter.md)\>

#### Implementation of

`PrinterDiscovery.openPrinter`
