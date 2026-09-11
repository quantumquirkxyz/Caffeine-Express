export const MODALITIES = [
  'MRI',
  'CT',
  'Ultrasound',
  'X-Ray',
  'Patient Monitoring',
  'Image Guided Therapy',
  'Other',
] as const;

export type Modality = (typeof MODALITIES)[number];

const ALIASES: Record<string, Modality> = {
  mr: 'MRI',
  mri: 'MRI',
  'magnetic resonance': 'MRI',
  'magnetic resonance imaging': 'MRI',
  ct: 'CT',
  scanner: 'CT',
  'ct scanner': 'CT',
  ultrasound: 'Ultrasound',
  us: 'Ultrasound',
  'ultrasonography': 'Ultrasound',
  'tomógrafo': 'CT',
  'tomografo': 'CT',
  'tomógrafos': 'CT',
  'tomografos': 'CT',
  'ecógrafo': 'Ultrasound',
  'ecografo': 'Ultrasound',
  'ecógrafos': 'Ultrasound',
  'ecografos': 'Ultrasound',
  ultrasonido: 'Ultrasound',
  ultrasonidos: 'Ultrasound',
  'rayos x': 'X-Ray',
  'x-ray': 'X-Ray',
  xray: 'X-Ray',
  radiography: 'X-Ray',
  'patient monitoring': 'Patient Monitoring',
  monitoring: 'Patient Monitoring',
  'image guided therapy': 'Image Guided Therapy',
  igt: 'Image Guided Therapy',
  other: 'Other',
};

const CANONICAL: ReadonlySet<string> = new Set<string>(MODALITIES);

export function isModality(value: unknown): value is Modality {
  return typeof value === 'string' && CANONICAL.has(value);
}

export function normalizeModality(value: string): Modality | null {
  const exact = value.trim();
  if (CANONICAL.has(exact)) {
    return exact as Modality;
  }
  return ALIASES[exact.toLowerCase()] ?? null;
}
