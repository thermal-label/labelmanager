export interface MockHIDDevice extends HIDDevice {
  __writes: { reportId: number; data: Uint8Array }[];
}

export function createMockHIDDevice(vendorId = 0x0922, productId = 0x1002): MockHIDDevice {
  const writes: { reportId: number; data: Uint8Array }[] = [];
  let opened = false;
  const listeners: Record<string, ((event: Event) => void)[]> = {};

  const device: MockHIDDevice = {
    vendorId,
    productId,
    get opened() {
      return opened;
    },
    open() {
      opened = true;
      return Promise.resolve();
    },
    close() {
      opened = false;
      return Promise.resolve();
    },
    sendReport(reportId: number, data: BufferSource) {
      const array = data instanceof Uint8Array ? data : new Uint8Array(data as ArrayBuffer);
      writes.push({ reportId, data: Uint8Array.from(array) });
      return Promise.resolve();
    },
    addEventListener(type: string, listener: EventListenerOrEventListenerObject) {
      const bucket = (listeners[type] ??= []);
      const wrapped =
        typeof listener === 'function'
          ? listener
          : (event: Event) => {
              listener.handleEvent(event);
            };
      bucket.push(wrapped);
    },
    removeEventListener(type: string, listener: EventListenerOrEventListenerObject) {
      listeners[type] = (listeners[type] ?? []).filter(entry => entry !== listener);
    },
    dispatchEvent(event: Event) {
      for (const listener of listeners[event.type] ?? []) {
        listener(event);
      }
      return true;
    },
    __writes: writes,
  } as unknown as MockHIDDevice;

  return device;
}
