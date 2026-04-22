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

  it('creates 64-byte zero-padded bitmap reports', () => {
    const bitmap = makeBitmap(64, 64);
    const reports = buildBitmapRows(bitmap);
    const first = reports[0]!;

    expect(reports).toHaveLength(64);
    expect(first).toHaveLength(64);
    expect(first[0]).toBe(0x16);
    expect(first[63]).toBe(0x00);
  });

  it('fits non-64-height bitmap by centering to 64 rows', () => {
    const bitmap = makeBitmap(64, 53);
    const reports = buildBitmapRows(bitmap);

    expect(reports).toHaveLength(64);
    expect(reports[0]).toHaveLength(64);
    expect(reports[63]).toHaveLength(64);
  });

  it('report count equals input widthPx regardless of tape width', () => {
    // Simulate a typical renderText output: 40 columns wide, 8px font height
    const bitmap = makeBitmap(40, 8);
    const reports6 = buildBitmapRows(bitmap, { tapeWidth: 6 });
    const reports9 = buildBitmapRows(bitmap, { tapeWidth: 9 });
    const reports12 = buildBitmapRows(bitmap, { tapeWidth: 12 });

    // One report per label column regardless of tape width
    expect(reports6).toHaveLength(40);
    expect(reports9).toHaveLength(40);
    expect(reports12).toHaveLength(40);

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
    const bitmap = makeBitmap(64, 64);
    const reports = encodeLabel(bitmap, { copies: 2, density: 'high' });
    const first = reports[0]!;
    const endOfFirstCopy = reports[67]!;
    const firstOfSecondCopy = reports[68]!;

    // per copy: 3 reset + 64 bitmap rows + 1 form feed = 68
    expect(reports).toHaveLength(136);
    expect(first.slice(0, 2)).toEqual(new Uint8Array([0x1b, 0x40]));
    expect(endOfFirstCopy.slice(0, 2)).toEqual(new Uint8Array([0x1b, 0x47]));
    expect(firstOfSecondCopy.slice(0, 2)).toEqual(new Uint8Array([0x1b, 0x40]));
  });

  it('buildPrinterStream produces labelle-compatible raw byte stream', () => {
    // 40-column label, 12mm tape (8 bytes per line)
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

    // Each row: SYN (0x16) + 8 bytes = 9 bytes; 40 rows = 360 bytes
    // Total: 3 (ESC C 0) + 3 (ESC D 8) + 40*9 (rows) + 2 (ESC A) = 368 bytes
    expect(stream).toHaveLength(368);
    expect(stream[6]).toBe(0x16); // SYN starts first row

    // Ends with ESC A
    expect(stream.at(-2)).toBe(0x1b);
    expect(stream.at(-1)).toBe(0x41);
  });

  it('buildPrinterStream uses correct bytes per line for 6mm tape', () => {
    const bitmap = makeBitmap(10, 8);
    const stream = buildPrinterStream(bitmap, { tapeWidth: 6 });

    // ESC D 4 (4 bytes per line for 6mm / 32 dots)
    expect(stream[3]).toBe(0x1b);
    expect(stream[4]).toBe(0x44);
    expect(stream[5]).toBe(4);

    // 10 rows * (1 SYN + 4 bytes) = 50 row bytes; 3 + 3 + 50 + 2 = 58
    expect(stream).toHaveLength(58);
  });

  it('encodes one column report per label column for narrower tape', () => {
    // 40-column label with font-height bitmap
    const bitmap = makeBitmap(40, 8);
    const reports = encodeLabel(bitmap, { tapeWidth: 6 });
    const first = reports[0]!;
    const formFeed = reports[43]!;

    // 3 reset + 40 bitmap columns + 1 form feed = 44
    expect(reports).toHaveLength(44);
    expect(first.slice(0, 2)).toEqual(new Uint8Array([0x1b, 0x40]));
    expect(formFeed.slice(0, 2)).toEqual(new Uint8Array([0x1b, 0x47]));
  });
});
