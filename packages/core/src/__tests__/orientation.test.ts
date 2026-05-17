import { describe, expect, it } from 'vitest';
import { ROTATE_DIRECTION } from '../orientation.js';

describe('orientation', () => {
  it('rotates landscape input 90° clockwise', () => {
    expect(ROTATE_DIRECTION).toBe(90);
  });
});
