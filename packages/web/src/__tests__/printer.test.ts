import { describe, expect, it, vi } from 'vitest';
import { fromHIDDevice } from '../index.js';
import { createMockHIDDevice } from './webhid-mock.js';

describe('WebDymoPrinter', () => {
  it('sends HID reports for text prints', async () => {
    const device = createMockHIDDevice();
    await device.open();
    const printer = fromHIDDevice(device);

    await printer.printText('HELLO', { invert: true, density: 'high', copies: 2 });

    expect(device.__writes.length).toBeGreaterThan(0);
    expect(device.__writes[0]!.reportId).toBe(0x00);
  });

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

  it('prints image from URL when fetch and canvas decode succeed', async () => {
    const device = createMockHIDDevice();
    await device.open();
    const printer = fromHIDDevice(device);

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
    expect(device.__writes.length).toBeGreaterThan(0);
  });

  it('throws when image URL fetch fails', async () => {
    const device = createMockHIDDevice();
    await device.open();
    const printer = fromHIDDevice(device);

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
    const device = createMockHIDDevice();
    await device.open();
    const printer = fromHIDDevice(device);

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

  it('captures latest status byte from input report', () => {
    const device = createMockHIDDevice();
    const printer = fromHIDDevice(device);

    device.dispatchEvent({
      type: 'inputreport',
      data: new DataView(new Uint8Array([0x05]).buffer),
    } as unknown as Event);

    expect(printer.getLatestStatusByte()).toBe(0x05);
  });
});
