import Buffer from 'bare-buffer';
import {
  loadModel,
  unloadModel,
  transcribe,
  PARAKEET_TDT_0_6B_V3_Q8_0,
} from '@qvac/sdk';

/**
 * Transcribe 16 kHz mono PCM entirely on-device with QVAC Parakeet TDT.
 * QVAC's transcription client uses the Bare-compatible Buffer type, so the
 * Int16 PCM view captured by Expo is copied into an exact byte-sized buffer
 * before crossing the worker boundary.
 */
export async function transcribeFieldAudio(audio: Int16Array): Promise<string> {
  const modelId = await loadModel({ modelSrc: PARAKEET_TDT_0_6B_V3_Q8_0 });
  const bytes = Buffer.from(
    audio.buffer.slice(audio.byteOffset, audio.byteOffset + audio.byteLength),
  );

  try {
    const text = await transcribe({ modelId, audioChunk: bytes });
    return text.trim();
  } finally {
    await unloadModel({ modelId });
  }
}
