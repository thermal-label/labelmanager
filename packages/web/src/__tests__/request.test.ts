import { describe, expect, it, vi } from 'vitest';
import { requestPrinter } from '../index.js';
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
});
