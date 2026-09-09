import { z } from 'zod';
import type { AgeRange } from '../domain/age';
import { normalizeModality, type Modality } from '../domain/modality';
import type { Provenance } from '../domain/provenance';
import type { Observation } from '../domain/observation';

const provenanceSchema = z.enum([
  'Confirmed',
  'Reported',
  'Estimated',
  'Unknown',
]);

const siteSchema = z.object({
  client: z.object({
    name: z.string().trim().min(1, 'Client name is required'),
  }),
  name: z.string().trim().min(1, 'Site name is required'),
  city: z.string().trim().min(1, 'City is required'),
  country: z.string().trim().min(1, 'Country is required'),
});

const ageRangeSchema = z
  .object({
    min: z.number().finite('Age min must be a finite number').min(0, 'Age min must be non-negative'),
    max: z.number().finite('Age max must be a finite number').min(0, 'Age max must be non-negative'),
  })
  .refine((range) => range.min <= range.max, {
    message: 'Age range is reversed: min must be <= max',
    path: ['age'],
  });

const periodSchema = z.object({
  start: z.coerce.date(),
  end: z.coerce.date(),
});

const useSchema = z
  .object({
    hours: z.number().finite('Use hours must be a finite number').min(0, 'Use hours must be non-negative'),
    period: periodSchema.nullable().optional(),
  })
  .refine((use) => {
    if (use.period === null || use.period === undefined) {
      return true;
    }
    return use.period.start.getTime() <= use.period.end.getTime();
  }, {
    message: 'Use period is reversed: start must be <= end',
    path: ['use', 'period'],
  });

const modalitySchema = z
  .string()
  .transform(normalizeModality)
  .refine((modality): modality is Modality => modality !== null, {
    message:
      'Modality is not a recognized canonical term or alias; no value is invented',
  });

const observationInputSchema = z.object({
  site: siteSchema,
  modality: modalitySchema,
  modalityProvenance: provenanceSchema,
  brand: z.string().trim().min(1, 'Brand cannot be empty').nullable().optional(),
  brandProvenance: provenanceSchema.optional(),
  model: z.string().trim().min(1, 'Model cannot be empty').nullable().optional(),
  modelProvenance: provenanceSchema.optional(),
  quantity: z
    .number()
    .int('Quantity must be a whole number')
    .positive('Quantity must be a positive count'),
  quantityProvenance: provenanceSchema,
  age: ageRangeSchema.nullable().optional(),
  ageProvenance: provenanceSchema.optional(),
  use: useSchema.nullable().optional(),
  useProvenance: provenanceSchema.nullable().optional(),
  comment: z.string().trim().nullable().optional(),
  fieldNote: z.string().trim().nullable().optional(),
  collaborator: z.string().trim().nullable().optional(),
  visitDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Visit date must be YYYY-MM-DD'),
});

export interface ObservationInput {
  readonly site: {
    readonly client: { readonly name: string };
    readonly name: string;
    readonly city: string;
    readonly country: string;
  };
  readonly modality: string;
  readonly modalityProvenance: Provenance;
  readonly brand?: string | null;
  readonly brandProvenance?: Provenance;
  readonly model?: string | null;
  readonly modelProvenance?: Provenance;
  readonly quantity: number;
  readonly quantityProvenance: Provenance;
  readonly age?: AgeRange | null;
  readonly ageProvenance?: Provenance;
  readonly use?: {
    readonly hours: number;
    readonly period?: { readonly start: Date; readonly end: Date } | null;
  } | null;
  readonly useProvenance?: Provenance | null;
  readonly comment?: string | null;
  readonly fieldNote?: string | null;
  readonly collaborator?: string | null;
  readonly visitDate: string;
}

export interface CreateObservationOptions {
  readonly id?: string;
  readonly now?: Date;
}

export type ObservationParseResult =
  | { readonly ok: true; readonly observation: Observation }
  | { readonly ok: false; readonly issues: z.ZodIssue[] };

export class ObservationValidationError extends Error {
  readonly issues: z.ZodIssue[];

  constructor(issues: z.ZodIssue[]) {
    super(`Observation failed validation: ${issues.map((i) => i.message).join('; ')}`);
    this.name = 'ObservationValidationError';
    this.issues = issues;
  }
}

export function createObservation(
  input: unknown,
  options: CreateObservationOptions = {},
): Observation {
  const result = parseObservationInput(input, {
    ...(options.now !== undefined ? { now: options.now } : {}),
    ...(options.id !== undefined ? { id: options.id } : {}),
  });
  if (!result.ok) {
    throw new ObservationValidationError(result.issues);
  }
  return result.observation;
}

export function parseObservationInput(
  input: unknown,
  options: CreateObservationOptions = {},
): ObservationParseResult {
  const parsed = observationInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, issues: parsed.error.issues };
  }
  const now = options.now ?? new Date();
  const observation = buildObservation(parsed.data, now);
  return {
    ok: true,
    observation: options.id === undefined ? observation : { ...observation, id: options.id },
  };
}

function buildObservation(
  input: z.infer<typeof observationInputSchema>,
  now: Date,
): Observation {
  const brand = input.brand ?? null;
  const model = input.model ?? null;
  const age = input.age ?? null;
  const rawUse = input.use ?? null;
  const use =
    rawUse === null
      ? null
      : { hours: rawUse.hours, period: rawUse.period ?? null };
  return {
    id: randomId(),
    site: input.site,
    modality: input.modality,
    modalityProvenance: input.modalityProvenance,
    brand,
    brandProvenance: brand === null ? 'Unknown' : (input.brandProvenance ?? 'Reported'),
    model,
    modelProvenance: model === null ? 'Unknown' : (input.modelProvenance ?? 'Reported'),
    quantity: input.quantity,
    quantityProvenance: input.quantityProvenance,
    age,
    ageProvenance: age === null ? 'Unknown' : (input.ageProvenance ?? 'Estimated'),
    use,
    useProvenance: use === null ? null : (input.useProvenance ?? 'Reported'),
    comment: input.comment ?? null,
    fieldNote: input.fieldNote ?? null,
    collaborator: input.collaborator ?? null,
    visitDate: input.visitDate,
    createdAt: now.toISOString(),
  };
}

function randomId(): string {
  const time = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  return `obs-${time}-${random}`;
}