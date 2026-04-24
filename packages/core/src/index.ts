export type { LabelBitmap, RawImageData } from '@mbtech-nl/bitmap';
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
  Transport,
  TransportType,
} from '@thermal-label/contracts';

export { MediaNotSpecifiedError } from '@thermal-label/contracts';

export { DEVICES, findDevice } from './devices.js';
export { DEFAULT_MEDIA, MEDIA, findMediaByTapeWidth } from './media.js';
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
