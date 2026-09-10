/**
 * QVAC MVP typed extraction contract.
 *
 * Defines the JSON shape the QVAC on-device text-generation model must emit
 * for the MVP capture flow, the deterministic mapping from that shape to the
 * typed `ObservationInput[]` consumed by the capture pipeline, and the prompt
 * that instructs the model to follow the contract.
 *
 * The contract is the single source of truth shared by:
 *   - the on-device QVAC prompt (native extractor),
 *   - the deterministic parser used by the capture flow, and
 *   - the contract tests and the documented English examples.
 *
 * Rules (enforced deterministically by `observationInputsFromModel`):
 *   - Output is always `{ "observations": [ ... ] }` with one or more rows.
 *   - Each row carries Client, Site, Modality, brand, model, quantity, Age,
 *     Use, and Comment when present.
 *   - Modality is a string; the Zod schema normalizes aliases to the canonical
 *     term and rejects unrecognized modalities without inventing a value.
 *   - Age is `null` when unknown (never invented). Numbers are exact years,
 *     `{ "min", "max" }` is an explicit range, `{ "approx": n }` becomes
 *     `{ min: max(floor(n)-1, 0), max: ceil(n)+1 }` and is marked `Estimated`.
 *   - Use is `null` when unknown; `{ "hours": n }` is recorded with period
 *     `null` until a future Visit is attached.
 *   - Missing or unparseable rows raise `ExtractionError`; the model output is
 *     never silently coerced into something the schema rejects.
 */
import { z } from 'zod';
import type { AgeRange } from '../domain/age';
import { exactAgeYears, approximateAgeYears } from '../domain/age';
import { normalizeModality } from '../domain/modality';
import {
  createObservation,
  parseObservationInput,
  type ObservationInput,
  type CreateObservationOptions,
} from '../validation/observation.schema';
import { ExtractionError } from './observation-capture';

/**
 * Shape the QVAC text-generation model must emit for a single Field note.
 *
 * Fields are documented in `docs/qvac/extraction-contract.md`. The model
 * returns a JSON object with an `observations` array; each element follows
 * `modelObservationRowSchema`.
 */
const modelObservationRowSchema = z
  .object({
    client: z.string().trim().min(1, 'Client name is required'),
    site: z.string().trim().min(1, 'Site name is required'),
    city: z.string().trim().min(1).optional(),
    country: z.string().trim().min(1).optional(),
    modality: z.string().trim().min(1, 'Modality is required'),
    brand: z
      .string()
      .trim()
      .min(1, 'Brand cannot be empty when present')
      .nullable()
      .optional(),
    model: z
      .string()
      .trim()
      .min(1, 'Model cannot be empty when present')
      .nullable()
      .optional(),
    quantity: z
      .number({ invalid_type_error: 'Quantity must be a number' })
      .int('Quantity must be a whole number')
      .positive('Quantity must be a positive count'),
    age: z
      .union([
        z
          .number()
          .finite('Age must be a finite number')
          .min(0, 'Age must be non-negative'),
        z
          .object({
            min: z
              .number()
              .finite('Age min must be a finite number')
              .min(0, 'Age min must be non-negative'),
            max: z
              .number()
              .finite('Age max must be a finite number')
              .min(0, 'Age max must be non-negative'),
          })
          .refine((range) => range.min <= range.max, {
            message: 'Age range is reversed: min must be <= max',
          }),
        z
          .object({
            approx: z
              .number()
              .finite('Approximate age must be a finite number')
              .min(0, 'Approximate age must be non-negative'),
          }),
        z.null(),
      ])
      .optional(),
    use: z
      .union([
        z
          .object({
            hours: z
              .number()
              .finite('Use hours must be a finite number')
              .min(0, 'Use hours must be non-negative'),
          }),
        z.null(),
      ])
      .optional(),
    comment: z
      .string()
      .trim()
      .min(1, 'Comment cannot be empty when present')
      .nullable()
      .optional(),
  })
  .strict();

const modelOutputSchema = z
  .object({
    observations: z.array(modelObservationRowSchema).min(1, 'At least one observation is required'),
  })
  .strict();

/** Raw shape the model emits for a single observation row. */
export type ModelObservationRow = z.infer<typeof modelObservationRowSchema>;

/** Raw shape the model emits for one Field note. */
export interface ModelObservationOutput {
  readonly observations: readonly ModelObservationRow[];
}

