import { getRow, rotateBitmap, type LabelBitmap } from "@mbtech-nl/bitmap";
/* eslint-disable import-x/consistent-type-specifier-style */
import type { PrintOptions } from "./types.js";

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

export function buildResetSequence(options?: PrintOptions): Uint8Array[] {
  const density = options?.density ?? "normal";
  const densityByte = density === "high" ? 0x01 : 0x00;

  return [
    toReport([0x1b, 0x40]), // reset
    toReport([0x1b, 0x43, 0x00]), // media type (tape)
    toReport([0x1b, 0x65, densityByte]) // density
  ];
}

export function buildBitmapRows(bitmap: LabelBitmap): Uint8Array[] {
  const rotated = bitmap.heightPx === 64 ? bitmap : rotateBitmap(bitmap, 90);

  if (rotated.heightPx !== 64) {
    throw new Error(
      `Bitmap height must be 64 dots after rotation. Received ${String(rotated.heightPx)}.`
    );
  }

  const reports: Uint8Array[] = [];
  for (let y = 0; y < rotated.heightPx; y += 1) {
    const row = getRow(rotated, y);
    const payload = [0x16, ...Array.from(row)];
    reports.push(toReport(payload));
  }

  return reports;
}

export function buildFormFeed(): Uint8Array[] {
  return [toReport([0x1b, 0x47])];
}

export function encodeLabel(
  bitmap: LabelBitmap,
  options: PrintOptions = {}
): Uint8Array[] {
  const copies = Math.max(1, options.copies ?? 1);
  const reports: Uint8Array[] = [];

  for (let i = 0; i < copies; i += 1) {
    reports.push(...buildResetSequence(options));
    reports.push(...buildBitmapRows(bitmap));
    reports.push(...buildFormFeed());
  }

  return reports;
}
