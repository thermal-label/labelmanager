/* eslint-disable @typescript-eslint/no-deprecated -- intentionally exercises the deprecated per-transport factories during plan-10 transition */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MediaNotSpecifiedError } from '@thermal-label/contracts';
import type { Transport } from '@thermal-label/contracts';
import { TAPE_12MM, findDevice } from '@thermal-label/labelmanager-core';
import {
  fromUSBDevice,
  fromUSBDeviceAll,
  requestPrinter,
  requestPrintersUsbLegacy,
  WebDymoPrinter,
} from '../printer.js';
import { createMockUSBDevice } from './webusb-mock.js';

/**
 * Fake `Transport` that records every write/read in call order and
 * introduces an async hop on each write so concurrent callers can
 * actually interleave if nothing serialises them.
 */
class RecordingTransport implements Transport {
  readonly calls: { kind: 'write' | 'read'; firstByte: number | undefined }[] = [];
  connected = true;

  async write(data: Uint8Array): Promise<void> {
    this.calls.push({ kind: 'write', firstByte: data[0] });
    // Yield twice so an unserialised concurrent caller has a real
    // opportunity to slip a write in between this driver's writes.
    await Promise.resolve();
    await Promise.resolve();
  }

  async read(): Promise<Uint8Array> {
    this.calls.push({ kind: 'read', firstByte: undefined });
    await Promise.resolve();
    // One D1 status byte: 0x40 = loaded + ready.
    return new Uint8Array([0x40]);
  }

  close(): Promise<void> {
    this.connected = false;
    return Promise.resolve();
  }
}

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

    await printer.print(solidRgba(8, 8), TAPE_12MM);

    expect(device.__transfers.length).toBeGreaterThan(0);
    expect(device.__transfers[0]!.endpointNumber).toBe(5);
  });

  it('first transfer starts with ESC C 0 (tape type)', async () => {
    const device = createMockUSBDevice();
    const printer = await fromUSBDevice(device);

    await printer.print(solidRgba(8, 8), TAPE_12MM);

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
    // 0x40 = bit 6 set = loaded + ready (LM_PNP bench-confirmed).
    const device = createMockUSBDevice(0x0922, 0x1002, 0x40);
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

  it('serialises getStatus() behind an in-flight print() (plan 15 A3)', async () => {
    const transport = new RecordingTransport();
    const device = findDevice(0x0922, 0x1002)!;
    const printer = new WebDymoPrinter(device, transport);

    // Kick a print and, before it resolves, fire a status poll —
    // exactly the hazard the 4 s poll loop creates against a long job.
    const printDone = printer.print(solidRgba(64, 64), TAPE_12MM);
    const statusDone = printer.getStatus();
    await Promise.all([printDone, statusDone]);

    // getStatus() is the only caller that issues a `read()`. With the
    // serializer in place, its write+read round-trip must land
    // entirely after every print write — i.e. the single read is the
    // very last recorded call and no write follows it.
    const firstReadIdx = transport.calls.findIndex(c => c.kind === 'read');
    expect(firstReadIdx).toBeGreaterThan(0);
    expect(firstReadIdx).toBe(transport.calls.length - 1);
    // Every call before the read is a print write — no status write
    // interleaved into the raster stream.
    expect(transport.calls.slice(0, firstReadIdx).every(c => c.kind === 'write')).toBe(true);
  });

  it('onStatus subscribes via the contracts polling shim (plan 11)', async () => {
    const device = createMockUSBDevice(0x0922, 0x1002, 0x40);
    const printer = await fromUSBDevice(device);

    // The polling shim kicks an immediate getStatus(); wait one tick
    // and confirm the subscriber sees a status frame.
    let received = 0;
    const unsub = printer.onStatus(() => {
      received += 1;
    });
    // Allow microtask + sleep for the immediate kick to land.
    await new Promise<void>(r => setTimeout(r, 30));
    unsub();
    await printer.close();
    expect(received).toBeGreaterThanOrEqual(1);
  });

  it('print() honours an explicit rotate override', async () => {
    const device = createMockUSBDevice();
    const printer = await fromUSBDevice(device);

    // An explicit rotate angle bypasses the orientation heuristic; the
    // call must still succeed and emit raster transfers.
    await printer.print(solidRgba(8, 8), TAPE_12MM, { rotate: 0 });
    expect(device.__transfers.length).toBeGreaterThan(0);
  });

  it('print() falls back to detectedMedia from the last status', async () => {
    // detectedMedia is always undefined on LabelManager (no media
    // detection), so a media-less print after getStatus still has no
    // resolvable media and must throw — exercising the `media ??
    // lastStatus?.detectedMedia` fallback branch.
    const device = createMockUSBDevice(0x0922, 0x1002, 0x40);
    const printer = await fromUSBDevice(device);

    await printer.getStatus();
    await expect(printer.print(solidRgba(8, 8))).rejects.toBeInstanceOf(MediaNotSpecifiedError);
  });
});

describe('createPreview', () => {
  it('uses the media override from PreviewOptions when supplied', async () => {
    const printer = await fromUSBDevice(createMockUSBDevice());
    const result = await printer.createPreview(solidRgba(8, 8), { media: TAPE_12MM });
    expect(result.media).toBe(TAPE_12MM);
    expect(result.assumed).toBe(false);
  });

  it('falls back to DEFAULT_MEDIA and marks the preview assumed without media', async () => {
    const printer = await fromUSBDevice(createMockUSBDevice());
    const result = await printer.createPreview(solidRgba(8, 8));
    expect(result.assumed).toBe(true);
    expect(result.planes).toHaveLength(1);
  });
});

describe('deprecated USB-only factories', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('requestPrinter opens the picked device', async () => {
    const device = createMockUSBDevice();
    vi.stubGlobal('navigator', { usb: { requestDevice: vi.fn().mockResolvedValue(device) } });

    const printer = await requestPrinter();
    expect(printer.connected).toBe(true);
    await printer.close();
  });

  it('requestPrintersUsbLegacy returns a 1-key adapter map keyed by engine role', async () => {
    const device = createMockUSBDevice();
    vi.stubGlobal('navigator', { usb: { requestDevice: vi.fn().mockResolvedValue(device) } });

    const printers = await requestPrintersUsbLegacy();
    const roles = Object.keys(printers);
    expect(roles).toHaveLength(1);
    expect(printers[roles[0]!]!.family).toBe('labelmanager');
    await printers[roles[0]!]!.close();
  });

  it('fromUSBDeviceAll wraps an already-selected device', async () => {
    const printers = await fromUSBDeviceAll(createMockUSBDevice());
    const roles = Object.keys(printers);
    expect(roles).toHaveLength(1);
    expect(printers[roles[0]!]!.model).toBe('LabelManager PnP');
    await printers[roles[0]!]!.close();
  });

  it('fromUSBDeviceAll throws for an unsupported USB device', async () => {
    await expect(fromUSBDeviceAll(createMockUSBDevice(0x1234, 0x5678))).rejects.toThrow(
      /Unsupported USB device/,
    );
  });
});
