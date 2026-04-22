import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('node-hid', async () => await import('./__mocks__/node-hid.js'));

import { __setDevices, __setHandle } from './__mocks__/node-hid.js';
import { listPrinters, openPrinter } from '../discovery.js';

describe('discovery', () => {
  beforeEach(() => {
    __setDevices([]);
  });

  it('filters non-DYMO devices', async () => {
    __setDevices([
      { vendorId: 0x0922, productId: 0x1002, serialNumber: 'missing-path' },
      { vendorId: 0x1234, productId: 0x5678, path: '/dev/hidraw0' },
      { vendorId: 0x0922, productId: 0x1002, path: '/dev/hidraw1', serialNumber: 'abc' },
    ]);

    const printers = await listPrinters();
    expect(printers).toHaveLength(1);
    expect(printers[0]!.serialNumber).toBe('abc');
  });

  it('opens printer by serial number', async () => {
    const write = vi.fn(() => Promise.resolve(64));
    const readTimeout = vi.fn(() => Promise.resolve([0]));
    const close = vi.fn();

    __setDevices([
      { vendorId: 0x0922, productId: 0x1002, path: '/dev/hidraw1', serialNumber: 'A1' },
    ]);
    __setHandle('/dev/hidraw1', { write, readTimeout, close });

    const printer = await openPrinter({ serialNumber: 'A1' });
    expect(printer.device.pid).toBe(0x1002);
  });

  it('opens printer by VID/PID filters', async () => {
    const write = vi.fn(() => Promise.resolve(64));
    const readTimeout = vi.fn(() => Promise.resolve([0]));
    const close = vi.fn();

    __setDevices([
      { vendorId: 0x0922, productId: 0x1002, path: '/dev/hidraw1', serialNumber: 'A1' },
      { vendorId: 0x0922, productId: 0x1003, path: '/dev/hidraw2', serialNumber: 'A2' },
    ]);
    __setHandle('/dev/hidraw2', { write, readTimeout, close });

    const printer = await openPrinter({ vid: 0x0922, pid: 0x1003 });
    expect(printer.device.pid).toBe(0x1003);
  });

  it('throws when no compatible printer matches', async () => {
    __setDevices([{ vendorId: 0x1234, productId: 0x5678, path: '/dev/hidraw0' }]);
    await expect(openPrinter({ serialNumber: 'missing' })).rejects.toThrow(
      'No compatible DYMO LabelManager printer found.',
    );
  });
});
