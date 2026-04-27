export type { LabelBitmap, PaletteEntry, RawImageData } from '@mbtech-nl/bitmap';
export { renderImage, renderText } from '@mbtech-nl/bitmap';

export type {
  DeviceDescriptor,
  MediaDescriptor,
  PreviewOptions,
  PreviewPlane,
  PreviewResult,
  PrintOptions,
  PrinterAdapter,
  PrinterError,
  PrinterStatus,
  RotateDirection,
  Transport,
  TransportType,
} from '@thermal-label/contracts';

export { MediaNotSpecifiedError, pickRotation } from '@thermal-label/contracts';

export { DEVICES, findDevice } from './devices.js';
export { DEFAULT_MEDIA, MEDIA, findMediaByTapeWidth } from './media.js';
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
  LabelManagerMedia,
  LabelManagerPrintOptions,
  TapeWidth,
} from './types.js';
