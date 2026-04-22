interface HIDDeviceFilter {
  vendorId?: number;
  productId?: number;
  usagePage?: number;
  usage?: number;
}

interface HIDConnectionEvent extends Event {
  readonly device: HIDDevice;
}

interface HIDInputReportEvent extends Event {
  readonly data: DataView;
  readonly reportId: number;
  readonly device: HIDDevice;
}

interface HIDDevice extends EventTarget {
  readonly vendorId: number;
  readonly productId: number;
  readonly opened: boolean;
  open(): Promise<void>;
  close(): Promise<void>;
  sendReport(reportId: number, data: BufferSource): Promise<void>;
  addEventListener(
    type: "inputreport",
    listener: (event: HIDInputReportEvent) => void,
    options?: boolean | AddEventListenerOptions
  ): void;
}

interface HID extends EventTarget {
  requestDevice(options: { filters: HIDDeviceFilter[] }): Promise<HIDDevice[]>;
}

interface Navigator {
  hid: HID;
}
