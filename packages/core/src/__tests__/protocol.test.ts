import { describe, expect, it } from 'vitest';
import { buildPrinterStream } from '../protocol.js';
import type { LabelBitmap } from '@mbtech-nl/bitmap';
import type { PrintEngine } from '@thermal-label/contracts';
import type { LabelManagerMedia } from '../types.js';

/**
 * Make a head-aligned bitmap fixture.
 *
 * The protocol expects bitmaps in head-aligned orientation:
 * `widthPx` is the head-perpendicular dimension (across the tape) and
 * `heightPx` is the feed direction (along the tape). The driver layer
 * is responsible for getting the user's input there via `pickRotation`
 * + `renderImage`'s `rotate` option.
 */
function makeBitmap(widthPx: number, heightPx: number): LabelBitmap {
  const bytesPerRow = Math.ceil(widthPx / 8);
  const data = new Uint8Array(bytesPerRow * heightPx);

  // Add one black pixel on the first row so command payload is non-empty.
  data[0] = 0b10000000;

  return { widthPx, heightPx, data };
}

/**
 * Reference engine fixture. Mirrors the values every D1 device entry
 * ships today — `printableArea.leading: 8 mm` + `forcedTrailingFeedMm:
 * 8 mm`, both rounding to 57 dots at 180 dpi to preserve byte parity
 * with the pre-0.6.0 `FEED_MARGIN_PX = 57` constant.
 */
const ENGINE: PrintEngine = {
  role: 'primary',
  protocol: 'd1-tape',
  dpi: 180,
  headDots: 64,
  mediaCompatibility: ['d1'],
  printableArea: { leading: 8, trailing: 0, left: 0, right: 0 },
  forcedTrailingFeedMm: 8,
};

// 8 mm @ 180 dpi rounds to 57 dots — the same number the pre-0.6.0
// encoder used as a hard-coded `FEED_MARGIN_PX` constant.
const FEED_MARGIN_PX = 57;

