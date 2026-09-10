/**
 * QVAC on-device runtime (Android and iOS only).
 *
 * Wires the `@qvac/sdk` worker to the `QvacRuntime` interface used by the
 * smoke test and the capture flow. The MVP uses the
 * `QWEN3_600M_INST_Q4` text-generation model and runs every inference
 * locally through the QVAC worker; no cloud inference endpoint is
 * referenced or reachable from this code path.
 *
 * The model constant and the worker binding are documented in
 * `docs/qvac/runtime-and-smoke.md`. The "no cloud inference path"
 * guarantee is enforced by `scripts/check-no-cloud-inference.mjs`.
 */
import {
  loadModel,
  unloadModel,
  completion,
  QWEN3_600M_INST_Q4,
} from '@qvac/sdk';
import type { QvacRuntime } from './qvac-runtime';

/** The MVP text-generation model loaded by the on-device QVAC worker. */
export const QVAC_MVP_MODEL = QWEN3_600M_INST_Q4;

export class NativeQvacRuntime implements QvacRuntime {
  async loadModel(): Promise<string> {
    return loadModel({ modelSrc: QVAC_MVP_MODEL });
  }

  async complete(modelId: string, prompt: string): Promise<string> {
    const run = completion({
      modelId,
      history: [{ role: 'user', content: prompt }],
      stream: false,
      responseFormat: { type: 'json_object' },
    });
    const result = await run.final;
    return result.contentText;
  }

  async unloadModel(modelId: string): Promise<void> {
    await unloadModel({ modelId });
  }
}
