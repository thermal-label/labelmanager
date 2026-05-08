import { getRow, rotateBitmap, scaleBitmap, type LabelBitmap } from '@mbtech-nl/bitmap';
import {
  getForcedTrailingFeedMm,
  getPrintableArea,
  type MediaDescriptor,
  type PrintEngine,
} from '@thermal-label/contracts';
import type { LabelManagerPrintOptions, TapeWidth } from './types.js';

/**
 * Convert a millimetre value to dot count at the given DPI.
 *
 * Rounds half-away-from-zero so the migration from the old
 * `FEED_MARGIN_PX = 57` constant lands on the same integer dot count
 * (`8 mm × 180 / 25.4 ≈ 56.6929` → `57`).
 */
function mmToDots(mm: number, dpi: number): number {
  return Math.round((mm * dpi) / 25.4);
}

function tapeWidthToHeadDots(tapeWidth?: TapeWidth): number {
  switch (tapeWidth) {
    case 6:
      return 32;
    case 9:
      return 48;
    case 12:
      return 64;
    case 19:
      // 19mm media is currently constrained by the 64-dot transport path.
      return 64;
    default:
      return 64;
  }
}

/**
 * Scale a head-aligned bitmap and resolve leading/trailing skip-line
 * counts for the chassis dead-zone + post-print advance.
 *
 * **Input contract** — the bitmap is in head-aligned orientation:
 * `widthPx` is the head-perpendicular dimension (across the tape) and
 * `heightPx` is the feed direction (along the tape). The caller (the
 * driver layer, via `pickRotation` + `renderImage`'s `rotate` option)
 * is responsible for getting it into this orientation.
 *
 * **Transformations** —
 *   1. Scale `widthPx` to the head dot count (preserving aspect).
 *      `scaleBitmap` only targets `heightPx`, so we swap-scale-swap.
 *   2. Resolve `leadingSkipLines` from `engine.printableArea.leading`
 *      (mm → dots at `engine.dpi`) — chassis dead-zone correction so
 *      authored content lands clear of the head-to-cutter gap.
 *   3. Resolve `trailingSkipLines` from `engine.forcedTrailingFeedMm`
 *      (mm → dots at `engine.dpi`) — post-print tape advance so the
 *      printed area is clear of the cutter before the next job.
 *
 * Both skip-line counts are emitted by `buildPrinterStream` as
 * `ESC D 0 + N × SYN` — bare SYN bytes feed one dot row each with
 * zero payload, so trailing/leading advance costs 1 byte per dot row
 * instead of `1 + bytesPerLine` for a padded blank row. Prior art:
 * labelle's `LabelMaker._skip_lines` ("MLF" pattern).
 */
function prepareForEmission(
  bitmap: LabelBitmap,
  headDots: number,
  engine: PrintEngine,
  media?: MediaDescriptor,
): { bitmap: LabelBitmap; leadingSkipLines: number; trailingSkipLines: number } {
  const swapped = rotateBitmap(bitmap, 90);
  const scaled = scaleBitmap(swapped, headDots);
  const headAligned = rotateBitmap(scaled, 270);

  const printableArea = getPrintableArea(engine, media);
  const leadingSkipLines = mmToDots(printableArea.leading, engine.dpi);
  const trailingSkipLines = mmToDots(getForcedTrailingFeedMm(engine), engine.dpi);

  return { bitmap: headAligned, leadingSkipLines, trailingSkipLines };
}

/**
 * Build a raw byte stream for the USB Printer class endpoint (Interface 0,
 * EP 5 OUT). This is the only supported transport — the device's HID
 * interface (IF 2, EP 1) accepts but mishandles writes and leaves the
 * printer in an unrecoverable state until power-cycled, so the driver
 * never targets it.
 *
 * Wire shape:
 *   ESC C 0
 *   [if leading skip-lines: ESC D 0 + N × SYN]
 *   ESC D N (bytes-per-line for content)
 *   SYN + row × M (content)
 *   [if trailing skip-lines: ESC D 0 + N × SYN]
 *   ESC A
 *
 * Leading + trailing tape advance is emitted as bare SYN bytes against
 * `ESC D 0` (zero bytes-per-line). Each bare SYN advances one dot row
 * with no payload — same physical feed as a padded blank row but at
 * 1 byte/row instead of `1 + bytesPerLine` bytes/row. Prior art:
 * labelle's `LabelMaker._skip_lines` ("MLF" pattern).
 *
 * Input is head-aligned (see `prepareForEmission`).
 */
export function buildPrinterStream(
  bitmap: LabelBitmap,
  engine: PrintEngine,
  options: LabelManagerPrintOptions = {},
  media?: MediaDescriptor,
): Uint8Array {
  const copies = Math.max(1, options.copies ?? 1);
  const headDots = tapeWidthToHeadDots(options.tapeWidth);
  const { bitmap: scaled, leadingSkipLines, trailingSkipLines } = prepareForEmission(
    bitmap,
    headDots,
    engine,
    media,
  );
  const bytesPerLine = Math.ceil(headDots / 8);

  const chunks: number[] = [];

  for (let i = 0; i < copies; i += 1) {
    chunks.push(0x1b, 0x43, 0x00); // ESC C 0 — tape type

    if (leadingSkipLines > 0) {
      chunks.push(0x1b, 0x44, 0x00); // ESC D 0 — zero bytes-per-line
      for (let n = 0; n < leadingSkipLines; n += 1) chunks.push(0x16);
    }

    chunks.push(0x1b, 0x44, bytesPerLine); // ESC D N — bytes per line for content

    for (let y = 0; y < scaled.heightPx; y += 1) {
      const row = getRow(scaled, y);
      chunks.push(0x16, ...Array.from(row)); // SYN + row bytes
    }

    if (trailingSkipLines > 0) {
      chunks.push(0x1b, 0x44, 0x00); // ESC D 0 — zero bytes-per-line
      for (let n = 0; n < trailingSkipLines; n += 1) chunks.push(0x16);
    }

    chunks.push(0x1b, 0x41); // ESC A — status query
  }

  return new Uint8Array(chunks);
}
