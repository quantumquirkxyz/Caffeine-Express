/**
 * QVAC host smoke: load the MVP model on the Node runtime, run the typed
 * extraction prompt, and unload. Proves the built-in model runs locally
 * with no cloud inference path.
 *
 * Usage: node scripts/qvac-host-smoke.mjs
 */
import { loadModel, unloadModel, completion, LLAMA_3_2_1B_INST_Q4_0 } from '@qvac/sdk';

const FIELD_NOTE =
  'Two MRI machines at Pacific Hospital, client DemoCare, brand NovaMed, model N-1, 1200 hours, comment planned replacement';

const PROMPT = [
  'You are the on-device extraction model for the FieldSight MVP capture flow.',
  'Extract one or more equipment observations from the Field note below.',
  '',
  'Return a single JSON object with the exact shape:',
  '{ "observations": [ { ...row... }, ... ] }',
  '',
  'Each row MUST contain: client, site, modality, brand, model, quantity,',
  'age (null when unknown, never invented), use (null or { "hours": n }),',
  'and comment. Do not invent values for any field.',
  '',
  `Field note: ${FIELD_NOTE}`,
].join('\n');

console.log('[qvac-host-smoke] loading', LLAMA_3_2_1B_INST_Q4_0.name, '...');
const modelId = await loadModel({ modelSrc: LLAMA_3_2_1B_INST_Q4_0 });
console.log('[qvac-host-smoke] loaded:', modelId);

const run = completion({
  modelId,
  history: [{ role: 'user', content: PROMPT }],
  stream: false,
  responseFormat: { type: 'json_object' },
});
const result = await run.final;
console.log('[qvac-host-smoke] completion output:');
console.log(result.contentText);

await unloadModel({ modelId });
console.log('[qvac-host-smoke] unloaded cleanly');
