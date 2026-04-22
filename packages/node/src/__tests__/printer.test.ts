import { describe, expect, it, vi } from "vitest";
import { DymoPrinter } from "../printer.js";

describe("printer", () => {
  it("writes status command and parses status byte", async () => {
    const write = vi.fn(() => Promise.resolve(64));
    const readTimeout = vi.fn(() => Promise.resolve([0]));
    const close = vi.fn();

    const printer = new DymoPrinter(
      {
        name: "LabelManager PnP",
        vid: 0x0922,
        pid: 0x1002,
        supportedTapes: [6, 9, 12]
      },
      { write, readTimeout, close }
    );

    const status = await printer.getStatus();
    expect(write).toHaveBeenCalledTimes(1);
    expect(status.ready).toBe(true);
    expect(status.tapeInserted).toBe(true);
    expect(status.labelLow).toBe(false);
  });

  it("close is always callable", () => {
    const printer = new DymoPrinter({
      name: "LabelManager PnP",
      vid: 0x0922,
      pid: 0x1002,
      supportedTapes: [6, 9, 12]
    });

    expect(() => {
      printer.close();
    }).not.toThrow();
  });
});
