import type { RawImageData } from '@mbtech-nl/bitmap';
import { describe, expect, it } from 'vitest';
import { TAPE_12MM } from '../media.js';
import { createPreviewOffline } from '../preview.js';

/** Minimal solid-grey 4×4 RGBA image — enough to exercise the dither path. */
function makeImage(width: number, height: number): RawImageData {
  const data = new Uint8Array(width * height * 4);
  data.fill(128);
  return { width, height, data };
}

describe('createPreviewOffline', () => {
  it('returns a single black plane at the image native resolution', () => {
    const image = makeImage(4, 4);
    const result = createPreviewOffline(image, TAPE_12MM);

    expect(result.planes).toHaveLength(1);
    const plane = result.planes[0]!;
    expect(plane.name).toBe('black');
    expect(plane.displayColor).toBe('#000000');
    expect(plane.bitmap.widthPx).toBe(4);
    expect(plane.bitmap.heightPx).toBe(4);
  });

  it('echoes the supplied media and never marks the preview as assumed', () => {
    const result = createPreviewOffline(makeImage(8, 2), TAPE_12MM);
    expect(result.media).toBe(TAPE_12MM);
    expect(result.assumed).toBe(false);
  });
});
