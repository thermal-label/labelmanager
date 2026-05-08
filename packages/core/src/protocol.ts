import { getRow, padBitmap, rotateBitmap, scaleBitmap, type LabelBitmap } from '@mbtech-nl/bitmap';
import {
  getForcedTrailingFeedMm,
  getPrintableArea,
  type MediaDescriptor,
  type PrintEngine,
} from '@thermal-label/contracts';
import type { LabelManagerPrintOptions, TapeWidth } from './types.js';

const REPORT_SIZE = 64;
const MAX_PAYLOAD_SIZE = REPORT_SIZE - 1;

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

function toReport(payload: number[]): Uint8Array {
  if (payload.length > MAX_PAYLOAD_SIZE) {
    throw new Error(`Payload too large for HID report: ${String(payload.length)} bytes`);
  }

  const report = new Uint8Array(REPORT_SIZE);
  report.set(payload, 0);
  return report;
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

export function buildResetSequence(options?: LabelManagerPrintOptions): Uint8Array[] {
  const density = options?.density ?? 'normal';
  const densityByte = density === 'high' ? 0x01 : 0x00;

  return [
    toReport([0x1b, 0x40]), // reset
    toReport([0x1b, 0x43, 0x00]), // media type (tape)
    toReport([0x1b, 0x65, densityByte]), // density
  ];
}

/**
 * Scale and pad a head-aligned bitmap to the printer's emission shape.
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
 *   2. Pad the leading edge by `engine.printableArea.leading` (mm,
 *      converted to dots at `engine.dpi`) — chassis dead-zone
 *      correction so authored content lands clear of the head-to-cutter
 *      gap.
 *   3. Pad the trailing edge by `engine.forcedTrailingFeedMm` (mm,
 *      converted to dots at `engine.dpi`) — encoder-emitted
 *      post-print feed so the printed area is clear of the cutter
 *      before the firmware-side `ESC G` advance kicks in.
 *
 * Each output row carries one head-line of dots — exactly
 * `Math.ceil(headDots / 8)` bytes per row.
 *
 * **Byte parity migration note.** Pre-0.6.0 the encoder hard-coded
 * `FEED_MARGIN_PX = 57` and padded the same count on both edges. Today
 * every LabelManager device entry ships
 * `printableArea: { leading: 8, ... }` and `forcedTrailingFeedMm: 8`
 * — `Math.round(8 × 180 / 25.4)` is `57`, so the wire bytes stay
 * identical. Future LabelManager chassis with different geometry plug
 * in by setting different mm values on their engine entry; the
 * encoder follows the data.
 */
function prepareForEmission(
  bitmap: LabelBitmap,
  headDots: number,
  engine: PrintEngine,
  media?: MediaDescriptor,
): LabelBitmap {
  const swapped = rotateBitmap(bitmap, 90);
  const scaled = scaleBitmap(swapped, headDots);
  const headAligned = rotateBitmap(scaled, 270);

  const printableArea = getPrintableArea(engine, media);
  const leadingDots = mmToDots(printableArea.leading, engine.dpi);
  const trailingDots = mmToDots(getForcedTrailingFeedMm(engine), engine.dpi);

  return padBitmap(headAligned, { top: leadingDots, bottom: trailingDots });
}

/**
 * Convert a head-aligned bitmap to printer row reports.
 *
 * Input is in head-aligned orientation (see `prepareForEmission`). The
 * driver applies `pickRotation` to put landscape input there before
 * calling.
 */
export function buildBitmapRows(
  bitmap: LabelBitmap,
  engine: PrintEngine,
  options?: LabelManagerPrintOptions,
  media?: MediaDescriptor,
): Uint8Array[] {
  const headDots = tapeWidthToHeadDots(options?.tapeWidth);
  const padded = prepareForEmission(bitmap, headDots, engine, media);

  const reports: Uint8Array[] = [];
  for (let y = 0; y < padded.heightPx; y += 1) {
    const row = getRow(padded, y);
    const payload = [0x16, ...Array.from(row)];
    reports.push(toReport(payload));
  }

  return reports;
}

/**
 * Build the printer form-feed/cut command.
 *
 * @returns One HID payload report for cut/advance.
 */
export function buildFormFeed(): Uint8Array[] {
  return [toReport([0x1b, 0x47])];
}

/**
 * Build a raw byte stream for the USB Printer class endpoint (Interface 0).
 *
 * Uses the labelle-compatible protocol: ESC C 0, ESC D N, SYN + row, ESC A.
 * No HID report framing — send directly to EP 5 OUT.
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
  const padded = prepareForEmission(bitmap, headDots, engine, media);
  const bytesPerLine = Math.ceil(headDots / 8);

  const chunks: number[] = [];

  for (let i = 0; i < copies; i += 1) {
    chunks.push(0x1b, 0x43, 0x00); // ESC C 0 — tape type
    chunks.push(0x1b, 0x44, bytesPerLine); // ESC D N — bytes per line

    for (let y = 0; y < padded.heightPx; y += 1) {
      const row = getRow(padded, y);
      chunks.push(0x16, ...Array.from(row)); // SYN + row bytes
    }

    chunks.push(0x1b, 0x41); // ESC A — status query / flush
  }

  return new Uint8Array(chunks);
}

/**
 * Encode a complete label job into HID report payloads.
 *
 * @param bitmap Bitmap to print (head-aligned, see `prepareForEmission`).
 * @param engine The `PrintEngine` whose `printableArea` and
 *   `forcedTrailingFeedMm` drive the leading / trailing pad. Pass the
 *   `engines[0]` of the device entry returned from `findDevice` /
 *   `DEVICES`.
 * @param options Density/copies options.
 * @param media Optional media descriptor — surfaces per-roll
 *   `printableArea` overrides (e.g. LabelWriter 5xx NFC tag); ignored
 *   for D1 tape today, plumbed for forward-compatibility.
 * @returns Full report list for one or more copies.
 */
export function encodeLabel(
  bitmap: LabelBitmap,
  engine: PrintEngine,
  options: LabelManagerPrintOptions = {},
  media?: MediaDescriptor,
): Uint8Array[] {
  const copies = Math.max(1, options.copies ?? 1);
  const reports: Uint8Array[] = [];

  for (let i = 0; i < copies; i += 1) {
    reports.push(...buildResetSequence(options));
    reports.push(...buildBitmapRows(bitmap, engine, options, media));
    reports.push(...buildFormFeed());
  }

  return reports;
}
