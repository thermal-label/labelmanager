import type { LabelManagerDevice } from './types.js';

export const DEVICES = {
  LABELMANAGER_PNP: {
    name: 'LabelManager PnP',
    family: 'labelmanager',
    transports: ['usb', 'webusb'],
    vid: 0x0922,
    pid: 0x1002,
    supportedTapes: [6, 9, 12],
  },
  LABELMANAGER_420P: {
    name: 'LabelManager 420P',
    family: 'labelmanager',
    transports: ['usb', 'webusb'],
    vid: 0x0922,
    pid: 0x1004,
    supportedTapes: [6, 9, 12, 19],
  },
  LABELMANAGER_WIRELESS_PNP: {
    name: 'LabelManager Wireless PnP',
    family: 'labelmanager',
    transports: ['usb', 'webusb'],
    vid: 0x0922,
    pid: 0x1008,
    supportedTapes: [6, 9, 12],
  },
  LABELMANAGER_PC: {
    name: 'LabelManager PC',
    family: 'labelmanager',
    transports: ['usb', 'webusb'],
    vid: 0x0922,
    pid: 0x1002,
    supportedTapes: [6, 9, 12],
  },
  LABELPOINT_350: {
    name: 'LabelPoint 350',
    family: 'labelmanager',
    transports: ['usb', 'webusb'],
    vid: 0x0922,
    pid: 0x1003,
    supportedTapes: [6, 9, 12],
  },
  MOBILE_LABELER: {
    name: 'MobileLabeler',
    family: 'labelmanager',
    transports: ['usb', 'webusb'],
    vid: 0x0922,
    pid: 0x1009,
    supportedTapes: [6, 9, 12],
    experimental: true,
  },
} as const satisfies Record<string, LabelManagerDevice>;

/**
 * Find a supported device descriptor by USB vendor and product ID.
 *
 * @param vid USB vendor ID.
 * @param pid USB product ID.
 * @returns Matching descriptor or `undefined` when unsupported.
 */
export function findDevice(vid: number, pid: number): LabelManagerDevice | undefined {
  return Object.values(DEVICES).find(device => device.vid === vid && device.pid === pid);
}
