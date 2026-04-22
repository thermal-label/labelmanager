import { describe, expect, it } from 'vitest';
import { generateUdevRules } from '../udev.js';

describe('udev', () => {
  it('includes expected vendor rules and reload instructions', () => {
    const rules = generateUdevRules();

    expect(rules).toContain('SUBSYSTEM=="hidraw"');
    expect(rules).toContain('ATTRS{idVendor}=="0922"');
    expect(rules).toContain('SUBSYSTEM=="usb"');
    expect(rules).toContain('sudo udevadm control --reload-rules');
  });
});
