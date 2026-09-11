import { QvacRuntimeUnavailableError } from './qvac-runtime';

export async function transcribeFieldAudio(_audio: Int16Array): Promise<string> {
  throw new QvacRuntimeUnavailableError(
    'QVAC voice transcription is available on a physical Android or iOS device.',
  );
}
