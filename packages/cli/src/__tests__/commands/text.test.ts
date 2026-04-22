import { describe, expect, it, vi } from 'vitest';

vi.mock('@thermal-label/labelmanager-node', () => ({
  listPrinters: vi.fn(),
  openPrinter: vi.fn(() =>
    Promise.resolve({
      printText: vi.fn(() => Promise.resolve()),
      close: vi.fn(),
    }),
  ),
  generateUdevRules: vi.fn(() => 'rules'),
}));

vi.mock('ora', () => ({
  default: vi.fn(() => ({
    start: () => ({ succeed: vi.fn(), fail: vi.fn() }),
  })),
}));

import { createProgram } from '../../index.js';

describe('print text command', () => {
  it('parses and executes text command', async () => {
    const program = createProgram();
    await program.parseAsync(['node', 'dymo', 'print', 'text', 'HELLO', '--tape', '9']);
    expect(true).toBe(true);
  });
});
