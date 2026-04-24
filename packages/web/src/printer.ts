import {
  buildPrinterStream,
  renderImage,
  DEFAULT_MEDIA,
  DEVICES,
  STATUS_REQUEST,
  createPreviewOffline,
  findDevice,
  parseStatus,
  type LabelManagerDevice,
  type LabelManagerMedia,
  type LabelManagerPrintOptions,
  type MediaDescriptor,
  type PreviewOptions,
  type PreviewResult,
  type PrinterAdapter,
  type PrinterStatus,
  type RawImageData,
  type Transport,
} from '@thermal-label/labelmanager-core';
import { MediaNotSpecifiedError } from '@thermal-label/contracts';
import { buildUsbFilters } from '@thermal-label/transport';
import { WebUsbTransport } from '@thermal-label/transport/web';

const CHUNK_SIZE = 64;
const STATUS_READ_LENGTH = 64;

export interface RequestOptions {
  filters?: USBDeviceFilter[];
}

/**
 * WebUSB `PrinterAdapter` implementation for DYMO LabelManager printers.
 *
 * Thin wrapper over `WebUsbTransport` from `@thermal-label/transport/web`.
 * Shares `DymoPrinter`'s rendering path — callers pass full RGBA and the
 * driver thresholds/dithers to 1bpp internally.
 */
export class WebDymoPrinter implements PrinterAdapter {
  readonly family = 'labelmanager' as const;
  readonly device: LabelManagerDevice;

  private readonly transport: Transport;
  private lastStatus: PrinterStatus | undefined;

  constructor(device: LabelManagerDevice, transport: Transport) {
    this.device = device;
    this.transport = transport;
  }

  get model(): string {
    return this.device.name;
  }

  get connected(): boolean {
    return this.transport.connected;
  }

  async print(
    image: RawImageData,
    media?: MediaDescriptor,
    options?: LabelManagerPrintOptions,
  ): Promise<void> {
    const resolvedMedia = (media ?? this.lastStatus?.detectedMedia) as
      | LabelManagerMedia
      | undefined;
    if (!resolvedMedia) {
      throw new MediaNotSpecifiedError();
    }

    const bitmap = renderImage(image, { dither: true });
    const stream = buildPrinterStream(bitmap, {
      ...options,
      tapeWidth: resolvedMedia.tapeWidthMm,
    });
    await this.writeStream(stream);
  }

  async createPreview(image: RawImageData, options?: PreviewOptions): Promise<PreviewResult> {
    const override = options?.media as LabelManagerMedia | undefined;
    const detected = this.lastStatus?.detectedMedia as LabelManagerMedia | undefined;
    if (override) return createPreviewOffline(image, override);
    if (detected) return createPreviewOffline(image, detected);
    return { ...createPreviewOffline(image, DEFAULT_MEDIA), assumed: true };
  }

  async getStatus(): Promise<PrinterStatus> {
    await this.transport.write(STATUS_REQUEST);
    const response = await this.transport.read(STATUS_READ_LENGTH);
    const status = parseStatus(response);
    this.lastStatus = status;
    return status;
  }

  async close(): Promise<void> {
    await this.transport.close();
  }

  private async writeStream(data: Uint8Array): Promise<void> {
    for (let offset = 0; offset < data.length; offset += CHUNK_SIZE) {
      const chunk = data.subarray(offset, Math.min(offset + CHUNK_SIZE, data.length));
      await this.transport.write(chunk);
    }
  }
}

/**
 * WebUSB filter set matching every supported LabelManager VID/PID.
 *
 * Passed to `navigator.usb.requestDevice()` by default when the caller
 * does not supply their own filters.
 */
export const DEFAULT_FILTERS = buildUsbFilters(Object.values(DEVICES));

/**
 * Show the browser's USB picker and wrap the selected device.
 *
 * Requires a user gesture (click, keypress). Opens the device and claims
 * interface 0 via `WebUsbTransport.fromDevice`.
 */
export async function requestPrinter(options: RequestOptions = {}): Promise<WebDymoPrinter> {
  const filters = options.filters ?? DEFAULT_FILTERS;
  const usbDevice = await navigator.usb.requestDevice({ filters });
  return fromUSBDevice(usbDevice);
}

/**
 * Wrap an already-selected `USBDevice` (e.g. from
 * `navigator.usb.getDevices()` for previously paired devices).
 *
 * @throws if the USB device's VID/PID does not match any supported
 *   LabelManager in the device registry.
 */
export async function fromUSBDevice(usbDevice: USBDevice): Promise<WebDymoPrinter> {
  const descriptor = findDevice(usbDevice.vendorId, usbDevice.productId);
  if (!descriptor) {
    throw new Error('Unsupported USB device for DYMO LabelManager protocol.');
  }
  const transport = await WebUsbTransport.fromDevice(usbDevice);
  return new WebDymoPrinter(descriptor, transport);
}
