import {
  DeviceIdentificationRequiredError,
  type ConnectOptions,
  type DeviceEntry,
  type PrinterAdapterMap,
  type Transport,
  type TransportType,
} from '@thermal-label/contracts';
import { DEVICES, findDevice, type LabelManagerDevice } from '@thermal-label/labelmanager-core';
import { WebUsbTransport } from '@thermal-label/transport/web';
import { DEFAULT_FILTERS, WebDymoPrinter } from './printer.js';

/**
 * Unified browser-picker factory for the labelmanager driver family.
 *
 * LabelManager devices are USB-only — the registry declares no other
 * transports. The factory accepts `ConnectOptions` for uniformity
 * across drivers but rejects non-USB transports up-front.
 *
 * USB path: opens the picker, auto-identifies via
 * `usbDevice.vendorId/productId`. Throws
 * `DeviceIdentificationRequiredError` (with USB-capable candidates +
 * a `continueWith` closure reusing the picked USBDevice) when the
 * picked device's VID/PID is not in the labelmanager registry.
 */
export async function requestPrinters(opts: ConnectOptions): Promise<PrinterAdapterMap> {
  if (opts.transport !== 'usb') {
    throw new Error(`labelmanager: transport "${opts.transport}" is not supported (USB only)`);
  }
  return requestPrintersUsb(opts);
}

async function requestPrintersUsb(
  opts: Extract<ConnectOptions, { transport: 'usb' }>,
): Promise<PrinterAdapterMap> {
  const usbDevice = await navigator.usb.requestDevice({ filters: DEFAULT_FILTERS });

  if (opts.deviceKey !== undefined) {
    const entry = entryByKey(opts.deviceKey);
    if (!entry) throw new Error(`requestPrinters(usb): unknown deviceKey "${opts.deviceKey}"`);
    const transport = await WebUsbTransport.fromDevice(usbDevice);
    return adapterMap(entry, transport);
  }

  const entry = findDevice(usbDevice.vendorId, usbDevice.productId);
  if (entry) {
    const transport = await WebUsbTransport.fromDevice(usbDevice);
    return adapterMap(entry, transport);
  }

  throw new DeviceIdentificationRequiredError(
    devicesForTransport('usb'),
    async (deviceKey: string) => {
      const chosen = entryByKey(deviceKey);
      if (!chosen) throw new Error(`continueWith: unknown deviceKey "${deviceKey}"`);
      const transport = await WebUsbTransport.fromDevice(usbDevice);
      return adapterMap(chosen, transport);
    },
  );
}

function adapterMap(entry: DeviceEntry, transport: Transport): PrinterAdapterMap {
  const engine = entry.engines[0];
  if (!engine) throw new Error(`Device ${entry.key} has no engines.`);
  // `DeviceEntry` (contracts-typed) narrows to `LabelManagerDevice`
  // (driver-typed) at the registry boundary — every entry in this
  // driver's registry has `family: 'labelmanager'` by construction.
  const printer = new WebDymoPrinter(entry as LabelManagerDevice, transport);
  return { [engine.role]: printer };
}

/**
 * Filter the registry to entries declaring `transport`. Used to
 * populate `DeviceIdentificationRequiredError.candidates`.
 */
export function devicesForTransport(transport: TransportType): readonly DeviceEntry[] {
  return Object.values(DEVICES).filter(d => transport in d.transports);
}

function entryByKey(key: string): DeviceEntry | undefined {
  return (DEVICES as Record<string, DeviceEntry | undefined>)[key];
}
