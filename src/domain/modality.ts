import { z } from "zod";

const MODALITY_CANONICAL = [
  "MRI",
  "CT",
  "Ultrasound",
  "X-ray",
  "Mammography",
  "PET",
  "SPECT",
  "Fluoroscopy",
  "Nuclear Medicine",
  "Other",
] as const;

const MODALITY_ALIASES: Record<string, (typeof MODALITY_CANONICAL)[number]> = {
  mr: "MRI",
  "mri": "MRI",
  "mr scanner": "MRI",
  "mri scanner": "MRI",
  ct: "CT",
  "ct scanner": "CT",
  "cat scan": "CT",
  "cat": "CT",
  ultrasound: "Ultrasound",
  us: "Ultrasound",
  "x ray": "X-ray",
  "x-ray": "X-ray",
  radiography: "X-ray",
  mammography: "Mammography",
  mammo: "Mammography",
  pet: "PET",
  "pet scan": "PET",
  spect: "SPECT",
  fluoroscopy: "Fluoroscopy",
  "fluoro": "Fluoroscopy",
  "nuclear medicine": "Nuclear Medicine",
  nm: "Nuclear Medicine",
};

export const Modality = z.enum(MODALITY_CANONICAL);
export type Modality = z.infer<typeof Modality>;

export function resolveModality(raw: string): Modality {
  const normalised = raw.trim().toLowerCase();
  const alias = MODALITY_ALIASES[normalised];
  if (alias) return alias;
  if (MODALITY_CANONICAL.includes(raw as (typeof MODALITY_CANONICAL)[number])) {
    return raw as Modality;
  }
  return "Other";
}
