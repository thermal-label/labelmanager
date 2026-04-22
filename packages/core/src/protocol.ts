import { getRow, rotateBitmap, type LabelBitmap } from '@mbtech-nl/bitmap';
/* eslint-disable import-x/consistent-type-specifier-style */
import type { PrintOptions, TapeWidth } from './types.js';

const REPORT_SIZE = 64;
const MAX_PAYLOAD_SIZE = REPORT_SIZE - 1;

function toReport(payload: number[]): Uint8Array {
  if (payload.length > MAX_PAYLOAD_SIZE) {
    throw new Error(`Payload too large for HID report: ${String(payload.length)} bytes`);
  }

  const report = new Uint8Array(REPORT_SIZE);
  report.set(payload, 0);
  return report;
}

function fitToHeadHeight(bitmap: LabelBitmap, targetHeight = 64): LabelBitmap {
  if (bitmap.heightPx === targetHeight) {
    return bitmap;
  }

  const bytesPerRow = Math.ceil(bitmap.widthPx / 8);
  const fittedData = new Uint8Array(bytesPerRow * targetHeight);

  if (bitmap.heightPx < targetHeight) {
    const topPadding = Math.floor((targetHeight - bitmap.heightPx) / 2);
    for (let row = 0; row < bitmap.heightPx; row += 1) {
      const srcStart = row * bytesPerRow;
      const srcEnd = srcStart + bytesPerRow;
      const dstStart = (row + topPadding) * bytesPerRow;
      fittedData.set(bitmap.data.slice(srcStart, srcEnd), dstStart);
    }
    return {
      widthPx: bitmap.widthPx,
      heightPx: targetHeight,
      data: fittedData,
    };
  }

  const cropStart = Math.floor((bitmap.heightPx - targetHeight) / 2);
  for (let row = 0; row < targetHeight; row += 1) {
    const srcStart = (row + cropStart) * bytesPerRow;
    const srcEnd = srcStart + bytesPerRow;
    const dstStart = row * bytesPerRow;
    fittedData.set(bitmap.data.slice(srcStart, srcEnd), dstStart);
  }

  return {
    widthPx: bitmap.widthPx,
    heightPx: targetHeight,
    data: fittedData,
  };
}

function tapeWidthToTargetHeight(tapeWidth?: TapeWidth): number {
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

export function buildResetSequence(options?: PrintOptions): Uint8Array[] {
  const density = options?.density ?? 'normal';
  const densityByte = density === 'high' ? 0x01 : 0x00;

  return [
    toReport([0x1b, 0x40]), // reset
    toReport([0x1b, 0x43, 0x00]), // media type (tape)
    toReport([0x1b, 0x65, densityByte]), // density
  ];
}

/**
 * Convert a bitmap to printer row reports.
 *
 * @param bitmap Input monochrome bitmap.
 * @returns Zero-padded HID payload reports.
 */
export function buildBitmapRows(bitmap: LabelBitmap, options?: PrintOptions): Uint8Array[] {
  const targetHeight = tapeWidthToTargetHeight(options?.tapeWidth);
  const rotated = bitmap.heightPx === 64 ? bitmap : rotateBitmap(bitmap, 90);
  const fitted = fitToHeadHeight(rotated, targetHeight);

  if (fitted.heightPx !== targetHeight) {
    throw new Error(
      `Bitmap height must be ${String(targetHeight)} dots after fit. Received ${String(fitted.heightPx)}.`,
    );
  }

  const reports: Uint8Array[] = [];
  for (let y = 0; y < fitted.heightPx; y += 1) {
    const row = getRow(fitted, y);
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
 * Encode a complete label job into HID report payloads.
 *
 * @param bitmap Bitmap to print.
 * @param options Density/copies options.
 * @returns Full report list for one or more copies.
 */
export function encodeLabel(bitmap: LabelBitmap, options: PrintOptions = {}): Uint8Array[] {
  const copies = Math.max(1, options.copies ?? 1);
  const reports: Uint8Array[] = [];

  for (let i = 0; i < copies; i += 1) {
    reports.push(...buildResetSequence(options));
    reports.push(...buildBitmapRows(bitmap, options));
    reports.push(...buildFormFeed());
  }

  return reports;
}
