import { describe, expect, it } from 'vitest';
import { fromHIDDevice } from '../index.js';
import { createMockHIDDevice } from './webhid-mock.js';

describe('WebDymoPrinter', () => {
  it('sends HID reports for image prints', async () => {
    const device = createMockHIDDevice();
    await device.open();
    const printer = fromHIDDevice(device);
    const imageData = {
      width: 64,
      height: 64,
      data: new Uint8ClampedArray(64 * 64 * 4).fill(255),
    } as unknown as ImageData;

    await printer.printImage(imageData);

    expect(device.__writes.length).toBeGreaterThan(0);
    expect(device.__writes[0]!.reportId).toBe(0x00);
  });

  it('disconnects cleanly', async () => {
    const device = createMockHIDDevice();
    await device.open();
    const printer = fromHIDDevice(device);
    await printer.disconnect();
    expect(printer.isConnected()).toBe(false);
  });
});
