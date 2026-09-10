/**
 * QVAC host smoke: load the MVP model on the Node runtime, run the typed
 * extraction prompt, validate every completion against the extraction
 * contract (and the expected semantics of the fixed Field note), retry up
 * to 3 attempts, and unload. Exits non-zero when no attempt is both
 * contract-compliant and semantically correct.
 *
 * Proves the built-in model runs locally with no cloud inference path and
 * that the app's strict contract gates the capture flow.
 *
 * Usage: node scripts/qvac-host-smoke.mjs
 *
 * Keep the PROMPT below byte-identical to `buildExtractionPrompt` in
 * `src/capture/qvac-contract.ts` for the fixed Field note below; the
 * contract module is the single source of truth for the prompt text.
 */
import { loadModel, unloadModel, completion, LLAMA_3_2_1B_INST_Q4_0 } from '@qvac/sdk';

const FIELD_NOTE =
  'Two MRI machines at Pacific Hospital, client DemoCare, brand NovaMed, model N-1, 1200 hours, comment planned replacement';

const EXPECTED = {
  client: 'DemoCare',
  site: 'Pacific Hospital',
  modality: 'MRI',
  brand: 'NovaMed',
  model: 'N-1',
  quantity: 2,
  useHours: 1200,
};

const PROMPT = [
  'You are the on-device extraction model for the FieldSight MVP capture flow.',
  'Extract one or more equipment observations from the Field note below.',
  '',
  'Return a single JSON object with the exact shape:',
  '{ "observations": [ { ...row... }, ... ] }',
  '',
  'Each row MUST contain:',
  '- "client": string or null. The Client (organization) name as stated in',
  '  the note; null when the note does not state one (recorded as Unknown).',
  '- "site": string or null. The Site (location) name as stated in the note;',
  '  null when the note does not state one (recorded as Unknown).',
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
  'Distinguish count from usage hours: "quantity" is the NUMBER of named',
  'devices ("two MRI machines" -> quantity: 2). Operating hours ("1200',
  'hours") belong to "use" as use: { "hours": 1200 }. Never write hours',
  'into quantity, and never write the device count into use.',
  '',
  'Worked example for the Field note "Two MRI machines at Pacific Hospital,',
  'client DemoCare, brand NovaMed, model N-1, 1200 hours, comment planned',
  'replacement":',
  '{ "observations": [ { "client": "DemoCare", "site": "Pacific Hospital",',
  '  "city": "Unknown", "country": "Unknown", "modality": "MRI",',
  '  "brand": "NovaMed", "model": "N-1", "quantity": 2, "age": null,',
  '  "use": { "hours": 1200 }, "comment": "planned replacement" } ] }',
  '',
  `Field note: ${FIELD_NOTE}`,
].join('\n');

/** Minimal strict-contract check mirroring src/capture/qvac-contract.ts row schema. */
function validateRow(row) {
  if (row === null || typeof row !== 'object' || Array.isArray(row)) {
    return 'row is not an object';
  }
  const keys = new Set(Object.keys(row));
  const allowed = new Set([
    'client', 'site', 'city', 'country', 'modality', 'brand', 'model',
    'quantity', 'age', 'use', 'comment',
  ]);
  for (const key of keys) if (!allowed.has(key)) return `unknown key "${key}"`;
  if (typeof row.modality !== 'string' || row.modality.trim().length < 1) return 'modality missing';
  if (
    !Number.isInteger(row.quantity) ||
    row.quantity < 1
  ) return 'quantity must be a positive integer';
  if (row.client !== undefined && row.client !== null && typeof row.client !== 'string') return 'client wrong type';
  if (row.site !== undefined && row.site !== null && typeof row.site !== 'string') return 'site wrong type';
  if (row.brand !== undefined && row.brand !== null && typeof row.brand !== 'string') return 'brand wrong type';
  if (row.model !== undefined && row.model !== null && typeof row.model !== 'string') return 'model wrong type';
  if (row.comment !== undefined && row.comment !== null && typeof row.comment !== 'string') return 'comment wrong type';
  if (row.age !== null && row.age !== undefined) {
    if (typeof row.age === 'number') {
      if (!Number.isFinite(row.age) || row.age < 0) return 'age must be non-negative';
    } else if (typeof row.age === 'object') {
      const wrap = (v) => (!Number.isFinite(v) || v < 0 ? 'age range values must be non-negative' : null);
      if ('approx' in row.age) {
        if (wrap(row.age.approx)) return 'age range values must be non-negative';
      } else if ('min' in row.age || 'max' in row.age) {
        if (wrap(row.age.min) || wrap(row.age.max) || row.age.min > row.age.max) return 'invalid age range';
      } else return 'invalid age object';
    } else return 'age wrong type';
  }
  if (row.use !== null && row.use !== undefined) {
    if (row.use === null || typeof row.use !== 'object') return 'use wrong type';
    if (!Number.isFinite(row.use.hours) || row.use.hours < 0) return 'use hours must be non-negative';
  }
  return null;
}

