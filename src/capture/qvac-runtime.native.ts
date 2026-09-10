import { loadModel, QWEN3_600M_INST_Q4, unloadModel } from '@qvac/sdk';

export function loadQvacModel(): Promise<string> {
  return loadModel({ modelSrc: QWEN3_600M_INST_Q4 });
}

export function unloadQvacModel(modelId: string): Promise<void> {
  return unloadModel({ modelId });
}
