import type { DeviceDescriptor, MediaDescriptor, PrintOptions } from '@thermal-label/contracts';

export type TapeWidth = 6 | 9 | 12 | 19;

/**
 * DYMO LabelManager device descriptor.
 *
 * Extends the contracts base `DeviceDescriptor` with LabelManager-specific
 * fields (supported tape widths and an `experimental` flag).
 */
export interface LabelManagerDevice extends DeviceDescriptor {
  family: 'labelmanager';
  vid: number;
  pid: number;
  supportedTapes: TapeWidth[];
  experimental?: boolean;
}

/**
 * DYMO LabelManager media descriptor.
 *
 * Extends the contracts base `MediaDescriptor`. Tape is always
 * continuous — `heightMm` is omitted. `type` is the literal string
 * `'tape'` for structural matching. All LabelManager media is
 * single-ink, so the base `palette` field is left undefined.
 */
export interface LabelManagerMedia extends MediaDescriptor {
  type: 'tape';
  tapeWidthMm: TapeWidth;
  printableDots: number;
  bytesPerLine: number;
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
