import { mediaCompatibleWith } from '@thermal-label/contracts';
import { describe, expect, it } from 'vitest';
import { DEVICE_REGISTRY_DATA } from '../devices.js';
import { findMediaByTapeWidth, MEDIA_LIST } from '../media.js';

const KNOWN_SUBSTRATES = new Set(['d1', 'd1-wide']);

describe('media', () => {
  it('every entry advertises a known D1 substrate tier', () => {
    for (const m of MEDIA_LIST) {
      expect(m.targetModels, `entry ${String(m.id)} missing targetModels`).toBeDefined();
      const tiers = (m.targetModels ?? []).filter((t: string) => KNOWN_SUBSTRATES.has(t));
      expect(
        tiers.length,
        `entry ${String(m.id)} has no recognised D1 tier in ${JSON.stringify(m.targetModels)}`,
      ).toBeGreaterThan(0);
    }
  });

  it('every entry is accepted by at least one device primary engine', () => {
    for (const m of MEDIA_LIST) {
      const accepted = DEVICE_REGISTRY_DATA.devices.some(d => mediaCompatibleWith(m, d.engines[0]));
      expect(accepted, `media ${String(m.id)} not accepted by any registered device`).toBe(true);
    }
  });

  describe('findMediaByTapeWidth', () => {
    it('returns a matching entry for every supported tape width', () => {
      for (const width of [6, 9, 12, 19]) {
        const entry = findMediaByTapeWidth(width);
        expect(entry, `no media for ${String(width)}mm`).toBeDefined();
        expect(entry?.tapeWidthMm).toBe(width);
      }
    });

    it('returns undefined for an unsupported tape width', () => {
      expect(findMediaByTapeWidth(24)).toBeUndefined();
    });
  });

  it('19mm media only matches 19mm-capable engines', () => {
    const wide = MEDIA_LIST.filter(m => m.tapeWidthMm === 19);
    expect(wide.length, '19mm fixtures present').toBeGreaterThan(0);
    for (const m of wide) {
      for (const d of DEVICE_REGISTRY_DATA.devices) {
        const eng = d.engines[0];
        const tags = eng.mediaCompatibility as readonly string[];
        const expected = tags.includes('d1-wide');
        expect(
          mediaCompatibleWith(m, eng),
          `${String(m.id)} compatibility with ${d.key} should be ${String(expected)}`,
        ).toBe(expected);
      }
    }
  });
});
