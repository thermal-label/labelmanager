import { mediaCompatibleWith } from '@thermal-label/contracts';
import { describe, expect, it } from 'vitest';
import { DEVICE_REGISTRY_DATA } from '../devices.js';
import { MEDIA_LIST } from '../media.js';

describe('media', () => {
  it('every entry advertises the d1 substrate', () => {
    for (const m of MEDIA_LIST) {
      expect(m.targetModels, `entry ${m.id} missing targetModels`).toBeDefined();
      expect(m.targetModels, `entry ${m.id} not tagged 'd1'`).toContain('d1');
    }
  });

  it('every entry is accepted by every device primary engine', () => {
    for (const m of MEDIA_LIST) {
      for (const d of DEVICE_REGISTRY_DATA.devices) {
        expect(
          mediaCompatibleWith(m, d.engines[0]),
          `media ${m.id} not compatible with ${d.key} primary engine`,
        ).toBe(true);
      }
    }
  });
});
