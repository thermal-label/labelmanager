import {
  DEVICES,
  buildPrinterStream,
  findDevice,
  type PrintOptions,
  renderImage,
  renderText,
  type DeviceDescriptor,
} from '@thermal-label/labelmanager-core';

const PRINTER_INTERFACE = 0;
const EP_OUT = 5; // endpoint number for EP 5 OUT (0x05)
const EP_IN = 5; // endpoint number for EP 5 IN  (0x85)
const CHUNK_SIZE = 64;

export interface RequestOptions {
  filters?: USBDeviceFilter[];
}

export interface TextPrintOptions extends PrintOptions {
  invert?: boolean;
}

export interface ImagePrintOptions extends PrintOptions {
  invert?: boolean;
  dither?: boolean;
  threshold?: number;
}

export interface PrinterStatus {
  ready: boolean;
  tapeInserted: boolean;
  labelLow: boolean;
}

async function imageDataFromURL(url: string): Promise<ImageData> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image URL: ${url}`);
  }

  const blob = await response.blob();
  const bmp = await createImageBitmap(blob);
  const canvas = new OffscreenCanvas(bmp.width, bmp.height);
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Could not create OffscreenCanvas 2D context.');
  }

  context.drawImage(bmp, 0, 0);
  return context.getImageData(0, 0, bmp.width, bmp.height);
}

async function writeStream(device: USBDevice, data: Uint8Array): Promise<void> {
  for (let offset = 0; offset < data.length; offset += CHUNK_SIZE) {
    const chunk = data.slice(offset, offset + CHUNK_SIZE);
    await device.transferOut(EP_OUT, chunk);
  }
}

/**
 * Browser WebUSB DYMO printer wrapper.
 *
 * Communicates via USB Interface 0 (Printer class), EP 5 OUT — the same path
 * used by labelle and the Node.js driver. Requires Chrome or Edge with WebUSB
 * support; the browser will prompt for device permission on first use.
 */
export class WebDymoPrinter {
  public readonly device: USBDevice;
  public readonly descriptor: DeviceDescriptor;

  public constructor(device: USBDevice, descriptor: DeviceDescriptor) {
    this.device = device;
    this.descriptor = descriptor;
  }

  /**
   * Print a text label.
   *
   * @param text Label text.
   * @param options Print options.
   */
  public async printText(text: string, options: TextPrintOptions = {}): Promise<void> {
    const bitmap = renderText(text, options.invert === undefined ? {} : { invert: options.invert });
    const stream = buildPrinterStream(bitmap, options);
    await writeStream(this.device, stream);
  }

  /**
   * Print an image from browser ImageData.
   *
   * @param imageData Browser ImageData object.
   * @param options Print options.
   */
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
    const stream = buildPrinterStream(bitmap, options);
    await writeStream(this.device, stream);
  }

  /**
   * Fetch an image URL and print it.
   *
   * @param url Image URL (must be CORS-accessible).
   * @param options Print options.
   */
  public async printImageURL(url: string, options: ImagePrintOptions = {}): Promise<void> {
    const imageData = await imageDataFromURL(url);
    await this.printImage(imageData, options);
  }

  /**
   * Query printer status via EP 5 IN.
   *
   * @returns Parsed status flags.
   */
  public async getStatus(): Promise<PrinterStatus> {
    await this.device.transferOut(EP_OUT, new Uint8Array([0x1b, 0x41]));
    const result = await this.device.transferIn(EP_IN, 64);
    const status = result.data?.getUint8(0) ?? 0;

    return {
      ready: (status & 0b00000001) === 0,
      tapeInserted: (status & 0b00000010) === 0,
      labelLow: (status & 0b00000100) !== 0,
    };
  }

  /**
   * Whether the USB device is currently open.
   */
  public isConnected(): boolean {
    return this.device.opened;
  }

  /**
   * Release the printer interface and close the USB device.
   */
  public async disconnect(): Promise<void> {
    if (this.device.opened) {
      await this.device.releaseInterface(PRINTER_INTERFACE);
      await this.device.close();
    }
  }
}

/**
 * Create a printer wrapper from an already-open, already-claimed USBDevice.
 *
 * The caller is responsible for having called `open()`, `selectConfiguration(1)`,
 * and `claimInterface(0)` before passing the device here.
 */
export function fromUSBDevice(device: USBDevice): WebDymoPrinter {
  const descriptor = findDevice(device.vendorId, device.productId);
  if (!descriptor) {
    throw new Error('Unsupported USB device for DYMO LabelManager protocol.');
  }
  return new WebDymoPrinter(device, descriptor);
}

/**
 * Request a DYMO printer through the browser permission prompt.
 *
 * Opens the device, selects configuration 1, and claims Interface 0
 * (Printer class) before returning the printer wrapper.
 */
export async function requestPrinter(options: RequestOptions = {}): Promise<WebDymoPrinter> {
  const filters =
    options.filters ??
    Object.values(DEVICES).map(device => ({
      vendorId: device.vid,
      productId: device.pid,
    }));

  const usbDevice = await navigator.usb.requestDevice({ filters });

  await usbDevice.open();
  await usbDevice.selectConfiguration(1);
  await usbDevice.claimInterface(PRINTER_INTERFACE);

  return fromUSBDevice(usbDevice);
}
