import { getRow, rotateBitmap, scaleBitmap, type LabelBitmap } from '@mbtech-nl/bitmap';
import {
  getForcedTrailingFeedMm,
  getPrintableArea,
  type PrintEngine,
} from '@thermal-label/contracts';
import type { LabelManagerMedia, LabelManagerPrintOptions, TapeWidth } from './types.js';
import { TAPE_TYPE_MAX, tapeTypeFor } from './tape-type.js';

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

/**
 * Cartridge-printable raster width fallback when neither
 * `media.printableDots` nor `engine.headDots` narrow the value.
 *
 * 19 mm media is constrained by the 64-dot transport path on every
 * LabelManager chassis catalogued today; the wider tape just leaves
 * inactive border outside the print area.
 */
function tapeWidthToRasterDots(tapeWidth?: TapeWidth): number {
  switch (tapeWidth) {
    case 6:
      return 32;
    case 9:
      return 48;
    case 12:
      return 64;
    case 19:
      return 64;
    default:
      return 64;
  }
}

/**
 * Resolve the raster width in dots — how many head-perpendicular dots
 * are fired per row.
 *
 * Source-of-truth precedence:
 *   1. `media.printableDots` — per-cartridge constraint, the most
 *      accurate value when media is in scope.
 *   2. `options.tapeWidth` → `tapeWidthToRasterDots` — fallback for
 *      callers that pass options without media (sanity scripts, tests).
 *   3. `engine.headDots` — final fallback.
 *
 * Always capped by `engine.headDots`: the head physically cannot fire
 * more dots than it has pins. This is the bit that lets the same
 * encoder run cleanly against future wider heads (the LabelWriter Duo's
 * 96- or 128-dot tape engine) once the d1-tape core is shared — the
 * head-dot ceiling makes the per-cartridge raster width portable.
 */
function resolveRasterDots(
  engine: PrintEngine,
  options: LabelManagerPrintOptions,
  media: LabelManagerMedia | undefined,
): number {
  const fromMedia = media?.printableDots;
  const fromOptions = options.tapeWidth !== undefined ? tapeWidthToRasterDots(options.tapeWidth) : undefined;
  const desired = fromMedia ?? fromOptions ?? engine.headDots;
  return Math.min(desired, engine.headDots);
}

function resolveTapeType(
  options: LabelManagerPrintOptions,
  media: LabelManagerMedia | undefined,
): number {
  const fromOptions = options.tapeType;
  if (fromOptions !== undefined) {
    if (!Number.isInteger(fromOptions) || fromOptions < 0 || fromOptions > TAPE_TYPE_MAX) {
      throw new RangeError(
        `tapeType must be an integer 0..${String(TAPE_TYPE_MAX)} (got ${String(fromOptions)})`,
      );
    }
    return fromOptions;
  }
  return tapeTypeFor(media);
}

/**
 * Scale a head-aligned bitmap to the resolved raster width and resolve
 * leading / trailing skip-line counts for the chassis dead-zone +
 * post-print advance.
 *
 * **Input contract** — the bitmap is in head-aligned orientation:
 * `widthPx` is the head-perpendicular dimension (across the tape) and
 * `heightPx` is the feed direction (along the tape). The caller (the
 * driver layer, via `pickRotation` + `renderImage`'s `rotate` option)
 * is responsible for getting it into this orientation.
 *
 * **Transformations** —
 *   1. Scale `widthPx` to `rasterDots` (preserving aspect).
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
  rasterDots: number,
  engine: PrintEngine,
  media: LabelManagerMedia | undefined,
): { bitmap: LabelBitmap; leadingSkipLines: number; trailingSkipLines: number } {
  const swapped = rotateBitmap(bitmap, 90);
  const scaled = scaleBitmap(swapped, rasterDots);
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
 * Wire shape per copy:
 *   ESC C n
 *   [if leading skip-lines: ESC D 0 + N × SYN]
 *   ESC D N (bytes-per-line for content)
 *   SYN + row × M (content)
 *   [if trailing skip-lines: ESC D 0 + N × SYN]
 *   [if engine.capabilities.autocut: ESC E]
 *   ESC A
 *
 * `n` for `ESC C` is the tape-type / colour-palette selector. The
 * firmware can't detect cartridge type — the host declares it.
 * Resolved from `options.tapeType` (explicit override), else
 * `tapeTypeFor(media)` (user-selected media → palette index), else
 * `0` (safe fallback for unknown / no media). `ESC E` is emitted only
 * when the engine declares `capabilities.autocut: true`; manual-
 * cutter chassis (every catalogued LabelManager today) skip it.
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
  media?: LabelManagerMedia,
): Uint8Array {
  const copies = Math.max(1, options.copies ?? 1);
  const rasterDots = resolveRasterDots(engine, options, media);
  const tapeType = resolveTapeType(options, media);
  const autocut = engine.capabilities?.autocut === true;

  const { bitmap: scaled, leadingSkipLines, trailingSkipLines } = prepareForEmission(
    bitmap,
    rasterDots,
    engine,
    media,
  );
  const bytesPerLine = Math.ceil(rasterDots / 8);

  const chunks: number[] = [];

  for (let i = 0; i < copies; i += 1) {
    chunks.push(0x1b, 0x43, tapeType); // ESC C n — tape type / palette

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

    if (autocut) {
      chunks.push(0x1b, 0x45); // ESC E — cut (autocut chassis only)
    }

    chunks.push(0x1b, 0x41); // ESC A — status query
  }

  return new Uint8Array(chunks);
}
