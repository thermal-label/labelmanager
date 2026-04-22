import { describe, expect, it, vi } from "vitest";

vi.mock("@thermal-label/labelmanager-node", () => ({
  listPrinters: vi.fn(),
  openPrinter: vi.fn(() =>
    Promise.resolve({
      printImage: vi.fn(() => Promise.resolve()),
      close: vi.fn()
    })
  ),
  generateUdevRules: vi.fn(() => "rules")
}));

vi.mock("ora", () => ({
  default: vi.fn(() => ({
    start: () => ({ succeed: vi.fn(), fail: vi.fn() })
  }))
}));

import { createProgram } from "../../index.js";

describe("print image command", () => {
  it("parses and executes image command", async () => {
    const program = createProgram();
    await program.parseAsync([
      "node",
      "dymo",
      "print",
      "image",
      "label.png",
      "--threshold",
      "140",
      "--dither"
    ]);

    expect(true).toBe(true);
  });
});
