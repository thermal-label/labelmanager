import { describe, expect, it } from 'vitest';
import { buildBitmapRows, buildFormFeed, buildResetSequence, encodeLabel } from '../protocol.js';
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
});
