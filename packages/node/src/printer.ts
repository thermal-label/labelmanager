import { encodeLabel, renderImage, renderText, type DeviceDescriptor, type RawImageData } from "@thermal-label/labelmanager-core";
import { readFile } from "node:fs/promises";
/* eslint-disable import-x/consistent-type-specifier-style */
import type { ImagePrintOptions, PrinterStatus, TextPrintOptions } from "./types.js";

const WRITE_DELAY_MS = 5;
const STATUS_QUERY = new Uint8Array([0x1b, 0x41]);

interface HidAsyncLike {
  write(data: number[] | Uint8Array): Promise<number>;
  readTimeout(timeout: number): Promise<number[]>;
  close(): void;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function decodeImageBuffer(buffer: Buffer): Promise<RawImageData> {
  const maybeCanvas = await import("@napi-rs/canvas").catch(() => null);

  if (!maybeCanvas) {
    throw new Error(
      "Image decoding requires optional dependency @napi-rs/canvas. Pass pre-decoded RawImageData if unavailable."
    );
  }

  const image = await maybeCanvas.loadImage(buffer);
  const canvas = maybeCanvas.createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);
  const imageData = ctx.getImageData(0, 0, image.width, image.height);

  return {
    width: image.width,
    height: image.height,
    data: Uint8Array.from(imageData.data)
  };
}

export class DymoPrinter {
  public readonly device: DeviceDescriptor;
  private readonly hid: HidAsyncLike | undefined;

  public constructor(device: DeviceDescriptor, hid?: HidAsyncLike) {
    this.device = device;
    this.hid = hid;
  }

  private async writeReports(reports: Uint8Array[]): Promise<void> {
    if (!this.hid) {
      throw new Error("Printer is not connected.");
    }

    for (const report of reports) {
      await this.hid.write(report);
      await sleep(WRITE_DELAY_MS);
    }
  }

  public async printText(text: string, options: TextPrintOptions = {}): Promise<void> {
    const bitmap = renderText(text, options.invert === undefined ? {} : { invert: options.invert });
    const reports = encodeLabel(bitmap, options);
    await this.writeReports(reports);
  }

  public async printImage(image: Buffer | string | RawImageData, options: ImagePrintOptions = {}): Promise<void> {
    let raw: RawImageData;
    if (typeof image === "string") {
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
      ...(options.threshold === undefined ? {} : { threshold: options.threshold })
    });
    const reports = encodeLabel(bitmap, options);
    await this.writeReports(reports);
  }

  public async getStatus(): Promise<PrinterStatus> {
    if (!this.hid) {
      throw new Error("Printer is not connected.");
    }

    await this.hid.write(STATUS_QUERY);
    const response = await this.hid.readTimeout(200);
    const status = response[0] ?? 0;

    return {
      ready: (status & 0b00000001) === 0,
      tapeInserted: (status & 0b00000010) === 0,
      labelLow: (status & 0b00000100) !== 0
    };
  }

  public close(): void {
    this.hid?.close();
  }
}
