import { describe, expect, it } from 'vitest';
import { DEVICES, findDevice } from '../devices.js';

describe('devices', () => {
  it('finds known device by vid/pid', () => {
    const device = findDevice(0x0922, 0x1004);
    expect(device?.name).toBe('LabelManager 420P');
  });

  it('finds the LabelManager PC by its corrected PID 0x0011', () => {
    expect(findDevice(0x0922, 0x0011)?.key).toBe('LM_PC');
  });

  it('returns undefined for unknown devices', () => {
    const device = findDevice(0xffff, 0xffff);
    expect(device).toBeUndefined();
  });

  it('contains all expected registry keys', () => {
    expect(new Set(Object.keys(DEVICES))).toEqual(
      new Set([
        'LM_PNP',
        'LM_420P',
        'LM_WIRELESS_PNP',
        'LM_PC',
        'LABELPOINT_350',
        'MOBILE_LABELER',
        'LM_280',
        'LM_400',
      ]),
    );
  });

  it('has no duplicate USB printer-mode PIDs after the §3 fixes', () => {
    const pids = Object.values(DEVICES)
      .map(d => d.transports.usb?.pid)
      .filter((p): p is string => p !== undefined);
    expect(new Set(pids).size).toBe(pids.length);
  });
});
