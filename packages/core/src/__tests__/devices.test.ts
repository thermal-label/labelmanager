import { describe, expect, it } from "vitest";
import { DEVICES, findDevice } from "../devices.js";

describe("devices", () => {
  it("finds known device by vid/pid", () => {
    const device = findDevice(0x0922, 0x1004);
    expect(device?.name).toBe("LabelManager 420P");
  });

  it("returns undefined for unknown devices", () => {
    const device = findDevice(0xffff, 0xffff);
    expect(device).toBeUndefined();
  });

  it("contains all expected registry keys", () => {
    expect(Object.keys(DEVICES)).toEqual([
      "LABELMANAGER_PNP",
      "LABELMANAGER_420P",
      "LABELMANAGER_WIRELESS_PNP",
      "LABELMANAGER_PC",
      "LABELPOINT_350",
      "MOBILE_LABELER"
    ]);
  });
});