describe('buildPrinterStream', () => {
  it('emits content via SYN+row and skip-lines via ESC D 0 + bare SYN', () => {
    // 8×40 head-aligned → scaled feed 320 content rows. ENGINE has
    // leading=8mm (57 dots) and trailing=8mm (57 dots).
    //
    // Wire layout per copy:
    //   ESC C 0                        3
    //   ESC D 0                        3   (leading skip block)
    //   SYN × 57                      57   (leading skip-lines)
    //   ESC D 8                        3   (bytes-per-line for content)
    //   (SYN + 8 bytes) × 320       2880   (content rows)
    //   ESC D 0                        3   (trailing skip block)
    //   SYN × 57                      57   (trailing skip-lines)
    //   ESC A                          2
    const scaledFeed = Math.round(40 * (64 / 8)); // 320
    const bitmap = makeBitmap(8, 40);
    const stream = buildPrinterStream(bitmap, ENGINE, { tapeWidth: 12 });

    const expectedLength =
      3 + // ESC C 0
      3 +
      FEED_MARGIN_PX + // leading: ESC D 0 + 57×SYN
      3 + // ESC D 8
      scaledFeed * 9 + // content rows (SYN + 8 bytes each)
      3 +
      FEED_MARGIN_PX + // trailing: ESC D 0 + 57×SYN
      2; // ESC A

    expect(stream).toHaveLength(expectedLength);

    // Starts with ESC C 0 (tape type)
    expect(stream[0]).toBe(0x1b);
    expect(stream[1]).toBe(0x43);
    expect(stream[2]).toBe(0x00);

    // Leading skip block: ESC D 0 then 57 bare SYNs
    expect(stream[3]).toBe(0x1b);
    expect(stream[4]).toBe(0x44);
    expect(stream[5]).toBe(0x00);
    for (let i = 0; i < FEED_MARGIN_PX; i += 1) {
      expect(stream[6 + i]).toBe(0x16);
    }

    // ESC D 8 marks end of leading skip block / start of content
    const contentDOffset = 6 + FEED_MARGIN_PX;
    expect(stream[contentDOffset]).toBe(0x1b);
    expect(stream[contentDOffset + 1]).toBe(0x44);
    expect(stream[contentDOffset + 2]).toBe(8);
    expect(stream[contentDOffset + 3]).toBe(0x16); // first content SYN

    // Ends with ESC A
    expect(stream.at(-2)).toBe(0x1b);
    expect(stream.at(-1)).toBe(0x41);

    // Trailing block sits immediately before ESC A: SYN × 57 then ESC A.
    for (let i = 0; i < FEED_MARGIN_PX; i += 1) {
      expect(stream[stream.length - 2 - FEED_MARGIN_PX + i]).toBe(0x16);
    }
    // Preceded by ESC D 0
    const trailingDOffset = stream.length - 2 - FEED_MARGIN_PX - 3;
    expect(stream[trailingDOffset]).toBe(0x1b);
    expect(stream[trailingDOffset + 1]).toBe(0x44);
    expect(stream[trailingDOffset + 2]).toBe(0x00);
  });

  it('uses correct bytes per line for each tape width', () => {
    // 8×10 head-aligned → scaled feed scales by (headDots / 8). Each
    // content row is `SYN + bytesPerLine` bytes; skip-lines blocks
    // contribute ESC D 0 + 57×SYN per side.
    const bitmap = makeBitmap(8, 10);
    const cases: Array<{ tapeWidth: 6 | 9 | 12 | 19; headDots: number; bytesPerLine: number }> = [
      { tapeWidth: 6, headDots: 32, bytesPerLine: 4 },
      { tapeWidth: 9, headDots: 48, bytesPerLine: 6 },
      { tapeWidth: 12, headDots: 64, bytesPerLine: 8 },
      { tapeWidth: 19, headDots: 64, bytesPerLine: 8 },
    ];

    for (const { tapeWidth, headDots, bytesPerLine } of cases) {
      const stream = buildPrinterStream(bitmap, ENGINE, { tapeWidth });
      const scaledFeed = Math.round(10 * (headDots / 8));

      // ESC D N sits right after the leading skip block (3 + 3 + 57 = 63).
      const contentDOffset = 3 + 3 + FEED_MARGIN_PX;
      expect(stream[contentDOffset]).toBe(0x1b);
      expect(stream[contentDOffset + 1]).toBe(0x44);
      expect(stream[contentDOffset + 2]).toBe(bytesPerLine);

      expect(stream).toHaveLength(
        3 +
          3 +
          FEED_MARGIN_PX +
          3 +
          scaledFeed * (1 + bytesPerLine) +
          3 +
          FEED_MARGIN_PX +
          2,
      );
    }
  });

  it('omits skip-line blocks when leading + trailing are zero', () => {
    // Bare engine — no leading or trailing pad. Stream collapses to
    // ESC C 0 / ESC D N / SYN content / ESC A.
    const bareEngine: PrintEngine = {
      role: 'primary',
      protocol: 'd1-tape',
      dpi: 180,
      headDots: 64,
    };
    const bitmap = makeBitmap(64, 64);
    const stream = buildPrinterStream(bitmap, bareEngine, { tapeWidth: 12 });

    expect(stream).toHaveLength(3 + 3 + 64 * 9 + 2);
    expect(stream[3]).toBe(0x1b);
    expect(stream[4]).toBe(0x44);
    expect(stream[5]).toBe(8); // ESC D 8 directly after ESC C 0 — no leading block
    expect(stream[6]).toBe(0x16); // first content SYN
  });

  it('reads leading pad from engine.printableArea and trailing from forcedTrailingFeedMm', () => {
    // Asymmetric engine: 4 mm leading + 12 mm trailing — verifies the
    // two halves are wired to separate engine fields, not a single
    // shared constant.
    const asymEngine: PrintEngine = {
      ...ENGINE,
      printableArea: { leading: 4, trailing: 0, left: 0, right: 0 },
      forcedTrailingFeedMm: 12,
    };
    const leadingDots = Math.round((4 * 180) / 25.4); // 28
    const trailingDots = Math.round((12 * 180) / 25.4); // 85

    const bitmap = makeBitmap(64, 64);
    const stream = buildPrinterStream(bitmap, asymEngine, { tapeWidth: 12 });

    // 3 (ESC C 0) + 3 + 28 (leading) + 3 (ESC D 8) + 64×9 + 3 + 85 (trailing) + 2 (ESC A).
    expect(stream).toHaveLength(3 + 3 + leadingDots + 3 + 64 * 9 + 3 + trailingDots + 2);
  });

  it('repeats the per-copy block for copies > 1', () => {
    const bitmap = makeBitmap(64, 64);
    const single = buildPrinterStream(bitmap, ENGINE, { tapeWidth: 12 });
    const triple = buildPrinterStream(bitmap, ENGINE, { tapeWidth: 12, copies: 3 });
    expect(triple).toHaveLength(single.length * 3);
  });

  it('derives ESC C selector from media colours', () => {
    const blackOnBlue = {
      id: 'd1-standard-bbl-12',
      name: 'test',
      type: 'tape',
      widthMm: 12,
      tapeWidthMm: 12,
      printableDots: 64,
      bytesPerLine: 8,
      text: 'black',
      background: 'blue',
    } satisfies LabelManagerMedia;

    const bitmap = makeBitmap(64, 8);
    const stream = buildPrinterStream(bitmap, ENGINE, {}, blackOnBlue);

    // ESC C selector at offset 2 — black-on-blue → 1
    expect(stream[0]).toBe(0x1b);
    expect(stream[1]).toBe(0x43);
    expect(stream[2]).toBe(0x01);
  });

  it('honours options.tapeType override over media-derived selector', () => {
    const blackOnWhite = {
      id: 'd1-standard-bw-12',
      name: 'test',
      type: 'tape',
      widthMm: 12,
      tapeWidthMm: 12,
      printableDots: 64,
      bytesPerLine: 8,
      text: 'black',
      background: 'white',
    } satisfies LabelManagerMedia;

    const bitmap = makeBitmap(64, 8);
    const stream = buildPrinterStream(bitmap, ENGINE, { tapeType: 9 }, blackOnWhite);

    expect(stream[2]).toBe(0x09);
  });

  it('rejects out-of-range options.tapeType', () => {
    const bitmap = makeBitmap(64, 8);
    expect(() => buildPrinterStream(bitmap, ENGINE, { tapeType: 13, tapeWidth: 12 })).toThrow(
      RangeError,
    );
    expect(() => buildPrinterStream(bitmap, ENGINE, { tapeType: -1, tapeWidth: 12 })).toThrow(
      RangeError,
    );
  });

  it('emits ESC E before ESC A when engine.capabilities.autocut is set', () => {
    const cuttingEngine: PrintEngine = {
      ...ENGINE,
      capabilities: { autocut: true },
    };
    const bitmap = makeBitmap(64, 8);
    const stream = buildPrinterStream(bitmap, cuttingEngine, { tapeWidth: 12 });

    // Tail layout: … ESC E ESC A
    expect(stream.at(-4)).toBe(0x1b);
    expect(stream.at(-3)).toBe(0x45);
    expect(stream.at(-2)).toBe(0x1b);
    expect(stream.at(-1)).toBe(0x41);
  });

  it('omits ESC E for manual-cutter engines (no autocut capability)', () => {
    const bitmap = makeBitmap(64, 8);
    const stream = buildPrinterStream(bitmap, ENGINE, { tapeWidth: 12 });

    // Tail is just ESC A — the byte before is the last skip-line SYN
    // (or the last content row byte), never ESC E.
    expect(stream.at(-2)).toBe(0x1b);
    expect(stream.at(-1)).toBe(0x41);
    expect(stream.at(-3)).not.toBe(0x45);
  });

  it('emits ESC E once per copy when autocut is set', () => {
    const cuttingEngine: PrintEngine = {
      ...ENGINE,
      capabilities: { autocut: true },
    };
    const bitmap = makeBitmap(64, 8);
    const stream = buildPrinterStream(bitmap, cuttingEngine, { tapeWidth: 12, copies: 3 });

    let cutCount = 0;
    for (let i = 0; i < stream.length - 1; i += 1) {
      if (stream[i] === 0x1b && stream[i + 1] === 0x45) cutCount += 1;
    }
    expect(cutCount).toBe(3);
  });

  it('prefers media.printableDots over options.tapeWidth for raster width', () => {
    const narrow = {
      id: 'd1-standard-bw-6',
      name: 'test',
      type: 'tape',
      widthMm: 6,
      tapeWidthMm: 6,
      printableDots: 32,
      bytesPerLine: 4,
      text: 'black',
      background: 'white',
    } satisfies LabelManagerMedia;

    const bareEngine: PrintEngine = {
      role: 'primary',
      protocol: 'd1-tape',
      dpi: 180,
      headDots: 64,
    };
    const bitmap = makeBitmap(32, 8);
    // Pass a misleading tapeWidth: 19 (would map to 64) — media wins.
    const stream = buildPrinterStream(bitmap, bareEngine, { tapeWidth: 19 }, narrow);

    // ESC D N at offset 3 — bytes-per-line should be ceil(32/8) = 4.
    expect(stream[3]).toBe(0x1b);
    expect(stream[4]).toBe(0x44);
    expect(stream[5]).toBe(4);
  });

  it('caps raster width at engine.headDots', () => {
    // Engine claims a 32-dot head; media wants 64 → cap at 32.
    const narrowEngine: PrintEngine = {
      role: 'primary',
      protocol: 'd1-tape',
      dpi: 180,
      headDots: 32,
    };
    const bitmap = makeBitmap(32, 8);
    const stream = buildPrinterStream(bitmap, narrowEngine, { tapeWidth: 12 });

    expect(stream[3]).toBe(0x1b);
    expect(stream[4]).toBe(0x44);
    expect(stream[5]).toBe(4); // 32 dots → 4 bytes
  });
});
