import { DEVICES, findDevice } from '@thermal-label/labelmanager-core';
import * as usb from 'usb';
import { DymoPrinter, type PrinterTransport } from './printer.js';
/* eslint-disable import-x/consistent-type-specifier-style */
import type { OpenOptions, PrinterInfo } from './types.js';

/**
 * Default WebUSB filters derived from known devices.
 */
export const DEFAULT_FILTERS = Object.values(DEVICES).map(device => ({
  vendorId: device.vid,
  productId: device.pid,
}));

async function readSerialNumber(device: usb.Device): Promise<string | undefined> {
  const idx = device.deviceDescriptor.iSerialNumber;
  if (!idx) return;
  return new Promise(resolve => {
    device.getStringDescriptor(idx, (err, value) => {
      resolve(err ? undefined : value);
    });
  });
}

export async function listPrinters(): Promise<PrinterInfo[]> {
  const devices = usb.getDeviceList();
  const results: PrinterInfo[] = [];

  for (const device of devices) {
    const { idVendor, idProduct, iSerialNumber } = device.deviceDescriptor;
    const descriptor = findDevice(idVendor, idProduct);
    if (!descriptor) continue;

    let serialNumber: string | undefined;
    if (iSerialNumber) {
      device.open();
      try {
        serialNumber = await readSerialNumber(device);
      } finally {
        device.close();
      }
    }

    results.push({
      device: descriptor,
      serialNumber,
      path: `${String(device.busNumber)}:${String(device.deviceAddress)}`,
    });
  }

  return results;
}

class UsbTransport implements PrinterTransport {
  public constructor(
    private readonly device: usb.Device,
    private readonly iface: usb.Interface,
    private readonly out: usb.OutEndpoint,
    private readonly inp: usb.InEndpoint,
  ) {}

  public write(data: Buffer): Promise<void> {
    return new Promise((resolve, reject) => {
      this.out.transfer(data, err => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  public read(length: number): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      this.inp.transfer(length, (err, data) => {
        if (err) reject(err);
        else resolve(data ?? Buffer.alloc(0));
      });
    });
  }

  public close(): void {
    this.iface.release(() => {
      this.device.close();
    });
  }
}

const PRINTER_INTERFACE = 0;
const EP_OUT = 0x05;
const EP_IN = 0x85;

/**
 * Open a connected printer matching optional filters.
 *
 * @param options Optional VID/PID/serial filtering.
 * @returns An opened `DymoPrinter` instance.
 * @throws When no compatible device matches.
 */
export async function openPrinter(options: OpenOptions = {}): Promise<DymoPrinter> {
  const devices = usb.getDeviceList();

  for (const device of devices) {
    const { idVendor, idProduct } = device.deviceDescriptor;
    const descriptor = findDevice(idVendor, idProduct);
    if (!descriptor) continue;
    if (options.vid !== undefined && idVendor !== options.vid) continue;
    if (options.pid !== undefined && idProduct !== options.pid) continue;

    device.open();

    if (options.serialNumber !== undefined) {
      const serial = await readSerialNumber(device);
      if (serial !== options.serialNumber) {
        device.close();
        continue;
      }
    }

    try {
      const iface = device.interface(PRINTER_INTERFACE);
      if (process.platform === 'linux' && iface.isKernelDriverActive()) {
        iface.detachKernelDriver();
      }
      iface.claim();

      const out = iface.endpoint(EP_OUT) as usb.OutEndpoint;
      const inp = iface.endpoint(EP_IN) as usb.InEndpoint;
      const transport = new UsbTransport(device, iface, out, inp);

      return new DymoPrinter(descriptor, transport);
    } catch (err) {
      device.close();
      throw err;
    }
  }

  throw new Error('No compatible DYMO LabelManager printer found.');
}
