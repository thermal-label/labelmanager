import { renderImage, type RawImageData } from '@mbtech-nl/bitmap';
import type { PreviewResult } from '@thermal-label/contracts';
import type { LabelManagerMedia } from './types.js';

/**
 * Generate an offline preview without a live printer connection.
 *
 * LabelManager is single-colour, so the result always contains a single
 * black plane. The bitmap is rendered at the image's native resolution
 * using Atkinson dithering (matching the `DymoPrinter.print()` rendering
 * path); the preview consumer is responsible for scaling and cropping
 * to match the selected tape width.
 */
export function createPreviewOffline(image: RawImageData, media: LabelManagerMedia): PreviewResult {
  const bitmap = renderImage(image, { dither: true });
  return {
    planes: [{ name: 'black', bitmap, displayColor: '#000000' }],
    media,
    assumed: false,
  };
}
