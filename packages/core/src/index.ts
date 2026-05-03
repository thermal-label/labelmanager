export type { LabelBitmap, PaletteEntry, RawImageData } from '@mbtech-nl/bitmap';
export { renderImage, renderText } from '@mbtech-nl/bitmap';

export type {
  DeviceEntry,
  DeviceRegistry,
  DeviceSupport,
  MediaDescriptor,
  PreviewOptions,
  PreviewPlane,
  PreviewResult,
  PrintEngine,
  PrintOptions,
  PrinterAdapter,
  PrinterError,
  PrinterStatus,
  RotateDirection,
  SupportStatus,
  Transport,
  TransportType,
} from '@thermal-label/contracts';

export { MediaNotSpecifiedError, pickRotation } from '@thermal-label/contracts';

export { DEVICE_REGISTRY_DATA, DEVICES, findDevice } from './devices.js';

/**
 * Protocols this core's encoder produces correct wire bytes for.
 * Pair with `DEVICE_REGISTRY_DATA` and pass to
 * `resolveSupportedDevices` from `@thermal-label/contracts` to filter
 * a device list down to what this runtime can actually drive.
 */
export const PROTOCOLS: ReadonlySet<string> = new Set(['d1-tape']);
export {
  DEFAULT_MEDIA,
  MEDIA,
  MEDIA_LIST,
  TAPE_6MM,
  TAPE_9MM,
  TAPE_12MM,
  TAPE_19MM,
  findMediaByTapeWidth,
} from './media.js';
export { ROTATE_DIRECTION } from './orientation.js';
export {
  buildBitmapRows,
  buildFormFeed,
  buildPrinterStream,
  buildResetSequence,
  encodeLabel,
} from './protocol.js';
export { STATUS_REQUEST, parseStatus } from './status.js';
export { createPreviewOffline } from './preview.js';
export type {
  LabelManagerDevice,
  LabelManagerMaterial,
  LabelManagerMedia,
  LabelManagerPrintOptions,
  TapeWidth,
} from './types.js';