/**
 * Prompt the on-device QVAC text-generation model receives for a Field note.
 *
 * The prompt is the contract: it tells the model exactly which JSON shape to
 * return and which rules to follow (no invented modalities, `age: null` when
 * unknown, deterministic rules for approximate vs exact Age, `use: null` when
 * no hours are present).
 *
 * The prompt is a single string to keep the test surface deterministic; the
 * capture flow prepends no additional instructions.
 */
export function buildExtractionPrompt(fieldNote: string): string {
  const trimmed = fieldNote.trim();
  return [
    'You are the on-device extraction model for the FieldSight MVP capture flow.',
    'Extract one or more equipment observations from the Field note below.',
    '',
    'Return a single JSON object with the exact shape:',
    '{ "observations": [ { ...row... }, ... ] }',
    '',
    'Each row MUST contain:',
    '- "client": string, the Client (organization) name as stated in the note.',
    '- "site": string, the Site name as stated in the note.',
    '- "city": string or omit (defaults to "Unknown" downstream).',
    '- "country": string or omit (defaults to "Unknown" downstream).',
    '- "modality": string. Use the canonical term when you can: MRI, CT,',
    '  Ultrasound, X-Ray, Patient Monitoring, Image Guided Therapy, Other.',
    '  Aliases such as MR, scanner, US, xray, monitoring, IGT are accepted',
    '  and resolved downstream; an unrecognized modality is rejected.',
    '- "brand": string or null. Null when the note does not name a brand.',
    '- "model": string or null. Null when the note does not name a model.',
    '- "quantity": positive integer. Default to 1 when the note describes a',
    '  single device and gives no count.',
    '- "age": null | number | { "min": number, "max": number } | { "approx": number }.',
    '  - Use null when unknown (the note gives no Age or the Age is unknowable).',
    '  - Use a bare number for an exact year count (e.g. 7 means 7 years).',
    '  - Use { "approx": n } for an approximate year count (e.g. "about 7 years").',
    '  - Use { "min": a, "max": b } for an explicit range. min must be <= max.',
    '  Never invent an Age; if the note does not provide one, return null.',
    '- "use": null | { "hours": number }. Use null when unknown (the note gives no',
    '  operating hours). hours must be a non-negative number.',
    '- "comment": string or null. Preserve the collaborator comment verbatim',
    '  when present; null when absent.',
    '',
    'Do not invent values for any field. If a value is missing, return null',
    'or omit the field as documented above. The output is parsed deterministically',
    'and rejected on any deviation, so follow this contract exactly.',
    '',
    `Field note: ${trimmed}`,
  ].join('\n');
}

/**
 * Parse the raw JSON content text returned by the QVAC completion into the
 * array of raw observation rows the contract expects.
 *
 * Throws `ExtractionError` when the content is not valid JSON or does not
 * contain an `observations` array. Validation of each row is deferred to
 * `observationInputsFromModel`, which produces schema-shaped `ObservationInput`s
 * with provenance defaults.
 */
export function parseModelContent(contentText: string): readonly ModelObservationRow[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(contentText);
  } catch {
    throw new ExtractionError('QVAC returned malformed JSON.');
  }
  const rows = (parsed as { readonly observations?: unknown }).observations;
  if (!Array.isArray(rows)) {
    throw new ExtractionError('QVAC returned no observations array.');
  }
  const result = modelOutputSchema.safeParse({ observations: rows });
  if (!result.success) {
    throw new ExtractionError(
      `QVAC output failed the extraction contract: ${result.error.issues
        .map((issue) => issue.message)
        .join('; ')}`,
    );
  }
  return result.data.observations;
}

function toIsoDate(now: Date): string {
  return now.toISOString().slice(0, 10);
}

function toAgeRange(age: ModelObservationRow['age']): {
  readonly range: AgeRange | null;
  readonly provenance: 'Reported' | 'Estimated' | 'Unknown';
} {
  if (age === undefined || age === null) {
    return { range: null, provenance: 'Unknown' };
  }
  if (typeof age === 'number') {
    return { range: exactAgeYears(age), provenance: 'Reported' };
  }
  if ('approx' in age) {
    return { range: approximateAgeYears(age.approx), provenance: 'Estimated' };
  }
  // Explicit { min, max } range; the Zod schema already enforces min <= max and
  // non-negative values, so this is a straight pass-through with provenance.
  return { range: { min: age.min, max: age.max }, provenance: 'Reported' };
}

