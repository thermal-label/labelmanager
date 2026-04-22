export type { LabelBitmap, RawImageData } from '@mbtech-nl/bitmap';
export { renderImage, renderText } from '@mbtech-nl/bitmap';

export { DEVICES, findDevice } from './devices.js';
export {
  buildBitmapRows,
  buildFormFeed,
  buildPrinterStream,
  buildResetSequence,
  encodeLabel,
} from './protocol.js';
export type { DeviceDescriptor, PrintOptions, TapeWidth } from './types.js';
