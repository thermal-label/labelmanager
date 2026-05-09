import {
  D1_MEDIA_LIST,
  D1_TAPE_6MM,
  D1_TAPE_9MM,
  D1_TAPE_12MM,
  D1_TAPE_19MM,
} from '@thermal-label/d1-core';
import type { LabelManagerMedia, TapeWidth } from './types.js';

/**
 * D1 cartridge registry for the LabelManager driver — sourced from
 * `@thermal-label/d1-core`'s shared catalogue and filtered to the
 * tape widths LabelManager chassis can drive (≤ 19 mm; the encoder
 * caps the printable raster at the 64-dot LM head).
 *
 * Source-of-truth for the catalogue lives in
 * `~/thermal-label/d1-core/data/media.json5`. The 24 mm entries
 * d1-core also publishes are filtered out here — they only fit the
 * 128-dot Duo tape head, not any catalogued LM chassis.
 *
 * LabelManager cannot detect tape width via status query — the user
 * must select from this registry and pass the chosen media to
 * `DymoPrinter.print()` / `createPreview()`.
 *
 * Every tape entry declares `defaultOrientation: 'horizontal'`:
 * callers author labels with the long axis horizontal (left-to-right
 * reading), and the driver rotates 90° CW so the visual reads along
 * the tape feed direction. `printMargins` reflects the ~3 mm
 * tape-start/end feed each label gets — design-tool hint only; the
 * protocol path is unaffected.
 */

const LM_TAPE_WIDTHS: ReadonlySet<TapeWidth> = new Set([6, 9, 12, 19]);

function isLabelManagerMedia(m: { tapeWidthMm?: number }): m is LabelManagerMedia {
  return m.tapeWidthMm !== undefined && LM_TAPE_WIDTHS.has(m.tapeWidthMm as TapeWidth);
}

/**
 * Every D1 cartridge SKU the driver knows about, narrowed to widths
 * the LabelManager can drive.
 */
export const MEDIA_LIST: readonly LabelManagerMedia[] = D1_MEDIA_LIST.filter(isLabelManagerMedia);

const MEDIA_BY_ID: Record<string, LabelManagerMedia> = Object.fromEntries(
  MEDIA_LIST.map(m => [m.id, m]),
);

/**
 * Indexed registry of every D1 cartridge SKU, keyed by entry id
 * (e.g. `MEDIA['d1-standard-bw-12']`). Pickers should iterate
 * `MEDIA_LIST` directly; the keyed lookup is for code paths that
 * already have an id in hand.
 */
export const MEDIA = MEDIA_BY_ID;

/**
 * Black-on-White cartridge per supported tape width — the canonical
 * default for each width. Pickers pre-select these; users who want a
 * different colour or material reach into `MEDIA[id]` or iterate
 * `MEDIA_LIST`.
 */
export const TAPE_6MM: LabelManagerMedia = D1_TAPE_6MM as LabelManagerMedia;
export const TAPE_9MM: LabelManagerMedia = D1_TAPE_9MM as LabelManagerMedia;
export const TAPE_12MM: LabelManagerMedia = D1_TAPE_12MM as LabelManagerMedia;
export const TAPE_19MM: LabelManagerMedia = D1_TAPE_19MM as LabelManagerMedia;

/**
 * Default media used when a caller invokes `createPreview()` without
 * providing explicit media and without a detected media (LabelManager
 * can never detect media).
 *
 * Chosen as the middle supported width so previews at least
 * approximate the most common tape size.
 */
export const DEFAULT_MEDIA: LabelManagerMedia = TAPE_12MM;

/**
 * Find a media entry by physical tape width in mm.
 */
export function findMediaByTapeWidth(tapeWidthMm: number): LabelManagerMedia | undefined {
  return MEDIA_LIST.find(m => m.tapeWidthMm === (tapeWidthMm as TapeWidth));
}
