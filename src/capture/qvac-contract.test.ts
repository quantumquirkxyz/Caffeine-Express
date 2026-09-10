import { describe, expect, it } from 'vitest';
import {
  buildExtractionPrompt,
  extractObservationsFromContent,
  extractObservationsFromContentWithRetry,
  observationInputsFromModel,
  parseModelContent,
  type ModelObservationRow,
} from './qvac-contract';
import { ExtractionError } from './observation-capture';
import { createObservation, parseObservationInput } from '../validation/observation.schema';

const VALID_FIELD_NOTE =
  'Two MRI machines at Pacific Hospital, client DemoCare, brand NovaMed, model N-1, 1200 hours, comment planned replacement';

function completeRow(overrides: Partial<ModelObservationRow> = {}): ModelObservationRow {
  return {
    client: 'DemoCare',
    site: 'Pacific Hospital',
    city: 'Unknown',
    country: 'Unknown',
    modality: 'MRI',
    brand: 'NovaMed',
    model: 'N-1',
    quantity: 2,
    age: null,
    use: { hours: 1200 },
    comment: 'planned replacement',
    ...overrides,
  };
}

describe('QVAC MVP extraction contract', () => {
  it('builds a deterministic prompt that names the contract and rules', () => {
    const prompt = buildExtractionPrompt(VALID_FIELD_NOTE);
    expect(prompt).toContain('Field note: ' + VALID_FIELD_NOTE);
    expect(prompt).toContain('"observations"');
    expect(prompt).toContain('"client"');
    expect(prompt).toContain('"site"');
    expect(prompt).toContain('"modality"');
    expect(prompt).toContain('"age"');
    expect(prompt).toContain('"use"');
    expect(prompt).toContain('null when unknown');
    expect(prompt).toContain('Never invent');
    expect(prompt).toContain('Distinguish count from usage hours');
    expect(prompt).toContain('"quantity": 2');
    expect(prompt).toContain('"use": { "hours": 1200 }');
  });

  it('produces a complete schema-shaped ObservationInput for a complete Field note', () => {
    const row = completeRow();
    const [input] = observationInputsFromModel([row], { fieldNote: VALID_FIELD_NOTE });

    expect(input).toBeDefined();
    expect(input!.site).toEqual({
      client: { name: 'DemoCare' },
      name: 'Pacific Hospital',
      city: 'Unknown',
      country: 'Unknown',
    });
    expect(input!.modality).toBe('MRI');
    expect(input!.modalityProvenance).toBe('Reported');
    expect(input!.brand).toBe('NovaMed');
    expect(input!.brandProvenance).toBe('Reported');
    expect(input!.model).toBe('N-1');
    expect(input!.modelProvenance).toBe('Reported');
    expect(input!.quantity).toBe(2);
    expect(input!.quantityProvenance).toBe('Reported');
    expect(input!.age).toBeNull();
    expect(input!.ageProvenance).toBe('Unknown');
    expect(input!.use).toEqual({ hours: 1200, period: null });
    expect(input!.useProvenance).toBe('Reported');
    expect(input!.comment).toBe('planned replacement');
    expect(input!.fieldNote).toBe(VALID_FIELD_NOTE);
    expect(input!.visitDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('maps an incomplete Field note to Unknown Age and null Use without inventing values', () => {
    const row = completeRow({
      brand: null,
      model: null,
      age: null,
      use: null,
      comment: null,
    });
    const [input] = observationInputsFromModel([row], { fieldNote: 'MRI at Site, client Client' });

    expect(input).toBeDefined();
    expect(input!.brand).toBeNull();
    expect(input!.brandProvenance).toBe('Unknown');
    expect(input!.model).toBeNull();
    expect(input!.modelProvenance).toBe('Unknown');
    expect(input!.age).toBeNull();
    expect(input!.ageProvenance).toBe('Unknown');
    expect(input!.use).toBeNull();
    expect(input!.useProvenance).toBeNull();
    expect(input!.comment).toBeNull();
  });

  it('expands an approximate Age into an inclusive min/max envelope marked Estimated', () => {
    const row = completeRow({ age: { approx: 7 } });
    const [input] = observationInputsFromModel([row], { fieldNote: 'about 7 years old' });

    expect(input).toBeDefined();
    expect(input!.age).toEqual({ min: 6, max: 8 });
    expect(input!.ageProvenance).toBe('Estimated');
  });

  it('expands approximate Age zero into a non-negative envelope', () => {
    const row = completeRow({ age: { approx: 0 } });
    const [input] = observationInputsFromModel([row], { fieldNote: 'new' });
    expect(input!.age).toEqual({ min: 0, max: 1 });
    expect(input!.ageProvenance).toBe('Estimated');
  });

  it('passes an explicit Age range through with Reported provenance', () => {
    const row = completeRow({ age: { min: 4, max: 6 } });
    const [input] = observationInputsFromModel([row], { fieldNote: '4-6 years' });
    expect(input!.age).toEqual({ min: 4, max: 6 });
    expect(input!.ageProvenance).toBe('Reported');
  });

  it('passes an exact Age through as a degenerate range with Reported provenance', () => {
    const row = completeRow({ age: 7 });
    const [input] = observationInputsFromModel([row], { fieldNote: '7 years' });
    expect(input!.age).toEqual({ min: 7, max: 7 });
    expect(input!.ageProvenance).toBe('Reported');
  });

  it('records explicit Use hours with Reported provenance and period null', () => {
    const row = completeRow({ use: { hours: 1500.5 } });
    const [input] = observationInputsFromModel([row], { fieldNote: '1500.5 hours' });
    expect(input!.use).toEqual({ hours: 1500.5, period: null });
    expect(input!.useProvenance).toBe('Reported');
  });

  it('normalizes modality aliases through the schema and rejects unknown modalities', () => {
    const aliased = completeRow({ modality: 'MR' });
    const [input] = observationInputsFromModel([aliased], { fieldNote: 'MR at Site' });
    expect(input!.modality).toBe('MRI');

    const unknown = completeRow({ modality: 'flux-capacitor' });
    expect(() => observationInputsFromModel([unknown], { fieldNote: 'x' })).toThrow(
      ExtractionError,
    );
  });

  it('emits multiple Observations for one Field note when the model returns multiple rows', () => {
    const rows = [
      completeRow({ modality: 'MRI', quantity: 1, brand: 'NovaMed', model: 'N-1' }),
      completeRow({ modality: 'CT', quantity: 1, brand: 'NovaMed', model: 'C-9' }),
    ];
    const inputs = observationInputsFromModel(rows, { fieldNote: 'two devices' });
    expect(inputs).toHaveLength(2);
    expect(inputs[0]!.modality).toBe('MRI');
    expect(inputs[1]!.modality).toBe('CT');
  });

  it('rejects malformed model JSON with a clear ExtractionError', () => {
    expect(() => extractObservationsFromContent('not json', { fieldNote: 'x' })).toThrow(
      ExtractionError,
    );
  });

  it('rejects a model response that omits the observations array', () => {
    expect(() =>
      extractObservationsFromContent('{"data":[{"client":"a","site":"b","modality":"MRI","quantity":1}]}', {
        fieldNote: 'x',
      }),
    ).toThrow(ExtractionError);
  });

  it('rejects an empty observations array as a contract violation', () => {
    expect(() => extractObservationsFromContent('{"observations":[]}', { fieldNote: 'x' })).toThrow(
      ExtractionError,
    );
  });

  it('rejects a row that violates the schema (e.g. reversed Age range) as malformed output', () => {
    const bad = JSON.stringify({
      observations: [
        {
          client: 'DemoCare',
          site: 'Pacific Hospital',
          modality: 'MRI',
          quantity: 1,
          age: { min: 9, max: 4 },
        },
      ],
    });
    expect(() => extractObservationsFromContent(bad, { fieldNote: 'x' })).toThrow(ExtractionError);
  });

  it('records a row without client or site as Unknown instead of rejecting it', () => {
    const [input] = observationInputsFromModel([{ modality: 'MRI', quantity: 1 }], {
      fieldNote: 'MRI at the site',
    });

    expect(input).toBeDefined();
    expect(input!.site).toEqual({
      client: { name: 'Unknown' },
      name: 'Unknown',
      city: 'Unknown',
      country: 'Unknown',
    });
  });

  it('rejects a row missing the required modality as malformed output', () => {
    const bad = JSON.stringify({
      observations: [{ client: 'DemoCare', site: 'Pacific Hospital', quantity: 1 }],
    });
    expect(() => extractObservationsFromContent(bad, { fieldNote: 'x' })).toThrow(ExtractionError);
  });

  it('rejects a row with a non-positive quantity as malformed output', () => {
    const bad = JSON.stringify({
      observations: [
        { client: 'a', site: 'b', modality: 'MRI', quantity: 0 },
      ],
    });
    expect(() => extractObservationsFromContent(bad, { fieldNote: 'x' })).toThrow(ExtractionError);
  });

  it('rejects a row with negative use hours as malformed output', () => {
    const bad = JSON.stringify({
      observations: [
        {
          client: 'a',
          site: 'b',
          modality: 'MRI',
          quantity: 1,
          use: { hours: -1 },
        },
      ],
    });
    expect(() => extractObservationsFromContent(bad, { fieldNote: 'x' })).toThrow(ExtractionError);
  });

  it('produces inputs that validate as full Observations through the Zod schema', () => {
    const row = completeRow();
    const [input] = observationInputsFromModel([row], { fieldNote: VALID_FIELD_NOTE });
    const parsed = parseObservationInput(input!);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      const observation = createObservation(input!);
      expect(observation.age).toBeNull();
      expect(observation.ageProvenance).toBe('Unknown');
      expect(observation.use).toEqual({ hours: 1200, period: null });
      expect(observation.useProvenance).toBe('Reported');
    }
  });

  it('parseModelContent rejects rows with extra unknown keys (strict contract)', () => {
    const strict = JSON.stringify({
      observations: [
        {
          client: 'a',
          site: 'b',
          modality: 'MRI',
          quantity: 1,
          invented: 'value',
        },
      ],
    });
    expect(() => parseModelContent(strict)).toThrow(ExtractionError);
  });
});

describe('extractObservationsFromContentWithRetry', () => {
  it('returns the compliant completion on the first attempt', async () => {
    const ok = JSON.stringify({ observations: [completeRow()] });
    const attempts: number[] = [];
    const inputs = await extractObservationsFromContentWithRetry(
      async (attempt) => {
        attempts.push(attempt);
        return ok;
      },
      { fieldNote: VALID_FIELD_NOTE },
    );
    expect(inputs).toHaveLength(1);
    expect(inputs[0]!.quantity).toBe(2);
    expect(attempts).toEqual([1]);
  });

  it('re-samples a contract-violating completion and returns the first compliant one', async () => {
    const bad = JSON.stringify({ observations: [{ modality: 'MRI', quantity: 0 }] });
    const ok = JSON.stringify({ observations: [completeRow()] });
    const attempts: number[] = [];
    const inputs = await extractObservationsFromContentWithRetry(
      async (attempt) => {
        attempts.push(attempt);
        return attempt === 1 ? bad : ok;
      },
      { fieldNote: VALID_FIELD_NOTE },
    );
    expect(inputs).toHaveLength(1);
    expect(inputs[0]!.quantity).toBe(2);
    expect(attempts).toEqual([1, 2]);
  });

  it('re-samples a string "null" Age completion and returns the compliant one', async () => {
    const bad = JSON.stringify({
      observations: [
        { client: 'a', site: 'b', modality: 'MRI', quantity: 1, age: 'null' },
      ],
    });
    const ok = JSON.stringify({ observations: [completeRow()] });
    const inputs = await extractObservationsFromContentWithRetry(
      async (attempt) => (attempt === 1 ? bad : ok),
      { fieldNote: VALID_FIELD_NOTE },
    );
    expect(inputs).toHaveLength(1);
    expect(inputs[0]!.age).toBeNull();
  });

  it('throws ExtractionError naming the attempt count after exhausting every completion', async () => {
    let attempts = 0;
    await expect(
      extractObservationsFromContentWithRetry(
        async () => {
          attempts += 1;
          return 'not json';
        },
        { fieldNote: 'x', maxAttempts: 2 },
      ),
    ).rejects.toThrow(ExtractionError);
    await expect(
      extractObservationsFromContentWithRetry(
        async () => 'not json',
        { fieldNote: 'x', maxAttempts: 2 },
      ),
    ).rejects.toThrow(/failed after 2 attempt\(s\)/);
    expect(attempts).toBe(2);
  });

  it('propagates a completion-side runtime error only after retrying', async () => {
    let attempts = 0;
    await expect(
      extractObservationsFromContentWithRetry(
        async () => {
          attempts += 1;
          throw new Error('worker crashed');
        },
        { fieldNote: 'x', maxAttempts: 3 },
      ),
    ).rejects.toThrow('worker crashed');
    expect(attempts).toBe(3);
  });
});
