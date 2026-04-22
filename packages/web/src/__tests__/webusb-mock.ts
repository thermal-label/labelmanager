export interface MockUSBDevice extends USBDevice {
  __transfers: { endpointNumber: number; data: Uint8Array }[];
}

export function createMockUSBDevice(vendorId = 0x0922, productId = 0x1002): MockUSBDevice {
  const transfers: { endpointNumber: number; data: Uint8Array }[] = [];
  let opened = false;

  return {
    vendorId,
    productId,
    serialNumber: undefined,
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
    selectConfiguration() {
      return Promise.resolve();
    },
    claimInterface() {
      return Promise.resolve();
    },
    releaseInterface() {
      return Promise.resolve();
    },
    transferOut(endpointNumber: number, data: BufferSource) {
      const array = data instanceof Uint8Array ? data : new Uint8Array(data as ArrayBuffer);
      transfers.push({ endpointNumber, data: Uint8Array.from(array) });
      return Promise.resolve({ bytesWritten: array.byteLength, status: 'ok' as const });
    },
    transferIn() {
      return Promise.resolve({
        data: new DataView(new Uint8Array([0]).buffer),
        status: 'ok' as const,
      });
    },
    __transfers: transfers,
  };
}
