/**
 * Minimal `USBDevice` mock covering the surface that `WebUsbTransport`
 * touches: configuration/interface claiming, endpoint enumeration, and
 * transfer in/out.
 */
export interface MockUSBDevice extends USBDevice {
  __transfers: { endpointNumber: number; data: Uint8Array }[];
}

export function createMockUSBDevice(
  vendorId = 0x0922,
  productId = 0x1002,
  statusByte = 0,
): MockUSBDevice {
  const transfers: { endpointNumber: number; data: Uint8Array }[] = [];
  let opened = false;

  const endpoints = [
    { endpointNumber: 5, direction: 'out' },
    { endpointNumber: 5, direction: 'in' },
  ] as unknown as USBEndpoint[];

  const configuration: USBConfiguration = {
    configurationValue: 1,
    configurationName: null,
    interfaces: [
      {
        interfaceNumber: 0,
        alternate: {
          alternateSetting: 0,
          interfaceClass: 7,
          interfaceSubclass: 1,
          interfaceProtocol: 2,
          interfaceName: null,
          endpoints,
        },
        alternates: [],
        claimed: false,
      },
    ],
  };

  return {
    vendorId,
    productId,
    serialNumber: undefined,
    get opened() {
      return opened;
    },
    configuration,
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
        data: new DataView(new Uint8Array([statusByte]).buffer),
        status: 'ok' as const,
      });
    },
    __transfers: transfers,
  } as unknown as MockUSBDevice;
}
