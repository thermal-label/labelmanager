import type { DeviceEntry, MediaDescriptor, PrintOptions } from '@thermal-label/contracts';

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
 */
export type LabelManagerMaterial =
  | 'standard'
  | 'permanent-polyester'
  | 'flexible-nylon'
  | 'durable';

/**
 * DYMO LabelManager media descriptor.
 *
 * Extends the contracts base `MediaDescriptor`. Tape is always
 * continuous — `heightMm` is omitted. `type` is the literal string
 * `'tape'` for structural matching. All LabelManager media is
 * single-ink, so the base `palette` field is left undefined; the
 * cartridge's printed colour and substrate colour live on the
 * driver-side `text` and `background` fields below.
 */
export interface LabelManagerMedia extends MediaDescriptor {
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
 * Extends the cross-driver `PrintOptions` with LabelManager-specific
 * `tapeWidth` — the protocol encoder needs it to pick the right
 * `ESC D N` byte-per-line setting. `density` is narrowed to the
 * values the printer supports. `rotate` overrides the orientation
 * heuristic — `'auto'` (default) defers to the media's
 * `defaultOrientation`; an explicit angle bypasses it.
 */
export interface LabelManagerPrintOptions extends PrintOptions {
  density?: 'normal' | 'high';
  tapeWidth?: TapeWidth;
  rotate?: 'auto' | 0 | 90 | 180 | 270;
}
