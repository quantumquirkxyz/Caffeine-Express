import {
  loadModel,
  unloadModel,
  transcribe,
  PARAKEET_TDT_0_6B_V3_Q8_0,
} from '@qvac/sdk';

/**
 * Transcribe 16 kHz mono PCM entirely on-device with QVAC Parakeet TDT.
 * The registry model constant carries the transcription-engine metadata, so
 * the SDK can select the compatible Parakeet plugin without a legacy variant
 * discriminator.
 */
export async function transcribeFieldAudio(audio: Int16Array): Promise<string> {
  const modelId = await loadModel({ modelSrc: PARAKEET_TDT_0_6B_V3_Q8_0 });

  try {
    const text = await transcribe({ modelId, audioChunk: audio });
    return text.trim();
  } finally {
    await unloadModel({ modelId });
  }
}
