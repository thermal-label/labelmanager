interface MockEndpoint {
  transfer(data: Buffer, callback: (err: Error | null) => void): void;
}

interface MockInEndpoint {
  transfer(length: number, callback: (err: Error | null, data?: Buffer) => void): void;
}

interface MockInterface {
  isKernelDriverActive(): boolean;
  detachKernelDriver(): void;
  claim(): void;
  release(callback?: (err: Error | null) => void): void;
  endpoint(address: number): MockEndpoint | MockInEndpoint;
}

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
  interface(n: number): MockInterface;
}

const devices: MockDevice[] = [];
const handles: Record<string, { out: MockEndpoint; inp: MockInEndpoint }> = {};

export function __setDevices(next: MockDevice[]): void {
  devices.splice(0, devices.length, ...next);
}

export function __setHandle(key: string, out: MockEndpoint, inp: MockInEndpoint): void {
  handles[key] = { out, inp };
}

export function getDeviceList(): MockDevice[] {
  return devices;
}
