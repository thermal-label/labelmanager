import { DEVICE_REGISTRY } from './devices.generated.js';
import type { LabelManagerDevice } from './types.js';

/**
 * Compiled `DeviceRegistry` for the LabelManager driver.
 *
 * Source of truth lives in `packages/core/data/devices/<KEY>.json5`;
 * `scripts/compile-data.mjs` aggregates them into the generated TS
 * module imported here. Use `DEVICES` for the keyed-by-key map kept
 * for source compatibility with prior consumers.
 */
export const DEVICE_REGISTRY_DATA = DEVICE_REGISTRY;

type DeviceKey = (typeof DEVICE_REGISTRY)['devices'][number]['key'];

/**
 * Registry of supported LabelManager devices, keyed by the device's
 * stable `key` field (e.g. `LM_PNP`, `LM_420P`). Values are the full
 * contracts `DeviceEntry`.
 *
 * Equivalent to `Object.fromEntries(DEVICE_REGISTRY_DATA.devices.map(d => [d.key, d]))`,
 * preserved as an indexed const so consumers can write
 * `DEVICES.LM_PNP` and get a precise type back.
 */
export const DEVICES = Object.fromEntries(
  DEVICE_REGISTRY.devices.map(d => [d.key, d]),
) as unknown as Record<DeviceKey, LabelManagerDevice>;

/**
 * Find a supported device entry by USB vendor and product ID.
 *
 * Looks at the `transports.usb` block of each entry — devices that do
 * not declare a USB transport (none today, but the shape allows it)
 * are skipped.
 *
 * @param vid USB vendor ID (numeric, as reported by node-usb / WebUSB).
 * @param pid USB product ID (numeric).
 * @returns Matching entry or `undefined` when unsupported.
 */
export function findDevice(vid: number, pid: number): LabelManagerDevice | undefined {
  return DEVICE_REGISTRY.devices.find(device => {
    const usb = device.transports.usb;
    return parseInt(usb.vid, 16) === vid && parseInt(usb.pid, 16) === pid;
  });
}
