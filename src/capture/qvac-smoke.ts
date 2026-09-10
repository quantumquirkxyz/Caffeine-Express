/**
 * QVAC MVP smoke test orchestration: load -> complete -> unload, with
 * unload guaranteed even when load or complete fails. Pure (depends only
 * on `QvacRuntime`); exercised by `qvac-smoke.test.ts` against a fake
 * runtime and by the native device runner through `qvac-smoke.native.ts`.
 */
import type { QvacRuntime } from './qvac-runtime';

export const QVAC_SMOKE_FIELD_NOTE =
  'One MRI machine at Pacific Hospital, client DemoCare, brand NovaMed, model N-1.';

export const QVAC_SMOKE_EXPECTED_SHAPE = 'object with an "observations" array';

export function buildQvacSmokePrompt(fieldNote: string = QVAC_SMOKE_FIELD_NOTE): string {
  return [
    'You are the QVAC on-device smoke test. Return a single JSON object with the',
    'exact shape: an object with an "observations" array.',
    '',
    'Each row must include client, site, modality, brand, model, and quantity.',
    'Do not invent values; if a field is not in the Field note, return null or omit it.',
    '',
    `Field note: ${fieldNote.trim()}`,
  ].join('\n');
}

export interface QvacSmokeCompletion {
  readonly contentText: string;
  readonly isContractShape: boolean;
}

export interface QvacSmokeResult {
  readonly loaded: boolean;
  readonly modelId: string | null;
  readonly completion: QvacSmokeCompletion | null;
  readonly failure: { readonly message: string } | null;
  readonly unloaded: boolean;
  readonly durationMs: number;
}

export interface QvacSmokeOptions {
  readonly fieldNote?: string;
  readonly now?: () => number;
}

/**
 * Run the MVP smoke test against the provided runtime.
 *
 * Guarantees the model is unloaded exactly once, even when `loadModel` or
 * `complete` throws. The returned `result` records every step so the
 * caller (a device shell, a CI script, or a PR comment) can report
 * pass/fail deterministically.
 */
export async function runQvacSmokeTest(
  runtime: QvacRuntime,
  options: QvacSmokeOptions = {},
): Promise<QvacSmokeResult> {
  const start = options.now?.() ?? Date.now();
  const prompt = buildQvacSmokePrompt(options.fieldNote);
  let modelId: string | null = null;
  let completion: QvacSmokeCompletion | null = null;
  let failure: { message: string } | null = null;
  let unloaded = false;

  try {
    modelId = await runtime.loadModel();
  } catch (error) {
    failure = { message: errorToMessage(error) };
  }

  if (failure === null && modelId !== null) {
    try {
      const contentText = await runtime.complete(modelId, prompt);
      completion = { contentText, isContractShape: looksLikeContractShape(contentText) };
    } catch (error) {
      failure = { message: errorToMessage(error) };
    }
  }

  if (modelId !== null) {
    try {
      await runtime.unloadModel(modelId);
      unloaded = true;
    } catch (error) {
      if (failure === null) {
        failure = { message: `unload failed: ${errorToMessage(error)}` };
      } else {
        failure = {
          message: `${failure.message}; unload also failed: ${errorToMessage(error)}`,
        };
      }
    }
  }

  const end = options.now?.() ?? Date.now();
  return {
    loaded: modelId !== null,
    modelId,
    completion,
    failure,
    unloaded,
    durationMs: end - start,
  };
}

function errorToMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function looksLikeContractShape(contentText: string): boolean {
  let parsed: unknown;
  try {
    parsed = JSON.parse(contentText);
  } catch {
    return false;
  }
  if (typeof parsed !== 'object' || parsed === null) return false;
  const observations = (parsed as { readonly observations?: unknown }).observations;
  return Array.isArray(observations);
}
