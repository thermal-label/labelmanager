import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  listPrintersMock,
  openPrinterMock,
  generateUdevRulesMock,
  printTextMock,
  printImageMock,
  getStatusMock,
  closeMock,
} = vi.hoisted(() => {
  const listPrinters = vi.fn();
  const printText = vi.fn(() => Promise.resolve());
  const printImage = vi.fn(() => Promise.resolve());
  const getStatus = vi.fn(() =>
    Promise.resolve({ ready: true, tapeInserted: true, labelLow: false }),
  );
  const close = vi.fn();
  const openPrinter = vi.fn(() =>
    Promise.resolve({
      printText,
      printImage,
      getStatus,
      close,
    }),
  );
  const generateUdevRules = vi.fn(() => 'mock-rules');

  return {
    listPrintersMock: listPrinters,
    openPrinterMock: openPrinter,
    generateUdevRulesMock: generateUdevRules,
    printTextMock: printText,
    printImageMock: printImage,
    getStatusMock: getStatus,
    closeMock: close,
  };
});

vi.mock('@thermal-label/labelmanager-node', () => ({
  listPrinters: listPrintersMock,
  openPrinter: openPrinterMock,
  generateUdevRules: generateUdevRulesMock,
}));

vi.mock('ora', () => ({
  default: vi.fn(() => ({
    start: () => ({ succeed: vi.fn(), fail: vi.fn() }),
  })),
}));

import { createProgram } from '../../index.js';

describe('cli program commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('list command prints discovered printers', async () => {
    listPrintersMock.mockResolvedValueOnce([
      {
        device: { name: 'LabelManager PnP' },
        path: '/dev/hidraw1',
        serialNumber: 'ABC123',
      },
    ]);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(vi.fn());

    const program = createProgram();
    await program.parseAsync(['node', 'dymo', 'list']);

    expect(listPrintersMock).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledWith('LabelManager PnP (/dev/hidraw1) ABC123');
    logSpy.mockRestore();
  });

  it('text command forwards parsed print options', async () => {
    const program = createProgram();
    await program.parseAsync([
      'node',
      'dymo',
      'print',
      'text',
      'HELLO',
      '--tape',
      '9',
      '--invert',
      '--density',
      'high',
      '--serial',
      'A1',
    ]);

    expect(openPrinterMock).toHaveBeenCalledWith({ serialNumber: 'A1' });
    expect(printTextMock).toHaveBeenCalledWith('HELLO', {
      tapeWidth: 9,
      invert: true,
      density: 'high',
    });
    expect(closeMock).toHaveBeenCalled();
  });

  it('image command forwards parsed image options', async () => {
    const program = createProgram();
    await program.parseAsync([
      'node',
      'dymo',
      'print',
      'image',
      'label.png',
      '--tape',
      '19',
      '--threshold',
      '140',
      '--dither',
      '--invert',
    ]);

    expect(openPrinterMock).toHaveBeenCalledWith();
    expect(printImageMock).toHaveBeenCalledWith('label.png', {
      tapeWidth: 19,
      dither: true,
      threshold: 140,
      invert: true,
    });
    expect(closeMock).toHaveBeenCalled();
  });

  it('status command prints JSON and closes printer', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(vi.fn());

    const program = createProgram();
    await program.parseAsync(['node', 'dymo', 'status']);

    expect(openPrinterMock).toHaveBeenCalledWith();
    expect(getStatusMock).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledWith(
      JSON.stringify({ ready: true, tapeInserted: true, labelLow: false }, null, 2),
    );
    expect(closeMock).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('setup linux command prints generated rules', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(vi.fn());

    const program = createProgram();
    await program.parseAsync(['node', 'dymo', 'setup', 'linux']);

    expect(generateUdevRulesMock).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledWith('Install usb_modeswitch and udev rules:');
    expect(logSpy).toHaveBeenCalledWith('mock-rules');
    logSpy.mockRestore();
  });
});
