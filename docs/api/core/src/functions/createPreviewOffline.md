[**labelmanager**](../../../README.md)

***

[labelmanager](../../../README.md) / [core/src](../README.md) / createPreviewOffline

# Function: createPreviewOffline()

> **createPreviewOffline**(`image`, `media`): [`PreviewResult`](/contracts/api/interfaces/PreviewResult)

Generate an offline preview without a live printer connection.

LabelManager is single-colour, so the result always contains a single
black plane. The bitmap is rendered at the image's native resolution
using Atkinson dithering (matching the `DymoPrinter.print()` rendering
path); the preview consumer is responsible for scaling and cropping
to match the selected tape width.

## Parameters

### image

[`RawImageData`](/contracts/api/interfaces/RawImageData)

### media

[`LabelManagerMedia`](../interfaces/LabelManagerMedia.md)

## Returns

[`PreviewResult`](/contracts/api/interfaces/PreviewResult)
