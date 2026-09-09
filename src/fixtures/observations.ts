import type { z } from "zod";
import type { Observation } from "../domain/observation.js";

export const DEMO_CLIENTS = [
  {
    name: "Meridian Health Partners",
    sites: [
      {
        id: "site-meridian-central",
        name: "Meridian Central Hospital",
        city: "Cartagena",
        country: "Colombia",
      },
      {
        id: "site-meridian-norte",
        name: "Meridian Norte Clinic",
        city: "Barranquilla",
        country: "Colombia",
      },
    ],
  },
  {
    name: "SolVida Clinics",
    sites: [
      {
        id: "site-solvida-panama",
        name: "SolVida Panama Pacific",
        city: "Panama City",
        country: "Panama",
      },
    ],
  },
] as const;

export type FixtureClient = (typeof DEMO_CLIENTS)[number];
export type FixtureSite = FixtureClient["sites"][number];

const OBS_001_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
const OBS_002_ID = "b2c3d4e5-f6a7-8901-bcde-f12345678901";
const OBS_003_ID = "c3d4e5f6-a7b8-9012-cdef-123456789012";
const OBS_004_ID = "d4e5f6a7-b8c9-0123-defa-234567890123";
const OBS_005_ID = "e5f6a7b8-c9d0-1234-efab-345678901234";

export const FIXTURE_OBSERVATIONS: z.infer<typeof Observation>[] = [
  {
    id: OBS_001_ID,
    createdAt: "2026-09-08T14:30:00Z",
    clientName: "Meridian Health Partners",
    siteId: "site-meridian-central",
    siteName: "Meridian Central Hospital",
    city: "Cartagena",
    country: "Colombia",
    modality: "MRI",
    brand: { value: "NovaMed", provenance: "Reported" },
    model: { value: "UltraScan 3T", provenance: "Reported" },
    quantity: 2,
    age: { min: 6, max: 8 },
    use: { hours: 12400 },
    comment: "Both units in radiology wing, well-maintained",
    fieldNote:
      "At Meridian Central in Cartagena. Two NovaMed UltraScan 3T MRI machines, about 6 to 8 years old, roughly 12,000 hours each. Both in the radiology wing.",
  },
  {
    id: OBS_002_ID,
    createdAt: "2026-09-08T15:45:00Z",
    clientName: "Meridian Health Partners",
    siteId: "site-meridian-central",
    siteName: "Meridian Central Hospital",
    city: "Cartagena",
    country: "Colombia",
    modality: "CT",
    brand: { value: "Celeris", provenance: "Reported" },
    model: { value: "SpeedCT 128", provenance: "Reported" },
    quantity: 1,
    age: "Unknown",
    fieldNote:
      "One Celeris SpeedCT 128 scanner in the emergency department. Not sure how old it is.",
  },
  {
    id: OBS_003_ID,
    createdAt: "2026-09-08T16:20:00Z",
    clientName: "Meridian Health Partners",
    siteId: "site-meridian-norte",
    siteName: "Meridian Norte Clinic",
    city: "Barranquilla",
    country: "Colombia",
    modality: "Ultrasound",
    brand: { value: "Sonora", provenance: "Estimated" },
    model: { value: "ClearView Pro", provenance: "Estimated" },
    quantity: 3,
    age: { min: 2, max: 4 },
    use: { hours: 5600 },
    fieldNote:
      "Three ultrasound machines at the Norte clinic. Look like Sonora ClearView Pro, maybe 2 to 4 years old. Used about 5,000 to 6,000 hours.",
  },
  {
    id: OBS_004_ID,
    createdAt: "2026-09-09T09:00:00Z",
    clientName: "SolVida Clinics",
    siteId: "site-solvida-panama",
    siteName: "SolVida Panama Pacific",
    city: "Panama City",
    country: "Panama",
    modality: "X-ray",
    brand: { value: "RayCore", provenance: "Reported" },
    model: { value: "DigitalRad 500", provenance: "Reported" },
    quantity: 1,
    age: { min: 10, max: 12 },
    use: { hours: 22000, period: { start: "2024-01-01" } },
    comment: "Primary unit for general radiology, planning replacement",
    fieldNote:
      "At SolVida Panama Pacific. One RayCore DigitalRad 500 X-ray, installed around 2014 to 2016. Heavy use, over 20,000 hours since January 2024. They want to replace it.",
  },
  {
    id: OBS_005_ID,
    createdAt: "2026-09-09T10:15:00Z",
    clientName: "SolVida Clinics",
    siteId: "site-solvida-panama",
    siteName: "SolVida Panama Pacific",
    city: "Panama City",
    country: "Panama",
    modality: "Mammography",
    brand: { value: "LuminaMed", provenance: "Reported" },
    model: { value: "MammoSmart 3D", provenance: "Reported" },
    quantity: 1,
    age: { min: 3, max: 5 },
    fieldNote:
      "One LuminaMed MammoSmart 3D mammography unit. Pretty new, maybe 3 to 5 years old.",
  },
];
