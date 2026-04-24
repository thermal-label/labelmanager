import { DEVICES, findDevice, type LabelManagerDevice } from '@thermal-label/labelmanager-core';
/* eslint-disable import-x/consistent-type-specifier-style */
import type {
  DiscoveredPrinter,
  OpenOptions,
  PrinterDiscovery,
} from '@thermal-label/contracts';
import { UsbTransport } from '@thermal-label/transport/node';
import * as usb from 'usb';
import { DymoPrinter } from './printer.js';

/**
 * WebUSB filters for any supported LabelManager. Useful for browser
 * code that wants to request a device through the LabelManager family's
 * USB VID/PIDs without depending on the browser package.
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

async function enumerateDymoDevices(): Promise<
  { device: usb.Device; descriptor: LabelManagerDevice; serialNumber: string | undefined }[]
> {
  const results: {
    device: usb.Device;
    descriptor: LabelManagerDevice;
    serialNumber: string | undefined;
  }[] = [];

  for (const device of usb.getDeviceList()) {
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

    results.push({ device, descriptor, serialNumber });
  }

  return results;
}

/**
 * `PrinterDiscovery` implementation for DYMO LabelManager printers.
 *
 * Enumerates the USB bus via `node-usb`, matches against the
 * LabelManager `DEVICES` registry, and opens matching devices through
 * the shared `UsbTransport` from `@thermal-label/transport/node`.
 */
export class LabelManagerDiscovery implements PrinterDiscovery {
  readonly family = 'labelmanager';

  async listPrinters(): Promise<DiscoveredPrinter[]> {
    const found = await enumerateDymoDevices();
    return found.map(({ device, descriptor, serialNumber }) => ({
      device: descriptor,
      ...(serialNumber === undefined ? {} : { serialNumber }),
      transport: 'usb' as const,
      connectionId: `${String(device.busNumber)}:${String(device.deviceAddress)}`,
    }));
  }

  async openPrinter(options: OpenOptions = {}): Promise<DymoPrinter> {
    const found = await enumerateDymoDevices();
    const candidates = found.filter(entry => {
      if (options.vid !== undefined && entry.descriptor.vid !== options.vid) return false;
      if (options.pid !== undefined && entry.descriptor.pid !== options.pid) return false;
      if (options.serialNumber !== undefined && entry.serialNumber !== options.serialNumber)
        return false;
      return true;
    });

    const match = candidates[0];
    if (!match) throw new Error('No compatible DYMO LabelManager printer found.');

    const transport = await UsbTransport.open(match.descriptor.vid, match.descriptor.pid);
    return new DymoPrinter(match.descriptor, transport);
  }
}

/**
 * Named export discovered by the unified `thermal-label-cli` — the CLI
 * walks installed drivers looking for `mod.discovery`.
 */
export const discovery = new LabelManagerDiscovery();
