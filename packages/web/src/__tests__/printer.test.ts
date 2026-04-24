import { describe, expect, it } from 'vitest';
import { MediaNotSpecifiedError } from '@thermal-label/contracts';
import { MEDIA } from '@thermal-label/labelmanager-core';
import { fromUSBDevice } from '../printer.js';
import { createMockUSBDevice } from './webusb-mock.js';

function solidRgba(
  width: number,
  height: number,
): {
  width: number;
  height: number;
  data: Uint8Array;
} {
  return {
    width,
    height,
    data: new Uint8Array(width * height * 4).fill(0),
  };
}

describe('WebDymoPrinter', () => {
  it('sends WebUSB transfers for print()', async () => {
    const device = createMockUSBDevice();
    const printer = await fromUSBDevice(device);

    await printer.print(solidRgba(8, 8), MEDIA.TAPE_12MM);

    expect(device.__transfers.length).toBeGreaterThan(0);
    expect(device.__transfers[0]!.endpointNumber).toBe(5);
  });

  it('first transfer starts with ESC C 0 (tape type)', async () => {
    const device = createMockUSBDevice();
    const printer = await fromUSBDevice(device);

    await printer.print(solidRgba(8, 8), MEDIA.TAPE_12MM);

    const firstChunk = device.__transfers[0]!.data;
    expect(firstChunk[0]).toBe(0x1b);
    expect(firstChunk[1]).toBe(0x43);
    expect(firstChunk[2]).toBe(0x00);
  });

  it('print() throws MediaNotSpecifiedError without media', async () => {
    const device = createMockUSBDevice();
    const printer = await fromUSBDevice(device);

    await expect(printer.print(solidRgba(8, 8))).rejects.toBeInstanceOf(MediaNotSpecifiedError);
  });

  it('getStatus sends ESC A and returns the contracts shape', async () => {
    const device = createMockUSBDevice();
    const printer = await fromUSBDevice(device);

    const status = await printer.getStatus();
    expect(status.ready).toBe(true);
    expect(status.mediaLoaded).toBe(true);
    expect(status.detectedMedia).toBeUndefined();
    expect(status.errors).toEqual([]);

    const statusQuery = device.__transfers.find(t => t.data[0] === 0x1b && t.data[1] === 0x41);
    expect(statusQuery).toBeDefined();
  });

  it('close() disconnects the underlying device', async () => {
    const device = createMockUSBDevice();
    const printer = await fromUSBDevice(device);

    await printer.close();
    expect(device.opened).toBe(false);
    expect(printer.connected).toBe(false);
  });

  it('exposes adapter metadata', async () => {
    const device = createMockUSBDevice();
    const printer = await fromUSBDevice(device);

    expect(printer.family).toBe('labelmanager');
    expect(printer.model).toBe('LabelManager PnP');
    expect(printer.device.family).toBe('labelmanager');
  });
});
