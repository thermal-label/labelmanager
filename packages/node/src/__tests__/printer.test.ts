import { describe, expect, it, vi } from 'vitest';
import { MediaNotSpecifiedError, type Transport } from '@thermal-label/contracts';
import { DEVICES, MEDIA } from '@thermal-label/labelmanager-core';
import { DymoPrinter } from '../printer.js';

function makeTransport(statusByte = 0): {
  transport: Transport;
  write: ReturnType<typeof vi.fn>;
  read: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
} {
  const write = vi.fn(() => Promise.resolve());
  const read = vi.fn(() => Promise.resolve(new Uint8Array([statusByte])));
  const close = vi.fn(() => Promise.resolve());
  const transport: Transport = {
    get connected() {
      return true;
    },
    write,
    read,
    close,
  };
  return { transport, write, read, close };
}

const device = DEVICES.LABELMANAGER_PNP;

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

describe('DymoPrinter', () => {
  it('exposes family, model, connected, and device metadata', () => {
    const { transport } = makeTransport();
    const printer = new DymoPrinter(device, transport);

    expect(printer.family).toBe('labelmanager');
    expect(printer.model).toBe('LabelManager PnP');
    expect(printer.connected).toBe(true);
    expect(printer.device).toBe(device);
  });

  it('getStatus writes ESC A and returns the contracts shape', async () => {
    const { transport, write } = makeTransport(0);
    const printer = new DymoPrinter(device, transport);

    const status = await printer.getStatus();
    expect(write).toHaveBeenCalledTimes(1);
    expect(status.ready).toBe(true);
    expect(status.mediaLoaded).toBe(true);
    expect(status.errors).toEqual([]);
    expect(status.detectedMedia).toBeUndefined();
  });

  it('getStatus surfaces structured error codes', async () => {
    const { transport } = makeTransport(0b00000111);
    const printer = new DymoPrinter(device, transport);

    const status = await printer.getStatus();
    expect(status.ready).toBe(false);
    expect(status.mediaLoaded).toBe(false);
    expect(status.errors.map(e => e.code)).toEqual(['not_ready', 'no_media', 'low_media']);
  });

  it('print() sends encoded bytes when media is provided', async () => {
    const { transport, write } = makeTransport();
    const printer = new DymoPrinter(device, transport);

    await printer.print(solidRgba(8, 8), MEDIA.TAPE_12MM);

    expect(write).toHaveBeenCalled();
    const [[firstArg]] = write.mock.calls as unknown as [[Uint8Array]];
    expect(firstArg).toBeInstanceOf(Uint8Array);
  });

  it('print() throws MediaNotSpecifiedError without media and without status', async () => {
    const { transport } = makeTransport();
    const printer = new DymoPrinter(device, transport);

    await expect(printer.print(solidRgba(8, 8))).rejects.toBeInstanceOf(MediaNotSpecifiedError);
  });

  it('createPreview() returns a single black plane with explicit media', async () => {
    const { transport } = makeTransport();
    const printer = new DymoPrinter(device, transport);

    const preview = await printer.createPreview(solidRgba(8, 8), { media: MEDIA.TAPE_9MM });
    expect(preview.planes).toHaveLength(1);
    expect(preview.planes[0]!.name).toBe('black');
    expect(preview.media).toBe(MEDIA.TAPE_9MM);
    expect(preview.assumed).toBe(false);
  });

  it('createPreview() falls back to DEFAULT_MEDIA with assumed=true', async () => {
    const { transport } = makeTransport();
    const printer = new DymoPrinter(device, transport);

    const preview = await printer.createPreview(solidRgba(8, 8));
    expect(preview.assumed).toBe(true);
    expect(preview.media).toBe(MEDIA.TAPE_12MM);
  });

  it('close() awaits the transport', async () => {
    const { transport, close } = makeTransport();
    const printer = new DymoPrinter(device, transport);

    await printer.close();
    expect(close).toHaveBeenCalledTimes(1);
  });
});
