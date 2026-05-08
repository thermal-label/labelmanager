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
 *
 * `tapeType` is the `ESC C` selector (0..12) — host-declared, since
 * LabelManager firmware cannot detect cartridge type. Normally
 * derived from the user-selected media's `text` / `background` via
 * `tapeTypeFor()` and not passed by the caller; defaults to `0` when
 * neither this option nor a media descriptor is supplied. Override
 * here only when bench-testing a specific selector.
 */
export interface LabelManagerPrintOptions extends PrintOptions {
  density?: 'normal' | 'high';
  tapeWidth?: TapeWidth;
  tapeType?: number;
  rotate?: 'auto' | 0 | 90 | 180 | 270;
}
