/* eslint-disable import-x/consistent-type-specifier-style */
import type {
  DeviceDescriptor,
  PrintOptions,
  RawImageData
} from "@thermal-label/labelmanager-core";

export interface OpenOptions {
  vid?: number;
  pid?: number;
  serialNumber?: string;
}

export interface PrinterInfo {
  device: DeviceDescriptor;
  serialNumber: string | undefined;
  path: string;
}

export interface PrinterStatus {
  ready: boolean;
  tapeInserted: boolean;
  labelLow: boolean;
}

export interface TextPrintOptions extends PrintOptions {
  tapeWidth?: 6 | 9 | 12 | 19;
  invert?: boolean;
}

export interface ImagePrintOptions extends PrintOptions {
  tapeWidth?: 6 | 9 | 12 | 19;
  invert?: boolean;
  dither?: boolean;
  threshold?: number;
}

export interface DecodedImage {
  image: RawImageData;
}
