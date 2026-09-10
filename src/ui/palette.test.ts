import { describe, expect, it } from 'vitest';
import { darkColors, lightColors } from './palette';

describe('theme palettes', () => {
  it('define the same color tokens for light and dark modes', () => {
    expect(Object.keys(darkColors).sort()).toEqual(Object.keys(lightColors).sort());
    expect(darkColors.background).not.toBe(lightColors.background);
    expect(darkColors.surface).not.toBe(lightColors.surface);
  });
});
