import {
  buildPrinterStream,
  renderImage,
  DEFAULT_MEDIA,
  ROTATE_DIRECTION,
  STATUS_REQUEST,
  parseStatus,
  pickRotation,
  createPreviewOffline,
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

const WRITE_DELAY_MS = 5;
const CHUNK_SIZE = 64;

async function sleep(ms: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Node.js USB driver for DYMO LabelManager printers.
 *
 * Implements the shared `PrinterAdapter` interface from
 * `@thermal-label/contracts`. The caller supplies a `Transport` — in
 * production this is typically `UsbTransport` from
 * `@thermal-label/transport/node`, obtained via the `discovery`
 * singleton exported by this package.
 *
 * Orientation is auto-decided via `pickRotation`: every tape entry
 * carries `defaultOrientation: 'horizontal'`, so the driver rotates
 * landscape input 90° CW (matches the long-standing pre-retrofit
 * unconditional rotate). Override per-call with `options.rotate`.
 */
export class DymoPrinter implements PrinterAdapter {
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

    const rotate = pickRotation(image, resolvedMedia, ROTATE_DIRECTION, options?.rotate);
    const bitmap = renderImage(image, { dither: true, rotate });
    const stream = buildPrinterStream(bitmap, {
      ...options,
      tapeWidth: resolvedMedia.tapeWidthMm,
    });
    await this.writeStream(stream);
  }

  createPreview(image: RawImageData, options?: PreviewOptions): Promise<PreviewResult> {
    const override = options?.media as LabelManagerMedia | undefined;
    const detected = this.lastStatus?.detectedMedia as LabelManagerMedia | undefined;
    if (override) {
      return Promise.resolve(createPreviewOffline(image, override));
    }
    if (detected) {
      return Promise.resolve(createPreviewOffline(image, detected));
    }
    return Promise.resolve({
      ...createPreviewOffline(image, DEFAULT_MEDIA),
      assumed: true,
    });
  }

  async getStatus(): Promise<PrinterStatus> {
    await this.transport.write(STATUS_REQUEST);
    const response = await this.transport.read(64);
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
      await sleep(WRITE_DELAY_MS);
    }
  }
}
