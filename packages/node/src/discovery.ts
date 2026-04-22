import { DEVICES, findDevice } from "@thermal-label/labelmanager-core";
import * as HID from "node-hid";
import { DymoPrinter } from "./printer.js";
/* eslint-disable import-x/consistent-type-specifier-style */
import type { OpenOptions, PrinterInfo } from "./types.js";

interface HidDeviceLike {
  vendorId?: number;
  productId?: number;
  serialNumber?: string;
  path?: string;
}

export async function listPrinters(): Promise<PrinterInfo[]> {
  const all = (await HID.devicesAsync()) as HidDeviceLike[];

  return all
    .map((device) => {
      if (!device.vendorId || !device.productId || !device.path) {
        return null;
      }

      const descriptor = findDevice(device.vendorId, device.productId);
      if (!descriptor) {
        return null;
      }

      return {
        device: descriptor,
        serialNumber: device.serialNumber,
        path: device.path
      } satisfies PrinterInfo;
    })
    .filter((value): value is PrinterInfo => value !== null);
}

export async function openPrinter(options: OpenOptions = {}): Promise<DymoPrinter> {
  const printers = await listPrinters();
  const match = printers.find((printer) => {
    if (options.serialNumber && printer.serialNumber !== options.serialNumber) {
      return false;
    }
    if (options.vid && printer.device.vid !== options.vid) {
      return false;
    }
    if (options.pid && printer.device.pid !== options.pid) {
      return false;
    }
    return true;
  });

  if (!match) {
    throw new Error("No compatible DYMO LabelManager printer found.");
  }

  const hid = (await HID.HIDAsync.open(match.path)) as unknown as {
    write(data: number[] | Uint8Array): Promise<number>;
    readTimeout(timeout: number): Promise<number[]>;
    close(): void;
  };
  return new DymoPrinter(match.device, hid);
}

export const DEFAULT_FILTERS = Object.values(DEVICES).map((device) => ({
  vendorId: device.vid,
  productId: device.pid
}));
