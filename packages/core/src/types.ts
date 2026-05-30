import type { DeviceEntry, PrintOptions } from '@thermal-label/contracts';
import type { D1Media, D1PrintOptions } from '@thermal-label/d1-core';

export type TapeWidth = 6 | 9 | 12 | 19;

/**
 * DYMO LabelManager device entry.
 *
 * Alias for the contracts `DeviceEntry` shape, narrowed to
 * `family: 'labelmanager'`. The driver-side registry adds no
 * LabelManager-specific top-level fields today — every previously
 * driver-only field folds into the contracts shape: tape compatibility
 * lives on `engines[].mediaCompatibility` + `MediaDescriptor.targetModels`,
 * and the old `experimental?` flag collapses into `support.status`.
 */
export type LabelManagerDevice = DeviceEntry & { family: 'labelmanager' };

/**
 * DYMO LabelManager media descriptor.
 *
 * `D1Media` from `@thermal-label/d1-core` already carries every field
 * this driver needs (`printableDots`, `bytesPerLine`, `tapeWidthMm`,
 * `text`, `background`, `material`). This interface adds no fields of
 * its own — it only narrows the shared shape to the LabelManager
 * chassis: `type` fixed to `'tape'`, `tapeWidthMm` to the supported
 * widths, and `printableDots` / `bytesPerLine` made required (the
 * encoder always sizes the raster from them on catalogued media).
 */
export interface LabelManagerMedia extends D1Media {
  type: 'tape';
  tapeWidthMm: TapeWidth;
  printableDots: number;
  bytesPerLine: number;
}

/**
 * Protocol-internal print options.
 *
 * Extends the cross-driver `PrintOptions` and the D1 shared shape
 * (`D1PrintOptions` — `copies`, `tapeType`) with LabelManager-specific
 * `tapeWidth` (informational; the encoder reads `media.printableDots`),
 * `density` narrowed to printer-supported values, and `rotate` to
 * override the orientation heuristic — `'auto'` (default) defers to
 * the media's `defaultOrientation`; an explicit angle bypasses it.
 *
 * `tapeType` is the `ESC C` selector (0..12), inherited from
 * `D1PrintOptions`. Host-declared (LabelManager firmware cannot
 * detect cartridge type); normally derived from the user-selected
 * media's `text` / `background` via `tapeTypeFor()` and not passed by
 * the caller. Override only when bench-testing a specific selector.
 */
export interface LabelManagerPrintOptions extends PrintOptions, D1PrintOptions {
  density?: 'normal' | 'high';
  tapeWidth?: TapeWidth;
  rotate?: 'auto' | 0 | 90 | 180 | 270;
}
