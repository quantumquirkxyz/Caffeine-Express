import { describe, expect, it } from 'vitest';
import {
  buildQvacSmokePrompt,
  QVAC_SMOKE_EXPECTED_SHAPE,
  QVAC_SMOKE_FIELD_NOTE,
  runQvacSmokeTest,
} from './qvac-smoke';
import {
  NodeUnsupportedQvacRuntime,
  QvacRuntimeUnavailableError,
  type QvacRuntime,
} from './qvac-runtime';

class FakeQvacRuntime implements QvacRuntime {
  public loadCalls = 0;
  public completeCalls = 0;
  public unloadCalls = 0;
  public lastPrompt = '';
  public lastModelId = '';
  public contentText: string | null = null;

  constructor(
    private readonly fail: { step?: 'load' | 'complete' | 'unload'; message: string } | null = null,
  ) {}

  async loadModel(): Promise<string> {
    this.loadCalls += 1;
    if (this.fail?.step === 'load') throw new Error(this.fail.message);
    return 'model-handle-1';
  }

  async complete(modelId: string, prompt: string): Promise<string> {
    this.completeCalls += 1;
    this.lastModelId = modelId;
    this.lastPrompt = prompt;
    if (this.fail?.step === 'complete') throw new Error(this.fail.message);
    if (this.contentText === null) {
      return JSON.stringify({
        observations: [
          {
            client: 'DemoCare',
            site: 'Pacific Hospital',
            modality: 'MRI',
            brand: 'NovaMed',
            model: 'N-1',
            quantity: 1,
          },
        ],
      });
    }
    return this.contentText;
  }

  async unloadModel(modelId: string): Promise<void> {
    this.unloadCalls += 1;
    this.lastModelId = modelId;
    if (this.fail?.step === 'unload') throw new Error(this.fail.message);
  }
}

describe('QVAC MVP smoke test orchestration', () => {
  it('loads, completes, and unloads the model on the happy path', async () => {
    const runtime = new FakeQvacRuntime();
    const result = await runQvacSmokeTest(runtime);

    expect(result.loaded).toBe(true);
    expect(result.modelId).toBe('model-handle-1');
    expect(result.completion).not.toBeNull();
    expect(result.completion?.isContractShape).toBe(true);
    expect(result.failure).toBeNull();
    expect(result.unloaded).toBe(true);
    expect(runtime.loadCalls).toBe(1);
    expect(runtime.completeCalls).toBe(1);
    expect(runtime.unloadCalls).toBe(1);
    expect(runtime.lastPrompt).toBe(buildQvacSmokePrompt(QVAC_SMOKE_FIELD_NOTE));
    expect(runtime.lastModelId).toBe('model-handle-1');
  });

  it('reports the prompt as a contract-shape instruction and never calls cloud endpoints', () => {
    const prompt = buildQvacSmokePrompt();
    expect(prompt).toContain('"observations"');
    expect(prompt).toContain(QVAC_SMOKE_FIELD_NOTE);
    expect(prompt).not.toMatch(/https?:\/\//);
    expect(prompt).not.toMatch(/openai|anthropic|claude|gpt-/i);
    expect(prompt).toContain(QVAC_SMOKE_EXPECTED_SHAPE);
  });

  it('still does not call complete or unload when loadModel throws', async () => {
    const runtime = new FakeQvacRuntime({ step: 'load', message: 'engine offline' });
    const result = await runQvacSmokeTest(runtime);

    expect(result.loaded).toBe(false);
    expect(result.modelId).toBeNull();
    expect(result.completion).toBeNull();
    expect(result.failure).toEqual({ message: 'engine offline' });
    expect(result.unloaded).toBe(false);
    expect(runtime.loadCalls).toBe(1);
    expect(runtime.completeCalls).toBe(0);
    expect(runtime.unloadCalls).toBe(0);
  });

  it('still unloads the model when complete throws', async () => {
    const runtime = new FakeQvacRuntime({ step: 'complete', message: 'completion crashed' });
    const result = await runQvacSmokeTest(runtime);

    expect(result.loaded).toBe(true);
    expect(result.modelId).toBe('model-handle-1');
    expect(result.completion).toBeNull();
    expect(result.failure).toEqual({ message: 'completion crashed' });
    expect(result.unloaded).toBe(true);
    expect(runtime.loadCalls).toBe(1);
    expect(runtime.completeCalls).toBe(1);
    expect(runtime.unloadCalls).toBe(1);
  });

  it('reports an unload failure and never leaves the model loaded silently', async () => {
    const runtime = new FakeQvacRuntime({ step: 'unload', message: 'worker crash' });
    const result = await runQvacSmokeTest(runtime);

    expect(result.loaded).toBe(true);
    expect(result.completion).not.toBeNull();
    expect(result.failure).toEqual({ message: 'unload failed: worker crash' });
    expect(result.unloaded).toBe(false);
    expect(runtime.unloadCalls).toBe(1);
  });

  it('flags completion output that does not look like the contract shape', async () => {
    const runtime = new FakeQvacRuntime();
    runtime.contentText = '{"data": []}';
    const result = await runQvacSmokeTest(runtime);

    expect(result.completion?.isContractShape).toBe(false);
    expect(result.failure).toBeNull();
    expect(result.unloaded).toBe(true);
  });

  it('flags malformed JSON completion output', async () => {
    const runtime = new FakeQvacRuntime();
    runtime.contentText = 'not json';
    const result = await runQvacSmokeTest(runtime);

    expect(result.completion?.isContractShape).toBe(false);
    expect(result.unloaded).toBe(true);
  });

  it('times the run using the injected clock', async () => {
    const runtime = new FakeQvacRuntime();
    let now = 1_000;
    const result = await runQvacSmokeTest(runtime, {
      now: () => {
        now += 50;
        return now;
      },
    });
    expect(result.durationMs).toBeGreaterThan(0);
  });
});

describe('QVAC non-native runtime fallback', () => {
  it('rejects every operation with a clear unavailable error', async () => {
    const runtime = new NodeUnsupportedQvacRuntime();
    await expect(runtime.loadModel()).rejects.toBeInstanceOf(QvacRuntimeUnavailableError);
    await expect(runtime.complete('id', 'prompt')).rejects.toBeInstanceOf(
      QvacRuntimeUnavailableError,
    );
    await expect(runtime.unloadModel('id')).rejects.toBeInstanceOf(QvacRuntimeUnavailableError);
  });

  it('does not provide a non-QVAC web inference fallback', async () => {
    const { loadQvacModel, unloadQvacModel } = await import('./qvac-runtime');
    await expect(loadQvacModel()).rejects.toBeInstanceOf(QvacRuntimeUnavailableError);
    await expect(unloadQvacModel('unavailable')).rejects.toBeInstanceOf(QvacRuntimeUnavailableError);
  });
});
