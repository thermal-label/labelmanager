import { mediaCompatibleWith } from '@thermal-label/contracts';
import { describe, expect, it } from 'vitest';
import { DEVICE_REGISTRY_DATA } from '../devices.js';
import { MEDIA_LIST } from '../media.js';

const KNOWN_SUBSTRATES = new Set(['d1', 'd1-19', 'd1-wide']);

describe('media', () => {
  it('every entry advertises a known D1 substrate tier', () => {
    for (const m of MEDIA_LIST) {
      expect(m.targetModels, `entry ${m.id} missing targetModels`).toBeDefined();
      const tiers = m.targetModels.filter((t: string) => KNOWN_SUBSTRATES.has(t));
      expect(
        tiers.length,
        `entry ${m.id} has no recognised D1 tier in ${JSON.stringify(m.targetModels)}`,
      ).toBeGreaterThan(0);
    }
  });

  it('every entry is accepted by at least one device primary engine', () => {
    for (const m of MEDIA_LIST) {
      const accepted = DEVICE_REGISTRY_DATA.devices.some(d => mediaCompatibleWith(m, d.engines[0]));
      expect(accepted, `media ${m.id} not accepted by any registered device`).toBe(true);
    }
  });

  it('19mm media only matches 19mm-capable engines', () => {
    const wide = MEDIA_LIST.filter(m => m.tapeWidthMm === 19);
    expect(wide.length, '19mm fixtures present').toBeGreaterThan(0);
    for (const m of wide) {
      for (const d of DEVICE_REGISTRY_DATA.devices) {
        const eng = d.engines[0];
        const tags = eng.mediaCompatibility as readonly string[];
        const expected = tags.includes('d1-19');
        expect(
          mediaCompatibleWith(m, eng),
          `${m.id} compatibility with ${d.key} should be ${String(expected)}`,
        ).toBe(expected);
      }
    }
  });
});
