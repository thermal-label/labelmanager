[**labelmanager**](../../../README.md)

***

[labelmanager](../../../modules.md) / [core/dist](../README.md) / createPreviewOffline

# Function: createPreviewOffline()

> **createPreviewOffline**(`image`, `media`): [`PreviewResult`](../interfaces/PreviewResult.md)

Generate an offline preview without a live printer connection.

LabelManager is single-colour, so the result always contains a single
black plane. The bitmap is rendered at the image's native resolution
using Atkinson dithering (matching the `DymoPrinter.print()` rendering
path); the preview consumer is responsible for scaling and cropping
to match the selected tape width.

## Parameters

### image

`RawImageData`

### media

[`LabelManagerMedia`](../interfaces/LabelManagerMedia.md)

## Returns

[`PreviewResult`](../interfaces/PreviewResult.md)
