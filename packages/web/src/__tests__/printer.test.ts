import { describe, expect, it, vi } from 'vitest';
import { fromUSBDevice } from '../index.js';
import { createMockUSBDevice } from './webusb-mock.js';

describe('WebDymoPrinter', () => {
  it('sends USB transfers for text prints', async () => {
    const device = createMockUSBDevice();
    await device.open();
    await device.selectConfiguration(1);
    await device.claimInterface(0);
    const printer = fromUSBDevice(device);

    await printer.printText('HELLO', { invert: true, tapeWidth: 12 });

    expect(device.__transfers.length).toBeGreaterThan(0);
    expect(device.__transfers[0]!.endpointNumber).toBe(5);
  });

  it('sends USB transfers for image prints', async () => {
    const device = createMockUSBDevice();
    await device.open();
    await device.selectConfiguration(1);
    await device.claimInterface(0);
    const printer = fromUSBDevice(device);
    const imageData = {
      width: 64,
      height: 64,
      data: new Uint8ClampedArray(64 * 64 * 4).fill(255),
    } as unknown as ImageData;

    await printer.printImage(imageData);

    expect(device.__transfers.length).toBeGreaterThan(0);
    expect(device.__transfers[0]!.endpointNumber).toBe(5);
  });

  it('first transfer starts with ESC C 0 (tape type command)', async () => {
    const device = createMockUSBDevice();
    await device.open();
    await device.selectConfiguration(1);
    await device.claimInterface(0);
    const printer = fromUSBDevice(device);

    await printer.printText('HI', { tapeWidth: 12 });

    const firstChunk = device.__transfers[0]!.data;
    expect(firstChunk[0]).toBe(0x1b); // ESC
    expect(firstChunk[1]).toBe(0x43); // C
    expect(firstChunk[2]).toBe(0x00); // 0
  });

  it('disconnects cleanly', async () => {
    const device = createMockUSBDevice();
    await device.open();
    await device.selectConfiguration(1);
    await device.claimInterface(0);
    const printer = fromUSBDevice(device);

    await printer.disconnect();
    expect(printer.isConnected()).toBe(false);
  });

  it('prints image from URL when fetch and canvas decode succeed', async () => {
    const device = createMockUSBDevice();
    await device.open();
    await device.selectConfiguration(1);
    await device.claimInterface(0);
    const printer = fromUSBDevice(device);

    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: true,
        blob: () => Promise.resolve(new Blob(['img'])),
      }),
    );
    Object.defineProperty(globalThis, 'fetch', { value: fetchMock, configurable: true });
    Object.defineProperty(globalThis, 'createImageBitmap', {
      value: vi.fn(() => Promise.resolve({ width: 2, height: 2 })),
      configurable: true,
    });
    Object.defineProperty(globalThis, 'OffscreenCanvas', {
      value: class {
        public getContext(): {
          drawImage: ReturnType<typeof vi.fn>;
          getImageData: ReturnType<typeof vi.fn>;
        } {
          return {
            drawImage: vi.fn(),
            getImageData: vi.fn(() => ({
              width: 2,
              height: 2,
              data: new Uint8ClampedArray(2 * 2 * 4).fill(255),
            })),
          };
        }
      },
      configurable: true,
    });

    await printer.printImageURL('https://example.test/label.png');

    expect(fetchMock).toHaveBeenCalledWith('https://example.test/label.png');
    expect(device.__transfers.length).toBeGreaterThan(0);
  });

  it('throws when image URL fetch fails', async () => {
    const device = createMockUSBDevice();
    await device.open();
    const printer = fromUSBDevice(device);

    Object.defineProperty(globalThis, 'fetch', {
      value: vi.fn(() =>
        Promise.resolve({
          ok: false,
          blob: () => Promise.resolve(new Blob()),
        }),
      ),
      configurable: true,
    });

    await expect(printer.printImageURL('https://example.test/missing.png')).rejects.toThrow(
      'Failed to fetch image URL: https://example.test/missing.png',
    );
  });

  it('throws when offscreen canvas context is unavailable', async () => {
    const device = createMockUSBDevice();
    await device.open();
    const printer = fromUSBDevice(device);

    Object.defineProperty(globalThis, 'fetch', {
      value: vi.fn(() =>
        Promise.resolve({
          ok: true,
          blob: () => Promise.resolve(new Blob(['img'])),
        }),
      ),
      configurable: true,
    });
    Object.defineProperty(globalThis, 'createImageBitmap', {
      value: vi.fn(() => Promise.resolve({ width: 2, height: 2 })),
      configurable: true,
    });
    Object.defineProperty(globalThis, 'OffscreenCanvas', {
      value: class {
        public getContext(): null {
          return null;
        }
      },
      configurable: true,
    });

    await expect(printer.printImageURL('https://example.test/no-context.png')).rejects.toThrow(
      'Could not create OffscreenCanvas 2D context.',
    );
  });

  it('getStatus sends ESC A and parses response byte', async () => {
    const device = createMockUSBDevice();
    await device.open();
    const printer = fromUSBDevice(device);

    const status = await printer.getStatus();

    // mock returns 0x00 → ready, tape inserted, not low
    expect(status.ready).toBe(true);
    expect(status.tapeInserted).toBe(true);
    expect(status.labelLow).toBe(false);

    const statusQuery = device.__transfers.find(t => t.data[0] === 0x1b && t.data[1] === 0x41);
    expect(statusQuery).toBeDefined();
  });
});
