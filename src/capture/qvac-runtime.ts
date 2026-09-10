/**
 * QVAC model and local runtime seam (non-native fallback).
 *
 * The MVP runs QVAC on the on-device runtime exposed by `@qvac/sdk` on
 * Android and iOS (see `qvac-runtime.native.ts`). This module is the
 * non-native fallback used by Node, web, and unit tests; it does not load
 * any model and rejects every operation with a clear "not available here"
 * error.
 *
 * The shared `QvacRuntime` interface is the contract the smoke test and the
 * capture flow depend on. The native implementation in
 * `qvac-runtime.native.ts` is the only one that talks to a real QVAC
 * worker; this fallback is the only one that runs in Node and is what the
 * test suite exercises through the smoke orchestration.
 */

export const QVAC_REQUIRED_RUNTIME_NOTE =
  'QVAC model load is available on Android and iOS only.';

export interface QvacRuntime {
  /** Load the configured MVP model and return a handle the runtime can use for completion. */
  loadModel(): Promise<string>;
  /** Run a single non-streaming completion against the loaded model and return the final content text. */
  complete(modelId: string, prompt: string): Promise<string>;
  /** Unload a previously loaded model handle, regardless of completion success. */
  unloadModel(modelId: string): Promise<void>;
}

export class QvacRuntimeUnavailableError extends Error {
  constructor(message: string = QVAC_REQUIRED_RUNTIME_NOTE) {
    super(message);
    this.name = 'QvacRuntimeUnavailableError';
  }
}

export class NodeUnsupportedQvacRuntime implements QvacRuntime {
  async loadModel(): Promise<string> {
    throw new QvacRuntimeUnavailableError();
  }
  async complete(_modelId: string, _prompt: string): Promise<string> {
    throw new QvacRuntimeUnavailableError();
  }
  async unloadModel(_modelId: string): Promise<void> {
    throw new QvacRuntimeUnavailableError();
  }
}

export async function loadQvacModel(): Promise<string> {
  throw new QvacRuntimeUnavailableError();
}

export async function unloadQvacModel(_modelId: string): Promise<void> {
  // No-op on the non-native path: nothing was ever loaded. Kept for source
  // compatibility with earlier callers; the smoke test uses the
  // `QvacRuntime` interface directly and never reaches this fallback.
}
