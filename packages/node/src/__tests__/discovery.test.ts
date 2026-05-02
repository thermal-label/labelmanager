import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('usb', async () => await import('./__mocks__/usb.js'));

const { transportOpen } = vi.hoisted(() => ({ transportOpen: vi.fn() }));
vi.mock('@thermal-label/transport/node', () => ({
  UsbTransport: { open: transportOpen },
}));

import { __setDevices } from './__mocks__/usb.js';
import { discovery } from '../discovery.js';

function makeDevice(
  vendorId: number,
  productId: number,
  serialNumber?: string,
  busNumber = 1,
  deviceAddress = 2,
): {
  deviceDescriptor: { idVendor: number; idProduct: number; iSerialNumber: number };
  busNumber: number;
  deviceAddress: number;
  open: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
  getStringDescriptor: ReturnType<typeof vi.fn>;
} {
  const iSerialNumber = serialNumber ? 3 : 0;
  return {
    deviceDescriptor: { idVendor: vendorId, idProduct: productId, iSerialNumber },
    busNumber,
    deviceAddress,
    open: vi.fn(),
    close: vi.fn(),
    getStringDescriptor: vi.fn((_idx: number, cb: (err: null, val?: string) => void) => {
      cb(null, serialNumber);
    }),
  };
}

describe('LabelManagerDiscovery', () => {
  beforeEach(() => {
    __setDevices([]);
    transportOpen.mockReset();
  });

  it('exposes the labelmanager family', () => {
    expect(discovery.family).toBe('labelmanager');
  });

  it('filters non-DYMO devices and reports connection metadata', async () => {
    __setDevices([
      makeDevice(0x0922, 0x9999), // unknown PID
      makeDevice(0x1234, 0x5678), // unknown VID
      makeDevice(0x0922, 0x1002, 'abc'),
    ]);

    const printers = await discovery.listPrinters();
    expect(printers).toHaveLength(1);
    expect(printers[0]!.transport).toBe('usb');
    expect(printers[0]!.serialNumber).toBe('abc');
    expect(printers[0]!.device.family).toBe('labelmanager');
  });

  it('uses bus:address as the connectionId', async () => {
    __setDevices([makeDevice(0x0922, 0x1002, undefined, 3, 7)]);

    const printers = await discovery.listPrinters();
    expect(printers[0]!.connectionId).toBe('3:7');
  });

  it('openPrinter matches by serial number', async () => {
    __setDevices([makeDevice(0x0922, 0x1002, 'A1'), makeDevice(0x0922, 0x1002, 'A2')]);
    transportOpen.mockResolvedValue({
      get connected() {
        return true;
      },
      write: vi.fn(),
      read: vi.fn(),
      close: vi.fn(),
    });

    const printer = await discovery.openPrinter({ serialNumber: 'A2' });
    expect(printer.device.transports.usb?.pid).toBe('0x1002');
    expect(transportOpen).toHaveBeenCalledWith(0x0922, 0x1002);
  });

  it('openPrinter matches by VID/PID filters', async () => {
    __setDevices([makeDevice(0x0922, 0x1002, 'A1'), makeDevice(0x0922, 0x1004, 'A2')]);
    transportOpen.mockResolvedValue({
      get connected() {
        return true;
      },
      write: vi.fn(),
      read: vi.fn(),
      close: vi.fn(),
    });

    const printer = await discovery.openPrinter({ vid: 0x0922, pid: 0x1004 });
    expect(printer.device.transports.usb?.pid).toBe('0x1004');
    expect(transportOpen).toHaveBeenCalledWith(0x0922, 0x1004);
  });

  it('throws when no compatible printer matches', async () => {
    __setDevices([makeDevice(0x1234, 0x5678)]);
    await expect(discovery.openPrinter({ serialNumber: 'missing' })).rejects.toThrow(
      'No compatible DYMO LabelManager printer found.',
    );
  });
});
