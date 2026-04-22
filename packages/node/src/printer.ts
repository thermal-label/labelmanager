import {
  buildPrinterStream,
  renderImage,
  renderText,
  type DeviceDescriptor,
  type RawImageData,
} from '@thermal-label/labelmanager-core';
import { readFile } from 'node:fs/promises';
/* eslint-disable import-x/consistent-type-specifier-style */
import type { ImagePrintOptions, PrinterStatus, TextPrintOptions } from './types.js';

const WRITE_DELAY_MS = 5;
const CHUNK_SIZE = 64;

export interface PrinterTransport {
  write(data: Buffer): Promise<void>;
  read(length: number): Promise<Buffer>;
  close(): void;
}

async function sleep(ms: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, ms));
}

async function decodeImageBuffer(buffer: Buffer): Promise<RawImageData> {
  const maybeCanvas = await import('@napi-rs/canvas').catch(() => null);

  if (!maybeCanvas) {
    throw new Error(
      'Image decoding requires optional dependency @napi-rs/canvas. Pass pre-decoded RawImageData if unavailable.',
    );
  }

  const image = await maybeCanvas.loadImage(buffer);
  const canvas = maybeCanvas.createCanvas(image.width, image.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0);
  const imageData = ctx.getImageData(0, 0, image.width, image.height);

  return {
    width: image.width,
    height: image.height,
    data: Uint8Array.from(imageData.data),
  };
}

export class DymoPrinter {
  public readonly device: DeviceDescriptor;
  private readonly transport: PrinterTransport | undefined;

  public constructor(device: DeviceDescriptor, transport?: PrinterTransport) {
    this.device = device;
    this.transport = transport;
  }

  private async writeStream(data: Uint8Array): Promise<void> {
    if (!this.transport) {
      throw new Error('Printer is not connected.');
    }

    for (let offset = 0; offset < data.length; offset += CHUNK_SIZE) {
      const chunk = Buffer.from(
        data.buffer,
        data.byteOffset + offset,
        Math.min(CHUNK_SIZE, data.length - offset),
      );
      await this.transport.write(chunk);
      await sleep(WRITE_DELAY_MS);
    }
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
    await this.writeStream(stream);
  }

  /**
   * Print an image from a path, encoded buffer, or pre-decoded raw pixels.
   *
   * @param image Image input.
   * @param options Print options.
   */
  public async printImage(
    image: Buffer | string | RawImageData,
    options: ImagePrintOptions = {},
  ): Promise<void> {
    let raw: RawImageData;
    if (typeof image === 'string') {
      const file = await readFile(image);
      raw = await decodeImageBuffer(file);
    } else if (Buffer.isBuffer(image)) {
      raw = await decodeImageBuffer(image);
    } else {
      raw = image;
    }

    const bitmap = renderImage(raw, {
      ...(options.invert === undefined ? {} : { invert: options.invert }),
      ...(options.dither === undefined ? {} : { dither: options.dither }),
      ...(options.threshold === undefined ? {} : { threshold: options.threshold }),
    });
    const stream = buildPrinterStream(bitmap, options);
    await this.writeStream(stream);
  }

  /**
   * Read printer status flags.
   *
   * @returns Parsed status booleans.
   */
  public async getStatus(): Promise<PrinterStatus> {
    if (!this.transport) {
      throw new Error('Printer is not connected.');
    }

    await this.transport.write(Buffer.from([0x1b, 0x41]));
    const response = await this.transport.read(64);
    const status = response[0] ?? 0;

    return {
      ready: (status & 0b00000001) === 0,
      tapeInserted: (status & 0b00000010) === 0,
      labelLow: (status & 0b00000100) !== 0,
    };
  }

  /**
   * Close the printer transport if present.
   */
  public close(): void {
    this.transport?.close();
  }
}
