import { DEVICES, findDevice, type LabelManagerDevice } from '@thermal-label/labelmanager-core';
import type { DiscoveredPrinter, OpenOptions, PrinterDiscovery } from '@thermal-label/contracts';
import { UsbTransport } from '@thermal-label/transport/node';
import * as usb from 'usb';
import { DymoPrinter } from './printer.js';

/**
 * WebUSB filters for any supported LabelManager. Useful for browser
 * code that wants to request a device through the LabelManager family's
 * USB VID/PIDs without depending on the browser package. Devices
 * without a USB transport are skipped.
 *
 * Typed as `{ vendorId: number; productId: number }[]` rather than
 * the WebUSB-DOM `USBDeviceFilter[]` so this Node-side module does not
 * pull in the WebUSB lib types.
 */
export const DEFAULT_FILTERS: { vendorId: number; productId: number }[] = Object.values(DEVICES)
  .map(device => device.transports.usb)
  .filter((t): t is { vid: string; pid: string } => t !== undefined)
  .map(t => ({ vendorId: parseInt(t.vid, 16), productId: parseInt(t.pid, 16) }));

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
      const usb = entry.descriptor.transports.usb;
      if (!usb) return false;
      const vid = parseInt(usb.vid, 16);
      const pid = parseInt(usb.pid, 16);
      if (options.vid !== undefined && vid !== options.vid) return false;
      if (options.pid !== undefined && pid !== options.pid) return false;
      if (options.serialNumber !== undefined && entry.serialNumber !== options.serialNumber)
        return false;
      return true;
    });

    const match = candidates[0];
    if (!match) throw new Error('No compatible DYMO LabelManager printer found.');

    const matchUsb = match.descriptor.transports.usb;
    if (!matchUsb) throw new Error('Matched device has no USB transport.');
    const transport = await UsbTransport.open(
      parseInt(matchUsb.vid, 16),
      parseInt(matchUsb.pid, 16),
    );
    return new DymoPrinter(match.descriptor, transport);
  }
}

/**
 * Named export discovered by the unified `thermal-label-cli` — the CLI
 * walks installed drivers looking for `mod.discovery`.
 */
export const discovery = new LabelManagerDiscovery();
