import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('usb', async () => await import('./__mocks__/usb.js'));

import { __setDevices } from './__mocks__/usb.js';
import { listPrinters, openPrinter } from '../discovery.js';

function makeDevice(
  vendorId: number,
  productId: number,
  serialNumber?: string,
  busNumber = 1,
  deviceAddress = 2,
) {
  const iSerialNumber = serialNumber ? 3 : 0;
  const mockInterface = {
    isKernelDriverActive: () => false,
    detachKernelDriver: vi.fn(),
    claim: vi.fn(),
    release: vi.fn((cb?: (err: null) => void) => cb?.(null)),
    endpoint: (address: number) =>
      address === 0x05
        ? {
            transfer: vi.fn((_data: Buffer, cb: (err: null) => void) => {
              cb(null);
            }),
          }
        : {
            transfer: vi.fn((_len: number, cb: (err: null, data: Buffer) => void) => {
              cb(null, Buffer.from([0]));
            }),
          },
  };

  return {
    deviceDescriptor: { idVendor: vendorId, idProduct: productId, iSerialNumber },
    busNumber,
    deviceAddress,
    open: vi.fn(),
    close: vi.fn(),
    getStringDescriptor: vi.fn((_idx: number, cb: (err: null, val?: string) => void) => {
      cb(null, serialNumber);
    }),
    interface: vi.fn(() => mockInterface),
  };
}

describe('discovery', () => {
  beforeEach(() => {
    __setDevices([]);
  });

  it('filters non-DYMO devices', async () => {
    __setDevices([
      makeDevice(0x0922, 0x9999), // unknown PID
      makeDevice(0x1234, 0x5678), // unknown VID
      makeDevice(0x0922, 0x1002, 'abc'),
    ]);

    const printers = await listPrinters();
    expect(printers).toHaveLength(1);
    expect(printers[0]!.serialNumber).toBe('abc');
  });

  it('returns path as bus:address', async () => {
    __setDevices([makeDevice(0x0922, 0x1002, undefined, 3, 7)]);

    const printers = await listPrinters();
    expect(printers[0]!.path).toBe('3:7');
  });

  it('opens printer by serial number', async () => {
    __setDevices([makeDevice(0x0922, 0x1002, 'A1'), makeDevice(0x0922, 0x1002, 'A2')]);

    const printer = await openPrinter({ serialNumber: 'A1' });
    expect(printer.device.pid).toBe(0x1002);
  });

  it('opens printer by VID/PID filters', async () => {
    __setDevices([makeDevice(0x0922, 0x1002, 'A1'), makeDevice(0x0922, 0x1003, 'A2')]);

    const printer = await openPrinter({ vid: 0x0922, pid: 0x1003 });
    expect(printer.device.pid).toBe(0x1003);
  });

  it('throws when no compatible printer matches', async () => {
    __setDevices([makeDevice(0x1234, 0x5678)]);
    await expect(openPrinter({ serialNumber: 'missing' })).rejects.toThrow(
      'No compatible DYMO LabelManager printer found.',
    );
  });
});
