import { describe, expect, it, vi } from 'vitest';
import { fromUSBDevice, requestPrinter } from '../printer.js';
import { createMockUSBDevice } from './webusb-mock.js';

describe('requestPrinter', () => {
  it('requests devices with default DYMO filters and opens the selected device', async () => {
    const device = createMockUSBDevice();
    const requestDevice = vi.fn(() => Promise.resolve(device));
    Object.defineProperty(globalThis, 'navigator', {
      value: { usb: { requestDevice } },
      configurable: true,
    });

    const printer = await requestPrinter();

    expect(requestDevice).toHaveBeenCalledTimes(1);
    const callArg = (
      requestDevice.mock.calls as unknown as [{ filters: USBDeviceFilter[] }][]
    )[0]![0];
    expect(callArg.filters.some(f => f.vendorId === 0x0922)).toBe(true);
    expect(printer.connected).toBe(true);
  });

  it('passes custom filters when provided', async () => {
    const device = createMockUSBDevice();
    const requestDevice = vi.fn(() => Promise.resolve(device));
    Object.defineProperty(globalThis, 'navigator', {
      value: { usb: { requestDevice } },
      configurable: true,
    });

    await requestPrinter({ filters: [{ vendorId: 0x0922, productId: 0x1002 }] });

    const callArg = (
      requestDevice.mock.calls as unknown as [{ filters: USBDeviceFilter[] }][]
    )[0]![0];
    expect(callArg.filters).toHaveLength(1);
    expect(callArg.filters[0]!.productId).toBe(0x1002);
  });

  it('throws for unsupported USB device', async () => {
    const unsupported = createMockUSBDevice(0x1234, 0x5678);
    await expect(fromUSBDevice(unsupported)).rejects.toThrow(
      'Unsupported USB device for DYMO LabelManager protocol.',
    );
  });
});
