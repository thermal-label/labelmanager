import type { RotateDirection } from '@thermal-label/contracts';

/**
 * Direction the LabelManager print head rotates landscape input.
 *
 * `90` = clockwise. Matches the pre-retrofit hard-coded
 * `rotateBitmap(padded, 90)` in `protocol.ts`, which is now driven by
 * `pickRotation` instead. Verify on hardware with a die-cut "F"
 * landscape print if anything changes here.
 */
export const ROTATE_DIRECTION: RotateDirection = 90;
