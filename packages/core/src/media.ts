import { MEDIA_LIST } from './media.generated.js';
import type { LabelManagerMedia, TapeWidth } from './types.js';

/**
 * Registry of supported LabelManager tape widths.
 *
 * Source of truth lives in `packages/core/data/media.json5`;
 * `scripts/compile-data.mjs` aggregates it into the generated TS
 * module imported here.
 *
 * LabelManager cannot detect tape width via status query — the user must
 * select from this registry and pass the chosen media to
 * `DymoPrinter.print()` / `createPreview()`.
 *
 * Every tape entry declares `defaultOrientation: 'horizontal'`: callers
 * author labels with the long axis horizontal (left-to-right reading),
 * and the driver rotates 90° CW so the visual reads along the tape feed
 * direction. This preserves the long-standing pre-retrofit behaviour
 * — the protocol layer used to apply the rotation unconditionally;
 * now the driver picks it via `pickRotation`, and callers can opt out
 * per-print via `options.rotate`.
 *
 * `printMargins` reflects the ~3 mm tape-start/end feed each label gets
 * — design-tool hint only; the protocol path is unaffected.
 */
type MediaId = (typeof MEDIA_LIST)[number]['id'];

const MEDIA_BY_ID = Object.fromEntries(MEDIA_LIST.map(m => [m.id, m])) as unknown as Record<
  MediaId,
  LabelManagerMedia
>;

/**
 * Indexed registry of every D1 cartridge SKU the driver knows about,
 * keyed by entry id (e.g. `MEDIA['d1-standard-bw-12']`). Pickers should
 * iterate `MEDIA_LIST` directly; the keyed lookup is for code paths
 * that already have an id in hand.
 */
export const MEDIA = MEDIA_BY_ID;

/**
 * Black-on-White cartridge per supported tape width — the canonical
 * default for each width. Pickers pre-select these; users who want a
 * different colour or material reach into `MEDIA[id]` or iterate
 * `MEDIA_LIST`.
 */
export const TAPE_6MM: LabelManagerMedia = MEDIA_BY_ID['d1-standard-bw-6'];
export const TAPE_9MM: LabelManagerMedia = MEDIA_BY_ID['d1-standard-bw-9'];
export const TAPE_12MM: LabelManagerMedia = MEDIA_BY_ID['d1-standard-bw-12'];
export const TAPE_19MM: LabelManagerMedia = MEDIA_BY_ID['d1-standard-bw-19'];

export { MEDIA_LIST };

/**
 * Default media used when a caller invokes `createPreview()` without
 * providing explicit media and without a detected media (LabelManager
 * can never detect media).
 *
 * Chosen as the middle supported width so previews at least approximate
 * the most common tape size.
 */
export const DEFAULT_MEDIA: LabelManagerMedia = TAPE_12MM;

/**
 * Find a media entry by physical tape width in mm.
 */
export function findMediaByTapeWidth(tapeWidthMm: number): LabelManagerMedia | undefined {
  return MEDIA_LIST.find(m => m.tapeWidthMm === (tapeWidthMm as TapeWidth));
}
