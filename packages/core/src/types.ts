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
 * D1 cartridge substrate family. Picker / preview UX hint — the
 * rasterizer does not branch on this.
 *
 * The `rhino-*` values cover DYMO's industrial Rhino™ cartridge line.
 * Rhino cartridges are mechanically the same shape as D1 and physically
 * fit LabelManager chassis; DYMO does not officially endorse the
 * cross-use, and the stiffer industrial substrates (especially
 * heat-shrink polyolefin and durable polyester) accelerate cutter blade
 * and motor wear over time. Use at your own risk — see HARDWARE.md.
 */
export type LabelManagerMaterial =
  | 'standard'
  | 'permanent-polyester'
  | 'flexible-nylon'
  | 'durable'
  | 'rhino-vinyl'
  | 'rhino-permanent-polyester'
  | 'rhino-flexible-nylon'
  | 'rhino-heat-shrink'
  | 'rhino-non-adhesive-tag'
  | 'rhino-self-laminating';

/**
 * DYMO LabelManager media descriptor.
 *
 * Extends `D1Media` from `@thermal-label/d1-core` (the shared D1 tape
 * shape — `printableDots`, `text`, `background` consumed by the
 * encoder + tape-type selector) with LabelManager-specific narrowing:
 * `type` is fixed to `'tape'`, `tapeWidthMm` is narrowed to the
 * supported widths, and `material` carries the D1 substrate family
 * for picker UX.
 */
export interface LabelManagerMedia extends D1Media {
  type: 'tape';
  tapeWidthMm: TapeWidth;
  printableDots: number;
  bytesPerLine: number;
  /** D1 substrate family. */
  material?: LabelManagerMaterial;
  /** Printed ink colour, named (the only ink the cartridge carries). */
  text?: string;
  /** Substrate colour, named. */
  background?: string;
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
