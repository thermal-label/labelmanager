import { describe, expect, it, vi } from "vitest";

vi.mock("@thermal-label/labelmanager-node", () => ({
  listPrinters: vi.fn(() => Promise.resolve([])),
  openPrinter: vi.fn(),
  generateUdevRules: vi.fn(() => "rules")
}));

import { createProgram } from "../../index.js";

describe("list command", () => {
  it("executes list command", async () => {
    const program = createProgram();
    await program.parseAsync(["node", "dymo", "list"]);
    expect(true).toBe(true);
  });
});
