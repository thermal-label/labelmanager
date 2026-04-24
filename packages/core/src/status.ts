/* eslint-disable import-x/consistent-type-specifier-style */
import type { PrinterError, PrinterStatus } from '@thermal-label/contracts';

/**
 * The single-byte status request recognised by all supported LabelManager
 * printers (`ESC A`).
 */
export const STATUS_REQUEST = new Uint8Array([0x1b, 0x41]);

/**
 * Parse a raw status response into the contracts `PrinterStatus` shape.
 *
 * LabelManager returns a single status byte:
 * - bit 0 set → printer busy / not ready
 * - bit 1 set → no tape inserted
 * - bit 2 set → tape supply low
 *
 * `detectedMedia` is always `undefined` — LabelManager has no way to
 * report tape width. Callers must always pass media explicitly to
 * `DymoPrinter.print()` / `createPreview()`.
 */
export function parseStatus(bytes: Uint8Array): PrinterStatus {
  const status = bytes[0] ?? 0;
  const ready = (status & 0b00000001) === 0;
  const tapeInserted = (status & 0b00000010) === 0;
  const labelLow = (status & 0b00000100) !== 0;

  const errors: PrinterError[] = [];
  if (!ready) errors.push({ code: 'not_ready', message: 'Printer busy' });
  if (!tapeInserted) errors.push({ code: 'no_media', message: 'No tape inserted' });
  if (labelLow) errors.push({ code: 'low_media', message: 'Tape supply low' });

  return {
    ready,
    mediaLoaded: tapeInserted,
    errors,
    rawBytes: bytes,
  };
}
