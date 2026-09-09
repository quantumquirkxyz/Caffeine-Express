import { describe, expect, it } from 'vitest';
import { isModality, MODALITIES, normalizeModality } from './modality';

describe('modality vocabulary', () => {
  it('exposes the canonical controlled vocabulary plus Other', () => {
    expect(MODALITIES).toEqual([
      'MRI',
      'CT',
      'Ultrasound',
      'X-Ray',
      'Patient Monitoring',
      'Image Guided Therapy',
      'Other',
    ]);
  });

  it('isModality accepts only canonical terms', () => {
    for (const modality of MODALITIES) {
      expect(isModality(modality)).toBe(true);
    }
    expect(isModality('MR')).toBe(false);
    expect(isModality('Scanner')).toBe(false);
    expect(isModality(42)).toBe(false);
  });

  it('normalizes MR alias to canonical MRI', () => {
    expect(normalizeModality('MR')).toBe('MRI');
  });

  it('normalizes case and whitespace', () => {
    expect(normalizeModality('mri')).toBe('MRI');
    expect(normalizeModality('  Ct ')).toBe('CT');
    expect(normalizeModality('US')).toBe('Ultrasound');
    expect(normalizeModality('ultrasound')).toBe('Ultrasound');
    expect(normalizeModality('x-ray')).toBe('X-Ray');
    expect(normalizeModality('Patient Monitoring')).toBe('Patient Monitoring');
  });

  it('passes canonical terms through unchanged', () => {
    expect(normalizeModality('MRI')).toBe('MRI');
    expect(normalizeModality('CT')).toBe('CT');
    expect(normalizeModality('Other')).toBe('Other');
  });

  it('rejects terms outside the vocabulary instead of inventing one', () => {
    expect(normalizeModality('spectrograph')).toBeNull();
    expect(normalizeModality('')).toBeNull();
    expect(normalizeModality('   ')).toBeNull();
  });
});