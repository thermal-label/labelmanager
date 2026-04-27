import { getRow, padBitmap, rotateBitmap, scaleBitmap, type LabelBitmap } from '@mbtech-nl/bitmap';
import type { LabelManagerPrintOptions, TapeWidth } from './types.js';

const REPORT_SIZE = 64;
const MAX_PAYLOAD_SIZE = REPORT_SIZE - 1;

// ~8 mm at 180 DPI — blank feed added before and after the bitmap so the
// printed area can be cut cleanly on both sides.
const FEED_MARGIN_PX = 57;

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
 *   2. Pad top/bottom by `FEED_MARGIN_PX` so the printed area can be
 *      cut cleanly on both leading and trailing edges.
 *
 * Each output row carries one head-line of dots — exactly
 * `Math.ceil(headDots / 8)` bytes per row.
 */
function prepareForEmission(bitmap: LabelBitmap, headDots: number): LabelBitmap {
  const swapped = rotateBitmap(bitmap, 90);
  const scaled = scaleBitmap(swapped, headDots);
  const headAligned = rotateBitmap(scaled, 270);
  return padBitmap(headAligned, { top: FEED_MARGIN_PX, bottom: FEED_MARGIN_PX });
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
  options?: LabelManagerPrintOptions,
): Uint8Array[] {
  const headDots = tapeWidthToHeadDots(options?.tapeWidth);
  const padded = prepareForEmission(bitmap, headDots);

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
  options: LabelManagerPrintOptions = {},
): Uint8Array {
  const copies = Math.max(1, options.copies ?? 1);
  const headDots = tapeWidthToHeadDots(options.tapeWidth);
  const padded = prepareForEmission(bitmap, headDots);
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
 * @param options Density/copies options.
 * @returns Full report list for one or more copies.
 */
export function encodeLabel(
  bitmap: LabelBitmap,
  options: LabelManagerPrintOptions = {},
): Uint8Array[] {
  const copies = Math.max(1, options.copies ?? 1);
  const reports: Uint8Array[] = [];

  for (let i = 0; i < copies; i += 1) {
    reports.push(...buildResetSequence(options));
    reports.push(...buildBitmapRows(bitmap, options));
    reports.push(...buildFormFeed());
  }

  return reports;
}
