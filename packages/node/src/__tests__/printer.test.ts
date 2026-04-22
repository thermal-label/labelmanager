import { describe, expect, it, vi } from 'vitest';
import { DymoPrinter, type PrinterTransport } from '../printer.js';

describe('printer', () => {
  const descriptor = {
    name: 'LabelManager PnP',
    vid: 0x0922,
    pid: 0x1002,
    supportedTapes: [6, 9, 12] as (6 | 9 | 12)[],
  };

  function makeTransport(statusByte = 0) {
    const write = vi.fn(() => Promise.resolve());
    const read = vi.fn(() => Promise.resolve(Buffer.from([statusByte])));
    const close = vi.fn();
    const transport: PrinterTransport = { write, read, close };
    return { transport, write, read, close };
  }

  it('writes status command and parses status byte', async () => {
    const { transport, write } = makeTransport(0);
    const printer = new DymoPrinter(descriptor, transport);

    const status = await printer.getStatus();
    expect(write).toHaveBeenCalledTimes(1);
    expect(status.ready).toBe(true);
    expect(status.tapeInserted).toBe(true);
    expect(status.labelLow).toBe(false);
  });

  it('parses non-ready status flags', async () => {
    const { transport } = makeTransport(0b00000111);
    const printer = new DymoPrinter(descriptor, transport);

    const status = await printer.getStatus();
    expect(status.ready).toBe(false);
    expect(status.tapeInserted).toBe(false);
    expect(status.labelLow).toBe(true);
  });

  it('prints text and calls transport write', async () => {
    const { transport, write } = makeTransport();
    const printer = new DymoPrinter(descriptor, transport);

    await printer.printText('HELLO', { tapeWidth: 12, invert: true });

    expect(write).toHaveBeenCalled();
    const firstCall = write.mock.calls[0];
    expect(firstCall).toBeDefined();
    expect(firstCall?.[0]).toBeInstanceOf(Buffer);
  });

  it('prints pre-decoded image data', async () => {
    const { transport, write } = makeTransport();
    const printer = new DymoPrinter(descriptor, transport);

    await printer.printImage({
      width: 8,
      height: 8,
      data: new Uint8Array(8 * 8 * 4).fill(255),
    });

    expect(write).toHaveBeenCalled();
  });

  it('throws when querying status without transport', async () => {
    const printer = new DymoPrinter(descriptor);
    await expect(printer.getStatus()).rejects.toThrow('Printer is not connected.');
  });

  it('throws when printing without transport', async () => {
    const printer = new DymoPrinter(descriptor);
    await expect(printer.printText('HELLO')).rejects.toThrow('Printer is not connected.');
  });

  it('close is always callable', () => {
    const printer = new DymoPrinter(descriptor);
    expect(() => {
      printer.close();
    }).not.toThrow();
  });

  it('close delegates to transport when present', () => {
    const { transport, close } = makeTransport();
    const printer = new DymoPrinter(descriptor, transport);

    printer.close();
    expect(close).toHaveBeenCalledTimes(1);
  });
});
