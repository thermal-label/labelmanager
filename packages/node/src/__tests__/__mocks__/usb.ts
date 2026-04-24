/**
 * Minimal `node-usb` mock for discovery tests.
 *
 * Only the surface `LabelManagerDiscovery` uses is stubbed here:
 *   - `getDeviceList()` for enumeration
 *   - `device.open()/close()` + `getStringDescriptor` for serial reads.
 *
 * The `UsbTransport.open` call is mocked separately at the test level.
 */

interface MockDevice {
  deviceDescriptor: {
    idVendor: number;
    idProduct: number;
    iSerialNumber?: number;
  };
  busNumber?: number;
  deviceAddress?: number;
  open(): void;
  close(): void;
  getStringDescriptor(index: number, callback: (err: Error | null, value?: string) => void): void;
}

const devices: MockDevice[] = [];

export function __setDevices(next: MockDevice[]): void {
  devices.splice(0, devices.length, ...next);
}

export function getDeviceList(): MockDevice[] {
  return devices;
}
