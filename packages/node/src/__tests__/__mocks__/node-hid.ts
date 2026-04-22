interface MockDevice {
  vendorId?: number;
  productId?: number;
  serialNumber?: string;
  path?: string;
}

interface MockHandle {
  write: (data: number[] | Uint8Array) => Promise<number>;
  readTimeout: (timeout: number) => Promise<number[]>;
  close: () => void;
}

const devices: MockDevice[] = [];
const opened: Record<string, MockHandle> = {};

export function __setDevices(next: MockDevice[]): void {
  devices.splice(0, devices.length, ...next);
}

export function __setHandle(path: string, handle: MockHandle): void {
  opened[path] = handle;
}

export function devicesAsync(): Promise<MockDevice[]> {
  return Promise.resolve(devices);
}

export const HIDAsync = {
  open: (path: string): Promise<MockHandle> => {
    const handle = opened[path];
    if (!handle) {
      throw new Error(`No mock HID handle for path: ${path}`);
    }
    return Promise.resolve(handle);
  },
};
