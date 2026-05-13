import { afterEach, describe, expect, it, vi } from 'vitest';
import { DeviceIdentificationRequiredError } from '@thermal-label/contracts';
import { DEVICES } from '@thermal-label/labelmanager-core';
import { devicesForTransport, requestPrinters } from '../request-printers.js';
import { createMockUSBDevice } from './webusb-mock.js';

describe('requestPrinters(opts) — labelmanager generic factory', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('non-USB transports', () => {
    it('rejects serial', async () => {
      await expect(requestPrinters({ transport: 'serial' })).rejects.toThrow(/not supported/);
    });

    it('rejects bluetooth-spp', async () => {
      await expect(requestPrinters({ transport: 'bluetooth-spp' })).rejects.toThrow(
        /not supported/,
      );
    });

    it('rejects bluetooth-gatt', async () => {
      await expect(requestPrinters({ transport: 'bluetooth-gatt' })).rejects.toThrow(
        /not supported/,
      );
    });
  });

  describe('transport: usb — auto-identify', () => {
    it('returns a 1-key adapter map when picked USBDevice matches the registry', async () => {
      // Default mock VID/PID is LM_PNP (0x0922 / 0x1002).
      const device = createMockUSBDevice();
      const usbStub = { requestDevice: vi.fn().mockResolvedValue(device) };
      vi.stubGlobal('navigator', { usb: usbStub });

      const printers = await requestPrinters({ transport: 'usb' });
      const roles = Object.keys(printers);
      expect(roles).toHaveLength(1);
      const printer = printers[roles[0]!]!;
      expect(printer.family).toBe('labelmanager');
      await printer.close();
    });

    it('throws DeviceIdentificationRequiredError when picked device has unknown VID/PID', async () => {
      const device = createMockUSBDevice(0xdead, 0xbeef);
      const usbStub = { requestDevice: vi.fn().mockResolvedValue(device) };
      vi.stubGlobal('navigator', { usb: usbStub });

      await expect(requestPrinters({ transport: 'usb' })).rejects.toBeInstanceOf(
        DeviceIdentificationRequiredError,
      );
    });

    it('continueWith resumes with the chosen deviceKey reusing the picked USBDevice', async () => {
      const device = createMockUSBDevice(0xdead, 0xbeef);
      const requestDevice = vi.fn().mockResolvedValue(device);
      vi.stubGlobal('navigator', { usb: { requestDevice } });

      try {
        await requestPrinters({ transport: 'usb' });
        throw new Error('expected DeviceIdentificationRequiredError');
      } catch (err) {
        if (!(err instanceof DeviceIdentificationRequiredError)) throw err;
        const knownKey = err.candidates[0]?.key;
        if (!knownKey) throw new Error('no candidates returned');
        const printers = await err.continueWith(knownKey);
        const roles = Object.keys(printers);
        expect(roles).toHaveLength(1);
        // continueWith must NOT open the picker a second time.
        expect(requestDevice).toHaveBeenCalledTimes(1);
        await printers[roles[0]!]!.close();
      }
    });
  });
});

describe('devicesForTransport — labelmanager', () => {
  it('returns only entries declaring the given transport (USB only)', () => {
    const usb = devicesForTransport('usb');
    for (const entry of usb) expect(entry.transports.usb).toBeDefined();
    // labelmanager declares no GATT/SPP/serial in the registry.
    expect(devicesForTransport('bluetooth-gatt')).toHaveLength(0);
    expect(devicesForTransport('bluetooth-spp')).toHaveLength(0);
    expect(devicesForTransport('serial')).toHaveLength(0);
  });

  it('finds at least one known model (LM_PNP)', () => {
    const usb = devicesForTransport('usb');
    expect(usb.some(d => d.key === DEVICES.LM_PNP.key)).toBe(true);
  });
});