function grade(contentText) {
  const raw = contentText ?? '';
  let obj;
  try {
    obj = JSON.parse(raw);
  } catch {
    return { ok: false, rejected: true, why: 'malformed JSON (contract rejects)' };
  }
  const rows = obj && Array.isArray(obj.observations) ? obj.observations : null;
  if (!rows || rows.length < 1) {
    return { ok: false, rejected: true, why: 'no observations array (contract rejects)' };
  }
  for (let i = 0; i < rows.length; i += 1) {
    const issue = validateRow(rows[i]);
    if (issue) {
      return { ok: false, rejected: true, why: `row ${i + 1} ${issue} (contract rejects)` };
    }
  }
  const row = rows[0];
  const warnings = [];
  if (row.quantity !== EXPECTED.quantity) warnings.push(`quantity ${row.quantity} != expected ${EXPECTED.quantity}`);
  const hours = row.use === null || row.use === undefined ? null : row.use.hours;
  if (hours !== EXPECTED.useHours) warnings.push(`use.hours ${hours} != expected ${EXPECTED.useHours}`);
  if (row.age !== null && row.age !== undefined) warnings.push(`age should be null (no Age stated)`);
  if (row.client !== EXPECTED.client) warnings.push(`client ${row.client}`);
  if (row.site !== EXPECTED.site) warnings.push(`site ${row.site}`);
  if (row.modality !== EXPECTED.modality) warnings.push(`modality ${row.modality}`);
  if (row.brand !== EXPECTED.brand) warnings.push(`brand ${row.brand}`);
  if (row.model !== EXPECTED.model) warnings.push(`model ${row.model}`);
  if (warnings.length > 0) {
    return { ok: false, rejected: false, why: 'contract-valid but wrong semantics: ' + warnings.join('; ') };
  }
  return { ok: true, rejected: false, why: 'contract-compliant and semantically correct' };
}

console.log('[qvac-host-smoke] loading', LLAMA_3_2_1B_INST_Q4_0.name, '...');
const modelId = await loadModel({ modelSrc: LLAMA_3_2_1B_INST_Q4_0 });
console.log('[qvac-host-smoke] loaded:', modelId);

const MAX_ATTEMPTS = 3;
let verdict = null;
for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
  const result = await completion({
    modelId,
    history: [{ role: 'user', content: PROMPT }],
    stream: false,
    responseFormat: { type: 'json_object' },
  }).final;
  verdict = grade(result.contentText);
  console.log(`[qvac-host-smoke] attempt ${attempt}/${MAX_ATTEMPTS}: ${verdict.why}`);
  if (verdict.ok) break;
}

await unloadModel({ modelId });
console.log('[qvac-host-smoke] unloaded cleanly');
if (verdict && verdict.ok) {
  console.log('[qvac-host-smoke] PASS: model runs locally and the extraction contract gates the output.');
  process.exit(0);
} else {
  console.error('[qvac-host-smoke] FAIL: no attempt was contract-compliant and semantically correct -> ' + (verdict ? verdict.why : 'no attempt made'));
  process.exit(1);
}