import {
  DEVICES,
  encodeLabel,
  findDevice,
  renderImage,
  renderText,
  type DeviceDescriptor,
} from '@thermal-label/labelmanager-core';

export interface RequestOptions {
  filters?: HIDDeviceFilter[];
}

export interface TextPrintOptions {
  density?: 'normal' | 'high';
  copies?: number;
  invert?: boolean;
}

export interface ImagePrintOptions {
  density?: 'normal' | 'high';
  copies?: number;
  invert?: boolean;
  dither?: boolean;
  threshold?: number;
}

async function imageDataFromURL(url: string): Promise<ImageData> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image URL: ${url}`);
  }

  const blob = await response.blob();
  const bitmap = await createImageBitmap(blob);
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Could not create OffscreenCanvas 2D context.');
  }

  context.drawImage(bitmap, 0, 0);
  return context.getImageData(0, 0, bitmap.width, bitmap.height);
}

async function writeReports(device: HIDDevice, reports: Uint8Array[]): Promise<void> {
  for (const report of reports) {
    await device.sendReport(0x00, report);
  }
}

/**
 * Browser WebHID DYMO printer wrapper.
 */
export class WebDymoPrinter {
  public readonly device: HIDDevice;
  public readonly descriptor: DeviceDescriptor;
  private readonly inputReportHandler: (event: HIDInputReportEvent) => void;
  private latestStatus?: number;

  public constructor(device: HIDDevice, descriptor: DeviceDescriptor) {
    this.device = device;
    this.descriptor = descriptor;
    this.inputReportHandler = event => {
      this.latestStatus = event.data.getUint8(0);
    };
    this.device.addEventListener('inputreport', this.inputReportHandler);
  }

  public async printText(text: string, options: TextPrintOptions = {}): Promise<void> {
    const bitmap = renderText(text, options.invert === undefined ? {} : { invert: options.invert });
    const reports = encodeLabel(bitmap, {
      ...(options.density === undefined ? {} : { density: options.density }),
      ...(options.copies === undefined ? {} : { copies: options.copies }),
    });
    await writeReports(this.device, reports);
  }

  public async printImage(imageData: ImageData, options: ImagePrintOptions = {}): Promise<void> {
    const bitmap = renderImage(
      {
        width: imageData.width,
        height: imageData.height,
        data: Uint8Array.from(imageData.data),
      },
      {
        ...(options.invert === undefined ? {} : { invert: options.invert }),
        ...(options.dither === undefined ? {} : { dither: options.dither }),
        ...(options.threshold === undefined ? {} : { threshold: options.threshold }),
      },
    );
    const reports = encodeLabel(bitmap, {
      ...(options.density === undefined ? {} : { density: options.density }),
      ...(options.copies === undefined ? {} : { copies: options.copies }),
    });
    await writeReports(this.device, reports);
  }

  public async printImageURL(url: string, options: ImagePrintOptions = {}): Promise<void> {
    const imageData = await imageDataFromURL(url);
    await this.printImage(imageData, options);
  }

  public isConnected(): boolean {
    return this.device.opened;
  }

  public async disconnect(): Promise<void> {
    if (this.device.opened) {
      await this.device.close();
    }
  }

  public getLatestStatusByte(): number | undefined {
    return this.latestStatus;
  }
}

/**
 * Create a printer wrapper from an already-open HIDDevice.
 */
export function fromHIDDevice(device: HIDDevice): WebDymoPrinter {
  const descriptor = findDevice(device.vendorId, device.productId);
  if (!descriptor) {
    throw new Error('Unsupported HID device for DYMO LabelManager protocol.');
  }
  return new WebDymoPrinter(device, descriptor);
}

/**
 * Request a DYMO printer through the browser permission prompt.
 */
export async function requestPrinter(options: RequestOptions = {}): Promise<WebDymoPrinter> {
  const filters =
    options.filters ??
    Object.values(DEVICES).map(device => ({
      vendorId: device.vid,
      productId: device.pid,
    }));

  const devices = await navigator.hid.requestDevice({ filters });
  const selected = devices[0];
  if (!selected) {
    throw new Error('No HID device selected.');
  }

  if (!selected.opened) {
    await selected.open();
  }

  return fromHIDDevice(selected);
}
