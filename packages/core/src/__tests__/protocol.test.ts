import { describe, expect, it } from 'vitest';
import {
  buildBitmapRows,
  buildFormFeed,
  buildPrinterStream,
  buildResetSequence,
  encodeLabel,
} from '../protocol.js';
/* eslint-disable import-x/consistent-type-specifier-style */
import type { LabelBitmap } from '@mbtech-nl/bitmap';

function makeBitmap(widthPx: number, heightPx: number): LabelBitmap {
  const bytesPerRow = Math.ceil(widthPx / 8);
  const data = new Uint8Array(bytesPerRow * heightPx);

  // Add one black pixel on the first row so command payload is non-empty.
  data[0] = 0b10000000;

  return { widthPx, heightPx, data };
}

// Feed margin constant: ~8 mm at 180 DPI, added on each side.
const FEED_MARGIN_PX = 57;

describe('protocol', () => {
  it('builds reset sequence with normal and high density', () => {
    const normal = buildResetSequence();
    const high = buildResetSequence({ density: 'high' });
    const normalReset = normal[0]!;
    const normalDensity = normal[2]!;
    const highDensity = high[2]!;

    expect(normal).toHaveLength(3);
    expect(normalReset.slice(0, 2)).toEqual(new Uint8Array([0x1b, 0x40]));
    expect(normalDensity.slice(0, 3)).toEqual(new Uint8Array([0x1b, 0x65, 0x00]));
    expect(highDensity.slice(0, 3)).toEqual(new Uint8Array([0x1b, 0x65, 0x01]));
  });

  it('scales bitmap to head height and adds feed margin', () => {
    // 64×64 already at target height; scaled width stays 64, margin adds 2×57 = 114.
    const bitmap = makeBitmap(64, 64);
    const reports = buildBitmapRows(bitmap);
    const first = reports[0]!;

    expect(reports).toHaveLength(64 + 2 * FEED_MARGIN_PX); // 178
    expect(first).toHaveLength(64);
    expect(first[0]).toBe(0x16);
    expect(first[63]).toBe(0x00);
  });

  it('scales non-target-height bitmap to fill head and adds feed margin', () => {
    // 64×53 scaled proportionally to height 64: width = round(64*64/53) = 77
    const bitmap = makeBitmap(64, 53);
    const scaledWidth = Math.round(64 * (64 / 53)); // 77
    const reports = buildBitmapRows(bitmap);

    expect(reports).toHaveLength(scaledWidth + 2 * FEED_MARGIN_PX);
    expect(reports[0]).toHaveLength(64);
  });

  it('scales bitmap to match tape head height for each tape width', () => {
    // 40×8 input — scaled to head height, so width grows proportionally.
    const bitmap = makeBitmap(40, 8);
    const scaledW6 = Math.round(40 * (32 / 8)); // 160
    const scaledW9 = Math.round(40 * (48 / 8)); // 240
    const scaledW12 = Math.round(40 * (64 / 8)); // 320

    const reports6 = buildBitmapRows(bitmap, { tapeWidth: 6 });
    const reports9 = buildBitmapRows(bitmap, { tapeWidth: 9 });
    const reports12 = buildBitmapRows(bitmap, { tapeWidth: 12 });

    expect(reports6).toHaveLength(scaledW6 + 2 * FEED_MARGIN_PX);
    expect(reports9).toHaveLength(scaledW9 + 2 * FEED_MARGIN_PX);
    expect(reports12).toHaveLength(scaledW12 + 2 * FEED_MARGIN_PX);

    // Each report is still a full 64-byte HID packet
    expect(reports6[0]).toHaveLength(64);
    expect(reports12[0]).toHaveLength(64);
  });

  it('creates form feed command', () => {
    const reports = buildFormFeed();
    const formFeed = reports[0]!;

    expect(reports).toHaveLength(1);
    expect(formFeed.slice(0, 2)).toEqual(new Uint8Array([0x1b, 0x47]));
  });

  it('encodes complete report sequence and copies', () => {
    // 64×64 scaled to 64: width stays 64, padded → 178 columns → 178 bitmap rows.
    // Per copy: 3 reset + 178 bitmap + 1 form feed = 182; ×2 = 364.
    const bitmap = makeBitmap(64, 64);
    const reportsPerCopy = 3 + (64 + 2 * FEED_MARGIN_PX) + 1; // 182
    const reports = encodeLabel(bitmap, { copies: 2, density: 'high' });
    const first = reports[0]!;
    const endOfFirstCopy = reports[reportsPerCopy - 1]!; // index 181
    const firstOfSecondCopy = reports[reportsPerCopy]!; // index 182

    expect(reports).toHaveLength(reportsPerCopy * 2);
    expect(first.slice(0, 2)).toEqual(new Uint8Array([0x1b, 0x40]));
    expect(endOfFirstCopy.slice(0, 2)).toEqual(new Uint8Array([0x1b, 0x47]));
    expect(firstOfSecondCopy.slice(0, 2)).toEqual(new Uint8Array([0x1b, 0x40]));
  });

  it('buildPrinterStream produces labelle-compatible raw byte stream', () => {
    // 40×8 scaled to 64 (12mm) → width 320, padded → 434 columns → 434 rows.
    // Each row: SYN (1) + 8 bytes = 9; 434×9 = 3906.
    // Total: 3 (ESC C 0) + 3 (ESC D 8) + 3906 + 2 (ESC A) = 3914.
    const scaledWidth = Math.round(40 * (64 / 8)); // 320
    const rows = scaledWidth + 2 * FEED_MARGIN_PX; // 434
    const bitmap = makeBitmap(40, 8);
    const stream = buildPrinterStream(bitmap, { tapeWidth: 12 });

    // Starts with ESC C 0 (tape type)
    expect(stream[0]).toBe(0x1b);
    expect(stream[1]).toBe(0x43);
    expect(stream[2]).toBe(0x00);

    // Followed by ESC D 8 (bytes per line for 12mm)
    expect(stream[3]).toBe(0x1b);
    expect(stream[4]).toBe(0x44);
    expect(stream[5]).toBe(8);

    expect(stream).toHaveLength(3 + 3 + rows * 9 + 2);
    expect(stream[6]).toBe(0x16); // SYN starts first row

    // Ends with ESC A
    expect(stream.at(-2)).toBe(0x1b);
    expect(stream.at(-1)).toBe(0x41);
  });

  it('buildPrinterStream uses correct bytes per line for 6mm tape', () => {
    // 10×8 scaled to 32 (6mm) → width 40, padded → 154 columns → 154 rows.
    // Each row: SYN (1) + 4 bytes = 5; 154×5 = 770.
    // Total: 3 + 3 + 770 + 2 = 778.
    const scaledWidth = Math.round(10 * (32 / 8)); // 40
    const rows = scaledWidth + 2 * FEED_MARGIN_PX; // 154
    const bitmap = makeBitmap(10, 8);
    const stream = buildPrinterStream(bitmap, { tapeWidth: 6 });

    // ESC D 4 (4 bytes per line for 6mm / 32 dots)
    expect(stream[3]).toBe(0x1b);
    expect(stream[4]).toBe(0x44);
    expect(stream[5]).toBe(4);

    expect(stream).toHaveLength(3 + 3 + rows * 5 + 2);
  });

  it('encodes one column report per label column for narrower tape', () => {
    // 40×8 scaled to 32 (6mm) → width 160, padded → 274 bitmap rows.
    // Per copy: 3 reset + 274 bitmap + 1 form feed = 278.
    const bitmap = makeBitmap(40, 8);
    const scaledWidth = Math.round(40 * (32 / 8)); // 160
    const bitmapRows = scaledWidth + 2 * FEED_MARGIN_PX; // 274
    const reports = encodeLabel(bitmap, { tapeWidth: 6 });
    const first = reports[0]!;
    const formFeed = reports[3 + bitmapRows]!; // index 277

    expect(reports).toHaveLength(3 + bitmapRows + 1);
    expect(first.slice(0, 2)).toEqual(new Uint8Array([0x1b, 0x40]));
    expect(formFeed.slice(0, 2)).toEqual(new Uint8Array([0x1b, 0x47]));
  });
});
