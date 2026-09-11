import {
  loadModel,
  unloadModel,
  transcribe,
  PARAKEET_TDT_0_6B_V3_Q8_0,
} from '@qvac/sdk';

/**
 * Transcribe 16 kHz mono PCM entirely on-device with QVAC Parakeet TDT.
 * The model is loaded only for the dictation operation and unloaded afterwards
 * to keep the mobile memory footprint bounded.
 */
export async function transcribeFieldAudio(audio: Int16Array): Promise<string> {
  const modelId = await loadModel({
    modelSrc: PARAKEET_TDT_0_6B_V3_Q8_0,
    modelType: 'parakeet-transcription',
  });

  try {
    const text = await transcribe({ modelId, audioChunk: audio });
    return text.trim();
  } finally {
    await unloadModel({ modelId });
  }
}
