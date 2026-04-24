/* eslint-disable import-x/consistent-type-specifier-style */
import type { LabelManagerMedia } from './types.js';

/**
 * Registry of supported LabelManager tape widths.
 *
 * LabelManager cannot detect tape width via status query — the user must
 * select from this registry and pass the chosen media to
 * `DymoPrinter.print()` / `createPreview()`.
 */
export const MEDIA = {
  TAPE_6MM: {
    id: 'tape-6',
    name: '6mm tape',
    widthMm: 6,
    type: 'tape',
    colorCapable: false,
    tapeWidthMm: 6,
    printableDots: 32,
    bytesPerLine: 4,
  },
  TAPE_9MM: {
    id: 'tape-9',
    name: '9mm tape',
    widthMm: 9,
    type: 'tape',
    colorCapable: false,
    tapeWidthMm: 9,
    printableDots: 48,
    bytesPerLine: 6,
  },
  TAPE_12MM: {
    id: 'tape-12',
    name: '12mm tape',
    widthMm: 12,
    type: 'tape',
    colorCapable: false,
    tapeWidthMm: 12,
    printableDots: 64,
    bytesPerLine: 8,
  },
  TAPE_19MM: {
    id: 'tape-19',
    name: '19mm tape',
    widthMm: 19,
    type: 'tape',
    colorCapable: false,
    tapeWidthMm: 19,
    printableDots: 64,
    bytesPerLine: 8,
  },
} as const satisfies Record<string, LabelManagerMedia>;

/**
 * Default media used when a caller invokes `createPreview()` without
 * providing explicit media and without a detected media (LabelManager
 * can never detect media).
 *
 * Chosen as the middle supported width so previews at least approximate
 * the most common tape size.
 */
export const DEFAULT_MEDIA: LabelManagerMedia = MEDIA.TAPE_12MM;

/**
 * Find a media entry by physical tape width in mm.
 */
export function findMediaByTapeWidth(tapeWidthMm: number): LabelManagerMedia | undefined {
  return Object.values(MEDIA).find(m => m.tapeWidthMm === tapeWidthMm);
}