function toUseValue(
  use: ModelObservationRow['use'],
): {
  readonly use: { readonly hours: number; readonly period: null } | null;
  readonly provenance: 'Reported' | null;
} {
  if (use === undefined || use === null) {
    return { use: null, provenance: null };
  }
  return { use: { hours: use.hours, period: null }, provenance: 'Reported' };
}

export interface ObservationInputMappingOptions {
  readonly fieldNote: string;
  readonly now?: Date;
}

/**
 * Deterministically map the model's raw observation rows to
 * `ObservationInput[]` with full provenance defaults.
 *
 * - Age `null` in the model output becomes `age: null` and
 *   `ageProvenance: 'Unknown'` — the model never invents Age.
 * - Approximate Age becomes the inclusive `min/max` envelope with
 *   `ageProvenance: 'Estimated'`.
 * - Brand/model are trimmed strings or `null`; provenance is `Reported` when
 *   present and `Unknown` when absent.
 * - Use `{ hours }` becomes `{ hours, period: null }` with
 *   `useProvenance: 'Reported'`. `null` Use leaves `useProvenance: null`.
 * - Each mapped input is run through the Zod `parseObservationInput` schema
 *   to guarantee schema-shaped output; any schema rejection (e.g. unknown
 *   modality alias, negative quantity, reversed Age range) raises
 *   `ExtractionError` with the underlying issues.
 */
export function observationInputsFromModel(
  rows: readonly ModelObservationRow[],
  options: ObservationInputMappingOptions,
): readonly ObservationInput[] {
  const fieldNote = options.fieldNote.trim();
  const visitDate = toIsoDate(options.now ?? new Date());
  return rows.map((row, index) => {
    const age = toAgeRange(row.age);
    const use = toUseValue(row.use);
    const modality = normalizeModality(row.modality);
    if (modality === null) {
      throw new ExtractionError(
        `QVAC output row ${index + 1} uses an unrecognized modality: ${row.modality}`,
      );
    }
    const input: ObservationInput = {
      site: {
        client: { name: row.client },
        name: row.site,
        city: row.city ?? 'Unknown',
        country: row.country ?? 'Unknown',
      },
      modality,
      modalityProvenance: 'Reported',
      brand: row.brand ?? null,
      brandProvenance: row.brand ? 'Reported' : 'Unknown',
      model: row.model ?? null,
      modelProvenance: row.model ? 'Reported' : 'Unknown',
      quantity: row.quantity,
      quantityProvenance: 'Reported',
      age: age.range,
      ageProvenance: age.provenance,
      use: use.use,
      useProvenance: use.provenance,
      comment: row.comment ?? null,
      fieldNote: fieldNote === '' ? null : fieldNote,
      collaborator: null,
      visitDate,
    };
    const parseOptions: CreateObservationOptions =
      options.now === undefined ? {} : { now: options.now };
    const result = parseObservationInput(input, parseOptions);
    if (!result.ok) {
      throw new ExtractionError(
        `QVAC output row ${index + 1} failed schema validation: ${result.issues
          .map((issue) => issue.message)
          .join('; ')}`,
      );
    }
    return input;
  });
}

/**
 * End-to-end: parse QVAC completion content text and map it to
 * schema-shaped `ObservationInput[]`.
 *
 * Throws `ExtractionError` on malformed JSON, missing `observations` array,
 * a row that violates the extraction contract, or a row that fails the
 * Zod observation schema. Never returns an empty array; an empty
 * `observations` array in the model output is a contract violation and
 * surfaces as `ExtractionError("...returned no observations...")`.
 */
export function extractObservationsFromContent(
  contentText: string,
  options: ObservationInputMappingOptions,
): readonly ObservationInput[] {
  const rows = parseModelContent(contentText);
  if (rows.length === 0) {
    throw new ExtractionError('QVAC returned no Observations.');
  }
  return observationInputsFromModel(rows, options);
}

/**
 * Validate a parsed `ObservationInput` end-to-end by building the
 * `Observation`. Useful for tests and the capture flow's downstream
 * validation step.
 */
export function buildObservationFromInput(
  input: ObservationInput,
  options: CreateObservationOptions = {},
): ReturnType<typeof createObservation> {
  return createObservation(input, options);
}
