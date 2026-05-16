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
import { MediaNotSpecifiedError, WriteSerializer } from '@thermal-label/contracts';

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
  /**
   * Serialises every transport-touching method (`print` + `getStatus`)
   * so concurrent callers can't interleave a status `write()` into an
   * in-flight raster stream. Node ships no `onStatus` poll today, but
   * any consumer that calls `getStatus()` during `print()` hits the
   * same hazard — wrapped for uniformity with the web driver. See
   * `WriteSerializer` in `@thermal-label/contracts`.
   */
  private readonly serializer = new WriteSerializer();

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

  print(
    image: RawImageData,
    media?: MediaDescriptor,
    options?: LabelManagerPrintOptions,
  ): Promise<void> {
    // Whole-method wrap (plan 15 A3) — uniform with the web driver.
    return this.serializer.run(() => this.doPrint(image, media, options));
  }

  private async doPrint(
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
    const [engine] = this.device.engines;
    if (!engine) {
      // Registry invariant — every device entry carries at least one
      // engine. Guard so the encoder call below stays type-safe.
      throw new Error(`Device ${this.device.key} has no print engines`);
    }
    const stream = buildPrinterStream(bitmap, engine, options ?? {}, resolvedMedia);
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

  getStatus(): Promise<PrinterStatus> {
    // Serialised against `print()` — see the `serializer` field doc.
    return this.serializer.run(() => this.doGetStatus());
  }

  private async doGetStatus(): Promise<PrinterStatus> {
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
