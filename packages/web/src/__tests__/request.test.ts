import { describe, expect, it, vi } from 'vitest';
import { fromHIDDevice, requestPrinter } from '../index.js';
import { createMockHIDDevice } from './webhid-mock.js';

describe('requestPrinter', () => {
  it('requests devices with default filters and opens selected device', async () => {
    const device = createMockHIDDevice();
    const requestDevice = vi.fn(() => Promise.resolve([device]));
    Object.defineProperty(globalThis, 'navigator', {
      value: { hid: { requestDevice } },
      configurable: true,
    });

    const printer = await requestPrinter();

    expect(requestDevice).toHaveBeenCalledTimes(1);
    expect(printer.isConnected()).toBe(true);
  });

  it('throws when no device is selected', async () => {
    const requestDevice = vi.fn(() => Promise.resolve([]));
    Object.defineProperty(globalThis, 'navigator', {
      value: { hid: { requestDevice } },
      configurable: true,
    });

    await expect(requestPrinter()).rejects.toThrow('No HID device selected.');
  });

  it('throws for unsupported HID device', () => {
    const unsupported = createMockHIDDevice(0x1234, 0x5678);
    expect(() => fromHIDDevice(unsupported)).toThrow(
      'Unsupported HID device for DYMO LabelManager protocol.',
    );
  });
});
