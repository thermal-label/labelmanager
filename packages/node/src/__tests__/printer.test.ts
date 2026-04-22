import { describe, expect, it, vi } from 'vitest';
import { DymoPrinter } from '../printer.js';

describe('printer', () => {
  const descriptor = {
    name: 'LabelManager PnP',
    vid: 0x0922,
    pid: 0x1002,
    supportedTapes: [6, 9, 12] as (6 | 9 | 12)[],
  };

  it('writes status command and parses status byte', async () => {
    const write = vi.fn(() => Promise.resolve(64));
    const readTimeout = vi.fn(() => Promise.resolve([0]));
    const close = vi.fn();

    const printer = new DymoPrinter(descriptor, { write, readTimeout, close });

    const status = await printer.getStatus();
    expect(write).toHaveBeenCalledTimes(1);
    expect(status.ready).toBe(true);
    expect(status.tapeInserted).toBe(true);
    expect(status.labelLow).toBe(false);
  });

  it('parses non-ready status flags', async () => {
    const printer = new DymoPrinter(descriptor, {
      write: vi.fn(() => Promise.resolve(64)),
      readTimeout: vi.fn(() => Promise.resolve([0b00000111])),
      close: vi.fn(),
    });

    const status = await printer.getStatus();
    expect(status.ready).toBe(false);
    expect(status.tapeInserted).toBe(false);
    expect(status.labelLow).toBe(true);
  });

  it('prints text and writes HID report payloads', async () => {
    const write = vi.fn<(data: number[] | Uint8Array) => Promise<number>>(() =>
      Promise.resolve(64),
    );
    const printer = new DymoPrinter(descriptor, {
      write,
      readTimeout: vi.fn(() => Promise.resolve([0])),
      close: vi.fn(),
    });

    await printer.printText('HELLO', { tapeWidth: 12, invert: true, density: 'high' });

    expect(write).toHaveBeenCalled();
    const firstCall = write.mock.calls[0];
    expect(firstCall).toBeDefined();
    const firstCallPayload = firstCall?.[0];
    expect(firstCallPayload).toBeDefined();
    expect(firstCallPayload instanceof Uint8Array || Array.isArray(firstCallPayload)).toBe(true);
  });

  it('prints pre-decoded image data', async () => {
    const write = vi.fn(() => Promise.resolve(64));
    const printer = new DymoPrinter(descriptor, {
      write,
      readTimeout: vi.fn(() => Promise.resolve([0])),
      close: vi.fn(),
    });

    await printer.printImage({
      width: 8,
      height: 8,
      data: new Uint8Array(8 * 8 * 4).fill(255),
    });

    expect(write).toHaveBeenCalled();
  });

  it('throws when querying status without HID connection', async () => {
    const printer = new DymoPrinter(descriptor);
    await expect(printer.getStatus()).rejects.toThrow('Printer is not connected.');
  });

  it('throws when printing without HID connection', async () => {
    const printer = new DymoPrinter(descriptor);
    await expect(printer.printText('HELLO')).rejects.toThrow('Printer is not connected.');
  });

  it('close is always callable', () => {
    const printer = new DymoPrinter(descriptor);

    expect(() => {
      printer.close();
    }).not.toThrow();
  });

  it('close delegates to HID handle when present', () => {
    const close = vi.fn();
    const printer = new DymoPrinter(descriptor, {
      write: vi.fn(() => Promise.resolve(64)),
      readTimeout: vi.fn(() => Promise.resolve([0])),
      close,
    });

    printer.close();
    expect(close).toHaveBeenCalledTimes(1);
  });
});
